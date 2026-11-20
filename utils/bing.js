const { withRetry } = require('./retry');

const BING_URL = 'https://www.bing.com/search';

/**
 * Bing 网页搜索（免登录）：返回 { title, url, snippet }[]。
 * 供各尽调适配器复用（company / person 等线索发现通道）。
 * 导航超时/网络异常时按 WEB_QUERY_RETRIES 自动重试；
 * 空结果可能是真实无命中，不做结果级重试。
 */
async function bingSearch(page, q, { limit = 10 } = {}) {
  return withRetry(
    async () => {
      await page.goto(`${BING_URL}?q=${encodeURIComponent(q)}&setlang=zh-hans`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(3000);
      const items = await page
        .locator('li.b_algo')
        .evaluateAll(
          (els, n) =>
            els.slice(0, n).map((el) => {
              const a = el.querySelector('h2 a');
              const p = el.querySelector('p');
              return {
                title: a?.innerText?.trim() || '',
                url: a?.href || '',
                snippet: p?.innerText?.trim() || '',
              };
            }),
          limit
        )
        .catch(() => []);
      return items.filter((i) => i.url);
    },
    { label: `bing:${q}` }
  );
}

module.exports = { bingSearch, BING_URL };
