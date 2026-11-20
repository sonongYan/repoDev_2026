const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    page.on('request', (req) => {
      if (req.url().includes('tnt-api')) {
        console.log('=== FULL REQUEST ===');
        console.log(req.method(), req.url());
        const h = req.headers();
        for (const k of Object.keys(h).sort()) console.log(`  ${k}: ${h[k]}`);
      }
    });

    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(15000);

    const awbInput = page.locator('textarea[placeholder*="074"]').first();
    await awbInput.waitFor({ timeout: 15000 });
    await awbInput.click({ force: true });
    await awbInput.fill('07439882393');
    await page.waitForTimeout(1000);

    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    const respPromise = page.waitForResponse(r => r.url().includes('tnt-api'), { timeout: 45000 }).catch(() => null);
    await trackBtn.click({ force: true });
    const resp = await respPromise;
    if (resp) {
      console.log('=== RESPONSE ===');
      console.log('status:', resp.status());
      const rh = resp.headers();
      for (const k of Object.keys(rh).sort()) console.log(`  ${k}: ${rh[k]}`);
      const txt = await resp.text().catch(() => '');
      console.log('body:', txt.slice(0, 1000));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
