// 通用空运单（AWB）结果解析器
// 适用于 track-trace Air Cargo 板块，以及各家航空（KLM/AF/FedEx/UPS 等）
function parseAirWaybill(text, awbNumber, options = {}) {
  const result = {
    awbNumber,
    airline: options.airline || null,
    origin: null,
    destination: null,
    pieces: null,
    weight: null,
    lastUpdated: null,
    latestStatus: null,
    events: [],
  };

  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const joined = text.replace(/[ \t]+/g, ' ');

  // 通用字段正则
  const originMatch = text.match(/(?:Origin|From)\s*:?\s*([A-Z]{3})/i);
  if (originMatch) result.origin = originMatch[1].trim();

  const destMatch = text.match(/(?:Destination|To)\s*:?\s*([A-Z]{3})/i);
  if (destMatch) result.destination = destMatch[1].trim();

  const piecesMatch = text.match(/(?:Pieces|Kolli)\s*:?\s*(\d+)/i);
  if (piecesMatch) result.pieces = piecesMatch[1].trim();

  const weightMatch = text.match(/(?:Weight)\s*:?\s*([\d.,]+\s*(?:kg|KG))?/i) ||
    text.match(/([\d.,]+)\s*(?:kg|KG)\b/i);
  if (weightMatch && weightMatch[1]) result.weight = weightMatch[1].trim();

  const updatedMatch = text.match(/(?:Last update[sd]?|Updated)\s*:?\s*([^\n]+)/i);
  if (updatedMatch) result.lastUpdated = updatedMatch[1].trim();

  const statusMatch = text.match(/(?:Status|Current status)\s*:?\s*([A-Z][^.\n]*)/i);
  if (statusMatch) result.latestStatus = statusMatch[1].trim();

  // 事件行：常见 track-trace 空运事件关键词
  const eventKeywords = options.eventKeywords || [
    'Arrived', 'Departed', 'Delivered', 'Received', 'Booked', 'In transit',
    'Customs', 'Clearance', 'Manifested', 'On hand', 'Released',
    '到达', '离开', '派送', '签收', '转运',
  ];
  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!eventKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) continue;
    // 尝试向后找时间戳
    const timeMatch = text.match(/\d{2}\s+\w{3}\s+\d{4}/g);
    const time = timeMatch && timeMatch[timeMatch.length - 1] ? timeMatch[timeMatch.length - 1] : null;
    const key = line + '|' + time;
    if (seen.has(key)) continue;
    seen.add(key);
    result.events.push({ event: line, time });
  }

  return result;
}

// KLM（和 AF-KL-MP）专用解析，可挂接更多 KLM 特有字段
function parseKlmAirWaybill(text, awbNumber) {
  const base = parseAirWaybill(text, awbNumber, { airline: 'KLM Royal Dutch Airlines' });
  // KLM 官网/afklcargo 可能有更多结构，此处为 track-trace 通用版
  return base;
}

module.exports = {
  parseAirWaybill,
  parseKlmAirWaybill,
};