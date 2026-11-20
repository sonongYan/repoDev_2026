'use strict';

// 临时探针：确认 MASkargo 追踪接口对不同单号的响应语义（验证后删除）
const { launchBrowser } = require('../core/browser');

const base = 'https://www.maskargo.com/bin/mh/revamp/maskargo/shipment/tracking';
const nums = process.argv.slice(2);

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://www.maskargo.com/en/shipment-tracking.html', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(6000);

    for (const n of nums) {
      const compact = String(n).replace(/[^0-9]/g, '');
      const out = await page.evaluate(async ({ base, compact }) => {
        const res = await fetch(`${base}?awbShipmentTrackingNumber=${compact}`, {
          headers: { accept: 'application/json, text/plain, */*' },
        });
        const text = await res.text();
        return { status: res.status, text: text.slice(0, 2000) };
      }, { base, compact });
      console.log(`=== ${n} (${compact}) -> HTTP ${out.status}`);
      console.log(out.text || '<empty>');
    }
  } catch (e) {
    console.error('PROBE FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
