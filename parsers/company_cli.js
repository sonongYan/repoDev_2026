// 公司 CLI（tyc-cli / qcc-agent-cli）输出解析器。
// 兼容 JSON 与文本两种输出，字段名宽松匹配（中英文别名），
// 缺失维度如实留空，绝不编造数据。

const BASIC_ALIASES = {
  companyName: ['公司名称', '企业名称', 'companyName', 'company_name', 'name'],
  creditCode: ['统一社会信用代码', '信用代码', 'creditCode', 'credit_code', 'uscc'],
  legalRep: ['法定代表人', '法人代表', '法人', 'legalRepresentative', 'legal_representative', 'legalRep', 'legal'],
  registeredCapital: ['注册资本', '注册资本金', 'registeredCapital', 'registered_capital', 'regCapital', 'capital'],
  foundedAt: ['成立日期', '成立时间', 'foundedAt', 'founded_at', 'establishmentDate', 'established', 'regDate', 'registeredDate'],
  address: ['注册地址', '地址', 'address', 'registeredAddress', 'registered_address'],
  businessScope: ['经营范围', 'businessScope', 'business_scope', 'scope'],
  status: ['登记状态', '经营状态', 'companyStatus', 'status', 'regStatus'],
};

const SHARE_ALIASES = {
  name: ['name', 'shareholderName', 'shareholder', '股东名称', '股东'],
  ratio: ['ratio', 'percent', '持股比例', '出资比例', '占股比例'],
  amount: ['amount', '认缴出资额', '认缴金额', '出资金额', 'subscribedCapital'],
};

const JUDICIAL_ALIASES = ['司法风险', '涉诉', '裁判文书', '司法文书', 'judicialRisk', 'judicial_risk', 'litigation', 'riskInfo', '风险信息'];
const ABNORMAL_ALIASES = ['经营异常', '异常名录', 'abnormal', 'abnormalOperations', 'abnormal_list', '行政处罚', 'penalty', 'violations'];
const SHARE_KEYS = ['shareholders', 'shareholderList', 'equityStructure', '股东信息', '股东', 'shareHolders', 'shares'];
const INVEST_KEYS = ['investments', 'investedCompanies', '对外投资', 'abroadInvestments'];

function pick(node, keys) {
  if (!node || typeof node !== 'object') return undefined;
  for (const k of keys) {
    if (node[k] !== undefined && node[k] !== null && node[k] !== '') return node[k];
  }
  return undefined;
}

// 候选节点：优先顶层，字段缺失时回退到常见嵌套节点
function candidates(root) {
  const list = [root];
  for (const key of ['basicInfo', 'businessInfo', 'company', 'baseInfo']) {
    if (root[key] && typeof root[key] === 'object') list.push(root[key]);
  }
  return list;
}

function extractBasic(root) {
  const basic = {};
  for (const field of Object.keys(BASIC_ALIASES)) {
    for (const node of candidates(root)) {
      const v = pick(node, BASIC_ALIASES[field]);
      if (v !== undefined) {
        basic[field] = typeof v === 'object' ? JSON.stringify(v) : String(v);
        break;
      }
    }
  }
  return basic;
}

function parseShares(root) {
  let raw;
  for (const node of candidates(root)) {
    raw = pick(node, SHARE_KEYS);
    if (raw !== undefined) break;
  }
  if (raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => {
        if (typeof s === 'string') return parseShareText(s);
        return {
          name: pick(s, SHARE_ALIASES.name) !== undefined ? String(pick(s, SHARE_ALIASES.name)) : undefined,
          ratio: pick(s, SHARE_ALIASES.ratio) !== undefined ? normalizeRatio(pick(s, SHARE_ALIASES.ratio)) : undefined,
          amount: pick(s, SHARE_ALIASES.amount) !== undefined ? String(pick(s, SHARE_ALIASES.amount)) : undefined,
        };
      })
      .filter((s) => s.name);
  }
  return String(raw)
    .split(/[;；,，\n]/)
    .map((t) => parseShareText(t))
    .filter((s) => s.name);
}

function parseShareText(text) {
  const name = (text.match(/([^\d%：:]+)/)?.[1] || '').replace(/[（(。，,\s]+$/, '').trim();
  if (!name) return { name: undefined };
  const ratio = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return { name, ratio: ratio ? normalizeRatio(ratio[1] + '%') : undefined };
}

function normalizeRatio(v) {
  const s = String(v).trim();
  if (/%$/.test(s)) return s;
  const n = parseFloat(s);
  return Number.isFinite(n) ? `${n}%` : s;
}

function parseInvestments(root) {
  let raw;
  for (const node of candidates(root)) {
    raw = pick(node, INVEST_KEYS);
    if (raw !== undefined) break;
  }
  if (raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((i) => {
        if (typeof i === 'string') return { companyName: i };
        return {
          companyName: String(pick(i, ['companyName', 'investedCompany', 'name', '被投资公司名称', '公司名称']) || ''),
          ratio: pick(i, ['ratio', 'percent', '持股比例']) !== undefined ? normalizeRatio(pick(i, ['ratio', 'percent', '持股比例'])) : undefined,
        };
      })
      .filter((i) => i.companyName);
  }
  return String(raw).split(/[;；,，\n]/).map((t) => ({ companyName: t.trim() })).filter((i) => i.companyName);
}

function parseFlagList(root, aliases) {
  let raw;
  for (const node of candidates(root)) {
    raw = pick(node, aliases);
    if (raw !== undefined) break;
  }
  if (raw === undefined) return { present: false, count: 0, items: [] };
  if (Array.isArray(raw)) {
    // 对象条目（如 qcc 裁判文书：案号/案由/裁判日期）摘要化为一行，避免原始 JSON 过长
    const items = raw.map((i) => {
      if (typeof i === 'string') return i;
      if (!i || typeof i !== 'object') return String(i ?? '');
      const parts = [i.案号 || i.caseNo || i.文书标题 || i.title, i.案由 || i.caseReason, i.裁判日期 || i.date || i.publishDate]
        .map((s) => String(s || '').trim())
        .filter(Boolean);
      return parts.join(' | ');
    }).filter(Boolean);
    return { present: items.length > 0, count: items.length, items };
  }
  if (typeof raw === 'number') return { present: raw > 0, count: raw, items: [] };
  const text = String(raw).trim();
  if (!text || text === '0' || text === '无' || text === '无风险') return { present: false, count: 0, items: [] };
  const items = text.split(/[;；,，\n]/).map((t) => t.trim()).filter(Boolean);
  return { present: items.length > 0, count: items.length, items };
}

// 文本行的 key 归一化：去掉空白/括号注释
function normalizeKey(k) {
  return k.trim().replace(/[（(].*[)）]/g, '').trim();
}

/**
 * 解析 CLI 输出为统一深挖结构。
 * @param {string} stdout CLI 原始输出（JSON 或文本）
 * @returns {object} { hasData, basic, shareholders, investments, judicialRisk, abnormal }
 */
function parseCompanyCli(stdout) {
  const empty = { hasData: false, basic: {}, shareholders: [], investments: [], judicialRisk: { present: false, count: 0, items: [] }, abnormal: { present: false, count: 0, items: [] } };

  let root = null;
  const text = String(stdout || '').trim();
  if (!text) return empty;

  try {
    root = JSON.parse(text);
  } catch (_) {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { root = JSON.parse(m[0]); } catch (_2) { root = null; }
    }
  }

  if (root && typeof root === 'object') {
    // 仅展开真正的数据包装层（data/result），basicInfo 等按字段回退处理
    for (const wrapper of ['data', 'result']) {
      if (root[wrapper] && typeof root[wrapper] === 'object') root = root[wrapper];
    }
    const basic = extractBasic(root);
    const shareholders = parseShares(root);
    const investments = parseInvestments(root);
    const judicialRisk = parseFlagList(root, JUDICIAL_ALIASES);
    const abnormal = parseFlagList(root, ABNORMAL_ALIASES);
    const hasData = Object.keys(basic).length > 0 || shareholders.length > 0 || investments.length > 0 || judicialRisk.present || abnormal.present;
    return { hasData, basic, shareholders, investments, judicialRisk, abnormal };
  }

  // 文本路径：`key: value` / `key=value` 行
  const basic = {};
  let shareText;
  let judicialText;
  let abnormalText;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([^:=：]+)\s*[:=：]\s*(.+?)\s*$/);
    if (!m) continue;
    const k = normalizeKey(m[1]);
    const v = m[2].trim();
    for (const [field, aliases] of Object.entries(BASIC_ALIASES)) {
      if (aliases.includes(k) && basic[field] === undefined) basic[field] = v;
    }
    if (SHARE_KEYS.includes(k) && shareText === undefined) shareText = v;
    if (JUDICIAL_ALIASES.includes(k) && judicialText === undefined) judicialText = v;
    if (ABNORMAL_ALIASES.includes(k) && abnormalText === undefined) abnormalText = v;
  }
  const shareholders = shareText
    ? String(shareText).split(/[;；,，\n]/).map((t) => parseShareText(t)).filter((s) => s.name)
    : [];
  const judicialRisk = parseFlagList({ judicialRisk: judicialText }, ['judicialRisk']);
  const abnormal = parseFlagList({ abnormal: abnormalText }, ['abnormal']);
  const hasData = Object.keys(basic).length > 0 || shareholders.length > 0 || judicialRisk.present || abnormal.present;
  return { hasData, basic, shareholders, investments: [], judicialRisk, abnormal };
}

module.exports = { parseCompanyCli };
