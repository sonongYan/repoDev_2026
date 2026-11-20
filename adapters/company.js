const { execFile } = require('child_process');
const { promisify } = require('util');

const BaseAdapter = require('./base');
const { launchBrowser } = require('../core/browser');
const { QUERY_TYPES, CARRIERS } = require('../core/types');
const { COMPANY_CLI } = require('../config/company');
const { bingSearch } = require('../utils/bing');
const { withRetry } = require('../utils/retry');
const { parseCompanyCli } = require('../parsers/company_cli');
const { scoreRegistration, buildOverseasResult } = require('../utils/overseas');
const { defaultLogger } = require('../utils/logger');

const execFileAsync = promisify(execFile);
const logger = defaultLogger.child('adapter:company');

// Bing 结果中不应被当作"官网"的平台/聚合域
const SKIP_HOSTS = /bing\.com|baidu\.com|qcc\.com|qixin\.com|tianyancha\.com|aiqicha\.baidu\.com|sogou\.com|so\.com|zhihu\.com|163\.com|sina\.com|qq\.com|zhongbao|caixin|jiemian|thepaper|wallstreetcn|tianyancha\.com|qichacha\.com/;

// 注册地线索的关键词模式（中文 + 英文）
const REGISTRATION_PATTERNS = [
  /总部(?:位于|设在|在)\s*[^\s，。,.]{2,16}/,
  /注册(?:于|地址|地)\s*[^\s，。,.]{2,16}/,
  /成立(?:于|在)\s*[^\s，。,.]{2,12}/,
  /headquartered in\s+[A-Za-z ,]{2,40}/i,
  /(?:incorporated|registered|founded) in\s+[A-Za-z ,]{2,40}/i,
  /based in\s+[A-Za-z ,]{2,40}/i,
  /HQ in\s+[A-Za-z ]{2,20}/i,
];

// 中国大陆地点（判定"国内主体"）
const MAINLAND_PLACES = [
  '中国', '上海', '北京', '深圳', '广州', '杭州', '苏州', '成都', '重庆', '武汉',
  '南京', '天津', '青岛', '大连', '厦门', '宁波', '无锡', '东莞', '佛山', '长沙',
  'China', 'Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Suzhou',
  'Chengdu', 'Wuhan', 'Nanjing', 'Tianjin', 'Qingdao', 'Xiamen', 'Ningbo',
];

// 境外地点（判定"海外主体"）
const OVERSEAS_PLACES = [
  '新加坡', '美国', '英国', '德国', '法国', '日本', '韩国', '荷兰', '瑞士',
  '澳大利亚', '加拿大', '马来西亚', '越南', '泰国', '印度', '阿联酋', '迪拜',
  '香港', '澳门', '台湾', '开曼', '百慕大', '英属维尔京', 'BVI', '丹麦', '哥本哈根',
  '挪威', '瑞典', '芬兰', '意大利', '西班牙', '俄罗斯', '巴西', '墨西哥', '南非',
  '沙特', '卡塔尔', '科威特', '阿曼', '印度尼西亚', '菲律宾', '新西兰', '爱尔兰',
  '比利时', '卢森堡', '奥地利', '波兰', '捷克', '土耳其', '以色列', '埃及',
  'Singapore', 'United States', 'USA', 'UK', 'Germany', 'France', 'Japan',
  'Korea', 'Netherlands', 'Switzerland', 'Australia', 'Canada', 'Malaysia',
  'Vietnam', 'Thailand', 'India', 'Dubai', 'UAE', 'Hong Kong', 'Cayman',
  'Bermuda', 'British Virgin', 'Denmark', 'Copenhagen', 'Norway', 'Sweden',
  'Finland', 'Italy', 'Spain', 'Russia', 'Brazil', 'Mexico', 'South Africa',
  'Saudi', 'Qatar', 'Indonesia', 'Philippines', 'New Zealand', 'Ireland',
  'Belgium', 'Luxembourg', 'Austria', 'Poland', 'Czech', 'Turkey', 'Israel', 'Egypt',
];

class CompanyAdapter extends BaseAdapter {
  constructor() {
    super(CARRIERS.COMPANY_GENERIC, { supportedTypes: [QUERY_TYPES.COMPANY] });
  }

  /**
   * 公司尽调主入口（两阶段）：
   *  Stage 1  国内工商注册查询（企查查/天眼查 CLI，COMPANY_CLI_CMD）。
   *           查到完整工商信息 → 判定国内主体，直接深挖。
   *  Stage 2  Bing 线索发现：搜公司名 → 找官网域名 → site: 二搜 → 提取注册地线索。
   *           供后续海外注册地路径（ACRA/CR/OpenCorporates 等）使用。
   */
  async trackCompany(name, options = {}) {
    const headless = options.headless ?? false;
    const sections = Array.isArray(options.sections) ? options.sections : [];
    logger.info(`公司尽调: ${name}${sections.length ? `（指定段：${sections.join('/')}）` : ''}`);

    // Stage 1：国内工商注册查询 + 深挖（CLI 命中且解析出数据 → 直接判定国内主体）
    const qcc = await this._queryDomesticRegistry(name, sections);
    const dive = qcc.success ? this._mergeDive(qcc.parts || { basic: qcc.stdout }) : null;
    if (dive && (dive.hasData || this._looksLikeDomestic(qcc.stdout))) {
      const shareholders = dive.shareholders.length;
      const riskCount = dive.judicialRisk.count + dive.abnormal.count;
      logger.info(`国内主体命中（工商+深挖）: ${name} 股东=${shareholders} 风险=${riskCount}`);
      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.COMPANY,
        query: name,
        hasResult: true,
        data: {
          companyName: name,
          domestic: true,
          depth: 'domestic-registry',
          sections,
          qcc: {
            basic: dive.basic,
            shareholders: dive.shareholders,
            investments: dive.investments,
            judicialRisk: dive.judicialRisk,
            abnormal: dive.abnormal,
          },
          diveSummary: { shareholderCount: shareholders, riskCount },
          bing: null,
          note: sections.length
            ? `按邮件指定段返回（${sections.join('、')}）；国内工商信息完整`
            : '国内工商信息完整，股权/司法/经营风险已深挖',
        },
      });
    }

    // Stage 2：Bing 线索发现
    const bing = await this._bingClueDiscovery(name, headless);
    const domestic = bing.registrationHint ? this._judgeRegistration(bing.registrationHint) : null;

    // Stage 3：海外主体 → 判定注册地 → 官方注册机构入口（ACRA/ICRIS/gcis/BVIFSC）
    // 触发条件：国内工商未命中，且（Bing 明确境外 或 注册地官方机构命中——后者即为境外强信号）
    const overseas =
      domestic === false || (domestic == null && bing.registry)
        ? buildOverseasResult(bing.registry, name)
        : null;

    return this.buildResult({
      success: true,
      queryType: QUERY_TYPES.COMPANY,
      query: name,
      hasResult: !!(bing.officialDomain || bing.registrationHint || bing.topResults.length),
      data: {
        companyName: name,
        domestic,
        depth: overseas ? 'overseas-registry' : 'clue-discovery',
        sections,
        qcc,
        bing,
        overseas,
        note: [
          qcc.status === 'cli_failed'
            ? '企查查渠道故障（CLI 全部命令执行失败，未取得工商数据）；Bing 线索结果仅供参考，需人工核验'
            : null,
          qcc.status === 'partial' ? '企查查部分命令执行失败，工商数据不完整' : null,
          overseas
            ? `境外主体，注册地判定为${overseas.registryName}，请前往官方注册机构完成查册`
            : domestic === false
              ? '国内工商未命中，Bing 线索提示为境外主体但注册地无法确认，建议补充公司全称/域名/注册号'
              : domestic === true
                ? 'Bing 线索提示为国内主体，但国内工商注册未命中，建议人工核对公司全称'
                : '未找到可靠注册地线索，建议补充公司全称/域名/注册号后再查',
        ]
          .filter(Boolean)
          .join('；'),
      },
    });
  }

  /**
   * Stage 1：经本地 CLI（qcc-agent-cli 等）查询国内工商。
   * sections 为空 → 执行全部三条命令（工商/股东/风险，默认行为，向后兼容）；
   * sections 指定段 → 仅执行命中的命令：
   *   basic/investments → basic 命令；shareholders → shareholders 命令；
   *   judicial/abnormal → risk 命令。
   */
  async _queryDomesticRegistry(name, sections = []) {
    if (!COMPANY_CLI.enabled) {
      return { success: false, status: 'not_configured', stdout: '', parts: {}, error: '未配置 COMPANY_CLI_CMD（qcc-agent-cli）' };
    }
    const want = new Set(sections);
    const needBasic = want.size === 0 || want.has('basic') || want.has('investments');
    const needShareholders = want.size === 0 || want.has('shareholders');
    const needRisk = want.size === 0 || want.has('judicial') || want.has('abnormal');

    const tasks = [];
    if (needBasic) tasks.push({ key: 'basic', cmd: COMPANY_CLI.cmd });
    if (needShareholders) tasks.push({ key: 'shareholders', cmd: COMPANY_CLI.shareholderCmd });
    if (needRisk) tasks.push({ key: 'risk', cmd: COMPANY_CLI.riskCmd });
    const runnable = tasks.filter((t) => t.cmd);

    const parts = {};
    const failed = [];
    for (const t of runnable) {
      // 含空格的名称需加引号（Windows cmd / 多数 CLI 均如此），避免被拆成多个参数
      const safeName = /\s/.test(name) ? `"${name}"` : name;
      const cmd = t.cmd.replace(/\{name\}/g, safeName);
      logger.info(`company cli [${t.key}]: ${cmd}`);
      try {
        // CLI 命令失败（非零退出/超时）按 COMPANY_CLI_RETRIES 重试；重试耗尽仍失败才计入 failed
        const { stdout } = await withRetry(
          () =>
            execFileAsync(cmd, {
              shell: true, // 仅限用户在 .env 中显式配置的本地受信命令
              timeout: COMPANY_CLI.timeoutMs,
              maxBuffer: 10 * 1024 * 1024,
            }),
          { label: `qcc-cli [${t.key}]`, retries: COMPANY_CLI.retries, delayMs: COMPANY_CLI.retryDelayMs }
        );
        parts[t.key] = stdout;
      } catch (e) {
        logger.warn(`company cli [${t.key}] failed`, e.message);
        failed.push(`${t.key}: ${e.message}`);
        parts[t.key] = '';
      }
    }
    // 渠道故障：所有命令均未执行成功（CLI 未初始化 / 权限被拦等）。
    // 必须如实返回 success=false + status/error，不得伪装成"查询成功但无数据"，
    // 否则报告层会把渠道故障误报为正常无命中（与 Dow Jones 会话失败同类问题）。
    if (runnable.length && failed.length === runnable.length) {
      return {
        success: false,
        status: 'cli_failed',
        stdout: '',
        parts,
        error: `企查查 CLI 全部命令执行失败: ${failed.join('; ')}`,
      };
    }
    return {
      success: true,
      status: failed.length ? 'partial' : 'ok',
      stdout: Object.values(parts).join('\n'),
      parts,
      error: failed.length ? failed.join('; ') : null,
    };
  }

  /** 合并多条 CLI 输出为统一深挖结构（各命令各自解析，维度按 股东>基础、风险>基础 覆盖）。 */
  _mergeDive(parts) {
    const base = parseCompanyCli(parts.basic || '');
    const shares = parseCompanyCli(parts.shareholders || '');
    const risk = parseCompanyCli(parts.risk || '');
    return {
      hasData: base.hasData || shares.hasData || risk.hasData,
      basic: base.basic,
      shareholders: shares.shareholders.length ? shares.shareholders : base.shareholders,
      investments: base.investments,
      judicialRisk: risk.judicialRisk.present ? risk.judicialRisk : base.judicialRisk,
      abnormal: risk.abnormal.present ? risk.abnormal : base.abnormal,
    };
  }

  /** 判断 CLI 输出是否构成"完整工商信息"（国内主体判定依据）。 */
  _looksLikeDomestic(stdout) {
    const text = String(stdout || '');
    if (!text) return false;
    // 统一社会信用代码（18 位）或注册地址含中国省市 → 大概率国内主体
    if (/[0-9A-Z]{18}/.test(text)) return true;
    if (MAINLAND_PLACES.some((p) => text.includes(p))) return true;
    // 工商要素齐全（法人/注册资本/成立日期 等关键词出现 ≥2）
    const keys = ['法定代表人', '注册资本', '成立日期', '经营范围', '统一社会信用代码', 'registered capital', 'legal representative'];
    return keys.filter((k) => text.includes(k)).length >= 2;
  }

  /** Stage 2：Bing 线索发现。主搜公司名 → 找官网域 → site: 二搜补注册地线索 → 注册地官方机构三搜。 */
  async _bingClueDiscovery(name, headless) {
    const { browser, context } = await launchBrowser({ headless });
    const page = await context.newPage();
    try {
      const topResults = await bingSearch(page, name);
      let officialDomain = this._extractOfficialDomain(topResults, name);
      let registrationHint = this._findRegistrationHint(topResults);
      let second = [];

      if (officialDomain) {
        second = await bingSearch(page, `site:${officialDomain} ${name}`);
        officialDomain = this._extractOfficialDomain(second, name) || officialDomain;
        if (!registrationHint) registrationHint = this._findRegistrationHint(second);
      }

      // 注册地官方机构线索：ACRA / ICRIS / gcis / BVIFSC（海外主体判定用）
      const third = await bingSearch(page, `${name} ICRIS OR ACRA OR BVIFSC OR 商工登记 OR 公司注册处`);
      const allResults = topResults.concat(second, third);
      if (!registrationHint) registrationHint = this._findRegistrationHint(allResults);
      const registry = scoreRegistration(allResults);

      return {
        queries: [name, officialDomain ? `site:${officialDomain} ${name}` : null, '注册地官方机构线索搜索'].filter(Boolean),
        officialDomain,
        registrationHint,
        registry, // { code, name, score, official } 或 null
        topResults,
        note: registry
          ? `疑似注册地: ${registry.name}（官方机构: ${registry.official.name}）`
          : officialDomain
            ? `疑似官网: ${officialDomain}`
            : '未识别到官网域名',
      };
    } finally {
      await browser.close();
    }
  }

  async _bingSearch(page, q) {
    return bingSearch(page, q);
  }

  /** 从搜索结果中识别疑似官网域名（公司名拉丁化片段匹配优先，其次企业级 TLD 域名）。 */
  _extractOfficialDomain(results, name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    for (const r of results) {
      let host;
      try {
        host = new URL(r.url).hostname.replace(/^www\./, '');
      } catch (_) {
        continue;
      }
      if (SKIP_HOSTS.test(host)) continue;
      const text = `${r.title} ${r.snippet}`.toLowerCase();
      if (slug.length >= 3 && (host.includes(slug) || text.includes('official'))) return host;
    }
    // 兜底：企业级 TLD 的非聚合域
    for (const r of results) {
      let host;
      try {
        host = new URL(r.url).hostname.replace(/^www\./, '');
      } catch (_) {
        continue;
      }
      if (SKIP_HOSTS.test(host)) continue;
      if (/\.(com|cn|net|io|co|com\.sg|com\.hk|sg|de|uk|jp|in)$/.test(host)) return host;
    }
    return null;
  }

  /** 从标题/摘要扫描"总部/注册地/成立地"线索；无模式命中时兜底直接提及的地点词（低置信）。 */
  _findRegistrationHint(results) {
    for (const r of results) {
      const text = `${r.title} ${r.snippet}`;
      for (const re of REGISTRATION_PATTERNS) {
        const m = text.match(re);
        if (m) {
          return { hint: m[0].trim(), sourceTitle: r.title, sourceUrl: r.url };
        }
      }
    }
    // 兜底：直接出现的地点词（置信度较低，交由报告层/LMM 判断）
    for (const r of results) {
      const text = `${r.title} ${r.snippet}`;
      for (const p of [...MAINLAND_PLACES, ...OVERSEAS_PLACES]) {
        if (text.includes(p)) {
          return { hint: p, lowConfidence: true, sourceTitle: r.title, sourceUrl: r.url };
        }
      }
    }
    return null;
  }

  /** 依据注册地线索判定国内/海外主体。 */
  _judgeRegistration(hint) {
    const text = hint.hint;
    if (MAINLAND_PLACES.some((p) => text.includes(p))) return true;
    if (OVERSEAS_PLACES.some((p) => text.includes(p))) return false;
    return null;
  }
}

module.exports = CompanyAdapter;
