'use strict';

const fs = require('fs');
const { launchBrowser } = require('../core/browser');

(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  try {
    await page.goto('https://cargo.csair.com/pages/cargotracking', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.locator('button:has-text("同意"), a:has-text("同意")').first().click({ timeout: 3000 }).catch(() => {});
    await page.selectOption('select[name="selectOorA"]', 'A');
    await page.fill('#awbNo', '784-82486095');
    await page.click('#searchFormSubmit');
    await page.waitForTimeout(2500);
    const urls = await page.evaluate(() => {
      const cs = el => el ? getComputedStyle(el).backgroundImage : '';
      const grab = s => (s.match(/url\("?([^")]+)"?\)/) || [])[1];
      return {
        big: grab(cs(document.querySelector('.yzm_image_cut_big'))),
        small: grab(cs(document.querySelector('#xy_img'))),
      };
    });
    fs.writeFileSync('_csair_big.png', Buffer.from(await (await context.request.get(urls.big)).body()));
    fs.writeFileSync('_csair_small.png', Buffer.from(await (await context.request.get(urls.small)).body()));
    console.log(urls);
  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close().catch(() => {});
  }
})();
