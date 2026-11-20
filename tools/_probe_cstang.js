'use strict';

const fs = require('fs');
const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const awb = process.argv[2] || '784-82486095';
  const prefix = awb.slice(0, 3);
  const no = awb.replace(/\D/g, '').slice(3);
  try {
    await page.goto('https://tang.csair.com/EN/WebFace/Tang.WebFace.Cargo/AgentAwbBrower.aspx?menuID=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.locator('text=我已阅读并同意').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.fill('#ctl00_ContentPlaceHolder1_txtPrefix', prefix);
    await page.fill('#ctl00_ContentPlaceHolder1_txtNo', no);
    await page.click('#btnSearch');
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => ({
      url: location.href,
      body: (document.body.innerText || '').slice(0, 6000),
      imgs: Array.from(document.querySelectorAll('img')).map(i => ({ id: i.id, src: (i.src || '').slice(0, 200), cls: i.className })).slice(0, 30),
      dialogs: Array.from(document.querySelectorAll('.ui-dialog')).map(d => ({ id: d.id, text: (d.innerText || '').slice(0, 300), display: getComputedStyle(d).display })),
      captchaHtml: (Array.from(document.querySelectorAll('.ui-dialog')).find(d => /security verification/.test(d.innerText || '')) || {}).outerHTML,
      big: (() => {
        const el = document.querySelector('#slide-bigImg');
        return el ? { src: el.src, nw: el.naturalWidth, nh: el.naturalHeight, w: el.offsetWidth, h: el.offsetHeight, rect: el.getBoundingClientRect().toJSON() } : null;
      })(),
      small: (() => {
        const el = document.querySelector('#slide-smallImg');
        return el ? { src: el.src, nw: el.naturalWidth, nh: el.naturalHeight, w: el.offsetWidth, h: el.offsetHeight, rect: el.getBoundingClientRect().toJSON() } : null;
      })(),
    }));
    fs.writeFileSync('_probe_cstang_result.json', JSON.stringify(info, null, 2), 'utf8');
    console.log(JSON.stringify(info, null, 2).slice(0, 9000));
    await page.screenshot({ path: '_probe_cstang_after.png' }).catch(() => {});
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
