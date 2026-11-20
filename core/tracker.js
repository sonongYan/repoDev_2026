const { analyze } = require('../utils/detect');
const { globalRegistry } = require('../adapters');
const { defaultLogger } = require('../utils/logger');
const { QUERY_TYPE_LABELS, QUERY_TYPES } = require('./types');
const { bingFallback, shouldBingFallback } = require('../utils/fallback');
const { withRetry } = require('../utils/retry');

const logger = defaultLogger.child('tracker');

class Tracker {
  constructor(registry = globalRegistry) {
    this.registry = registry;
  }

  analyze(query, hints = {}) {
    return analyze(query, hints);
  }

  async track(query, hints = {}, options = {}) {
    // 名单批量：query 为名称数组时保留原数组直传适配器（analyze 会 String 化数组，
    // 不能用于批量），日志/元信息使用拼接串
    const batchNames =
      options.batch && hints.queryType === QUERY_TYPES.ROSTER && Array.isArray(query) ? query : null;
    const analysis = this.analyze(batchNames ? batchNames.join(' | ') : query, hints);
    const { queryType, carrier } = analysis;

    if (!queryType) {
      return {
        success: false,
        error: `无法识别查询类型，请在 hints 中指定 queryType；query=${analysis.query}`,
        analysis,
        supportedList: this.registry.listSupported(),
      };
    }

    // 空运单门控：仅支持 IATA mod-7 校验通过的主单；分单/无法验证不执行查询
    if (queryType === QUERY_TYPES.AIR_WAYBILL) {
      if (analysis.awbKind === 'house' || analysis.checkDigitOk !== true) {
        return {
          success: false,
          error: '分单号/无法验证的运单号，不执行查询（仅支持 IATA 校验通过的空运主单）',
          analysis,
        };
      }
    }

    if (!carrier) {
      return {
        success: false,
        error: `无法识别承运商，请在 hints 中指定 carrier；query=${analysis.query}, queryType=${queryType} (${QUERY_TYPE_LABELS[queryType] || ''})`,
        analysis,
        supportedList: this.registry.listSupported(),
      };
    }

    const adapter = this.registry.resolve(carrier, queryType);
    if (!adapter) {
      return {
        success: false,
        error: `暂未实现适配器: carrier=${carrier}, queryType=${queryType}`,
        analysis,
        supportedList: this.registry.listSupported(),
      };
    }

    logger.info(`route: ${carrier} / ${queryType} / ${analysis.query}`);
    // 主通道网页查询统一重试：仅对抛异常或「站点不可达/导航超时」类失败重试
    // （shouldBingFallback 即现有的不可达判定），业务性无结果不重试；
    // WEB_QUERY_RETRIES=0 时退化为单次查询。批量名单在整批会话失败时整体重试。
    const result = await withRetry(() => adapter.execute(batchNames || analysis.query, queryType, options), {
      label: `${carrier}/${queryType}/${analysis.query}`,
      isRetryable: (r) => r && r.success === false && shouldBingFallback(r),
    });

    // 站点不可达/导航超时兜底：不再无限等待，改用 Bing 搜索收集线索
    // （options.fallback=false 可关闭）。批量名单在主通道会话失败时逐项兜底。
    if (options.fallback !== false) {
      if (batchNames && queryType === QUERY_TYPES.ROSTER) {
        const items = (result.data && result.data.items) || [];
        if (!items.length) {
          // 整批会话失败（如 Dow Jones SSO 未建立），逐项 Bing 兜底填充
          const fbItems = [];
          for (const name of batchNames) {
            const fb = await bingFallback(name, options);
            fbItems.push({
              raw: name,
              success: false,
              status: 'bing_fallback',
              error: '主通道站点不可达（导航超时），已走 Bing 兜底线索',
              fallback: fb,
            });
          }
          if (fbItems.length && result.data) {
            result.data.items = fbItems;
          }
        } else {
          // 单项失败且为不可达类错误，逐项补 Bing 兜底
          for (const it of items) {
            if (shouldBingFallback(it)) {
              it.fallback = await bingFallback(it.raw || it.query, options);
            }
          }
        }
      } else if (shouldBingFallback(result)) {
        result.fallback = await bingFallback(analysis.query, options);
      }
    }

    return {
      ...result,
      analysis,
    };
  }
}

const globalTracker = new Tracker();

module.exports = {
  Tracker,
  globalTracker,
};
