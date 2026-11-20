const { globalTracker } = require('../../core/tracker');
const { QUERY_TYPES, CARRIERS } = require('../../core/types');
const { defaultLogger } = require('../../utils/logger');

const logger = defaultLogger.child('pipeline:scheduler');

/**
 * 工具调度层：按实体类型分发查询（大模型边界 1 之后、边界 2 之前的确定性核心）。
 * 只处理 extract 校验门标记 queryable=true 的实体，其余如实标记 skipped。
 * @param {object} entities validateEntities 的返回结构
 * @param {object} options { headless?: boolean }（默认 false，项目约定）
 * @returns {Promise<object>} 分类查询结果
 */
async function runScheduler(entities, options = {}) {
  const headless = options.headless ?? false;
  const result = { airWaybills: [], containers: [], billOfLadings: [], companies: [], persons: [], rosters: [], skipped: [], failed: [] };

  // 空运主单
  for (const item of entities.airWaybills || []) {
    if (!item.queryable) { result.skipped.push({ type: 'awb', raw: item.raw, reason: '校验门拦截（非校验通过的主单）' }); continue; }
    try {
      const r = await globalTracker.track(item.raw, { queryType: QUERY_TYPES.AIR_WAYBILL }, { headless });
      result.airWaybills.push({ raw: item.raw, sections: item.sections || [], ...r });
    } catch (e) {
      logger.error('awb query failed', item.raw, e.message);
      result.failed.push({ type: 'awb', raw: item.raw, error: e.message });
    }
  }

  // 集装箱
  for (const item of entities.containers || []) {
    if (!item.queryable) { result.skipped.push({ type: 'container', raw: item.raw, reason: '校验门拦截（格式不合法）' }); continue; }
    try {
      const r = await globalTracker.track(item.raw, { queryType: QUERY_TYPES.CONTAINER }, { headless });
      result.containers.push({ raw: item.raw, sections: item.sections || [], ...r });
    } catch (e) {
      logger.error('container query failed', item.raw, e.message);
      result.failed.push({ type: 'container', raw: item.raw, error: e.message });
    }
  }

  // 提单号
  for (const item of entities.billOfLadings || []) {
    if (!item.queryable) { result.skipped.push({ type: 'bl', raw: item.raw, reason: '校验门拦截（无承运人可路由）' }); continue; }
    try {
      const r = await globalTracker.track(item.raw, { queryType: QUERY_TYPES.BILL_OF_LADING }, { headless });
      result.billOfLadings.push({ raw: item.raw, ...r });
    } catch (e) {
      logger.error('bl query failed', item.raw, e.message);
      result.failed.push({ type: 'bl', raw: item.raw, error: e.message });
    }
  }

  // 公司名（尽调适配器：国内工商 CLI + Bing 线索发现）
  // item 现为 { name, sections }；sections 为空 → 默认全量五段
  for (const item of entities.companies || []) {
    try {
      const r = await globalTracker.track(item.name, { queryType: QUERY_TYPES.COMPANY }, { headless, sections: item.sections || [] });
      result.companies.push({ raw: item.name, sections: item.sections || [], ...r });
    } catch (e) {
      logger.error('company query failed', item.name, e.message);
      result.failed.push({ type: 'company', raw: item.name, error: e.message });
    }
  }

  // 个人姓名（尽调适配器：Bing 关联公司/职位/司法涉诉线索）
  for (const p of entities.persons || []) {
    try {
      const r = await globalTracker.track(p.name, { queryType: QUERY_TYPES.PERSON }, { headless });
      result.persons.push({ raw: p.name, context: p.context || '', ...r });
    } catch (e) {
      logger.error('person query failed', p.name, e.message);
      result.failed.push({ type: 'person', raw: p.name, error: e.message });
    }
  }

  // 名单（成批公司/个人，一次会话批量走 Dow Jones RiskCenter 名单筛查）
  for (const roster of entities.rosters || []) {
    const items = [];
    const names = roster.items || [];
    try {
      // batch=true：单个浏览器会话 + 单次 SSO 登录逐项查询，避免逐项重复登录
      const r = await globalTracker.track(
        names,
        { queryType: QUERY_TYPES.ROSTER, carrier: CARRIERS.DOWJONES_RISK },
        { headless, batch: true }
      );
      const list = (r.data && r.data.items) || [];
      for (const it of list) {
        items.push({ raw: it.raw, type: roster.type, ...it });
      }
    } catch (e) {
      logger.error('roster batch query failed', e.message);
      for (const item of names) {
        items.push({ raw: item, type: roster.type, success: false, error: e.message });
      }
    }
    result.rosters.push({ title: roster.title, type: roster.type, items });
  }

  return result;
}

module.exports = { runScheduler };
