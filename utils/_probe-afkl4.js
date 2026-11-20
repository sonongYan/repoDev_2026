const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const apiLog = [];
  try {
    page.on('response', async (res) => {
      const req = res.request();
      if (!['xhr', 'fetch'].includes(req.resourceType())) return;
      let body = null;
      try { body = await res.text(); } catch (_) {}
      apiLog.push({ status: res.status(), url: res.url(), body: body ? body.slice(0, 3000) : null });
    });

    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);

    // 列出所有 role=textbox（含不可见）
    const tbs = await page.getByRole('textbox').all().catch(() => []);
    console.log('=== ALL textboxes (' + tbs.length + ') ===');
    for (const el of tbs) {
      const info = await el.evaluate(e => ({
        tag: e.tagName, id: e.id, visible: !!e.offsetParent, placeholder: e.placeholder,
      })).catch(() => null);
      console.log(' ', JSON.stringify(info));
    }

    // 尝试点「货件追踪」标签
    const tab = page.getByText('货件追踪', { exact: false }).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tab.click({ force: true });
      console.log('clicked 货件追踪 tab');
      await page.waitForTimeout(3000);
    }

    // 再找 AWB 输入框
    const awbInput = page.getByRole('textbox', { name: /074|057/ }).first()
      .or(page.locator('input[placeholder*="074"]').first());
    let visible = await awbInput.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('awb input visible after tab:', visible);

    if (!visible) {
      // 打印当前 body 辅助判断
      const body = await page.locator('body').innerText().catch(() => '');
      console.log('BODY:', body.slice(0, 800).replace(/\n{2,}/g, '\n'));
      return;
    }

    await awbInput.scrollIntoViewIfNeeded().catch(() => {});
    await awbInput.click({ force: true });
    await awbInput.fill('');
    await awbInput.fill('07439882393');
    await page.waitForTimeout(800);
    console.log('filled value:', await awbInput.inputValue().catch(() => 'n/a'));

    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    await trackBtn.click({ force: true });
    console.log('clicked 追踪, waiting...');
    await page.waitForTimeout(15000);

    console.log('after url:', page.url());
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('\n=== BODY (first 2500) ===');
    console.log(body.slice(0, 2500).replace(/\n{2,}/g, '\n'));

    console.log('\n=== XHR/FETCH (' + apiLog.length + ') ===');
    for (const r of apiLog) {
      console.log(`[${r.status}] ${r.url}`);
      if (r.body && /json|api|track|shipment/i.test(r.url)) {
        console.log('  body:', r.body.slice(0, 1200).replace(/\n/g, ' '));
      }
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
