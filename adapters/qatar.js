'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseQatarShipment } = require('../parsers/qatar');

// Qatar Airways Cargo（前缀 157）官网直连。
// 入口 URL、Cookie 弹窗、提交按钮候选、结果关键词、滚动加载全部来自 config/recipes/qatar.json。
class QatarAirWaybillAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.QATAR, 'qatar', { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
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
        error: `Qatar 官网打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    try {
      this.logger.info(`Qatar 官网直连: 查询 AWB=${values.numberDash} (recipe v${recipe.version})`);
      await runner.dismissPopups(page, recipe.popups);

      // 等表单预填 → 点 Track Shipment 提交（失败退回回车）→ 短等渲染
      await runner.runSteps(page, recipe.steps, values, {
        onStep: (entry) => this.logger.debug(
          `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || 'ok'}`
        ),
      });

      const outcome = await this.waitResult(page, { payload: null, error: null, data: null }, values);
      if (outcome.kind === 'nodata') {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url,
          error: 'Qatar 未找到该空运单结果',
        });
      }
      if (outcome.kind !== 'dom') {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url,
          error: 'Qatar 查询超时：结果区未在 60 秒内渲染',
        });
      }

      // 等结果区完整渲染并滚动触发详情懒加载
      await this.runPostMatch(page, values);

      const extracted = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';

        const eventEls = Array.from(
          document.querySelectorAll(
            '[class*="timeline"] > *, [class*="event-item"], [class*="status-item"], [class*="tracking"] > *, li[class*="item"], div[class*="item"]'
          )
        ).filter(el => {
          const t = el.innerText || '';
          return /(Delivered|Received|Departed|Arrived|Notified|Booked|Accepted|Departed from|Arrived in)/i.test(t)
            && /\d{1,2}:\d{2}/.test(t)
            && t.length < 500;
        });
        const eventList = eventEls.slice(0, 30).map(el => ({
          tag: el.tagName,
          className: el.className,
          text: (el.innerText || '').slice(0, 400),
        }));

        const statusEls = Array.from(
          document.querySelectorAll('[class*="badge"], [class*="status"], [class*="timeline"], [class*="event"]')
        ).filter(el => /(Delivered|Arrived|Departed|Booked|Received|Accepted)/.test(el.innerText || ''));
        const statusList = statusEls.slice(0, 10).map(el => ({
          tag: el.tagName,
          className: el.className,
          text: (el.innerText || '').slice(0, 300),
        }));

        const flightRows = Array.from(
          document.querySelectorAll('tr, div[class*="flight"], div[class*="segment"], div[class*="row"]')
        ).filter(el => /QR-\d|QR\d|PAX|PKX|DXB|DOH/.test(el.innerText || ''));
        const flightList = flightRows.slice(0, 10).map(el => ({
          tag: el.tagName,
          className: el.className,
          text: (el.innerText || '').slice(0, 400),
        }));

        return { bodyText: bodyText.slice(0, 12000), eventList, statusList, flightList };
      }).catch(() => ({ bodyText: '', eventList: [], statusList: [], flightList: [] }));

      const data = parseQatarShipment(extracted, values.numberDash.replace(/-/g, ''));
      this.logger.info(`完成 ${this.carrier} 空运单查询`);

      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        hasResult: true,
        url,
        title: await page.title().catch(() => null),
        data,
        rawText: extracted.bodyText,
      });
    } catch (e) {
      return this.buildResult({ queryType: QUERY_TYPES.AIR_WAYBILL, query, error: e.message });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = QatarAirWaybillAdapter;
