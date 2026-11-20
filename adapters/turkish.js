'use strict';

const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { handleCaptchaIfNeeded } = require('../core/browser');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const { parseTurkishShipment } = require('../parsers/turkish');

// Turkish Cargo（前缀 235）官网直连。
// URL 参数、Cookie 弹窗、结果关键词来自 config/recipes/turkish.json；
// 人机验证（按住按钮）属于流程交互，由适配器调用 handleCaptchaIfNeeded 处理。
class TurkishAirWaybillAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.TURKISH, 'turkish', { supportedTypes: [QUERY_TYPES.AIR_WAYBILL] });
  }

  _extract(page) {
    // 用 evaluate 直接抽取 DOM 结构化数据，避免 innerText 解析在空字段时错位
    return page.evaluate(() => {
      const r = {
        lastAcceptanceDate: null,
        origin: null,
        destination: null,
        fromAirport: null,
        toAirport: null,
        totalPieces: null,
        totalWeight: null,
        totalVolume: null,
        currentStatus: null,
        currentStatusTime: null,
        flights: [],
        statusHistory: [],
      };

      const bodyText = document.body.innerText;

      const lastAccMatch = bodyText.match(/Last Acceptance Date and Time\s*:?\s*([^\n]+)/i);
      if (lastAccMatch) r.lastAcceptanceDate = lastAccMatch[1].trim();

      const fromMatch = bodyText.match(/\bFrom\s*\n\s*([A-Z]{3})\s*-\s*([^\n]+)/i);
      if (fromMatch) {
        r.origin = fromMatch[1];
        r.fromAirport = `${fromMatch[1]} - ${fromMatch[2].trim()}`;
      }
      const toMatch = bodyText.match(/\bTo\s*\n\s*([A-Z]{3})\s*-\s*([^\n]+)/i);
      if (toMatch) {
        r.destination = toMatch[1];
        r.toAirport = `${toMatch[1]} - ${toMatch[2].trim()}`;
      }

      const piecesMatch = bodyText.match(/(\d+)\s*piece\(s\)/i);
      if (piecesMatch) r.totalPieces = piecesMatch[1];
      const weightMatch = bodyText.match(/([\d.]+)\s*kg/i);
      if (weightMatch) r.totalWeight = `${weightMatch[1]} kg`;
      const volumeMatch = bodyText.match(/([\d.]+)\s*m3/i);
      if (volumeMatch) r.totalVolume = `${volumeMatch[1]} m3`;

      const currentMatch = bodyText.match(
        /(In Transit|Delivered|Accepted|Booked|Departed|Arrived|Notified|Ready for|On Hand)[^\n]*\n\s*([^\n]+)/i
      );
      if (currentMatch) {
        r.currentStatus = `${currentMatch[1].trim()} - ${currentMatch[2].trim()}`;
        r.currentStatusTime = currentMatch[2].trim();
      }

      const tableSelectors = ['table', '[role="table"]', '.table', '.grid', '.data-grid'];
      let allTables = [];
      for (const sel of tableSelectors) {
        allTables = Array.from(document.querySelectorAll(sel));
        if (allTables.length) break;
      }

      for (const tbl of allTables) {
        const rowSelectors = ['tr', '[role="row"]'];
        let rows = [];
        for (const sel of rowSelectors) {
          rows = Array.from(tbl.querySelectorAll(sel));
          if (rows.length) break;
        }
        if (!rows.length) continue;

        const headerRow = rows[0];
        const cellSelectors = ['th', 'td', '[role="cell"]', '[role="columnheader"]'];
        let headerCells = [];
        for (const sel of cellSelectors) {
          headerCells = Array.from(headerRow.querySelectorAll(sel));
          if (headerCells.length) break;
        }
        const headers = headerCells.map(c => c.textContent.trim());

        if (headers.some(h => /Flight No/i.test(h)) && !r.flights.length) {
          for (let i = 1; i < rows.length; i++) {
            let cells = [];
            for (const sel of cellSelectors) {
              cells = Array.from(rows[i].querySelectorAll(sel));
              if (cells.length) break;
            }
            const texts = cells.map(c => c.textContent.trim());
            if (texts.length >= 7 && /TK\d{3,4}/.test(texts[0])) {
              r.flights.push({
                flightNo: texts[0],
                flightDate: texts[1] || null,
                eta: texts[2] || null,
                etd: texts[3] || null,
                segment: texts[4] || null,
                piecesWeight: texts[5] || null,
                volume: texts[6] || null,
                approvalStatus: texts[7] || '',
              });
            }
          }
        }

        if (
          headers.some(h => /Description/i.test(h)) &&
          headers.some(h => /Station/i.test(h)) &&
          !r.statusHistory.length
        ) {
          for (let i = 1; i < rows.length; i++) {
            let cells = [];
            for (const sel of cellSelectors) {
              cells = Array.from(rows[i].querySelectorAll(sel));
              if (cells.length) break;
            }
            const texts = cells.map(c => c.textContent.trim());
            if (texts.length >= 7 && /^[A-Z]{3}$/.test(texts[0])) {
              r.statusHistory.push({
                status: texts[0],
                description: texts[1],
                station: texts[2],
                flightNo: texts[3] || null,
                planned: texts[4],
                actual: texts[5],
                actualTime: texts[6] || null,
                eta: texts[7] || null,
                etd: texts[8] || null,
              });
            }
          }
        }
      }

      return r;
    }).catch(err => ({ error: err.message }));
  }

  async trackAirWaybill(query, options = {}) {
    const recipe = this.recipe;
    const values = this.buildValues(query);
    const reportUrl = this.buildReportUrl(values);

    const raw = String(query || '').replace(/[\s-]/g, '');
    if (raw.length !== 11) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        error: `Turkish AWB 格式错误：需 11 位数字，实际 ${raw.length} 位`,
      });
    }

    let opened;
    try {
      opened = await this.openPage(options, reportUrl);
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        url: reportUrl,
        error: `Turkish Cargo 打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    try {
      this.logger.info(`Turkish Cargo 直连: 查询 AWB=${values.numberDash} (recipe v${recipe.version})`);
      await runner.dismissPopups(page, recipe.popups);

      // 轮询等待：每轮先处理人机验证，再按配方关键词判定结果
      const timeoutMs = recipe.result.wait?.timeoutMs || 60000;
      const intervalMs = recipe.result.wait?.intervalMs || 2000;
      const deadline = Date.now() + timeoutMs;
      let captchaResult = null;
      let text = '';
      let matched = false;
      let noData = false;

      while (Date.now() < deadline) {
        const captcha = await handleCaptchaIfNeeded(page, {
          autoTimeoutMs: 10000,
          userTimeoutMs: 90000,
        }).catch(() => 'not-present');
        if (captcha === 'auto-passed' || captcha === 'user-passed') {
          captchaResult = captcha;
          await page.waitForTimeout(3000);
        } else if (captcha === 'timeout') {
          return this.buildResult({
            queryType: QUERY_TYPES.AIR_WAYBILL,
            query,
            url: page.url(),
            error: 'Turkish Cargo 人机验证超时：自动模拟失败且用户未在 90 秒内配合',
          });
        }

        const dom = await runner.checkDomResult(page, recipe.result.domFallback);
        text = dom.text;
        if (dom.kind === 'success') { matched = true; break; }
        if (dom.kind === 'nodata') { noData = true; break; }
        await page.waitForTimeout(intervalMs);
      }

      if (noData) {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: page.url(),
          error: 'Turkish Cargo 未找到该空运单结果',
        });
      }
      if (!matched) {
        return this.buildResult({
          queryType: QUERY_TYPES.AIR_WAYBILL,
          query,
          url: page.url(),
          error: 'Turkish Cargo 查询超时：未出现结果关键词',
        });
      }

      await page.waitForTimeout(1000);
      const extracted = await this._extract(page);
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const data = parseTurkishShipment(extracted, values.numberDash.replace(/-/g, ''), bodyText);
      this.logger.info(`完成 ${this.carrier} 空运单查询 (captcha: ${captchaResult || 'not-present'})`);

      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.AIR_WAYBILL,
        query,
        hasResult: true,
        url: page.url(),
        title: await page.title().catch(() => null),
        data,
        rawText: bodyText,
        captchaResolved: captchaResult || 'not-present',
      });
    } catch (e) {
      return this.buildResult({ queryType: QUERY_TYPES.AIR_WAYBILL, query, error: e.message });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = TurkishAirWaybillAdapter;
