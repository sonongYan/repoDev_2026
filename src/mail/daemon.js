require('dotenv').config();

const { ImapFlow } = require('imapflow');

const { MAIL_CONFIG } = require('../../config/mail');
const { fetchUnread } = require('./watcher');
const { getMessage } = require('../store/db');
const { processMail } = require('../pipeline/process');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('mail:daemon');

const POLL_MS = parseInt(process.env.DAEMON_POLL_MS || '60000', 10); // 轮询兜底间隔
let stopping = false;
let processing = false; // 串行锁：同一时间只允许一个 handleNewMail 在处理，防 IDLE/定时器并发重叠

/**
 * 拉取未读 -> 落库标已读（幂等）-> 对新入库邮件跑完整管道并回信。
 * 多封邮件严格串行：一封走完（含回信）才处理下一封；并发触发时直接跳过，
 * 由下一轮轮询兜底补收。
 */
async function handleNewMail(client) {
  if (processing) return;
  processing = true;
  try {
    const items = await fetchUnread();
    // 处理所有「未读 + 主题匹配」的邮件，而非仅「首次入库」的邮件：
    // 若一封邮件在更早的运行中已入库但尚未被处理（幂等去重使 insertMessage 返回 false），
    // 仍必须进入处理管道，否则会被永久漏掉（入库了却永不处理、永不回信）。
    const fresh = items.filter((i) => i.ok && i.matched && !i.skipped);
    if (!fresh.length) return;
    logger.info(`new mails to process: ${fresh.length}`);
    for (const item of fresh) {
      const row = getMessage(item.messageId);
      if (!row) continue;
      logger.info(`process: ${item.messageId} subject="${row.subject}"`);
      try {
        const out = await processMail(row.body_text, row, { withReport: true, withReply: true });
        logger.info(`done: ${item.messageId} reply_sent=${out.reply?.sent}`);
      } catch (e) {
        // 已落库+已标已读，幂等保证不会重复消费；此处仅记录
        logger.error(`mail process failed: ${item.messageId}`, e.message);
      }
    }
  } catch (e) {
    logger.error('handleNewMail failed', e.message);
  } finally {
    processing = false;
  }
}

async function run() {
  const once = process.argv.includes('--once');

  const client = new ImapFlow({
    host: MAIL_CONFIG.host,
    port: MAIL_CONFIG.port,
    secure: MAIL_CONFIG.tls,
    auth: { user: MAIL_CONFIG.user, pass: MAIL_CONFIG.pass },
    logger: false,
  });
  // 处理邮件期间浏览器查询耗时长，QQ/企业邮箱 IMAP 空闲会主动断开（ECONNRESET），
  // 未捕获会直接拖崩进程；此处吞掉连接错误，处理流程用到的抓取/回信走独立连接，不受影响。
  client.on('error', (e) => logger.warn('imap connection error (ignored)', e.message));
  await client.connect();
  await client.mailboxOpen('INBOX');
  logger.info(`INBOX listening: ${MAIL_CONFIG.user}@${MAIL_CONFIG.host}:${MAIL_CONFIG.port}`);

  // 启动即处理存量未读
  await handleNewMail(client);
  if (once) {
    try { await client.logout(); } catch (e) { logger.warn('imap logout failed', e.message); }
    console.log('daemon --once done');
    return;
  }

  // IDLE 实时唤醒 + 定时轮询兜底（防事件丢失/连接漂移）
  client.on('exists', () => setImmediate(() => handleNewMail(client).catch((e) => logger.error(e.message))));
  const timer = setInterval(() => handleNewMail(client).catch((e) => logger.error(e.message)), POLL_MS);

  const shutdown = () => {
    stopping = true;
    clearInterval(timer);
    client.logout().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (!stopping) {
    try {
      await client.idle(); // 阻塞直到 IDLE 被新邮件事件唤醒
    } catch (e) {
      logger.warn('idle ended', e.message);
      try {
        await client.connect();
        await client.mailboxOpen('INBOX');
        logger.info('reconnected');
      } catch (e2) {
        logger.error('reconnect failed', e2.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

if (require.main === module) {
  run().catch((e) => {
    logger.error('daemon fatal', e);
    process.exit(1);
  });
}

module.exports = { handleNewMail };
