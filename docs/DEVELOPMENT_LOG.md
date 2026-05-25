- Phase 1：项目结构整理，已完成
- 当前不要大改架构
- 后续每次修改代码前，先阅读 AGENTS.md、PROJECT_CONTEXT.md、docs/DEVELOPMENT_LOG.md
- 每次完成一个阶段后，把变更记录追加到 docs/DEVELOPMENT_LOG.md

## 2026-05-24 Phase 4A / Ozon 官方 API + 商品识别报告竖切片

- 修改目标：将选品预判助手从手动占位升级为 Ozon 优先的智能分析入口，并为 Cloudflare Worker 后端和 Ozon API 凭证安全接入做第一版实现。
- 涉及文件：AGENTS.md、index.html、css/style.css、js/main.js、js/product-selection.js、worker/index.js、worker/wrangler.toml.example、docs/PHASE_4A_OZON_API_AI_PLAN.md、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：启用 `开始智能分析` 按钮；新增分析进度、商品识别摘要、关键词/标签、Ozon API 状态和数据限制展示；新增无后端时的明确错误报告和示例报告；新增 Cloudflare Worker 的 `/api/health` 与 `/api/analyze-product`；Worker 支持公开页面 meta 读取、规则关键词/类目提取、Ozon API 凭证健康检查。
- 验收方式：点击空链接/无效链接应显示错误；无 Worker URL 时应显示 `API 服务未连接` 而不是空白等待；示例报告可直接渲染；原利润计算、汇率、预设、localStorage、CSV 导出保持可用；运行 `node --check js/product-selection.js js/main.js worker/index.js`。
- 已知风险：尚未部署 Cloudflare Worker，也未配置真实 Ozon 凭证；Phase 4A 只做 Ozon API 健康检查和来源链接公开信息识别，不生成未经验证的全平台竞品数量、均价、评分评论或销量。

## 2026-05-25 Phase 4A / Worker 连接配置与部署说明

- 修改目标：补齐上次未完成的前端 Worker 地址配置入口、页面加载健康检查和部署说明。
- 涉及文件：index.html、js/config.js、js/main.js、js/product-selection.js、docs/PHASE_4A_OZON_API_AI_PLAN.md、docs/PHASE_4A_DEPLOYMENT_GUIDE.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 `js/config.js` 作为唯一前端 Worker URL 配置位置；页面加载时调用 Worker health helper，未配置 Worker 时在 Ozon API 状态卡中显示明确说明；新增部署文档，说明 Cloudflare Worker URL、Ozon 环境变量和手动验证步骤。
- 验收方式：`node --check js/config.js js/product-selection.js js/main.js worker/index.js`；`git diff --check`；打开页面确认未配置 Worker 时显示 API 服务未连接。
- 已知风险：仍未执行 Cloudflare 真实部署，也未配置 Ozon 凭证；这些步骤需要用户本人登录 Cloudflare/Ozon 后台完成。

## 2026-05-21 Phase 2 / 任务 1：基础输入校验与提示

- 修改目标：补齐售价、汇率、重量、尺寸、成本、费率、补贴相关输入的基础校验和页面提示。
- 涉及文件：index.html、css/style.css、js/main.js、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增统一输入提醒区域；为数值输入补充最小值属性；在 main.js 中增加统一读取和校验逻辑；明显错误标红并提示，异常高/低值标黄提醒。
- 验收方式：输入空售价/空重量、负数、0 汇率、超高费率、尺寸只填一部分时，页面应显示提示；正常输入时，原有自动计算、物流匹配、利润计算继续可用。
- 已知风险：异常值阈值是第一版经验判断，只做提醒不做强制业务结论，后续可根据真实运营数据调整。

## 2026-05-21 Phase 2 / 任务 2：利润决策提示

- 修改目标：根据利润和利润率增加辅助决策提示，帮助卖家快速识别亏损风险、低利润、健康利润和较好利润。
- 涉及文件：index.html、css/style.css、js/main.js、docs/DEVELOPMENT_LOG.md。
- 修改内容：在结果区新增利润辅助判断卡片；在 main.js 中增加简单阈值规则和渲染逻辑；补充轻量状态样式。
- 验收方式：调整采购成本或售价，让利润率分别进入亏损、低于 10%、10%-25%、25% 及以上区间，提示状态应同步切换。
- 已知风险：阈值是 MVP 阶段的辅助判断，不代表平台或商品的绝对经营结论，后续可根据实际类目和运营经验调整。

## 2026-05-22 Phase 2 / 成本与结果解释增强

- 修改目标：在结果区增加轻量解释，让卖家理解总成本构成、利润率含义和当前主要成本压力。
- 涉及文件：index.html、css/style.css、js/main.js、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增结果解释 / 成本解释区域；在 main.js 中增加规则化成本解释和最高成本压力识别；新增业务规则和手动测试文档。
- 验收方式：输入有效数据后显示总成本构成、利润率含义和最高成本压力；无效输入时不显示误导解释；CSV 导出保持可用。
- 已知风险：最高成本压力只基于当前已计算金额，不代表完整经营结论。

## 2026-05-22 Documentation / AI 工具审计与未来自动化路线图

- 修改目标：Added AI tool audit and future automation roadmap documentation.
- 涉及文件：docs/CURRENT_AI_TOOL_AUDIT.md、docs/AI_AUTOMATION_ROADMAP.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：记录当前 AI/自动化相关文件现状；规划未来夜间自动化工作流；明确 Codex、Hermes/分析 Agent、用户的职责边界。
- 验收方式：确认两个文档存在，且未修改产品功能、依赖、部署或自动化运行配置。
- 已知风险：如果过早引入自动化运行时，会分散 Phase 2 MVP 注意力，并增加误改主分支、误部署或泄露密钥的风险。

## 2026-05-22 Documentation / 手动夜间任务模板与 Runbook

- 修改目标：Added manual night-work template and runbook for future Codex automation.
- 涉及文件：docs/NIGHT_TASK_TEMPLATE.md、docs/NIGHT_RUNBOOK.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增夜间任务模板；新增当前手动夜间工作流程；明确睡前准备、夜间模拟、早晨 review、安全规则和未来自动化等级。
- 验收方式：确认两个文档存在，且未修改产品功能、依赖、部署或真实自动化配置。
- 已知风险：当前仅为文档准备，不能当作已经具备自动化能力。

## 2026-05-22 Night Simulation / localStorage 表单保存与恢复

- 修改目标：为当前利润决策 MVP 增加简单 localStorage 表单保存/恢复，模拟一次安全夜间任务。
- 涉及文件：index.html、js/storage.js、js/main.js、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 storage.js 安全读写本地表单状态；页面加载时恢复上次输入；输入或选择变化时保存用户可编辑字段和平台/供应商/时效。
- 验收方式：填写有效值后刷新应恢复；保存的无效值刷新后仍进入校验；正常计算、诊断、成本解释、物流匹配和 CSV 导出保持可用。
- 已知风险：localStorage 是浏览器本地状态，不适合作为账号级保存；当前没有清空按钮，本阶段不新增复杂 UI。

## 2026-05-22 Documentation / Phase 2 验收报告

- 修改目标：Created Phase 2 acceptance report.
- 涉及文件：docs/PHASE_2_ACCEPTANCE_REPORT.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：总结 Phase 2 已完成能力、当前项目结构、业务价值、技术稳定性、风险限制、最终手动验收清单和下一阶段建议。
- 验收方式：确认验收报告存在；运行现有 JS 文件的 `node --check`；不修改产品行为或业务逻辑。
- 已知风险：报告结论仍需要用户完成最终浏览器手动验证后再正式关闭 Phase 2。

## 2026-05-23 Documentation / Phase 3 产品化路线图

- 修改目标：Created Phase 3 productization roadmap.
- 涉及文件：docs/PHASE_3_ROADMAP.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：规划 Phase 3 产品化定位、推荐范围、里程碑顺序、首个建议任务，以及未来 AI/API 和自动化准入条件。
- 验收方式：确认路线图文档存在；不修改产品功能、业务逻辑、部署配置或 AGENTS.md。
- 已知风险：Phase 3 仍应聚焦产品化打磨，不应过早引入真实 AI API、后端或自动化运行时。

## 2026-05-23 Documentation / Phase 3 路线图评审摘要

- 修改目标：Created Phase 3 roadmap review summary.
- 涉及文件：docs/PHASE_3_REVIEW_SUMMARY.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：评审 Phase 3 路线图，区分可接受、应延后和当前拒绝的方向；明确推荐首个 Phase 3 任务；草拟未来可追加到 AGENTS.md 的 Phase 3 段落。
- 验收方式：确认评审摘要存在；不修改产品功能、业务逻辑、部署配置或 AGENTS.md。
- 已知风险：评审摘要仅用于决策，不代表 Phase 3 已开始执行。

## 2026-05-23 Documentation / Phase 3 AGENTS.md 规则确认

- 修改目标：Updated AGENTS.md with confirmed Phase 3 development rules.
- 涉及文件：AGENTS.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：在 AGENTS.md 追加简洁的 Phase 3 Development Rules，明确当前重点、允许范围、禁止范围、执行规则和推荐首个任务。
- 验收方式：确认仅修改文档；不修改产品功能、业务逻辑、依赖或部署配置。
- 已知风险：Phase 3 仍需保持小步迭代，避免过早进入真实 AI/API、后端或自动化运行时。

## 2026-05-23 Documentation / Phase 3 卖家场景示例

- 修改目标：Created seller scenario examples for Phase 3.
- 涉及文件：docs/SELLER_SCENARIOS.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 10 个面向 Ozon/Wildberries/Yandex 卖家的业务场景示例，说明输入值、工具预期展示、卖家解读、下一步动作和风险提醒。
- 验收方式：确认仅新增/更新文档；不修改产品功能、业务逻辑、依赖或部署配置。
- 已知风险：示例基于当前本地规则和 MVP 行为，后续如果物流规则或计算逻辑变化，需要同步复核示例。

## 2026-05-23 Documentation / Phase 3 预设模板设计

- 修改目标：Created preset template design document for Phase 3.
- 涉及文件：docs/PRESET_TEMPLATE_DESIGN.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：将卖家场景转换为未来可实现的轻量预设模板设计，明确模板目的、建议输入、预期信号、实现边界、风险等级和首个推荐实现模板。
- 验收方式：确认仅新增/更新文档；不修改产品功能、业务逻辑、依赖、AGENTS.md 或部署配置。
- 已知风险：预设模板后续进入 UI 前仍需逐个手动验证，避免让示例值被误解为真实平台政策或保证利润。

## 2026-05-23 Phase 3 / Healthy Profit Baseline 预设模板

- 修改目标：实现第一个安全预设模板 Healthy Profit Baseline。
- 涉及文件：index.html、css/style.css、js/presets.js、js/main.js、docs/business-rules.md、docs/manual-test-cases.md、docs/PRESET_TEMPLATE_DESIGN.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增一个轻量预设选择/应用区域；新增单一预设数据文件；应用预设时只填充现有字段并复用现有计算、校验、诊断、成本解释和 localStorage 保存流程；补充业务规则和手动测试用例。
- 验收方式：应用预设后确认字段填充、计算更新、校验仍生效、诊断和成本解释更新、刷新后 localStorage 恢复、CSV 导出仍可用；运行 `node --check` 检查 JS 文件。
- 已知风险：当前只实现一个预设，后续新增预设前仍需逐个评估风险，避免示例值被误解为真实平台实时数据或利润保证。

## 2026-05-23 Phase 3 / 预设与诊断保守性修正

- 修改目标：修正 Healthy Profit Baseline 预设应用后的决策解释，避免 10%-20% 左右利润率被误读为健康或可放量。
- 涉及文件：index.html、js/main.js、docs/business-rules.md、docs/manual-test-cases.md、docs/PRESET_TEMPLATE_DESIGN.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：将利润判断改为更保守的区间表达；10%-20% 归为勉强可测并建议小量验证；20%-30% 才表达为有一定测试空间；30% 以上才表达为较强但仍不保证；有效输入后同步渲染保守规则诊断；预设说明补充“应用会替换当前输入值”。
- 验收方式：应用 Healthy Profit Baseline 后确认利润率约 15.88% 时显示保守提示；确认字段填充、计算、校验、诊断、成本解释、localStorage 和 CSV 导出仍可用；运行 `node --check` 检查 JS 文件。
- 已知风险：阈值仍是 MVP 阶段的经验规则，后续需要根据真实类目、退货、广告和物流数据继续校准。

## 2026-05-23 Phase 3 / 当日参考汇率助手

- 修改目标：新增轻量当日参考汇率助手，减少卖家每天手动查汇率的重复工作，同时保留手动输入。
- 涉及文件：index.html、css/style.css、js/exchange-rate.js、js/main.js、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：在汇率输入附近新增 `获取当日参考汇率` 按钮和状态说明；通过 Frankfurter no-key public API 获取 CNY/RUB 参考汇率；成功后填入现有汇率字段并复用现有计算、校验、诊断、成本解释和 localStorage 保存流程；同日成功结果做轻量 localStorage 缓存；失败时保留原手动值并提示手动填写。
- 验收方式：确认手动汇率仍可编辑；点击按钮可获取并填入参考汇率；计算、校验、诊断、成本解释、localStorage 和 CSV 导出仍可用；运行 `node --check` 检查 JS 文件。
- 已知风险：参考汇率来自外部公共服务，可能受网络、CORS、服务可用性或数据发布时间影响；页面必须始终允许手动填写。

## 2026-05-23 Phase 3 / 汇率助手布局与诊断一致性修正

- 修改目标：修正当日参考汇率助手在表单中的视觉占用，并调查预设成本与诊断一致性问题。
- 涉及文件：index.html、css/style.css、js/main.js、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：将汇率输入和参考汇率按钮调整为紧凑同行布局；将来源/日期/免责声明压缩为低噪音辅助说明；确认 Healthy Profit Baseline 会按设计替换当前输入，示例采购成本为 50、售价为 100，不存在公式层面的固定成本；成本压力项增加明确的同值排序规则，保证相同输入下诊断和建议稳定。
- 验收方式：应用预设后手动修改采购成本应立即重算；同一组输入重复计算应得到相同诊断；参考汇率按钮保持紧凑；localStorage、失败提示和 CSV 导出保持可用；运行 `node --check` 和 `git diff --check`。
- 已知风险：预设仍是示例数据，卖家需要用真实采购、广告、退货和物流数据替换后再判断。

## 2026-05-24 Phase 3 / 页面视觉简化与汇率体验优化

- 修改目标：将当前利润决策页面改得更简洁、克制、易读，并降低汇率输入区域的操作负担。
- 涉及文件：index.html、css/style.css、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：页面标题调整为“利润决策助手”；移除主要标题和分区标题中的 emoji；保留现有字段 ID 和计算结构；新增轻量页面说明；将视觉风格调整为浅灰背景、白色面板、细边框、低阴影、紧凑分段平台切换和更稳定的响应式网格；将汇率按钮文案压缩为“今日参考”，并强调默认仍可手动填写。
- 验收方式：桌面端和移动端页面无明显文字重叠或按钮溢出；手动汇率、今日参考汇率、预设模板、利润计算、诊断、成本解释、localStorage 和 CSV 导出保持可用；运行 `node --check`、`git diff --check` 并进行浏览器目测验证。
- 已知风险：本次主要是视觉优化，仍不是完整产品设计系统；后续如果继续扩展页面，应避免重新堆叠大面积卡片和高饱和渐变。

## 2026-05-24 Phase 3 / 选品预判助手预留

- 修改目标：将原来的 API / AI 占位区升级为手动/半自动的规则版选品预判助手，为未来 AI/API 功能预留清晰结构。
- 涉及文件：index.html、css/style.css、js/main.js、js/product-selection.js、docs/AI_PRODUCT_SELECTION_PLAN.md、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增选品预判字段，包括目标平台、商品链接、图片地址、目标类目、竞品数量、竞品价格、评分评论、广告占比、广告类型、店铺类型和订单区间；新增规则版报告，结合当前利润率、折合卢布售价、竞品均价、竞争门槛、广告假设和店铺状态输出 `建议小量测试`、`谨慎测试`、`暂不建议` 或 `等待数据`；新增文档说明边界和未来 API 准入条件。
- 验收方式：缺少关键字段时显示等待状态；低利润且 30% 广告占比时提示暂不建议；高于竞品均价且新店/杂货店时提示转化风险；高竞品数量或高评论门槛时提示竞争压力；现有利润计算、汇率助手、预设、localStorage 和 CSV 导出保持可用；运行 `node --check`、`git diff --check` 并进行浏览器验证。
- 已知风险：第一版竞品数据全部依赖人工输入，报告只适合作为运营参考，不能代表平台实时数据、真实 AI 结论或销售保证。

## 2026-05-24 Phase 3 / 选品自动采集目标修正

- 修改目标：修正选品预判助手的产品方向，明确最终目标不是手动填写竞品数据，而是从全球任意商品链接自动识别商品并采集三平台相似竞品。
- 涉及文件：index.html、css/style.css、js/main.js、js/product-selection.js、docs/AI_PRODUCT_SELECTION_PLAN.md、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：将入口文案改为“来源商品链接（全球任意网站）”；说明未来自动流程包括识别商品图、类目、属性、卖点、痛点、关键词和主题标签，并在 Ozon/Wildberries/Yandex 搜索相似竞品；将临时手动字段收进折叠区，标记为未来自动采集和 AI 回填字段；将等待状态改为提示后端/API 采集尚未接入。
- 验收方式：页面应优先展示来源商品链接入口；折叠区仍可用于临时校验规则报告；缺少自动采集数据时显示等待状态而不是误导为最终人工录入流程；现有利润计算、汇率助手、预设、localStorage 和 CSV 导出保持可用。
- 已知风险：当前仍未实现真实自动采集；要完成用户目标，后续必须新增后端、合规数据源/API、图片/文本识别和三平台相似商品检索能力。
