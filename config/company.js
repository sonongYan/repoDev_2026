// 公司名查询 CLI 配置（qcc-agent-cli / tyc-cli 等本地命令行工具）。
// 命令模板中 {name} 会被替换为待查询的公司名；输出应为 JSON（或可读文本）。
// 未配置 COMPANY_CLI_CMD 时，公司名查询会跳过并标记 not_configured。
// 支持三条命令分别覆盖 工商基础 / 股东结构 / 司法经营风险（按企查查 qcc-agent-cli 分命令设计）。
const COMPANY_CLI = {
  enabled: !!process.env.COMPANY_CLI_CMD,
  cmd: process.env.COMPANY_CLI_CMD || '',                       // 必配：工商登记，例 "qcc company get_company_registration_info {name}"
  shareholderCmd: process.env.COMPANY_CLI_SHAREHOLDER_CMD || '', // 可选：股东结构，例 "qcc company get_shareholder_info {name}"
  riskCmd: process.env.COMPANY_CLI_RISK_CMD || '',              // 可选：司法+经营风险，例 "qcc risk get_judicial_documents {name}"
  timeoutMs: parseInt(process.env.COMPANY_CLI_TIMEOUT || '30000', 10),
  // 命令执行失败（抛异常/超时）后的额外重试次数（总尝试 = 1 + 该值），0 = 不重试
  retries: Math.max(0, parseInt(process.env.COMPANY_CLI_RETRIES ?? '1', 10) || 0),
  // 每次重试前的等待毫秒数
  retryDelayMs: Math.max(0, parseInt(process.env.COMPANY_CLI_RETRY_DELAY ?? '1000', 10) || 0),
};

module.exports = { COMPANY_CLI };
