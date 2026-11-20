const { LLM_CONFIG } = require('../../config/llm');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('llm:client');

// 可重试的 HTTP 状态码：限流/临时故障/网关错误；4xx（鉴权、参数）重试无意义
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * LLM 调用失败专用错误，供上层识别「模型调用失败需回邮件说明」的场景。
 */
class LlmError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'LlmError';
    this.cause = cause;
  }
}

/**
 * 调用 DeepSeek chat/completions（OpenAI 兼容接口，Node 原生 fetch）。
 * 带超时（覆盖响应体读取）与可重试失败的重试；重试耗尽后抛 LlmError。
 * @param {Array} messages [{ role: 'system'|'user'|'assistant', content }]
 * @param {object} options { json: boolean, temperature: number, timeoutMs?, maxRetries? }
 * @returns {Promise<string>} 模型回复文本
 */
async function chatCompletion(messages, options = {}) {
  const { json = false, temperature } = options;
  const timeoutMs = options.timeoutMs ?? LLM_CONFIG.timeoutMs;
  const maxRetries = options.maxRetries ?? LLM_CONFIG.maxRetries;
  const url = `${LLM_CONFIG.baseUrl}/chat/completions`;

  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: LLM_CONFIG.model,
          messages,
          temperature: temperature ?? LLM_CONFIG.temperature,
          stream: false,
          // DeepSeek JSON mode：要求 prompt 中出现 "json" 字样
          response_format: json ? { type: 'json_object' } : undefined,
        }),
        signal: controller.signal, // 同时约束响应头与响应体（body 挂起也会被 abort）
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const msg = `DeepSeek API ${res.status}: ${body.slice(0, 300)}`;
        // 4xx（鉴权/参数）立即抛，不重试
        if (!RETRYABLE_STATUS.has(res.status)) {
          throw new LlmError(msg);
        }
        lastErr = new Error(msg);
      } else {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        if (!content) {
          logger.error('LLM 返回空内容', data);
          throw new LlmError('DeepSeek 返回空内容');
        }
        return content;
      }
    } catch (e) {
      if (e instanceof LlmError) throw e; // 非可重试错误直接抛给上层
      lastErr = controller.signal.aborted
        ? new Error(`DeepSeek 调用超时（${timeoutMs}ms）`)
        : e;
    } finally {
      clearTimeout(timer);
    }

    if (attempt < maxRetries) {
      logger.warn(`LLM 调用失败，重试 ${attempt + 1}/${maxRetries}: ${lastErr?.message || '未知错误'}`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new LlmError(
    `DeepSeek 调用失败（已重试 ${maxRetries} 次）：${lastErr?.message || '未知错误'}`,
    lastErr
  );
}

/**
 * JSON mode 便捷封装：返回解析后的对象。
 */
async function chatJSON(system, user, options = {}) {
  const content = await chatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { ...options, json: true }
  );
  try {
    return JSON.parse(content);
  } catch (e) {
    logger.error('LLM 返回非合法 JSON', content.slice(0, 500));
    throw new LlmError('LLM 返回非合法 JSON', e);
  }
}

module.exports = { chatCompletion, chatJSON, LlmError };