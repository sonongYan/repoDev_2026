require('dotenv').config();

const { isMailConfigured, MAIL_CONFIG } = require('../../config/mail');
const { fetchUnread } = require('./watcher');
const { getDb } = require('../store/db');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('mail:cli');

(async () => {
  if (!isMailConfigured()) {
    logger.error('IMAP 配置缺失。请复制 .env.example 为 .env，并填写 IMAP_HOST / IMAP_USER / IMAP_PASS（授权码）。');
    console.error('请先配置 .env 后再运行：node src/mail/run.js');
    process.exit(1);
  }

  getDb(); // 初始化 SQLite
  logger.info(`IMAP ${MAIL_CONFIG.host}:${MAIL_CONFIG.port} TLS=${MAIL_CONFIG.tls} user=${MAIL_CONFIG.user}`);

  try {
    const results = await fetchUnread();
    const ok = results.filter((r) => r.ok).length;
    const fresh = results.filter((r) => r.new).length;
    console.log(JSON.stringify({
      success: true,
      total: results.length,
      read: ok,
      newlyStored: fresh,
      messages: results,
    }, null, 2));
    if (results.length === 0) {
      console.log('（INBOX 当前没有未读邮件）');
    }
  } catch (e) {
    logger.error('fetch unread failed', e);
    console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
    process.exit(1);
  }
})();
