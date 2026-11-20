const BaseAdapter = require('./base');
const { launchBrowser } = require('../core/browser');
const { QUERY_TYPES, CARRIERS } = require('../core/types');
const { DOWJONES_CONFIG } = require('../config/dowjones');
const { defaultLogger } = require('../utils/logger');

const logger = defaultLogger.child('adapter:dowjones');

// 站点跳转链路（SSO → oauthcallback → SPA 搜索页）偶发缓慢。
// 项目约定：站点不可达时等待不超过 60s，超时走 Bing 兜底（tracker 层处理）。
const NAV_TIMEOUT = 60000;

// Dow Jones RiskCenter 名单筛查适配器（制裁 / PEP / 高风险人物·实体）。
// 该站为付费订阅服务，全部查询需先经 Dow Jones SSO 登录（探测确认 /search/simple
// 未登录会被 OAuth 重定向至 sso.accounts.dowjones.com）。凭据经 .env 提供；
// 未配置时返回 requires_login，不假装可查。
class DowJonesRiskAdapter extends BaseAdapter {
  constructor() {
    super(CARRIERS.DOWJONES_RISK, { supportedTypes: [QUERY_TYPES.ROSTER] });
  }

  async trackRoster(name, options = {}) {
    const headless = options.headless ?? false;
    if (!DOWJONES_CONFIG.enabled) {
      return this.buildResult({
        success: false,
        queryType: QUERY_TYPES.ROSTER,
        query: name,
        hasResult: false,
        status: 'requires_login',
        data: {
          source: 'Dow Jones RiskCenter',
          name,
          entryUrl: DOWJONES_CONFIG.entryUrl,
        },
        issues: ['道琼斯风险中心为付费订阅服务，未配置 DOWJONES_USER/DOWJONES_PASS，请配置后查询或人工登录'],
      });
    }

    const { browser, context } = await launchBrowser({ headless });
    try {
      const page = await context.newPage();
      const ready = await this._openSearchReady(page);
      if (!ready) throw new Error('登录后搜索页未加载出搜索输入框（会话建立失败）');

      await this._search(page, name);
      const extracted = await this._extract(page, name);
      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.ROSTER,
        query: name,
        hasResult: true,
        status: 'ok',
        data: { source: 'Dow Jones RiskCenter', name, ...extracted },
      });
    } catch (e) {
      logger.error(`dowjones query failed`, e.message);
      return this.buildResult({
        success: false,
        queryType: QUERY_TYPES.ROSTER,
        query: name,
        hasResult: false,
        status: 'error',
        data: { source: 'Dow Jones RiskCenter', name },
        issues: [`查询失败: ${e.message}`],
      });
    } finally {
      await browser.close();
    }
  }

  /**
   * 名单批量查询：一次浏览器会话 + 一次 SSO 登录，逐项搜索提取。
   * 供调度层 roster 分发使用（options.batch=true），避免逐项重复登录触发 SSO 风控。
   * @returns {object} buildResult，data.items 为逐项结果 [{ raw, success, flags, results, ... }]
   */
  async trackRosterBatch(names, options = {}) {
    const headless = options.headless ?? false;
    const list = Array.isArray(names) ? names.filter(Boolean) : [names];
    const items = [];
    const fail = (n, status, issues, error) =>
      items.push({ raw: n, success: false, status, issues, error });

    if (!DOWJONES_CONFIG.enabled) {
      for (const n of list) {
        fail(n, 'requires_login', ['道琼斯风险中心为付费订阅服务，未配置 DOWJONES_USER/DOWJONES_PASS']);
      }
      return this.buildResult({
        success: false,
        queryType: QUERY_TYPES.ROSTER,
        query: list.join(' | '),
        hasResult: false,
        status: 'requires_login',
        data: { source: 'Dow Jones RiskCenter', items },
      });
    }

    const { browser, context } = await launchBrowser({ headless });
    try {
      const page = await context.newPage();
      const ready = await this._openSearchReady(page);
      if (!ready) throw new Error('登录后搜索页未加载出搜索输入框（会话建立失败）');

      for (const n of list) {
        try {
          // 每项查询前重进搜索页，清空上一轮结果状态（SSO 会话已建立，无需重复登录）。
          // 重进偶发超时（SSO/oauthcallback 跳转慢），失败重试一次
          let reentered = false;
          for (let attempt = 0; attempt < 2 && !reentered; attempt++) {
            try {
              await page.goto(DOWJONES_CONFIG.entryUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
              reentered = await this._waitForSearchInput(page, 30000);
            } catch (e) {
              logger.warn(`dowjones batch re-enter attempt ${attempt + 1} failed: ${n}`, e.message);
            }
          }
          if (!reentered) {
            throw new Error('重进搜索页后未加载出搜索输入框');
          }
          await this._search(page, n);
          const extracted = await this._extract(page, n);
          items.push({ raw: n, success: true, status: 'ok', ...extracted });
        } catch (e) {
          logger.warn(`dowjones batch item failed: ${n}`, e.message);
          items.push({ raw: n, success: false, status: 'error', error: e.message });
        }
      }
      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.ROSTER,
        query: list.join(' | '),
        hasResult: items.some((i) => i.success),
        status: 'ok',
        data: { source: 'Dow Jones RiskCenter', items },
      });
    } catch (e) {
      logger.error('dowjones batch query failed', e.message);
      return this.buildResult({
        success: false,
        queryType: QUERY_TYPES.ROSTER,
        query: list.join(' | '),
        hasResult: false,
        status: 'error',
        data: { source: 'Dow Jones RiskCenter', items },
        issues: [`批量查询失败: ${e.message}`],
      });
    } finally {
      await browser.close();
    }
  }

  /**
   * 打开搜索页并保证 SSO 登录完成、SPA 渲染出搜索输入框。
   * SSO 表单由前端 JS 延迟渲染；OAuth 回调页 oauthcallback 也含 "riskcenter" 字样，
   * 不能依赖 URL 判断；超时则按"会话未建立"重登录一次。
   */
  async _openSearchReady(page) {
    await page.goto(DOWJONES_CONFIG.entryUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    const hasLogin = await this._waitForLoginForm(page, 15000);
    if (hasLogin) {
      await this._ssoLogin(page);
    }
    await page.goto(DOWJONES_CONFIG.entryUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    let inputReady = await this._waitForSearchInput(page, 30000);
    if (!inputReady) {
      logger.warn('dowjones search page not ready after re-entry, retry login once');
      const hasLogin2 = await this._waitForLoginForm(page, 15000);
      if (hasLogin2) {
        await this._ssoLogin(page);
        await page.goto(DOWJONES_CONFIG.entryUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
        inputReady = await this._waitForSearchInput(page, 30000);
      }
    }
    return inputReady;
  }

  /** 等待 Dow Jones SSO 登录表单出现（探测确认：#email + #password-form-item）。 */
  async _waitForLoginForm(page, timeoutMs = 15000) {
    try {
      await page.locator('#email, input[name="emailOrUserID"]').first().waitFor({ state: 'visible', timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  /** 等待搜索页输入框渲染（登录成功且 SPA 完成路由后的标志）。 */
  async _waitForSearchInput(page, timeoutMs = 30000) {
    try {
      await page
        .locator('input[name="name"], input[placeholder="输入名称"]')
        .first()
        .waitFor({ state: 'visible', timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  /** Dow Jones SSO 登录表单（选择器来自运行时探测：#email / #password-form-item / 登录按钮）。 */
  async _ssoLogin(page) {
    await page.waitForTimeout(2000);
    const email = page.locator('#email, input[name="emailOrUserID"]').first();
    if (await email.count()) {
      await email.fill(DOWJONES_CONFIG.user);
    }
    const pass = page.locator('#password-form-item, input[name="password"], input[type="password"]').first();
    if (await pass.count()) {
      await pass.fill(DOWJONES_CONFIG.pass);
    }
    const btn = page
      .locator('button[type="submit"], button:has-text("登录"), button:has-text("Log In"), button:has-text("Sign In")')
      .first();
    if (await btn.count()) {
      await btn.click();
    }
    // 等待离开 SSO 域进入 riskcenter（含 oauthcallback 中间态），超时不视为失败，
    // 后续重进搜索页 + 等待输入框会兜底
    try {
      await page.waitForURL((url) => url.hostname.includes('riskcenter'), { timeout: 25000 });
    } catch {}
    await page.waitForTimeout(3000);
    logger.info(`dowjones post-login url: ${page.url()}`);
  }

  /** 输入名称并触发搜索。选择器来自真实账号探测：input[name="name"] + 文本"搜索"按钮。 */
  async _search(page, name) {
    const input = page
      .locator('input[name="name"], input[placeholder="输入名称"], input[type="text"], input[type="search"], textarea')
      .first();
    // 搜索页为 SPA，等待输入框渲染（最长 15s）
    await input.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await input.count()) {
      await input.fill(name);
      // 提交：优先点击文本恰为"搜索"的按钮（避免误点"高级搜索"），否则 Enter 兜底
      const btn = page.locator('button', { hasText: /^搜索$/ }).first();
      if (await btn.count()) {
        await btn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(8000);
    } else {
      throw new Error('未找到搜索输入框（可能页面未加载或布局变化）');
    }
  }

  /**
   * 提取结果：解析结果表格行（档案ID/名称/国家/详情等列），按行内容判定
   * 制裁/PEP/负面新闻 标记，避免整页文本被页面筛选器 UI 标签（恒存在）污染。
   */
  async _extract(page, name) {
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const totalMatch = bodyText.match(/搜索结果已找到[:：]?\s*(\d+)|(\d+)\s*results? found/i);

    // 结果表列名别名（中英）
    const COLUMNS = {
      id: ['档案ID', 'Profile ID'],
      name: ['名称', 'Name'],
      gender: ['性别', 'Gender'],
      dob: ['出生日期', 'Date of Birth'],
      country: ['国家/地区', 'Country'],
      detail: ['详情', 'Details', 'Reason', 'Status'],
    };
    // 数据行分类码（Dow Jones RiskCenter 官方档案类型码，可组合，如 "AM OOL"、"SAN PEP"），
    // 表头对应列为空标题，位于行首 1~3 列内，分类码本身用于结果类型标记判定
    const CATEGORY_RE =
      /^(?:AM|OOL|SAN|PEP|SOC|RCA|ECR|OEL|SOR|BRD|SI)(?:\s*\+\s*|\s+)(?:AM|OOL|SAN|PEP|SOC|RCA|ECR|OEL|SOR|BRD|SI)|^(?:AM|OOL|SAN|PEP|SOC|RCA|ECR|OEL|SOR|BRD|SI)$/i;

    // 表格式结果页：解析表头列序 + 数据行（保留空单元格，避免性别/出生日期
    // 等空值被过滤后破坏列位对齐）
    let results = [];
    let tableFound = false;
    try {
      const rawRows = await page.locator('table tr').evaluateAll((trs) =>
        trs.map((tr) =>
          Array.from(tr.querySelectorAll('th, td')).map((c) =>
            (c.innerText || '').replace(/\s+/g, ' ').trim()
          )
        )
      );
      tableFound = rawRows.length > 0;
      if (tableFound) {
        const header = rawRows[0] || [];
        const colIdx = {};
        for (const [key, aliases] of Object.entries(COLUMNS)) {
          let idx = -1;
          for (const a of aliases) {
            idx = header.indexOf(a);
            if (idx >= 0) break;
          }
          colIdx[key] = idx;
        }
        const seen = new Set();
        for (const cells of rawRows.slice(1)) {
          if (!cells.length) continue;
          // 表头首列为空（分类码列标题空缺），数据行首部数格内包含分类码，
          // 直接按表头列序对齐
          const at = (i) => (i >= 0 && i < cells.length ? cells[i] : undefined);
          const tagCell = cells.slice(0, 3).find((c) => CATEGORY_RE.test(c));
          const row = {
            id: at(colIdx.id),
            name: at(colIdx.name),
            gender: at(colIdx.gender),
            dob: at(colIdx.dob),
            country: at(colIdx.country),
            detail: at(colIdx.detail),
            tags: tagCell || undefined,
          };
          if (!row.id && !row.name && !row.detail) continue;
          const key = [row.id, row.name, row.detail].join('|');
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(row);
        }
      }
    } catch {}

    // 结果行文本（行首分类码 + 数据行），据此判定类型标记
    const rowsText = results
      .map((r) => [r.tags, r.name, r.detail, r.country].filter(Boolean).join(' '))
      .join('\n')
      .toLowerCase();
    const flags = {
      sanctions: /sanction|ofac|sdn|specially designated|制裁|列入名单/.test(rowsText),
      pep: /\bpep\b|politically exposed|政治公众人物/.test(rowsText),
      adverseMedia: /adverse media|负面新闻|负面媒体/.test(rowsText),
      noResults: results.length === 0 && /没有结果|未找到|no results|0\s*(项|条)?\s*(结果|records)/i.test(bodyText),
    };

    return {
      flags,
      total: totalMatch ? Number(totalMatch[1] || totalMatch[2]) : (results.length || undefined),
      tableFound,
      results: results.slice(0, 30), // 分页未翻，最多取首页前 30 行
      snippet: bodyText.slice(0, 1500),
      note: '结果按列表首屏解析；全量结果存在分页时仅覆盖首页，请结合报告人工确认',
    };
  }
}

module.exports = { DowJonesRiskAdapter };
