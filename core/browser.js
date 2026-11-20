const { chromium } = require('patchright');
const { defaultLogger } = require('../utils/logger');

const logger = defaultLogger.child('browser');

// 项目约定：任何站点导航/加载等待不超过 60s；超时视为不可达，
// 由 tracker 层走 Bing 兜底查询，不再无限等待。
const NAV_TIMEOUT_MS = 60000;

// 真实 Chrome 130 Windows UA（避免被识别为自动化 Chromium）
const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

async function launchBrowser(options = {}) {
  const headless = options.headless !== undefined ? options.headless : false;
  const channel = options.channel || 'chrome';
  // patchright 自身已做反检测；不要加自定义 UA/extraHTTPHeaders/addInitScript，
  // 这些反而会触发 Salesforce/Akamai 等反爬检测，让 SPA 一直卡在 Loading。
  const slowMo = options.slowMo !== undefined ? options.slowMo : 0;

  logger.debug(`launching browser headless=${headless} channel=${channel} slowMo=${slowMo}`);

  const browser = await chromium.launch({ headless, channel, slowMo });

  const context = await browser.newContext({
    locale: options.locale || 'zh-CN',
    timezoneId: options.timezoneId || 'Asia/Shanghai',
    viewport: options.viewport || { width: 1920, height: 1080 },
  });

  return { browser, context };
}

async function safeClick(page, selectors, options = {}) {
  const timeout = options.timeout ?? 2000;
  for (const sel of selectors) {
    const locator = typeof sel === 'string' ? page.locator(sel).first() : sel;
    try {
      const visible = await locator.isVisible({ timeout });
      if (!visible) continue;
    } catch (_) {
      continue;
    }
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      await locator.click({ force: true, ...options });
      if (options.waitAfter) await page.waitForTimeout(options.waitAfter);
      return true;
    } catch (e) {
      logger.debug(`safeClick failed for selector: ${typeof sel === 'string' ? sel : '<locator>'}`, e.message);
    }
  }
  return false;
}

async function dismissPopups(page, groups) {
  for (const group of groups) {
    await safeClick(page, group.selectors, {
      timeout: group.timeout ?? 2000,
      waitAfter: group.waitAfter ?? 800,
    });
  }
}

async function waitForText(page, keywords, options = {}) {
  const maxAttempts = options.maxAttempts ?? 20;
  const intervalMs = options.intervalMs ?? 1500;
  const checkFrames = options.checkFrames !== false;

  for (let i = 0; i < maxAttempts; i++) {
    const mainText = await page.locator('body').innerText().catch(() => '');
    if (keywords.some(k => mainText.includes(k))) return { source: 'main', text: mainText };

    if (checkFrames) {
      for (const f of page.frames()) {
        if (f === page.mainFrame()) continue;
        const frameText = await f.locator('body').innerText().catch(() => '');
        if (keywords.some(k => frameText.includes(k))) {
          return { source: `frame:${f.name() || f.url()}`, text: frameText };
        }
      }
    }

    await page.waitForTimeout(intervalMs);
  }
  return { source: null, text: '' };
}

async function getLatestPage(context, basePage, options = {}) {
  const pages = context.pages();
  if (pages.length > 1) {
    const latest = pages[pages.length - 1];
    await latest.waitForLoadState(options.state || 'domcontentloaded').catch(() => {});
    if (options.waitAfter) await latest.waitForTimeout(options.waitAfter);
    return latest;
  }
  return basePage;
}

// 验证按钮常见选择器（Cloudflare Turnstile / Akamai / 自定义按住按钮）
// 精简到核心几个，缩短检测耗时（避免 slowMo 累积导致循环跑不完）
const CAPTCHA_SELECTORS = [
  'button:has-text("按住")',
  'div[role="button"]:has-text("按住")',
  'button:has-text("hold")',
  'button:has-text("Press and hold")',
  'button:has-text("我不是机器人")',
  '#cf-turnstile',
  '.cf-turnstile',
];

// 检测当前页面是否出现验证按钮
// 同时在 main page 和所有 iframe 中查找（验证弹窗常嵌在 iframe 里）
async function detectCaptcha(page) {
  // 1) 主页面查找按钮
  for (const sel of CAPTCHA_SELECTORS) {
    try {
      const visible = await page.locator(sel).first().isVisible({ timeout: 200 }).catch(() => false);
      if (visible) return `main:${sel}`;
    } catch (_) {
      // ignore
    }
  }
  // 2) 所有 iframe 中查找按钮 + URL 关键词
  try {
    const frames = page.frames();
    for (const f of frames) {
      if (f === page.mainFrame()) continue;
      const url = f.url() || '';
      // iframe URL 含 captcha 关键词
      if (/turnstile|captcha|challenge|arkose|recaptcha/i.test(url)) {
        return `iframe-url:${url.slice(0, 80)}`;
      }
      // iframe 内查找按钮
      for (const sel of CAPTCHA_SELECTORS) {
        try {
          const visible = await f.locator(sel).first().isVisible({ timeout: 200 }).catch(() => false);
          if (visible) return `iframe:${sel}`;
        } catch (_) {
          // ignore
        }
      }
    }
  } catch (_) {
    // ignore
  }
  return null;
}

// 生成从 (x1,y1) 到 (x2,y2) 的多段贝塞尔轨迹点（模拟人类鼠标移动）
function _bezierPath(x1, y1, x2, y2, steps = 25) {
  // 控制点：在中点附近加随机扰动
  const cx = (x1 + x2) / 2 + (Math.random() - 0.5) * 60;
  const cy = (y1 + y2) / 2 + (Math.random() - 0.5) * 60;
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // 二次贝塞尔
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    path.push({ x: px, y: py });
  }
  return path;
}

// 自动模拟按住验证：鼠标贝塞尔轨迹移动 → 按下 → 等 3-5 秒 → 释放
// selector 格式：`main:xxx` | `iframe:xxx` | `iframe-url:xxx`
// 对于 iframe 类验证，按钮坐标在 iframe 内，需用 frame.locator 拿 boundingBox，
// 再加 frame.frameElement() 的 boundingBox 偏移得到页面绝对坐标。
async function _simulateHoldButton(page, selector) {
  try {
    let frame = page.mainFrame();
    let actualSelector = selector;
    if (selector.startsWith('main:')) {
      actualSelector = selector.slice(5);
    } else if (selector.startsWith('iframe:')) {
      actualSelector = selector.slice(7);
      // 找第一个含该按钮的 iframe
      for (const f of page.frames()) {
        if (f === page.mainFrame()) continue;
        const visible = await f.locator(actualSelector).first().isVisible({ timeout: 500 }).catch(() => false);
        if (visible) {
          frame = f;
          break;
        }
      }
    } else if (selector.startsWith('iframe-url:')) {
      // iframe URL 类验证：按钮选择器未知，尝试用通用选择器
      const urlMatch = selector.slice(11);
      for (const f of page.frames()) {
        if (f === page.mainFrame()) continue;
        if ((f.url() || '').includes(urlMatch.slice(0, 30))) {
          frame = f;
          // 在该 iframe 里找任意 button 或 role=button
          for (const trySel of ['button', 'div[role="button"]', '[role="button"]']) {
            const visible = await f.locator(trySel).first().isVisible({ timeout: 500 }).catch(() => false);
            if (visible) {
              actualSelector = trySel;
              break;
            }
          }
          break;
        }
      }
    }

    const locator = frame.locator(actualSelector).first();
    const box = await locator.boundingBox();
    if (!box) return false;

    // iframe 内坐标需加上 iframe 元素在主页面中的偏移
    let offsetX = 0;
    let offsetY = 0;
    if (frame !== page.mainFrame()) {
      try {
        const frameElement = await frame.frameElement();
        const frameBox = await frameElement.boundingBox();
        if (frameBox) {
          offsetX = frameBox.x;
          offsetY = frameBox.y;
        }
      } catch (_) {
        // ignore
      }
    }
    const cx = offsetX + box.x + box.width / 2;
    const cy = offsetY + box.y + box.height / 2;

    // 从随机起点用贝塞尔轨迹移动到按钮中心
    const startX = cx + (Math.random() - 0.5) * 400;
    const startY = cy + (Math.random() - 0.5) * 200;
    const path = _bezierPath(startX, startY, cx, cy, 25);
    for (const p of path) {
      await page.mouse.move(p.x, p.y, { steps: 1 });
      await page.waitForTimeout(20 + Math.random() * 30);
    }
    await page.waitForTimeout(200 + Math.random() * 300);

    // 按住 3-5 秒
    const holdMs = 3000 + Math.random() * 2000;
    await page.mouse.down();
    await page.waitForTimeout(holdMs);
    await page.mouse.up();
    return true;
  } catch (e) {
    logger.debug(`simulateHoldButton error: ${e.message}`);
    return false;
  }
}

// 处理验证：自动模拟 → 失败则等用户配合
// 返回值：'auto-passed' | 'user-passed' | 'timeout' | 'not-present'
async function handleCaptchaIfNeeded(page, options = {}) {
  const autoTimeoutMs = options.autoTimeoutMs ?? 10000; // 自动模拟后等待结果的最长时间
  const userTimeoutMs = options.userTimeoutMs ?? 90000; // 用户配合的最长时间

  const selector = await detectCaptcha(page);
  if (!selector) return 'not-present';

  logger.info(`检测到验证按钮：${selector}`);

  // 1) 尝试自动模拟按住
  const simulated = await _simulateHoldButton(page, selector);
  if (simulated) {
    // 等待验证消失或成功跳转
    const start = Date.now();
    while (Date.now() - start < autoTimeoutMs) {
      await page.waitForTimeout(1000);
      const still = await detectCaptcha(page);
      if (!still) {
        logger.info('验证已通过（自动模拟）');
        return 'auto-passed';
      }
    }
    logger.warn('自动模拟未通过验证，等待用户手动配合...');
  }

  // 2) 等待用户手动配合（最长 userTimeoutMs）
  const start = Date.now();
  while (Date.now() - start < userTimeoutMs) {
    await page.waitForTimeout(2000);
    const still = await detectCaptcha(page);
    if (!still) {
      logger.info('验证已通过（用户手动配合）');
      return 'user-passed';
    }
  }

  logger.error('验证等待超时');
  return 'timeout';
}

module.exports = {
  launchBrowser,
  safeClick,
  dismissPopups,
  waitForText,
  getLatestPage,
  detectCaptcha,
  handleCaptchaIfNeeded,
  NAV_TIMEOUT_MS,
};
