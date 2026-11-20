const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { marked } = require('marked');

const { SMTP_CONFIG } = require('../../config/mail');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('mail:sender');
const REPORT_DIR = path.join(process.cwd(), 'reports');

function isSmtpConfigured() {
  return !!(SMTP_CONFIG.host && SMTP_CONFIG.user && SMTP_CONFIG.pass);
}

/**
 * 尽调报告落盘（Markdown 留档），返回文件路径。
 */
function saveReport(markdown, reportId) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, `${reportId}.md`);
  fs.writeFileSync(file, markdown, 'utf8');
  return file;
}

/**
 * 美化版 HTML 报告落盘，返回文件路径（无 html 时返回 null）。
 */
function saveHtml(html, reportId) {
  if (!html) return null;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, `${reportId}.html`);
  fs.writeFileSync(file, html, 'utf8');
  return file;
}

/**
 * 通过 SMTP 发送尽调报告（回复原发件人）。
 * SMTP 未配置时不发送，仅落盘并返回 error 标记（不阻断管道）。
 * @param {object} opts { to, subject, markdown, html?, reportId }
 * @returns {Promise<object>} { sent, savedPath, htmlPath?, error? }
 */
async function sendReport({ to, subject, markdown, html, reportId }) {
  const savedPath = saveReport(markdown, reportId);
  const htmlPath = saveHtml(html, reportId);
  if (!isSmtpConfigured()) {
    logger.warn('SMTP 未配置，报告仅落盘', savedPath);
    return { sent: false, savedPath, htmlPath, error: 'SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)' };
  }
  if (!to) {
    logger.warn('无收件地址，报告仅落盘', savedPath);
    return { sent: false, savedPath, htmlPath, error: 'no recipient' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.tls,
    auth: { user: SMTP_CONFIG.user, pass: SMTP_CONFIG.pass },
  });

  const attachments = htmlPath
    ? [{ filename: `${reportId}.html`, path: htmlPath, contentType: 'text/html' }]
    : [];

  await transporter.sendMail({
    from: `"尽调报告机器人" <${SMTP_CONFIG.user}>`,
    to,
    subject,
    text: markdown, // 纯文本降级（不支持 HTML 的客户端）
    html: marked.parse(markdown), // HTML 正文：表格/标题按 .md 渲染效果展示
    attachments, // 完整美化版 HTML（含统计图）作为附件
  });
  logger.info(`report sent to ${to} | ${savedPath}` + (htmlPath ? ` | ${htmlPath}` : ''));
  return { sent: true, savedPath, htmlPath };
}

module.exports = { sendReport, saveReport, saveHtml, isSmtpConfigured };
