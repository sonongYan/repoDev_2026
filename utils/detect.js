const { QUERY_TYPES, CARRIERS } = require('../core/types');
const { CONTAINER_PREFIX_MAP, AWB_PREFIX_MAP, CARRIER_CONFIG } = require('../config/carriers');

// IATA AWB mod-7 校验位验证。
// 11 位主单：前 3 位为航司代码，第 4~10 位为 7 位序列号，最后 1 位为校验位。
// 校验位 = 7 位序列号数字串 % 7。
function parseAwbCheckDigit(awbCompact) {
  if (!/^\d{11}$/.test(awbCompact)) {
    return { isValidAWB: false, checkDigit: null, calc: null };
  }
  const serial = awbCompact.slice(3, 10); // 第 4~10 位（7 位）
  const checkDigit = Number(awbCompact[10]); // 最后 1 位
  const calc = Number(serial) % 7;
  return { isValidAWB: calc === checkDigit, checkDigit, calc };
}

// 空运单分类：主单 / 分单。纯 11 位数字且校验通过 → master；
// 其余（含字母、数字位数不符、校验失败）→ house。
function detectAwbKind(raw) {
  const compact = String(raw || '').replace(/[\s-]/g, '');
  if (/^\d{11}$/.test(compact)) {
    const { isValidAWB } = parseAwbCheckDigit(compact);
    return { kind: isValidAWB ? 'master' : 'house', validated: isValidAWB, checkDigitOk: isValidAWB };
  }
  return { kind: 'house', validated: false, checkDigitOk: false };
}

function detectQueryType(input) {
  if (!input) return null;
  const raw = String(input).trim();
  const compact = raw.toUpperCase().replace(/[\s-]/g, ''); // 去掉空格与连字符，归一化判断
  const str = compact;

  if (/^[A-Z]{4}\d{7}$/.test(str)) {
    return QUERY_TYPES.CONTAINER;
  }

  // 空运单：3位 IATA 前缀 + 8位序列号。允许连字符/空格分隔（如 074-39882393）。
  // 11 位数字一律视为空运单类型，主单/分单由校验位判定（tracker 据此决定是否查询）。
  const awbCompact = raw.replace(/[\s-]/g, '');
  if (/^\d{11}$/.test(awbCompact)) {
    return QUERY_TYPES.AIR_WAYBILL;
  }

  // 含字母+数字、形如分单的串（如 HAWB-123ABC）：归类为空运单（house），避免落到 cargo_code/BL。
  if (/^[A-Za-z0-9]{6,20}$/.test(str) && /[A-Za-z]/.test(str) && /\d/.test(str)) {
    return QUERY_TYPES.AIR_WAYBILL;
  }

  if (/^[A-Z0-9]{8,20}$/.test(str)) {
    return QUERY_TYPES.BILL_OF_LADING;
  }

  return QUERY_TYPES.CARGO_CODE;
}

function detectContainerCarrier(containerNumber) {
  const prefix = String(containerNumber).slice(0, 4).toUpperCase();
  // CONTAINER_PREFIX_MAP 仅保留官网系前缀（COSCO/Maersk/MSC）；
  // 其余一切前缀（租箱/ONE/Hapag/CMA/Evergreen/未知）交给通用 track-trace 聚合。
  return CONTAINER_PREFIX_MAP[prefix] || CARRIERS.TRACK_TRACE_GENERIC;
}

function detectAwbCarrier(awbNumber) {
  const prefix = String(awbNumber).slice(0, 3);
  return AWB_PREFIX_MAP[prefix] || null;
}

function detectBlCarrier(blNumber, carriers) {
  const str = String(blNumber).trim().toUpperCase();
  for (const name of carriers ?? Object.keys(CARRIER_CONFIG)) {
    const cfg = CARRIER_CONFIG[name];
    if (!cfg) continue;
    if (cfg.blPrefixPattern && cfg.blPrefixPattern.test(str)) return name;
  }
  return null;
}

function analyze(input, hints = {}) {
  const query = String(input || '').trim();

  const result = {
    query,
    queryType: hints.queryType || null,
    carrier: hints.carrier || null,
    detectedBy: hints.queryType ? 'hint' : null,
    awbKind: null,
    awbValidated: null,
    checkDigitOk: null,
  };

  if (!result.queryType) {
    result.queryType = detectQueryType(query);
    result.detectedBy = 'auto';
  }

  // 空运单：填充主单/分单与校验位元信息（即使由 hint 指定 queryType 也尝试计算）
  if (result.queryType === QUERY_TYPES.AIR_WAYBILL) {
    const { kind, validated, checkDigitOk } = detectAwbKind(query);
    result.awbKind = kind;
    result.awbValidated = validated;
    result.checkDigitOk = checkDigitOk;
  }

  if (result.carrier) {
    return result;
  }

  switch (result.queryType) {
    case QUERY_TYPES.CONTAINER:
      result.carrier = detectContainerCarrier(query);
      result.detectedBy = result.detectedBy || (result.carrier === CARRIERS.TRACK_TRACE_GENERIC ? 'generic-track-trace' : 'prefix');
      break;
    case QUERY_TYPES.AIR_WAYBILL:
      result.carrier = result.awbKind === 'master' ? detectAwbCarrier(query) : null;
      break;
    case QUERY_TYPES.BILL_OF_LADING:
      result.carrier = detectBlCarrier(query);
      break;
    case QUERY_TYPES.COMPANY:
      result.carrier = CARRIERS.COMPANY_GENERIC;
      break;
    case QUERY_TYPES.PERSON:
      result.carrier = CARRIERS.PERSON_GENERIC;
      break;
    default:
      result.carrier = null;
  }

  return result;
}

module.exports = {
  detectQueryType,
  detectContainerCarrier,
  detectAwbCarrier,
  detectBlCarrier,
  parseAwbCheckDigit,
  detectAwbKind,
  analyze,
};