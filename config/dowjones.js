// Dow Jones RiskCenter（名单筛查：制裁 / PEP / 高风险人物·实体）。
// 该站为付费订阅服务，需通过 Dow Jones SSO 登录后方可搜索（探测确认：未登录访问
// /search/simple 会被 OAuth 重定向至 sso.accounts.dowjones.com，无 Cloudflare 反爬）。
// 凭据经 .env 提供；未配置时适配器返回 requires_login（不假装可查）。

const DOWJONES_CONFIG = {
  enabled: Boolean(process.env.DOWJONES_USER && process.env.DOWJONES_PASS),
  user: process.env.DOWJONES_USER || '',
  pass: process.env.DOWJONES_PASS || '',
  entryUrl: 'https://riskcenter.dowjones.com/search/simple',
  ssoLoginUrl: 'https://sso.accounts.dowjones.com/login-page',
};

module.exports = { DOWJONES_CONFIG };
