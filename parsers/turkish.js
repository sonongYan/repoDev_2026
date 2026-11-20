// Turkish Cargo (TK, 前缀 235) 官网追踪结果解析器
// 接收 adapter 通过 page.evaluate 抽取的结构化对象，做归一化和事件时间线构造。
// 若结构化抽取失败，回退到 innerText 正则解析。

function parseTurkishShipment(extracted, awbNumber, bodyText) {
  // 抽取出错 → 回退到文本解析
  if (!extracted || extracted.error) {
    return parseFromText(bodyText || '', awbNumber);
  }

  const result = {
    awbNumber,
    airline: 'Turkish Cargo',
    origin: extracted.origin || null,
    destination: extracted.destination || null,
    fromAirport: extracted.fromAirport || null,
    toAirport: extracted.toAirport || null,
    totalPieces: extracted.totalPieces || null,
    totalWeight: extracted.totalWeight || null,
    totalVolume: extracted.totalVolume || null,
    lastAcceptanceDate: extracted.lastAcceptanceDate || null,
    currentStatus: extracted.currentStatus || null,
    currentStatusTime: extracted.currentStatusTime || null,
    flights: extracted.flights || [],
    statusHistory: extracted.statusHistory || [],
    latestStatus: extracted.currentStatus ||
      (extracted.lastAcceptanceDate ? `Last Acceptance: ${extracted.lastAcceptanceDate}` : null),
    events: [],
  };

  // 从 statusHistory 构造事件时间线
  for (const sh of result.statusHistory) {
    result.events.push({
      event: `${sh.status} - ${sh.description} @ ${sh.station}${sh.flightNo ? ` (${sh.flightNo})` : ''}`,
      time: sh.actualTime || sh.eta || sh.etd,
      location: sh.station || null,
      flightNo: sh.flightNo || null,
    });
  }

  // 兜底事件
  if (result.events.length === 0 && result.lastAcceptanceDate) {
    result.events.push({
      event: 'Last Acceptance',
      time: result.lastAcceptanceDate,
    });
  }

  return result;
}

// 兜底：从 innerText 解析（不依赖 DOM 结构化抽取）
function parseFromText(text, awbNumber) {
  const result = {
    awbNumber,
    airline: 'Turkish Cargo',
    origin: null,
    destination: null,
    fromAirport: null,
    toAirport: null,
    totalPieces: null,
    totalWeight: null,
    totalVolume: null,
    lastAcceptanceDate: null,
    currentStatus: null,
    currentStatusTime: null,
    flights: [],
    statusHistory: [],
    latestStatus: null,
    events: [],
  };

  if (!text) return result;

  const lastAccMatch = text.match(/Last Acceptance Date and Time\s*:?\s*([^\n]+)/i);
  if (lastAccMatch) result.lastAcceptanceDate = lastAccMatch[1].trim();

  const fromMatch = text.match(/\bFrom\s*\n\s*([A-Z]{3})\s*-\s*([^\n]+)/i);
  if (fromMatch) {
    result.origin = fromMatch[1];
    result.fromAirport = `${fromMatch[1]} - ${fromMatch[2].trim()}`;
  }
  const toMatch = text.match(/\bTo\s*\n\s*([A-Z]{3})\s*-\s*([^\n]+)/i);
  if (toMatch) {
    result.destination = toMatch[1];
    result.toAirport = `${toMatch[1]} - ${toMatch[2].trim()}`;
  }

  const piecesMatch = text.match(/(\d+)\s*piece\(s\)/i);
  if (piecesMatch) result.totalPieces = piecesMatch[1];
  const weightMatch = text.match(/([\d.]+)\s*kg/i);
  if (weightMatch) result.totalWeight = `${weightMatch[1]} kg`;
  const volumeMatch = text.match(/([\d.]+)\s*m3/i);
  if (volumeMatch) result.totalVolume = `${volumeMatch[1]} m3`;

  const currentMatch = text.match(
    /(In Transit|Delivered|Accepted|Booked|Departed|Arrived|Notified|Ready for|On Hand)[^\n]*\n\s*([^\n]+)/i
  );
  if (currentMatch) {
    result.currentStatus = `${currentMatch[1].trim()} - ${currentMatch[2].trim()}`;
    result.currentStatusTime = currentMatch[2].trim();
    result.latestStatus = result.currentStatus;
  } else if (result.lastAcceptanceDate) {
    result.latestStatus = `Last Acceptance: ${result.lastAcceptanceDate}`;
  }

  // 兜底航班号（去重）
  const flightNoSet = new Set();
  const fnMatches = text.match(/\bTK\d{3,4}\b/g) || [];
  for (const fn of fnMatches) flightNoSet.add(fn);
  for (const fn of flightNoSet) {
    result.flights.push({ flightNo: fn });
  }

  if (result.lastAcceptanceDate) {
    result.events.push({
      event: 'Last Acceptance',
      time: result.lastAcceptanceDate,
    });
  }

  return result;
}

module.exports = { parseTurkishShipment };
