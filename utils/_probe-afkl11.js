const { launchBrowser } = require('../core/browser');

// 复现适配器逐步流程并打点，定位点击未触发 tnt-api 的原因
(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  let tntFired = false;
  try {
    page.on('request', r => { if (r.url().includes('tnt-api')) { tntFired = true; console.log('>> tnt-api request fired'); } });

    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(12000);

    const awbInput = page.locator('textarea[placeholder*="074"], input[placeholder*="074"]').first();
    await awbInput.waitFor({ timeout: 20000 });
    console.log('input found, count =', await page.locator('textarea[placeholder*="074"], input[placeholder*="074"]').count());
    await awbInput.scrollIntoViewIfNeeded().catch(() => {});
    await awbInput.click({ force: true });
    await awbInput.fill('');
    await awbInput.fill('07439882393');
    await page.waitForTimeout(800);
    console.log('value now =', JSON.stringify(await awbInput.inputValue()));

    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    const visible = await trackBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const enabled = await trackBtn.isEnabled().catch(() => 'n/a');
    console.log('trackBtn visible =', visible, 'enabled =', enabled, 'count =', await page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).count());

    if (visible) {
      await trackBtn.click({ force: true });
      console.log('clicked trackBtn');
    } else {
      await awbInput.press('Enter');
      console.log('pressed Enter');
    }

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(3000);
      console.log(`t+${(i + 1) * 3}s tntFired=${tntFired} url=${page.url()}`);
      if (tntFired) break;
    }

    if (!tntFired) {
      // 看看页面上有没有校验错误提示
      const body = await page.locator('body').innerText().catch(() => '');
      const lines = body.split('\n').map(l => l.trim()).filter(l => /错误|无效|error|invalid|格式/i.test(l));
      console.log('validation-ish lines:', JSON.stringify(lines.slice(0, 5)));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
