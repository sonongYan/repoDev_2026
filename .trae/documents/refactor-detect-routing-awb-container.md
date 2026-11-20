# 箱号 / 空运单 检测与路由重构

## Context（背景）

项目现有两大查询类型（箱号 CONTAINER、空运单 AWB）的**检测(`utils/detect.js`)与路由逻辑**存在两个问题：

1. **箱号**：只有前缀命中 `CONTAINER_PREFIX_MAP`（COSCO/Maersk/MSC/ONE/Hapag/CMA/Evergreen）才路由到对应适配器；租箱前缀（TCKU/TNU 等）及一切未知前缀会返回 null，最终在 `core/tracker.js` 报"无法识别承运商"。
2. **空运单**：当前只要"11 位数字 + 前缀在已知列表"就判定为 AWB 并提交查询，**没有区分主单(master)与分单(house)**，也未做 IATA mod-7 校验位验证，导致分单被误当作主单送去查询。

用户要求：

* **箱号**：MSC、COSCO、马士基(Maersk) 这些有官网的走官网；**其余所有箱号**（包括 ONE/Hapag/CMA/Evergreen 与租箱/未知前缀）统一走 **track-trace 聚合适配器**自动识别，不再各自建适配器。

  * 用户已确认：合并选项采用"合并为一个通用适配器"（删除 ONE/Hapag/CMA/Evergreen 单独适配器）。

* **空运单**：增加**主单/分单判断 + IATA mod-7 校验位验证**。只有"11 位主单 + 校验通过 + 有对应航司适配器"才查询；分单/无法验证 → **不查询**，返回结构化说明。

  * 用户已确认：分单响应采用"不查询、返回说明"。

## 当前相关文件

| 文件                   | 作用                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `utils/detect.js`    | `detectQueryType()` 判定类型；`detectContainerCarrier()`/`detectAwbCarrier()` 前缀→承运商                         |
| `core/types.js`      | `QUERY_TYPES`、`CARRIERS` 枚举                                                                             |
| `config/carriers.js` | 各承运商 `containerPrefixes`/`awbPrefixes`/`adapterFile`/`channel`，`CONTAINER_PREFIX_MAP`/`AWB_PREFIX_MAP`  |
| `core/tracker.js`    | `track()`：analyze → 无 carrier 即报错 → resolve adapter → execute                                           |
| `adapters/maersk.js` | `TrackTraceBasedAdapter`（通用 track-trace 箱号查询，`carrierLabel` 可空）、Maersk/MSC/ONE/Hapag/CMA/Evergreen 等适配器 |
| `adapters/index.js`  | `registerDefaults()` 注册全部适配器                                                                            |

## 修改方案

### 1. 空运单：主单/分单 + 校验位（核心新逻辑）

在 `utils/detect.js` 中新增 AWB 识别函数，并让检测返回主单/校验结果：

```
功能函数 parseAwbCheckDigit(awbCompact):
  // awbCompact 为 11 位数字串
  序列号 = awbCompact.slice(3, 10)   // 第 4~10 位（7 位）
  校验位 = Number(awbCompact[10])     // 最后 1 位
  计算值 = Number(序列号) % 7
  返回 isValidAWB = (计算值 === 校验位)
```

* **主单**：`/^\d{11}$/` 且 前 3 位为航司代码 且 mod-7 校验通过

* **分单/非主单**：字母+数字混合、或数字但不符合 11 位、或 mod-7 校验失败

修改 `detectQueryType`/`analyze`：

* `analyze()` 返回值里新增元信息字段：

  * `awbKind`：`'master' | 'house' | null`

  * `awbValidated`：`true | false | null`

  * `checkDigitOk`：布尔或 null

* 11 位数字的输入：不再要求前缀命中已知表才算 AWB。只要形如 11 位数字即可判为 `QUERY_TYPES.AIR_WAYBILL`，再辅以 `awbKind`/`checkDigitOk` 供 tracker 决定是否查询。

* 非 11 位但有字母/数字混合、疑似分单的目标串：仍归类为 AWB（标 `awbKind='house'`），避免落到 cargo\_code/BL。

### 2. 箱号：prefix → 官网 / track-trace 聚合分流

* **保留官网直连/跳转专属适配器**：COSCO（直连官网）、Maersk、MSC（复用 `TrackTraceBasedAdapter` 不选 label 或仍选对应 label）。

* **删除** 单独适配器：`OneAdapter`、`HapagLoydAdapter`、`CmaCgmAdapter`、`EvergreenAdapter`（从 `adapters/maersk.js` 与该文件导出、`adapters/index.js` 注册移除）。

* **新增通用集合适配器** `TrackTraceGenericContainerAdapter`（放在 `adapters/maersk.js` 或独立文件）：

  * 复用现有 `TrackTraceBasedAdapter._goThroughTrackTrace(query, null, options)`（`carrierLabel=null` 时不选具体航司，交给 track-trace 按前缀自动识别），`parseTrackTraceContainer` 解析。

  * `carrier` 名用一个**伪承运商 key**，如 `CARRIERS.TRACK_TRACE_GENERIC = 'Track-Trace'`（新增到 `core/types.js` 枚举）。

* **carriers.js**：

  * 移除 ONE/Hapag/CMA/Evergreen 的条目（或保留条目标注 `adapterFile:null`），从 `CONTAINER_PREFIX_MAP` 抽走它们的前缀。

  * 新增一条伪承运商 `CARRIERS.TRACK_TRACE_GENERIC` 配置，但**不**把所有前缀写进 `containerPrefixes`（因为兜底应是"catch-all"而非按前缀命中）。

### 3. 检测路由改动（`utils/detect.js` + `core/tracker.js`）

`detectContainerCarrier(containerNumber)` 改为：

```
prefix = 前4位大写
if prefix ∈ 官网承运商前缀集（COSCO/Maersk/MSC 的 containerPrefixes 并集）:
    return 对应 carrier（如 COSCO/MSKU-马士基/MSCU-MSC）
else:
    return CARRIERS.TRACK_TRACE_GENERIC   // 一切未知/租箱前缀走通用 track-trace
```

即 `CONTAINER_PREFIX_MAP` 只保留官网系前缀，其余由 catch-all 兜底。可新增一个 `buildDirectContainerPrefixIndex()`。

`core/tracker.js` 在 resolve adapter 前增加 AWB 门控：

```
if queryType === AIR_WAYBILL:
    若 analysis.awbKind !== 'master' 或 checkDigitOk !== true:
        return { success:false, error:'分单号/无法验证的运单号，不执行查询（仅支持 IATA 校验通过的主单）', analysis }
    // 否则继续
```

读入这些字段后仍需按原逻辑 resolve adapter（AWB 仍走各自航司官网直连适配器，如 AFKL/Qatar/Turkish/Emirates/ChinaCargo）。

### 4. 注册表清理（`adapters/index.js`）

* 移除导入与注册：One/Hapag/CMA/Evergreen

* 新增注册：`new TrackTraceGenericContainerAdapter()`

## 需要保留的既有能力（复用，不重写）

* `TrackTraceBasedAdapter` 及 `_goThroughTrackTrace`（支持不选航司自动识别 + `parseTrackTraceContainer`）— 通用聚合适配器直接继承/复用

* COSCO 官网直连 `CoscoAdapter`（不变）

* AWB 各航司官网直连适配器（AFKL/Qatar/Turkish/Emirates/ChinaCargo）路由不变

## 验证方案

1. **单元验证 AWB 检测**：`node -e` 直接调 `analyze()`：

   * `07439882393` → `awbKind:'master', checkDigitOk:true, queryType:'awb'`

   * `074-39882393`（带连字符）→ 同上

   * 一个校验位错误的 11 位数字 → `checkDigitOk:false`

   * 字母+数字混合（如 `HAWB-123ABC`）→ `awbKind:'house'`，tracker 返回"不查询"说明
2. **箱号分流验证**：`analyze()`：

   * `MSKU...` → carrier=Maersk；`COSU...`/`MSCU...` → 对应

   * `TCKU...`/`ONEU...`/`CMAU...`/随机前缀 → carrier=`Track-Trace`（通用）
3. **端到端**：启动 `node server.js`，POST：

   * 主单 AWB → 应触发航司查询

   * 分单 → 应返回"不查询"且不发起浏览器

   * `TCKU7159016` → 走通用 track-trace 聚合（能返回 Brief 而非报"无法识别承运商"）

