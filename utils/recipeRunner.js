'use strict';

const fs = require('fs');
const path = require('path');

// 配方执行器：所有承运商适配器共用的确定性执行层。
// 设计原则：适配器 JS 里不出现选择器/URL 字面量，页面事实全部来自 config/recipes/{carrier}.json。
// 本文件不含任何 LLM 调用，也不 eval 配方内容。
const RECIPE_DIR = path.join(__dirname, '..', 'config', 'recipes');
const CACHE = new Map();

const REQUIRED_FIELDS = ['carrier', 'version', 'queryType', 'entry', 'result'];

// 值格式化器：配方里用字符串名引用，避免在 JSON 中写表达式
const FORMATTERS = {
  raw: v => String(v == null ? '' : v).trim(),
  compact: v => String(v == null ? '' : v).replace(/[\s-]/g, '').toUpperCase(),
  upper: v => String(v == null ? '' : v).trim().toUpperCase(),
  lower: v => String(v == null ? '' : v).trim().toLowerCase(),
  // 空运单：11 位数字转为 112-00966066 形式；其他原样返回
  awbDash: v => {
    const c = String(v == null ? '' : v).replace(/[\s-]/g, '');
    return /^\d{11}$/.test(c) ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
  },
  // 空运单前 3 位航司前缀（23512345678 → 235）
  awbPrefix: v => String(v == null ? '' : v).replace(/[\s-]/g, '').slice(0, 3),
  // 空运单后 8 位序号+校验位（23512345678 → 12345678）
  awbNumber: v => String(v == null ? '' : v).replace(/[\s-]/g, '').slice(3),
};

function recipeFile(carrierId) {
  return path.join(RECIPE_DIR, `${carrierId}.json`);
}

function validateRecipe(recipe, source) {
  const errors = [];
  for (const key of REQUIRED_FIELDS) {
    if (recipe[key] === undefined || recipe[key] === null || recipe[key] === '') {
      errors.push(`缺少必填字段 "${key}"`);
    }
  }
  if (recipe.entry && !recipe.entry.url) errors.push('entry.url 必须提供');
  if (recipe.result) {
    if (!['xhr', 'dom', 'url'].includes(recipe.result.mode)) {
      errors.push('result.mode 必须是 xhr / dom / url');
    }
    if (recipe.result.mode === 'xhr' && !recipe.result.xhr?.urlPattern) {
      errors.push('result.mode=xhr 时必须提供 result.xhr.urlPattern');
    }
  }
  for (const [key, name] of Object.entries(recipe.valueFormats || {})) {
    if (!FORMATTERS[name]) errors.push(`valueFormats.${key} 引用了未知格式化器 "${name}"`);
  }
  (recipe.steps || []).forEach((step, i) => {
    if (!step.action) {
      errors.push(`steps[${i}] 缺少 action`);
      return;
    }
    if (step.onFail && !step.onFail.action) errors.push(`steps[${i}] 的 onFail 缺少 action`);
    switch (step.action) {
      case 'fill':
      case 'setValue':
      case 'click':
      case 'press':
        if (!step.locator) errors.push(`steps[${i}] (${step.action}) 缺少 locator`);
        break;
      case 'invoke':
        if (!step.global) errors.push(`steps[${i}] (invoke) 缺少 global`);
        else if (!/^[A-Za-z_$][\w$]*$/.test(String(step.global))) {
          errors.push(`steps[${i}] (invoke) global 名称非法: ${step.global}`);
        }
        break;
      case 'captcha':
        if (!step.saveAs) errors.push(`steps[${i}] (captcha) 缺少 saveAs`);
        break;
      case 'wait':
        if (!Number.isFinite(step.ms)) errors.push(`steps[${i}] (wait) 缺少数字型 ms`);
        break;
      case 'waitForText':
        if (!Array.isArray(step.keywords) || !step.keywords.length) {
          errors.push(`steps[${i}] (waitForText) 缺少 keywords 数组`);
        }
        break;
      case 'waitInputValue':
        if (!Number.isFinite(step.minLength)) errors.push(`steps[${i}] (waitInputValue) 缺少数字型 minLength`);
        break;
      case 'scrollBottom':
        break;
      default:
        errors.push(`steps[${i}] 未知 action "${step.action}"`);
    }
  });
  if (errors.length) {
    throw new Error(`配方校验失败 ${source}:\n - ${errors.join('\n - ')}`);
  }
  return recipe;
}

function loadRecipe(carrierId, { reload = false } = {}) {
  if (!reload && CACHE.has(carrierId)) return CACHE.get(carrierId);
  const file = recipeFile(carrierId);
  if (!fs.existsSync(file)) throw new Error(`配方不存在: ${file}`);
  let recipe;
  try {
    recipe = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`配方 JSON 解析失败 ${file}: ${e.message}`);
  }
  validateRecipe(recipe, file);
  CACHE.set(carrierId, recipe);
  return recipe;
}

// 列出目录下全部配方（忽略 _ 开头的模板/草稿），校验失败的以 _error 返回，便于覆盖矩阵使用
function listRecipes() {
  if (!fs.existsSync(RECIPE_DIR)) return [];
  return fs.readdirSync(RECIPE_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => {
      const id = f.replace(/\.json$/, '');
      try {
        return loadRecipe(id);
      } catch (e) {
        return { carrier: id, _error: e.message };
      }
    });
}

function formatValue(value, formatterName = 'raw') {
  const fn = FORMATTERS[formatterName];
  if (!fn) throw new Error(`未知格式化器: ${formatterName}`);
  return fn(value);
}

function buildValues(inputs = {}, valueFormats = {}) {
  const out = {};
  for (const [key, value] of Object.entries(inputs)) {
    out[key] = formatValue(value, valueFormats[key] || 'raw');
  }
  // 派生键：valueFormats 里声明但 inputs 未提供的键，用第一个入参原值按各自格式化器派生
  // 例：number=compact + numberDash=awbDash，同一单号得到「07439882393」与「074-39882393」两版
  const baseKey = Object.keys(inputs)[0];
  const baseValue = baseKey === undefined ? undefined : inputs[baseKey];
  if (baseValue !== undefined) {
    for (const [key, formatter] of Object.entries(valueFormats)) {
      if (key in out) continue;
      out[key] = formatValue(baseValue, formatter);
    }
  }
  return out;
}

// 模板渲染：{key} 替换为 values[key]（URL 编码）
function renderTemplate(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`模板变量缺失: {${key}}`);
    return encodeURIComponent(values[key]);
  });
}

function pickPath(obj, dottedPath) {
  if (!dottedPath) return obj;
  return String(dottedPath).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function matchesPredicates(obj, predicates) {
  if (!Array.isArray(predicates) || !predicates.length) return !!obj;
  return predicates.every(p => {
    const actual = pickPath(obj, p.path);
    const op = p.op || (p.equals !== undefined ? 'equals' : p.truthy !== undefined ? 'truthy' : 'nonEmpty');
    switch (op) {
      case 'equals': return actual === p.equals;
      case 'notEquals': return actual !== p.equals;
      case 'nonEmpty': return actual !== undefined && actual !== null && String(actual).length > 0;
      case 'truthy': return !!actual;
      case 'falsy': return !actual;
      default: return false;
    }
  });
}

// 监听匹配的 XHR/fetch 响应，按 successWhen 判定成功并提取 dataPath。
// 返回的 state 由调用方在每次重试前清空 payload/error。
function attachXhrWatcher(page, xhrSpec = {}) {
  const state = { payload: null, data: null, error: null, matchedUrl: null, status: null, notFound: false };
  if (!xhrSpec || !xhrSpec.urlPattern) return state;
  const pattern = new RegExp(xhrSpec.urlPattern);
  page.on('response', async (res) => {
    try {
      if (!pattern.test(res.url())) return;
      if (xhrSpec.method && res.request().method() !== xhrSpec.method) return;
      const status = res.status();
      state.status = status;
      state.matchedUrl = res.url();

      // 业务性「无此单」状态码（如 AFKL 的 412/404）单独标记，不当作渠道故障
      if (Array.isArray(xhrSpec.notFoundStatus) && xhrSpec.notFoundStatus.includes(status)) {
        state.payload = null;
        state.notFound = true;
        return;
      }
      if (Array.isArray(xhrSpec.acceptStatus) && !xhrSpec.acceptStatus.includes(status)) {
        if (!state.payload) state.error = `接口返回 HTTP ${status}`;
        return;
      }

      const text = await res.text().catch(() => null);
      // 部分站点用「HTTP 200 + 空响应体」表示无此单（如 MASkargo），由配方显式声明
      if (xhrSpec.emptyBodyMeansNoData && text != null && !String(text).trim()) {
        state.payload = null;
        state.notFound = true;
        return;
      }
      let json = null;
      try {
        json = text == null || !String(text).trim() ? null : JSON.parse(text);
      } catch (_) {
        json = null;
      }
      if (json == null) {
        if (!state.payload) state.error = `接口响应不是 JSON（HTTP ${status}）`;
        return;
      }
      if (matchesPredicates(json, xhrSpec.successWhen)) {
        state.payload = json;
        state.data = pickPath(json, xhrSpec.dataPath);
      } else if (!state.payload) {
        state.error = pickPath(json, xhrSpec.errorMessagePath) || `接口返回非成功状态`;
      }
    } catch (_) {
      // 忽略无法读取的响应（如风控挑战页）
    }
  });
  return state;
}

// 定位器解析：按 role → label → placeholder → text → css[] 顺序降级，返回命中层级与全部尝试记录
async function resolveLocator(page, spec, { timeoutMs = 2500 } = {}) {
  const attempts = [];
  if (!spec) return { locator: null, layer: null, attempts: ['未提供定位器'] };

  const tryLocator = async (layer, factory) => {
    try {
      const locator = factory().first();
      const count = await locator.count().catch(() => 0);
      if (!count) { attempts.push(`${layer}: 未匹配`); return null; }
      const visible = await locator.isVisible({ timeout: timeoutMs }).catch(() => false);
      if (!visible) { attempts.push(`${layer}: 不可见`); return null; }
      attempts.push(`${layer}: 命中`);
      return { locator, layer, attempts };
    } catch (e) {
      attempts.push(`${layer}: ${String(e.message).slice(0, 80)}`);
      return null;
    }
  };

  if (spec.role) {
    const hit = await tryLocator(`role(${spec.role.type}:${spec.role.name})`,
      () => page.getByRole(spec.role.type, { name: spec.role.name, exact: false }));
    if (hit) return hit;
  }
  if (spec.label) {
    const hit = await tryLocator(`label(${spec.label})`,
      () => page.getByLabel(spec.label, { exact: false }));
    if (hit) return hit;
  }
  if (spec.placeholder) {
    const hit = await tryLocator(`placeholder(${spec.placeholder})`,
      () => page.getByPlaceholder(spec.placeholder, { exact: false }));
    if (hit) return hit;
  }
  if (spec.text) {
    const hit = await tryLocator(`text(${spec.text})`,
      () => page.getByText(spec.text, { exact: false }));
    if (hit) return hit;
  }
  for (const css of spec.css || []) {
    const hit = await tryLocator(`css(${css})`, () => page.locator(css));
    if (hit) return hit;
  }
  return { locator: null, layer: null, attempts };
}

function resolveStepValue(step, values) {
  if (step.valueFrom) {
    if (!(step.valueFrom in values)) throw new Error(`步骤引用了未提供的值 "${step.valueFrom}"`);
    return values[step.valueFrom];
  }
  return formatValue(step.value, step.format || 'raw');
}

async function runStep(page, step, values, ctx) {
  switch (step.action) {
    case 'captcha': {
      if (typeof ctx.onCaptcha !== 'function') throw new Error('未提供 onCaptcha 处理器');
      const text = await ctx.onCaptcha(step);
      if (!text) throw new Error('验证码识别结果为空');
      values[step.saveAs] = text;
      return { detail: `${step.saveAs}=${text}` };
    }
    case 'wait': {
      await page.waitForTimeout(step.ms);
      return { detail: `${step.ms}ms` };
    }
    case 'waitForText': {
      const found = await waitForText(page, step.keywords, {
        timeoutMs: step.timeoutMs || 15000,
        intervalMs: step.intervalMs || 1000,
        mode: step.mode || 'some',
      });
      if (!found.text) throw new Error(`未等到关键词: ${step.keywords.join(' / ')}`);
      return { detail: '关键词已出现' };
    }
    case 'waitInputValue': {
      const minLength = step.minLength || 1;
      const ok = await page.waitForFunction(
        (n) => Array.from(document.querySelectorAll('input,textarea'))
          .some((el) => String(el.value || '').length >= n),
        minLength,
        { timeout: step.timeoutMs || 10000 }
      ).then(() => true).catch(() => false);
      if (!ok) throw new Error(`等待输入框预填超时（长度需 >= ${minLength}）`);
      return { detail: `value>=${minLength}` };
    }
    case 'scrollBottom': {
      const times = step.times || 3;
      const intervalMs = step.intervalMs || 1500;
      for (let i = 0; i < times; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
        await page.waitForTimeout(intervalMs);
      }
      if (step.backToTop !== false) {
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await page.waitForTimeout(step.topSettleMs || 500);
      }
      return { detail: `scrollBottom x${times}` };
    }
    case 'fill':
    case 'setValue': {
      const value = resolveStepValue(step, values);
      const hit = await resolveLocator(page, step.locator);
      if (!hit.locator) throw new Error(`定位器未命中: ${hit.attempts.join(' / ')}`);
      if (step.action === 'fill') {
        await hit.locator.fill(String(value));
      } else {
        await hit.locator.evaluate((el, payload) => {
          el.value = payload.value;
          for (const evt of payload.events) el.dispatchEvent(new Event(evt, { bubbles: true }));
        }, { value: String(value), events: step.dispatch || ['input', 'change'] });
      }
      return { layer: hit.layer };
    }
    case 'click': {
      const hit = await resolveLocator(page, step.locator);
      if (!hit.locator) throw new Error(`定位器未命中: ${hit.attempts.join(' / ')}`);
      await hit.locator.click({ force: step.force !== false });
      return { layer: hit.layer };
    }
    case 'press': {
      const hit = await resolveLocator(page, step.locator);
      if (!hit.locator) throw new Error(`定位器未命中: ${hit.attempts.join(' / ')}`);
      await hit.locator.press(step.key || 'Enter');
      return { layer: hit.layer };
    }
    case 'invoke': {
      const name = String(step.global);
      const called = await page.evaluate((fnName) => {
        if (typeof window[fnName] === 'function') { window[fnName](); return true; }
        return false;
      }, name).catch(() => false);
      if (called) return { detail: `window.${name}()` };
      if (step.fallback) {
        const hit = await resolveLocator(page, step.fallback);
        if (!hit.locator) throw new Error(`window.${name} 不存在，且兜底定位器未命中: ${hit.attempts.join(' / ')}`);
        await hit.locator.click({ force: true });
        return { layer: hit.layer, detail: 'fallback click' };
      }
      throw new Error(`window.${name} 不存在且未配置 fallback`);
    }
    default:
      throw new Error(`未知 action "${step.action}"`);
  }
}

// 顺序执行步骤；失败时抛出带 stepIndex/trace 的错误，便于定位"配方哪一步失效"。
// 步骤可声明 onFail 作为单步兜底（如按钮点不到时改按回车）。
async function runSteps(page, steps, values, ctx = {}) {
  const trace = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let result;
    let failure;
    try {
      result = await runStep(page, step, values, ctx);
    } catch (e) {
      failure = e;
    }
    if (failure && step.onFail) {
      try {
        result = await runStep(page, step.onFail, values, ctx);
        result = { ...result, detail: `${result.detail || ''} (onFail: ${step.onFail.action})`.trim() };
        failure = null;
      } catch (e2) {
        failure = new Error(`${failure.message}；兜底 ${step.onFail.action} 也失败: ${e2.message}`);
      }
    }
    if (failure) {
      if (step.optional) {
        const entry = { index: i, action: step.action, ok: false, skipped: true, error: failure.message };
        trace.push(entry);
        if (typeof ctx.onStep === 'function') ctx.onStep(entry);
        continue;
      }
      const entry = { index: i, action: step.action, ok: false, error: failure.message };
      trace.push(entry);
      const err = new Error(`step=${i}(${step.action}) 失败: ${failure.message}`);
      err.stepIndex = i;
      err.trace = trace;
      throw err;
    }
    const entry = { index: i, action: step.action, ok: true, ...result };
    trace.push(entry);
    if (typeof ctx.onStep === 'function') ctx.onStep(entry);
    if (step.waitAfter) await page.waitForTimeout(step.waitAfter);
  }
  return trace;
}

async function waitForText(page, keywords, { timeoutMs = 15000, intervalMs = 1000, mode = 'some' } = {}) {
  const list = Array.isArray(keywords) ? keywords : [keywords];
  const deadline = Date.now() + timeoutMs;
  let text = '';
  while (Date.now() < deadline) {
    text = await page.locator('body').innerText().catch(() => '');
    const matched = mode === 'every'
      ? list.length > 0 && list.every(k => text.includes(k))
      : list.some(k => text.includes(k));
    if (matched) return { text, matched: true };
    await page.waitForTimeout(intervalMs);
  }
  return { text, matched: false };
}

async function checkDomResult(page, spec = {}) {
  // 部分站点（如 COSCO）把结果渲染在 iframe 里，主文档 body 只有导航与页脚，需连同子 frame 一起检查
  const texts = [await page.locator('body').innerText().catch(() => '')];
  if (spec.checkFrames !== false) {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      const text = await frame.locator('body').innerText().catch(() => '');
      if (text) texts.push(text);
    }
  }

  const successKeywords = spec.successKeywords || [];
  const noDataKeywords = spec.noDataKeywords || [];
  const matchMode = spec.match === 'some' ? 'some' : 'every';
  const hit = (text, keywords) => keywords.length > 0 && (matchMode === 'some'
    ? keywords.some(k => text.includes(k))
    : keywords.every(k => text.includes(k)));

  for (const text of texts) {
    if (hit(text, successKeywords)) return { kind: 'success', text };
  }
  for (const text of texts) {
    if (hit(text, noDataKeywords)) return { kind: 'nodata', text };
  }
  return { kind: 'none', text: texts[0] };
}

// 按配方声明关闭弹窗（Cookie / 地区选择等）；逐个尝试，找不到就跳过
async function dismissPopups(page, popups = []) {
  for (const spec of popups) {
    const hit = await resolveLocator(page, spec, { timeoutMs: 1500 });
    if (!hit.locator) continue;
    await hit.locator.click({ force: true }).catch(() => {});
    if (spec.waitAfter) await page.waitForTimeout(spec.waitAfter);
  }
}

// 等待结果：xhr 优先，domFallback 兜底
async function waitForResult(page, resultSpec, xhrState) {
  const wait = resultSpec.wait || {};
  const timeoutMs = wait.timeoutMs || 15000;
  const intervalMs = wait.intervalMs || 1500;
  const deadline = Date.now() + timeoutMs;
  const startedAt = Date.now();
  const noDataGraceMs = resultSpec.noDataGraceMs || 0;

  while (Date.now() < deadline) {
    if (xhrState.payload) return { kind: 'xhr', payload: xhrState.payload, data: xhrState.data };
    if (xhrState.notFound) return { kind: 'notfound', status: xhrState.status };
    if (xhrState.error) return { kind: 'error', error: xhrState.error };
    if (resultSpec.domFallback) {
      const dom = await checkDomResult(page, resultSpec.domFallback);
      if (dom.kind === 'success') return { kind: 'dom', text: dom.text };
      // 明确的无数据提示：提前返回，不再空等超时（可用 noDataGraceMs 延后判定，避免误伤页面静态文案）
      if (dom.kind === 'nodata' && Date.now() - startedAt >= noDataGraceMs) {
        return { kind: 'nodata', text: dom.text };
      }
    }
    await page.waitForTimeout(intervalMs);
  }
  if (xhrState.payload) return { kind: 'xhr', payload: xhrState.payload, data: xhrState.data };
  if (xhrState.notFound) return { kind: 'notfound', status: xhrState.status };
  if (xhrState.error) return { kind: 'error', error: xhrState.error };
  const dom = await checkDomResult(page, resultSpec.domFallback || {});
  return { kind: 'none', dom };
}

module.exports = {
  RECIPE_DIR,
  FORMATTERS,
  recipeFile,
  validateRecipe,
  loadRecipe,
  listRecipes,
  formatValue,
  buildValues,
  renderTemplate,
  matchesPredicates,
  attachXhrWatcher,
  resolveLocator,
  runSteps,
  waitForText,
  checkDomResult,
  dismissPopups,
  waitForResult,
};
