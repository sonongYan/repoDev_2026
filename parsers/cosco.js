// 事件提取通用逻辑：从文本行中提取“事件+时间+位置/运输方式”
function extractEvents(lines) {
  const events = [];
  const timeRegex = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/;
  const eventKeywords = [
    '离开始发港', '到达始发港', '离开起运港', '到达起运港',
    '离开中转港', '到达中转港', '离开目的港', '到达目的港',
    '装船', '卸船', '进港', '出港',
    '提空箱', '还空箱', '提箱', '还箱',
    'Gate in', 'Gate out', 'Load', 'Discharge',
    'Vessel departure', 'Vessel arrival',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!eventKeywords.some(k => line.includes(k))) continue;

    let time = null;
    let timeIdx = -1;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (timeRegex.test(lines[j])) {
        time = lines[j];
        timeIdx = j;
        break;
      }
    }
    if (!time) continue;

    let location = null;
    let transport = null;

    if (timeIdx + 1 < lines.length) {
      const rawNext = lines[timeIdx + 1];
      let parts = rawNext.split('\t').map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) parts = rawNext.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
      if (parts.length < 2) {
        const lastSpace = rawNext.lastIndexOf(' ');
        if (lastSpace > 0) parts = [rawNext.slice(0, lastSpace).trim(), rawNext.slice(lastSpace + 1).trim()];
      }
      if (parts.length >= 2) {
        location = parts[0];
        transport = parts[parts.length - 1];
      } else {
        location = rawNext;
      }
    }

    events.push({ event: line, time, location, transport });
  }

  return events;
}

function parseCoscoContainer(text, containerNumber) {
  const result = {
    containerNumber,
    containerType: null,
    eta: null,
    events: [],
  };

  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const typeMatch = text.match(/箱型尺寸\s*([A-Z0-9]+)/);
  if (typeMatch) result.containerType = typeMatch[1].trim();

  const etaMatch = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*\n\s*预计到港/);
  if (etaMatch) result.eta = etaMatch[1].trim();

  result.events = extractEvents(lines);

  return result;
}

function parseCoscoBillOfLading(text, blNumber) {
  const result = {
    blNumber,
    containers: [],
    eta: null,
    etd: null,
    pod: null,
    pol: null,
    events: [],
  };

  if (!text) return { ...result, raw: text ? text.slice(0, 500) : '' };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const joined = text.replace(/\s+/g, ' ');

  const containerRegex = /\b[A-Z]{4}\d{7}\b/g;
  const found = joined.match(containerRegex) || [];
  const seen = new Set();
  for (const c of found) seen.add(c.toUpperCase());
  const containerNumbers = Array.from(seen);
  result.containers = containerNumbers.map((cn) => ({
    containerNumber: cn,
    containerType: null,
    eta: null,
    events: [],
  }));

  for (const cn of containerNumbers) {
    const idx = joined.indexOf(cn);
    let block = '';
    if (idx >= 0) {
      block = joined.slice(idx, idx + 300);
    }

    const typeM = block.match(/箱型尺寸\s*([A-Z0-9]+)/) || block.match(/([A-Z0-9]{2,4}(?:GP|HQ|HC|RF|TK|OT|FR|RE)\b)/);
    const container = result.containers.find(c => c.containerNumber === cn);
    if (container && typeM) container.containerType = typeM[1].trim();

    const etaM = block.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*预计到港/);
    if (container && etaM) container.eta = etaM[1].trim();
  }

  const etaMatch = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*\n\s*预计到港/);
  if (etaMatch) result.eta = etaMatch[1].trim();

  result.events = extractEvents(lines);
  result.raw = text.slice(0, 500);

  return result;
}

module.exports = {
  parseCoscoContainer,
  parseCoscoBillOfLading,
};
