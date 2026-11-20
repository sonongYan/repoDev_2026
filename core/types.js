const QUERY_TYPES = {
  CONTAINER: 'container',
  BILL_OF_LADING: 'bl',
  AIR_WAYBILL: 'awb',
  CARGO_CODE: 'cargo_code',
  COMPANY: 'company',
  PERSON: 'person',
  ROSTER: 'roster',
};

const QUERY_TYPE_LABELS = {
  [QUERY_TYPES.CONTAINER]: '箱号',
  [QUERY_TYPES.BILL_OF_LADING]: '提单号',
  [QUERY_TYPES.AIR_WAYBILL]: '空运单号',
  [QUERY_TYPES.CARGO_CODE]: '货品代码',
  [QUERY_TYPES.COMPANY]: '公司名',
  [QUERY_TYPES.PERSON]: '个人姓名',
  [QUERY_TYPES.ROSTER]: '名单筛查',
};

const CARRIERS = {
  MAERSK: 'Maersk Line',
  MSC: 'Mediterranean Shipping',
  COSCO: 'COSCO SHIPPING Lines',
  ONE: 'ONE',
  HAPAG_LOYD: 'Hapag-Lloyd',
  CMA_CGM: 'CMA CGM',
  EVERGREEN: 'Evergreen',
  DHL: 'DHL Express',
  FEDEX: 'FedEx',
  UPS: 'UPS',
  KLM: 'KLM Royal Dutch Airlines',
  AFKL: 'AF KLM Cargo',
  TURKISH: 'Turkish Cargo',
  CHINA_CARGO: 'China Cargo Airlines',
  QATAR: 'Qatar Airways Cargo',
  SHANDONG: 'Shandong Airlines',
  EMIRATES: 'Emirates SkyCargo',
  MALAYSIA: 'Malaysia Airlines (MASkargo)',
  TRACK_TRACE_GENERIC: 'Track-Trace',
  COMPANY_GENERIC: 'Company Due Diligence',
  PERSON_GENERIC: 'Person Due Diligence',
  DOWJONES_RISK: 'Dow Jones RiskCenter',
};

module.exports = {
  QUERY_TYPES,
  QUERY_TYPE_LABELS,
  CARRIERS,
};
