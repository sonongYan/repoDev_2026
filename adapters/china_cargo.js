'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseChinaCargoShipment, parseChinaCargoJson } = require('../parsers/china_cargo');
const { spawnSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const OCR_SCRIPT = path.join(__dirname, '..', 'utils', 'ocr_captcha.py');

// 东航物流（China Cargo Airlines, CK, 前缀 112）官网直连适配器。
// 页面事实（入口 URL / 验证码图片 / 输入框 / 提交方式 / 结果判定）全部来自
// config/recipes/china_cargo.json，站点改版时只改配方，不改本文件。
//
// 流程要点：
//   1. 运单号通过 URL 预填（waybillNum 参数），步骤中禁止再填——任何 input 事件都会刷新验证码
//   2. 截图验证码 → ddddocr 识别 → 填入 → 调用页面全局函数 WaybillQueryData 提交
//   3. 成功判定优先 /eos/awb/ 接口 JSON（前端渲染可能因 /flight/airport 异常而卡住），DOM 仅兜底
class ChinaCargoAirWaybillAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.CHINA_CARGO, 'china_cargo', {
      supportedTypes: [QUERY_TYPES.AIR_WAYBILL],
    });
    this._lastTrace = null;
  }

  // 用 ddddocr（Python 库）识别验证码；tesseract.js 识别率为 0，故不使用
  async _ocrCaptcha(imageBuffer) {
    const tmpPath = path.join(os.tmpdir(), `captcha-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, imageBuffer);
    try {
      const result = spawnSync('python', [OCR_SCRIPT, tmpPath], {
        encoding: 'utf8',
        timeout: 30000,
        windowsHide: true,
      });
      if (result.error) {
        this.logger.error(`ddddocr 调用失败: ${result.error.message}`);
        return '';
      }
      if (result.status !== 0) {
        this.logger.error(`ddddocr 退出码 ${result.status}: ${result.stderr || ''}`);
        return '';
      }
      const text = (result.stdout || '').trim();
      const captchaStep = (this.recipe.steps || []).find(s => s.action === 'captcha');
      const expected = captchaStep?.length || 6;
      const numMatch = text.match(new RegExp(`\\d{${expected}}`));
      return numMatch ? numMatch[0] : text;
    } finally {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  }

  // 截取验证码图片并 OCR；定位器全部失效时返回空串，由调用方刷新重试
  async _grabCaptcha(page) {
    const imageSpec = this.recipe.captcha?.image;
    if (!imageSpec) return '';
    const hit = await runner.resolveLocator(page, imageSpec, { timeoutMs: 5000 });
    if (!hit.locator) {
      this.logger.warn(`验证码图片定位失败: ${hit.attempts.join(' / ')}`);
      return '';
    }
    const buffer = await hit.locator.screenshot({ type: 'png' }).catch(() => null);
    if (!buffer) return '';
    const text = await this._ocrCaptcha(buffer);
    this.logger.info(`China Cargo 验证码 OCR: "${text}" (size=${buffer.length} bytes)`);
    return text;
  }

  _describeFailure(err) {
    const trace = err.trace || this._lastTrace || [];
    if (!trace.length) return err.message;
    const steps = trace.map(t => `${t.index}:${t.action}${t.ok ? '✓' : '✗'}`).join(' ');
    return `${err.message} | 步骤: ${steps}`;
  }

  async trackAirWaybill(query, options = {}) {
    const recipe = this.recipe;
    const values = this.buildValues(query);
    const url = this.buildUrl(values);
    const maxAttempts = recipe.captcha?.maxAttempts || 5;

    let opened;
    try {
      opened = await this.openPage(options, url);
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        url,
        error: `China Cargo 入口页打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    const xhr = runner.attachXhrWatcher(page, recipe.result?.xhr);

    try {
      this.logger.info(`China Cargo 官网直连: 查询 AWB=${values.number} (recipe v${recipe.version})`);

      let success = false;
      let lastError = null;
      let resultPath = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        xhr.payload = null;
        xhr.data = null;
        xhr.error = null;

        try {
          this._lastTrace = await runner.runSteps(page, recipe.steps, values, {
            onCaptcha: async () => {
              const text = await this._grabCaptcha(page);
              if (!text) throw new Error('验证码定位或识别失败');
              return text;
            },
            onStep: (entry) => this.logger.debug(
              `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || 'ok'}`
            ),
          });
        } catch (e) {
          lastError = this._describeFailure(e);
          this.logger.warn(`China Cargo 第 ${attempt} 次提交失败: ${lastError}`);
          await this.refreshCaptcha(page);
          continue;
        }

        const outcome = await runner.waitForResult(page, recipe.result, xhr);

        if (outcome.kind === 'xhr') {
          const rows = Array.isArray(outcome.data) ? outcome.data : [];
          if (rows.length) {
            success = true;
            resultPath = 'xhr';
            this.logger.info(`China Cargo 接口查询成功（${rows.length} 条数据）`);
          } else {
            lastError = '该运单在官网无查询数据';
          }
          // 接口已给出明确答复，不再重试
          break;
        }

        if (outcome.kind === 'error') {
          lastError = outcome.error;
          this.logger.info(`China Cargo 第 ${attempt} 次尝试失败：${lastError}，刷新换验证码`);
          await this.refreshCaptcha(page);
          continue;
        }

        if (outcome.kind === 'dom') {
          success = true;
          resultPath = 'dom';
          break;
        }

        const noData = outcome.dom?.kind === 'nodata';
        lastError = noData ? '验证码识别失败或单号不存在' : '结果区未渲染且未捕获到查询接口响应';
        this.logger.info(`China Cargo 第 ${attempt} 次尝试失败（noData=${noData}），刷新换验证码`);
        await this.refreshCaptcha(page);
      }

      if (!success) {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url,
          error: `China Cargo 查询失败：${lastError || '验证码识别 5 次未通过'}`,
        });
      }

      if (resultPath === 'xhr') {
        const data = parseChinaCargoJson(xhr.data, values.number);
        this.logger.info(`完成 ${this.carrier} 空运单查询（接口 JSON 解析）`);
        return this.buildResult({
          success: true,
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          hasResult: true,
          url: xhr.matchedUrl || url,
          title: await page.title().catch(() => null),
          data,
          rawText: JSON.stringify(xhr.data),
        });
      }

      // DOM 兜底：接口未捕获时按页面文本解析
      await page.waitForTimeout(recipe.result?.domFallback?.settleMs || 3000);
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const data = parseChinaCargoShipment(bodyText, values.number);
      this.logger.info(`完成 ${this.carrier} 空运单查询（DOM 兜底解析）`);

      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        hasResult: true,
        url,
        title: await page.title().catch(() => null),
        data,
        rawText: bodyText,
      });
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        url,
        error: e.message,
      });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = ChinaCargoAirWaybillAdapter;
