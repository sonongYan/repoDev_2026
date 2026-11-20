// 网页信息查询与 CLI 调用的通用重试工具。
// 配置（.env）：
//   WEB_QUERY_RETRIES       失败后的额外重试次数（总尝试 = 1 + 该值），0 = 不重试，默认 1
//   WEB_QUERY_RETRY_DELAY   每次重试前的等待毫秒数，默认 3000
// 重试语义：仅对「请求失败」重试——fn 抛异常，或 isRetryable(result) 判定为
// 站点不可达/导航超时类失败；业务性无结果（官网查无此单/无命中）绝不重试。

const { defaultLogger } = require('./logger');

const logger = defaultLogger.child('retry');

const WEB_QUERY_RETRIES = Math.max(0, parseInt(process.env.WEB_QUERY_RETRIES ?? '1', 10) || 0);
const WEB_QUERY_RETRY_DELAY = Math.max(0, parseInt(process.env.WEB_QUERY_RETRY_DELAY ?? '3000', 10) || 0);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 带重试执行 fn。
 * @param {() => Promise<any>} fn 查询函数（每次调用应独立发起完整查询）
 * @param {object} opts
 * @param {string} opts.label 日志标签（如 "QATAR/AIR_WAYBILL/157-123"）
 * @param {number} [opts.retries] 覆盖默认额外重试次数
 * @param {number} [opts.delayMs] 覆盖默认重试间隔
 * @param {(result: any) => boolean} [opts.isRetryable] 结果级重试判定；
 *   默认仅 fn 抛异常时重试，正常返回（含失败结果）不重试
 * @returns {Promise<any>} fn 的最终结果；重试耗尽后返回最后一次结果 / 抛出最后一次异常
 */
async function withRetry(fn, { label = 'query', retries = WEB_QUERY_RETRIES, delayMs = WEB_QUERY_RETRY_DELAY, isRetryable } = {}) {
  const maxRetries = Math.max(0, Number.isFinite(retries) ? retries : WEB_QUERY_RETRIES);
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      logger.info(`query retry ${attempt}/${maxRetries} | ${label}${lastErr ? ` | 上次失败: ${lastErr}` : ''}`);
      if (delayMs > 0) await sleep(delayMs);
    }
    try {
      const result = await fn();
      // 结果级判定：调用方声明该结果属于「请求失败」类（如站点不可达）才重试
      if (attempt < maxRetries && isRetryable && isRetryable(result)) {
        lastErr = (result && result.error) || '结果级失败';
        continue;
      }
      return result;
    } catch (e) {
      lastErr = e.message;
      if (attempt >= maxRetries) throw e;
    }
  }
  /* 不可达：循环内必 return/throw */
}

module.exports = { withRetry, WEB_QUERY_RETRIES, WEB_QUERY_RETRY_DELAY, sleep };
