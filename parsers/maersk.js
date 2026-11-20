function parseTrackTraceContainer(text, containerNumber) {
  const result = {
    containerNumber,
    origin: null,
    destination: null,
    containerType: null,
    lastUpdated: null,
    latestEvent: null,
    vessel: null,
    events: [],
  };

  if (!text) return result;

  const routeMatch = text.match(/From\s*\n([A-Z\s]+)\nTo\s*\n([A-Z\s]+)/);
  if (routeMatch) {
    result.origin = routeMatch[1].trim();
    result.destination = routeMatch[2].trim();
  }

  const typeMatch = text.match(/\|\s*\n?(\d{2}'\s*[A-Za-z ]+)/);
  if (typeMatch) result.containerType = typeMatch[1].trim();

  const updatedMatch = text.match(/Last updated:\s*([^\n]+)/);
  if (updatedMatch) result.lastUpdated = updatedMatch[1].trim();

  const latestMatch = text.match(/Vessel departure\s*•\s*([^\n]+)/);
  if (latestMatch) result.latestEvent = `Vessel departure • ${latestMatch[1].trim()}`;

  const vesselMatch = text.match(/MAERSK\s+[A-Z]+\s*\/\s*\d+[A-Z]?/);
  if (vesselMatch) result.vessel = vesselMatch[0].trim();

  const timeRegex = /\d{2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}/;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const eventKeywords = [
    'Gate out', 'Gate in', 'Load on', 'Vessel departure', 'Vessel arrival',
    'Feeder departure', 'Feeder arrival', 'Empty', 'Loaded', 'Discharged',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!eventKeywords.some(k => line.includes(k))) continue;

    let time = null;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const m = lines[j].match(timeRegex);
      if (m) { time = m[0]; break; }
    }

    const location = lines[i - 2] || null;
    const facility = lines[i - 1] || null;

    result.events.push({ location, facility, event: line, time });
  }

  return result;
}

const parseMaerskContainer = parseTrackTraceContainer;

/**
 * 解析 Maersk 官网直连结果（https://www.maersk.com/tracking/{号}）。
 * 页面 innerText 结构：
 *   From\nMANZANILLO\nTo\nWEIHAI
 *   MSKU7294860 | 20' Dry Standard
 *   Last updated: 11 hours ago
 *   Vessel departure • MANZANILLO, MEXICO • 22 Sep 2026   <- 摘要行（Latest event）
 *   事件块：事件关键词行（可含 (船名)）\n时间行
 *   地点/设施为事件行上方 1-2 行的可选前缀（非时间、非事件行）
 */
function parseMaerskContainerOfficial(text, containerNumber) {
  const result = {
    containerNumber,
    origin: null,
    destination: null,
    containerType: null,
    lastUpdated: null,
    latestEvent: null,
    vessel: null,
    departure: null,
    eta: null,
    events: [],
  };
  if (!text) return result;

  const timeRegex = /\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}/;
  const eventKeywords = [
    'Gate out', 'Gate in', 'Load on', 'Vessel departure', 'Vessel arrival',
    'Feeder departure', 'Feeder arrival', 'Empty', 'Loaded', 'Discharged',
  ];

  const typeMatch = text.match(/\d{2}'\s*[A-Za-z ]+/);
  if (typeMatch) result.containerType = typeMatch[0].trim();

  const updatedMatch = text.match(/Last updated:\s*([^\n]+)/);
  if (updatedMatch) result.lastUpdated = updatedMatch[1].trim();

  // 摘要行（Latest event）：位于 Last updated 之后、以 • 分隔的汇总文本
  const latestMatch = text.match(/Last updated:[^\n]*\n([^\n]+•[^\n]+)/);
  if (latestMatch) result.latestEvent = latestMatch[1].trim();

  const odMatch = text.match(/From\s*\n([A-Z][A-Z ]{1,40}?)\nTo\s*\n([A-Z][A-Z ]{1,40})/);
  if (odMatch) {
    result.origin = odMatch[1].trim();
    result.destination = odMatch[2].trim();
  }

  // 离港（ETD）与预计到港（ETA）：页面 "Departs <地点>\n<日期>" / "Arrives <地点>\n<日期> (ETA)"
  const depMatch = text.match(/Departs[^\n]*\n([^\n]*?\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/);
  if (depMatch) {
    const m = depMatch[1].match(/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/);
    if (m) result.departure = m[0];
  }
  const etaMatch = text.match(/Arrives[^\n]*\n([^\n]*?\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/);
  if (etaMatch) {
    const m = etaMatch[1].match(/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/);
    if (m) result.eta = m[0];
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // 事件行上方回溯：跳过时间行与事件行，最多取 2 行作为 [更远]地点 / [最近]设施
  const lookBack = (i) => {
    const back = [];
    for (let j = i - 1; j >= 0 && back.length < 2; j--) {
      const l = lines[j];
      if (timeRegex.test(l)) continue;
      if (eventKeywords.some((k) => l.includes(k))) continue;
      back.push(l);
    }
    return back;
  };

  const events = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!eventKeywords.some((k) => line.includes(k))) continue;
    // 真实事件块后必跟时间行；摘要行（含 •）无时间 → 跳过
    const time = i + 1 < lines.length && timeRegex.test(lines[i + 1]) ? lines[i + 1].match(timeRegex)[0] : null;
    if (!time) continue;
    const back = lookBack(i);
    events.push({
      location: back[1] || null,
      facility: back[0] || null,
      event: line.replace(/\s*Latest event\s*$/, '').trim(),
      vessel: line.match(/\(([^)]+)\)/)?.[1] || null,
      time,
    });
  }
  result.events = events;

  if (events.length) {
    if (!result.origin) result.origin = events[0].location || null;
    if (!result.destination) result.destination = events[events.length - 1].location || null;
    result.vessel = events.find((e) => e.vessel)?.vessel || null;
  }
  return result;
}

function parseMaerskBillOfLading(text, blNumber) {
  return {
    blNumber,
    containers: [],
    eta: null,
    raw: text ? text.slice(0, 500) : '',
    note: 'Maersk 提单号解析规则待补充',
  };
}

module.exports = {
  parseTrackTraceContainer,
  parseMaerskContainer,
  parseMaerskContainerOfficial,
  parseMaerskBillOfLading,
};
