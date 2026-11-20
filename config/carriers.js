const { QUERY_TYPES, CARRIERS } = require('../core/types');

const CARRIER_CONFIG = {
  [CARRIERS.COSCO]: {
    key: 'cosco',
    name: CARRIERS.COSCO,
    containerPrefixes: ['COSU', 'CSNU', 'CBHU', 'CSLU'],
    blPrefixPattern: /^(COSU|CSNU|CBHU|CSLU)[A-Z0-9]{4,16}$/i,
    homepage: 'https://elines.coscoshipping.com/ebusiness/',
    supportedTypes: [QUERY_TYPES.CONTAINER, QUERY_TYPES.BILL_OF_LADING],
    adapterFile: 'cosco',
    notes: 'COSCO 官网直连，提单号适配器待实现',
  },

  [CARRIERS.MAERSK]: {
    key: 'maersk',
    name: CARRIERS.MAERSK,
    containerPrefixes: ['MSKU', 'MAEU', 'MRKU', 'MRSU'],
    blPrefixPattern: /^MAEU[A-Z0-9]{6,16}$/i,
    homepage: 'https://www.maersk.com/',
    supportedTypes: [QUERY_TYPES.CONTAINER, QUERY_TYPES.BILL_OF_LADING],
    adapterFile: 'maersk',
    channel: 'maersk-direct',
    notes: 'Maersk 官网直连 SPA（/tracking/{号} URL 路由，免登录查询箱号/提单号）',
  },

  [CARRIERS.MSC]: {
    key: 'msc',
    name: CARRIERS.MSC,
    containerPrefixes: ['MSCU', 'MEDU', 'MSDU', 'MSMU'],
    homepage: 'https://www.msc.com/',
    supportedTypes: [QUERY_TYPES.CONTAINER],
    adapterFile: 'msc',
    channel: 'msc-direct',
    notes: 'MSC 官网直连（track-a-shipment 表单，免登录）',
  },

  // 除官网直连的 COSCO/Maersk/MSC 外，其余箱号（ONE/Hapag/CMA/Evergreen/租箱/未知前缀）
  // 统一定义为通用伪承运商，经 track-trace 聚合适配器按前缀自动识别。

  [CARRIERS.TRACK_TRACE_GENERIC]: {
    key: 'track-trace',
    name: CARRIERS.TRACK_TRACE_GENERIC,
    homepage: 'https://www.track-trace.com/container',
    supportedTypes: [QUERY_TYPES.CONTAINER],
    adapterFile: 'track_trace_generic',
    channel: 'track-trace',
    notes: '通用箱号聚合适配器：经 track-trace 聚合按前缀自动识别承运人，覆盖租箱/未知前缀等一切非官网直连的箱号',
  },

  [CARRIERS.AFKL]: {
    key: 'afkl',
    name: CARRIERS.AFKL,
    awbPrefixes: ['074', '057'],
    homepage: 'https://www.afklcargo.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'afkl',
    channel: 'afklcargo-direct',
    notes: 'IATA 代码 074(KL)/057(AF)；afklcargo.com 官网 myCargo 直连匿名查询',
  },

  [CARRIERS.KLM]: {
    key: 'klm',
    name: CARRIERS.KLM,
    awbPrefixes: [],
    homepage: 'https://www.afklcargo.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'klm',
    channel: 'track-trace',
    notes: 'IATA 代码 074；经 Track-Trace Air Cargo 板块查询（兜底通道，074 前缀默认路由到 AFKL 直连）',
  },

  [CARRIERS.DHL]: {
    key: 'dhl',
    name: CARRIERS.DHL,
    awbPrefixes: [],
    homepage: 'https://www.dhl.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'dhl',
    notes: '空运单适配器待实现（注意：074 属 KLM 非 DHL）',
  },

  [CARRIERS.FEDEX]: {
    key: 'fedex',
    name: CARRIERS.FEDEX,
    awbPrefixes: ['403'],
    homepage: 'https://www.fedex.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'fedex',
    notes: '空运单适配器待实现',
  },

  [CARRIERS.UPS]: {
    key: 'ups',
    name: CARRIERS.UPS,
    awbPrefixes: ['406'],
    homepage: 'https://www.ups.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'ups',
    notes: '空运单适配器待实现',
  },

  [CARRIERS.TURKISH]: {
    key: 'tk',
    name: CARRIERS.TURKISH,
    awbPrefixes: ['235'],
    homepage: 'https://www.turkishcargo.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'turkish',
    channel: 'turkishcargo-direct',
    notes: 'IATA 代码 235(TK)；turkishcargo.com/en/cargo-tracking 直连 SPA，URL 参数自动触发搜索，免登录',
  },

  [CARRIERS.CHINA_CARGO]: {
    key: 'ck',
    name: CARRIERS.CHINA_CARGO,
    awbPrefixes: ['112'],
    homepage: 'https://www.eal-ceair.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'china_cargo',
    channel: 'eal-ceair-direct',
    notes: 'IATA 代码 112(CK)；eal-ceair.com 官网直连，用 tesseract.js OCR 识别 6 位数字验证码',
  },

  [CARRIERS.QATAR]: {
    key: 'qr',
    name: CARRIERS.QATAR,
    awbPrefixes: ['157'],
    homepage: 'https://www.qrcargo.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'qatar',
    channel: 'qrcargo-direct',
    notes: 'IATA 代码 157(QR)；qrcargo.com 官网直连（Salesforce Community Cloud SPA），URL 含 documentPrefix/documentNumber 即可渲染',
  },

  [CARRIERS.SHANDONG]: {
    key: 'sc',
    name: CARRIERS.SHANDONG,
    awbPrefixes: ['324'],
    homepage: 'https://www.shandongair.com.cn/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: null,
    channel: null,
    notes: 'IATA 代码 324(SC)；山航无独立货运追踪页，track-trace 未收录；建议致电 10100999（国货航）或 95369（山航）人工查询',
  },

  [CARRIERS.EMIRATES]: {
    key: 'ek',
    name: CARRIERS.EMIRATES,
    awbPrefixes: ['176'],
    homepage: 'https://www.emiratesskycargo.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'emirates',
    channel: 'eskycargo-direct',
    notes: 'IATA 代码 176(EK)；eskycargo.emirates.com/app/offerandorder 直连 SPA，URL hash 参数自动触发搜索，免登录',
  },

  [CARRIERS.MALAYSIA]: {
    key: 'mh',
    name: CARRIERS.MALAYSIA,
    awbPrefixes: ['232'],
    homepage: 'https://www.maskargo.com/',
    supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    adapterFile: 'malaysia',
    channel: 'maskargo-direct',
    notes: 'IATA 代码 232(MH)；maskargo.com shipment-tracking 官网直连，URL 参数(prefixNumber/awbNumber)自动触发查询',
  },

  [CARRIERS.COMPANY_GENERIC]: {
    key: 'company',
    name: CARRIERS.COMPANY_GENERIC,
    homepage: null,
    supportedTypes: [QUERY_TYPES.COMPANY],
    adapterFile: 'company',
    channel: 'company-diligence',
    notes: '公司尽调适配器：先查国内工商（企查查/天眼查 CLI），未果转 Bing 线索发现（官网/注册地）',
  },

  [CARRIERS.PERSON_GENERIC]: {
    key: 'person',
    name: CARRIERS.PERSON_GENERIC,
    homepage: null,
    supportedTypes: [QUERY_TYPES.PERSON],
    adapterFile: 'person',
    channel: 'person-diligence',
    notes: '个人尽调适配器：Bing 搜姓名，提取关联公司/职位/司法涉诉线索',
  },
};

function buildPrefixIndex() {
  const containerMap = {};
  const awbMap = {};
  for (const [name, cfg] of Object.entries(CARRIER_CONFIG)) {
    for (const p of cfg.containerPrefixes || []) {
      containerMap[p.toUpperCase()] = name;
    }
    for (const p of cfg.awbPrefixes || []) {
      awbMap[p] = name;
    }
  }
  return { containerMap, awbMap };
}

const { containerMap: CONTAINER_PREFIX_MAP, awbMap: AWB_PREFIX_MAP } = buildPrefixIndex();

function getCarrierConfig(name) {
  return CARRIER_CONFIG[name] || null;
}

function listCarrierByType(queryType) {
  return Object.values(CARRIER_CONFIG).filter(c => c.supportedTypes.includes(queryType));
}

module.exports = {
  CARRIER_CONFIG,
  CONTAINER_PREFIX_MAP,
  AWB_PREFIX_MAP,
  getCarrierConfig,
  listCarrierByType,
};
