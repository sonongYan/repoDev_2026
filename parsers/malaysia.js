'use strict';

// MASkargo（马来西亚航空货运 232）追踪接口解析。
// 接口响应结构（2026-11 官网前端代码）：{ data: { routing, status, shipmentId, pieces, weight, volume, history[] } }
// history[]: { timestamp, station, description, pieces, weight:{value,unit}, flight:{flightNumber,...}, status }

function pad(n) {
  return String(n).padStart(2, '0');
}

// 统一成报告层认识的 "YYYY-MM-DD HH:mm"（本地时区）；无法识别时原样返回
function normalizeTime(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e10 ? value * 1000 : value;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return String(value);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{10,13}$/.test(raw)) return normalizeTime(Number(raw));
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }
  return raw;
}

// 官网状态文本 → IATA 状态码（报告层再统一转中文）
const STATUS_CODE_RULES = [
  [/deliver/i, 'DLV'],
  [/notified/i, 'NFD'],
  [/arriv/i, 'ARR'],
  [/depart/i, 'DEP'],
  [/manifest/i, 'MAN'],
  [/accepted/i, 'RCA'],
  [/received/i, 'RCS'],
  [/booked/i, 'BKD'],
  [/customs.*release/i, 'EXR'],
];

function statusCodeOf(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  if (/^[A-Z]{3}$/.test(raw)) return raw;
  const hit = STATUS_CODE_RULES.find(([re]) => re.test(raw));
  return hit ? hit[1] : null;
}

function unitOf(obj) {
  return obj && obj.unit ? String(obj.unit).trim() : '';
}

function amountOf(obj) {
  if (obj == null) return null;
  if (typeof obj !== 'object') return obj === '' ? null : obj;
  const value = obj.value ?? obj.amount;
  if (value == null || value === '') return null;
  const unit = unitOf(obj);
  return unit ? `${value} ${unit}` : value;
}

function pickStation(station) {
  if (!station || typeof station !== 'object') return { code: null, name: null };
  const code = station.stationCode || station.code || station.iata || null;
  const name = station.stationName || station.name || null;
  return { code, name };
}

function parseHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const flight = item.flight && typeof item.flight === 'object' ? item.flight : null;
      const desc = item.description || item.status || '';
      return {
        time: normalizeTime(item.timestamp ?? item.time ?? item.dateTime),
        statusCode: statusCodeOf(item.status) || statusCodeOf(desc),
        description: String(desc || '').trim(),
        location: item.station || null,
        flightNo: flight ? (flight.flightNumber || null) : null,
        pieces: item.pieces ?? null,
        weight: amountOf(item.weight),
      };
    })
    .filter((ev) => ev.time || ev.description || ev.location);
}

/**
 * 把 MASkargo 接口 data 段转成项目统一空运单结构
 * @param {object} payload 接口返回的 data 对象
 * @param {string} awbNumber 带横线的运单号（232-xxxxxxxx）
 */
function parseMalaysiaShipment(payload, awbNumber) {
  const data = payload && payload.data ? payload.data : (payload || {});
  const routing = data.routing || {};
  const origin = pickStation(routing.origin);
  const destination = pickStation(routing.destStation || routing.destination);
  const events = parseHistory(data.history);
  const lastTime = events
    .map((ev) => ev.time)
    .filter(Boolean)
    .sort()
    .pop() || null;

  return {
    awbNumber: awbNumber || data.shipmentId || null,
    carrier: 'Malaysia Airlines (MASkargo)',
    shipmentId: data.shipmentId || null,
    origin: origin.code || null,
    originName: origin.name || null,
    destination: destination.code || null,
    destinationName: destination.name || null,
    pieces: data.pieces ?? null,
    weight: amountOf(data.weight),
    volume: amountOf(data.volume),
    currentStatus: data.status || (events.length ? events[events.length - 1].description : null),
    lastUpdated: lastTime,
    events,
  };
}

module.exports = { parseMalaysiaShipment, normalizeTime };
