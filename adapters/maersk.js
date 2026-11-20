const BaseAdapter = require('./base');
const RecipeAdapter = require('./recipe_adapter');
const runner = require('../utils/recipeRunner');
const { waitForText, getLatestPage } = require('../core/browser');
const { CARRIERS, QUERY_TYPES } = require('../core/types');
const {
  parseTrackTraceContainer,
  parseMaerskContainerOfficial,
  parseMaerskBillOfLading,
} = require('../parsers/maersk');
const { parseMscContainer } = require('../parsers/msc');

// 通用容器追踪通道：页面事实（入口、表单、frame 逃生、Seaco 直连、结果关键词）
// 全部来自 config/recipes/track_trace_container.json，本类只保留分支流程。
class TrackTraceBasedAdapter extends RecipeAdapter {
  constructor(carrierName, supportedTypes = [QUERY_TYPES.CONTAINER], opts = {}) {
    super(carrierName, opts.recipeId || 'track_trace_container', { supportedTypes });
  }

  get flow() {
    return this.recipe.flow || {};
  }

  async _goThroughTrackTrace(query, carrierLabel, options) {
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
      this.logger.info(`Track-Trace: 查询 ${values.number} -> ${carrierLabel || '(default)'}`);
      await runner.dismissPopups(page, recipe.popups);
      await page.locator('#coiOverlay').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

      await runner.runSteps(page, recipe.steps, values, {
        onStep: (entry) => this.logger.debug(
          `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || 'ok'}`
        ),
      });

      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(this.flow.afterSubmitSettleMs || 3000);

      const workPage = await getLatestPage(context, page, { waitAfter: this.flow.landingSettleMs || 2000 });

      // frame 限制：track-trace 无法内嵌显示承运商结果（Seaco/Triton 等租箱方会出警告页）。
      // 从警告页标题 "Origin: Seaco" 或正文提取承运商名：
      //   - Seaco → 跳过逃生链接，直接新建页访问 Seaco Unit Enquiry 官网填箱号 Submit
      //   - 其他承运商 → 点击逃生链接"Click here to show ... without frame"打开落地页抓文本
      const firstText = await workPage.locator('body').innerText().catch(() => '');
      const frameBlockRe = new RegExp(this.flow.frameBlockPattern || '$.', 'i');
      if (frameBlockRe.test(firstText)) {
        const carrierName = this._extractBlockedCarrier(firstText);
        const seacoPattern = this.flow.seaco?.carrierMatch;
        if (seacoPattern && new RegExp(seacoPattern, 'i').test(carrierName)) {
          this.logger.info(`track-trace 识别 Seaco 承运商，直连 Unit Enquiry: ${values.number}`);
          const res = await this._directSeacoQuery(context, values.number);
          if (res) return res;
          // 直连失败 → 降级走逃生链接
        }
        const landingPage = await this._openFrameEscape(context, workPage);
        if (landingPage) {
          const seacoResult = await this._trySeacoUnitEnquiry(landingPage, values.number);
          if (seacoResult) return seacoResult;
          return await this._captureTextResult(landingPage, values.number);
        }
        return {
          ok: false,
          url: workPage.url(),
          title: await workPage.title().catch(() => null),
          error: '承运人站点禁止 track-trace 内嵌显示（frame 限制），且无法跳转到其官网，转 Bing 兜底查询',
          workPage: null,
        };
      }

      // 两段式：track-trace 提交后通常已自动路由承运商并加载结果，先直接等结果关键词；
      // 若未加载（停留在"Select company"选公司界面），需手动点击选中的承运商才会跳转到其页面。
      const waitCfg = recipe.result.wait || {};
      const intervalMs = waitCfg.intervalMs || 1000;
      const maxAttempts = Math.max(1, Math.ceil((waitCfg.timeoutMs || 12000) / intervalMs));
      const keywords = recipe.result.domFallback?.successKeywords || [];
      const found = await waitForText(workPage, keywords, { maxAttempts, intervalMs });
      if (!found.text) {
        const landingPage = await this._clickCarrierAndCapture(context, workPage, carrierLabel);
        if (landingPage) {
          const seacoResult = await this._trySeacoUnitEnquiry(landingPage, values.number);
          if (seacoResult) return seacoResult;
          return await this._captureTextResult(landingPage, values.number);
        }
        return {
          ok: false,
          url: workPage.url(),
          title: await workPage.title().catch(() => null),
          error: 'track-trace 未跳转到承运商官网（无法跳转），转 Bing 兜底查询',
          workPage: null,
        };
      }

      // 重定向误判防护：文本命中结果关键词但实为官网首页 → 如实报失败，不产生假成功
      if (this._looksLikeCarrierHomepage(found.text)) {
        return {
          ok: false,
          url: workPage.url(),
          title: await workPage.title().catch(() => null),
          error: 'track-trace 重定向至承运人官网首页，未取得轨迹数据（可能需官网登录/JS 交互）',
          workPage: null,
        };
      }

      return {
        ok: true,
        workPage: null,
        url: workPage.url(),
        title: await workPage.title().catch(() => null),
        rawText: found.text,
        source: found.source,
      };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      await browser.close();
    }
  }

  _looksLikeCarrierHomepage(text) {
    return (this.flow.homepageMarkers || []).some((m) => text.includes(m));
  }

  // 跳转落地页文本抓取作为最终结果（不再整页截图）
  async _captureTextResult(landingPage, query) {
    const rawText = await landingPage.locator('body').innerText().catch(() => '');
    return {
      ok: true,
      url: landingPage.url(),
      title: await landingPage.title().catch(() => null),
      rawText,
      source: 'text',
      workPage: null,
    };
  }

  // 点击跳转入口后可靠解析落地页：优先捕获新开标签页（waitForEvent('page')），
  // 否则回退 context 最新页；过滤掉 track-trace 自身与 about:blank。
  async _resolveLandingAfterClick(context, currentPage, clickFn) {
    const popupPromise = context.waitForEvent('page', { timeout: 10000 }).catch(() => null);
    await clickFn();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('networkidle').catch(() => {});
      await popup.waitForTimeout(1500);
    }
    const latest = await getLatestPage(context, currentPage, { state: 'networkidle', waitAfter: 1500 });
    for (const c of [popup, latest]) {
      if (!c) continue;
      let url = '';
      try { url = c.url() || ''; } catch (_) { url = ''; }
      if (url && !/track-trace\.com/i.test(url) && !/about:blank/i.test(url)) return c;
    }
    return null;
  }

  // frame 限制逃生：点击"Click here to show ... without frame"链接打开承运商官网落地页
  // （如 Triton UNIT INQUIRY 页）。逐个尝试候选选择器，兼容不同承运商的逃生文案差异。
  async _openFrameEscape(context, workPage) {
    const escape = this.flow.escape || {};
    const makeLocators = [
      ...(escape.texts || []).map((text) => () => workPage.getByText(text, { exact: false }).first()),
      ...(escape.css || []).map((sel) => () => workPage.locator(sel).first()),
    ];
    for (const makeLocator of makeLocators) {
      const el = makeLocator();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        return this._resolveLandingAfterClick(context, workPage, async () => {
          await el.scrollIntoViewIfNeeded().catch(() => {});
          await el.click({ force: true }).catch(() => {});
          await workPage.waitForTimeout(escape.settleMs || 1500);
        });
      }
    }
    return null;
  }

  // 从 track-trace frame block 警告页文本里提取承运商名。
  // 页面标题形如 "Container tracking: SEGU6422656 Origin: Seaco"，
  // 正文形如 "we can not integrate Seaco completely due to technical reasons"。
  _extractBlockedCarrier(text) {
    for (const pattern of this.flow.carrierNamePatterns || []) {
      const m = text.match(new RegExp(pattern, 'i'));
      if (m) return m[1].trim();
    }
    return '';
  }

  // 新建页直连 Seaco Unit Enquiry 官网（不经过 track-trace 逃生链接）。
  // 因为逃生链接打开的也是空表单，不如直接进官网填箱号 Submit。
  async _directSeacoQuery(context, query) {
    const seaco = this.flow.seaco || {};
    if (!seaco.entryUrl) return null;
    const page = await context.newPage();
    try {
      await page.goto(seaco.entryUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(2000);
      return await this._trySeacoUnitEnquiry(page, query);
    } catch (e) {
      this.logger.warn(`Seaco Unit Enquiry 直连失败: ${e.message}`);
      return null;
    }
    // 注意：不关闭 page，让父级 browser.close() 统一清理
  }

  // Seaco Unit Enquiry 表单主动查询：
  // track-trace 逃生到 Seaco/Triton 落地页后默认只显示空表单，
  // 需主动填入箱号点击 Submit 才能拿到轨迹/租赁历史。
  // 返回 {ok, url, title, rawText, source:'seaco-unit-enquiry'} 或 null（非 Seaco 页/失败）。
  async _trySeacoUnitEnquiry(page, query) {
    const seaco = this.flow.seaco || {};
    let url = '';
    try { url = page.url() || ''; } catch (_) {}
    if (!seaco.urlPattern || !new RegExp(seaco.urlPattern, 'i').test(url)) return null;

    this.logger.info(`Seaco/Triton Unit Enquiry 落地页，主动提交查询: ${query}`);

    try {
      // Unit Number(s) 输入框（SAP UI5 textarea，用 label 文本定位）
      const unitField = page.getByLabel(seaco.unitLabel || 'Unit Number', { exact: false }).first();
      if (!(await unitField.isVisible({ timeout: 10000 }).catch(() => false))) {
        this.logger.warn('Seaco Unit Enquiry: 未找到 Unit Number 输入框');
        return null;
      }
      await unitField.scrollIntoViewIfNeeded().catch(() => {});
      await unitField.click();
      await unitField.fill('');
      await unitField.fill(query);
      await page.waitForTimeout(300);

      // Submit 按钮
      const submitRole = seaco.submit?.role;
      if (!submitRole) {
        this.logger.warn('Seaco Unit Enquiry: 配方未配置提交按钮定位器');
        return null;
      }
      const submitBtn = page
        .getByRole(submitRole.type, { name: new RegExp(submitRole.name, 'i') })
        .first();
      if (!(await submitBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        this.logger.warn('Seaco Unit Enquiry: 未找到 Submit 按钮');
        return null;
      }
      await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
      await submitBtn.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(4000);

      // 等结果渲染：结果区含 Status/Vessel/Location 等关键词
      const timeoutMs = seaco.resultTimeoutMs || 15000;
      const intervalMs = seaco.resultIntervalMs || 1000;
      const resultText = await waitForText(
        page,
        seaco.resultKeywords || [],
        { maxAttempts: Math.max(1, Math.ceil(timeoutMs / intervalMs)), intervalMs }
      );

      if (resultText && resultText.text && resultText.text.length > (seaco.minResultLength || 50)) {
        this.logger.info(`Seaco Unit Enquiry 查询成功: ${query}`);
        return {
          ok: true,
          url: page.url(),
          title: await page.title().catch(() => null),
          rawText: resultText.text,
          source: 'seaco-unit-enquiry',
        };
      }

      // 没等到结果关键词，但页面已有内容 → 抓下来看
      const fallbackText = await page.locator('body').innerText().catch(() => '');
      const formStillVisible = new RegExp(seaco.fallbackFormPattern || 'Unit Enquiry|Submit|Reset', 'i')
        .test(fallbackText.slice(0, 200));
      if (fallbackText && fallbackText.length > (seaco.fallbackMinLength || 100) && !formStillVisible) {
        this.logger.info(`Seaco Unit Enquiry 兜底抓到页面内容: ${query}`);
        return {
          ok: true,
          url: page.url(),
          title: await page.title().catch(() => null),
          rawText: fallbackText,
          source: 'seaco-unit-enquiry',
        };
      }

      this.logger.warn(`Seaco Unit Enquiry 未拿到有效结果: ${query}`);
      return null;
    } catch (e) {
      this.logger.warn(`Seaco Unit Enquiry 查询失败: ${e.message}`);
      return null;
    }
  }

  // 点选承运商（js-link）并解析落地页。
  async _clickCarrierAndCapture(context, workPage, carrierLabel) {
    const list = this.flow.carrierList || {};
    if (list.tabText) {
      const companyTab = workPage.getByText(list.tabText, { exact: false }).first();
      if (await companyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyTab.click({ force: true });
        await workPage.waitForTimeout(1500);
      }
    }
    const itemCss = list.itemCss || 'div.js-link';
    let carrierBtn = null;
    if (carrierLabel) {
      carrierBtn = workPage.locator(itemCss).filter({ hasText: carrierLabel }).first();
      if (!(await carrierBtn.isVisible({ timeout: 5000 }).catch(() => false))) carrierBtn = null;
    }
    if (!carrierBtn) {
      carrierBtn = workPage.locator(itemCss).first();
      if (!(await carrierBtn.isVisible({ timeout: 5000 }).catch(() => false))) carrierBtn = null;
    }
    if (!carrierBtn) return null;
    return this._resolveLandingAfterClick(context, workPage, async () => {
      await carrierBtn.scrollIntoViewIfNeeded().catch(() => {});
      await carrierBtn.click({ force: true });
      await workPage.waitForTimeout(list.settleMs || 5000);
    });
  }

  async trackContainer(query, options = {}) {
    const res = await this._goThroughTrackTrace(query, this.carrier, options);
    if (!res.ok) {
      return this.buildResult({
        queryType: QUERY_TYPES.CONTAINER,
        query,
        error: res.error,
        url: res.url,
        title: res.title,
        rawText: res.rawText,
      });
    }
    const data = res.data || parseTrackTraceContainer(res.rawText, query);
    const eventCount = (data && data.events) ? data.events.length : 0;
    this.logger.info(`完成 ${this.carrier} 箱号查询，事件数=${eventCount}`);
    return this.buildResult({
      success: true,
      queryType: QUERY_TYPES.CONTAINER,
      query,
      hasResult: true,
      url: res.url || null,
      title: res.title || null,
      data,
      rawText: res.rawText,
      screenshot: res.screenshot || null,
      screenshotFile: res.screenshotFile || null,
    });
  }
}

// 马士基官网直连（箱号 / 提单号共用 URL 路由，免登录）。
// 页面事实（入口、URL 模板、Cookie 弹窗、结果关键词、等待时长）全部来自
// config/recipes/maersk.json；本类只保留流程与解析器选择。
class MaerskAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.MAERSK, 'maersk', {
      supportedTypes: [QUERY_TYPES.CONTAINER, QUERY_TYPES.BILL_OF_LADING],
    });
  }

  async _track(query, parseFn, queryType, options) {
    const recipe = this.recipe;
    const values = this.buildValues(query);
    const url = this.buildUrl(values);

    let opened;
    try {
      opened = await this.openPage(options, url);
    } catch (e) {
      return this.buildResult({
        queryType,
        query,
        url,
        error: `Maersk 官网打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    try {
      this.logger.info(`Maersk 官网直连: ${query} (recipe v${recipe.version})`);
      await runner.dismissPopups(page, recipe.popups);

      // 官网为 URL 路由 SPA：无表单步骤，直接等结果关键词渲染
      const outcome = await runner.waitForResult(page, recipe.result, { payload: null, error: null, data: null });
      if (outcome.kind !== 'dom') {
        const hint = outcome.dom?.kind === 'nodata' ? '（官网返回无匹配结果）' : '';
        this.logger.warn(`Maersk 官网未返回追踪结果 ${hint}`);
        return this.buildResult({
          queryType,
          query,
          url: page.url(),
          title: await page.title().catch(() => null),
          error: `Maersk 官网未返回追踪结果${hint}`,
        });
      }

      const data = parseFn(outcome.text, query);
      this.logger.info(`Maersk 官网查询完成，事件数=${data.events ? data.events.length : 'n/a'}`);
      return this.buildResult({
        success: true,
        queryType,
        query,
        hasResult: true,
        url: page.url(),
        title: await page.title().catch(() => null),
        data,
        rawText: outcome.text,
      });
    } catch (e) {
      this.logger.error('Maersk 官网查询失败', e.message);
      return this.buildResult({ queryType, query, error: e.message });
    } finally {
      await browser.close().catch(() => {});
    }
  }

  async trackContainer(query, options = {}) {
    return this._track(query, parseMaerskContainerOfficial, QUERY_TYPES.CONTAINER, options);
  }

  async trackBillOfLading(blNumber, options = {}) {
    // 官网 tracking 同样支持 9 位提单号（URL 路由一致）
    return this._track(blNumber, parseMaerskBillOfLading, QUERY_TYPES.BILL_OF_LADING, options);
  }
}

// MSC 官网直连（箱号表单提交）。
// 表单输入框、Cookie 弹窗、结果关键词、回车/点击双路径的等待时长全部来自
// config/recipes/msc.json；本类只保留流程与解析器调用。
class MscAdapter extends RecipeAdapter {
  constructor() {
    super(CARRIERS.MSC, 'msc', { supportedTypes: [QUERY_TYPES.CONTAINER] });
  }

  async trackContainer(query, options = {}) {
    const recipe = this.recipe;
    const values = this.buildValues(query);
    const url = this.buildUrl(values);

    let opened;
    try {
      opened = await this.openPage(options, url);
    } catch (e) {
      return this.buildResult({
        queryType: QUERY_TYPES.CONTAINER,
        query,
        url,
        error: `MSC 官网打开失败: ${e.message}`,
      });
    }

    const { browser, page } = opened;
    try {
      this.logger.info(`MSC 官网直连: ${query} (recipe v${recipe.version})`);
      await runner.dismissPopups(page, recipe.popups);

      const trace = await runner.runSteps(page, recipe.steps, values, {
        onStep: (entry) => this.logger.debug(
          `step ${entry.index} ${entry.action} -> ${entry.layer || entry.detail || 'ok'}`
        ),
      });

      // 先按回车提交；超时后按配方兜底点 Search 再等一次
      const outcome = await this.waitResult(page, { payload: null, error: null, data: null }, values);
      if (outcome.kind !== 'dom') {
        const hint = outcome.dom?.kind === 'nodata' ? '（官网返回无匹配结果）' : '';
        this.logger.warn(`MSC 官网未返回追踪结果${hint} | 步骤: ${trace.map(t => `${t.index}:${t.action}${t.ok ? '✓' : '✗'}`).join(' ')}`);
        return this.buildResult({
          queryType: QUERY_TYPES.CONTAINER,
          query,
          url: page.url(),
          title: await page.title().catch(() => null),
          error: `MSC 官网未返回追踪结果${hint}`,
        });
      }

      const data = parseMscContainer(outcome.text, query);
      this.logger.info(`MSC 官网查询完成，事件数=${data.events ? data.events.length : 0}`);
      return this.buildResult({
        success: true,
        queryType: QUERY_TYPES.CONTAINER,
        query,
        hasResult: true,
        url: page.url(),
        title: await page.title().catch(() => null),
        data,
        rawText: outcome.text,
      });
    } catch (e) {
      this.logger.error('MSC 官网查询失败', e.message);
      return this.buildResult({ queryType: QUERY_TYPES.CONTAINER, query, error: e.message });
    } finally {
      await browser.close().catch(() => {});
    }
  }
}

// 通用箱号聚合适配器：不选具体航司，交给 track-trace 按前缀自动识别承运人。
// 覆盖租箱/未知前缀等一切非官网直连的箱号（ONE/Hapag/CMA/Evergreen/TCKU 等）。
class TrackTraceGenericContainerAdapter extends TrackTraceBasedAdapter {
  constructor() { super(CARRIERS.TRACK_TRACE_GENERIC, [QUERY_TYPES.CONTAINER]); }

  async trackContainer(query, options = {}) {
    const res = await this._goThroughTrackTrace(query, null, options); // carrierLabel=null，自动识别
    if (!res.ok) {
      return this.buildResult({
        queryType: QUERY_TYPES.CONTAINER,
        query,
        error: res.error,
        url: res.url,
        title: res.title,
        rawText: res.rawText,
      });
    }
    const data = res.data || parseTrackTraceContainer(res.rawText, query);
    const eventCount = (data && data.events) ? data.events.length : 0;
    this.logger.info(`完成 ${this.carrier} 箱号查询，事件数=${eventCount}`);
    return this.buildResult({
      success: true,
      queryType: QUERY_TYPES.CONTAINER,
      query,
      hasResult: true,
      url: res.url || null,
      title: res.title || null,
      data,
      rawText: res.rawText,
      screenshot: res.screenshot || null,
      screenshotFile: res.screenshotFile || null,
    });
  }
}

class DhlAdapter extends BaseAdapter {
  constructor() { super(CARRIERS.DHL, [QUERY_TYPES.AIR_WAYBILL]); }
  async trackAirWaybill(awb) {
    return this.buildResult({ queryType: QUERY_TYPES.AIR_WAYBILL, query: awb, error: `DHL 空运单适配器待实现 (AWB=${awb})` });
  }
}
class FedexAdapter extends BaseAdapter {
  constructor() { super(CARRIERS.FEDEX, [QUERY_TYPES.AIR_WAYBILL]); }
  async trackAirWaybill(awb) {
    return this.buildResult({ queryType: QUERY_TYPES.AIR_WAYBILL, query: awb, error: `FedEx 空运单适配器待实现 (AWB=${awb})` });
  }
}
class UpsAdapter extends BaseAdapter {
  constructor() { super(CARRIERS.UPS, [QUERY_TYPES.AIR_WAYBILL]); }
  async trackAirWaybill(awb) {
    return this.buildResult({ queryType: QUERY_TYPES.AIR_WAYBILL, query: awb, error: `UPS 空运单适配器待实现 (AWB=${awb})` });
  }
}

module.exports = {
  TrackTraceBasedAdapter,
  MaerskAdapter,
  MscAdapter,
  TrackTraceGenericContainerAdapter,
  DhlAdapter,
  FedexAdapter,
  UpsAdapter,
};
