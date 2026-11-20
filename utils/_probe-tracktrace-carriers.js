// 临时探针：dump track-trace.com/container 提交 MSKU7294860 后的承运商选择页 DOM
const { launchBrowser, dismissPopups, getLatestPage } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://www.track-trace.com/container', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await dismissPopups(page, [
      { selectors: ['#coiOverlay button', 'button:has-text("Accept")', 'button:has-text("同意")', 'button:has-text("OK")'], waitAfter: 800 },
    ]);
    await page.locator('#coiOverlay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

    const input = page.locator('#containerform input[name="number"]');
    await input.waitFor({ timeout: 30000 });
    await input.fill('MSKU7294860');
    const submit = page.locator('#containerform .btn, #containerform button').first();
    await submit.click({ force: true });
    await page.waitForTimeout(5000);

    const workPage = await getLatestPage(context, page, { waitAfter: 2000 });
    console.log('=== URL:', workPage.url());

    const links = await workPage.locator('div.js-link').allTextContents();
    console.log('=== js-link count:', links.length);
    links.forEach((t, i) => console.log(`[${i}]`, JSON.stringify(t.trim())));

    // 兜底：所有带 Maersk/Maersk 大小写/公司列表文本的可见元素
    const maerskHits = await workPage.locator('text=/maersk/i').allTextContents();
    console.log('=== maersk 文本元素:', maerskHits.length);
    maerskHits.slice(0, 20).forEach((t, i) => console.log(`[${i}]`, JSON.stringify(t.trim().slice(0, 120))));

    const selectBox = await workPage.locator('select').allTextContents().catch(() => []);
    console.log('=== select 选项:', selectBox.length ? JSON.stringify(selectBox) : 'none');
  } catch (e) {
    console.error('PROBE ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
