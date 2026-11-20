const CoscoAdapter = require('./cosco');
const CompanyAdapter = require('./company');
const PersonAdapter = require('./person');
const { DowJonesRiskAdapter } = require('./dowjones');
const AfklAirWaybillAdapter = require('./afkl');
const QatarAirWaybillAdapter = require('./qatar');
const EmiratesAirWaybillAdapter = require('./emirates');
const TurkishAirWaybillAdapter = require('./turkish');
const ChinaCargoAirWaybillAdapter = require('./china_cargo');
const { MalaysiaAirWaybillAdapter } = require('./malaysia');
const {
  KlmAirWaybillAdapter,
  ShandongAirWaybillAdapter,
} = require('./aircargo');
const {
  MaerskAdapter,
  MscAdapter,
  TrackTraceGenericContainerAdapter,
  DhlAdapter,
  FedexAdapter,
  UpsAdapter,
} = require('./maersk');
const { defaultLogger } = require('../utils/logger');

const logger = defaultLogger.child('registry');

class AdapterRegistry {
  constructor() {
    this._byCarrier = new Map();
  }

  register(adapterInstance) {
    if (this._byCarrier.has(adapterInstance.carrier)) {
      logger.warn(`重复注册适配器，覆盖: ${adapterInstance.carrier}`);
    }
    this._byCarrier.set(adapterInstance.carrier, adapterInstance);
    logger.debug(`注册适配器: ${adapterInstance.carrier} (${adapterInstance.supportedTypes.join(', ')})`);
    return this;
  }

  get(carrier) {
    return this._byCarrier.get(carrier) || null;
  }

  has(carrier) {
    return this._byCarrier.has(carrier);
  }

  resolve(carrier, queryType) {
    const adapter = this.get(carrier);
    if (!adapter) return null;
    return adapter.supports(queryType) ? adapter : null;
  }

  listAll() {
    const rows = [];
    for (const adapter of this._byCarrier.values()) {
      for (const qt of adapter.supportedTypes) {
        rows.push({
          carrier: adapter.carrier,
          queryType: qt,
          supported: true,
          key: `${adapter.carrier}::${qt}`,
        });
      }
    }
    return rows;
  }

  listSupported() {
    return this.listAll();
  }

  // 按配方 ID 查找适配器（配方驱动适配器会在构造时记录 recipeId）
  findByRecipe(recipeId) {
    for (const adapter of this._byCarrier.values()) {
      if (adapter.recipeId === recipeId) return adapter;
    }
    return null;
  }
}

const globalRegistry = new AdapterRegistry();

function registerDefaults(registry = globalRegistry) {
  registry.register(new CoscoAdapter());
  registry.register(new CompanyAdapter());
  registry.register(new PersonAdapter());
  registry.register(new DowJonesRiskAdapter());
  registry.register(new MaerskAdapter());
  registry.register(new MscAdapter());
  registry.register(new TrackTraceGenericContainerAdapter());
  registry.register(new AfklAirWaybillAdapter());
  registry.register(new QatarAirWaybillAdapter());
  registry.register(new KlmAirWaybillAdapter());
  registry.register(new TurkishAirWaybillAdapter());
  registry.register(new EmiratesAirWaybillAdapter());
  registry.register(new ChinaCargoAirWaybillAdapter());
  registry.register(new MalaysiaAirWaybillAdapter());
  registry.register(new ShandongAirWaybillAdapter());
  // EmiratesAirWaybillAdapter 已改为 eskycargo.emirates.com 直连，注册顺序不变
  registry.register(new DhlAdapter());
  registry.register(new FedexAdapter());
  registry.register(new UpsAdapter());
  return registry;
}

registerDefaults();

module.exports = {
  AdapterRegistry,
  globalRegistry,
  registerDefaults,
};
