const { ImapFlow } = require('imapflow');

const { MAIL_CONFIG } = require('../../config/mail');
const { parseMail } = require('./reader');
const { insertMessage } = require('../store/db');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('mail:watcher');

/**
 * 一次性拉取 INBOX 中所有未读邮件：
 *   fetch -> 解析 -> 先落库（Message-ID 幂等去重）-> 再标记 \Seen
 * 即使后续解析/处理失败，内容已先入库，不会被重复消费（幂等保证）。
 * @returns {Promise<Array>} 每封邮件的处理结果
 */
async function fetchUnread() {
  const client = new ImapFlow({
    host: MAIL_CONFIG.host,
    port: MAIL_CONFIG.port,
    secure: MAIL_CONFIG.tls,
    auth: { user: MAIL_CONFIG.user, pass: MAIL_CONFIG.pass },
    logger: false,
  });

  const results = [];
  await client.connect();
  logger.info(`IMAP connected: ${MAIL_CONFIG.user}@${MAIL_CONFIG.host}:${MAIL_CONFIG.port}`);

  const lock = await client.getMailboxLock('INBOX');
  try {
    const uids = await client.search({ seen: false }, { uid: true });
    logger.info(`unread count: ${uids.length}`);

    for (const uid of uids) {
      const item = { uid, ok: false, new: false, messageId: null, subject: '', from: '', matched: true, skipped: false, error: null };
      try {
        // 1. 下载原始邮件
        const fetched = await client.fetchOne(uid, { source: true }, { uid: true });
        // 2. 解析为结构化内容
        const parsed = await parseMail(fetched.source);
        item.subject = parsed.subject;
        item.from = parsed.from;
        item.messageId = parsed.messageId;

        // 2.5 主题过滤：仅主题包含 subjectFilter（不区分大小写）的邮件才处理；
        // 不匹配的邮件不落库、不标已读，保留在 INBOX 待后续处理。
        const filter = String(MAIL_CONFIG.subjectFilter || '');
        const matched = !filter || String(parsed.subject || '').toLowerCase().includes(filter.toLowerCase());
        item.matched = matched;
        if (!matched) {
          item.ok = true;
          item.skipped = true;
          logger.info(`skip (subject not matched "${filter}"): uid=${uid} subject="${parsed.subject}"`);
          results.push(item);
          continue;
        }

        // 3. 先落库（幂等：重复 Message-ID 自动跳过）
        item.new = insertMessage(parsed);
        // 4. 读取完成后立即标记已读
        await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
        item.ok = true;
        logger.info(`read+seen: uid=${uid} messageId=${parsed.messageId} subject="${parsed.subject}"`);
      } catch (e) {
        item.error = e.message;
        logger.error(`process failed: uid=${uid}`, e.message);
      }
      results.push(item);
    }
  } finally {
    lock.release();
  }

  await client.logout();
  return results;
}

module.exports = { fetchUnread };
