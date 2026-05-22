- Phase 1：项目结构整理，已完成
- 当前不要大改架构
- 后续每次修改代码前，先阅读 AGENTS.md、PROJECT_CONTEXT.md、docs/DEVELOPMENT_LOG.md
- 每次完成一个阶段后，把变更记录追加到 docs/DEVELOPMENT_LOG.md

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
