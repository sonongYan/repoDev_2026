// 大模型（DeepSeek）配置：读取环境变量，凭据走 .env，不硬编码。
const LLM_CONFIG = {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  temperature: 0.1, // 抽取/汇总追求稳定，低温
  // 单次请求（含响应体读取）超时；DeepSeek 偶发「200 + body 流挂起」，无超时会让管道永久卡死
  timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '60000', 10),
  // 超时/网络/5xx 类失败后的重试次数（额外次数，即总尝试 = 1 + maxRetries）
  maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '1', 10),
};

function isLlmConfigured() {
  return !!LLM_CONFIG.apiKey;
}

module.exports = { LLM_CONFIG, isLlmConfigured };
