'use strict';

const BaseAdapter = require('./base');
const runner = require('../utils/recipeRunner');
const { launchBrowser } = require('../core/browser');

// 配方驱动适配器的公共基类。
// 适配器只保留"流程"（重试策略、验证码调用、错误分类），页面事实全部来自 config/recipes/{recipeId}.json。
// 构造时即加载并校验配方：配方写错会在进程启动阶段暴露，而不是等到查询时才失败。
class RecipeAdapter extends BaseAdapter {
  constructor(carrierName, recipeId, options = {}) {
    super(carrierName, options);
    this.recipeId = recipeId;
    this.recipe = runner.loadRecipe(recipeId);
  }

  // 把查询值按配方声明的格式化器归一化，供模板与步骤共用
  buildValues(query) {
    const key = this.recipe.queryKey || 'number';
    return runner.buildValues({ [key]: query }, this.recipe.valueFormats);
  }

  // 优先用 urlTemplates[0]，没有则退回 entry.url
  buildUrl(values) {
    const template = (this.recipe.urlTemplates || [])[0] || this.recipe.entry.url;
    return runner.renderTemplate(template, values);
  }

  // 报告里标注的访问地址：部分站点查询页 URL 不变，需要用 reportUrlTemplate 指向明细页
  buildReportUrl(values) {
    const template = this.recipe.reportUrlTemplate;
    return template ? runner.renderTemplate(template, values) : this.buildUrl(values);
  }

  // 打开入口页并等待基础稳定（settleMs 由配方控制）；recipe 可显式传入（一个适配器对应多份配方时）
  // onPage：在导航前对新建 Page 做挂载（如提前挂 XHR 监听，避免响应早于监听建立而漏抓）
  async openPage(options, url, recipe = this.recipe, onPage = null) {
    const entry = recipe.entry;
    const { browser, context } = await launchBrowser(options);
    const page = await context.newPage();
    try {
      if (typeof onPage === 'function') onPage(page);
      await page.goto(url, {
        waitUntil: entry.waitUntil || 'domcontentloaded',
        timeout: entry.timeoutMs || 60000,
      });
      if (entry.settleMs) await page.waitForTimeout(entry.settleMs);
    } catch (e) {
      await browser.close().catch(() => {});
      throw e;
    }
    return { browser, context, page };
  }

  // 按配方刷新验证码（reload 或点击刷新控件）
  async refreshCaptcha(page) {
    const refresh = this.recipe.captcha?.refresh || {};
    if (refresh.mode === 'reload') {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(refresh.settleMs || 2000);
      return;
    }
    const hit = await runner.resolveLocator(page, refresh.locator || {});
    if (hit.locator) {
      await hit.locator.click({ force: true }).catch(() => {});
      await page.waitForTimeout(refresh.settleMs || 1500);
    }
  }

  // 等待结果；若配方声明了 result.onTimeout，则在首次等待超时后补执行兜底动作（如点击 Search）再等一次
  async waitResult(page, xhrState = { payload: null, error: null, data: null }, values = {}) {
    const resultSpec = this.recipe.result;
    const first = await runner.waitForResult(page, resultSpec, xhrState);
    if (first.kind !== 'none' || !resultSpec.onTimeout) return first;

    const fallback = resultSpec.onTimeout;
    this.logger.info(`首次等待超时，执行配方兜底动作（${(fallback.steps || []).length} 步）`);
    try {
      await runner.runSteps(page, fallback.steps || [], values, {});
    } catch (e) {
      this.logger.warn(`兜底动作执行失败: ${e.message}`);
      return first;
    }
    return runner.waitForResult(
      page,
      { ...resultSpec, wait: fallback.wait || resultSpec.wait },
      xhrState
    );
  }

  // 结果出现后的收尾动作（如展开详情、滚动触发懒加载）；失败不影响主结果
  async runPostMatch(page, values = {}) {
    const steps = this.recipe.result?.postMatchSteps || [];
    if (!steps.length) return [];
    try {
      const trace = await runner.runSteps(page, steps, values, {});
      this._lastTrace = [...(this._lastTrace || []), ...trace];
      return trace;
    } catch (e) {
      this.logger.warn(`结果后置动作失败（不影响查询结果）: ${e.message}`);
      return [];
    }
  }
}

module.exports = RecipeAdapter;
