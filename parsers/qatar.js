// Qatar Airways Cargo 官网（qrcargo.com）结果解析器
// 输入：page.evaluate 返回的 { bodyText, eventList, statusList, flightList } 结构
// 输出：归一化的空运单数据结构

function _parsePiecesWeightVolume(text) {
  const result = { pieces: null, weight: null, volume: null };
  // 兼容 "2 Piece(s) | 2,302 Kg | 1.46 m3" 和 "2 Pcs | 2.302 Kg | 1.146 m³"
  const m = text.match(/(\d+)\s*(?:Piece\(s\)|Pcs)\s*\|\s*([\d.,]+)\s*(?:Kg|kg)\s*(?:\|\s*([\d.,]+)\s*m[3³])?/i);
  if (m) {
    result.pieces = parseInt(m[1], 10);
    result.weight = parseFloat(m[2].replace(/,/g, ''));
    if (m[3]) result.volume = parseFloat(m[3].replace(/,/g, ''));
  } else {
    const p = text.match(/(\d+)\s*(?:Piece\(s\)|Pcs)/i);
    if (p) result.pieces = parseInt(p[1], 10);
    const w = text.match(/([\d.,]+)\s*(?:Kg|kg)/i);
    if (w) result.weight = parseFloat(w[1].replace(/,/g, ''));
    const v = text.match(/([\d.,]+)\s*m[3³]/i);
    if (v) result.volume = parseFloat(v[1].replace(/,/g, ''));
  }
  return result;
}

function _parseRoute(text) {
  // 匹配 "(PKX - DXB)"
  const m = text.match(/\(\s*([A-Z]{3})\s*-\s*([A-Z]{3})\s*\)/);
  if (m) return { origin: m[1], destination: m[2] };
  return { origin: null, destination: null };
}

function _parseCurrentStatus(text) {
  // 匹配 "Delivered ( DXB)"
  const m = text.match(/\b(Delivered|Arrived|Departed|Booked|Received|Accepted|In Transit|Not Delivered|Notified consignee)\b\s*\(\s*([A-Z]{3})\s*\)/i);
  if (m) return { status: m[1], location: m[2] };
  // 兜底
  const m2 = text.match(/\b(Delivered|Arrived|Departed|Booked|Received|Accepted|In Transit|Not Delivered)\b/i);
  if (m2) return { status: m2[1], location: null };
  return { status: null, location: null };
}

function _parseArrivalInfo(text) {
  // 匹配 "Arrived ( DXB) 21-Jul-2026 03:36"
  const m = text.match(/Arrived\s*\(\s*([A-Z]{3})\s*\)\s*(\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d{2}:\d{2})/i);
  if (m) return { location: m[1], time: m[2] };
  return null;
}

// 标准事件描述正则：匹配 9 种标准 AWB 状态描述
// 例：Delivered in DXB / Notified consignee / Received in DXB / Arrived in DXB on QR 1002/21-Jul-2026
const EVENT_DESC_RE =
  /^(Delivered in [A-Z]{3}|Notified consignee|Received in [A-Z]{3}|Arrived in [A-Z]{3} on QR\s?\d{3,4}\/\d{1,2}-[A-Za-z]{3}-\d{4}|Departed from [A-Z]{3} on QR\s?\d{3,4}\/\d{1,2}-[A-Za-z]{3}-\d{4}|Received from shipper in [A-Z]{3}|Booked|Accepted|Departed from [A-Z]{3}|Arrived in [A-Z]{3})\s*$/;

// 件重体行正则：匹配 "2 Pcs | 2,302 Kg | 1.46 m3"
const EVENT_PWV_RE = /^(\d+)\s*Pcs\s*\|\s*([\d.,]+)\s*Kg\s*(?:\|\s*([\d.,]+)\s*m[3³])?\s*$/i;

// 日期行正则：匹配 "Tue, 21 Jul 2026"
const EVENT_DATE_RE = /^([A-Za-z]{3}),\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s*$/;

// 时间行正则：匹配 "21:54"
const EVENT_TIME_RE = /^(\d{1,2}:\d{2})\s*$/;

function _parseEventItem(desc, pwvLine, dateLine, timeLine) {
  // 站点
  const locMatch = desc.match(/\b([A-Z]{3})\b/);
  const location = locMatch ? locMatch[1] : null;

  // 航班号 "QR 1002" / "QR1002" / "QR-1002"
  const flightMatch = desc.match(/QR[-\s]?(\d{3,4})/i);
  const flightNo = flightMatch ? `QR-${flightMatch[1]}` : null;

  // 件重体
  const pwv = _parsePiecesWeightVolume(pwvLine || '');

  // 状态码
  let statusCode = null;
  if (/delivered in/i.test(desc)) statusCode = 'DLV';
  else if (/notified consignee/i.test(desc)) statusCode = 'NFD';
  else if (/arrived in/i.test(desc)) statusCode = 'ARR';
  else if (/departed from/i.test(desc)) statusCode = 'DEP';
  else if (/received from shipper/i.test(desc)) statusCode = 'RCS';
  else if (/received in/i.test(desc)) statusCode = 'RCF';
  else if (/booked/i.test(desc)) statusCode = 'BKD';

  const time = dateLine && timeLine ? `${dateLine} ${timeLine}` : null;

  return {
    description: desc.trim(),
    statusCode,
    location,
    flightNo,
    time,
    timeRaw: time,
    pieces: pwv.pieces,
    weight: pwv.weight,
    volume: pwv.volume,
  };
}

// 从 bodyText 按行提取事件（每个事件 4 行：描述/件重体/日期/时间）
function _parseEventsFromText(bodyText) {
  const events = [];
  const lines = bodyText.split('\n').map(l => l.trim());

  for (let i = 0; i < lines.length - 3; i++) {
    const line = lines[i];
    if (!EVENT_DESC_RE.test(line)) continue;
    const desc = line;
    const pwvLine = lines[i + 1] || '';
    const dateLine = lines[i + 2] || '';
    const timeLine = lines[i + 3] || '';

    // 校验后续 3 行格式
    if (!EVENT_PWV_RE.test(pwvLine)) continue;
    if (!EVENT_DATE_RE.test(dateLine)) continue;
    if (!EVENT_TIME_RE.test(timeLine)) continue;

    const dateMatch = dateLine.match(EVENT_DATE_RE);
    const timeMatch = timeLine.match(EVENT_TIME_RE);
    const parsed = _parseEventItem(desc, pwvLine, dateMatch[2], timeMatch[1]);
    events.push(parsed);
  }
  return events;
}

// 从事件列表推导航段（合并 DEP + ARR 配对）
function _deriveFlightsFromEvents(events) {
  const flights = [];
  const deps = events.filter(e => e.statusCode === 'DEP');
  const arrs = events.filter(e => e.statusCode === 'ARR');

  for (const dep of deps) {
    const depFlight = dep.flightNo;
    const arr = arrs.find(a => a.flightNo === depFlight && a.time);
    flights.push({
      flightNo: depFlight || null,
      type: 'PAX', // Qatar 主要是客机腹舱，标注为 PAX
      from: dep.location,
      to: arr ? arr.location : null,
      depTime: dep.time,
      arrTime: arr ? arr.time : null,
      pieces: dep.pieces,
    });
  }

  // 兜底
  if (flights.length === 0) {
    const seen = new Set();
    for (const e of events) {
      if (e.flightNo && !seen.has(e.flightNo)) {
        seen.add(e.flightNo);
        flights.push({ flightNo: e.flightNo, type: null, from: null, to: null, depTime: null, arrTime: null, pieces: e.pieces });
      }
    }
  }
  return flights;
}

function parseQatarShipment(extracted, awbNumber) {
  const bodyText = extracted.bodyText || '';

  const result = {
    awbNumber: awbNumber.length === 11 ? `${awbNumber.slice(0, 3)}-${awbNumber.slice(3)}` : awbNumber,
    airline: 'Qatar Airways Cargo',
    origin: null,
    destination: null,
    pieces: null,
    weight: null,
    volume: null,
    currentStatus: null,
    arrivalInfo: null,
    flights: [],
    events: [],
  };

  if (!bodyText) return result;

  // 路由信息
  const route = _parseRoute(bodyText);
  result.origin = route.origin;
  result.destination = route.destination;

  // 件数/重量/体积（从摘要区取，用兼容 m3 的正则）
  const pwv = _parsePiecesWeightVolume(bodyText);
  result.pieces = pwv.pieces;
  result.weight = pwv.weight;
  result.volume = pwv.volume;

  // 当前状态
  const status = _parseCurrentStatus(bodyText);
  result.currentStatus = status.status;
  if (!result.destination && status.location) result.destination = status.location;

  // 到达信息
  const arrival = _parseArrivalInfo(bodyText);
  if (arrival) result.arrivalInfo = `${arrival.location} ${arrival.time}`;

  // 事件列表（按 4 行模式从 bodyText 提取）
  result.events = _parseEventsFromText(bodyText);

  // 从事件反推路由、件数、当前状态
  if (result.events.length > 0) {
    const firstEvent = result.events[result.events.length - 1];
    const lastEvent = result.events[0];
    if (!result.origin && firstEvent.location) result.origin = firstEvent.location;
    if (!result.destination && lastEvent.location) result.destination = lastEvent.location;
    if (!result.currentStatus && lastEvent.statusCode) {
      const codeMap = { DLV: 'Delivered', NFD: 'Notified', ARR: 'Arrived', DEP: 'Departed', RCS: 'Received from shipper', RCF: 'Received', BKD: 'Booked' };
      result.currentStatus = codeMap[lastEvent.statusCode] || lastEvent.statusCode;
    }
    if (result.pieces === null && lastEvent.pieces) result.pieces = lastEvent.pieces;
    if (result.weight === null && lastEvent.weight) result.weight = lastEvent.weight;
    if (result.volume === null && lastEvent.volume) result.volume = lastEvent.volume;
  }

  // 航段（从事件推导）
  result.flights = _deriveFlightsFromEvents(result.events);

  return result;
}

module.exports = { parseQatarShipment };
