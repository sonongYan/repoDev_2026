'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseMalaysiaShipment } = require('../parsers/malaysia');

// 马来西亚航空货运（MASkargo，232）空运单追踪。
// 配方：config/recipes/malaysia.json —— 官网 shipment-tracking 页通过 URL 参数自动查询，无需手动提交。
class MalaysiaAirWaybillAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.MALAYSIA, 'malaysia', { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
  }

  async trackAirWaybill(query, options = {}) {
    const values = this.buildValues(query);
    const reportUrl = this.buildReportUrl(values);
    const queryType = QUERY_TYPES.AIR_WAYBILL;

    let opened;
    let xhr = null;
    try {
      // 监听必须在导航前挂载：官网页面加载后立即用 URL 参数发起查询，晚挂会漏掉响应
      opened = await this.openPage(options, this.buildUrl(values), this.recipe, (page) => {
        xhr = runner.attachXhrWatcher(page, this.recipe.result?.xhr);
      });
    } catch (e) {
      return this.buildResult({
        queryType,
        query,
        url: reportUrl,
        error: `MASkargo 官网打开失败：${e.message}（无法访问）`,
      });
    }

    const { browser, page } = opened;

    try {
      this.logger.info(`MASkargo 官网直连：查询 AWB=${values.numberDash}（配方 v${this.recipe.version}）`);
      const outcome = await this.waitResult(page, xhr, values);

      if (outcome.kind === 'xhr') {
        const data = parseMalaysiaShipment(outcome.data, values.numberDash);
        this.logger.info(`完成 ${this.carrier} 空运单查询（接口 JSON 解析，${data.events.length} 条轨迹）`);
        return this.buildResult({
          success: true,
          queryType,
          query,
          hasResult: true,
          url: reportUrl,
          title: await page.title().catch(() => null),
          data,
          rawText: JSON.stringify(outcome.payload),
        });
      }

      if (outcome.kind === 'notfound') {
        return this.buildResult({
          queryType,
          query,
          url: reportUrl,
          error: 'MASkargo 未查询到该运单记录（官网接口返回空结果）',
        });
      }

      if (outcome.kind === 'error') {
        // MASkargo 后端对系统中不存在的运单统一返回 HTTP 500 + {"status":"Something went wrong"}，
        // 并非真实渠道故障，按"未查询到记录"语义处理
        const maybeNotFound = /something went wrong/i.test(outcome.error || '');
        return this.buildResult({
          queryType,
          query,
          url: reportUrl,
          error: maybeNotFound
            ? 'MASkargo 未查询到该运单记录（官网接口返回 Something went wrong，该站对不存在运单统一报 500）'
            : `MASkargo 官网接口异常：${outcome.error}；无法确认该运单轨迹，请稍后重试或前往官网人工核验`,
        });
      }

      return this.buildResult({
        queryType,
        query,
        url: reportUrl,
        error: 'MASkargo 结果区未在限定时间内返回（未捕获查询接口响应）',
      });
    } catch (e) {
      return this.buildResult({ queryType, query, url: reportUrl, error: `MASkargo 查询异常：${e.message}` });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = { MalaysiaAirWaybillAdapter };
