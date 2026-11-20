require('./adapters');

const { globalTracker } = require('./core/tracker');
const { globalRegistry } = require('./adapters');
const {
  QUERY_TYPES,
  CARRIERS,
} = require('./core/types');
const {
  detectQueryType,
  detectContainerCarrier,
  analyze,
} = require('./utils/detect');
const { CONTAINER_PREFIX_MAP } = require('./config/carriers');
const { parseCoscoContainer, parseCoscoBillOfLading } = require('./parsers/cosco');
const { parseMaerskContainer, parseMaerskBillOfLading, parseTrackTraceContainer } = require('./parsers/maersk');

const CoscoAdapter = require('./adapters/cosco');
const { MaerskAdapter, MscAdapter, TrackTraceBasedAdapter } = require('./adapters/maersk');

const CARRIER_MAP = {};
for (const [prefix, carrier] of Object.entries(CONTAINER_PREFIX_MAP)) {
  CARRIER_MAP[prefix] = carrier;
}
const COSCO_PREFIXES = Object.keys(CARRIER_MAP).filter(p => CARRIER_MAP[p] === CARRIERS.COSCO);

function isCosco(containerNumber) {
  const prefix = String(containerNumber).slice(0, 4).toUpperCase();
  return COSCO_PREFIXES.includes(prefix);
}

function detectCarrier(containerNumber) {
  return detectContainerCarrier(containerNumber);
}

const _cosco = new CoscoAdapter();
const _maersk = new MaerskAdapter();

async function trackCosco(containerNumber) {
  return await _cosco.trackContainer(containerNumber);
}

async function trackViaTrackTrace(containerNumber, carrier) {
  const adapter = new TrackTraceBasedAdapter(carrier, [QUERY_TYPES.CONTAINER]);
  return await adapter.trackContainer(containerNumber);
}

async function trackContainer(containerNumber) {
  const carrier = detectCarrier(containerNumber);
  if (isCosco(containerNumber)) {
    return await trackCosco(containerNumber);
  }
  return await trackViaTrackTrace(containerNumber, carrier);
}

function parseMaerskResult(text, containerNumber) {
  return parseMaerskContainer(text, containerNumber);
}
function parseCoscoResult(text, containerNumber) {
  return parseCoscoContainer(text, containerNumber);
}

module.exports = {
  trackContainer,
  detectCarrier,
  isCosco,
  CARRIER_MAP,
  COSCO_PREFIXES,
  parseMaerskResult,
  parseCoscoResult,
  QUERY_TYPES,
  CARRIERS,
  detectQueryType,
  analyze,
  globalTracker,
  globalRegistry,
  __internal: {
    CoscoAdapter,
    MaerskAdapter,
    MscAdapter,
    parseCoscoBillOfLading,
    parseMaerskBillOfLading,
    parseTrackTraceContainer,
  },
};
