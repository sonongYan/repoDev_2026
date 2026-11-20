'use strict';

const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const awb = process.argv[2] || '784-82486095';
  const prefix = awb.slice(0, 3);
  const no = awb.replace(/\D/g, '').slice(3);
  try {
    await page.goto('https://cargo.csair.com/mcargo/cargo-track-n', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    const out = await page.evaluate(async ({ prefix, no, awb }) => {
      const base = 'https://cargo.csair.com/ces-api/';
      const cases = [
        ['newCargotracking/checkAwb?awbNo=' + no + '&awbPrefix=' + prefix, { awbNo: no, awbPrefix: prefix }],
        ['newCargotracking/checkAwb', { awbNo: no, awbPrefix: prefix }],
        ['newCargotracking/getCaptcha', {}],
        ['cesCargoTracking/getAwbs', { awbs: [{ type: 'A', value: awb }], point: null }],
        ['cesCargoTracking/getAwbs', { awbs: [awb], point: null }],
        ['newCargotracking/queryV2', { awbPrefix: prefix, awbNo: no, point: 100 }],
      ];
      const res = {};
      for (const [path, body] of cases) {
        const u = base + path;
        try {
          const r = await fetch(u, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          res[path] = { status: r.status, body: (await r.text()).slice(0, 1500) };
        } catch (e) {
          res[path] = { error: String(e) };
        }
      }
      return res;
    }, { prefix, no, awb });
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
