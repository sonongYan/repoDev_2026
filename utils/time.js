// ============================================================================
// 北京时间（Asia/Shanghai，UTC+8）格式化工具。
//
// Node 的 new Date().toISOString() 返回 UTC 时间，比北京慢 8 小时；
// 报告「生成时间」等展示字段需用北京时间，统一走本工具，避免时区错乱。
// ============================================================================

const TZ = 'Asia/Shanghai';

/**
 * 把日期格式化为「YYYY-MM-DD HH:mm:ss」的北京时间字符串。
 * @param {Date|string|number} [date] 可选，默认当前时间
 * @returns {string}
 */
function formatBeijingTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type) => (parts.find((p) => p.type === type) || {}).value || '';
  let hour = get('hour');
  // 部分运行时午夜会返回 "24"，需归一化为 "00"（北京无夏令时，无需额外处理）
  if (hour === '24') hour = '00';

  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

module.exports = { formatBeijingTime, TZ };