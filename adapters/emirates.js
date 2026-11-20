'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseEmiratesShipment } = require('../parsers/emirates');

// Emirates SkyCargo（前缀 176）官网直连。
// URL hash 参数、结果关键词、Show Details 展开动作全部来自 config/recipes/emirates.json。
class EmiratesAirWaybillAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.EMIRATES, 'emirates', { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
  }

  async trackAirWaybill(query, options = {}) {
    const recipe = this.recipe;
    const values = this.buildValues(query);
    const url = this.buildUrl(values);

    let opened;
    try {
      opened = await this.openPage(options, url);
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        url,
        error: `Emirates eSkyCargo 打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    try {
      this.logger.info(`Emirates eSkyCargo 直连: 查询 AWB=${values.numberDash} (recipe v${recipe.version})`);

      const outcome = await this.waitResult(page, { payload: null, error: null, data: null }, values);
      if (outcome.kind === 'nodata') {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: page.url(),
          error: 'Emirates eSkyCargo 未找到该空运单结果',
        });
      }
      if (outcome.kind !== 'dom') {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: page.url(),
          error: 'Emirates eSkyCargo 查询超时：未出现 Search Results 标志',
        });
      }

      // 展开结果卡片（失败不影响解析，只是字段可能不全）
      await this.runPostMatch(page, values);
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const data = parseEmiratesShipment(bodyText, values.number);
      this.logger.info(`完成 ${this.carrier} 空运单查询`);

      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        hasResult: true,
        url: page.url(),
        title: await page.title().catch(() => null),
        data,
        rawText: bodyText,
      });
    } catch (e) {
      return this.buildResult({ queryType: QUERY_TYPES.AIR_WAYBILL, query, error: e.message });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = EmiratesAirWaybillAdapter;
