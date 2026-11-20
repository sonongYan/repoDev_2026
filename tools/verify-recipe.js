'use strict';

// 配方回归验证工具：对单个承运商跑一次真实查询，输出结果摘要与步骤轨迹。
// 用法：
//   node tools/verify-recipe.js --carrier china_cargo
//   node tools/verify-recipe.js --carrier china_cargo --sample 112-00966066
//   node tools/verify-recipe.js --carrier china_cargo --headless
// 退出码：0 通过，1 失败（便于 CI / 定时任务判断）

const fs = require('fs');
const path = require('path');
const { globalRegistry } = require('../adapters');
const runner = require('../utils/recipeRunner');
const { QUERY_TYPES } = require('../core/types');

const FIXTURE_DIR = path.join(__dirname, '..', 'test', 'fixtures');

function readArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  return value && !value.startsWith('--') ? value : true;
}

function loadFixture(carrierId) {
  const file = path.join(FIXTURE_DIR, `${carrierId}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  const carrierId = readArg('carrier');
  if (!carrierId || carrierId === true) {
    console.error('用法: node tools/verify-recipe.js --carrier <recipe_id> [--sample <number>] [--headless]');
    process.exit(1);
  }

  let recipe;
  try {
    recipe = runner.loadRecipe(carrierId, { reload: true });
  } catch (e) {
    console.error(`配方加载失败: ${e.message}`);
    process.exit(1);
  }

  const adapter = globalRegistry.findByRecipe(carrierId);
  if (!adapter) {
    console.error(`未找到使用配方 "${carrierId}" 的适配器，请检查 adapters/index.js 是否注册`);
    process.exit(1);
  }

  const fixture = loadFixture(carrierId);
  const sampleArg = readArg('sample');
  const sample = typeof sampleArg === 'string'
    ? sampleArg
    : fixture?.samples?.[0]?.number;

  if (!sample) {
    console.error(`未提供样本：请用 --sample 指定，或创建 test/fixtures/${carrierId}.json`);
    process.exit(1);
  }

  const headless = readArg('headless', false) === true;
  const queryType = recipe.queryType === 'container' ? QUERY_TYPES.CONTAINER : QUERY_TYPES.AIR_WAYBILL;

  console.log(`\n=== 验证配方 ===`);
  console.log(`配方: ${carrierId} v${recipe.version}`);
  console.log(`样本: ${sample}`);
  console.log(`模式: ${headless ? 'headless' : '有头'} / ${queryType}\n`);

  const startedAt = Date.now();
  const result = await adapter.execute(sample, queryType, { headless });
  const elapsed = Date.now() - startedAt;

  console.log(`耗时: ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`成功: ${result.success}`);
  console.log(`有数据: ${result.hasResult}`);
  if (result.url) console.log(`地址: ${result.url}`);
  if (result.error) console.log(`错误: ${result.error}`);

  if (result.data) {
    const events = Array.isArray(result.data.events) ? result.data.events.length : 0;
    console.log(`运单号: ${result.data.awbNumber || result.data.containerNumber || '-'}`);
    console.log(`起止港: ${result.data.origin || '-'} → ${result.data.destination || '-'}`);
    console.log(`件数/重量: ${result.data.pieces ?? '-'} / ${result.data.weight ?? '-'}`);
    console.log(`轨迹事件: ${events} 条`);
    if (events) {
      const first = result.data.events[0];
      console.log(`首条事件: ${first.time || '-'} ${first.description || ''} ${first.location || ''}`.trim());
    }
  }

  if (Array.isArray(adapter._lastTrace)) {
    console.log(`\n步骤轨迹:`);
    for (const step of adapter._lastTrace) {
      console.log(`  [${step.ok ? 'OK' : 'FAIL'}] step ${step.index} ${step.action}` +
        `${step.layer ? ` via ${step.layer}` : ''}${step.detail ? ` (${step.detail})` : ''}` +
        `${step.error ? ` -> ${step.error}` : ''}`);
    }
  }

  const passed = !!result.success && (result.hasResult || result.data);
  console.log(`\n结果: ${passed ? 'PASS' : 'FAIL'}\n`);
  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error(`验证异常: ${e.message}`);
  process.exit(1);
});
