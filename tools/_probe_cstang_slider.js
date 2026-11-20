'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { launchBrowser } = require('../core/browser');

const SLIDE_SCRIPT = path.join(__dirname, '..', 'utils', 'slide_captcha.py');

function solveSlide(bigBuf, smallBuf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cstang-'));
  const bigPath = path.join(dir, 'big.png');
  const smallPath = path.join(dir, 'small.png');
  fs.writeFileSync(bigPath, bigBuf);
  fs.writeFileSync(smallPath, smallBuf);
  const r = spawnSync('python', [SLIDE_SCRIPT, smallPath, bigPath], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  try {
    return JSON.parse((r.stdout || '{}').trim());
  } catch (_) {
    return null;
  }
}

async function drag(page, x) {
  const btn = page.locator('#slide-img-btn').first();
  const box = await btn.boundingBox();
  const sx = box.x + box.width / 2;
  const sy = box.y + box.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(sx + (x * i) / 30, sy, { steps: 1 });
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(100);
  await page.mouse.up();
}

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const awb = process.argv[2] || '784-82486095';
  const prefix = awb.slice(0, 3);
  const no = awb.replace(/\D/g, '').slice(3);
  page.on('response', async (res) => {
    if (!/ValidateImage|AgentAwb/i.test(res.url())) return;
    if (/\.(js|css|png|jpg|gif)/i.test(res.url())) return;
    let body = '';
    try { body = await res.text(); } catch (_) {}
    console.log(`[RES ${res.status()}] ${res.url()}\n${body.slice(0, 800)}\n`);
  });
  try {
    await page.goto('https://tang.csair.com/EN/WebFace/Tang.WebFace.Cargo/AgentAwbBrower.aspx?menuID=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.locator('text=我已阅读并同意').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.fill('#ctl00_ContentPlaceHolder1_txtPrefix', prefix);
    await page.fill('#ctl00_ContentPlaceHolder1_txtNo', no);

    for (let attempt = 1; attempt <= 4; attempt++) {
      if (attempt > 1) {
        await page.evaluate(() => {
          try { window.$('#verifyDialog').dialog('close'); } catch (_) {}
        });
        await page.waitForTimeout(1000);
      }
      await page.click('#btnSearch');
      await page.waitForTimeout(2500);
      if (!(await page.locator('#slide-bigImg').count())) {
        console.log('no captcha dialog, dialog might have submitted directly');
        await page.waitForTimeout(6000);
        break;
      }
      const urls = await page.evaluate(() => ({
        big: document.querySelector('#slide-bigImg')?.src,
        small: document.querySelector('#slide-smallImg')?.src,
      }));
      const bigBuf = Buffer.from(await (await context.request.get(urls.big)).body());
      const smallBuf = Buffer.from(await (await context.request.get(urls.small)).body());
      fs.writeFileSync('_cstang_big.png', bigBuf);
      fs.writeFileSync('_cstang_small.png', smallBuf);
      const sol = solveSlide(bigBuf, smallBuf);
      console.log(`attempt ${attempt} sol`, sol);
      if (!sol || sol.x == null) continue;

      await drag(page, sol.x);
      await page.waitForTimeout(3000);
      const state = await page.evaluate(() => ({
        fail: document.querySelector('#fail-reason')?.innerText || '',
        failVisible: (() => {
          const el = document.querySelector('#fail-reason');
          return el ? getComputedStyle(el.parentElement).display !== 'none' : false;
        })(),
        successVisible: (() => {
          const el = document.querySelector('#slide-validate-success');
          return el ? getComputedStyle(el).display !== 'none' : false;
        })(),
      }));
      console.log('state', state);
      if (state.successVisible) {
        await page.waitForTimeout(8000);
        break;
      }
    }

    const info = await page.evaluate(() => ({
      url: location.href,
      body: (document.body.innerText || '').slice(0, 8000),
    }));
    fs.writeFileSync('_probe_cstang_after.json', JSON.stringify(info, null, 2), 'utf8');
    console.log('--- body ---');
    console.log(info.body.slice(0, 4000));
    await page.screenshot({ path: '_probe_cstang_after.png' }).catch(() => {});
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
