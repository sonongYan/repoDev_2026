#!/usr/bin/env node
// Mock tyc-cli / qcc-agent-cli：接收公司名，输出样例 JSON（演示深挖解析器用）。
// 用法: node scripts/mock-company-cli.js "公司名"
// 替换真实 CLI 后，将 COMPANY_CLI_CMD 指向你的命令即可（{name} 会被替换）。

const name = process.argv.slice(2).join(' ') || '示例公司';

const sample = {
  basicInfo: {
    companyName: name,
    creditCode: '91310000MA1MOCK001X',
    legalRepresentative: '张三',
    registeredCapital: '5000万人民币',
    foundedAt: '2010-06-01',
    address: '上海市浦东新区示例路100号',
    businessScope: '国际货运代理；道路货物运输；仓储服务',
    status: '存续',
  },
  shareholders: [
    { name: '李四', ratio: '60%', amount: '3000万人民币' },
    { name: '王五', ratio: '40%', amount: '2000万人民币' },
  ],
  investments: [
    { companyName: `${name}物流有限公司`, ratio: '30%' },
  ],
  judicialRisk: ['（2024）沪0115民初12345号', '被执行人 1 条'],
  abnormal: ['经营异常名录'],
};

process.stdout.write(JSON.stringify(sample, null, 2) + '\n');
