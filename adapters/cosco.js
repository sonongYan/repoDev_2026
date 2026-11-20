'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseCoscoContainer, parseCoscoBillOfLading } = require('../parsers/cosco');

// COSCO eBusiness 官网直连（箱号 / 提单号共用同一查询表单）。
// 入口、Cookie 弹窗、下拉选项、输入框、结果关键词全部来自 config/recipes/cosco.json 与 cosco_bl.json，
// 两份配方仅「查询类型下拉项 + 输入框 placeholder」不同，站点改版时可直接 diff 出变更点。
class CoscoAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.COSCO, 'cosco', {
      supportedTypes: [QUERY_TYPES.CONTAINER, QUERY_TYPES.BILL_OF_LADING],
    });
    this.blRecipe = runner.loadRecipe('cosco_bl');
  }

  async _trackConsignment({ value, queryType, recipe, logName, parseFn, options = {} }) {
    const values = runner.buildValues({ number: value }, recipe.valueFormats);
    const url = recipe.entry.url;

    let opened;
    try {
      opened = await this.openPage(options, url, recipe);
    } catch (e) {
      return this.buildResult({
        queryType,
        query: value,
        url,
        error: `COSCO 官网打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    try {
      this.logger.info(`COSCO 官网直连: 查询${logName}=${values.number} (recipe ${recipe.queryType} v${recipe.version})`);
      await runner.dismissPopups(page, recipe.popups);

      const trace = await runner.runSteps(page, recipe.steps, values, {
        onStep: (entry) => this.logger.debug(
          `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || (entry.skipped ? 'skipped' : 'ok')}`
        ),
      });
      this._lastTrace = trace;

      const outcome = await runner.waitForResult(page, recipe.result, {
        payload: null,
        error: null,
        data: null,
      });
      if (outcome.kind === 'nodata') {
        return this.buildResult({
          queryType,
          query: value,
          url: page.url(),
          error: `COSCO 未找到该${logName}的查询结果`,
        });
      }
      if (outcome.kind !== 'dom') {
        return this.buildResult({
          queryType,
          query: value,
          url: page.url(),
          error: `未获取到 COSCO ${logName}查询结果`,
        });
      }

      const resultText = outcome.text || await page.locator('body').innerText().catch(() => '');
      const data = parseFn(resultText, values.number);
      this.logger.info(`COSCO ${logName}查询完成`);

      return this.buildResult({
        success: true,
        queryType,
        query: value,
        hasResult: true,
        url: page.url(),
        title: await page.title().catch(() => null),
        data,
        rawText: resultText,
      });
    } catch (e) {
      this.logger.error(`COSCO ${logName}查询失败`, e.message);
      return this.buildResult({ queryType, query: value, error: e.message });
    } finally {
      await browser.close().catch(() => {});
    }
  }

  async trackContainer(containerNumber, options = {}) {
    return this._trackConsignment({
      value: containerNumber,
      queryType: QUERY_TYPES.CONTAINER,
      recipe: this.recipe,
      logName: '箱号',
      parseFn: parseCoscoContainer,
      options,
    });
  }

  async trackBillOfLading(blNumber, options = {}) {
    return this._trackConsignment({
      value: blNumber,
      queryType: QUERY_TYPES.BILL_OF_LADING,
      recipe: this.blRecipe,
      logName: '提单号',
      parseFn: parseCoscoBillOfLading,
      options,
    });
  }
}

module.exports = CoscoAdapter;
