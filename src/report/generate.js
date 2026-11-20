const { chatJSON } = require('../llm/client');
const { defaultLogger } = require('../../utils/logger');
const { formatBeijingTime } = require('../../utils/time');
const { renderFieldSpecPrompt, ROSTER_RESULTS_LIMIT, translateDowJonesTags } = require('../../config/reportFields');
const { renderAirportGlossary, getAirportName } = require('../../config/airports');
const { expandPort, expandFacility, expandShippingLocation, translateContainerType } = require('../../config/ports');

const logger = defaultLogger.child('report:generate');

// Bing 兜底结果在报告中汇总的条数：与 .env 的 BING_FALLBACK_LIMIT 保持一致
const BING_FALLBACK_LIMIT = parseInt(process.env.BING_FALLBACK_LIMIT || '20', 10);

// 承运商 → 官方查询入口地址：查询失败且适配器未带回 url 时，用它作为"尝试地址"标注
const CARRIER_ENTRY = {
  'AF KLM Cargo': 'https://www.afklcargo.com/mycargo',
  'Qatar Airways Cargo': 'https://www.qrcargo.com/s/track-your-shipment',
  'KLM': 'https://www.track-trace.com/aircargo',
  'Turkish Cargo': 'https://turkishcargo.com/en/cargo-tracking',
  'Emirates SkyCargo': 'https://eskycargo.emirates.com',
  'China Cargo Airlines': 'https://www.eal-ceair.com/cargo-tracking.html',
  'Shandong Airlines': 'https://www.sda.cn',
  'Maersk Line': 'https://www.maersk.com/tracking/',
  'MSC': 'https://www.msc.com/track-a-container',
  'COSCO': 'https://elines.coscoshipping.com/',
  'Track-Trace': 'https://www.track-trace.com/container',
  'Dow Jones RiskCenter': 'https://riskcenter.dowjones.com/search/simple',
  'DHL': 'https://www.dhl.com/cn-zh/home/tracking.html',
  'FedEx': 'https://www.fedex.com/fedextrack/',
  'UPS': 'https://www.ups.com/track',
};

// 承运人英文 → 中文（报告展示用）；未收录的承运人保留英文
const CARRIER_ZH = {
  'Maersk Line': '马士基',
  'Mediterranean Shipping': '地中海航运',
  'COSCO SHIPPING Lines': '中远海运',
  'AF KLM Cargo': 'AF KLM 货运',
  'Turkish Cargo': '土耳其航空货运',
  'China Cargo Airlines': '中国货运航空',
  'Qatar Airways Cargo': '卡塔尔航空货运',
  'Emirates SkyCargo': '阿联酋航空货运',
  'Malaysia Airlines (MASkargo)': '马来西亚航空货运',
  'KLM': '荷兰皇家航空',
};

// 汇总层提示词（LLM 边界 2）：查询结果原文直插，禁止编造
const REPORT_SYSTEM = `你是货运尽调报告生成器。基于提供的「邮件原文」与「真实查询结果」生成结构化报告。
只输出 JSON，不要 markdown 代码块，结构如下：
{
  "summary": "2-3 句总览（含最终状态判断）",
  "sections": [
    { "title": "小节标题", "details": "分析说明", "facts": ["直接引用查询结果的事实，逐条"] }
  ],
  "issues": ["信息不全 / 查询失败 / 需人工处理的事项"],
  "recommendations": ["建议动作"]
}
硬性规则：
1. facts 只能引用查询结果中实际存在的内容，禁止编造事件、时间、地点；
2. 查询失败或未查询的实体，必须在 issues 中如实标注，不得推测其状态；
3. 邮件原文与查询结果不一致时，以查询结果为准并在 issues 中说明；
4. 每个查询实体必须标注数据来源地址：成功实体在 facts 中注明来源网址（url 字段）；失败实体在 issues 中注明尝试地址（url 字段）及 Bing 兜底地址（fallbackUrl，若存在）；Bing 兜底命中（fallbackHits 字段，含 title/url/snippet）需在对应小节中逐条汇总，不得遗漏。
5. 若查询结果含 screenshot/screenshotFile 字段，表示该实体以整页截图作为最终结果：在对应 facts 中标注截图文件路径（screenshotFile 字段），并说明这是「承运商官网跳转落地页整页截图」。
6. 各实体类型的展示字段规范如下，facts 须按此字段与顺序整理对应实体的信息（数据在查询结果的 data 字段内，字段名可能因承运商略有差异，按语义匹配；缺失字段跳过，不得编造）：
${renderFieldSpecPrompt()}
7. 语言与缩写扩写规则：报告正文尽量用中文；涉及机场、港口、城市等地点时，若原信息是 IATA 三字码或英文缩写，须同时给出中文全称，格式为「中文全称（三字码）」，例如「迪拜（DXB）」「莫斯科谢列梅捷沃（SVO）」。可参考以下三字码→中文对照（对照缺失的代码用你的常识补全，仍不确定则保留原缩写并标注「待人工确认」，严禁编造中文地名）：
${renderAirportGlossary()}
8. 运输轨迹明细（运输事件时间线）由系统自动以表格渲染，facts 中不要重复列出轨迹明细，只做状态总述与异常判断。数据仍见查询结果的 data.events 字段，供你判断最新状态。
9. 空运单（airWaybills）信息由系统按「基础信息 / 运输轨迹」固定格式确定性渲染，且每个运单独立成模块（该运单的基础信息与运输轨迹内联展示，不同运单互不混排）；集装箱（containers）信息由系统按「基础箱信息 / 航线起讫 / 关键时间节点 / 运输轨迹」四段固定格式确定性渲染；公司（companies）国内企查查命中信息由系统按「1.工商基础信息 / 2.股权结构 / 3.对外投资 / 4.司法风险 / 5.经营异常/处罚」五段固定格式确定性渲染；名单筛查（rosters）命中明细由系统按「姓名/性别/出生日期/国籍/详情/标签」六列表格确定性渲染（缺失字段留空）。你无需为空运单、集装箱、公司或名单生成 section 或 facts；仅在摘要（summary）中简短总述其查询结果，并把查询失败、信息缺失等异常情况写入 issues，不得为空运单、集装箱、公司或名单重复输出 facts。`;

/**
 * 把调度层查询结果压缩成紧凑文本，控制 prompt 体积（防超长）。
 */
function buildReportInput(entities, schedulerResult) {
  const compact = { entities, queries: {} };
  for (const key of ['airWaybills', 'containers', 'billOfLadings']) {
    compact.queries[key] = (schedulerResult[key] || []).map((q) => {
      return {
        raw: q.raw,
        success: q.success,
        carrier: q.carrier,
        error: q.error || null,
        hasResult: q.hasResult ?? false,
        url: q.url || CARRIER_ENTRY[q.carrier] || null, // 成功=来源地址；失败=尝试地址
        fallbackUrl: (q.fallback && q.fallback.url) || null, // Bing 兜底地址
        fallbackHits: (q.fallback && q.fallback.items || []).slice(0, BING_FALLBACK_LIMIT).map((i) => ({
          title: i.title, url: i.url, snippet: i.snippet,
        })),
        screenshot: q.screenshot || null, // 整页截图文件路径（跳转落地页以图片作为最终结果）
        screenshotFile: q.screenshotFile || null,
        data: q.data || {}, // 完整字段（按实体类型而异），交 LLM 按「展示字段规范」整理
        note: q.note || null,
      };
    });
  }
  compact.queries.companies = schedulerResult.companies || [];
  // 名单筛查结果（Dow Jones 批量命中）必须进报告输入，否则汇总层会把"有命中"误报为"查询为空"
  compact.queries.persons = schedulerResult.persons || [];
  compact.queries.rosters = (schedulerResult.rosters || []).map((r) => ({
    title: r.title,
    type: r.type,
    items: (r.items || []).map((it) => ({
      raw: it.raw,
      success: it.success,
      status: it.status,
      flags: it.flags || null,
      total: it.total || null,
      error: it.error || null,
      url: it.url || CARRIER_ENTRY['Dow Jones RiskCenter'] || null, // 尝试地址（Dow Jones 入口）
      fallbackUrl: (it.fallback && it.fallback.url) || null, // Bing 兜底地址
      fallbackHits: (it.fallback && it.fallback.items || []).slice(0, BING_FALLBACK_LIMIT).map((i) => ({
        title: i.title, url: i.url, snippet: i.snippet,
      })),
      results: (it.results || [])
        .slice(0, ROSTER_RESULTS_LIMIT)
        .map((res) => ({
          id: res.id,
          name: res.name,
          gender: res.gender,
          dob: res.dob,
          country: res.country,
          detail: res.detail,
          tags: translateDowJonesTags(res.tags),
        })),
    })),
  }));
  compact.skipped = schedulerResult.skipped || [];
  compact.failed = schedulerResult.failed || [];
  return JSON.stringify(compact);
}

/**
 * 生成尽调报告（LLM 边界 2）。
 * @param {object} opts { mailText, entities, schedulerResult }
 * @returns {Promise<object>} { report: 结构化对象, markdown: string }
 */
async function generateReport({ mailText, entities, schedulerResult }) {
  const facts = buildReportInput(entities, schedulerResult);
  const user = [
    '【邮件原文】',
    String(mailText || '').slice(0, 4000),
    '',
    '【真实查询结果(JSON，facts 只能引用此内容)】',
    facts.slice(0, 24000),
  ].join('\n');

  const report = await chatJSON(REPORT_SYSTEM, user);
  logger.info('报告生成完成', { sections: report.sections?.length, issues: report.issues?.length });
  return { report, markdown: renderMarkdown(report, schedulerResult) };
}

// ---- 运输轨迹确定性渲染（表格）----
// 轨迹是结构化数据（各 parser 已产出 events 数组），由 renderMarkdown 直接渲染成对齐表格，
// 不做 LLM 自由发挥，保证格式一致、不丢字段。以下是归一化辅助函数。

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// IATA 状态码 → 统一中文术语（空运单/集装箱通用）
const STATUS_ZH = {
  RCS: '已收货', RCF: '已到达转运点', RCA: '已接收', BKD: '已订舱', MAN: '已确认',
  DEP: '已发运', ARR: '已到达', NFD: '已通知收货人', DLV: '已交付',
  EXR: '海关已放行', FCA: '已关闭', AWD: '已签发运单', DIS: '存在差异',
};

// 事件文本关键词 → 统一中文术语（触发顺序从上往下，先匹配先得）
const EVENT_KEYWORD_ZH = [
  ['Delivered', '已交付'],
  ['Customs Released', '海关已放行'],
  ['Customs held', '海关扣留'],
  ['Handed over to Consignee', '已交收货人'],
  ['Arrived', '已到达'],
  ['Departed', '已发运'],
  ['In Transit', '运输中'],
  ['Booked', '已订舱'],
  ['Accepted', '已受理'],
  ['Manifested', '已确认'],
  ['Received', '已收货'],
  ['Notified', '已通知收货人'],
  ['Vessel departure', '已离港'],
  ['Vessel arrival', '已到港'],
  ['Feeder departure', '支线已离港'],
  ['Feeder arrival', '支线已到港'],
  ['Gate out', '已提箱出场'],
  ['Gate in', '已返空箱'],
  ['Load on', '已装船'],
  ['Discharged', '已卸船'],
  ['Loaded', '已装船'],
  ['Empty', '空箱'],
];

function _statusText(ev) {
  const code = (ev.statusCode || '').toUpperCase();
  if (STATUS_ZH[code]) return STATUS_ZH[code];
  const raw = String(ev.description || ev.event || ev.operation || '').trim();
  if (raw) {
    const hit = EVENT_KEYWORD_ZH.find(([en]) => raw.toLowerCase().includes(en.toLowerCase()));
    if (hit) return hit[1];
    return raw;
  }
  return '';
}

function _fmtTime(ev) {
  const d = _parseTime(ev.time);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  const datePart = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  // 源时间仅日期无时分（如 MSC 的 DD/MM/YYYY）时，只返回日期，不补 00:00
  const hasClock = /:\d{2}/.test(String(ev.time || ''));
  if (!hasClock) return datePart;
  return `${datePart} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function _parseTime(t) {
  if (!t) return null;
  const s = String(t).trim();
  // ISO：2026-07-20 21:45
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // 英文：21 Jul 2026 03:36 / 21-Jul-2026 03:36 / Tue, 21 Jul 2026 03:36
  m = s.match(/(\d{1,2})[- ]([A-Za-z]{3})[- ,]*(\d{4})[ T]?(\d{1,2}):(\d{2})/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase()];
    if (mo) return new Date(+m[3], mo - 1, +m[1], +m[4], +m[5]);
  }
  // 欧式：22.03.2026 07:39 / 22.3.2026 7:39
  m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})[ T]?(\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
  // 仅日期（无时分）：DD/MM/YYYY（MSC 官网事件时间）
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

// 日期串 → YYYY-MM-DD（如 "22 Sep 2026" / "12 Nov 2026 (ETA)" / "22.09.2026"）；解析失败原样返回
function _parseDate(t) {
  if (!t) return null;
  const s = String(t).trim();
  let m = s.match(/(\d{1,2})[- ]([A-Za-z]{3})[- ]+(\d{4})/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase()];
    if (mo) return new Date(+m[3], mo - 1, +m[1]);
  }
  m = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return null;
}

function _fmtDateOnly(t) {
  const d = _parseDate(t);
  if (!d) return String(t || '').trim();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 相对时间翻译："6 days ago" → "6 天前"；非相对时间原样返回
function _translateRelative(t) {
  const s = String(t || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago$/i);
  if (m) {
    const units = { minute: '分钟', hour: '小时', day: '天', week: '周', month: '个月', year: '年' };
    const key = m[2].toLowerCase();
    return `${m[1]} ${units[key] || m[2]}前`;
  }
  return s;
}

// 三字码 → 中文全称（三字码）；非三字码（如完整城市名）原样返回
function _expandLocation(loc) {
  if (!loc) return '';
  const s = String(loc).trim();
  if (/^[A-Z]{3}$/.test(s)) {
    const name = getAirportName(s);
    return name ? `${name}（${s}）` : s;
  }
  return s;
}

// 单个实体轨迹 → markdown 表格（表头+行）；无事件返回空数组
function _renderEventTable(events) {
  const evs = (events || []).filter((e) => e && (e.time || e.event || e.description || e.statusCode));
  if (!evs.length) return [];
  // 按时间正序排序（无法解析的时间排最后，保持原相对顺序）
  evs.forEach((e) => { e.__t = _parseTime(e.time); });
  evs.sort((a, b) => {
    if (a.__t && b.__t) return a.__t - b.__t;
    if (a.__t) return -1;
    if (b.__t) return 1;
    return 0;
  });

  const lines = ['| 时间 | 状态 | 地点 | 航班名 |', '| --- | --- | --- | --- |'];
  for (const e of evs) {
    const loc = _expandLocation(e.location) || _expandLocation(e.facility) || '';
    const ride = e.flightNo || e.vessel || '';
    lines.push(`| ${_fmtTime(e)} | ${_statusText(e)} | ${loc} | ${ride} |`);
  }
  return lines;
}

// 集装箱轨迹 → markdown 表格（5 列：时间/港口/码头·设施/事件类型/船名·航次）
function _renderContainerEventTable(events) {
  const evs = (events || []).filter((e) => e && (e.time || e.event || e.location || e.facility || e.vessel));
  if (!evs.length) return [];
  evs.forEach((e) => { e.__t = _parseTime(e.time); });
  evs.sort((a, b) => {
    if (a.__t && b.__t) return a.__t - b.__t;
    if (a.__t) return -1;
    if (b.__t) return 1;
    return 0;
  });
  const lines = ['| 时间 | 港口 | 码头/设施 | 事件类型 | 船名/航次 |', '| --- | --- | --- | --- | --- |'];
  for (const e of evs) {
    const port = expandShippingLocation(e.location) || expandPort(e.location) || e.location || '';
    const fac = e.facility ? expandShippingLocation(e.facility) : '';
    const status = _statusText(e);
    const vessel = e.vessel || '';
    lines.push(`| ${_fmtTime(e)} | ${port} | ${fac} | ${status} | ${vessel} |`);
  }
  return lines;
}

// 从事件端口序列推导中转港（去掉首尾起运港/目的港，中间即中转港）
function _transitPorts(events, origin, destination) {
  const ports = [];
  for (const e of events || []) {
    const loc = (e.location || '').trim();
    if (loc && !ports.includes(loc)) ports.push(loc);
  }
  const skip = new Set([origin, destination].map((s) => (s || '').split(',')[0].trim().toUpperCase()));
  const transit = ports.filter((p) => !skip.has(p.split(',')[0].trim().toUpperCase()));
  return transit;
}

// 整体状态英文 → 中文（复用事件关键词映射）；中文/复合状态原样返回
function _zhStatus(status) {
  const s = String(status || '').trim();
  if (!s) return '';
  const hit = EVENT_KEYWORD_ZH.find(([en]) => s.toLowerCase().includes(en.toLowerCase()));
  return hit ? hit[1] : s;
}

// 空运单中转机场：从轨迹事件里的地点序列去掉起讫后即中转
function _transitAirports(events, origin, destination) {
  const ports = [];
  for (const e of events || []) {
    const loc = String(e.location || '').trim().toUpperCase();
    if (loc && !ports.includes(loc)) ports.push(loc);
  }
  const skip = new Set([String(origin || '').trim().toUpperCase(), String(destination || '').trim().toUpperCase()]);
  return ports.filter((p) => !skip.has(p));
}

// 空运单 → 固定格式（基础信息 / 航线 / 货物 / 当前状态 / 运输轨迹），每个运单独立模块，确定性渲染
// 若结果携带 sections（邮件指定查询段），则只渲染命中的段，其余跳过。
// sections 枚举：basic / route / cargo / status / events / latest（latest 仅渲染轨迹首条）
function _renderAwbBlock(q) {
  const d = q.data || {};
  const num = d.awbNumber || q.query || q.raw || '';
  const carrier = q.carrier || '';
  const carrierZh = CARRIER_ZH[carrier] || carrier;
  const lines = [`## 空运单 ${num}${carrierZh ? `（${carrierZh}）` : ''}`, ''];

  // sections 来源：scheduler 结果 q.sections
  const sections = Array.isArray(q.sections) ? q.sections : [];
  const show = (key) => sections.length === 0 || sections.includes(key);
  // 同时指定「轨迹」和「最新动态」时，以完整轨迹为准（latest 只是 events 的子集）
  const latestOnly = sections.includes('latest') && !sections.includes('events');

  if (q.error && !q.success) {
    lines.push(`- 查询结果：失败，错误信息「${q.error}」`);
    if (q.url) lines.push(`- 尝试地址：${q.url}`);
    if (q.fallback && q.fallback.url) lines.push(`- Bing 兜底地址：${q.fallback.url}`);
    lines.push('', '> 该运单网站上未有轨迹信息。', '');
    return lines;
  }

  const origin = d.origin || d.originName || '';
  const destination = d.destination || d.destinationName || '';
  const pieces = d.pieces ?? d.totalPieces;
  const weight = d.weight ?? d.totalWeight;
  const volume = d.volume;
  const status = d.currentStatus ?? d.shipmentStatus ?? d.latestStatus ?? d.status ?? '';

  const showBasic = show('basic');
  const showRoute = show('route');
  const showCargo = show('cargo');
  const showStatus = show('status');
  const showEvents = show('events') || latestOnly;

  // 基础信息（运单号 / 承运人）
  if (showBasic) {
    lines.push('**基础信息**', '');
    lines.push(`- 运单号：${num}`);
    if (carrierZh) lines.push(`- 承运人/航空公司：${carrierZh}${carrier !== carrierZh ? `（${carrier}）` : ''}`);
    if (q.url) lines.push(`- 数据来源：${q.url}`);
  }

  // 航线（始发 → 目的，含中转）
  if (showRoute && (origin || destination)) {
    lines.push('', '**航线**', '');
    let route = `${_expandLocation(origin) || origin} → ${_expandLocation(destination) || destination}`;
    const transit = _transitAirports(d.events, origin, destination);
    if (transit.length) route += `，经 ${transit.map((p) => _expandLocation(p) || p).join('、')} 中转`;
    lines.push(`- 航线：${route}`);
  }

  // 货物信息（件数 / 重量 / 体积）
  if (showCargo) {
    const dims = [];
    if (pieces != null && pieces !== '') dims.push(`件数：${pieces}`);
    if (weight != null && weight !== '') dims.push(`重量：${weight}`);
    if (volume != null && volume !== '') dims.push(`体积：${volume}`);
    if (dims.length || showCargo) {
      lines.push('', '**货物信息**', '');
      if (dims.length) lines.push(`- ${dims.join('；')}`);
      else lines.push('> 无件数/重量/体积信息。');
    }
  }

  // 当前状态
  if (showStatus) {
    lines.push('', '**当前状态**', '');
    if (status) lines.push(`- 当前状态：${_zhStatus(status)}`);
    else lines.push('> 无当前状态信息。');
  }

  // 运输轨迹
  if (showEvents) {
    lines.push('', latestOnly ? '**最新动态**' : '**运输轨迹**', '');
    let evts = d.events;
    if (latestOnly && Array.isArray(evts)) evts = evts.slice(0, 1);
    const evLines = _renderEventTable(evts);
    if (evLines.length) lines.push(...evLines);
    else lines.push('> 该运单网站上未有轨迹信息。');
  }

  lines.push('');
  return lines;
}

// 集装箱 → 固定四段（基础箱信息 / 航线起讫 / 关键时间节点 / 运输轨迹），确定性渲染
// 若结果携带 sections（邮件指定查询段），则只渲染命中的段，其余跳过。
// sections 枚举：basic / route / timeline / events / latest（latest 仅渲染轨迹首条）
function _renderContainerBlock(q) {
  const d = q.data || {};
  const num = d.containerNumber || q.raw || q.query || '';
  const carrier = q.carrier || '承运人';
  const lines = [`## 集装箱 ${num}（${carrier}）`, ''];

  // sections 来源：scheduler 结果 q.sections
  const sections = Array.isArray(q.sections) ? q.sections : [];
  const show = (key) => sections.length === 0 || sections.includes(key);
  // 同时指定「轨迹」和「最新动态」时，以完整轨迹为准（latest 只是 events 的子集）
  const latestOnly = sections.includes('latest') && !sections.includes('events');

  if (q.error && !q.success) {
    lines.push(`- 查询结果：失败，错误信息「${q.error}」`);
    const tryUrl = q.url || CARRIER_ENTRY[q.carrier];
    if (tryUrl) lines.push(`- 尝试地址：${tryUrl}`);
    lines.push('', '> 该箱网站上未查到轨迹信息。', '');
    return lines;
  }

  // 1. 基础箱信息
  const showBasic = show('basic');
  const showRoute = show('route');
  const showTimeline = show('timeline');
  const showEvents = show('events') || latestOnly;

  if (showBasic) {
    lines.push('**基础箱信息**', '');
    lines.push(`- 箱号：${num}`);
    if (d.containerType) lines.push(`- 箱型：${translateContainerType(d.containerType)}`);
    const srcUrl = q.url || CARRIER_ENTRY[q.carrier];
    if (srcUrl) lines.push(`- 数据来源：${srcUrl}`);
  }

  // 截图结果（无结构化字段）：以落地页整页截图作为最终结果，明确标注而非"未查到轨迹信息"
  const hasEvents = Array.isArray(d.events) && d.events.length;
  const screenshotOnly = (q.screenshot || q.screenshotFile) && !hasEvents && !d.containerType && !d.origin;
  if (screenshotOnly) {
    const file = q.screenshotFile || (q.screenshot || '').split(/[\\/]/).pop();
    lines.push('', `> 该箱查询结果以承运商官网落地页整页截图返回（截图文件：\`${file}\`），无结构化箱型/航线/轨迹数据，请人工查看截图确认。`, '');
    return lines;
  }

  // 2. 航线起讫
  if (showRoute) {
    lines.push('', '**航线起讫**', '');
    if (d.origin) lines.push(`- 始发港：${expandShippingLocation(d.origin) || expandPort(d.origin)}`);
    if (d.destination) lines.push(`- 目的港：${expandShippingLocation(d.destination) || expandPort(d.destination)}`);
    const transit = _transitPorts(d.events, d.origin, d.destination);
    if (transit.length) lines.push(`- 中转港：${transit.map((p) => expandShippingLocation(p) || expandPort(p)).join('、')}`);
  }

  // 3. 关键时间节点
  if (showTimeline) {
    lines.push('', '**关键时间节点**', '');
    if (d.departure) lines.push(`- 离港：${_fmtDateOnly(d.departure)}`);
    if (d.eta) lines.push(`- 预计到港：${_fmtDateOnly(d.eta)}`);
    if (d.lastUpdated) lines.push(`- 最近更新时间：${_translateRelative(d.lastUpdated)}`);
  }

  // 4. 运输轨迹
  if (showEvents) {
    lines.push('', latestOnly ? '**最新动态**' : '**运输轨迹**', '');
    let evts = d.events;
    if (latestOnly && Array.isArray(evts)) evts = evts.slice(0, 1);
    const evLines = _renderContainerEventTable(evts);
    if (evLines.length) lines.push(...evLines);
    else lines.push('> 该箱网站上未查到轨迹信息。');
  }

  lines.push('');
  return lines;
}

// 公司（企查查 国内工商命中）→ 固定五段确定性渲染：
// 1.工商基础信息 / 2.股权结构 / 3.对外投资 / 4.司法风险 / 5.经营异常/处罚
// 若结果携带 sections（邮件指定查询段），则只渲染命中的段，其余跳过。
function _renderCompanyBlock(q) {
  const d = q.data || {};
  const name = d.companyName || q.query || q.raw || '';
  const lines = [`## 公司 ${name}`, ''];

  // sections 来源：scheduler 结果 q.sections 或适配器返回的 data.sections
  const sections = Array.isArray(q.sections)
    ? q.sections
    : Array.isArray(d.sections)
      ? d.sections
      : [];
  const show = (key) => sections.length === 0 || sections.includes(key);

  const qcc = d.qcc || {};
  // 国内企查查命中：qcc 为解析后的深挖结构（basic/shareholders/investments/judicialRisk/abnormal）
  const dive = qcc.basic && typeof qcc.basic === 'object' ? qcc : null;

  if (!dive) {
    // 非企查查深挖命中（未配置 / 渠道故障 / 境外主体等）：保留渠道说明与线索，不编造五段数据
    if (qcc.error) lines.push(`- 企查查查询失败：${qcc.error}`);
    if (d.note) lines.push(`- 备注：${d.note}`);
    if (d.overseas && d.overseas.official && d.overseas.official.searchUrl) lines.push(`- 官方查册入口（${d.overseas.registryName}）：${d.overseas.official.searchUrl}`);
    if (d.bing && d.bing.officialDomain) lines.push(`- 疑似官网：${d.bing.officialDomain}`);
    lines.push('');
    return lines;
  }

  const basic = dive.basic || {};
  const shareholders = dive.shareholders || [];
  const investments = dive.investments || [];
  const judicialRisk = dive.judicialRisk || {};
  const abnormal = dive.abnormal || {};

  // 1. 工商基础信息
  if (show('basic')) {
    lines.push('**1. 工商基础信息**', '');
    lines.push(`- 公司名称：${basic.companyName || name}`);
    if (basic.creditCode) lines.push(`- 统一社会信用代码：${basic.creditCode}`);
    if (basic.legalRep) lines.push(`- 法定代表人：${basic.legalRep}`);
    if (basic.registeredCapital) lines.push(`- 注册资本：${basic.registeredCapital}`);
    if (basic.foundedAt) lines.push(`- 成立日期：${basic.foundedAt}`);
    if (basic.address) lines.push(`- 注册地址：${basic.address}`);
    if (basic.businessScope) lines.push(`- 经营范围：${basic.businessScope}`);
    if (basic.status) lines.push(`- 登记状态：${basic.status}`);
    lines.push(`- 数据来源：企查查（qcc-agent-cli 国内工商查询）`);
  }

  // 2. 股权结构
  if (show('shareholders')) {
    lines.push('', '**2. 股权结构**', '');
    if (shareholders.length) {
      for (const s of shareholders) {
        if (!s || !s.name) continue;
        const parts = [s.name];
        if (s.ratio) parts.push(`持股 ${s.ratio}`);
        if (s.amount) parts.push(`认缴 ${s.amount}`);
        lines.push(`- ${parts.join('，')}`);
      }
    } else {
      lines.push('> 无股权结构信息。');
    }
  }

  // 3. 对外投资
  if (show('investments')) {
    lines.push('', '**3. 对外投资**', '');
    if (investments.length) {
      for (const i of investments) {
        if (!i || !i.companyName) continue;
        lines.push(`- ${i.companyName}${i.ratio ? `（${i.ratio}）` : ''}`);
      }
    } else {
      lines.push('> 无对外投资信息。');
    }
  }

  // 4. 司法风险
  if (show('judicial')) {
    lines.push('', '**4. 司法风险**', '');
    if (!judicialRisk.present) {
      lines.push('> 无司法风险记录。');
    } else {
      if (judicialRisk.count) lines.push(`- 司法风险记录 ${judicialRisk.count} 条`);
      for (const it of judicialRisk.items || []) lines.push(`- ${it}`);
    }
  }

  // 5. 经营异常/处罚
  if (show('abnormal')) {
    lines.push('', '**5. 经营异常/处罚**', '');
    if (!abnormal.present) {
      lines.push('> 无经营异常或行政处罚记录。');
    } else {
      if (abnormal.count) lines.push(`- 经营异常/处罚记录 ${abnormal.count} 条`);
      for (const it of abnormal.items || []) lines.push(`- ${it}`);
    }
  }

  lines.push('');
  return lines;
}

// 名单筛查（Dow Jones）命中明细 → 确定性渲染：
// 每项六列「姓名/性别/出生日期/国籍/详情/标签」，缺失字段留空。
function _renderRosterBlock(roster) {
  const title = roster.title || '名单';
  const lines = [`## ${title}`, ''];

  for (const it of roster.items || []) {
    const name = it.raw || it.query || '';
    lines.push(`### ${name}`, '');

    // 渠道故障 / 未登录：如实标注，不假装无命中
    if (!it.success || (it.status && it.status !== 'ok')) {
      lines.push(`- 查询结果：渠道故障（${it.status || '未知'}），错误信息「${it.error || '查询失败'}」`);
      lines.push(`- 尝试地址：${it.url || CARRIER_ENTRY['Dow Jones RiskCenter']}`);
      if (it.fallback && it.fallback.url) lines.push(`- Bing 兜底地址：${it.fallback.url}`);
      lines.push('');
      continue;
    }

    const total = it.total || 0;
    lines.push(`- 命中总数：${total}`);
    lines.push(`- 数据来源：Dow Jones RiskCenter（${CARRIER_ENTRY['Dow Jones RiskCenter']}）`);

    const flags = it.flags || {};
    const marks = [];
    if (flags.sanctions) marks.push('制裁');
    if (flags.pep) marks.push('政治公众人物');
    if (flags.adverseMedia) marks.push('负面媒体');
    if (marks.length) lines.push(`- 命中类型：${marks.join('、')}`);

    const results = (it.results || []).slice(0, ROSTER_RESULTS_LIMIT);
    if (!results.length) {
      lines.push('', '> 无命中明细。', '');
    } else {
      lines.push('', '**命中明细**', '');
      lines.push('| 姓名 | 性别 | 出生日期 | 国籍 | 详情 | 标签 |');
      lines.push('| --- | --- | --- | --- | --- | --- |');
      for (const r of results) {
        const cell = (v) => String(v ?? '').replace(/\|/g, '\\|');
        const tags = translateDowJonesTags(r.tags) || '';
        lines.push(`| ${cell(r.name)} | ${cell(r.gender)} | ${cell(r.dob)} | ${cell(r.country)} | ${cell(r.detail)} | ${cell(tags)} |`);
      }
    }
    lines.push('');
  }
  return lines;
}

// ---- HTML 卡片视图复用：与 Markdown 表格同一套确定性字段规则 ----

// 事件数组 → 按时间正序的时间线行（time/status 中文/location 中文/facility/ride）
function _normalizeTimeline(events, kind) {
  const evs = (events || []).filter((e) => e && (e.time || e.event || e.description || e.statusCode || e.location || e.facility || e.vessel));
  evs.forEach((e) => { e.__t = _parseTime(e.time); });
  evs.sort((a, b) => {
    if (a.__t && b.__t) return a.__t - b.__t;
    if (a.__t) return -1;
    if (b.__t) return 1;
    return 0;
  });
  return evs.map((e) => {
    let location = '';
    let facility = '';
    if (kind === 'container') {
      location = expandShippingLocation(e.location) || expandPort(e.location) || e.location || '';
      facility = e.facility ? (expandShippingLocation(e.facility) || e.facility) : '';
    } else {
      // 空运单/提单：三字码机场优先，其次海运港口词典，最后原文
      location = _expandLocation(e.location) || _expandLocation(e.facility)
        || expandShippingLocation(e.location) || expandPort(e.location) || e.location || '';
    }
    return {
      time: _fmtTime(e),
      status: _statusText(e),
      location,
      facility,
      ride: e.flightNo || e.vessel || '',
    };
  });
}

// 起运/目的/中转 → 已扩写中文的航线视图
function _routeView(events, origin, destination, kind) {
  const expPort = (s) => expandShippingLocation(s) || expandPort(s) || s;
  const exp = kind === 'container' ? expPort : (s) => _expandLocation(s) || expPort(s);
  const transit = kind === 'container'
    ? _transitPorts(events, origin, destination)
    : _transitAirports(events, origin, destination);
  return {
    origin: origin ? exp(origin) : '',
    destination: destination ? exp(destination) : '',
    transit: transit.map((p) => exp(p) || p).filter(Boolean),
  };
}

// 过滤掉纯结构化实体小节（空运单/集装箱/公司/名单，已由固定区块渲染），
// 其余小节（提单分析、个人线索、其他说明等）作为「其他分析」叙事内容保留。
function _narrativeSections(report, schedulerResult) {
  const entityIndex = _buildEntityIndex(schedulerResult);
  const companyNames = (schedulerResult.companies || [])
    .map((q) => q.data?.companyName || q.query || q.raw)
    .filter(Boolean);
  const rosterItemNames = (schedulerResult.rosters || [])
    .flatMap((r) => (r.items || []).map((it) => it.raw))
    .filter(Boolean);
  return (report.sections || []).filter((section) => {
    const header = `${section.title} ${section.details || ''}`;
    const matched = _entitiesForSection(header, entityIndex);
    const structuralOnly = matched.length > 0 && matched.every((e) => e.kind === 'containers' || e.kind === 'companies' || e.kind === 'airWaybills');
    const companyOnly = matched.length === 0 && companyNames.some((n) => header.includes(n));
    const rosterOnly = matched.length === 0 && (
      rosterItemNames.some((n) => header.includes(n)) ||
      /名单|筛查|道琼斯|dow\s*jones|riskcenter/i.test(section.title || '')
    );
    return !(structuralOnly || companyOnly || rosterOnly);
  });
}

// 归一化实体编号：仅保留字母数字，用于把 LLM 生成的小节标题与查询结果关联
function _normKey(s) {
  return String(s || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

// 建立「实体查询结果」索引（空运单/集装箱/提单/公司，用于把 LLM 生成的小节标题与查询结果关联）
function _buildEntityIndex(schedulerResult) {
  const index = [];
  const groups = [
    ['airWaybills', (q) => q.data?.awbNumber || q.query || q.raw],
    ['containers', (q) => q.data?.containerNumber || q.query || q.raw],
    ['billOfLadings', (q) => q.data?.blNumber || q.query || q.raw],
    ['companies', (q) => q.data?.companyName || q.query || q.raw],
  ];
  for (const [kind, getNum] of groups) {
    for (const q of (schedulerResult?.[kind] || [])) {
      const keys = [...new Set([getNum(q), q.raw, q.query].map(_normKey))].filter((k) => k.length >= 5);
      if (keys.length) index.push({ kind, q, keys });
    }
  }
  return index;
}

// 匹配小节标题/说明中出现的实体（按编号子串匹配）
function _entitiesForSection(headerText, index) {
  const norm = _normKey(headerText);
  return index.filter((e) => e.keys.some((k) => norm.includes(k)));
}

/**
 * 结构化报告 → Markdown（确定性渲染，模型只产出数据）。
 * @param {object} report LLM 生成的结构化报告
 * @param {object} schedulerResult 调度层原始查询结果（用于确定性渲染轨迹表格）
 */
function renderMarkdown(report, schedulerResult) {
  const now = formatBeijingTime();
  const lines = [
    '# 尽调报告',
    '',
    `生成时间：${now}`,
    '',
    '## 摘要',
    '',
    report.summary || '（无摘要）',
    '',
  ];

  const entityIndex = _buildEntityIndex(schedulerResult);
  const usedEntities = new Set();

  // 纯结构化实体小节（空运单/集装箱/公司/名单）已由固定区块确定性渲染，这里只保留叙事小节
  for (const section of _narrativeSections(report, schedulerResult)) {
    const header = `${section.title} ${section.details || ''}`;
    const matched = _entitiesForSection(header, entityIndex);

    lines.push(`## ${section.title}`, '');
    if (section.details) lines.push(section.details, '');
    for (const fact of section.facts || []) lines.push(`- ${fact}`);

    // 轨迹内联：仅提单等未走固定区块渲染的实体（空运单/集装箱/公司已统一确定性渲染）
    for (const { kind, q } of matched) {
      if (kind === 'containers' || kind === 'companies' || kind === 'airWaybills' || usedEntities.has(q)) continue;
      usedEntities.add(q);
      const evLines = _renderEventTable(q.data?.events);
      lines.push('');
      if (evLines.length) {
        lines.push('**运输轨迹**', '');
        lines.push(...evLines);
      } else {
        lines.push('> 该运单网站上未有轨迹信息。');
      }
    }
    lines.push('');
  }

  // 空运单：每个运单独立模块（基础信息 + 运输轨迹）确定性渲染
  for (const q of schedulerResult.airWaybills || []) {
    lines.push(..._renderAwbBlock(q));
  }

  // 集装箱：固定四段（基础箱信息 / 航线起讫 / 关键时间节点 / 运输轨迹）确定性渲染
  for (const q of schedulerResult.containers || []) {
    lines.push(..._renderContainerBlock(q));
  }

  // 公司：固定五段（工商基础信息 / 股权结构 / 对外投资 / 司法风险 / 经营异常·处罚）确定性渲染
  for (const q of schedulerResult.companies || []) {
    lines.push(..._renderCompanyBlock(q));
  }

  // 名单筛查：命中明细六列（姓名/性别/出生日期/国籍/详情/标签）确定性渲染
  for (const roster of schedulerResult.rosters || []) {
    lines.push(..._renderRosterBlock(roster));
  }

  lines.push('## 异常与待人工处理', '');
  if ((report.issues || []).length) {
    for (const issue of report.issues) lines.push(`- ${issue}`);
  } else {
    lines.push('- 无');
  }
  lines.push('', '## 建议', '');
  for (const rec of report.recommendations || []) lines.push(`- ${rec}`);

  return lines.join('\n');
}

module.exports = {
  generateReport,
  renderMarkdown,
  buildReportInput,
  // HTML 卡片视图复用的确定性辅助函数（与 Markdown 表格同一套字段规则）
  narrativeSections: _narrativeSections,
  normalizeTimeline: _normalizeTimeline,
  routeView: _routeView,
  statusZh: _zhStatus,
  dateDisplay: _fmtDateOnly,
  relativeZh: _translateRelative,
  CARRIER_ENTRY,
};
