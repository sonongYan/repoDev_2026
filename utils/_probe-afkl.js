const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    const url = 'https://www.afklcargo.com/mycargo/shipment/singlesearch';
    console.log('goto', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    console.log('current url:', page.url());
    console.log('title:', await page.title().catch(() => 'n/a'));

    // 列出输入框
    const inputs = await page.$$('input').catch(() => []);
    console.log('\n=== INPUTS (' + inputs.length + ') ===');
    for (const el of inputs) {
      const info = await el.evaluate(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        placeholder: e.placeholder,
        value: (e.value || '').slice(0, 30),
      })).catch(() => null);
      console.log(' ', JSON.stringify(info));
    }

    // 列出按钮
    const buttons = await page.$$('button, input[type=submit]').catch(() => []);
    console.log('\n=== BUTTONS (' + buttons.length + ') ===');
    for (const el of buttons) {
      const info = await el.evaluate(e => ({
        tag: e.tagName,
        id: e.id,
        type: e.type || (e.getAttribute && e.getAttribute('type')),
        text: (e.innerText || e.value || '').trim().slice(0, 40),
      })).catch(() => null);
      if (info && (info.text || info.id || info.type === 'submit')) {
        console.log(' ', JSON.stringify(info));
      }
    }

    console.log('\n=== BODY SNIPPET ===');
    const body = await page.locator('body').innerText().catch(() => '');
    console.log(body.slice(0, 1200));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();