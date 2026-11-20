// utils/landing.js — 异构落地页抓取：快照 + 分类 + 表单二次提交 + 通用事件抽取。
//
// 背景：track-trace 无法内嵌显示时会把查询跳转到承运商自己的网站，而这些网站的
// 页面结构各不相同（Triton 详情页 / Seaco 表单页 / 登录墙 / 未知布局），公司不可穷举，
// 无法逐家写解析器。本模块改用"通用信号"处理异构页面：
//   1) 快照：无条件采集 URL + 标题 + 正文，保证任何失败都有原文证据可溯源
//   2) 分类：按页面特征（箱号+日期 / 表单+提交按钮 / 密码框）识别页面类型
//   3) 表单二次提交：Seaco 型页面需重新输入箱号提交一次才出结果（护栏：最多一轮）
//   4) 通用事件抽取：取页面所有表格行/正文行，用日期+事件/地点关键词共性模式提取事件
const { defaultLogger } = require('./logger');
const logger = defaultLogger.child('landing');

// 事件类型 / 地点 / 日期 共性关键词（不依赖任何公司的具体表结构）
const EVENT_KEYWORDS = [
  'Lease Out', 'Lease In', 'Turn In', 'Turn Out', 'Off Hire', 'On Hire',
  'Loaded', 'Discharged', 'Gate In', 'Gate Out', 'Arrived', 'Departed',
  'Redelivery', 'Released', 'Empty Returned', 'Delivered',
];
const LOCATION_KEYWORDS = ['Port', 'Depot', 'CY', 'Terminal', 'Facility', 'Gate'];
const DATE_RE = /\d{1,2}[-/][A-Za-z]{3}[-/]\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2}/g;

// 表单页识别：文本框 placeholder/name 需含 unit/container/track 之一
const FORM_HINT_RE = /unit|container|track/i;
const SUBMIT_RE = /Submit|Track|Query|Enquiry/i;

// 渠道故障（后端临时错误/限流/服务不可用）——与"查询成功但无命中"严格区分
const BACKEND_ERROR_RE = /could not be processed|try again later|temporarily unavailable|service unavailable|site can.?t be reached|too many requests|rate limit/i;
// 明确无匹配（查询成功、但该箱号无数据）——业务性"无命中"，非渠道故障
const NOT_FOUND_RE = /not found|no matching|no records|no results|no data found|does not exist|no unit (found|exists)/i;

function findKeyword(line, list) {
  const lower = line.toLowerCase();
  for (const kw of list) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

// 快照：URL + 标题 + 正文（截断防超长）
async function snapshotPage(page, maxChars = 40000) {
  const text = ((await page.locator('body').innerText().catch(() => '')) || '').trim();
  return {
    url: page.url(),
    title: await page.title().catch(() => null),
    rawText: text.length > maxChars ? `${text.slice(0, maxChars)}\n...[已截断]` : text,
  };
}

// 页面分类：'result' | 'no-match' | 'form' | 'login' | 'error' | 'unknown'
async function classifyLandingPage(page, query) {
  const text = (await page.locator('body').innerText().catch(() => '')) || '';
  const lower = text.toLowerCase();

  // 登录墙：密码输入框 或 登录标题+password
  const hasPassword = await page.locator('input[type="password"]').count().catch(() => 0);
  if (hasPassword > 0) return 'login';
  if (/log ?in|sign ?in/.test(lower) && /password/.test(lower)) return 'login';

  // 渠道故障（后端临时错误/限流）优先于结果页判断，避免空结果被误判为有数据
  if (BACKEND_ERROR_RE.test(text)) return 'error';
  // 明确无匹配（查询成功但无数据）——业务性无命中，非渠道故障
  if (NOT_FOUND_RE.test(text)) return 'no-match';

  // 结果页：正文含完整箱号（去空白/大写）且出现日期 或 存在含日期的表格
  const box = query.replace(/\s+/g, '').toUpperCase();
  const compact = text.replace(/\s+/g, '').toUpperCase();
  const hasContainer = compact.includes(box);
  const dates = text.match(DATE_RE) || [];
  const tableCount = await page.locator('table').count().catch(() => 0);
  if (hasContainer && (dates.length >= 1 || tableCount > 0)) return 'result';

  // 表单页：存在文本框 + 提交按钮 + 输入提示含 unit/container/track
  const input = page.locator('textarea, input[type="text"], input:not([type])').first();
  const inputCount = await page.locator('textarea, input[type="text"], input:not([type])').count().catch(() => 0);
  if (inputCount > 0) {
    const hint = [
      await input.getAttribute('placeholder').catch(() => '') || '',
      await input.getAttribute('name').catch(() => '') || '',
      await input.getAttribute('aria-label').catch(() => '') || '',
    ].join(' ');
    const submitCount = await page
      .locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Track"), button:has-text("Query"), button:has-text("Enquiry")')
      .count().catch(() => 0);
    if (submitCount > 0 && FORM_HINT_RE.test(hint)) return 'form';
  }
  return 'unknown';
}

// 表单二次提交：把箱号重新填入表单并提交（Seaco 型页面）。护栏由调用方控制（最多一轮）。
async function submitContainerForm(page, query) {
  const input = page.locator('textarea, input[type="text"], input:not([type])').first();
  const submit = page
    .locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Track"), button:has-text("Query"), button:has-text("Enquiry")')
    .first();
  await input.click().catch(() => {});
  await input.fill('').catch(() => {});
  await input.fill(query);
  await page.waitForTimeout(300);
  await submit.click({ force: true }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
}

// 通用事件抽取：含日期的表格行/正文行 → { date, type, location, note, partial }
async function extractContainerEvents(page, query) {
  const rows = [];
  const tables = await page.locator('table').all().catch(() => []);
  for (const tbl of tables) {
    const trs = await tbl.locator('tr').allInnerTexts().catch(() => []);
    rows.push(...trs);
  }
  const text = (await page.locator('body').innerText().catch(() => '')) || '';
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);

  const events = [];
  const seen = new Set();
  const collect = (line) => {
    const dates = line.match(DATE_RE);
    if (!dates || !dates.length) return;
    const key = line.slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    const type = findKeyword(line, EVENT_KEYWORDS) || 'event';
    const location = findKeyword(line, LOCATION_KEYWORDS) || null;
    events.push({
      date: dates.join(' | '),
      type,
      location,
      note: line.slice(0, 300),
      partial: type === 'event' || !location,
    });
  };
  for (const row of rows) collect(row.replace(/\s+/g, ' ').trim());
  for (const line of lines) collect(line);
  return events.slice(0, 50);
}

// 落地页主流程：快照 → 分类 →（表单则二次提交一轮）→ 结果页则抽取事件
// 返回：{ ok, url, title, rawText, data?: {carrierName, containerId, pageKind, resubmitted, events, partial}, error? }
async function resolveLanding(page, query) {
  let snap = await snapshotPage(page);
  let kind = await classifyLandingPage(page, query);
  let resubmitted = false;

  if (kind === 'form') {
    logger.info(`落地页为表单页（${snap.url}），二次提交箱号重查`);
    await submitContainerForm(page, query);
    snap = await snapshotPage(page);
    kind = await classifyLandingPage(page, query);
    resubmitted = true;
    if (kind === 'result') {
      logger.info(`表单提交后返回结果页，提取事件`);
    } else if (kind === 'error') {
      logger.warn(`表单提交后后端返回临时错误/限流`);
    } else if (kind === 'no-match') {
      logger.info(`表单提交后返回无匹配结果`);
    } else {
      logger.warn(`表单提交后页面类型=${kind}，未提取到结果`);
    }
  }

  const host = (() => { try { return new URL(snap.url).hostname.replace(/^www\./, ''); } catch (_) { return null; } })();

  if (kind === 'result') {
    const events = await extractContainerEvents(page, query);
    logger.info(`落地页为结果页（${host}），通用抽取事件数=${events.length}`);
    return {
      ok: true,
      url: snap.url,
      title: snap.title,
      rawText: snap.rawText,
      data: {
        carrierName: host,
        containerId: query,
        pageKind: 'result',
        resubmitted,
        events,
        partial: events.some((e) => e.partial),
      },
    };
  }

  if (kind === 'no-match') {
    logger.info(`落地页明确无匹配（${host}），查询成功但该箱号无数据`);
    return {
      ok: true,
      url: snap.url,
      title: snap.title,
      rawText: snap.rawText,
      data: {
        carrierName: host,
        containerId: query,
        pageKind: 'no-match',
        resubmitted,
        events: [],
        partial: false,
      },
    };
  }

  const msg = (() => {
    if (kind === 'login') return `承运商站点要求登录（${host}），无法取得轨迹数据`;
    if (kind === 'error') return `承运商站点后端临时错误/限流（${host}）：${(snap.rawText.match(BACKEND_ERROR_RE) || [''])[0]}`;
    if (kind === 'form') return `承运商站点（${host}）提交查询后未返回结果，可能需登录或该箱号无公开数据`;
    return `跳转后页面布局未识别（host: ${host}），未提取到轨迹数据`;
  })();

  return {
    ok: false,
    url: snap.url,
    title: snap.title,
    rawText: snap.rawText,
    error: msg,
    data: null,
  };
}

module.exports = {
  snapshotPage,
  classifyLandingPage,
  submitContainerForm,
  extractContainerEvents,
  resolveLanding,
  EVENT_KEYWORDS,
  LOCATION_KEYWORDS,
};
