const crypto = require('crypto');
const { simpleParser } = require('mailparser');

/**
 * 解析原始邮件（RFC822 buffer）为结构化对象。
 * @param {Buffer} raw IMAP 下载的原始邮件内容
 * @returns {Promise<object>} { messageId, subject, from, to, receivedAt, text, html, attachments, rawHash }
 */
async function parseMail(raw) {
  const parsed = await simpleParser(raw);
  const from = parsed.from?.text
    || parsed.from?.value?.[0]?.address
    || '';
  const to = parsed.to?.text
    || parsed.to?.value?.map((v) => v.address).join(', ')
    || '';

  return {
    // Message-ID 缺失时回退为原始内容 hash，保证去重键稳定
    messageId: parsed.messageId || sha1(raw),
    subject: parsed.subject || '',
    from,
    to,
    receivedAt: parsed.date ? parsed.date.toISOString() : null,
    text: parsed.text || '',
    html: parsed.html || '',
    attachments: (parsed.attachments || []).map((a) => ({
      filename: a.filename || '',
      contentType: a.contentType || '',
      size: a.size || 0,
    })),
    rawHash: sha1(raw),
  };
}

function sha1(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}

module.exports = { parseMail };
