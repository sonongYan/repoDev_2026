# 查询路由地址一览

> 依据当前代码结构整理。路由定义主要集中在 `config/carriers.js`（前缀映射）、`config/overseas.js`（海外注册机构）、`config/dowjones.js`（名单）、`config/company.js`（企查查 CLI）。

## 一、空运单（AWB，按 IATA 三字码前缀路由）

检测规则：11 位主运单号（3 位前缀 + 7 位序号，末位满足 mod-7 校验）才会触发查询；分运单/无法校验的号码直接拒绝。

| 前缀(IATA) | 承运商 | 通道 | 查询地址 | 说明 |
|---|---|---|---|---|
| 057 (AF) / 074 (KL) | AF KLM Cargo | 官网直连 | https://www.afklcargo.com/mycargo/shipment/singlesearch | 详情接口 /mycargo/shipment/detail |
| 074 (KL) | KLM | track-trace 兜底 | https://www.track-trace.com/aircargo | 074 默认走 AFKL 直连，此通道兜底 |
| 235 (TK) | Turkish Cargo | 官网直连 | https://turkishcargo.com/en/cargo-tracking?awbPrefix=235 | URL 参数自动触发搜索 |
| 112 (CK) | China Cargo Airlines | 官网直连 | https://www.eal-ceair.com/cargo-tracking.html | 需 tesseract.js OCR 6 位数字验证码 |
| 157 (QR) | Qatar Airways Cargo | 官网直连 | https://www.qrcargo.com/s/track-your-shipment?documentType=MAWB&documentPrefix=157&documentNumber={号} | Salesforce Community SPA |
| 176 (EK) | Emirates SkyCargo | 官网直连 | https://eskycargo.emirates.com/app/offerandorder/#/shipments/list?type=D&values={号} | URL hash 自动触发搜索 |
| 324 (SC) | Shandong Airlines | 无线上渠道 | — | 无独立货运追踪页，建议人工致电 10100999/95369 |
| 403 | FedEx | 待实现 | https://www.fedex.com/ | 适配器占位 |
| 406 | UPS | 待实现 | https://www.ups.com/ | 适配器占位 |
| (074 属 KLM，非 DHL) | DHL | 待实现 | https://www.dhl.com/ | 适配器占位 |

## 二、集装箱（Container，按 4 字母前缀路由）

| 前缀 | 承运商 | 通道 | 查询地址 |
|---|---|---|---|
| COSU / CSNU / CBHU / CSLU | COSCO | 官网直连 | https://elines.coscoshipping.com/ebusiness/ |
| MSKU / MAEU / MRKU / MRSU | Maersk | 官网直连 | https://www.maersk.com/tracking/{箱号} |
| MSCU / MEDU / MSDU / MSMU | MSC | 官网直连 | https://www.msc.com/en/track-a-shipment |
| 其他一切前缀 | Track-Trace 通用 | track-trace 聚合 | https://www.track-trace.com/container |

> ONE / Hapag / CMA CGM / Evergreen / 租箱（TCKU/SEGU/FDCU 等）/ 未知前缀统一走 track-trace 通用适配器，按前缀自动识别并在跳转承运商官网后抓取页面文本。

## 三、提单（Bill of Lading）

| 前缀 | 承运商 | 说明 |
|---|---|---|
| COSU / CSNU / CBHU / CSLU | COSCO | 已配置路由，适配器待实现 |
| MAEU | Maersk | 官网直连免登录 |
| MSC | MSC | 不支持提单（仅集装箱） |

## 四、公司（Company）

优先查国内工商（企查查 qcc-agent-cli），未命中转 Bing 线索发现并按注册地路由到海外官方注册机构。

**国内工商 CLI（`.env` 配置）**

| 命令模板 | 维度 |
|---|---|
| `qcc company get_company_registration_info {name}`（COMPANY_CLI_CMD） | 工商基础 |
| `qcc company get_shareholder_info {name}`（COMPANY_CLI_SHAREHOLDER_CMD） | 股权结构 |
| `qcc risk get_judicial_documents {name}`（COMPANY_CLI_RISK_CMD） | 司法 + 经营风险 |

**海外官方注册机构（Bing 判定注册地后路由）**

| 注册地 | 机构 | 查询地址 | 免费 |
|---|---|---|---|
| 中国香港 | 香港公司注册处 ICRIS | http://www.icris.cr.gov.hk/csci/ | 基本资料免费 / 详细收费 |
| 中国台湾 | 经济部商工登记公示 gcis | https://findbiz.nat.gov.tw/fts/query/QueryList/queryList.do?qType=0&qVal={name} | 免费 |
| 英属维尔京 | BVIFSC | http://www.bvifsc.vg/en-gb/divisions/registryofcorporateaffairs/certificateverification.aspx | 仅证书验证 |
| 新加坡 | ACRA | https://www.acra.gov.sg/ | BizFile+ 基本资料免费 |

## 五、个人（Person）

- Bing 搜索姓名 → 提取关联公司 / 职位 / 司法涉诉线索（`utils/bing.js`）。
- 地址：https://www.bing.com（搜索结果页），无固定目标站。

## 六、名单筛查（Roster）

| 用途 | 地址 |
|---|---|
| Dow Jones RiskCenter 搜索 | https://riskcenter.dowjones.com/search/simple |
| SSO 登录 | https://sso.accounts.dowjones.com/login-page |

> 凭据经 `.env` 的 `DOWJONES_USER` / `DOWJONES_PASS` 提供；未配置返回 `requires_login`。

## 附：报告层「尝试地址」兜底（`generate.js` CARRIER_ENTRY）

查询失败且适配器未带回 `url` 时，报告用以下地址作为「尝试地址」标注：

- AF KLM Cargo: https://www.afklcargo.com/mycargo
- Qatar Airways Cargo: https://www.qrcargo.com/s/track-your-shipment
- Turkish Cargo: https://turkishcargo.com/en/cargo-tracking
- Emirates SkyCargo: https://eskycargo.emirates.com
- China Cargo Airlines: https://www.eal-ceair.com/cargo-tracking.html
- Shandong Airlines: https://www.sda.cn
- Maersk Line: https://www.maersk.com/tracking/
- MSC: https://www.msc.com/track-a-container
- COSCO: https://elines.coscoshipping.com/
- Track-Trace: https://www.track-trace.com/container
- Dow Jones RiskCenter: https://riskcenter.dowjones.com/search/simple
- DHL: https://www.dhl.com/cn-zh/home/tracking.html
- FedEx: https://www.fedex.com/fedextrack/
- UPS: https://www.ups.com/track