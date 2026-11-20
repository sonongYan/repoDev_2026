const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://www.track-trace.com/aircargo', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const input = page.locator('#aircargoform input[name="number"]');
    await input.waitFor({ timeout: 30000 });
    await input.fill('074-39882393');
    await page.waitForTimeout(500);

    const directBtn = page.locator('#wc-multi-form-button_direct');
    const dv = await directBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Track direct visible:', dv);
    if (dv) await directBtn.click({ force: true });
    else await page.locator('#aircargoform button[type=submit], #aircargoform input[type=submit]').first().click({ force: true });

    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(6000);

    // 列出所有页面
    const pages = context.pages();
    console.log('\n=== OPEN PAGES (' + pages.length + ') ===');
    for (const [i, p] of pages.entries()) {
      console.log('--- page[' + i + '] url:', p.url());
      console.log('    title:', await p.title().catch(() => 'n/a'));
      // 该页可填 textbox
      const tbs = await p.locator('input[type=text], input:not([type]), input[type=search], textarea').all().catch(() => []);
      let visible = 0;
      for (const el of tbs) {
        const vis = await el.evaluate(e => !!e.offsetParent).catch(() => false);
        if (!vis) continue;
        visible++;
        if (visible <= 6) {
          const attrs = await el.evaluate(e => ({ placeholder: e.placeholder, id: e.id, name: e.name })).catch(() => null);
          console.log('    box:', JSON.stringify(attrs));
        }
      }
      if (visible === 0) console.log('    (no visible textbox)');
      const body = await p.locator('body').innerText().catch(() => '');
      const head = body.trim().slice(0, 200).replace(/\n/g, ' | ');
      console.log('    body>', head);
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();