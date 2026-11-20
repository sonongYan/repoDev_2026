// Emirates SkyCargo (EK, 前缀 176) eSkyCargo 货件追踪结果解析器
// 输入：eskycargo.emirates.com SPA 渲染后的 body 文本
// 字段参考真实页面布局：状态横幅 / 航线 / 件数 / 毛重 / 体积 / 计费重 / Product Code / Goods Description / SHCs

function parseEmiratesShipment(text, awbNumber) {
  const result = {
    awbNumber,
    airline: 'Emirates SkyCargo',
    origin: null,
    destination: null,
    pieces: null,
    weight: null,
    volume: null,
    chargeableWeight: null,
    productCode: null,
    goodsDescription: null,
    shcs: [],
    latestStatus: null,
    orderCreatedOn: null,
    shipper: null,
    consignee: null,
    events: [],
  };

  if (!text) return result;

  // 最新状态横幅常见关键词（按生命周期先后顺序）
  const statusKeywords = [
    'Delivered to the Consignee',
    'Delivered',
    'Handed over to Consignee',
    'Arrived at Destination',
    'Arrived',
    'Departed from Origin',
    'Departed',
    'Customs Released',
    'In Transit',
    'Accepted at Origin',
    'Booked',
    'Manifested',
    'Cancelled',
    'On Hold',
  ];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const hit = statusKeywords.find(k => line.toLowerCase().includes(k.toLowerCase()));
    if (hit) {
      result.latestStatus = line;
      break;
    }
  }

  // 航线：BANGKOK (BKK) → DUBAI (DXB) 或 BANGKOK (BKK) 换行 DUBAI (DXB)
  // 页面渲染时两个机场间可能是箭头、换行或空格分隔
  const routeMatch = text.match(
    /([A-Z][A-Z\s()]+?)\s*\(([A-Z]{3})\)\s*(?:[→\->\s]*\n?\s*)([A-Z][A-Z\s()]+?)\s*\(([A-Z]{3})\)/
  );
  if (routeMatch) {
    result.origin = routeMatch[2];
    result.destination = routeMatch[4];
  }

  // 件数：Pieces 10
  const piecesMatch = text.match(/Pieces\s*:?\s*(\d+)/i);
  if (piecesMatch) result.pieces = piecesMatch[1];

  // 毛重：Gross Weight 329 K
  const grossMatch = text.match(/Gross Weight\s*:?\s*([\d.,]+)\s*K?/i);
  if (grossMatch) result.weight = `${grossMatch[1]} K`;

  // 体积：Volume 2.687696 CBM (或 CM)
  const volMatch = text.match(/Volume\s*:?\s*([\d.,]+)\s*(CBM|CM)?/i);
  if (volMatch) result.volume = `${volMatch[1]} ${volMatch[2] || ''}`.trim();

  // 计费重：Chargeable Weight 448 K
  const chargeMatch = text.match(/Chargeable Weight\s*:?\s*([\d.,]+)\s*K?/i);
  if (chargeMatch) result.chargeableWeight = `${chargeMatch[1]} K`;

  // 产品代码：Product Code PXS
  const prodMatch = text.match(/Product Code\s*:?\s*([A-Z0-9]+)/i);
  if (prodMatch) result.productCode = prodMatch[1];

  // 货物描述：Goods Description PHALAENOPSIS HY (1401)
  const goodsMatch = text.match(/Goods Description\s*:?\s*([^\n]+)/i);
  if (goodsMatch) result.goodsDescription = goodsMatch[1].trim();

  // SHCs：连续 3 位大写字母标签连写（如 EAPCRTPEF = EAP+CRT+PEF），无分隔符
  const shcMatch = text.match(/SHCs?\s*:?\s*([A-Z]{3,})/i);
  if (shcMatch) {
    result.shcs = shcMatch[1].match(/.{1,3}/g) || [];
  }

  // 字段值是否疑似字段名形式（如 "Shipper:" / "Consignee:"），用于排除跨行误匹配
  const looksLikeFieldName = v => /^[A-Z][A-Za-z ]*:$/.test(v);

  // Order created on: 日期。允许跨空白行匹配值，但排除值本身是字段名形式
  const createdMatch = text.match(/Order created on[ \t]*:[ \s]*([^\n]+)/i);
  if (createdMatch) {
    const v = createdMatch[1].trim();
    if (v && !looksLikeFieldName(v)) result.orderCreatedOn = v;
  }

  // Shipper / Consignee：^ 锚定行首（避免 latestStatus 行 "Delivered to the Consignee" 子串误匹配）
  const shipperMatch = text.match(/^\s*Shipper[ \t]*:[ \s]*([^\n]+)/im);
  if (shipperMatch) {
    const v = shipperMatch[1].trim();
    if (v && !looksLikeFieldName(v)) result.shipper = v;
  }
  const consigneeMatch = text.match(/^\s*Consignee[ \t]*:[ \s]*([^\n]+)/im);
  if (consigneeMatch) {
    const v = consigneeMatch[1].trim();
    if (v && !looksLikeFieldName(v)) result.consignee = v;
  }

  // 事件行：抓取含生命周期关键词的整行，并按关键词推断地点（目的地/始发地）
  const seen = new Set();
  for (const line of lines) {
    if (!statusKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    let location = null;
    if (/arriv|deliver|destination/i.test(line)) location = result.destination;
    else if (/depart|accept|book|manifest|origin/i.test(line)) location = result.origin;
    result.events.push({ event: line, time: null, location, flightNo: null });
  }

  return result;
}

module.exports = { parseEmiratesShipment };
