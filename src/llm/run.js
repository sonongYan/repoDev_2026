require('dotenv').config();

const { isLlmConfigured, LLM_CONFIG } = require('../../config/llm');
const { extractEntities } = require('./extract');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('llm:cli');

// 从 SQLite 取最新一封邮件正文，作为无参数运行时的测试输入
function latestStoredMailText() {
  const Database = require('better-sqlite3');
  const path = require('path');
  const { MAIL_CONFIG } = require('../../config/mail');
  const dbPath = process.env.MAIL_DB_PATH
    ? path.resolve(process.cwd(), process.env.MAIL_DB_PATH)
    : MAIL_CONFIG.dbPath;
  const db = new Database(dbPath, { readonly: true });
  try {
    const row = db.prepare('SELECT body_text FROM messages ORDER BY processed_at DESC LIMIT 1').get();
    return row?.body_text || null;
  } finally {
    db.close();
  }
}

(async () => {
  if (!isLlmConfigured()) {
    logger.error('DEEPSEEK_API_KEY 缺失。请在 .env 中配置（参考 .env.example 的 大模型 DeepSeek 段）。');
    console.error('配置 DeepSeek API Key 后运行：npm run llm:run "邮件正文"');
    process.exit(1);
  }

  const text = process.argv[2] || latestStoredMailText();
  if (!text) {
    logger.error('未提供邮件正文（命令行参数或 SQLite 中无邮件）');
    process.exit(1);
  }

  logger.info(`model=${LLM_CONFIG.model} base=${LLM_CONFIG.baseUrl}`);
  logger.info('输入文本', text.slice(0, 120));

  try {
    const result = await extractEntities(text);
    console.log(JSON.stringify({ success: true, ...result }, null, 2));
  } catch (e) {
    logger.error('抽取失败', e.message);
    console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
    process.exit(1);
  }
})();
