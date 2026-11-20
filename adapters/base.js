const { QUERY_TYPES } = require('../core/types');
const { defaultLogger } = require('../utils/logger');

class BaseAdapter {
  constructor(carrierName, options = {}) {
    this.carrier = carrierName;
    this.supportedTypes = options.supportedTypes || [];
    this.logger = (options.logger || defaultLogger).child(`adapter:${this.key()}`);
  }

  key() {
    return this.carrier;
  }

  supports(queryType) {
    return this.supportedTypes.includes(queryType);
  }

  listSupported() {
    return this.supportedTypes.map(qt => ({ carrier: this.carrier, queryType: qt }));
  }

  _notImplemented(queryType) {
    return this.buildResult({
      queryType,
      error: `[${this.carrier}] 暂未实现 ${queryType} 查询`,
    });
  }

  buildResult(overrides = {}) {
    return {
      success: false,
      carrier: this.carrier,
      queryType: overrides.queryType || null,
      query: overrides.query || null,
      hasResult: false,
      url: null,
      title: null,
      data: null,
      rawText: null,
      error: null,
      ...overrides,
    };
  }

  async execute(query, queryType, options = {}) {
    if (!this.supports(queryType)) {
      return this._notImplemented(queryType);
    }

    switch (queryType) {
      case QUERY_TYPES.CONTAINER:
        return await this.trackContainer(query, options);
      case QUERY_TYPES.BILL_OF_LADING:
        return await this.trackBillOfLading(query, options);
      case QUERY_TYPES.AIR_WAYBILL:
        return await this.trackAirWaybill(query, options);
      case QUERY_TYPES.CARGO_CODE:
        return await this.trackCargoCode(query, options);
      case QUERY_TYPES.COMPANY:
        return await this.trackCompany(query, options);
      case QUERY_TYPES.PERSON:
        return await this.trackPerson(query, options);
      case QUERY_TYPES.ROSTER:
        // 名单批量：一次会话查询多个名称（options.batch=true），避免逐项重复登录
        return options.batch ? await this.trackRosterBatch(query, options) : await this.trackRoster(query, options);
      default:
        return this._notImplemented(queryType);
    }
  }

  async trackContainer(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.CONTAINER);
  }
  async trackBillOfLading(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.BILL_OF_LADING);
  }
  async trackAirWaybill(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.AIR_WAYBILL);
  }
  async trackCargoCode(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.CARGO_CODE);
  }
  async trackCompany(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.COMPANY);
  }
  async trackPerson(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.PERSON);
  }
  async trackRoster(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.ROSTER);
  }
  async trackRosterBatch(_query, _opts) {
    return this._notImplemented(QUERY_TYPES.ROSTER);
  }
}

module.exports = BaseAdapter;
