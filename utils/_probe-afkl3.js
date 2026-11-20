const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const apiLog = [];
  try {
    // 记录 XHR/fetch 请求与响应
    page.on('response', async (res) => {
      const req = res.request();
      if (!['xhr', 'fetch'].includes(req.resourceType())) return;
      const url = res.url();
      let body = null;
      try { body = await res.text(); } catch (_) {}
      apiLog.push({ status: res.status(), url, body: body ? body.slice(0, 2000) : null });
    });

    const url = 'https://www.afklcargo.com/mycargo/shipment/singlesearch';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // 精确占位符定位 AWB 输入框
    const awbInput = page.locator('input[placeholder*="074"]').first();
    console.log('awb input visible:', await awbInput.isVisible().catch(() => false));

    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    console.log('track btn visible:', await trackBtn.isVisible().catch(() => false));

    await awbInput.scrollIntoViewIfNeeded().catch(() => {});
    await awbInput.click({ force: true });
    await awbInput.fill('');
    await awbInput.fill('07439882393'); // 先尝试无连字符
    await page.waitForTimeout(800);
    console.log('filled value:', await awbInput.inputValue().catch(() => 'n/a'));

    await trackBtn.click({ force: true });
    console.log('clicked, waiting...');
    await page.waitForTimeout(15000);

    console.log('after url:', page.url());
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('\n=== BODY (first 2500) ===');
    console.log(body.slice(0, 2500).replace(/\n{2,}/g, '\n'));

    console.log('\n=== XHR/FETCH LOG (' + apiLog.length + ') ===');
    for (const r of apiLog) {
      console.log(`[${r.status}] ${r.url}`);
      if (r.body && /json|api/i.test(r.url)) console.log('  body:', r.body.slice(0, 800).replace(/\n/g, ' '));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
