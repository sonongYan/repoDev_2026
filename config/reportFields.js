// ============================================================================
// 报告「实体类型展示字段规范」配置。
//
// 本对象决定每类实体在最终尽调报告里要展示哪些信息、以什么顺序展示。
// 它会被拼进「报告生成（LLM 边界2）」的系统提示词，指导 DeepSeek 据此整理
// 各实体信息并输出到 facts。直接编辑本文件即可调整展示内容，无需改其他代码。
//
// 说明：
//   - 每个数组项是一条「应展示的信息」，顺序即报告展示顺序；
//   - 括号内标注该信息对应的数据字段（data 对象里的英文 key），仅作 LLM 提示，
//     实际以查询结果 data 里真实存在的字段为准，语义匹配即可；
//   - 字段缺失时跳过，不得编造（遵循硬性规则）。
// ============================================================================

const REPORT_ENTITY_FIELDS = {
  // 空运单
  airWaybills: [
    '运单号（awbNumber）',
    '承运人/航空公司（airline）',
    '航线：始发港 → 目的港，格式「中文全称（三字码）」，如「莫斯科谢列梅捷沃（SVO）→ 迪拜（DXB）」',
    '件数（pieces / totalPieces）、重量（weight / totalWeight）、体积（volume / totalVolume）',
    '当前状态（currentStatus / latestStatus / shipmentStatus）',
    '发货人（shipper）、收货人（consignee）（若有）',
    '货物描述（goodsDescription）、产品代码（productCode）、特殊处理码（shcs）（若有）',
    '当前状态总述与异常判断（轨迹明细由系统自动生成表格，此处不要重复列出轨迹）',
  ],
  // 集装箱（由系统按固定四段确定性渲染，模型仅需在摘要/异常中简述，不生成 section/facts）
  containers: [
    '基础箱信息：箱号、箱型（外文箱型转中文，如「20英尺干货标准箱」）',
    '航线起讫：始发港、目的港、中转港（外文港口名转中文）',
    '关键时间节点：离港、预计到港、最近更新时间',
    '运输轨迹（表格，每行含 港口/码头设施/事件类型/船名航次，事件类型转中文）',
  ],
  // 提单
  billOfLadings: [
    '提单号（blNumber）',
    '关联箱号（containers）',
    '预计到达时间（eta）',
    '备注（note）',
  ],
  // 企业（由系统按「1.工商基础信息 / 2.股权结构 / 3.对外投资 / 4.司法风险 / 5.经营异常/处罚」五段固定格式确定性渲染）
  companies: [
    '工商基础信息、股权结构、对外投资、司法风险、经营异常/处罚等维度由系统确定性渲染，模型仅需在摘要/异常中简述，不生成 section/facts',
  ],
  // 个人
  persons: [
    '姓名',
    '关联公司/角色',
    '司法风险线索',
  ],
  // 名单筛查
  rosters: [
    '名单标题（title）、类型（type）',
    '命中总数（total）、标记（flags）',
    '命中明细（results：逐条列出 姓名/性别/出生日期/国籍/详情/标签）',
  ],
};

// 名单筛查命中明细在报告中最多展示的条数：集中在此配置，随时可改，无需动业务代码。
// 也可用环境变量 ROSTER_RESULTS_LIMIT 覆盖（默认 20）。
const ROSTER_RESULTS_LIMIT = parseInt(process.env.ROSTER_RESULTS_LIMIT || '20', 10);

// 道琼斯 tags 分类码 → 中文对照（报告展示层翻译用）。基于 RiskCenter 官方档案类型码；未收录的码保留原文。
const DOWJONES_TAG_ZH = {
  SAN: '制裁',
  PEP: '政治公众人物',
  AM: '负面媒体',
  OOL: '其他官方名单',
  SOC: '国有企业',
  RCA: '亲属/密切关联人',
  ECR: '增强国家风险',
  OEL: '其他排除名单',
  SOR: '制裁控制与所有权',
  BRD: '董事会成员',
  SI: '特殊利益人物/实体',
};

// 将 tags（如 "SAN + PEP" / "AM OOL" / "SAN"）翻译为中文，未知码保留原文。
function translateDowJonesTags(tags) {
  if (tags == null || tags === '') return tags;
  return String(tags)
    .split(/[+\s]+/)
    .filter(Boolean)
    .map((t) => DOWJONES_TAG_ZH[String(t).toUpperCase()] || t)
    .join('、');
}

// 把「字段规范」渲染成一段可拼入系统提示词的规则文本
function renderFieldSpecPrompt() {
  return Object.entries(REPORT_ENTITY_FIELDS)
    .map(([type, fields]) => `   ${type}：\n     ${fields.join('；\n     ')}。`)
    .join('\n');
}

module.exports = { REPORT_ENTITY_FIELDS, renderFieldSpecPrompt, ROSTER_RESULTS_LIMIT, DOWJONES_TAG_ZH, translateDowJonesTags };