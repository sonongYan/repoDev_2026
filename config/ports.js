// ============================================================================
// 港口/城市名 → 中文全称 词典（集装箱轨迹、航线起讫用，非 IATA 三字码）。
//
// 集装箱查询结果里的港口多为完整城市名（MANZANILLO/BUSAN/WEIHAI…），
// 本词典用于把外文港口名确定性转换为中文，避免依赖模型凭记忆乱译。
// 词典之外的港口保留原名（海运地名硬译可能更糟，宁可留原样）。
// 直接编辑本文件即可增删映射。
// ============================================================================

const PORTS_ZH = {
  // 中国
  SHANGHAI: '上海',
  YANGSHAN: '洋山',
  NINGBO: '宁波',
  ZHOUSHAN: '舟山',
  QINGDAO: '青岛',
  WEIHAI: '威海',
  TIANJIN: '天津',
  DALIAN: '大连',
  XIAMEN: '厦门',
  SHENZHEN: '深圳',
  YANTIAN: '盐田',
  SHEKOU: '蛇口',
  GUANGZHOU: '广州',
  NANSHA: '南沙',
  'HONG KONG': '香港',
  HONGKONG: '香港',
  KAOHSIUNG: '高雄',
  TAICHUNG: '台中',
  KEELUNG: '基隆',
  // 东北亚
  BUSAN: '釜山',
  INCHEON: '仁川',
  TOKYO: '东京',
  YOKOHAMA: '横滨',
  OSAKA: '大阪',
  KOBE: '神户',
  NAGOYA: '名古屋',
  // 东南亚
  SINGAPORE: '新加坡',
  'PORT KLANG': '巴生港',
  'TANJUNG PELEPAS': '丹戎帕拉帕斯',
  JAKARTA: '雅加达',
  'LAEM CHABANG': '林查班',
  BANGKOK: '曼谷',
  'HO CHI MINH': '胡志明市',
  'HAI PHONG': '海防',
  MANILA: '马尼拉',
  // 中东 / 南亚
  DUBAI: '迪拜',
  'JEBEL ALI': '杰贝阿里',
  'ABU DHABI': '阿布扎比',
  COLOMBO: '科伦坡',
  MUNDRA: '蒙德拉',
  'NHAVA SHEVA': '那瓦舍瓦',
  // 美洲
  MANZANILLO: '曼萨尼约',
  'LAZARO CARDENAS': '拉萨罗卡德纳斯',
  ENSENADA: '恩塞纳达',
  'LONG BEACH': '长滩',
  'LOS ANGELES': '洛杉矶',
  OAKLAND: '奥克兰',
  SEATTLE: '西雅图',
  TACOMA: '塔科马',
  VANCOUVER: '温哥华',
  'NEW YORK': '纽约',
  NEWARK: '纽瓦克',
  SAVANNAH: '萨凡纳',
  HOUSTON: '休斯敦',
  // 欧洲
  ROTTERDAM: '鹿特丹',
  ANTWERP: '安特卫普',
  HAMBURG: '汉堡',
  BREMERHAVEN: '不来梅哈芬',
  FELIXSTOWE: '费利克斯托',
  SOUTHAMPTON: '南安普顿',
  'LE HAVRE': '勒阿弗尔',
  VALENCIA: '瓦伦西亚',
  // 非洲 / 大洋洲
  SYDNEY: '悉尼',
  MELBOURNE: '墨尔本',
  DURBAN: '德班',
  'CAPE TOWN': '开普敦',
  TANGER: '丹吉尔',
};

// 箱型关键词 → 中文（顺序匹配，先命中先得）
const CONTAINER_TYPE_ZH = [
  [/dry\s*standard/i, '干货标准箱'],
  [/high\s*cube/i, '高柜'],
  [/open\s*top/i, '开顶箱'],
  [/flat\s*rack/i, '框架箱'],
  [/reefer|refrigerat/i, '冷藏箱'],
  [/tank/i, '罐箱'],
  [/dry/i, '干货箱'],
];

// 标准箱型缩写 → 中文（如 40HQ/20GP/40HC/20RF，海运/船司常用缩写）
const CONTAINER_TYPE_CODE_ZH = [
  [/^(\d{2})HQ$/i, (m) => `${m[1]} 英尺高柜`],
  [/^(\d{2})HC$/i, (m) => `${m[1]} 英尺高柜`],
  [/^(\d{2})GP$/i, (m) => `${m[1]} 英尺普通柜`],
  [/^(\d{2})DC$/i, (m) => `${m[1]} 英尺干货柜`],
  [/^(\d{2})(RF|RE)$/i, (m) => `${m[1]} 英尺冷藏柜`],
  [/^(\d{2})OT$/i, (m) => `${m[1]} 英尺开顶柜`],
  [/^(\d{2})FR$/i, (m) => `${m[1]} 英尺框架柜`],
  [/^(\d{2})TK$/i, (m) => `${m[1]} 英尺罐式柜`],
];

function getPortName(name) {
  if (!name) return null;
  // 去掉国别/逗号后缀（如 "MANZANILLO, MX"），再归一化（大写、多空格→单空格）
  const bare = String(name).split(',')[0].trim();
  const key = bare.toUpperCase().replace(/\s+/g, ' ');
  return PORTS_ZH[key] || null;
}

// 港口名 → 「中文（原外文名）」；词典缺失则原样返回
function expandPort(name) {
  if (!name) return '';
  const s = String(name).trim();
  const zh = getPortName(s);
  if (zh) return `${zh}（${s}）`;
  return s;
}

// 箱型 → 「尺寸 + 中文类型（原文）」；无法识别则原样返回
function translateContainerType(type) {
  const s = String(type || '').trim();
  if (!s) return '';
  // 先匹配标准缩写（40HQ/20GP/40RF 等）
  for (const [re, fn] of CONTAINER_TYPE_CODE_ZH) {
    const m = s.match(re);
    if (m) return `${fn(m)}（${s}）`;
  }
  let zh = null;
  for (const [re, label] of CONTAINER_TYPE_ZH) {
    if (re.test(s)) { zh = label; break; }
  }
  if (!zh) return s;
  const size = s.match(/\d{2,3}\s*'/)?.[0];
  const sizeZh = size ? `${size.replace("'", '').trim()} 英尺` : '';
  return `${sizeZh}${zh}（${s}）`.replace(/^\s+/, '');
}

// 码头/设施完整名 → 中文（清洗掉公司后缀后的精确映射，覆盖已知码头专名）
const TERMINALS_ZH = {
  'BUSAN NEW PORT TERMINAL': '釜山新港码头',
  'QINGDAO QIANWAN CONTAINER': '青岛前湾集装箱码头',
  'QINGDAO QIANWAN CONTAINER TERMINAL': '青岛前湾集装箱码头',
  'QINGDAO QIANWAN UNITED CONT': '青岛前湾联合集装箱码头',
  'QINGDAO QIANWAN UNITED CONT TERM': '青岛前湾联合集装箱码头',
  'QINGDAO QIANWAN UNITED CONTAINER TERMINAL': '青岛前湾联合集装箱码头',
  'WEIHAI TERMINAL': '威海码头',
  'YANGSHAN SHENGDONG': '洋山盛东码头',
  'YANGSHAN GUANDONG': '洋山冠东码头',
  'SSA MEXICO': '墨西哥 SSA 码头',
  'SINGAPORE PSA': '新加坡港务集团（PSA）码头',
};

// 码头名里的英文通用词 → 中文（先命中先得，从specific到generic）
const TERMINAL_SUFFIX_ZH = [
  [/\bnew\s*port\s*terminal\b/i, '新港码头'],
  [/\bcontainer\s*terminal\b/i, '集装箱码头'],
  [/\bcont\s*term(inal)?\b/i, '集装箱码头'],
  [/\binternational\s*terminal\b/i, '国际码头'],
  [/\bterminal\b/i, '码头'],
  [/\bport\b/i, '港口'],
];

// 清洗码头名：去公司后缀、逗号、句点，多余空格归一
function _cleanFacility(name) {
  return String(name || '')
    .replace(/[,，]/g, ' ')
    .replace(/\bCO\.?\s*LTD\.?\b/gi, ' ')
    .replace(/\bLTD\.?\b/gi, ' ')
    .replace(/\bPTE\.?\b/gi, ' ')
    .replace(/\bINC\.?\b/gi, ' ')
    .replace(/\bCORP\.?\b/gi, ' ')
    .replace(/\bLLC\.?\b/gi, ' ')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PORT_KEYS = Object.keys(PORTS_ZH).sort((a, b) => b.length - a.length);

// 名称是否以某个已知港口名开头，返回该港口名（用于把码头名里的港口部分转中文）
function _findPortPrefix(name) {
  const up = name.toUpperCase();
  for (const pk of PORT_KEYS) {
    if (up === pk || up.startsWith(pk + ' ')) return pk;
  }
  return null;
}

// 码头/设施 → 「中文（原名）」；无法翻译则原样返回
function expandFacility(name) {
  const s = _cleanFacility(name);
  if (!s) return '';
  const key = s.toUpperCase();
  if (TERMINALS_ZH[key]) return `${TERMINALS_ZH[key]}（${s}）`;

  let rest = s;
  let portZh = null;
  const pk = _findPortPrefix(s);
  if (pk) {
    portZh = PORTS_ZH[pk];
    rest = s.slice(pk.length).trim();
  }
  let suffixZh = null;
  for (const [re, label] of TERMINAL_SUFFIX_ZH) {
    if (re.test(rest)) { suffixZh = label; rest = rest.replace(re, ' ').trim(); break; }
  }
  const zh = [portZh, rest, suffixZh].filter(Boolean).join('');
  if (!zh && !portZh) return s; // 完全无港口/通用词线索，保留原专名
  return `${zh}（${s}）`;
}

// 海运位置英文缩写 token → 中文（按原文出现位置排序拼接，避免顺序错乱）
// 覆盖船司常用缩写：SHA=上海、CTN/CONT=集装箱、TML/TERMINAL=码头、PHASE=期…
const SHIPPING_TOKEN_ZH = [
  [/\bport\s*ctn\b|\bport\s*container\b/i, '集装箱港'],
  [/\bshanghai\b|\bsha\b/i, '上海'],
  [/\bnansha\b/i, '南沙'],
  [/\byantian\b/i, '盐田'],
  [/\bshekou\b/i, '蛇口'],
  [/\bwaigaoqiao\b/i, '外高桥'],
  [/\byangshan\b/i, '洋山'],
  [/\bqianwan\b/i, '前湾'],
  [/\bshengdong\b/i, '盛东'],
  [/\bguandong\b/i, '冠东'],
  [/\bphase\s*([ivxlcdm]+)\b/i, (m) => `${_romanToCn(m[1])}期`],
  [/\bctn\b|\bcontainer\b|\bcont\b/i, '集装箱'],
  [/\bterminal\b|\btml\b/i, '码头'],
  [/\bport\b/i, '港'],
];

// 罗马数字 → 中文数字（I=1 V=5 X=10…，超过 9 直接返回阿拉伯数字）
function _romanToCn(s) {
  const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  let total = 0; let prev = 0;
  for (const ch of String(s).toLowerCase().split('').reverse()) {
    const v = map[ch] || 0;
    total += v < prev ? -v : v;
    prev = v;
  }
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return total <= 9 ? cn[total] : String(total);
}

// 按原文 token 位置排序、区间贪心消费（同类缩写重叠时优先长匹配），避免重复翻译
function _translateShippingTokens(s) {
  const matches = [];
  for (const [re, label] of SHIPPING_TOKEN_ZH) {
    const rg = new RegExp(re.source, 'gi');
    let m;
    while ((m = rg.exec(s)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, zh: typeof label === 'function' ? label(m) : label });
      if (m[0].length === 0) rg.lastIndex += 1;
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const picked = [];
  let lastEnd = -1;
  for (const mt of matches) {
    if (mt.start >= lastEnd) {
      picked.push(mt);
      lastEnd = mt.end;
    }
  }
  picked.sort((a, b) => a.start - b.start);
  return picked.map((i) => i.zh).join('');
}

// 海运位置（港口/码头，常为英文缩写复合串）→ 「中文（原名）」
// 先港口词典精确匹配 → 码头精确映射 → token 英文缩写拆解；均无则原样返回
function expandShippingLocation(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  // 港口词典直接识别（内部按逗号拆国别，需先于 clean，避免逗号被吃掉）
  const pzh = getPortName(raw);
  if (pzh) return `${pzh}（${raw}）`;
  const s = _cleanFacility(raw);
  const key = s.toUpperCase();
  if (TERMINALS_ZH[key]) return `${TERMINALS_ZH[key]}（${raw}）`;
  const zh = _translateShippingTokens(s);
  if (!zh) return raw;
  return `${zh}（${raw}）`;
}

module.exports = {
  PORTS_ZH,
  TERMINALS_ZH,
  getPortName,
  expandPort,
  expandFacility,
  expandShippingLocation,
  translateContainerType,
};