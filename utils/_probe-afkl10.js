const { launchBrowser } = require('../core/browser');
const fs = require('fs');
const path = require('path');

// 抓 SPA 的 JS bundle 列表并下载，供离线分析 tnt-api / 412 相关逻辑
(async () => {
  const { browser, context } = await launchBrowser({ headless: false });
  const page = await context.newPage();
  const jsUrls = new Set();
  try {
    page.on('response', (res) => {
      const u = res.url();
      if (/\.js(\?|$)/.test(u) && u.includes('afklcargo.com')) jsUrls.add(u);
    });
    await page.goto('https://www.afklcargo.com/mycargo/shipment/singlesearch', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);

    console.log('JS files:', jsUrls.size);
    const outDir = path.join(__dirname, '_afkl_js');
    fs.mkdirSync(outDir, { recursive: true });
    let i = 0;
    for (const u of jsUrls) {
      i++;
      const name = String(i).padStart(2, '0') + '_' + (u.split('/').pop().split('?')[0] || 'chunk.js');
      try {
        const resp = await context.request.get(u);
        const buf = await resp.body();
        fs.writeFileSync(path.join(outDir, name), buf);
        console.log(`saved ${name} (${buf.length} bytes)`);
      } catch (e) {
        console.log(`fail ${u}: ${e.message}`);
      }
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
