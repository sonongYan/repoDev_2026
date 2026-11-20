const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const { MAIL_CONFIG } = require('../../config/mail');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('store:db');

let db = null;

function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(MAIL_CONFIG.dbPath), { recursive: true });
  db = new Database(MAIL_CONFIG.dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id      TEXT PRIMARY KEY,     -- Message-ID（缺失时回退为正文 hash），幂等去重键
      subject         TEXT,
      from_address    TEXT,
      received_at     TEXT,
      body_text       TEXT,
      body_html       TEXT,
      attachments_json TEXT,
      raw_hash        TEXT,                 -- 原始邮件内容 sha1，用于溯源与查重
      processed_at    TEXT                  -- 入库时间（处理失败也保留，保证不重复消费）
    );
    CREATE INDEX IF NOT EXISTS idx_messages_processed_at ON messages(processed_at);
  `);
  logger.info(`SQLite ready: ${MAIL_CONFIG.dbPath}`);
  return db;
}

const INSERT_STMT = () =>
  getDb().prepare(`
    INSERT OR IGNORE INTO messages
      (message_id, subject, from_address, received_at, body_text, body_html, attachments_json, raw_hash, processed_at)
    VALUES
      (@messageId, @subject, @fromAddress, @receivedAt, @bodyText, @bodyHtml, @attachmentsJson, @rawHash, @processedAt)
  `);

/**
 * 幂等入库：message_id 已存在则跳过。
 * @param {object} msg 结构化邮件（见 src/mail/reader.js parseMail）
 * @returns {boolean} true=首次入库，false=重复邮件
 */
function insertMessage(msg) {
  const info = INSERT_STMT().run({
    messageId: msg.messageId,
    subject: msg.subject,
    fromAddress: msg.from,
    receivedAt: msg.receivedAt,
    bodyText: msg.text,
    bodyHtml: msg.html,
    attachmentsJson: JSON.stringify(msg.attachments || []),
    rawHash: msg.rawHash,
    processedAt: new Date().toISOString(),
  });
  const isNew = info.changes === 1;
  if (isNew) logger.info(`message stored: ${msg.messageId} | ${msg.subject}`);
  else logger.debug(`duplicate skipped: ${msg.messageId}`);
  return isNew;
}

function hasMessage(messageId) {
  const row = getDb().prepare('SELECT 1 FROM messages WHERE message_id = ?').get(messageId);
  return !!row;
}

function getMessage(messageId) {
  return (
    getDb()
      .prepare('SELECT message_id, subject, from_address, body_text FROM messages WHERE message_id = ?')
      .get(messageId) || null
  );
}

module.exports = { getDb, insertMessage, hasMessage, getMessage };
