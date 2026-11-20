'use strict';

// 临时探针：南航新版货物跟踪 SPA（验证后删除）
const fs = require('fs');
const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  page.on('response', async (res) => {
    const ct = res.headers()['content-type'] || '';
    if (!/json|text/i.test(ct)) return;
    let body = '';
    try { body = await res.text(); } catch (_) {}
    console.log(`[RES ${res.status()}] ${res.url()}\n${String(body).slice(0, 1200)}\n`);
  });
  try {
    await page.goto('https://cargo.csair.com/mcargo/cargo-track-n', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const dom = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('*').forEach(el => {
        const t = (el.innerText || '').trim();
        if (t === '查询' && el.children.length === 0) {
          out.push({ tag: el.tagName, cls: el.className, html: el.outerHTML.slice(0, 300), parent: el.parentElement ? el.parentElement.outerHTML.slice(0, 800) : '' });
        }
      });
      return { out, body: (document.body.innerText || '').slice(0, 2000) };
    });
    console.log(JSON.stringify(dom, null, 2).slice(0, 5000));

    const input = page.locator('input.item__ipt').first();
    await input.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('78482486095');
    await page.waitForTimeout(500);
    await page.locator('text=查询').last().click();
    await page.waitForTimeout(4000);

    const after = await page.evaluate(() => ({
      body: (document.body.innerText || '').slice(-2000),
      imgs: Array.from(document.querySelectorAll('img, canvas, [style*="background-image"]')).map(el => ({
        tag: el.tagName, src: (el.src || el.getAttribute('src') || '').slice(0, 200),
        bg: getComputedStyle(el).backgroundImage.slice(0, 200), cls: String(el.className || '').slice(0, 100), w: el.offsetWidth, h: el.offsetHeight,
      })).slice(0, 30),
      html: document.body.innerHTML.slice(-6000),
    }));
    fs.writeFileSync('_csair_new_after.json', JSON.stringify(after, null, 2), 'utf8');
    console.log('--- after ---');
    console.log(after.body);
    console.log(JSON.stringify(after.imgs, null, 2));
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
