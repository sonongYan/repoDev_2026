'use strict';

// 临时探针：南航货运查询页 → 点击查询 → 抓取滑块验证码弹窗结构（验证后删除）
const fs = require('fs');
const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const log = [];
  page.on('response', async (res) => {
    if (!/getCaptcha|GetAwb|queryCargoInfo|captcha/i.test(res.url())) return;
    let body = '';
    try { body = await res.text(); } catch (_) {}
    log.push({ url: res.url(), status: res.status(), body: body.slice(0, 3000) });
  });

  try {
    await page.goto('https://cargo.csair.com/pages/cargotracking', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    // cookie 同意
    await page.locator('button:has-text("同意"), a:has-text("同意")').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1000);

    await page.selectOption('select[name="selectOorA"]', 'A').catch(() => {});
    await page.fill('#awbNo', '784-82486095');
    await page.waitForTimeout(500);
    await page.click('#searchFormSubmit');
    await page.waitForTimeout(3000);

    const info = await page.evaluate(() => {
      const modal = document.querySelector('#mod-imageVerify');
      const big = document.querySelector('.yzm_image_cut_big');
      const small = document.querySelector('#xy_img');
      const handle = document.querySelector('.drag-handle, .drag-bar');
      const cs = el => (el ? getComputedStyle(el) : null);
      return {
        modalHtml: modal ? modal.outerHTML.slice(0, 12000) : null,
        bigStyle: big ? { bg: cs(big).backgroundImage, w: big.offsetWidth, h: big.offsetHeight } : null,
        smallStyle: small ? { bg: cs(small).backgroundImage, w: small.offsetWidth, h: small.offsetHeight, top: cs(small).top } : null,
        handleRect: handle ? handle.getBoundingClientRect().toJSON() : null,
        bodyTail: (document.body.innerText || '').slice(-1500),
      };
    });
    await page.screenshot({ path: '_probe_csair_modal.png' }).catch(() => {});
    fs.writeFileSync('_probe_csair_modal.json', JSON.stringify({ info, log }, null, 2), 'utf8');
    console.log(JSON.stringify({ info, log }, null, 2).slice(0, 12000));
  } catch (e) {
    console.error('PROBE FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
