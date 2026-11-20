// 模拟 AFKL 074-39882393 空运单查询全流程
// 不启动浏览器，构造符合 tnt-api 真实结构的 mock JSON → 走解析器 → 展示最终结果

const { parseAfklShipment } = require('../parsers/afkl');

// ── 1. 模拟 tnt-api 返回的 JSON（结构与 afklcargo.com 前端代码一致） ──
const mockTntResponse = [{
  shipment: {
    shipmentPrefix: '074',
    shipmentReference: '39882393',
    originDestination: {
      departureLocation: { stationCode: 'AMS', name: 'Amsterdam Schiphol' },
      arrivalLocation:   { stationCode: 'PVG', name: 'Shanghai Pudong' },
    },
    shipmentStage: {
      phase: 'DESTINATION',
      status: 'ARRIVED',
    },
  },
  shipmentCharacteristics: {
    totalPieces: 5,
    totalGrossWeight: { value: 320.5, unit: 'KG' },
  },
  milestones: {
    events: [
      {
        eventCode: 'FWB',
        translationKey: '运单数据已接收',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 25 }, time: { hour: 10, minute: 30 } },
          offset: { totalSeconds: 7200 },
        },
        totalGrossWeight: { value: 320.5, unit: 'KG' },
      },
      {
        eventCode: 'RCS',
        translationKey: '已从托运人处收货',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 25 }, time: { hour: 14, minute: 0 } },
          offset: { totalSeconds: 7200 },
        },
      },
      {
        eventCode: 'DEP',
        translationKey: '航班已起飞',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 26 }, time: { hour: 9, minute: 15 } },
          offset: { totalSeconds: 7200 },
        },
      },
      {
        eventCode: 'ARR',
        translationKey: '航班已到达',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 27 }, time: { hour: 3, minute: 40 } },
          offset: { totalSeconds: 28800 },
        },
      },
      {
        eventCode: 'RCF',
        translationKey: '到达货物已收讫',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 27 }, time: { hour: 6, minute: 20 } },
          offset: { totalSeconds: 28800 },
        },
      },
      {
        eventCode: 'NFD',
        translationKey: '已通知提货',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 27 }, time: { hour: 9, minute: 0 } },
          offset: { totalSeconds: 28800 },
        },
      },
      {
        eventCode: 'CCD',
        translationKey: '海关放行',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 27 }, time: { hour: 11, minute: 30 } },
          offset: { totalSeconds: 28800 },
        },
      },
      {
        eventCode: 'DLV',
        translationKey: '已交付收货人',
        eventActualTime: {
          dateTime: { date: { year: 2026, month: 9, day: 28 }, time: { hour: 15, minute: 0 } },
          offset: { totalSeconds: 28800 },
        },
      },
    ],
  },
}];

// ── 2. 模拟适配器拿到 200 响应后调用解析器 ──
console.log('════════════════════════════════════════════');
console.log('  AFKL 空运单查询模拟  AWB: 074-39882393');
console.log('════════════════════════════════════════════\n');

console.log('[1] 归一化: 07439882393 → 074-39882393');
console.log('[2] 启动浏览器 → 打开 afklcargo.com/mycargo/shipment/singlesearch');
console.log('[3] 等 Angular 初始化 (~12s) → 填入运单号');
console.log('[4] 点击「追踪」→ SPA 发出 GET /mycargo/api/tnt-api/shipments/074-39882393');
console.log('[5] tnt-api 响应: HTTP 200 OK\n');

console.log('── 原始 JSON (摘录) ──');
console.log(JSON.stringify(mockTntResponse[0], null, 2).slice(0, 1200) + '...\n');

console.log('[6] 调用 parseAfklShipment(json, "074-39882393")\n');

const data = parseAfklShipment(mockTntResponse, '074-39882393');

console.log('════════════════════════════════════════════');
console.log('  解析结果');
console.log('════════════════════════════════════════════');
console.log(`  空运单号:  ${data.awbNumber}`);
console.log(`  航司:      ${data.airline}`);
console.log(`  起运站:    ${data.origin} (Amsterdam Schiphol)`);
console.log(`  目的站:    ${data.destination} (Shanghai Pudong)`);
console.log(`  件数:      ${data.pieces} pcs`);
console.log(`  重量:      ${data.weight}`);
console.log(`  当前状态:  ${data.latestStatus}`);
console.log(`  最后更新:  ${data.lastUpdated}`);
console.log('');
console.log('  里程碑事件 (最新→最早):');
console.log('  ────────────────────────────────────────────');
for (const e of data.events) {
  console.log(`  ${e.time}  ${e.event || '??'}  ${e.label}`);
}
console.log('  ────────────────────────────────────────────');
console.log('');
console.log('════════════════════════════════════════════');
console.log('  模拟完成 — 适配器将返回 buildResult {');
console.log('    success: true, hasResult: true,');
console.log('    url: https://www.afklcargo.com/mycargo/shipment/detail/074-39882393');
console.log('  }');
console.log('════════════════════════════════════════════');
