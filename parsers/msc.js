// MSC（地中海航运）官网追踪结果解析器。
// 官网 https://www.msc.com/en/track-a-shipment 提交箱号后，结果页 innerText 结构：
//   Shipped From\nCampo Calabro, IT
//   Port of Load\nGioia Tauro, IT
//   Port of Discharge\nItapoa, BR
//   Shipped To\nItapoa, BR
//   Transhipment\nValencia, ES
//   Type\n20' DRY VAN
//   Latest move\nITAPOA, BR
//   事件表头：Date / Location / Description / Empty/Laden/Vessel/Voyage / Equipment handling facility name
//   每条事件 5 行：DD/MM/YYYY / 地点 / 描述 / 船名航次或箱况(LADEN/EMPTY) / 码头设施
//   Tracking results provided by MSC on 15.10.2026 ...
function parseMscContainer(text, containerNumber) {
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

  // 箱型：Type\n20' DRY VAN
  const typeMatch = text.match(/Type\s*\n([^ \n][^\n]*)/);
  if (typeMatch) result.containerType = typeMatch[1].trim();

  // 起运港（装货港）与目的地（卸货港）
  const polMatch = text.match(/Port of Load\s*\n([^\n]+)/);
  if (polMatch) result.origin = polMatch[1].trim();
  const podMatch = text.match(/Port of Discharge\s*\n([^\n]+)/);
  if (podMatch) result.destination = podMatch[1].trim();

  // 最后更新时间：Tracking results provided by MSC on 15.10.2026 ...
  const updMatch = text.match(/Tracking results provided by MSC on\s*([^\n]+)/);
  if (updMatch) result.lastUpdated = updMatch[1].trim();

  const lines = text.split('\n').map((l) => l.trim());
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const events = [];
  for (let i = 0; i < lines.length; i++) {
    if (!dateRegex.test(lines[i])) continue;
    const date = lines[i];
    const location = (lines[i + 1] || '').trim();
    const description = (lines[i + 2] || '').trim();
    const vesselRaw = (lines[i + 3] || '').trim();
    const facility = (lines[i + 4] || '').trim();
    // 无描述说明不是事件行（例如表头外的杂项），跳过
    if (!description) continue;
    // "Price Calculation Date" 是字段值而非运输事件，跳过其伪事件行
    if (/price calculation/i.test(description)) continue;

    // 船名/航次列可能是 "MSC AMALFI MM641R"，也可能是箱况 "LADEN"/"EMPTY"
    let vessel = null;
    if (vesselRaw && !/^(LADEN|EMPTY|Equipment handling facility name)$/i.test(vesselRaw)) {
      vessel = vesselRaw;
    }

    events.push({ time: date, location, facility, event: description, vessel });
    i += 4; // 跳过该事件已消费的 4 行
  }
  result.events = events;

  if (events.length) {
    result.vessel = events.find((e) => e.vessel)?.vessel || null;
    result.latestEvent = `${events[0].event} @ ${events[0].location}`;
  }
  return result;
}

module.exports = { parseMscContainer };