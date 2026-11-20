const { launchBrowser } = require('../core/browser');

function abckFlag(cookies) {
  const c = cookies.find(x => x.name === '_abck');
  if (!c) return 'missing';
  // 有效校验通常包含 ~0~ 段；-1 表示未通过
  return c.value.includes('~-1~') ? 'INVALID(-1)' : 'VALID(0)';
}

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 模拟真人：鼠标移动 + 滚动，喂 Akamai 传感器数据
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(200 + Math.random() * 1200, 200 + Math.random() * 600, { steps: 10 });
      await page.waitForTimeout(700);
    }
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(3000);
    console.log('abck after warm-up:', abckFlag(await context.cookies()));

    const awbInput = page.locator('textarea[placeholder*="074"]').first();
    await awbInput.waitFor({ timeout: 15000 });
    await awbInput.click({ force: true });
    await page.waitForTimeout(500);
    // 逐字符输入更像人
    await page.keyboard.type('07439882393', { delay: 80 });
    await page.waitForTimeout(800);

    const trackBtn = page.locator('button[type=submit]').filter({ hasText: /^追踪$/ }).first();
    let respPromise = page.waitForResponse(r => r.url().includes('tnt-api'), { timeout: 45000 }).catch(() => null);
    await trackBtn.click({ force: true });
    let resp = await respPromise;
    console.log('1st tnt-api status:', resp ? resp.status() : 'no response');
    console.log('abck after 1st call:', abckFlag(await context.cookies()));

    // 轮询等 _abck 变有效（最多 40s），期间继续动鼠标
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(300 + Math.random() * 900, 300 + Math.random() * 400, { steps: 8 });
      await page.waitForTimeout(4000);
      const flag = abckFlag(await context.cookies());
      console.log(`poll ${i + 1}: abck=${flag} url=${page.url()}`);
      if (flag.startsWith('VALID')) break;
    }

    // 重新触发详情页
    console.log('reload detail page ...');
    respPromise = page.waitForResponse(r => r.url().includes('tnt-api'), { timeout: 45000 }).catch(() => null);
    await page.goto('https://www.afklcargo.com/mycargo/shipment/detail/074-39882393', { waitUntil: 'domcontentloaded', timeout: 60000 });
    resp = await respPromise;
    if (resp) {
      console.log('2nd tnt-api status:', resp.status());
      const txt = await resp.text().catch(() => '');
      console.log('2nd body (first 3000):', txt.slice(0, 3000));
    } else {
      console.log('2nd: no tnt-api response');
    }

    await page.waitForTimeout(6000);
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('=== BODY (first 2500) ===');
    console.log(body.slice(0, 2500).replace(/\n{2,}/g, '\n'));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
