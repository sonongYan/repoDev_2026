// AF KLM Cargo（afklcargo.com myCargo）空运单解析
// 数据源：匿名接口 GET /mycargo/api/tnt-api/shipments/{awb} 返回的 JSON 数组。
// SPA 前端约定：412/404 = 无此单信息（TNT.ERROR.AWB_NO_INFO），由适配器处理。

// 接口中的 OffsetDateTime 结构：
// { dateTime: { date: {year,month,day}, time: {hour,minute,second,nano} }, offset: {totalSeconds} }
function formatOffsetDateTime(odt) {
  if (!odt) return null;
  if (typeof odt === 'string') return odt;
  const dt = odt.dateTime || {};
  const d = dt.date;
  if (!d || !d.year) return null;
  const pad = (n) => String(n ?? 0).padStart(2, '0');
  let s = `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  if (dt.time) s += ` ${pad(dt.time.hour)}:${pad(dt.time.minute)}`;
  return s;
}

// 地点字段兼容字符串与对象两种形态
function pickLocation(loc) {
  if (!loc) return null;
  if (typeof loc === 'string') return loc;
  return loc.stationCode || loc.code || loc.cityCode || loc.name || null;
}

// IATA 空运标准里程碑代码
const EVENT_LABELS = {
  BKG: '已订舱',
  FWB: '运单数据已接收',
  FOH: '货物已交运',
  RCS: '已从托运人处收货',
  DEP: '航班已起飞',
  ARR: '航班已到达',
  RCF: '到达货物已收讫',
  NFD: '已通知提货',
  AWD: '单据已交付',
  DLV: '已交付收货人',
  CCD: '海关放行',
};

function parseAfklShipment(json, awbNumber) {
  const result = {
    awbNumber,
    airline: 'AF KLM Cargo',
    origin: null,
    destination: null,
    pieces: null,
    weight: null,
    lastUpdated: null,
    latestStatus: null,
    events: [],
  };

  const list = Array.isArray(json) ? json : (json ? [json] : []);
  const item = list[0];
  if (!item) return result;

  const shipment = item.shipment || {};
  const od = shipment.originDestination || {};
  result.origin = pickLocation(od.departureLocation);
  result.destination = pickLocation(od.arrivalLocation);

  const chars = item.shipmentCharacteristics || {};
  if (chars.totalPieces != null) result.pieces = String(chars.totalPieces);
  const gross = chars.totalGrossWeight;
  if (gross && gross.value != null) {
    result.weight = `${gross.value}${gross.unit ? ' ' + gross.unit : ''}`.trim();
  }

  if (shipment.shipmentStage) {
    const phase = shipment.shipmentStage.phase || '';
    const status = shipment.shipmentStage.status || '';
    result.latestStatus = [phase, status].filter(Boolean).join(' / ') || null;
  }

  const rawEvents = (item.milestones && item.milestones.events) || [];
  for (const e of rawEvents) {
    const time = formatOffsetDateTime(e.eventActualTime);
    if (!time) continue; // 未来里程碑无实际时间，跳过
    const code = e.eventCode || null;
    // FWB 事件上带有总重，可兜底重量字段
    if (!result.weight && e.totalGrossWeight && e.totalGrossWeight.value != null) {
      result.weight = `${e.totalGrossWeight.value}${e.totalGrossWeight.unit ? ' ' + e.totalGrossWeight.unit : ''}`.trim();
    }
    result.events.push({
      event: code,
      label: EVENT_LABELS[code] || e.translationKey || code,
      time,
    });
  }
  // 接口返回未排序，按时间倒序（最新在前）
  result.events.sort((a, b) => (a.time < b.time ? 1 : -1));
  if (result.events.length) result.lastUpdated = result.events[0].time;

  return result;
}

module.exports = {
  parseAfklShipment,
  formatOffsetDateTime,
};
