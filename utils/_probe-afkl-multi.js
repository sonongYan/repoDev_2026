const { launchBrowser } = require('../core/browser');

// 用多个候选 AWB 号去 AFKL 官网逐个试，找到返回 200 数据的
const candidates = [
  '05766014373', // CargoTrackHub 范例
  '07439882393', // 用户之前测试的单号
  '05712345671', // mod-7 合成
  '07412345671', // mod-7 合成
  '05766014380', // mod-7 合成变体
  '07487654321', // mod-7 合成
  '05730001231', // mod-7 合成
  '07430001231', // mod-7 合成
];

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(12000);

    const awbInput = page.locator('textarea[placeholder*="074"], input[placeholder*="074"]').first();
    await awbInput.waitFor({ timeout: 20000 });

    for (const awb of candidates) {
      const formatted = `${awb.slice(0, 3)}-${awb.slice(3)}`;
      console.log(`\n--- trying ${formatted} ---`);
      await awbInput.click({ force: true });
      await awbInput.fill('');
      await awbInput.fill(awb);
      await page.waitForTimeout(600);

      const respPromise = page
        .waitForResponse(r => r.url().includes('/tnt-api/shipments/'), { timeout: 30000 })
        .catch(() => null);
      const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
      await trackBtn.click({ force: true });

      const resp = await respPromise;
      if (!resp) {
        console.log('  no tnt-api response');
        continue;
      }
      const status = resp.status();
      console.log(`  HTTP ${status}`);
      if (status === 200) {
        const txt = await resp.text().catch(() => '');
        console.log(`  body (first 2000): ${txt.slice(0, 2000)}`);
        console.log(`  *** FOUND DATA for ${formatted} ***`);
      }
      await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
