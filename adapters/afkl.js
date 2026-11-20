'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseAfklShipment } = require('../parsers/afkl');

// AF KLM Cargo 官网直连适配器（IATA 074/057）。
// 页面事实（入口、Angular 初始化等待、textarea 选择器、提交方式、tnt-api 判定）全部来自
// config/recipes/afkl.json；本类只保留流程与解析器调用。
//
// 接口约定（来自前端代码）：200 = JSON 明细数组；412/404 = 无此单信息。
class AfklAirWaybillAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.AFKL, 'afkl', { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
  }

  async trackAirWaybill(query, options = {}) {
    const recipe = this.recipe;
    const values = this.buildValues(query);
    const reportUrl = this.buildReportUrl(values);

    let opened;
    try {
      opened = await this.openPage(options, recipe.entry.url);
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        url: reportUrl,
        error: `AFKL 入口页打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    const xhr = runner.attachXhrWatcher(page, recipe.result?.xhr);
    try {
      this.logger.info(`AFKL 官网直连: 查询 AWB=${values.numberDash} (recipe v${recipe.version})`);

      await runner.runSteps(page, recipe.steps, values, {
        onStep: (entry) => this.logger.debug(
          `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || 'ok'}`
        ),
      }).then((trace) => { this._lastTrace = trace; });

      // 首次等 45s；未捕获到 tnt-api 时按配方重填并回车再等一次
      const outcome = await this.waitResult(page, xhr, values);

      if (outcome.kind === 'notfound') {
        this.logger.info(`AFKL tnt-api 响应: HTTP ${outcome.status}（无此单信息）`);
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: reportUrl,
          error: `AFKL 未找到该空运单信息 (HTTP ${outcome.status})`,
        });
      }
      if (outcome.kind === 'error') {
        this.logger.warn(`AFKL 接口异常: ${outcome.error}`);
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: reportUrl,
          error: `AFKL 查询失败：${outcome.error}`,
        });
      }
      if (outcome.kind !== 'xhr') {
        this.logger.warn('AFKL 未捕获到 tnt-api 响应');
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: reportUrl,
          error: 'AFKL 查询超时：未捕获到 tnt-api 响应',
        });
      }

      this.logger.info(`AFKL tnt-api 响应: HTTP ${xhr.status}`);
      const json = outcome.payload;
      if (!json || (Array.isArray(json) && !json.length)) {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: reportUrl,
          error: 'AFKL 返回了空的查询结果',
        });
      }

      const data = parseAfklShipment(json, values.numberDash);
      this.logger.info(`完成 ${this.carrier} 空运单查询（tnt-api JSON 解析）`);
      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        hasResult: true,
        url: reportUrl,
        title: 'myCargo',
        data,
        rawText: JSON.stringify(json),
      });
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        url: reportUrl,
        error: e.message,
      });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = AfklAirWaybillAdapter;
