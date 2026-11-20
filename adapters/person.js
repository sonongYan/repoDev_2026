const BaseAdapter = require('./base');
const { launchBrowser } = require('../core/browser');
const { QUERY_TYPES, CARRIERS } = require('../core/types');
const { bingSearch } = require('../utils/bing');
const { defaultLogger } = require('../utils/logger');

const logger = defaultLogger.child('adapter:person');

// 关联公司 / 职位线索
const ROLE_PATTERNS = /(?:担任|任职|现任|曾任|兼任|创始人|联合创始人|董事长|副董事长|CEO|首席执行|总裁|总经理|副总经理|董事|监事|股东|法定代表人|法人代表|高管)/;

// 司法涉诉 / 风险线索
const RISK_PATTERNS = /(?:法院|判决|裁判文书|被执行|失信|限制消费|限高|立案|案件|诉讼|开庭|起诉|被告|原告|仲裁|冻结|处罚|调查|通缉|在逃|刑拘|逮捕)/;

class PersonAdapter extends BaseAdapter {
  constructor() {
    super(CARRIERS.PERSON_GENERIC, { supportedTypes: [QUERY_TYPES.PERSON] });
  }

  /**
   * 个人尽调（线索发现）：Bing 搜姓名 → 提取关联公司、职位、司法涉诉线索。
   * 结果如实标注线索来源，判定权交给报告层/人工。
   */
  async trackPerson(name, options = {}) {
    const headless = options.headless ?? false;
    logger.info(`个人尽调: ${name}`);

    const { browser, context } = await launchBrowser({ headless });
    const page = await context.newPage();
    try {
      const results = await bingSearch(page, name);
      const assoc = this._collect(results, ROLE_PATTERNS);
      const risks = this._collect(results, RISK_PATTERNS);

      const data = {
        personName: name,
        associatedCompanies: assoc.map((i) => i.title).slice(0, 10),
        roles: assoc.map((i) => i.match).slice(0, 10),
        riskFlags: risks.map((i) => i.match).slice(0, 10),
        riskSources: risks.map((i) => ({ title: i.title, url: i.url })).slice(0, 6),
        topSources: results.slice(0, 6).map((i) => ({ title: i.title, url: i.url })),
        note: risks.length
          ? '发现司法/风险类线索，建议人工核实具体案件与身份'
          : '未发现明显司法/风险线索（仅基于公开搜索，不能排除同名干扰）',
      };

      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.PERSON,
        query: name,
        hasResult: results.length > 0,
        data,
      });
    } finally {
      await browser.close();
    }
  }

  _collect(results, patterns) {
    const out = [];
    for (const r of results) {
      const text = `${r.title} ${r.snippet}`;
      const m = text.match(patterns);
      if (m) out.push({ title: r.title, url: r.url, match: m[0] });
    }
    return out;
  }
}

module.exports = PersonAdapter;
