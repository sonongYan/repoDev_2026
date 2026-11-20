# 尽调报告

生成时间：2026-11-12 15:24:39

## 摘要

本次尽调共核查空运单2票、集装箱2个、公司2家、名单2条。空运单235-97594534（土耳其航空）查询成功，货物已从香港经伊斯坦布尔中转飞抵突尼斯并进入通知提货环节；空运单176-61342982（阿联酋航空）查询超时失败，Bing兜底未命中有效信息。集装箱MSKU7294860（马士基）仅取得箱型与离港日期，航线及轨迹缺失；MSMU1566982（地中海航运）轨迹完整，已空箱还箱至巴西纳韦甘蒂斯。两家公司因企查查CLI故障均未取得工商数据，仅Bing线索；名单筛查中МАРИЯ СЕРГЕЕВНА КУЗНЕЦОВА命中3条（含制裁与PEP），МУСЛИМ命中116条（含制裁与PEP），需重点人工复核。整体状态为部分完成，存在多项需人工处理事项。

## 空运单 23597594534（土耳其航空货运）

**基础信息**

- 运单号：23597594534
- 承运人/航空公司：土耳其航空货运（Turkish Cargo）
- 数据来源：https://www.turkishcargo.com/en/cargo-tracking?awbPrefix=235&awbNumber=97594534

**航线**

- 航线：香港国际机场（HKG） → 突尼斯迦太基国际机场（TUN），经 伊斯坦布尔国际机场（IST） 中转

**货物信息**

- 件数：6；重量：138 kg

**当前状态**

- 当前状态：运输中

**运输轨迹**

| 时间 | 状态 | 地点 | 航班名 |
| --- | --- | --- | --- |
| 2026-03-21 17:25 | 已受理 | 香港国际机场（HKG） |  |
| 2026-03-21 23:20 | 已发运 | 香港国际机场（HKG） | TK0071 |
| 2026-03-22 07:39 | 已订舱 | 香港国际机场（HKG） | TK0071 |
| 2026-03-22 07:39 | 已订舱 | 伊斯坦布尔国际机场（IST） | TK6114 |
| 2026-03-22 10:55 | 已收货 | 伊斯坦布尔国际机场（IST） | TK0071 |
| 2026-03-24 23:13 | 已发运 | 伊斯坦布尔国际机场（IST） | TK6114 |
| 2026-03-25 00:11 | 已通知收货人 | 突尼斯迦太基国际机场（TUN） |  |

## 空运单 176-61342982（阿联酋航空货运）

- 查询结果：失败，错误信息「Emirates eSkyCargo 打开失败: page.goto: Timeout 60000ms exceeded.
Call log:
[2m  - navigating to "https://eskycargo.emirates.com/app/offerandorder/#/shipments/list?type=D&values=17661342982", waiting until "domcontentloaded"[22m
」
- 尝试地址：https://eskycargo.emirates.com/app/offerandorder/#/shipments/list?type=D&values=17661342982
- Bing 兜底地址：https://www.bing.com/search?q=176-61342982

> 该运单网站上未有轨迹信息。

## 集装箱 MSKU7294860（Maersk Line）

**基础箱信息**

- 箱号：MSKU7294860
- 箱型：20 英尺干货标准箱（20' Dry Standard）
- 数据来源：https://www.maersk.com.cn/tracking/MSKU7294860

**航线起讫**


**关键时间节点**

- 离港：2026-09-22

**运输轨迹**

> 该箱网站上未查到轨迹信息。

## 集装箱 MSMU1566982（Mediterranean Shipping）

**基础箱信息**

- 箱号：MSMU1566982
- 箱型：20 英尺干货箱（20' DRY VAN）
- 数据来源：https://www.msccargo.cn/en/track-a-shipment

**航线起讫**

- 始发港：Gioia Tauro, IT
- 目的港：Itapoa, BR
- 中转港：Navegantes, BR、瓦伦西亚（Valencia, ES）

**关键时间节点**

- 最近更新时间：12.11.2026 at 08:21 Central Europe Standard Time

**运输轨迹**

| 时间 | 港口 | 码头/设施 | 事件类型 | 船名/航次 |
| --- | --- | --- | --- | --- |
| 2026-09-08 | Gioia Tauro, IT | 集装箱码头（Medcenter Container Terminal） | 空箱 |  |
| 2026-09-09 | Gioia Tauro, IT | 集装箱码头（Medcenter Container Terminal） | 已收货 |  |
| 2026-09-18 | Gioia Tauro, IT | 集装箱码头（Medcenter Container Terminal） | 已装船 | MSC MICHIGAN VII ML637A |
| 2026-09-21 | 瓦伦西亚（Valencia, ES） | 码头（M.S.C. Terminal Valencia） | 已卸船 | MSC MICHIGAN VII ML637A |
| 2026-09-22 | 瓦伦西亚（Valencia, ES） | 码头（M.S.C. Terminal Valencia） | 已装船 | MSC AMALFI MM637A |
| 2026-10-12 | Itapoa, BR | Itapoa Terminais Portuarios S/A | 已卸船 | MSC AMALFI MM641R |
| 2026-10-22 | Itapoa, BR | Itapoa Terminais Portuarios S/A | Import to consignee |  |
| 2026-10-27 | Navegantes, BR | Msc Mediterranean Logistica Ltda | 已收货 |  |

## 公司 阿里巴巴（中国）有限公司

- 企查查查询失败：企查查 CLI 全部命令执行失败: basic: Command failed: qcc company get_company_registration_info 阿里巴巴（中国）有限公司 --json
CLI 启动失败: EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'
; shareholders: Command failed: qcc company get_shareholder_info 阿里巴巴（中国）有限公司 --json
CLI 启动失败: EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'
; risk: Command failed: qcc risk get_judicial_documents 阿里巴巴（中国）有限公司 --json
CLI 启动失败: EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'

- 备注：企查查渠道故障（CLI 全部命令执行失败，未取得工商数据）；Bing 线索结果仅供参考，需人工核验；未找到可靠注册地线索，建议补充公司全称/域名/注册号后再查
- 疑似官网：1688.com

## 公司 华为技术有限公司

- 企查查查询失败：企查查 CLI 全部命令执行失败: basic: Command failed: qcc company get_company_registration_info 华为技术有限公司 --json
CLI 启动失败: EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'
; shareholders: Command failed: qcc company get_shareholder_info 华为技术有限公司 --json
CLI 启动失败: EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'
; risk: Command failed: qcc risk get_judicial_documents 华为技术有限公司 --json
CLI 启动失败: EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'

- 备注：企查查渠道故障（CLI 全部命令执行失败，未取得工商数据）；Bing 线索结果仅供参考，需人工核验；Bing 线索提示为国内主体，但国内工商注册未命中，建议人工核对公司全称
- 疑似官网：huawei.com

## 名单

### МАРИЯ СЕРГЕЕВНА КУЗНЕЦОВА

- 命中总数：3
- 数据来源：Dow Jones RiskCenter（https://riskcenter.dowjones.com/search/simple）
- 命中类型：制裁、政治公众人物

**命中明细**

| 姓名 | 性别 | 出生日期 | 国籍 | 详情 | 标签 |
| --- | --- | --- | --- | --- | --- |
| Kuznetsova, Maria Sergeevna | 女 |  | 俄罗斯 | FCDO (UK) Sanctions List - Asset Freeze | 其他官方名单、制裁 |
| Kuznetsova, Mariya Sergeevna | 女 |  | 俄罗斯 | Judge, Ulyanovsk Region | 政治公众人物 |
| Kuznetsova, Mariya Sergeevna | 女 | 1988年 4月 1日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 制裁 |

### МУСЛИМ

- 命中总数：116
- 数据来源：Dow Jones RiskCenter（https://riskcenter.dowjones.com/search/simple）
- 命中类型：制裁、政治公众人物

**命中明细**

| 姓名 | 性别 | 出生日期 | 国籍 | 详情 | 标签 |
| --- | --- | --- | --- | --- | --- |
| Guchayev, Zaurbek | 男 | 1975年 9月 4日 | 俄罗斯 | OFAC - Specially Designated Global Terrorist List | 其他官方名单、特殊利益人物/实体、制裁 |
| Akhmaev, Muslim Umarovich | 男 | 1983年 2月 20日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Akhmedov, Muslim Dzhabrailovich | 男 | 2008年 8月 29日 | 未知 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Akhmetkhanov, Muslim V. | 男 |  | 俄罗斯 |  | 特殊利益人物/实体 |
| Akimov, Muslim Pardakulovich | 男 | 1995年 10月 26日 | 未知 | SFIS (Kyrgyzstan) - Terrorist, Extremist and Proliferation of WMD List | 特殊利益人物/实体、制裁 |
| Aliev, Muslim Nurievich | 男 | 1971年 3月 4日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Alikhanov, Muslim Agaevich | 男 | 1967年 6月 5日 | 未知 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Altynbaev, Muslim Mukhtaruly | 男 | 1966年 1月 19日 | 哈萨克斯坦 | See Previous Roles | 政治公众人物 |
| Arsanukaev, Muslim Vakhaevich | 男 | 1975年 10月 24日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Asadullaev, Muslim Asadullaevich | 男 |  | 俄罗斯 |  | 特殊利益人物/实体 |
| Ataev, Muslim Ulubievich | 男 | 1983年 11月 12日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Aushev, Abu-Muslim Zautdinovich | 男 | 1986年 | 俄罗斯 | Judge, Chechnya Republic | 政治公众人物 |
| Aushev, Muslim Akhmetovich | 男 |  | 俄罗斯 | Judge, Federal Arbitration Court | 政治公众人物 |
| Aysultanov, Muslim Sulimovich | 男 | 1992年 11月 2日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 其他官方名单、特殊利益人物/实体、制裁 |
| Bachaev, Muslim | 男 | 1977年 12月 19日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Bagaev, Muslim Salmanovich | 男 | 1977年 10月 9日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Barakhoev, Muslim Magometovich | 男 | 1998年 5月 19日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Baytaziev, Muslim Batyrkhanovich | 男 | 1983年 3月 10日 | 俄罗斯 | Minister of Tourism, Chechnya Republic | 政治公众人物 |
| Bazaev, Muslim Alievich | 男 | 2005年 11月 22日 | 俄罗斯 | Federal Financial Monitoring Services (Russia) Domestic Sanctions List | 特殊利益人物/实体、制裁 |
| Bektepov, Muslim Khaydaruly | 男 | 1964年 2月 20日 | 哈萨克斯坦 | See Previous Roles | 政治公众人物 |

## 异常与待人工处理

- 空运单176-61342982（阿联酋航空）查询失败：Emirates eSkyCargo 页面打开超时（Timeout 60000ms），尝试地址：https://eskycargo.emirates.com/app/offerandorder/#/shipments/list?type=D&values=17661342982；Bing兜底地址：https://www.bing.com/search?q=176-61342982，兜底结果均为无关内容（GB/T 176标准、176号段、娄底舰等），未命中任何货运信息。
- 集装箱MSKU7294860（马士基）查询成功但数据不完整：始发港、目的港、预计到港、最近更新时间及运输轨迹均为空，无法判断当前运输状态，来源：https://www.maersk.com.cn/tracking/MSKU7294860。
- 公司阿里巴巴（中国）有限公司：企查查CLI全部命令执行失败（EPERM: operation not permitted, open 'C:\Users\song\.qcc\cache\tools.json'），未取得工商基础信息、股权结构、对外投资、司法风险及经营异常/处罚数据；Bing线索仅提示疑似官网1688.com及百度百科“成立于2007年3月”，仅供参考，需人工核验。
- 公司华为技术有限公司：企查查CLI全部命令执行失败（同上EPERM错误），未取得工商数据；Bing线索提示总部位于广东省深圳市龙岗区，并给出疑似注册地新加坡（ACRA），但国内工商注册未命中，需人工核对公司全称及注册主体。
- 名单筛查МАРИЯ СЕРГЕЕВНА КУЗНЕЦОВА命中3条，其中1条为英国FCDO制裁名单（资产冻结）、1条为俄罗斯国内制裁名单、1条为政治公众人物（法官），需人工确认是否为目标人员。
- 名单筛查МУСЛИМ命中116条，均为同名或近似名匹配，涉及俄罗斯、哈萨克斯坦等多国制裁及PEP名单，需结合出生日期、国籍等进一步人工甄别。
- 邮件原文与查询结果一致性：邮件列出的空运单、集装箱、公司、名单均与查询实体对应，未发现单号或名称不一致情况。

## 建议

- 对空运单176-61342982建议更换查询渠道（如阿联酋航空官网其他入口或货代系统）重新查询，或联系承运人获取最新状态。
- 对集装箱MSKU7294860建议补充订舱号或提单号，通过马士基其他查询入口重新获取航线及轨迹信息。
- 对两家公司建议修复企查查CLI权限问题后重新查询，或通过国家企业信用信息公示系统、天眼查等渠道人工核验工商、股权及司法风险信息。
- 对名单命中人员建议收集完整身份信息（出生日期、证件号、国籍等）进行二次精确比对，并对制裁/PEP命中项启动合规复核流程。
- 建议对空运单235-97594534的收货人提货进度进行跟踪，确认是否已完成清关提货。