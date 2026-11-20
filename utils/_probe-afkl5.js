const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const tntCalls = [];
  try {
    page.on('request', (req) => {
      if (req.url().includes('tnt-api')) {
        tntCalls.push({ phase: 'request', url: req.url(), method: req.method(), headers: req.headers() });
      }
    });
    page.on('response', async (res) => {
      if (res.url().includes('tnt-api')) {
        let body = null;
        try { body = await res.text(); } catch (_) {}
        tntCalls.push({ phase: 'response', url: res.url(), status: res.status(), headers: res.headers(), body: body ? body.slice(0, 3000) : null });
      }
    });

    // 1) 先访问搜索页热身，让 Akamai 完成校验
    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('warm-up 12s ...');
    await page.waitForTimeout(12000);

    // 2) 直接访问详情页（SPA 会自己调 tnt-api）
    await page.goto('https://www.afklcargo.com/mycargo/shipment/detail/074-39882393', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('detail page loading, wait 15s ...');
    await page.waitForTimeout(15000);

    console.log('\n=== TNT CALLS after direct nav ===');
    for (const c of tntCalls) console.log(JSON.stringify(c, null, 1).slice(0, 1600), '\n');

    let body = await page.locator('body').innerText().catch(() => '');
    console.log('=== BODY after direct nav (first 1500) ===');
    console.log(body.slice(0, 1500).replace(/\n{2,}/g, '\n'));

    // 3) 若仍 412，刷新一次再试
    const lastResp = [...tntCalls].reverse().find(c => c.phase === 'response');
    if (lastResp && lastResp.status === 412) {
      console.log('\n--- got 412, reload and retry after 10s ---');
      tntCalls.length = 0;
      await page.waitForTimeout(10000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(15000);
      console.log('=== TNT CALLS after reload ===');
      for (const c of tntCalls) console.log(JSON.stringify(c, null, 1).slice(0, 1600), '\n');
      body = await page.locator('body').innerText().catch(() => '');
      console.log('=== BODY after reload (first 1500) ===');
      console.log(body.slice(0, 1500).replace(/\n{2,}/g, '\n'));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
