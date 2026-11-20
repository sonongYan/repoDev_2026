const path = require('path');

// 邮件接入层配置：从环境变量读取 IMAP 连接信息，凭据一律走 .env，不硬编码。
const MAIL_CONFIG = {
  host: process.env.IMAP_HOST || '',
  port: parseInt(process.env.IMAP_PORT || '993', 10),
  user: process.env.IMAP_USER || '',
  pass: process.env.IMAP_PASS || '',
  tls: String(process.env.IMAP_TLS || 'true').toLowerCase() === 'true',
  // 主题过滤：仅处理主题包含该字段（不区分大小写）的未读邮件；设空串=不过滤
  subjectFilter: process.env.MAIL_SUBJECT_FILTER || 'Due Diligence',
  // SQLite 邮件去重库路径（相对项目根目录）
  dbPath: process.env.MAIL_DB_PATH
    ? path.resolve(process.cwd(), process.env.MAIL_DB_PATH)
    : path.join(process.cwd(), 'data', 'mail.db'),
};

// SMTP 发送配置：163/QQ 的 SMTP 账号与授权码同 IMAP，默认复用；
// 需自定义时在 .env 用 SMTP_HOST/SMTP_USER/SMTP_PASS 覆盖。
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  user: process.env.SMTP_USER || process.env.IMAP_USER || '',
  pass: process.env.SMTP_PASS || process.env.IMAP_PASS || '',
  tls: String(process.env.SMTP_TLS || 'true').toLowerCase() === 'true',
};

// 校验关键配置是否已填齐（用于 CLI 启动前提示用户补全 .env）
function isMailConfigured() {
  return !!(MAIL_CONFIG.host && MAIL_CONFIG.user && MAIL_CONFIG.pass);
}

module.exports = {
  MAIL_CONFIG,
  SMTP_CONFIG,
  isMailConfigured,
};
