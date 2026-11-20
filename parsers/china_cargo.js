// 东航物流（China Cargo Airlines）官网 eal-ceair.com 结果解析器
// 输入：page.body.innerText（按行解析，字段名\n值，可能含空行）

function _toAwb(awb) {
  return awb.length === 11 ? `${awb.slice(0, 3)}-${awb.slice(3)}` : awb;
}

// 在 lines 数组中，从 startIdx 开始找字段名为 fieldName 的行的索引
function _findLine(lines, fieldName, startIdx = 0) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() === fieldName) return i;
  }
  return -1;
}

// 取字段名的下一个非空行作为值
function _nextValue(lines, fieldIdx) {
  if (fieldIdx === -1) return null;
  for (let i = fieldIdx + 1; i < lines.length; i++) {
    const v = lines[i].trim();
    if (v) return v;
  }
  return null;
}

function parseChinaCargoShipment(bodyText, awbNumber) {
  const result = {
    awbNumber: _toAwb(awbNumber),
    airline: 'China Cargo Airlines',
    origin: null,
    destination: null,
    originName: null,
    destinationName: null,
    pieces: null,
    weight: null,
    shipmentStatus: null,
    flightInfo: null,
    cargoOperations: [],
    events: [],
  };

  if (!bodyText) return result;

  const lines = bodyText.split('\n');

  // 基础字段（字段名\n值）
  result.awbNumber = _nextValue(lines, _findLine(lines, '运单号')) || result.awbNumber;
  result.originName = _nextValue(lines, _findLine(lines, '始发站'));
  result.destinationName = _nextValue(lines, _findLine(lines, '目的站'));

  const piecesStr = _nextValue(lines, _findLine(lines, '件数'));
  if (piecesStr) {
    const m = piecesStr.match(/\d+/);
    if (m) result.pieces = parseInt(m[0], 10);
  }
  const weightStr = _nextValue(lines, _findLine(lines, '重量'));
  if (weightStr) {
    const m = weightStr.match(/[\d.]+/);
    if (m) result.weight = parseFloat(m[0]);
  }

  // 航段信息 → 找 PVG/SVO 这样的 IATA 代码
  const segIdx = _findLine(lines, '航段信息');
  if (segIdx !== -1) {
    const iata = [];
    for (let i = segIdx + 1; i < Math.min(segIdx + 15, lines.length); i++) {
      const line = lines[i].trim();
      if (/^[A-Z]{3}$/.test(line)) {
        iata.push(line);
        if (iata.length === 2) break;
      }
      if (/货物状态|承运航班信息|货物操作状态/.test(line)) break;
    }
    if (iata.length >= 2) {
      result.origin = iata[0];
      result.destination = iata[1];
    }
  }
  // 回退到中文名
  if (!result.origin) result.origin = result.originName;
  if (!result.destination) result.destination = result.destinationName;

  // 货物状态（值在「货物状态」字段的下一非空行）
  const statusIdx = _findLine(lines, '货物状态');
  if (statusIdx !== -1) {
    const val = _nextValue(lines, statusIdx);
    if (val && val !== '货物操作状态' && val !== '承运航班信息') {
      result.shipmentStatus = val;
      // 可能紧跟「件数 4」附加信息
      const val2 = _nextValue(lines, lines.findIndex((l, i) => i > statusIdx && l.trim() === val));
      if (val2 && /^件数\s*\d+/.test(val2)) {
        result.shipmentStatus = `${val} (${val2})`;
      }
    }
  }

  // 货物操作状态（4 条事件）
  const opIdx = _findLine(lines, '货物操作状态');
  if (opIdx !== -1) {
    const opLabels = ['运抵发送', '出口放行', '运单接收', '航班关闭'];
    const codeMap = { '运抵发送': 'RCS', '出口放行': 'EXR', '运单接收': 'RCA', '航班关闭': 'FCA' };
    const ops = [];
    for (const label of opLabels) {
      const labelIdx = _findLine(lines, label, opIdx);
      if (labelIdx === -1) continue;
      const time = _nextValue(lines, labelIdx);
      if (time && /\d{4}-\d{2}-\d{2}/.test(time)) {
        ops.push({ operation: label, code: codeMap[label], time });
      }
    }
    result.cargoOperations = ops;
    result.events = ops.map(op => ({
      description: op.operation,
      statusCode: op.code,
      location: null,
      flightNo: null,
      time: op.time,
    }));
  }

  // 承运航班信息
  const flightIdx = _findLine(lines, '承运航班信息');
  if (flightIdx !== -1) {
    const flight = {
      flightNo: _nextValue(lines, _findLine(lines, '航班号', flightIdx)),
      flightDate: _nextValue(lines, _findLine(lines, '航班日期', flightIdx)),
      loadingStation: _nextValue(lines, _findLine(lines, '装机站', flightIdx)),
      unloadingStation: _nextValue(lines, _findLine(lines, '卸机站', flightIdx)),
      actualDeparture: _nextValue(lines, _findLine(lines, '实际起飞', flightIdx)),
      actualArrival: _nextValue(lines, _findLine(lines, '实际到达', flightIdx)),
    };
    // —— / ——— 视为未到达
    if (flight.actualArrival && /^[\-—–]+$/.test(flight.actualArrival)) {
      flight.actualArrival = null;
    }
    if (flight.flightNo) {
      result.flightInfo = flight;
    }
  }

  // 回填事件的地点/航班名：4 条货物操作均发生在始发站，且归入同一承运航班
  const originCode = result.origin || (result.flightInfo && result.flightInfo.loadingStation) || null;
  const flightNo = (result.flightInfo && result.flightInfo.flightNo) || null;
  for (const ev of result.events) {
    ev.location = ev.location || originCode;
    ev.flightNo = ev.flightNo || flightNo;
  }

  return result;
}

// 东航物流官网 /eos/awb/{运单}/{验证码} 接口数据解析器
// 输入：接口返回的 data 数组（每个元素为一个运单的完整数据），不依赖前端渲染
function _str(v) {
  return v == null ? null : (String(v).trim() || null);
}

function parseChinaCargoJson(payload, awbNumber) {
  const result = {
    awbNumber: _toAwb(awbNumber),
    airline: 'China Cargo Airlines',
    origin: null,
    destination: null,
    originName: null,
    destinationName: null,
    pieces: null,
    weight: null,
    shipmentStatus: null,
    flightInfo: null,
    cargoOperations: [],
    events: [],
  };

  const rows = Array.isArray(payload) ? payload : (payload ? [payload] : []);
  const row = rows.find(r => r && !r.error);
  if (!row) return result;

  result.awbNumber = _str(row.mawbNo) || result.awbNumber;
  if (row.pieces != null) {
    const n = parseInt(String(row.pieces).replace(/[^\d]/g, ''), 10);
    if (!isNaN(n)) result.pieces = n;
  }
  if (row.weight != null) {
    const n = parseFloat(String(row.weight).replace(/[^\d.]/g, ''));
    if (!isNaN(n)) result.weight = n;
  }

  // 航段：首站 → 末站
  const segs = Array.isArray(row.cargoSegmentInfoDTOList) ? row.cargoSegmentInfoDTOList : [];
  if (segs.length) {
    result.origin = _str(segs[0].airportStation);
    result.destination = _str(segs[segs.length - 1].airportStation);
    result.originName = _str(segs[0].airportStationName);
    result.destinationName = _str(segs[segs.length - 1].airportStationName);
  }

  // 批次（航段）及其操作节点
  const outerList = Array.isArray(row.nodeTrailOuterInfoDTOList) ? row.nodeTrailOuterInfoDTOList : [];
  const ops = [];
  for (const outer of outerList) {
    const nodes = Array.isArray(outer.trailNodeDTOList) ? outer.trailNodeDTOList : [];
    for (const n of nodes) {
      const operation = _str(n.statusType);
      const time = _str(n.operateTime);
      if (!operation && !time) continue;
      ops.push({
        operation,
        code: _str(n.trailCode),
        time,
        flightNo: _str(outer.flightNo),
        oriAirport: _str(outer.oriAirport),
        arrAirport: _str(outer.arrAirport),
        actualArrival: _str(outer.actualArrivalTime),
      });
    }
  }

  result.cargoOperations = ops.map(o => ({ operation: o.operation, code: o.code, time: o.time }));

  // 最近一次操作即当前货物状态
  const lastOp = ops.length ? ops[ops.length - 1] : null;
  if (lastOp && lastOp.operation) result.shipmentStatus = lastOp.operation;

  // 航班信息取最后一个批次（最新航段）
  const lastOuter = outerList.length ? outerList[outerList.length - 1] : null;
  if (lastOuter && _str(lastOuter.flightNo)) {
    result.flightInfo = {
      flightNo: _str(lastOuter.flightNo),
      flightDate: _str(lastOuter.flightDate),
      loadingStation: _str(lastOuter.oriAirport),
      unloadingStation: _str(lastOuter.arrAirport),
      actualDeparture: _str(lastOuter.actualDepartureTime),
      actualArrival: _str(lastOuter.actualArrivalTime),
    };
  }

  // 轨迹事件：按节点顺序，地点按"该批次是否已到达"判定
  result.events = ops.map(o => {
    const arrived = o.actualArrival && o.time && o.time >= o.actualArrival;
    return {
      description: o.operation,
      statusCode: o.code,
      location: arrived ? (o.arrAirport || null) : (o.oriAirport || null),
      flightNo: o.flightNo || null,
      time: o.time,
    };
  });

  // 航段列表缺失时，用首个批次的首末机场兜底
  if (!result.origin && outerList.length) {
    result.origin = _str(outerList[0].oriAirport);
    result.destination = _str(outerList[0].arrAirport);
  }

  return result;
}

module.exports = { parseChinaCargoShipment, parseChinaCargoJson };
