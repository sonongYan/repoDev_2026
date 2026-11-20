// 海外注册地判定与官方入口构造。
// 输入 Bing 搜索结果（title/snippet/url），按注册地关键词 + 官方域名双信号打分，
// 输出最可能的注册地及官方查询入口；供 CompanyAdapter 海外深挖使用。

const { OVERSEAS_REGISTRIES } = require('../config/overseas');

/**
 * 从 Bing 搜索结果中打分判定注册地。
 * @param {Array<{title:string,url:string,snippet:string}>} results
 * @returns {{code:string,name:string,score:number,official:object}|null}
 */
function scoreRegistration(results) {
  const haystack = results
    .map((r) => `${r.title || ''} ${r.snippet || ''} ${r.url || ''}`)
    .join('\n')
    .toLowerCase();

  const scored = [];
  for (const [code, reg] of Object.entries(OVERSEAS_REGISTRIES)) {
    let score = 0;
    for (const kw of reg.keywords) {
      if (haystack.includes(kw)) score += 1;
    }
    // 官方注册机构域名是强信号（如 acra.gov.sg / icris.cr.gov.hk）
    for (const dom of reg.domains || []) {
      if (haystack.includes(dom)) score += 3;
    }
    if (score > 0) scored.push({ code, name: reg.name, score, official: reg.official });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.length ? scored[0] : null;
}

/**
 * 构造海外深挖结果：判定注册地 + 官方查询入口。
 * @param {{code:string,name:string,official:object}|null} registry
 * @param {string} name 公司名
 * @returns {object|null}
 */
function buildOverseasResult(registry, name) {
  if (!registry) return null;
  const searchUrl = registry.official.searchUrl.replace(/\{name\}/g, encodeURIComponent(name));
  return {
    registryCode: registry.code,
    registryName: registry.name,
    status: registry.official.free ? 'official-free' : 'official-paid',
    official: {
      name: registry.official.name,
      homepage: registry.official.homepage,
      searchUrl,
      free: registry.official.free,
      notes: registry.official.notes,
    },
    issues: [
      registry.official.free
        ? '官方渠道可免费查询基本资料，建议人工打开入口核验登记状态'
        : '该注册地官方查册需登录/收费，已给出入口，建议人工完成查册',
    ],
  };
}

module.exports = { scoreRegistration, buildOverseasResult, OVERSEAS_REGISTRIES };
