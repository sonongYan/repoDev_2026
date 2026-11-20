const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    page.on('requestfailed', (req) => {
      if (req.url().includes('tnt-api')) console.log('!! requestfailed:', req.url(), req.failure() && req.failure().errorText);
    });

    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('warm-up 15s (Akamai settle) ...');
    await page.waitForTimeout(15000);

    // 填单号
    const awbInput = page.locator('textarea[placeholder*="074"]').first();
    await awbInput.waitFor({ timeout: 15000 });
    await awbInput.scrollIntoViewIfNeeded().catch(() => {});
    await awbInput.click({ force: true });
    await awbInput.fill('07439882393');
    await page.waitForTimeout(1000);
    console.log('filled:', await awbInput.inputValue().catch(() => 'n/a'));

    // 点击 + 显式等待 tnt-api 响应
    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    const respPromise = page.waitForResponse(r => r.url().includes('tnt-api'), { timeout: 45000 }).catch(e => ({ __err: e.message }));
    await trackBtn.click({ force: true });
    console.log('clicked, waiting tnt-api response ...');
    const resp = await respPromise;

    if (resp && resp.__err) {
      console.log('waitForResponse err:', resp.__err);
    } else if (resp) {
      console.log('tnt-api status:', resp.status());
      const txt = await resp.text().catch(() => '');
      console.log('tnt-api body (first 3000):', txt.slice(0, 3000));
    }

    await page.waitForTimeout(8000);
    console.log('\nurl:', page.url());
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('=== BODY (first 3000) ===');
    console.log(body.slice(0, 3000).replace(/\n{2,}/g, '\n'));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
