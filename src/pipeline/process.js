const { extractEntities } = require('../llm/extract');
const { runScheduler } = require('./scheduler');
const { defaultLogger } = require('../../utils/logger');
const { formatBeijingTime } = require('../../utils/time');

const logger = defaultLogger.child('pipeline:process');

// 名单筛查意图关键词：邮件出现这些字眼时，persons/companies/疑似名单 notes 一律并入 roster，
// 由调度层批量分发到 Dow Jones RiskCenter 名单筛查链路，而非走 Bing 线索。
const ROSTER_INTENT_RE =
  /名单|名单查询|名单筛查|名单信息|roster|道琼斯|dow\s*jones|riskcenter|sanction|制裁|筛查/i;

/** notes 中疑似名单条目（公司名/人名的片段）判定：非纯数字噪声、含 4+ 连续字母。 */
function looksLikeEntityName(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (!t || t.length < 4) return false;
  if (/^[\d\s.,\-:/（）()]+$/.test(t)) return false; // 纯数字/日期/金额
  return /\p{L}{4,}/u.test(t);
}

/**
 * 名单意图路由（确定性，测试友好）：若邮件明确要求名单查询/筛查（名单/道琼斯等字眼），
 * 将 persons 及 notes 中疑似名单条目的片段并入 roster，清空 persons，
 * 统一分发到 Dow Jones；companies 保持独立（走 CompanyAdapter/企查查链路），
 * 避免"企业"分区的公司被错误并入名单批量。
 */
function routeRosterIntent(entities, mailText) {
  if (!mailText || !ROSTER_INTENT_RE.test(mailText)) return entities;

  const extras = [];
  for (const p of entities.persons || []) extras.push(p.name);
  const nameLikeNotes = [];
  for (const n of entities.notes || []) {
    if (looksLikeEntityName(n)) {
      nameLikeNotes.push(n);
      extras.push(n);
    }
  }
  if (!extras.length) return entities;

  const rosters = [...(entities.rosters || [])];
  const merged = [...new Set(extras.map((s) => String(s).trim()).filter(Boolean))];
  if (rosters.length) {
    // 并入首个名单（保留原标题/类型），其余名单原样保留
    rosters[0] = { ...rosters[0], items: [...new Set([...rosters[0].items, ...merged])] };
  } else {
    rosters.push({ type: 'unknown', title: '名单筛查请求', items: merged });
  }
  logger.info('名单意图路由：person/疑似名单 notes 并入 roster，分发 Dow Jones（企业保持 CompanyAdapter）', {
    persons: entities.persons?.length,
    companies: entities.companies?.length,
    notesMerged: nameLikeNotes.length,
    rosterItems: merged.length,
  });
  return {
    ...entities,
    persons: [],
    rosters,
    notes: (entities.notes || []).filter((n) => !nameLikeNotes.includes(n)),
  };
}

/**
 * 邮件驱动管道编排核心：抽取(边界1) -> 调度查询 -> 汇总报告(边界2) -> SMTP 回信。
 * 供 CLI（src/pipeline/run.js）与守护进程（src/mail/daemon.js）复用。
 * @param {string} text 邮件正文
 * @param {object} mail 可选原邮件行 { message_id, subject, from_address, body_text }
 * @param {object} options { withReport=true, withReply=true, dryRun=false }
 * @returns {Promise<object>} { entities, queryable?, result, report, markdown, reply }
 */
async function processMail(text, mail = {}, options = {}) {
  const { withReport = true, withReply = true, dryRun = false } = options;
  const mailText = text || mail.body_text || '';
  if (!mailText) throw new Error('邮件正文为空');

  const replyTo = process.env.REPLY_TO || mail.from_address || '';
  const reportId = (mail.message_id || String(Date.now())).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  const makeSubject = (fallback) => (mail.subject ? `Re: ${mail.subject}` : fallback);

  // LLM（DeepSeek）环节失败时：不再让管道卡死，直接回邮件说明情况。
  const replyFailure = async (stage, err) => {
    if (!withReply) return null;
    const { sendReport } = require('../mail/sender');
    const markdown = [
      '# 尽调处理失败通知',
      '',
      `您的尽调请求在「${stage}」环节未能完成。`,
      '',
      `- 原因：${err.message || '未知错误'}`,
      '',
      '系统调用大模型（DeepSeek）超时或失败，请稍后重试；若持续失败，请检查 DeepSeek API Key、配额或网络。',
    ].join('\n');
    logger.error(`尽调「${stage}」失败，已回邮件说明: ${err.message}`);
    return sendReport({
      to: replyTo,
      subject: makeSubject('尽调处理失败通知'),
      markdown,
      reportId,
    });
  };

  // 大模型边界 1：信息抽取。失败则回邮件说明，不再向上抛出导致守护进程静默卡死。
  let entities;
  try {
    const entitiesRaw = await extractEntities(mailText);
    // 名单意图路由：邮件明确要求名单查询/筛查时，person/company 并入 roster 分发 Dow Jones
    entities = routeRosterIntent(entitiesRaw, mailText);
  } catch (e) {
    const failed = await replyFailure('信息抽取', e);
    return { entities: null, result: null, report: null, markdown: null, reply: failed, llmFailed: true };
  }

  if (dryRun) {
    const queryable = [
      ...entities.airWaybills.filter((e) => e.queryable),
      ...entities.containers.filter((e) => e.queryable),
      ...entities.billOfLadings.filter((e) => e.queryable),
      ...(entities.rosters || []).map((r) => ({ title: r.title, type: r.type, items: r.items })),
    ];
    return { entities, queryable, result: null, report: null, markdown: null, reply: null };
  }

  const result = await runScheduler(entities);

  let report = null;
  let markdown = null;
  let html = null;
  let reply = null;
  if (withReport) {
    // 大模型边界 2：报告汇总。失败则回邮件说明。
    try {
      const { generateReport } = require('../report/generate');
      ({ report, markdown } = await generateReport({ mailText, entities, schedulerResult: result }));
    } catch (e) {
      const failed = await replyFailure('报告生成', e);
      return { entities, result, report: null, markdown: null, html: null, reply: failed, llmFailed: true };
    }

    // 美化版 HTML（确定性 + ECharts 统计图），作为附件随邮件发送并落盘 .html
    const { renderHtml } = require('../report/html');
    html = renderHtml(report, result, markdown);

    if (withReply) {
      const { sendReport } = require('../mail/sender');
      reply = await sendReport({
        to: replyTo,
        subject: makeSubject(`货运尽调报告 ${formatBeijingTime()}`),
        markdown,
        html,
        reportId,
      });
    }
  }
  logger.info(`pipeline done | reply=${reply ? reply.sent : 'n/a'}`);
  return { entities, result, report, markdown, html, reply };
}

module.exports = { processMail };
