// utils/screenshot.js — 整页截图：把承运商官网跳转落地页以 PNG 图片形式作为最终查询结果。
// 定位到"点击跳转后的界面"后，不再解析 DOM/文本，直接 fullPage 截图保存，图片即结果。
const path = require('path');
const fs = require('fs');
const { defaultLogger } = require('./logger');

const logger = defaultLogger.child('screenshot');

// 截图交付目录（项目根下 screenshots/），报告可引用其中的图片文件
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

function ensureDir(dir = SCREENSHOT_DIR) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// 整页截图：等待页面沉降后全页截图，返回 { path, filename, url }
async function captureFullPage(page, query, options = {}) {
  const dir = options.dir || ensureDir(SCREENSHOT_DIR);
  const safeName = String(query || 'unknown').replace(/[\\/:*?"<>|\s]+/g, '_');
  const filename = `${safeName}-${Date.now()}.png`;
  const filePath = path.join(dir, filename);

  await page.waitForLoadState('domcontentloaded').catch(() => {});
  if (options.waitBefore !== undefined ? options.waitBefore : true) {
    await page.waitForTimeout(options.waitBeforeMs ?? 1200);
  }
  await page.screenshot({ path: filePath, fullPage: true, type: 'png' });
  logger.info(`整页截图已保存: ${filePath}`);
  return { path: filePath, filename, url: page.url() };
}

module.exports = { captureFullPage, ensureDir, SCREENSHOT_DIR };