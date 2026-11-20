'use strict';

// 临时探针：抓取 MASkargo 追踪页全部 XHR，确认是否存在另一条数据接口（验证后删除）
const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const hits = [];
  page.on('response', async (res) => {
    const type = res.request().resourceType();
    if (type !== 'xhr' && type !== 'fetch') return;
    let body = '';
    try { body = (await res.text()).slice(0, 400); } catch (_) {}
    hits.push(`[${res.status()}] ${res.request().method()} ${res.url()}\n${body}`);
  });
  try {
    await page.goto('https://www.maskargo.com/en/shipment-tracking.html?prefixNumber=232&awbNumber=16749482', {
      waitUntil: 'domcontentloaded', timeout: 60000,
    });
    await page.waitForTimeout(20000);
    console.log(hits.join('\n\n'));
    console.log('\n--- body ---\n' + (await page.locator('body').innerText()).slice(0, 1200));
  } finally {
    await browser.close().catch(() => {});
  }
})();
