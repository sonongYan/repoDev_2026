require('dotenv').config();

const { isLlmConfigured } = require('../../config/llm');
const { processMail } = require('./process');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('pipeline:cli');

// 从 SQLite 取最新一封邮件（含 from/subject/message_id），作为无参数运行时的测试输入
function latestStoredMail() {
  const Database = require('better-sqlite3');
  const path = require('path');
  const { MAIL_CONFIG } = require('../../config/mail');
  const dbPath = process.env.MAIL_DB_PATH
    ? path.resolve(process.cwd(), process.env.MAIL_DB_PATH)
    : MAIL_CONFIG.dbPath;
  const db = new Database(dbPath, { readonly: true });
  try {
    return db.prepare('SELECT message_id, subject, from_address, body_text FROM messages ORDER BY processed_at DESC LIMIT 1').get() || null;
  } finally {
    db.close();
  }
}

function latestStoredMailText() {
  return latestStoredMail()?.body_text || null;
}

(async () => {
  if (!isLlmConfigured()) {
    logger.error('DEEPSEEK_API_KEY 缺失，请在 .env 配置（参考 .env.example）');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const withReport = args.includes('--report');
  const withReply = args.includes('--reply');
  const text = args.find((a) => !a.startsWith('--')) || latestStoredMailText();
  if (!text) {
    logger.error('未提供邮件正文（命令行参数或 SQLite 中无邮件）');
    process.exit(1);
  }

  logger.info(`dry-run=${dryRun} report=${withReport} reply=${withReply}`);
  try {
    const out = await processMail(text, latestStoredMail() || {}, { withReport, withReply, dryRun });

    if (dryRun) {
      console.log('== 抽取实体 ==');
      console.log(JSON.stringify(out.entities, null, 2));
      console.log('== dry-run：本应发起查询的实体 ==');
      console.log(JSON.stringify(out.queryable, null, 2));
      return;
    }

    console.log('== 查询结果 ==');
    console.log(JSON.stringify(out.result, null, 2));

    if (withReport) {
      console.log('== 结构化报告 ==');
      console.log(JSON.stringify(out.report, null, 2));
      console.log('== Markdown 报告 ==');
      console.log(out.markdown);
      if (withReply) {
        console.log('== 邮件回复 ==');
        console.log(JSON.stringify(out.reply, null, 2));
      }
    }
  } catch (e) {
    logger.error('pipeline failed', e);
    console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
    process.exit(1);
  }
})();
