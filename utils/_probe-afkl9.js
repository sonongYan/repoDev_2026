const { launchBrowser } = require('../core/browser');

// 诊断：在同一个自动化浏览器里，由「真人手动点击」触发查询，看 tnt-api 是否还 412。
// 运行后脚本会填好单号，请在弹出的 Chrome 窗口里手动点「追踪」。
(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);

    const awbInput = page.locator('textarea[placeholder*="074"]').first();
    await awbInput.waitFor({ timeout: 15000 });
    await awbInput.click({ force: true });
    await awbInput.fill('07439882393');

    console.log('==================================================');
    console.log(' 请在打开的 Chrome 窗口中【手动点击「追踪」按钮】');
    console.log(' 脚本将等待最多 3 分钟捕获 tnt-api 响应 ...');
    console.log('==================================================');

    const resp = await page.waitForResponse(r => r.url().includes('tnt-api'), { timeout: 180000 }).catch(() => null);
    if (!resp) {
      console.log('3 分钟内没有捕获到 tnt-api 请求。');
    } else {
      console.log('tnt-api status:', resp.status());
      const txt = await resp.text().catch(() => '');
      console.log('body (first 4000):', txt.slice(0, 4000));
    }

    await page.waitForTimeout(4000);
    console.log('url:', page.url());
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('=== BODY (first 2500) ===');
    console.log(body.slice(0, 2500).replace(/\n{2,}/g, '\n'));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
