'use strict';

// 临时探针：用于确认承运商官网追踪页结构（验证后删除）
const fs = require('fs');
const path = require('path');
const { launchBrowser } = require('../core/browser');

const url = process.argv[2];
const name = process.argv[3] || 'probe';
const waitMs = Number(process.argv[4] || 8000);

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const xhrs = [];
  page.on('response', async (res) => {
    const u = res.url();
    const ct = res.headers()['content-type'] || '';
    if (!/json/i.test(ct)) return;
    let body = '';
    try { body = await res.text(); } catch (_) {}
    xhrs.push({ url: u.slice(0, 400), status: res.status(), ct, body: String(body).slice(0, 4000) });
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(waitMs);
    const info = await page.evaluate(() => {
      const pick = (el) => ({
        tag: el.tagName,
        type: el.type || null,
        id: el.id || null,
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        cls: String(el.className || '').slice(0, 120),
        text: (el.innerText || el.value || '').trim().slice(0, 60),
      });
      return {
        title: document.title,
        url: location.href,
        bodyText: (document.body.innerText || '').slice(0, 6000),
        inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(pick).slice(0, 40),
        buttons: Array.from(document.querySelectorAll('button, [role="button"], a.btn, .btn')).map(pick).slice(0, 40),
        iframes: Array.from(document.querySelectorAll('iframe')).map(f => ({ src: (f.src || '').slice(0, 300), id: f.id || null })),
      };
    });
    info.xhrs = xhrs.slice(0, 40);
    const out = path.join(__dirname, '..', `_probe_${name}.json`);
    fs.writeFileSync(out, JSON.stringify(info, null, 2), 'utf8');
    await page.screenshot({ path: path.join(__dirname, '..', `_probe_${name}.png`), fullPage: false }).catch(() => {});
    console.log(`saved ${out}`);
    console.log(JSON.stringify({ title: info.title, url: info.url, inputs: info.inputs, buttons: info.buttons.filter(b => b.text), iframes: info.iframes }, null, 2));
    console.log('--- body ---');
    console.log(info.bodyText.slice(0, 3000));
    console.log('--- json xhr ---');
    for (const x of info.xhrs.slice(0, 12)) console.log(`[${x.status}] ${x.url}\n${x.body.slice(0, 1200)}\n`);
  } catch (e) {
    console.error('PROBE FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
