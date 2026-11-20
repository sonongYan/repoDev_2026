// ============================================================================
// HTML 报告渲染（确定性，代码硬编码；LLM 不参与 HTML/卡片/图表生成）。
//
// renderHtml(report, schedulerResult, markdown) 输出一份自包含的仪表盘式 HTML：
// 报告头（总体结论）→ KPI 仪表盘 → 关键发现 → 空运单 / 集装箱 / 提单 / 公司 /
// 个人卡片（含运输时间线）→ 名单筛查面板（迷你饼图 + 命中明细表）→ 其他分析 →
// 异常与待办 → 建议。
//
// 卡片/时间线/表格全部由调度层真实查询结果（schedulerResult）确定性聚合；
// LLM 边界 2 仅提供 summary / issues / recommendations / 叙事小节，缺省字段留空、绝不编造。
// ============================================================================

const { marked } = require('marked');
const { translateContainerType } = require('../../config/ports');
const { translateDowJonesTags, ROSTER_RESULTS_LIMIT } = require('../../config/reportFields');
const { formatBeijingTime } = require('../../utils/time');
const {
  normalizeTimeline,
  routeView,
  statusZh,
  dateDisplay,
  relativeZh,
  narrativeSections,
  CARRIER_ENTRY,
} = require('./generate');

// ECharts 5（CDN 引入；邮件附件在浏览器打开时联网加载）
const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js';

// 承运人英文 → 中文（卡片展示用），未收录保留英文
const CARRIER_ZH = {
  'Maersk Line': '马士基',
  'Mediterranean Shipping': '地中海航运（MSC）',
  'MSC': '地中海航运（MSC）',
  'COSCO SHIPPING Lines': '中远海运',
  'COSCO': '中远海运',
  'AF KLM Cargo': 'AF KLM 货运',
  'Turkish Cargo': '土耳其航空货运',
  'China Cargo Airlines': '中国货运航空',
  'Qatar Airways Cargo': '卡塔尔航空货运',
  'Emirates SkyCargo': '阿联酋航空货运',
  'KLM': '荷兰皇家航空',
  'KLM Royal Dutch Airlines': '荷兰皇家航空',
  'DHL': 'DHL',
  'FedEx': 'FedEx',
  'UPS': 'UPS',
  'Track-Trace': 'Track-Trace 通用',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// 运输终态（KPI 判定用；含到港/卸船等待提类状态）
const TERMINAL_STATUS = ['已交付', '已卸船', '已返空箱', '已提箱出场', '已到港', '支线已到港'];
// 时间线绿色完成态（到港/卸船在时间线上仍为「当前节点」蓝色，不算闭合）
const DONE_LAST_STATUS = ['已交付', '已返空箱', '已提箱出场'];
const ABNORMAL_STATUS_RE = /海关扣留|存在差异|异常/;

// ---- 基础工具 ----
function _num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function _short(s, n = 16) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function _esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _carrierZh(c) {
  return CARRIER_ZH[c] || c || '';
}

// ---- 通用展示片段 ----
function _srcRow(label, url) {
  if (!url) return '';
  return `<div class="src"><span>${_esc(label)}：</span><a href="${_esc(url)}" target="_blank" rel="noopener">${_esc(url)}</a></div>`;
}

function _tryUrl(q) {
  return (q && (q.url || CARRIER_ENTRY[q.carrier])) || '';
}

// Bing 兜底命中（标题/链接/摘要逐条汇总，不得遗漏）
function _fallbackHtml(fb) {
  if (!fb) return '';
  const items = fb.items || [];
  if (!fb.url && !items.length) return '';
  let html = '<div class="fallback"><div class="fb-title">Bing 兜底结果</div>';
  if (fb.url) html += _srcRow('兜底地址', fb.url);
  if (items.length) {
    html += '<ul class="fb-list">';
    for (const it of items) {
      const href = it.url || '#';
      html += `<li><a href="${_esc(href)}" target="_blank" rel="noopener">${_esc(it.title || it.url || '(无标题)')}</a>`;
      if (it.snippet) html += `<div class="fb-snip">${_esc(it.snippet)}</div>`;
      html += '</li>';
    }
    html += '</ul>';
  }
  html += '</div>';
  return html;
}

// 查询失败卡片正文：错误 + 尝试地址 + Bing 兜底
function _failureBody(q, emptyText) {
  const parts = [];
  if (q.error) parts.push(`<div class="meta">错误信息：${_esc(q.error)}</div>`);
  const tryUrl = _tryUrl(q);
  if (tryUrl) parts.push(_srcRow('尝试地址', tryUrl));
  const fb = _fallbackHtml(q.fallback);
  if (fb) parts.push(fb);
  parts.push(`<div class="missing">⚠ ${_esc(emptyText)}</div>`);
  return parts.join('');
}

function _cardShell(badge, title, carrierText, bodyHtml, extraHtml) {
  return `
      <div class="entity-card">
        <div class="card-header">
          <span class="badge ${badge[0]}">${_esc(badge[1])}</span>
          <h3>${_esc(title)}</h3>
          ${carrierText ? `<span class="carrier">${_esc(carrierText)}</span>` : ''}
        </div>
        <div class="card-body">
${bodyHtml}
        </div>
        ${extraHtml || ''}
      </div>`;
}

// 运输时间线（<details> 折叠）。rows = normalizeTimeline() 的输出。
function _timelineBlock(rows, opts = {}) {
  if (!rows.length) return '';
  const doneLast = opts.doneLast || false;
  const abnormalIdx = new Set(opts.abnormalIdx || []);
  const last = rows.length - 1;
  const lis = rows.map((r, i) => {
    let cls = 'done';
    if (abnormalIdx.has(i)) cls = 'abnormal';
    else if (i === last) cls = doneLast ? 'done' : 'current';
    const facility = r.facility ? ` · ${_esc(r.facility)}` : '';
    const loc = r.location
      ? ` · <span class="loc">${_esc(r.location)}${facility}</span>`
      : (r.facility ? ` · <span class="loc">${_esc(r.facility)}</span>` : '');
    return `<li class="${cls}">${r.time ? `<time>${_esc(r.time)}</time>` : ''}<span class="evt">${_esc(r.status)}</span>${loc}${r.ride ? `<span class="flight">${_esc(r.ride)}</span>` : ''}</li>`;
  });
  const open = opts.open ? ' open' : '';
  const summary = opts.summary || `运输轨迹（${rows.length} 节点）`;
  return `<details${open}><summary>${_esc(summary)}</summary><ul class="timeline">${lis.join('')}</ul></details>`;
}

// ---- 空运单卡片 ----
function _awbBadge(q, events, arrived) {
  if (q.success === false) return ['danger', '查询失败'];
  const d = q.data || {};
  let s = statusZh(d.currentStatus ?? d.shipmentStatus ?? d.latestStatus ?? d.status ?? '');
  if (s === '未知') s = '';
  s = s || (events.length ? events[events.length - 1].status : '');
  const last = events.length ? events[events.length - 1].status : '';
  if (/已交付/.test(s) || /已交付/.test(last)) return ['success', '已交付'];
  if ((/已关闭/.test(s) || /已关闭/.test(last)) && !arrived) return ['warning', '状态异常'];
  if (s) return ['info', _short(s, 10) || '已查询'];
  return ['info', '已查询'];
}

function awbCard(q, idx) {
  const d = q.data || {};
  const num = d.awbNumber || q.query || q.raw || '-';
  const carrierText = _carrierZh(q.carrier);
  if (q.success === false) {
    return _cardShell(['danger', '查询失败'], num, carrierText, _failureBody(q, '该运单网站上未有轨迹信息。'));
  }

  // sections 过滤（与 markdown 报告一致）
  const sections = Array.isArray(q.sections) ? q.sections : [];
  const show = (k) => sections.length === 0 || sections.includes(k);
  // 同时指定「轨迹」和「最新动态」时，以完整轨迹为准
  const latestOnly = sections.includes('latest') && !sections.includes('events');

  const eventsAll = normalizeTimeline(d.events, 'awb');
  const events = latestOnly ? eventsAll.slice(0, 1) : eventsAll;
  const arrived = eventsAll.some((e) => /已到达|已交付/.test(e.status));
  const closedNoArrival = eventsAll.some((e) => /已关闭/.test(e.status)) && !arrived;
  const badge = _awbBadge(q, eventsAll, arrived);

  const rv = routeView(d.events, d.origin || d.originName, d.destination || d.destinationName, 'awb');
  if (!rv.origin && eventsAll[0]) rv.origin = eventsAll[0].location;
  if (!rv.destination && eventsAll.length) rv.destination = eventsAll[eventsAll.length - 1].location;

  const body = [];
  // route
  if (show('route')) {
    const points = [rv.origin, ...rv.transit, rv.destination].filter(Boolean);
    if (points.length) body.push(`<div class="route">${points.map(_esc).join(' → ')}</div>`);
  }
  // cargo
  if (show('cargo')) {
    const dims = [];
    const pieces = d.pieces ?? d.totalPieces;
    const weight = d.weight ?? d.totalWeight;
    const volume = d.volume ?? d.totalVolume;
    if (pieces != null && pieces !== '') dims.push(`${_esc(pieces)} 件`);
    if (weight != null && weight !== '') dims.push(`${_esc(weight)} kg`);
    if (volume != null && volume !== '') dims.push(`${_esc(volume)} m³`);
    if (dims.length) body.push(`<div class="meta">${dims.join(' · ')}</div>`);
  }

  if (closedNoArrival) body.push('<div class="missing">⚠ 航班已关闭，但无到达记录，需人工确认</div>');
  if (q.url) body.push(_srcRow('数据来源', q.url));
  const fb = _fallbackHtml(q.fallback);
  if (fb) body.push(fb);

  // events / latest
  let extra = '';
  const showEvents = show('events') || latestOnly;
  if (showEvents && events.length) {
    const abnormalIdx = [];
    events.forEach((e, i) => {
      if (ABNORMAL_STATUS_RE.test(e.status) || (/已关闭/.test(e.status) && !arrived)) abnormalIdx.push(i);
    });
    const doneLast = /已交付/.test(events[events.length - 1].status);
    extra = _timelineBlock(events, { open: idx === 0 && !latestOnly, doneLast, abnormalIdx, summary: latestOnly ? '最新动态' : '运输轨迹' });
  } else if (showEvents) {
    extra = `<details><summary>${latestOnly ? '最新动态' : '运输轨迹'}</summary><div class="missing">该运单网站上未有轨迹信息。</div></details>`;
  }

  return _cardShell(badge, num, carrierText, body.join('\n        '), extra);
}

// ---- 集装箱卡片 ----
function containerCard(q) {
  const d = q.data || {};
  const num = d.containerNumber || q.raw || q.query || '-';
  if (q.success === false) {
    return _cardShell(['danger', '查询失败'], num, _carrierZh(q.carrier),
      _failureBody(q, '该箱网站上未查到轨迹信息。'));
  }

  // sections 过滤（与 markdown 报告一致）
  const sections = Array.isArray(q.sections) ? q.sections : [];
  const show = (k) => sections.length === 0 || sections.includes(k);
  // 同时指定「轨迹」和「最新动态」时，以完整轨迹为准
  const latestOnly = sections.includes('latest') && !sections.includes('events');

  const type = translateContainerType(d.containerType) || '';
  const carrierText = [_carrierZh(q.carrier), type].filter(Boolean).join(' · ');
  const hasEvents = Array.isArray(d.events) && d.events.length;
  const screenshotOnly = (q.screenshot || q.screenshotFile) && !hasEvents && !d.containerType && !d.origin;
  const eventsAll = normalizeTimeline(d.events, 'container');
  const events = latestOnly ? eventsAll.slice(0, 1) : eventsAll;
  const lastStatus = eventsAll.length ? eventsAll[eventsAll.length - 1].status : '';

  let badge;
  if (screenshotOnly) badge = ['info', '落地页截图'];
  else if (DONE_LAST_STATUS.includes(lastStatus) || lastStatus === '已卸船') badge = ['success', _short(lastStatus, 8)];
  else if (eventsAll.length && !d.eta) badge = ['warning', 'ETA 缺失'];
  else if (lastStatus) badge = ['info', _short(lastStatus, 8)];
  else badge = ['info', '已查询'];

  const body = [];
  // route
  if (show('route')) {
    const rv = routeView(d.events, d.origin, d.destination, 'container');
    if (!rv.origin && eventsAll[0]) rv.origin = eventsAll[0].location;
    if (!rv.destination && eventsAll.length) rv.destination = eventsAll[eventsAll.length - 1].location;
    const points = [rv.origin, ...rv.transit, rv.destination].filter(Boolean);
    if (points.length) body.push(`<div class="route">${points.map(_esc).join(' → ')}</div>`);
  }
  // timeline
  if (show('timeline')) {
    const times = [];
    if (d.departure) times.push(`离港 ${_esc(dateDisplay(d.departure))}`);
    if (d.eta) times.push(`预计到港 ${_esc(dateDisplay(d.eta))}`);
    if (d.lastUpdated) times.push(`最近更新 ${_esc(relativeZh(d.lastUpdated))}`);
    if (times.length) body.push(`<div class="meta">${times.join(' · ')}</div>`);
    const miss = [];
    if (!d.departure && hasEvents) miss.push('离港时间');
    if (!d.eta && hasEvents) miss.push('预计到港时间（ETA）');
    if (miss.length) body.push(`<div class="missing">⚠ ${miss.join(' / ')}未提供</div>`);
  }

  if (screenshotOnly) {
    const file = q.screenshotFile || String(q.screenshot || '').split(/[\\/]/).pop();
    body.push(`<div class="missing">该箱以承运商官网落地页整页截图返回（截图文件：${_esc(file)}），无结构化箱型/航线/轨迹数据，请人工查看截图确认。</div>`);
  }
  // basic → 数据来源
  if (show('basic')) {
    const srcUrl = q.url || CARRIER_ENTRY[q.carrier];
    if (srcUrl) body.push(_srcRow('数据来源', srcUrl));
  }
  const fb = _fallbackHtml(q.fallback);
  if (fb) body.push(fb);

  // events / latest
  let extra = '';
  const showEvents = show('events') || latestOnly;
  if (showEvents && events.length) {
    const abnormalIdx = [];
    events.forEach((e, i) => { if (ABNORMAL_STATUS_RE.test(e.status)) abnormalIdx.push(i); });
    const doneLast = DONE_LAST_STATUS.includes(lastStatus) || lastStatus === '已卸船';
    extra = _timelineBlock(events, { doneLast, abnormalIdx, summary: latestOnly ? '最新动态' : '运输轨迹' });
  } else if (showEvents && !screenshotOnly) {
    extra = `<details><summary>${latestOnly ? '最新动态' : '运输轨迹'}</summary><div class="missing">该箱网站上未查到轨迹信息。</div></details>`;
  }

  return _cardShell(badge, num, carrierText, body.join('\n        '), extra);
}

// ---- 提单卡片 ----
function blCard(q) {
  const d = q.data || {};
  const num = d.blNumber || q.raw || q.query || '-';
  if (q.success === false) {
    return _cardShell(['danger', '查询失败'], num, _carrierZh(q.carrier),
      _failureBody(q, '该提单项下未查到轨迹信息。'));
  }
  const body = [];
  const containers = d.containers
    ? (Array.isArray(d.containers) ? d.containers.map((c) => c.containerNumber || c.number || c).join('、') : String(d.containers))
    : '';
  if (containers) body.push(`<div class="meta">关联箱号：${_esc(containers)}</div>`);
  if (d.eta) body.push(`<div class="meta">预计到达：${_esc(dateDisplay(d.eta))}</div>`);
  if (d.note) body.push(`<div class="meta">备注：${_esc(d.note)}</div>`);
  if (q.url) body.push(_srcRow('数据来源', q.url));
  const fb = _fallbackHtml(q.fallback);
  if (fb) body.push(fb);
  if (!body.length) body.push('<div class="missing">未解析到提单结构化信息。</div>');

  const events = normalizeTimeline(d.events, 'bl');
  let extra = '';
  if (events.length) {
    const abnormalIdx = [];
    events.forEach((e, i) => { if (ABNORMAL_STATUS_RE.test(e.status)) abnormalIdx.push(i); });
    const doneLast = DONE_LAST_STATUS.includes(events[events.length - 1].status);
    extra = _timelineBlock(events, { doneLast, abnormalIdx });
  }
  return _cardShell(['info', '提单'], num, _carrierZh(q.carrier), body.join('\n        '), extra);
}

// ---- 公司卡片 ----
function _listOrEmpty(items, render, emptyText) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return `<div class="empty-line">${_esc(emptyText)}</div>`;
  return '<ul class="seg-list">' + list.map(render).join('') + '</ul>';
}

function _companyDiveCard(name, dive, q) {
  const b = dive.basic || {};
  const sh = dive.shareholders || [];
  const inv = dive.investments || [];
  const jr = dive.judicialRisk || {};
  const ab = dive.abnormal || {};
  const riskCount = _num(jr.count) || 0;
  const badge = riskCount ? ['warning', `司法风险 ${riskCount} 条`] : ['success', '工商已核验'];

  // sections 过滤（与 markdown 报告一致）
  const sections = Array.isArray(q.sections) ? q.sections : [];
  const show = (k) => sections.length === 0 || sections.includes(k);

  const body = [];
  // basic → 工商基础信息
  if (show('basic')) {
    const kvRows = [
      ['公司名称', b.companyName || name],
      ['统一社会信用代码', b.creditCode],
      ['法定代表人', b.legalRep],
      ['注册资本', b.registeredCapital],
      ['成立日期', b.foundedAt],
      ['登记状态', b.status],
      ['注册地址', b.address],
    ].filter(([, v]) => v != null && v !== '');
    body.push('<dl class="kv">' + kvRows.map(([k, v]) =>
      `<dt>${_esc(k)}</dt><dd>${_esc(v)}</dd>`).join('') + '</dl>');
    if (b.businessScope) body.push(`<details class="scope"><summary>经营范围</summary><div class="scope-text">${_esc(b.businessScope)}</div></details>`);
    body.push(q.url
      ? _srcRow('数据来源', q.url)
      : '<div class="src"><span>数据来源：企查查（qcc-agent-cli 国内工商查询）</span></div>');
  }
  const fb = _fallbackHtml(q.fallback);
  if (fb) body.push(fb);

  // 其余四段（股权结构/对外投资/司法风险/经营异常）按需渲染
  const segParts = [];
  if (show('shareholders')) {
    segParts.push('<h5>股权结构</h5>',
      _listOrEmpty(sh, (s) => `<li>${_esc(s.name)}${s.ratio ? `，持股 ${_esc(s.ratio)}` : ''}${s.amount ? `，认缴 ${_esc(s.amount)}` : ''}</li>`, '无股权结构信息。'));
  }
  if (show('investments')) {
    segParts.push('<h5>对外投资</h5>',
      _listOrEmpty(inv, (i) => `<li>${_esc(i.companyName)}${i.ratio ? `（${_esc(i.ratio)}）` : ''}</li>`, '无对外投资信息。'));
  }
  if (show('judicial')) {
    segParts.push('<h5>司法风险</h5>',
      jr.present
        ? (jr.count ? `<div class="meta">司法风险记录 ${_esc(jr.count)} 条</div>` : '') +
          _listOrEmpty(jr.items, (it) => `<li>${_esc(it)}</li>`, '无明细。')
        : '<div class="empty-line">无司法风险记录。</div>');
  }
  if (show('abnormal')) {
    segParts.push('<h5>经营异常/处罚</h5>',
      ab.present
        ? (ab.count ? `<div class="meta">经营异常/处罚记录 ${_esc(ab.count)} 条</div>` : '') +
          _listOrEmpty(ab.items, (it) => `<li>${_esc(it)}</li>`, '无明细。')
        : '<div class="empty-line">无经营异常或行政处罚记录。</div>');
  }

  const seg = segParts.length
    ? '<details class="seg" open><summary>明细</summary>' + segParts.join('') + '</details>'
    : '';

  return _cardShell(badge, b.companyName || name, '国内工商', body.join('\n        '), seg);
}

function companyCard(q) {
  const d = q.data || {};
  const name = d.companyName || q.query || q.raw || '-';
  const qcc = d.qcc || {};
  const dive = qcc.basic && typeof qcc.basic === 'object' ? qcc : null;
  if (dive) return _companyDiveCard(name, dive, q);

  const cliFailed = qcc.status === 'cli_failed';
  const partial = qcc.status === 'partial';
  const overseas = d.overseas;
  let badge;
  if (q.success === false || cliFailed) badge = ['danger', '数据获取失败'];
  else if (overseas) badge = ['info', '境外主体'];
  else if (partial) badge = ['warning', '工商数据不完整'];
  else badge = ['info', '线索发现'];

  const body = [];
  if (d.note) body.push(`<div class="meta">${_esc(d.note)}</div>`);
  if (qcc.error) body.push(`<div class="missing">${_esc(qcc.error)}</div>`);
  if (d.bing) {
    if (d.bing.officialDomain) body.push(`<div class="meta">疑似官网：${_esc(d.bing.officialDomain)}</div>`);
    const hint = d.bing.registrationHint;
    if (hint && hint.hint) {
      const hintHtml = hint.lowConfidence
        ? `注册地线索（低置信度）：${_esc(hint.hint)}`
        : `注册地线索：${_esc(hint.hint)}`;
      body.push(`<div class="meta">${hintHtml}${hint.sourceUrl ? `（<a href="${_esc(hint.sourceUrl)}" target="_blank" rel="noopener">来源</a>）` : ''}</div>`);
    }
  }
  if (overseas && overseas.official && overseas.official.searchUrl) {
    body.push(`<div class="note">疑似注册地：${_esc(overseas.registryName || '')}，请前往官方注册机构完成查册。</div>`);
    body.push(_srcRow(`官方查册入口（${overseas.registryName || '官方注册机构'}）`, overseas.official.searchUrl));
  }
  const fb = _fallbackHtml(q.fallback);
  if (fb) body.push(fb);
  if (!body.length) body.push('<div class="missing">未获取到该公司的工商数据或可靠线索。</div>');

  return _cardShell(badge, name, '', body.join('\n        '));
}

// ---- 个人卡片 ----
function personCard(q) {
  const d = q.data || {};
  const name = d.personName || q.raw || q.query || '-';
  const risks = d.riskFlags || [];
  const badge = risks.length ? ['danger', `风险线索 ${risks.length}`] : ['info', '未发现明显风险'];
  const body = [];
  if ((d.associatedCompanies || []).length) {
    body.push('<h5>关联公司 / 角色线索</h5>');
    body.push('<ul class="seg-list">' + d.associatedCompanies.slice(0, 10).map((t) => `<li>${_esc(t)}</li>`).join('') + '</ul>');
  }
  if (risks.length) {
    body.push('<h5>司法 / 风险线索</h5>');
    body.push('<ul class="seg-list">' + risks.slice(0, 10).map((t) => `<li class="risk">${_esc(t)}</li>`).join('') + '</ul>');
    body.push((d.riskSources || []).slice(0, 6)
      .map((s) => _srcRow('风险来源', s.url)).join(''));
  }
  if ((d.topSources || []).length) {
    body.push('<h5>公开搜索来源</h5>');
    body.push(d.topSources.slice(0, 6).map((s) => _srcRow('搜索结果', s.url)).join(''));
  }
  if (d.note) body.push(`<div class="note">${_esc(d.note)}</div>`);
  if (!body.length) body.push('<div class="missing">未获取到该人员的公开线索。</div>');
  return _cardShell(badge, name, '公开搜索（Bing）', body.join('\n        '));
}

// ---- 名单筛查面板 ----
function _tagPieOption(results) {
  const m = new Map();
  for (const r of results || []) {
    const zh = translateDowJonesTags(r.tags);
    if (!zh) continue;
    for (const t of String(zh).split('、').filter(Boolean)) m.set(t, (m.get(t) || 0) + 1);
  }
  if (!m.size) return null;
  const palette = { '制裁': '#ef4444', '政治公众人物': '#f59e0b' };
  const data = [...m.entries()].map(([name, value]) => ({
    name, value,
    itemStyle: palette[name] ? { color: palette[name] } : undefined,
  }));
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    // 图表文字与 CSS 档位/色板对齐：微标注 11px，图例用 --muted 色
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11, color: '#6b7280' } },
    color: CHART_COLORS,
    textStyle: { color: '#1f2937' },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '44%'],
      label: { show: data.length <= 4, fontSize: 11, color: '#1f2937', formatter: '{b}\n{c}' },
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 1 },
      data,
    }],
  };
}

function rosterPanel(it, chartKey, chartDefs) {
  const name = it.raw || it.query || '-';
  const ok = it.success && (!it.status || it.status === 'ok');
  const head = [];

  if (!ok) {
    head.push('<div class="panel-head"><span class="badge danger">渠道故障</span></div>');
    head.push(`<h4>${_esc(name)}</h4>`);
    if (it.status) head.push(`<div class="meta">状态：${_esc(it.status)}</div>`);
    if (it.error) head.push(`<div class="missing">${_esc(it.error)}</div>`);
    head.push(_srcRow('尝试地址', it.url || CARRIER_ENTRY['Dow Jones RiskCenter']));
    head.push(_fallbackHtml(it.fallback));
    head.push('<div class="note">名单渠道故障（未登录 / 会话失败等），并非「无命中」，需修复后重查。</div>');
    return `<div class="panel">${head.join('\n        ')}</div>`;
  }

  const total = _num(it.total) || 0;
  const flags = it.flags || {};
  const marks = [];
  if (flags.sanctions) marks.push('制裁');
  if (flags.pep) marks.push('政治公众人物');
  if (flags.adverseMedia) marks.push('负面媒体');
  const badge = flags.sanctions ? ['danger', `命中 ${total} 条`] : total ? ['warning', `命中 ${total} 条`] : ['info', '无命中'];
  head.push(`<div class="panel-head"><span class="badge ${badge[0]}">${_esc(badge[1])}</span></div>`);
  head.push(`<h4>${_esc(name)}</h4>`);
  head.push(`<div class="hit-summary"><span class="big">${total}</span><span class="small">条命中${marks.length ? ` · ${marks.map(_esc).join(' / ')}` : ''}</span></div>`);

  // 与 Markdown 报告一致：命中明细最多展示 ROSTER_RESULTS_LIMIT 条
  const results = (it.results || []).slice(0, ROSTER_RESULTS_LIMIT);
  const pie = _tagPieOption(results);
  if (pie) {
    const chartId = `roster-chart-${chartKey}`;
    head.push(`<div id="${chartId}" class="chart"></div>`);
    chartDefs.push({ id: chartId, option: pie });
  }

  if (total > results.length) {
    head.push(`<div class="note">系统首屏解析到 ${results.length} 条明细，官方渠道共 ${total} 条，全量结果需人工登录 Dow Jones 翻页核验。</div>`);
  } else if (it.note) {
    head.push(`<div class="note">${_esc(it.note)}</div>`);
  }
  if (total === 0) head.push('<div class="empty-line">未返回任何匹配实体。</div>');
  head.push(_srcRow('数据来源', it.url || CARRIER_ENTRY['Dow Jones RiskCenter']));

  if (results.length) {
    const rows = results.map((r) => `<tr>
      <td>${_esc(r.name)}</td><td>${_esc(r.gender)}</td><td>${_esc(r.dob)}</td>
      <td>${_esc(r.country)}</td><td class="detail-cell">${_esc(r.detail)}</td><td>${_esc(translateDowJonesTags(r.tags))}</td>
    </tr>`).join('');
    head.push(`<details class="roster-detail"><summary>命中明细（${results.length} 条）</summary>
      <div class="table-scroll"><table class="roster-table">
        <thead><tr><th>姓名</th><th>性别</th><th>出生日期</th><th>国籍</th><th>详情</th><th>标签</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div></details>`);
  }
  head.push(_fallbackHtml(it.fallback));

  return `<div class="panel">${head.join('\n        ')}</div>`;
}

// ---- KPI 仪表盘 ----
function _isCompanyChannelFail(q) {
  return q.success === false || (q.data && q.data.qcc && q.data.qcc.status === 'cli_failed');
}

function buildKpis(s, issueCount) {
  const awbs = s.airWaybills || [];
  const cons = s.containers || [];
  const bls = s.billOfLadings || [];
  const comps = s.companies || [];
  const persons = s.persons || [];
  const rosterItems = (s.rosters || []).flatMap((r) => r.items || []);
  const cards = [];

  // 1) 核查实体总数
  const totalEntities = awbs.length + cons.length + bls.length + comps.length + persons.length + rosterItems.length;
  const scope = [];
  if (awbs.length) scope.push(`${awbs.length} 空运单`);
  if (cons.length) scope.push(`${cons.length} 集装箱`);
  if (bls.length) scope.push(`${bls.length} 提单`);
  if (comps.length) scope.push(`${comps.length} 公司`);
  if (persons.length) scope.push(`${persons.length} 个人`);
  if (rosterItems.length) scope.push(`${rosterItems.length} 名单筛查`);
  cards.push({ cls: '', num: String(totalEntities), label: '核查实体总数', sub: scope.join(' · ') });

  // 2) 名单命中
  if (rosterItems.length) {
    const hitItems = rosterItems.filter((it) => it.success && (!it.status || it.status === 'ok') && (it.total || 0) > 0);
    const hits = hitItems.reduce((a, it) => a + (it.total || 0), 0);
    const sanctions = hitItems.some((it) => it.flags && it.flags.sanctions);
    const failed = rosterItems.filter((it) => !(it.success && (!it.status || it.status === 'ok'))).length;
    cards.push({
      cls: hits ? 'high' : 'ok',
      num: String(hits),
      label: '名单命中实体',
      sub: hitItems.length
        ? hitItems.slice(0, 2).map((it) => `${_short(it.raw, 16)} ${it.total} 条`).join(' · ')
        : (failed ? `${failed} 个名单查询渠道故障` : '名单查询无命中'),
      flag: sanctions ? '含制裁 / PEP 记录' : '',
    });
  }

  // 3) 查询失败 / 渠道故障
  const failParts = [];
  const fAwb = awbs.filter((q) => q.success === false).length;
  const fCon = cons.filter((q) => q.success === false).length;
  const fBl = bls.filter((q) => q.success === false).length;
  const fComp = comps.filter(_isCompanyChannelFail).length;
  const fRoster = rosterItems.filter((it) => !(it.success && (!it.status || it.status === 'ok'))).length;
  if (fAwb) failParts.push(`空运单 ${fAwb}`);
  if (fCon) failParts.push(`集装箱 ${fCon}`);
  if (fBl) failParts.push(`提单 ${fBl}`);
  if (fComp) failParts.push(`公司 ${fComp}`);
  if (fRoster) failParts.push(`名单 ${fRoster}`);
  const failN = fAwb + fCon + fBl + fComp + fRoster;
  cards.push({
    cls: failN ? 'high' : 'ok',
    num: String(failN),
    label: '查询失败 / 渠道故障',
    sub: failN ? failParts.join(' · ') : '全部查询渠道正常',
  });

  // 4) 待人工处理
  cards.push({
    cls: issueCount ? 'warn' : 'ok',
    num: String(issueCount),
    label: '待人工处理项',
    sub: issueCount ? '见下方「异常与待人工处理」清单' : '无待办事项',
  });

  // 5) 运输实体终态
  const transport = [];
  for (const q of awbs) {
    if (q.success === false) continue;
    const d = q.data || {};
    const evs = normalizeTimeline(d.events, 'awb');
    let s = statusZh(d.currentStatus ?? d.shipmentStatus ?? d.latestStatus ?? d.status ?? '');
    if (s === '未知') s = '';
    const last = evs.length ? evs[evs.length - 1].status : '';
    const terminal = /已交付/.test(s) || /已交付/.test(last);
    transport.push({ label: d.awbNumber || q.raw || q.query, terminal, last: s || last });
  }
  for (const q of cons) {
    if (q.success === false) continue;
    const evs = normalizeTimeline((q.data || {}).events, 'container');
    const last = evs.length ? evs[evs.length - 1].status : '';
    transport.push({ label: (q.data || {}).containerNumber || q.raw || q.query, terminal: TERMINAL_STATUS.includes(last), last });
  }
  if (transport.length) {
    const done = transport.filter((t) => t.terminal).length;
    cards.push({
      cls: done === transport.length ? 'ok' : '',
      num: `${done}/${transport.length}`,
      label: '运输实体已达终态',
      sub: transport.slice(0, 3).map((t) => `${_short(t.label, 14)} ${t.terminal ? t.last || '已终态' : '在途'}`).join(' · '),
    });
  }

  return cards;
}

// ---- 关键发现 / 异常表 ----
const CRITICAL_RE = /名单.*命中|命中.*条|制裁|PEP|失败|故障|EPERM|未取得|不一致|无数据|未查到/i;
const PRIORITY_HIGH_RE = /失败|故障|EPERM|制裁|sanction|不一致|无数据|未查到/i;

function _isCritical(text) {
  return CRITICAL_RE.test(String(text || ''));
}

function findingsHtml(issues) {
  const list = issues || [];
  if (!list.length) return '';
  return '<ul class="findings">' + list.map((t) =>
    `<li class="${_isCritical(t) ? 'critical' : ''}">${_esc(t)}</li>`).join('') + '</ul>';
}

function _suggestAction(text) {
  const t = String(text || '');
  if (/名单|制裁|PEP|复核|命中/.test(t)) return '按出生日期 / 国籍 / 证件号人工复核，评估制裁与 PEP 风险';
  if (/集装箱|箱号|船|ETA|到港|离港/.test(t)) return '联系船公司或货代核实运输状态与预计到港时间';
  if (/空运|运单|航空|航班|承运人/.test(t)) return '联系承运人确认货物最终到达状态';
  if (/公司|工商|企查查|CLI|查册|注册/.test(t)) return '修复 CLI 权限或经官方注册机构人工查册';
  if (/不一致|邮件原文/.test(t)) return '以官网查询结果为准，人工核对邮件原始信息';
  return '人工核实并补充相关信息';
}

function issuesTableHtml(issues) {
  const list = issues || [];
  if (!list.length) return '';
  const rows = list.map((t) => {
    const high = PRIORITY_HIGH_RE.test(String(t));
    return `<tr>
      <td><span class="pri ${high ? 'high' : 'mid'}">${high ? '高' : '中'}</span></td>
      <td>${_esc(t)}</td>
      <td>${_esc(_suggestAction(t))}</td>
      <td class="check-cell"><input type="checkbox" class="check"></td>
    </tr>`;
  }).join('');
  return `<table class="issues-table"><thead><tr>
    <th>优先级</th><th>事项</th><th>建议动作</th><th>完成</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

// 调度层硬失败 / 校验拦截（issues 未必提到，单独如实列出，不遗漏）
function schedulerNotesHtml(s) {
  const notes = [];
  for (const f of s.failed || []) notes.push(`查询异常（${f.type}）${f.raw}：${f.error}`);
  for (const sk of s.skipped || []) notes.push(`未执行查询（${sk.type}）${sk.raw}：${sk.reason}`);
  if (!notes.length) return '';
  return '<div class="note skip-note"><strong>调度层说明：</strong><ul>' +
    notes.map((t) => `<li>${_esc(t)}</li>`).join('') + '</ul></div>';
}

// ---- 区块包装 ----
function _section(title, innerHtml) {
  if (!innerHtml) return '';
  return `<div class="section"><div class="section-title">${_esc(title)}</div>${innerHtml}</div>`;
}

// ---- 叙事小节（提单分析 / 个人线索 / 其他 LLM 说明，marked 渲染）----
function _narrativeHtml(report, s) {
  const secs = narrativeSections(report || {}, s);
  if (!secs.length) return '';
  const md = secs.map((sec) => {
    const lines = [`## ${sec.title}`, ''];
    if (sec.details) lines.push(sec.details, '');
    for (const f of sec.facts || []) lines.push(`- ${f}`);
    return lines.join('\n');
  }).join('\n\n');
  return `<div class="report-body narrative">${marked.parse(md)}</div>`;
}

/**
 * 渲染完整 HTML 报告。
 * @param {object} report LLM 边界2 输出的结构化报告
 * @param {object} schedulerResult 调度层原始查询结果（卡片/时间线/名单面板的数据来源）
 * @param {string} markdown 已生成的 Markdown 报告（保留参数兼容；HTML 以结构化数据重排）
 */
function renderHtml(report, schedulerResult, markdown) {
  const s = schedulerResult || {};
  const r = report || {};
  const now = formatBeijingTime();
  const issues = r.issues || [];

  // KPI 仪表盘
  const kpis = buildKpis(s, issues.length);
  const kpiHtml = kpis.map((k) => `
      <div class="stat-card ${k.cls}">
        <div class="num">${_esc(k.num)}</div>
        <div class="label">${_esc(k.label)}</div>
        ${k.flag ? `<div class="flag">${_esc(k.flag)}</div>` : ''}
        <div class="sub">${_esc(k.sub || '')}</div>
      </div>`).join('');

  // 实体卡片
  const awbHtml = (s.airWaybills || []).map((q, i) => awbCard(q, i)).join('');
  const containerHtml = (s.containers || []).map((q) => containerCard(q)).join('');
  const blHtml = (s.billOfLadings || []).map((q) => blCard(q)).join('');
  const companyHtml = (s.companies || []).map((q) => companyCard(q)).join('');
  const personHtml = (s.persons || []).map((q) => personCard(q)).join('');

  // 名单面板（同时产出迷你饼图定义）
  const rosterChartDefs = [];
  const rosterPanelsHtml = (s.rosters || []).map((roster, ri) => {
    const caption = roster.title ? `<div class="roster-caption">${_esc(roster.title)}${roster.type && roster.type !== 'unknown' ? ` · ${_esc(roster.type)}` : ''}</div>` : '';
    const panels = (roster.items || []).map((it, i) => rosterPanel(it, `${ri}-${i}`, rosterChartDefs)).join('');
    return caption + `<div class="risk-panels">${panels}</div>`;
  }).join('');

  // 异常与建议
  const issuesHtml = issuesTableHtml(issues);
  const schedNotes = schedulerNotesHtml(s);
  const issuesSection = (issuesHtml || schedNotes)
    ? issuesHtml + schedNotes
    : '<div class="empty-note">未发现需要人工处理的异常事项。</div>';
  const recHtml = (r.recommendations || []).length
    ? '<div class="suggestions"><ol>' + r.recommendations.map((t) => `<li>${_esc(t)}</li>`).join('') + '</ol></div>'
    : '';

  // 当前仅名单面板使用 ECharts（迷你饼图）
  const chartScriptData = JSON.stringify(rosterChartDefs);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>尽职调查报告 · ${now.slice(0, 10)}</title>
<script src="${ECHARTS_CDN}"></script>
<style>
  :root{
    --bg:#f5f7fa; --card:#fff; --text:#1f2937; --muted:#6b7280;
    --green:#10b981; --yellow:#f59e0b; --red:#ef4444; --blue:#3b82f6;
    --border:#e5e7eb; --shadow:0 1px 3px rgba(0,0,0,.08);
    /* 统一字号档（同角色文字必须引用同一变量） */
    --fs-badge:11px;  /* 状态徽章 / 时间线航班号等微标注 */
    --fs-xs:12px;     /* 辅助信息：来源、时间、页脚、KPI 副文、表头外小字 */
    --fs-sm:13px;     /* 次级正文：meta、时间线、表格、备注、折叠摘要 */
    --fs-base:14px;   /* 正文：报告头结论、关键发现、航线、建议 */
    --fs-md:15px;     /* 卡片标题 / 叙事三级标题 */
    --fs-lg:17px;     /* 叙事二级标题 */
    --fs-xl:18px;     /* 区块标题 */
    --fs-h1:24px;     /* 报告主标题 */
    /* 语义文字色（背景面上的小字） */
    --warn-text:#b45309;   /* 警示类文字（琥珀-700，小字对比度达标） */
    --warn-bg:#fffbeb;     /* 警示类底色（琥珀-50） */
    --warn-border:#fde68a; /* 警示类描边（琥珀-200） */
    --red-text:#b91c1c;    /* 风险类文字（红-700，小字对比度达标） */
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
       background:var(--bg);color:var(--text);line-height:1.6;padding:24px;font-size:var(--fs-base)}
  .container{max-width:1200px;margin:0 auto}

  /* 报告头 */
  .report-header{background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;
    padding:28px 32px;border-radius:12px;margin-bottom:20px}
  .report-header h1{font-size:var(--fs-h1);margin:0 0 6px;letter-spacing:1px}
  .report-header .meta{font-size:var(--fs-sm);opacity:.85}
  .report-header .conclusion{margin-top:14px;padding:12px 16px;background:rgba(255,255,255,.15);
    border-radius:8px;font-size:var(--fs-base);line-height:1.7}

  /* KPI 仪表盘 */
  .dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
  .stat-card{background:var(--card);border-radius:10px;padding:18px 20px;box-shadow:var(--shadow);border-left:4px solid var(--blue)}
  .stat-card.high{border-left-color:var(--red)}
  .stat-card.warn{border-left-color:var(--yellow)}
  .stat-card.ok{border-left-color:var(--green)}
  .stat-card .num{font-size:30px;font-weight:700;line-height:1.2}
  .stat-card .label{font-size:var(--fs-base);font-weight:600;margin-top:2px}
  .stat-card .flag{font-size:var(--fs-xs);color:var(--red-text);font-weight:600;margin-top:2px}
  .stat-card .sub{font-size:var(--fs-xs);color:var(--muted);margin-top:2px;line-height:1.5}

  /* 区块 */
  .section{margin-bottom:28px}
  .section-title{font-size:var(--fs-xl);font-weight:700;margin-bottom:14px;padding-left:10px;border-left:4px solid var(--blue)}

  /* 关键发现 */
  .findings{background:var(--card);border-radius:10px;padding:18px 22px;box-shadow:var(--shadow);margin:0}
  .findings li{list-style:none;padding:8px 0 8px 26px;position:relative;font-size:var(--fs-base);border-bottom:1px dashed var(--border)}
  .findings li:last-child{border-bottom:none}
  .findings li::before{content:"⚠";position:absolute;left:0;color:var(--yellow)}
  .findings li.critical::before{content:"●";color:var(--red)}

  /* 实体卡片 */
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px}
  .entity-card{background:var(--card);border-radius:10px;box-shadow:var(--shadow);overflow:hidden}
  .card-header{padding:14px 18px;background:#f9fafb;border-bottom:1px solid var(--border);
    display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .card-header h3{font-size:var(--fs-md);font-weight:700;margin:0;word-break:break-all}
  .card-header .carrier{font-size:var(--fs-xs);color:var(--muted);margin-left:auto;text-align:right}
  .badge{font-size:var(--fs-badge);padding:2px 10px;border-radius:999px;font-weight:600;color:#fff;white-space:nowrap}
  .badge.success{background:var(--green)}
  .badge.warning{background:var(--yellow)}
  .badge.danger{background:var(--red)}
  .badge.info{background:var(--blue)}
  .card-body{padding:14px 18px}
  .route{font-size:var(--fs-base);font-weight:600;margin-bottom:6px;line-height:1.6}
  .meta{font-size:var(--fs-sm);color:var(--muted);margin:3px 0;line-height:1.6}
  .meta a{color:var(--blue)}
  .missing{color:var(--warn-text);font-size:var(--fs-sm);margin-top:6px;line-height:1.6}
  .src{font-size:var(--fs-xs);color:var(--muted);margin-top:6px;line-height:1.6;word-break:break-all}
  .src a{color:var(--blue);text-decoration:none}
  .src a:hover{text-decoration:underline}

  /* Bing 兜底 */
  .fallback{margin-top:8px;border:1px solid var(--warn-border);background:var(--warn-bg);border-radius:8px;padding:8px 12px}
  .fb-title{font-size:var(--fs-xs);font-weight:700;color:var(--warn-text);margin-bottom:4px}
  .fb-list{margin:4px 0 0;padding-left:18px;font-size:var(--fs-sm)}
  .fb-list li{margin:4px 0}
  .fb-list a{color:var(--blue);text-decoration:none;word-break:break-all}
  .fb-list a:hover{text-decoration:underline}
  .fb-snip{color:var(--muted);font-size:var(--fs-xs);line-height:1.5}

  /* 折叠 / 时间线 */
  details{padding:0 18px 12px}
  details[open]{padding-bottom:14px}
  details > summary{cursor:pointer;font-size:var(--fs-sm);color:var(--blue);padding:8px 0 4px;user-select:none;list-style:none}
  details > summary::-webkit-details-marker{display:none}
  details > summary::before{content:"▸ ";display:inline-block;transition:transform .15s}
  details[open] > summary::before{content:"▾ "}
  .timeline{list-style:none;padding:6px 0 0 18px;border-left:2px solid var(--border);margin-left:6px}
  .timeline li{position:relative;padding:4px 0 10px 14px;font-size:var(--fs-sm);color:var(--muted);line-height:1.6}
  .timeline li::before{content:"";position:absolute;left:-24px;top:7px;width:9px;height:9px;
    border-radius:50%;background:#cbd5e1;border:2px solid #fff;box-shadow:0 0 0 1px #cbd5e1}
  .timeline li.done::before{background:var(--green);box-shadow:0 0 0 1px var(--green)}
  .timeline li.current::before{background:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,.25)}
  .timeline li.abnormal::before{background:var(--yellow);box-shadow:0 0 0 1px var(--yellow)}
  .timeline time{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--text);margin-right:6px;font-size:var(--fs-xs)}
  .timeline .evt{color:var(--text);font-weight:500}
  .timeline .loc{color:var(--text);font-weight:500}
  .timeline .flight{font-size:var(--fs-badge);color:var(--muted);margin-left:8px}

  /* 公司卡片 */
  .kv{display:grid;grid-template-columns:132px 1fr;gap:4px 12px;margin:0 0 8px;font-size:var(--fs-sm)}
  .kv dt{color:var(--muted);margin:0}
  .kv dd{margin:0;word-break:break-word}
  details.scope > summary,details.seg > summary{font-weight:600}
  .scope-text{font-size:var(--fs-sm);color:var(--text);background:#f9fafb;border-radius:6px;padding:8px 10px;margin:4px 0;line-height:1.7}
  .seg h5,.card-body h5{font-size:var(--fs-sm);margin:10px 0 4px;color:var(--text)}
  .seg-list{margin:4px 0;padding-left:18px;font-size:var(--fs-sm);max-height:240px;overflow:auto}
  .seg-list li{margin:3px 0;line-height:1.6}
  .seg-list li.risk{color:var(--red-text)}
  .empty-line{color:var(--muted);font-size:var(--fs-sm);padding:2px 0}

  /* 名单面板 */
  .roster-caption{font-size:var(--fs-sm);color:var(--muted);margin-bottom:10px;font-weight:600}
  .risk-panels{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .risk-panels:last-child{margin-bottom:0}
  @media(max-width:860px){.risk-panels{grid-template-columns:1fr}}
  .panel{background:var(--card);border-radius:10px;padding:18px 20px;box-shadow:var(--shadow)}
  .panel h4{font-size:var(--fs-md);margin:8px 0 6px;word-break:break-word}
  .panel-head{min-height:18px}
  .hit-summary{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
  .hit-summary .big{font-size:26px;font-weight:700;color:var(--red)}
  .hit-summary .small{font-size:var(--fs-xs);color:var(--muted)}
  .chart{width:100%;height:200px}
  .note{font-size:var(--fs-sm);color:var(--warn-text);background:var(--warn-bg);border-left:3px solid var(--yellow);
    padding:8px 12px;border-radius:4px;margin-top:10px;line-height:1.6}
  .note ul{margin:4px 0 0;padding-left:18px}
  .roster-detail{padding:0;margin-top:8px}
  .table-scroll{max-height:380px;overflow:auto;border:1px solid var(--border);border-radius:6px;margin-top:6px}

  /* 表格 */
  table{width:100%;border-collapse:collapse;font-size:var(--fs-sm);background:var(--card)}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}
  th{background:#f9fafb;font-weight:600;font-size:var(--fs-sm);white-space:nowrap}
  tr:hover td{background:#fafbfc}
  .roster-table td:nth-child(5){min-width:200px}
  .pri{font-weight:700;font-size:var(--fs-xs)}
  .pri.high{color:var(--red-text)} .pri.mid{color:var(--warn-text)}
  .check-cell{text-align:center;width:48px}
  .check{width:16px;height:16px;accent-color:var(--blue);cursor:pointer}

  /* 建议 */
  .suggestions{background:var(--card);border-radius:10px;padding:18px 22px;box-shadow:var(--shadow)}
  .suggestions li{margin:6px 0 6px 20px;font-size:var(--fs-base);line-height:1.7}

  .empty-note{background:var(--card);border:1px dashed var(--border);border-radius:10px;padding:24px;text-align:center;color:var(--muted);font-size:var(--fs-sm)}

  /* 叙事小节 */
  .report-body{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px 24px;box-shadow:var(--shadow)}
  .report-body h2{font-size:var(--fs-lg);margin:20px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--border)}
  .report-body h2:first-child{margin-top:0}
  .report-body h3{font-size:var(--fs-md);margin:16px 0 8px}
  .report-body p{margin:8px 0;line-height:1.7}
  .report-body ul,.report-body ol{padding-left:22px}
  .report-body li{margin:4px 0;line-height:1.7}
  .report-body table{margin:12px 0}
  .report-body th{white-space:normal}
  .report-body blockquote{margin:10px 0;padding:8px 16px;border-left:3px solid var(--blue);
    background:#eff6ff;color:var(--muted);border-radius:0 8px 8px 0}
  .report-body a{color:var(--blue);text-decoration:none;word-break:break-all}
  .report-body a:hover{text-decoration:underline}

  footer{text-align:center;font-size:var(--fs-xs);color:var(--muted);margin:30px 0 10px;line-height:1.8}

  @media print{
    body{background:#fff;padding:0}
    .report-header{border-radius:0}
    .stat-card,.entity-card,.panel,.suggestions,.findings{box-shadow:none;border:1px solid var(--border)}
    details:not([open]) > *:not(summary){display:none}
    details > summary{color:var(--text)}
  }
</style>
</head>
<body>
<div class="container">

  <!-- 报告头 -->
  <div class="report-header">
    <h1>尽职调查报告</h1>
    <div class="meta">生成时间：${_esc(now)}</div>
    <div class="conclusion"><strong>总体结论：</strong>${_esc(r.summary || '（无摘要）')}</div>
  </div>

  <!-- KPI 仪表盘 -->
  <div class="dashboard">${kpiHtml}
  </div>

  ${_section('关键发现', findingsHtml(issues))}

  ${_section('空运单', awbHtml ? `<div class="cards">${awbHtml}</div>` : '')}

  ${_section('集装箱', containerHtml ? `<div class="cards">${containerHtml}</div>` : '')}

  ${_section('提单', blHtml ? `<div class="cards">${blHtml}</div>` : '')}

  ${_section('公司核查', companyHtml ? `<div class="cards">${companyHtml}</div>` : '')}

  ${_section('个人核查', personHtml ? `<div class="cards">${personHtml}</div>` : '')}

  ${_section('名单筛查', rosterPanelsHtml)}

  ${_section('其他分析信息', _narrativeHtml(r, s))}

  <div class="section">
    <div class="section-title">异常与待人工处理</div>
    ${issuesSection}
  </div>

  ${_section('建议', recHtml)}

  <footer>
    本报告由自动尽调工具确定性渲染生成，内容基于真实查询结果汇总，缺省字段留空、不编造。<br>
    数据来源：航司官网 / 船司官网 / Dow Jones RiskCenter / 企查查 / Bing · 各实体查询来源已在对应卡片标注，仅供内部参考
  </footer>
</div>

<script>
  (function () {
    const defs = ${chartScriptData};
    if (!window.echarts) {
      document.querySelectorAll('.chart').forEach(function (el) {
        el.innerHTML = '<div style="font-size:var(--fs-xs);color:var(--muted);text-align:center;padding:24px 0">图表组件（ECharts CDN）加载失败，请联网后刷新页面查看名单标签分布图。</div>';
      });
      return;
    }
    const charts = [];
    defs.forEach(function (d) {
      const el = document.getElementById(d.id);
      if (!el) return;
      const chart = echarts.init(el);
      chart.setOption(d.option);
      charts.push(chart);
    });
    window.addEventListener('resize', function () { charts.forEach(function (c) { c.resize(); }); });
  })();
</script>
</body>
</html>`;
}

module.exports = { renderHtml };
