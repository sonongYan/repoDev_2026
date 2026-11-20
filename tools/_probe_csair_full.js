'use strict';

// 临时探针：南航货运滑块验证码全链路（验证后删除）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { launchBrowser } = require('../core/browser');

const SLIDE_SCRIPT = path.join(__dirname, '..', 'utils', 'slide_captcha.py');

function solveSlide(bigBuf, smallBuf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'csair-'));
  const bigPath = path.join(dir, 'big.png');
  const smallPath = path.join(dir, 'small.png');
  fs.writeFileSync(bigPath, bigBuf);
  fs.writeFileSync(smallPath, smallBuf);
  const r = spawnSync('python', [SLIDE_SCRIPT, smallPath, bigPath], { encoding: 'utf8', timeout: 30000, windowsHide: true });
  try {
    const out = JSON.parse((r.stdout || '{}').trim());
    return out.x != null ? out : null;
  } catch (_) {
    return null;
  }
}

async function readCaptchaUrls(page) {
  return page.evaluate(() => {
    const cs = el => el ? getComputedStyle(el).backgroundImage : '';
    const grab = s => (s.match(/url\("?([^")]+)"?\)/) || [])[1];
    return {
      big: grab(cs(document.querySelector('.yzm_image_cut_big'))),
      small: grab(cs(document.querySelector('#xy_img'))),
    };
  });
}

async function dragTo(page, targetX) {
  const handler = page.locator('#drag .handler').first();
  const box = await handler.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let i = 1; i <= 25; i++) {
    await page.mouse.move(startX + (targetX * i) / 25, startY, { steps: 1 });
    await page.waitForTimeout(15);
  }
  await page.waitForTimeout(120);
  await page.mouse.up();
}

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const checks = [];
  page.on('response', async (res) => {
    if (!/cargotracking|checkCapcha|GetAwb|queryCargoInfo/i.test(res.url())) return;
    let body = '';
    const h = res.headers();
    if (/GetAwb|queryCargoInfo/i.test(res.url())) {
      console.log(`[HDR ${res.status()}] ${res.url()}\nLOCATION ${h.location || ''}\nTYPE ${h['content-type'] || ''}\n`);
    }
    if (/checkCapcha/i.test(res.url())) {
      try { body = await res.text(); } catch (_) {}
      console.log(`[RES ${res.status()}] ${res.url()}\nRESP ${body.slice(0, 500)}\n`);
    }
    if (/tempImg|\.js|\.tpl/i.test(res.url())) return;
    if (/checkCapcha/i.test(res.url())) {
      try { checks.push(JSON.parse(body)); } catch (_) {}
    }
  });
  page.on('requestfailed', (req) => {
    if (/cargotracking|GetAwb|queryCargoInfo/i.test(req.url())) {
      console.log('[REQFAIL]', req.url(), req.failure() && req.failure().errorText);
    }
  });

  try {
    await page.goto('https://cargo.csair.com/pages/cargotracking', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.locator('button:has-text("同意"), a:has-text("同意")').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.selectOption('select[name="selectOorA"]', 'A');
    await page.fill('#awbNo', process.argv[2] || '784-82486095');
    await page.click('#searchFormSubmit');
    await page.waitForTimeout(2500);

    for (let attempt = 1; attempt <= 4; attempt++) {
      const urls = await readCaptchaUrls(page);
      if (!urls.big || !urls.small) {
        console.log('captcha not ready', urls);
        break;
      }
      const bigBuf = Buffer.from(await (await context.request.get(urls.big)).body());
      const smallBuf = Buffer.from(await (await context.request.get(urls.small)).body());
      const sol = solveSlide(bigBuf, smallBuf);
      console.log(`attempt ${attempt} solve:`, sol);
      if (!sol) break;
      await dragTo(page, sol.x);
      await page.waitForTimeout(2500);
      console.log('checkCapcha so far:', JSON.stringify(checks));
      if (checks.length && checks[checks.length - 1].returnObject === true) {
        await page.waitForTimeout(6000);
        const body = await page.locator('body').innerText().catch(() => '');
        fs.writeFileSync('_csair_body.txt', body);
        console.log('--- body tail ---');
        console.log(body.slice(-4000));
        break;
      }
    }
  } catch (e) {
    console.error('FAIL:', e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
