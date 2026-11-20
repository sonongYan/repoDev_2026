'use strict';

const BaseAdapter = require('./base');
const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { waitForText, getLatestPage } = require('../core/browser');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseAirWaybill, parseKlmAirWaybill } = require('../parsers/aircargo');

function escapeRe(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 经 Track-Trace Air Cargo 板块查询空运单的通用适配器。
// 入口、表单、提交按钮、承运商列表、AFKL 二次输入、结果关键词全部来自 config/recipes/klm_aircargo.json；
// 本类只保留分支流程（新标签页捕获、二次提交、frame 文本选取）。
class AirCargoBasedAdapter extends RecipeAdapter {
  constructor(carrierName, recipeId, opts = {}) {
    super(carrierName, recipeId, { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
    this._eventKeywords = opts.eventKeywords || undefined;
    this._airlineName = opts.airlineName || carrierName;
    this._airlineLabel = opts.airlineLabel || this.recipe.flow?.airlineLabel || null;
  }

  get flow() {
    return this.recipe.flow || {};
  }

  _keywordRe(keywords = []) {
    if (!keywords.length) return null;
    return new RegExp(keywords.map(escapeRe).join('|'), 'i');
  }

  async _goThroughAirCargo(query, options) {
    const recipe = this.recipe;
    const values = runner.buildValues({ number: query }, recipe.valueFormats);

    let opened;
    try {
      opened = await this.openPage(options, recipe.entry.url);
    } catch (e) {
      return { ok: false, error: e.message };
    }

    const { browser, context, page } = opened;
    try {
      this.logger.info(`Track-Trace AirCargo: 查询 AWB=${values.number}`);

      await runner.dismissPopups(page, recipe.popups);
      await page.locator('#coiOverlay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

      // Track direct 会把结果开到航司官网（新标签页）；新标签页用 waitForEvent('page') 可靠捕获
      const nextPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
      await runner.runSteps(page, recipe.steps, values, {
        onStep: (entry) => this.logger.debug(
          `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || 'ok'}`
        ),
      });
      const popup = await nextPagePromise;
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(this.flow.afterSubmitSettleMs || 4000);

      let workPage = popup || (await getLatestPage(context, page, { waitAfter: this.flow.landingSettleMs || 3000 }));
      await workPage.waitForLoadState('networkidle').catch(() => {});

      // track-trace 可能先停在「Select company」，需点选航司才会跳转官网
      const list = this.flow.carrierList || {};
      if (this._airlineLabel && list.tabText) {
        const companyTab = workPage.getByText(list.tabText, { exact: false }).first();
        if (await companyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await companyTab.click({ force: true });
          await workPage.waitForTimeout(1500);
          const airBtn = workPage.locator(list.itemCss || 'div.js-link').filter({ hasText: this._airlineLabel }).first();
          if (await airBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await airBtn.scrollIntoViewIfNeeded().catch(() => {});
            await airBtn.click({ force: true });
            await workPage.waitForTimeout(list.settleMs || 5000);
          }
        }
      }

      // AFKL myCargo 官网需要在页面上二次输入运单号并点「追踪」
      const second = this.flow.secondStage || {};
      let submitted = false;
      if (second.awbPlaceholders?.length) {
        const awbInput = workPage.locator(
          second.awbPlaceholders.map((p) => `input[placeholder^="${p}"]`).join(', ')
        ).first();
        const awbVisible = await awbInput.isVisible({ timeout: 4000 }).catch(() => false);
        if (awbVisible) {
          await awbInput.scrollIntoViewIfNeeded().catch(() => {});
          await awbInput.click({ force: true });
          await awbInput.fill('');
          await awbInput.fill(values.number);
          await workPage.waitForTimeout(800);

          const trackButton = workPage
            .locator('button[type=submit]')
            .filter({ hasText: new RegExp(`^${escapeRe(second.trackButtonText || '')}$`) })
            .first();
          const btnVisible = await trackButton.isVisible({ timeout: 3000 }).catch(() => false);
          if (btnVisible) {
            await trackButton.click({ force: true }).catch(() => awbInput.press('Enter'));
          } else {
            await awbInput.press('Enter');
          }
          submitted = true;
          await workPage.waitForLoadState('networkidle').catch(() => {});
          await workPage.waitForTimeout(second.settleMs || 12000);
        }
      }

      // 等结果：track-trace 自身结果区常渲染在 iframe 中，waitForText 会遍历所有 frame 取命中文本
      const waitCfg = recipe.result.wait || {};
      const intervalMs = waitCfg.intervalMs || 2000;
      const maxAttempts = Math.max(1, Math.ceil((waitCfg.timeoutMs || 45000) / intervalMs));
      const keywords = recipe.result.domFallback?.successKeywords || [];
      const found = await waitForText(workPage, keywords, { maxAttempts, intervalMs });
      const bodyTxt = found.text || (await workPage.locator('body').innerText().catch(() => ''));

      if (!found.text) {
        const noDataRe = this._keywordRe(recipe.result.domFallback?.noDataKeywords);
        if (!bodyTxt.trim() || (noDataRe && noDataRe.test(bodyTxt))) {
          return {
            ok: false,
            url: workPage.url(),
            error: submitted ? 'AFKL 未找到该空运单结果' : 'Track-Trace 未找到该空运单结果',
            workPage: null,
          };
        }
        return { ok: true, workPage, rawText: bodyTxt, source: 'body', noData: submitted };
      }

      return { ok: true, workPage, rawText: found.text, source: found.source };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      await browser.close();
    }
  }

  async trackAirWaybill(query, options = {}) {
    const res = await this._goThroughAirCargo(query, options);
    if (!res.ok) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        error: res.error,
        url: res.url,
      });
    }
    const data = parseAirWaybill(res.rawText, query, {
      eventKeywords: this._eventKeywords,
      airline: this._airlineName,
    });
    this.logger.info(`完成 ${this.carrier} 空运单查询`);
    const hasResult = !res.noData && !!res.rawText;
    return this.buildResult({
      success: hasResult,
      queryType: QUERY_TYPES.AIR_WAYBILL,
      query,
      hasResult,
      url: res.workPage.url(),
      title: await res.workPage.title().catch(() => null),
      data,
      rawText: res.rawText,
    });
  }
}

class KlmAirWaybillAdapter extends AirCargoBasedAdapter {
  constructor() {
    super(CARRIERS.KLM, 'klm_aircargo', { airlineName: 'KLM Royal Dutch Airlines' });
  }

  async trackAirWaybill(query, options = {}) {
    const res = await this._goThroughAirCargo(query, options);
    if (!res.ok) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        error: res.error,
        url: res.url,
      });
    }
    const data = parseKlmAirWaybill(res.rawText, query);
    this.logger.info(`完成 KLM 空运单查询`);
    const hasResult = !res.noData && !!res.rawText;
    return this.buildResult({
      success: hasResult,
      queryType: QUERY_TYPES.AIR_WAYBILL,
      query,
      hasResult,
      url: res.workPage.url(),
      title: await res.workPage.title().catch(() => null),
      data,
      rawText: res.rawText,
    });
  }
}

// China Cargo Airlines (CK, 前缀 112)
// 已迁移到独立直连适配器 adapters/china_cargo.js
// 官网 eal-ceair.com 直连，用 ddddocr 识别验证码

// Qatar Airways Cargo (QR, 前缀 157)
// 已迁移到独立直连适配器 adapters/qatar.js，目标 URL：qrcargo.com 官网

// Shandong Airlines (SC, 前缀 324)
// 山航无独立货运追踪页，track-trace 未收录 324 前缀；客机腹舱货运业务由国货航代理。
// 此适配器为占位实现，明确提示用户走人工查询渠道，避免误以为系统可在线追踪。
class ShandongAirWaybillAdapter extends BaseAdapter {
  constructor() {
    super(CARRIERS.SHANDONG, { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
  }

  async trackAirWaybill(query, _options = {}) {
    return this.buildResult({
      queryType: QUERY_TYPES.AIR_WAYBILL,
      query,
      error:
        '[Shandong Airlines] 暂无公开在线追踪渠道：山航官网无货运追踪页、track-trace 未收录 324 前缀；' +
        '客机腹舱货运由国货航代理（国货航系统仅识别 999 前缀）。请致电 10100999（国货航）或 95369（山航）人工查询。',
    });
  }
}

module.exports = {
  AirCargoBasedAdapter,
  KlmAirWaybillAdapter,
  ShandongAirWaybillAdapter,
};
