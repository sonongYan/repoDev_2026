const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    const url = 'https://www.afklcargo.com/mycargo/shipment/singlesearch';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    console.log('=== visible TEXTBOXES ===');
    const boxes = await page.locator('input[type=text], input:not([type]), input[type=search]').all().catch(() => []);
    for (const el of boxes) {
      const info = await el.evaluate(e => ({
        id: e.id,
        name: e.name,
        visible: !!e.offsetParent,
        placeholder: e.placeholder,
        aria: e.getAttribute('aria-label'),
        cls: (e.className || '').slice(0, 40),
      })).catch(() => null);
      if (info && info.visible) console.log(' ', JSON.stringify(info));
    }

    // 用 role=textbox 找可见文本框
    const tb = page.getByRole('textbox').first();
    const tbVisible = await tb.isVisible().catch(() => false);
    console.log('getByRole first textbox visible:', tbVisible);
    if (tbVisible) {
      const attrs = await tb.evaluate(e => ({
        id: e.id, name: e.name, placeholder: e.placeholder, aria: e.getAttribute && e.getAttribute('aria-label'),
      })).catch(() => null);
      console.log('  attrs:', JSON.stringify(attrs));
    }

    // 定位「追踪」提交按钮
    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    console.log('tap button 追踪 visible:', await trackBtn.isVisible().catch(() => false));

    // 尝试输入 + 提交
    console.log('\n=== SIMULATE ===');
    if (tbVisible) {
      await tb.scrollIntoViewIfNeeded().catch(() => {});
      await tb.click();
      await tb.fill('074-39882393');
      await page.waitForTimeout(600);
      console.log('filled. value=', await tb.inputValue().catch(() => 'n/a'));
      if (await trackBtn.isVisible().catch(() => false)) {
        await trackBtn.click({ force: true }).catch(() => trackBtn.press('Enter'));
        await page.waitForTimeout(15000);
      } else {
        await tb.press('Enter');
        await page.waitForTimeout(15000);
      }
      console.log('after submit url:', page.url());
      console.log('after submit title:', await page.title().catch(() => 'n/a'));
      const body = await page.locator('body').innerText().catch(() => '');
      console.log('BODY HEAD:', body.slice(0, 1500).replace(/\n{2,}/g, '\n'));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();