const { launchBrowser } = require('../core/browser');
const { bingSearch, BING_URL } = require('./bing');
const { defaultLogger } = require('./logger');

const logger = defaultLogger.child('fallback');

// Bing 兜底提取条数：由 .env 的 BING_FALLBACK_LIMIT 配置，默认 20，可随时修改
const BING_FALLBACK_LIMIT = parseInt(process.env.BING_FALLBACK_LIMIT || '20', 10);

// 判定"站点不可达/导航失败"类错误：只有这类失败才触发 Bing 兜底，
// 业务性失败（如运单无数据、AWB 校验拦截）不兜底。
const UNREACHABLE_RE =
  /timeout|exceeded|goto\b|navigation|net::|ERR_|unreachable|无法访问|页面未加载|会话建立失败|未进入追踪结果页|加载出|无法跳转|跳转失败|未跳转/i;

function shouldBingFallback(result) {
  if (!result || result.success !== false) return false;
  const text = [result.error, ...(result.issues || [])].filter(Boolean).join(' ');
  return UNREACHABLE_RE.test(text);
}

/**
 * Bing 兜底查询：主通道站点不可达/超时时，用公开 Bing 搜索收集线索。
 * 返回 { source, url, items, error? }，items 为 { title, url, snippet }[]。
 */
async function bingFallback(query, options = {}) {
  const searchUrl = `${BING_URL}?q=${encodeURIComponent(String(query || ''))}`;
  if (!query) {
    return { source: 'Bing', url: searchUrl, items: [], error: '空查询' };
  }
  const { browser, context } = await launchBrowser({ headless: options.headless ?? false });
  try {
    const page = await context.newPage();
    const items = await bingSearch(page, query, { limit: BING_FALLBACK_LIMIT });
    logger.info(`bing fallback done | query=${query} hits=${items.length}`);
    return { source: 'Bing', url: searchUrl, items };
  } catch (e) {
    logger.warn(`bing fallback failed | query=${query}`, e.message);
    return { source: 'Bing', url: searchUrl, items: [], error: e.message };
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { bingFallback, shouldBingFallback, UNREACHABLE_RE, BING_FALLBACK_LIMIT };
