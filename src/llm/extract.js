const { analyze } = require('../../utils/detect');
const { QUERY_TYPES } = require('../../core/types');
const { chatJSON } = require('./client');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('llm:extract');

// 抽取提示词：强制只输出 JSON（DeepSeek JSON mode 要求 prompt 含 "json" 字样）
const EXTRACT_SYSTEM = `你是货运尽调信息抽取器。从邮件正文中抽取物流相关实体，只输出 JSON（不要 markdown、不要解释），严格按以下结构：
{
  "companies": [{"name": "公司名（发货人/收货人/货代等，未提及则空数组）", "sections": ["可选查询段，邮件明确指定时才填，如 股东结构/工商基础/对外投资/司法风险/经营异常；未指定则空数组"]}],
  "persons": [{"name": "个人姓名（联系人/法人/股东/收货人等，未提及则空数组）", "context": "原文中该人出现的上下文，如职位/角色"}],
  "rosters": [{"type": "company 或 person 或 unknown", "title": "名单标题（如股东名单/高管名单/发货人名单）", "items": ["名单中的公司名或人名，逐项照抄"]}],
  "airWaybills": [{"awbNumber": "空运主单号、分单号、货代运单号，原文照抄，如 074-39882393 / 17727625 / NUS-T4414585", "sections": ["可选查询段：基础信息（含运单信息/基本信息/运单详情）/航线/货物/状态/轨迹/最新动态；未指定则空数组返回全部信息"]}],
  "containers": [{"containerNumber": "集装箱号（4位字母+7位数字），如 MSKU7294860", "sections": ["可选查询段：箱型/航线/时间/轨迹/最新动态；未指定则空数组返回全部信息"]}],
  "billOfLadings": ["提单号"],
  "notes": ["无法确定类型或信息不全的编号/描述"]
}
规则：
1. 空运相关编号一律进 airWaybills，不区分主单/分单（后续由代码判定）；
2. 邮件中出现的个人姓名（联系人、法人、股东、收货人等）进 persons；成批出现的公司/个人名单（股东名单、高管名单、发货人名单等）进 rosters，不要把名单条目拆散进 companies/persons；
3. 只抽与尽调相关的实体，忽略电话号码、日期、金额等无关数字；
4. 拿不准的直接放 notes，不要硬塞进实体数组；
5. 若邮件明确要求名单查询/筛查（出现"名单""名单查询""名单筛查""道琼斯""Dow Jones""riskcenter""制裁名单""sanction"等字眼），这是名单筛查请求，但需按邮件分区判断：
   5a. 若正文存在显式"企业/公司"分区（如"企业：xxx"或"企业查询"等独立小节），该分区下出现的公司名一律进 companies（走公司工商链路），不要放入 rosters；
   5b. 其余名单/名单查询分区下的公司名、个人姓名一律归入 rosters（type 按 company/person 区分，无法判断为 unknown），不要放 persons/companies，也不要因名称信息不完整而放进 notes；
   5c. 若邮件无显式"企业/公司"分区、整体为名单筛查请求，则正文中出现的公司名、个人姓名一律归入 rosters（同 5b 的 type 规则），不要放 persons/companies；
6. companies.sections：仅当邮件明确写明要查的维度时才填（如"查阿里巴巴股东结构"→sections=["股东结构"]；"查腾讯工商和司法风险"→sections=["工商基础","司法风险"]）；未明确指定维度时 sections 为空数组，默认返回全部五段信息。
7. containers.sections：仅当邮件明确写明要查的维度时才填（如"查 MSKU1234567 航线和到港时间"→sections=["航线","时间"]；"查最新动态"→sections=["最新动态"]）；未明确指定时 sections 为空数组，默认返回箱型/航线/时间/轨迹全部信息。
8. airWaybills.sections：仅当邮件明确写明要查的维度时才填（如"查 074-39882393 航线和状态"→sections=["航线","状态"]；"查最新动态"→sections=["最新动态"]）；"运单信息""基本信息""运单详情""基础信息"都视为基础信息段→sections=["基础信息"]；未明确指定时 sections 为空数组，默认返回基础信息/航线/货物/状态/轨迹全部信息。`;

// 公司查询段关键词 → 规范段名（basic/shareholders/investments/judicial/abnormal）
// 规范段名直接对应报告的五段：工商基础/股权结构/对外投资/司法风险/经营异常
const COMPANY_SECTION_ALIASES = [
  { key: 'basic', re: /工商|基础|基本信息|注册|credit|basic/i },
  { key: 'shareholders', re: /股东|股权|shareholder|equity|控股/i },
  { key: 'investments', re: /对外投资|投资|invest|子公司/i },
  { key: 'judicial', re: /司法|涉诉|裁判|诉讼|风险|litigation|judicial/i },
  { key: 'abnormal', re: /异常|处罚|经营异常|行政|penalty|abnormal|违规/i },
];

function normalizeCompanySections(raw) {
  if (!Array.isArray(raw)) return [];
  const set = new Set();
  for (const item of raw) {
    const text = String(item || '').trim();
    if (!text) continue;
    const hit = COMPANY_SECTION_ALIASES.find((a) => a.re.test(text));
    if (hit) set.add(hit.key);
  }
  return [...set];
}

function normalizeCompany(raw) {
  if (raw == null) return null;
  // 兼容字符串（旧格式）与对象（新格式）
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name, sections: [] } : null;
  }
  const name = String(raw.name || raw.companyName || '').trim();
  if (!name) return null;
  return { name, sections: normalizeCompanySections(raw.sections) };
}

// 集装箱查询段关键词 → 规范段名
// basic=基础箱信息 / route=航线起讫 / timeline=关键时间节点 / events=运输轨迹
// latest 为快捷意图（只看最新动态），等价于 events 仅取首条
const CONTAINER_SECTION_ALIASES = [
  { key: 'basic', re: /箱型|箱况|基础|基本信息|箱号信息|container type|basic/i },
  { key: 'route', re: /航线|起运港|目的港|中转港|路线|始发港|route|origin|destination/i },
  { key: 'timeline', re: /时间|离港|到港|eta|预计到达|预计到港|关键时间|departure|arrival/i },
  // latest 须在 events 之前："最新动态/当前动态" 命中 latest，避免被 events 的"动态"抢先
  { key: 'latest', re: /最新|当前|现在到哪|最新动态|最新状态|latest|current/i },
  { key: 'events', re: /轨迹|动态|运输记录|历史|明细|tracking|events|status/i },
];

function normalizeContainerSections(raw) {
  if (!Array.isArray(raw)) return [];
  const set = new Set();
  for (const item of raw) {
    const text = String(item || '').trim();
    if (!text) continue;
    const hit = CONTAINER_SECTION_ALIASES.find((a) => a.re.test(text));
    if (hit) set.add(hit.key);
  }
  return [...set];
}

function normalizeContainer(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const num = raw.trim();
    return num ? { raw: num, sections: [] } : null;
  }
  const num = String(raw.containerNumber || raw.number || raw.raw || '').trim();
  if (!num) return null;
  return { raw: num, sections: normalizeContainerSections(raw.sections) };
}

// 空运单查询段关键词 → 规范段名
// basic=基础信息(运单号/承运人) / route=航线(含中转) / cargo=货物(件数/重量/体积)
// status=当前状态 / events=运输轨迹全表 / latest=最新动态(仅首条)
const AWB_SECTION_ALIASES = [
  { key: 'basic', re: /基础|基本信息|运单信息|承运人|航司|basic|carrier|awb info/i },
  { key: 'route', re: /航线|起运港|目的港|始发港|中转|路线|route|origin|destination/i },
  { key: 'cargo', re: /货物|件数|重量|体积|计费|cargo|weight|volume|pieces/i },
  { key: 'status', re: /状态|当前状态|签收|交付|status|delivery/i },
  // latest 须在 events 之前
  { key: 'latest', re: /最新|当前|最新动态|最新状态|latest|current/i },
  { key: 'events', re: /轨迹|动态|运输记录|历史|明细|tracking|events/i },
];

function normalizeAwbSections(raw) {
  if (!Array.isArray(raw)) return [];
  const set = new Set();
  for (const item of raw) {
    const text = String(item || '').trim();
    if (!text) continue;
    const hit = AWB_SECTION_ALIASES.find((a) => a.re.test(text));
    if (hit) set.add(hit.key);
  }
  return [...set];
}

function normalizeAwb(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const num = raw.trim();
    return num ? { raw: num, sections: [] } : null;
  }
  const num = String(raw.awbNumber || raw.number || raw.raw || '').trim();
  if (!num) return null;
  return { raw: num, sections: normalizeAwbSections(raw.sections) };
}

/**
 * 确定性校验门：对 LLM 抽取出的实体逐一过规则校验，
 * 标注 queryType / 主分单 / mod-7 校验 / 承运人路由，防止幻觉号进入查询。
 */
function validateEntities(entities) {
  const report = {
    companies: (entities.companies || []).map(normalizeCompany).filter(Boolean),
    persons: (entities.persons || [])
      .map((p) => (typeof p === 'string' ? { name: p.trim() } : { name: String(p?.name || '').trim(), context: p?.context || '' }))
      .filter((p) => p.name),
    rosters: (entities.rosters || [])
      .map((r) => ({
        type: r?.type === 'person' ? 'person' : r?.type === 'company' ? 'company' : 'unknown',
        title: String(r?.title || '').trim(),
        items: (r?.items || []).map((i) => String(i).trim()).filter(Boolean),
      }))
      .filter((r) => r.items.length),
    airWaybills: [],
    containers: [],
    billOfLadings: [],
    notes: entities.notes || [],
  };

  for (const a of (entities.airWaybills || []).map(normalizeAwb).filter(Boolean)) {
    const analysis = analyze(a.raw);
    report.airWaybills.push({
      raw: a.raw,
      sections: a.sections,
      queryType: analysis.queryType,
      kind: analysis.awbKind,             // master / house
      validated: analysis.awbValidated,   // 11 位主单且 mod-7 通过
      carrier: analysis.carrier,          // 3 位 IATA 前缀识别的承运人
      queryable: analysis.queryType === QUERY_TYPES.AIR_WAYBILL && analysis.awbKind === 'master' && analysis.awbValidated,
    });
  }

  for (const c of (entities.containers || []).map(normalizeContainer).filter(Boolean)) {
    const analysis = analyze(c.raw);
    report.containers.push({
      raw: c.raw,
      sections: c.sections,
      validFormat: analysis.queryType === QUERY_TYPES.CONTAINER,
      carrier: analysis.carrier,
      queryable: analysis.queryType === QUERY_TYPES.CONTAINER,
    });
  }

  for (const b of entities.billOfLadings || []) {
    const analysis = analyze(b);
    report.billOfLadings.push({
      raw: String(b).trim(),
      queryType: analysis.queryType,
      carrier: analysis.carrier,
      queryable: analysis.queryType === QUERY_TYPES.BILL_OF_LADING && !!analysis.carrier,
    });
  }

  return report;
}

/**
 * 抽取邮件文本中的结构化实体（大模型边界 1），并过校验门。
 * @param {string} text 邮件正文（纯文本）
 * @returns {Promise<object>} validateEntities 的结果
 */
async function extractEntities(text) {
  const user = `邮件正文如下，请按规则抽取：\n\n${String(text || '').slice(0, 6000)}`;
  const raw = await chatJSON(EXTRACT_SYSTEM, user);
  logger.info('LLM 抽取完成', {
    companies: raw.companies?.length,
    persons: raw.persons?.length,
    rosters: raw.rosters?.length,
    awb: raw.airWaybills?.length,
    containers: raw.containers?.length,
    bl: raw.billOfLadings?.length,
  });
  return validateEntities(raw);
}

module.exports = { extractEntities, validateEntities, EXTRACT_SYSTEM };
