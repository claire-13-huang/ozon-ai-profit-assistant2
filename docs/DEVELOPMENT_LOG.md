- Phase 1：项目结构整理，已完成
- 当前不要大改架构
- 后续每次修改代码前，先阅读 AGENTS.md、PROJECT_CONTEXT.md、docs/DEVELOPMENT_LOG.md
- 每次完成一个阶段后，把变更记录追加到 docs/DEVELOPMENT_LOG.md

## 2026-06-05 Documentation / Phase 2.5 live checkpoint

- 修改目标：记录当前已部署的 AI 测品决策工作流状态，方便后续人工测试、产品判断和边界复核。
- 涉及文件：docs/PHASE_2_5_LIVE_CHECKPOINT.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 Phase 2.5 live checkpoint 文档，记录 Cloudflare Pages 前端地址、Cloudflare Worker 地址、最新确认提交 `ad8d7cb`、当前能力、安全边界、非能力项、已知限制、卖家人工测试清单，以及暂不应建设的 API/同步/爬虫/ERP 能力。
- 验收方式：文档应明确不支持自动 1688/Taobao/Amazon/Ozon 页面抓取，不支持真实 Ozon 曝光、点击、转化、广告、订单、财务、库存或价格同步；运行 `git diff --check`。
- 已知风险：本次仅更新文档，不修改源码、不部署、不推送、不使用真实 Ozon 凭证、不调用真实 Ozon API。

## 2026-06-05 Phase 2.5 / AI Analysis product-testing decision workflow

- 修改目标：把 AI Analysis 从“像是需要真实店铺流量数据”的页面调整为清晰的测品决策流程：来源链接、手动商品信息、利润快照、测品建议，以及可选的人工预估测品参数。
- 涉及文件：index.html、css/style.css、js/main.js、js/product-selection.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：页面主文案改为测品决策报告；新增利润快照说明；“店铺流量 / 曝光数据”“点击率 / 转化备注”等文案改为“预计曝光量（手动预估）”“预计点击率（手动预估）”“预计转化率（手动预估）”；可选测品参数明确说明不会自动读取店铺曝光、点击、转化、广告或订单数据；报告优先展示利润率、总成本、手动采购价、类目、卖点和物流成本风险；可选曝光/点击/转化为空不会导致报告显示失败。
- 验收方式：运行 `node --check js/product-selection.js`、`node --check js/main.js`、`node --check js/store-api.js`、`git diff --check`；确认浏览器端不直接请求 `https://api-seller.ozon.ru`，未新增抓取、爬虫、外部商品解析 API、Worker 行为或 Ozon 流量/广告/订单/财务同步。
- 已知风险：当前曝光、点击、转化、竞品和广告假设全部是人工估算；页面不会自动同步真实 Ozon 店铺经营数据，真实数据能力需要未来单独批准和实现。

## 2026-06-05 Phase 2.5 / AI Analysis manual product preview workflow

- 修改目标：把 AI Analysis 从“链接识别后像失败”调整为可用的手动预览流程：识别来源域名，用户手动补充商品标题、采购价、类目和卖点备注，再生成结构化选品预览。
- 涉及文件：index.html、css/style.css、js/main.js、js/product-selection.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：AI Analysis 新增商品标题、采购价、类目或产品类型、卖点或备注输入；前端报告生成优先使用这些手动字段，已生成报告后继续编辑手动字段会刷新预览；识别到来源链接但未填写标题时显示“已识别来源链接，但当前不会自动抓取商品标题。请手动填写商品标题、采购价和类目信息后继续分析。”；Ozon 店铺商品摘要继续作为可选上下文，不会阻断来源链接和手动利润数据预览，缺少上下文时只显示可选提示。
- 验收方式：运行 `node --check js/product-selection.js`、`node --check js/main.js`、`git diff --check`；手动测试 1688 空字段、1688 手动字段、Ozon 商品页手动字段、Amazon/外部链接手动字段；确认浏览器端不直接请求 `https://api-seller.ozon.ru`，未新增抓取、爬虫、外部商品解析 API、Worker 行为或 Ozon 写入端点。
- 已知风险：当前仍不会自动读取 1688/Taobao/Amazon/Ozon 页面标题、价格、图片或规格；真实商品页解析需要未来明确批准的合规数据源或后端方案。

## 2026-06-01 Phase 2.5 / AI Analysis source-link and Ozon store-context separation

- 修改目标：修复来源商品链接分析被 Ozon Seller API product-summary 失败阻断的问题，明确来源链接识别是主流程，Ozon 店铺商品摘要只是可选授权店铺上下文。
- 涉及文件：js/product-selection.js、js/main.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：前端报告不再把 `ozon.message` 合并进主分析摘要；当 `ozon.status !== "connected"` 时，来源链接预览继续显示，Ozon 店铺摘要失败仅显示为可选 warning；Ozon 商品页面链接会提示 Seller API 不能直接读取任意 Ozon 页面或其他卖家商品数据；文档和手动测试补充 1688、Ozon 页面、product-summary HTTP 400 的解耦验证。
- 验收方式：运行 `node --check js/product-selection.js`、`node --check js/main.js`、`node --check worker/index.js`、`git diff --check`；确认浏览器端仍不直接调用 `https://api-seller.ozon.ru`，未新增 Ozon API 端点或写入操作。
- 已知风险：本次不使用真实 Ozon 凭证，不部署，不推送；真实线上效果需在本地检查通过后再按部署流程发布。

## 2026-05-29 Phase 2.5 / product-summary product-list 400 diagnostic

- 修改目标：排查线上 `/api/ozon/product-summary` 在 Ozon `/v3/product/list` 返回 HTTP 400 的问题，确保 product-summary 使用与已成功 `/api/ozon/test-connection` 相同的最小只读 product/list 请求形态，并返回安全诊断信息。
- 涉及文件：worker/index.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 Worker 内部 `buildOzonProductListRequest()`，test-connection 和 product-summary 都通过它生成 `{ filter: { visibility: "ALL" }, limit: <number> }`，避免向 Ozon `product/list` 转发任何额外前端字段；product-summary 的 product/list 非认证类失败现在返回 `ozon.status: "product_list_error"`、`failureStep: "product_list"` 和只包含 endpoint、HTTP 状态、visibility、effective limit、sanitized Ozon error 的诊断信息；文档和手动测试补充 400 诊断场景。
- 验收方式：运行 `node --check worker/index.js`、`node --check js/product-selection.js`、`node --check js/main.js`、`git diff --check`；使用 mocked Ozon product/list HTTP 400 验证响应不暴露 Client ID/API Key/token；确认浏览器端仍不直接调用 `https://api-seller.ozon.ru`，未新增 Ozon 写入端点。
- 已知风险：本次不使用真实 Ozon 凭证，不复测真实 Ozon API；如果 Ozon 仍返回 400，新的诊断字段用于确认是 product/list 合约、权限或响应体问题，而不是凭证泄露或前端直连问题。

## 2026-05-28 Documentation / Ozon read-only milestone timeline clarification

- 修改目标：复核“Ozon 临时凭证只读连接成功 + product-summary 未来设计”文档任务与当前工作区状态，避免把已经实现的 `/api/ozon/product-summary` 重新描述成尚未实现。
- 涉及文件：docs/PHASE_2_5_OZON_READ_ONLY_CONNECTION_AUDIT.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：在 Phase 2.5 Ozon 只读连接审计文档顶部补充状态说明：最初的连接里程碑是 documentation-only，`POST /api/ozon/product-summary` 当时是未来设计候选；当前工作区已在后续任务中实现最小只读 product-summary 路由，因此不能再把当前状态写成 design-only 或未实现。
- 验收方式：只修改文档；不修改 Worker 或前端 API 行为；不部署、不调用真实 Ozon API、不使用真实凭证；保留当前 product-summary 只读边界说明。
- 已知风险：历史日志中仍保留当时的“未实现”记录作为时间线记录；读当前状态时应以本条和后续 product-summary 实现/审计记录为准。

## 2026-05-28 Phase 2.5 / product-summary 临时凭证生命周期审计

- 修改目标：复核 `/api/ozon/product-summary` 前端临时凭证生命周期，确认 API Key 在成功、失败、缺少配置、缺少凭证、阻断不安全 Worker URL、fetch/network error 和来源链接前置校验失败后都不会留在输入框或浏览器存储中。
- 涉及文件：js/main.js、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：代码审计确认 `runOzonAutoAnalysis()` 的有效链接分析路径通过 `finally` 清空 `ozonTestApiKey`；补充来源商品链接为空或格式错误的前置返回清空逻辑；`requestOzonProductAnalysis()` 在 credential-bearing 请求前复用 Worker URL 安全校验，非本地 `http://` Worker URL 会在 `fetch` 前被阻断；`#ozonTestApiKey` 保持 `type="password"`、`autocomplete="new-password"` 且无硬编码 `value`；手动测试用例补充 mocked success、mocked Worker failure、network error 和来源链接前置校验失败后清空 API Key 的检查。
- 验收方式：运行 `node --check js/product-selection.js`、`node --check js/main.js`、`node --check js/store-api.js`、`node --check worker/index.js`、`git diff --check`；使用本地 JavaScript harness 验证 HTTPS Worker、`http://localhost`、`http://127.0.0.1` 允许，非本地 `http://` 阻断且 `fetchCalls: []`；确认浏览器端不直接调用 `https://api-seller.ozon.ru`，未使用真实凭证，未部署。
- 已知风险：本次不使用真实凭证、不部署、不调用真实 Ozon API；来源链接前置校验失败时不会进入 product-summary 请求路径，也不会发送临时凭证。

## 2026-05-28 Phase 2.5 / product-summary 临时凭证前端传递

- 修改目标：将现有 `POST /api/ozon/product-summary` 前端请求与 API Settings 中的 Ozon 临时 Client ID / API Key 输入框连接起来，只在用户点击选品分析时把临时凭证发送给 Worker。
- 涉及文件：index.html、js/main.js、js/product-selection.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：`getAnalysisPayload()` 现在从当前页面输入框读取 `ozonTestClientId`、`ozonTestApiKey` 并附带 `limit: 3`；`requestOzonProductAnalysis()` 会优先使用当前 Worker URL 输入框，并在发送凭证前复用 HTTPS/localhost Worker URL 校验；分析请求路径结束后清空 API Key 输入框；更新页面安全说明、API 集成计划和手动测试用例。
- 验收方式：运行 `node --check js/product-selection.js`、`node --check js/store-api.js`、`node --check js/main.js`、`node --check worker/index.js`、`git diff --check`；确认浏览器端仍不直接调用 `https://api-seller.ozon.ru`；确认 localStorage/sessionStorage 不包含 Ozon API Key；确认缺少凭证不会显示 connected 商品数据；确认未新增任何 Ozon 写入、同步、分页、数据库或长期凭证存储。
- 已知风险：本次不使用真实凭证、不部署、不调用真实 Ozon API；由于 API Key 仍会在测试或分析请求结束后清空，用户如果先测试连接再做选品摘要，需要再次临时输入 API Key。

## 2026-05-28 Phase 2.5 / product-summary 响应契约审计

- 修改目标：审计 `POST /api/ozon/product-summary` 的响应契约和错误状态，确保缺少临时凭证、Ozon 失败或响应异常时不会被前端或用户误认为已读取真实商品数据。
- 涉及文件：worker/index.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：为 missing credentials、invalid request、Ozon auth/api error、malformed response 和异常路径明确返回 `ozon.sampleCount: 0`；文档补充 product-summary 状态契约、HTTP 状态、`ok`、`ozon.status`、`products`、`sampleCount` 和 limit clamp 规则；手动测试用例补充 missing body、limit 0、limit 10、405 和 404 场景。
- 验收方式：使用本地 Worker import 测试缺少请求体、空 `clientId`、空 `apiKey`、`limit: 0`、`limit: 10`、unsupported method、unknown route；使用 mocked `fetch` 测试 Ozon auth failure、non-200、malformed response 和成功响应；运行 `node --check worker/index.js`、`node --check js/product-selection.js`、`node --check js/store-api.js`、`git diff --check`；确认未使用真实凭证、未部署、未新增 Ozon 写入端点。
- 已知风险：本次不调用真实 Ozon API；真实字段仍取决于 Ozon read-only endpoint 实际返回，缺失字段保持 `null`、`unknown` 或空值。

## 2026-05-28 Phase 2.5 / Ozon product-summary 只读 Worker 路由

- 修改目标：实现最小 `POST /api/ozon/product-summary` Worker 路由，让后端可以在临时凭证存在时读取 1-5 条 Ozon 店铺商品摘要，同时保持前端代码、利润公式、物流规则和平台预设不变。
- 涉及文件：worker/index.js、docs/API_INTEGRATION_PLAN.md、docs/PHASE_2_5_OZON_READ_ONLY_CONNECTION_AUDIT.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 product-summary Worker handler；请求体中只接受本次请求临时 `clientId` / `apiKey`，不保存、不记录、不返回原始凭证；商品数量默认 3，最终限制在 1-5；只调用已使用过的 Ozon 只读端点 `/v3/product/list` 和 `/v3/product/info/list`；返回 `source`、`insights`、`ozon.products` 和限制说明，缺少凭证、认证失败、Ozon API 错误和响应结构异常都会返回安全 JSON；更新 API 集成计划和 Phase 2.5 审计文档。
- 验收方式：运行 `node --check worker/index.js`、`node --check js/product-selection.js`、`node --check js/store-api.js`、`git diff --check`；确认 `worker/index.js` 包含 `POST /api/ozon/product-summary`；确认最大限制为 5；确认浏览器端仍不直接调用 `https://api-seller.ozon.ru`；确认未添加任何 Ozon 写入、同步、分页、数据库或长期凭证存储。
- 已知风险：未使用真实凭证执行 Ozon API 调用；商品详情字段取决于 Ozon 实际只读响应，缺失字段会保持 `null`、`unknown` 或空值；当前前端不会自动把临时凭证传给 product-summary，因此无凭证时仍是安全的未连接/缺少凭证状态。

## 2026-05-28 Documentation / Ozon 只读连接成功与 product-summary 占位审计

- 修改目标：记录 Ozon 临时凭证只读连接测试已成功，并审计现有 `/api/ozon/product-summary` 前端占位引用，避免把未来端点误认为已经实现。
- 涉及文件：docs/PHASE_2_5_OZON_READ_ONLY_CONNECTION_AUDIT.md、docs/API_INTEGRATION_PLAN.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 Phase 2.5 Ozon 只读连接里程碑文档；记录 Worker URL、前端 `POST /api/ozon/test-connection`、Worker 调用 Ozon `POST https://api-seller.ozon.ru/v3/product/list` 且 `limit: 1`；说明测试仅验证认证和最小只读商品列表访问；记录 API Key 未保存、未打印、未提交、未进入浏览器存储；审计 `js/product-selection.js` 中 `/api/ozon/product-summary` 仍是前端占位，当前 Worker 未实现该路由，今天不会触发真实 Ozon API 调用；补充未来 product-summary 端点的设计边界和候选字段。
- 验收方式：文档明确写明 Ozon 只读连接测试成功；明确 `/api/ozon/product-summary` 未实现；运行 `git diff --check`；确认没有修改 Worker、前端 API 行为、利润公式、物流规则或平台预设。
- 已知风险：文档记录基于用户已完成的临时凭证测试结果；本次不重复真实凭证测试，不调用真实 Ozon API，不实现 product-summary 端点。

## 2026-05-27 UI / API 设置界面中文化

- 修改目标：将 Store Integration Center / API Settings 的可见界面文案切换为中文，降低初学者和卖家使用时的理解成本。
- 涉及文件：index.html、js/main.js、docs/DEVELOPMENT_LOG.md。
- 修改内容：中文化 API 设置页标题、后端连接卡、平台接入卡、Ozon 四步连接流程、按钮、状态 badge、安全说明和后端健康检查动态提示；保留 Cloudflare Worker、Client ID、API Key 等必要技术名词。
- 验收方式：API Settings 中不再显示主要英文操作文案；Ozon API Key 仍为 password 类型；临时凭证测试仍只通过 Worker；运行 `node --check js/main.js js/store-api.js worker/index.js` 和 `git diff --check`。
- 已知风险：本次仅修改界面文案，不改变 API 安全模型、Worker endpoint、利润计算、物流规则或店铺数据。

## 2026-05-27 UI / Store Integration Center 重构

- 修改目标：将 API Settings / Store Integration 从表单堆叠界面重构为更清晰的专业集成设置页，减少 Worker URL、店铺档案和临时 Ozon 凭证之间的混淆。
- 涉及文件：index.html、css/style.css、js/main.js、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 Store Integration Center 页头、后端连接卡、Backend connected / Backend not configured / Testing / Failed 状态 badge、Worker `/api/health` 手动检查按钮、Ozon/Wildberries/Yandex 三平台集成卡片、Ozon 四步连接流程和安全说明卡；将 Wildberries/Yandex 明确标为 coming soon；保留 Ozon 临时凭证测试，API Key 仍为 password 类型并在测试后清空。
- 验收方式：API Settings 应显示清晰分区，不再像长表单；Worker URL 与 Ozon Client ID/API Key 明确分离；Ozon 临时测试仍只请求 Worker `/api/ozon/test-connection`；Wildberries/Yandex 不显示为可用连接；运行 `node --check js/main.js js/store-api.js worker/index.js` 和 `git diff --check`。
- 已知风险：本次只做 API Settings UI/UX 重构，不部署 Worker，不新增真实 API 能力，不改变利润计算、物流规则或任何 Ozon 店铺写操作。

## 2026-05-27 Phase 4A / Ozon 临时凭证测试 UX 修复

- 修改目标：修复 Ozon 店铺档案点击“测试连接”后只显示后端未配置凭证的死胡同体验，让当前阶段可以走更安全的临时凭证只读测试流程。
- 涉及文件：index.html、css/style.css、js/store-api.js、js/main.js、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：将“后端密钥编号”文案改为“后端连接档案 ID”，并说明这不是 Ozon API Key；店铺卡片测试连接会使用页面可见 Worker URL 调用 `/api/store-health`；当 Ozon 档案返回 `missing_credentials` 时，页面会打开/聚焦 Ozon 临时 Client ID / password 类型 API Key 测试表单，并预填店铺名；临时测试仍只请求 `{Worker URL}/api/ozon/test-connection`，测试结束清空 API Key；同步更新静态资源版本号，避免浏览器继续使用旧脚本缓存。
- 验收方式：点击缺少后端凭证的 Ozon 店铺档案“测试连接”应提示临时测试入口；空 Client ID/API Key 显示缺少凭证；临时测试请求只发往 Worker `/api/ozon/test-connection`；API Key 不进入 localStorage/sessionStorage；运行 `node --check js/store-api.js js/main.js worker/index.js`。
- 已知风险：真实 Ozon 凭证测试仍依赖用户在浏览器中手动输入有效 Client ID/API Key；当前改动不部署 Worker，也不新增任何写入店铺的 Ozon API。

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

## 2026-05-25 Phase 4A / Cloudflare Worker 部署配置文件

- 修改目标：补齐可直接用于 Wrangler 部署的 Cloudflare Worker 配置文件。
- 涉及文件：worker/wrangler.toml、docs/PHASE_4A_DEPLOYMENT_GUIDE.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增不含密钥的 `worker/wrangler.toml`；文档补充 `cd worker` 与 `npx wrangler deploy` 部署命令；强调登录和密钥配置由用户本人完成。
- 验收方式：确认 `worker/wrangler.toml` 不包含真实 Ozon 凭证；继续使用 `node --check worker/index.js`。
- 已知风险：Cloudflare 真实部署仍依赖用户账号登录，Ozon 凭证仍需后续在 Cloudflare 后台配置。

## 2026-05-25 Phase 4A / Wrangler dry-run 与部署阻塞记录

- 修改目标：验证 Cloudflare Worker 配置是否能进入 Wrangler 部署流程，并记录真实部署阻塞原因。
- 涉及文件：docs/PHASE_4A_DEPLOYMENT_GUIDE.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：执行 `npx wrangler deploy --dry-run`，Worker 打包通过；执行 `npx wrangler deploy` 时，Wrangler 因非交互环境缺少 `CLOUDFLARE_API_TOKEN` 而拒绝部署；文档补充不要把 Cloudflare API Token 发到聊天或提交到仓库，应由用户在本地终端、Cloudflare dashboard 或安全 secret store 中完成部署。
- 验收方式：dry-run 输出 `Total Upload: 11.86 KiB / gzip: 4.24 KiB` 且无绑定错误；确认仓库未产生 token、node_modules、package-lock 或 Wrangler 临时目录。
- 已知风险：真实部署仍未完成；需要用户本人完成 Cloudflare 登录或提供安全的本地/CI secret 环境。

## 2026-05-25 Phase 4A / Ozon 真实 API 样本商品读取

- 修改目标：让 Ozon API 连接后不只显示健康检查，而是能返回少量真实店铺商品样本，方便用户看到实际接入效果。
- 涉及文件：.gitignore、worker/index.js、worker/.dev.vars.example、js/main.js、js/product-selection.js、docs/PHASE_4A_DEPLOYMENT_GUIDE.md、docs/PHASE_4A_OZON_API_AI_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：Worker 新增 Ozon 请求封装；`/api/health` 和 `/api/analyze-product` 在凭证有效时调用 `/v3/product/list` 并尝试用 `/v3/product/info/list` 获取商品详情样本；前端 Ozon API 状态和报告竞争判断会展示样本商品 offer_id/product_id；新增 `.dev.vars.example`，并在 `.gitignore` 中忽略 `worker/.dev.vars`。
- 验收方式：`node --check js/product-selection.js js/main.js worker/index.js`；`git diff --check`；无真实凭证时不应泄露任何密钥；有真实凭证时 `/api/health` 应返回 `connected` 和样本商品信息。
- 已知风险：真实 Ozon 商品详情字段取决于 Ozon API 实际返回；若店铺暂无商品或权限不足，样本列表可能为空或只显示连接状态。

## 2026-05-25 Phase 4B / 多平台店铺 API 档案与会员数量限制

- 修改目标：为 Ozon / Wildberries / Yandex 增加店铺 API 档案管理入口，并按会员档位限制可添加店铺数量。
- 涉及文件：AGENTS.md、index.html、css/style.css、js/store-api.js、js/main.js、docs/PHASE_4B_MULTI_STORE_API_PLAN.md、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增店铺 API 管理面板；支持未开通会员 1 个店铺、月卡 5 个店铺、年卡 10 个店铺；显示平台统计和容量；新增店铺名称、平台、后端密钥编号字段；新增移除店铺；使用 localStorage 保存非密钥元信息；明确真实 API Key 不得保存在前端。
- 验收方式：`node --check js/store-api.js js/main.js`；未开通会员添加第二个店铺应被拦截；月卡最多 5 个；年卡最多 10 个；刷新后档案恢复；真实 API Key 不应出现在 Git diff。
- 已知风险：当前是前端店铺档案和会员规则 MVP，不是完整付费会员系统；真实多店铺 API 绑定仍需要后端加密密钥存储、账号系统和权限校验。

## 2026-05-25 Phase 4B / 真实后端店铺同步与选店铺分析

- 修改目标：回应真实 API Key 接入需求，让卖家可以从后端真实凭证注册表同步店铺，并在选品分析时选择具体店铺。
- 涉及文件：worker/index.js、worker/.dev.vars.example、index.html、css/style.css、js/store-api.js、js/main.js、docs/PHASE_4A_DEPLOYMENT_GUIDE.md、docs/PHASE_4B_MULTI_STORE_API_PLAN.md、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：Worker 新增 `STORE_API_CREDENTIALS_JSON` 解析；新增 `/api/stores` 返回脱敏店铺档案；新增 `/api/store-health` 测试 Ozon / Wildberries / Yandex 店铺连接；选品分析 payload 增加 selectedStore；前端新增同步后端真实店铺、测试连接、选择用于分析的店铺。
- 验收方式：`node --check worker/index.js js/store-api.js js/main.js`；`npx wrangler deploy --dry-run`；`/api/stores` 不返回真实 apiKey/token/clientId；选择店铺后分析请求应带 platform 和 credentialRef。
- 已知风险：当前没有账号系统和数据库，`STORE_API_CREDENTIALS_JSON` 适合 MVP/管理员配置，不适合长期多租户商业化；正式版本仍需登录、加密数据库、权限隔离和会员支付校验。

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

## 2026-05-25 Phase 4A / 安全部署入口与 Worker 部署自动化

- 修改目标：开始真实部署流程，并在不泄露 API Key 的前提下补齐 Worker 地址配置和 GitHub Actions 部署入口。
- 涉及文件：index.html、css/style.css、js/config.js、js/product-selection.js、js/main.js、.github/workflows/deploy-worker.yml、docs/PHASE_4A_DEPLOYMENT_GUIDE.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 `Cloudflare Worker 地址` 前端配置框，支持把已部署 Worker 公网地址保存到浏览器 localStorage 并立即用于健康检查、店铺同步和智能分析；将产品分析 API 地址改为运行时读取，避免保存地址后仍使用旧空值；新增手动触发的 GitHub Actions Worker 部署流程，按官方 Wrangler Action 的 `secrets` 方式写入 Worker Secrets，所有 Cloudflare/Ozon/WB/Yandex 凭证只从 GitHub Secrets 或 Cloudflare 环境变量读取。
- 验收方式：运行 `npx wrangler deploy --dry-run` 验证 Worker 包可部署；实际 `npx wrangler deploy` 在 Codex 非交互环境中因缺少 `CLOUDFLARE_API_TOKEN` 被 Cloudflare 拒绝；运行 `node --check` 检查新增/修改 JS 文件；确认 `.dev.vars` 被 `.gitignore` 忽略。
- 已知风险：真正上线仍需要用户本人在 Cloudflare 或 GitHub Secrets 中配置 `CLOUDFLARE_API_TOKEN` 和平台 API 凭证；不能把任何真实密钥发到聊天、前端或 GitHub 普通文件。

## 2026-05-25 Phase 3 / 全流程复核与文档修正

- 修改目标：重新梳理 Phase 3 产品化流程，检查文档、预设、汇率助手、诊断阈值和页面字段引用是否一致。
- 涉及文件：docs/PHASE_3_FLOW_AUDIT.md、docs/business-rules.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 Phase 3 全流程复核文档；确认 Healthy Profit Baseline 在当前规则下利润率约 15.88%，应显示保守小量测试语义；修正汇率助手文档中的旧按钮文案，将 `获取当日参考汇率` 改为当前 UI 的 `今日参考`；补充 Phase 3 复核范围边界，明确多方案保存、渠道比较、账号历史、后端/API/AI 自动化仍不是当前已完成的 Phase 3 功能。
- 验收方式：检查 Phase 3 文档与实现文件；运行 HTML ID 引用检查；运行 `node --check` 检查 Phase 3 JS；运行 `git diff --check`。
- 已知风险：本次未修改公式、物流规则或页面交互代码；当前环境的浏览器工具阻止访问 `127.0.0.1`，因此未重新做浏览器截图验证。

## 2026-05-25 UI / 移除常用预设板块

- 修改目标：删除左侧 `常用预设` 可见板块，减少无用入口和误操作。
- 涉及文件：index.html、css/style.css、js/main.js、docs/business-rules.md、docs/manual-test-cases.md、docs/PHASE_3_FLOW_AUDIT.md、docs/PRESET_TEMPLATE_DESIGN.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：移除预设面板 HTML 和 `js/presets.js` 页面加载；移除 `main.js` 中预设绑定/应用逻辑；清理 `.preset-*` 样式；文档改为说明预设是历史设计参考，当前页面以手动输入为主。
- 验收方式：页面不再显示 `常用预设`、`预设模板` 或 `应用预设`；手动输入、汇率助手、利润计算、诊断、选品报告入口和 CSV 导出不受影响；运行 `node --check` 和 `git diff --check`。
- 已知风险：`js/presets.js` 文件作为历史参考暂时保留但不再由页面加载；后续如果确定不再需要预设，可单独删除该文件并同步清理历史文档。

## 2026-05-26 Documentation / AGENTS.md 项目级 Codex 指引

- 修改目标：Add root-level Codex guidance so future tasks preserve the static frontend product direction.
- 涉及文件：AGENTS.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：在根级 AGENTS.md 顶部补充项目概览、当前阶段、技术约束、受保护业务逻辑、UI 开发规则、安全规则和文档规则；强调 Phase 2 默认稳定性优先、禁止默认引入后端/真实 API/新依赖/部署。
- 验收方式：确认项目根目录包含 index.html、js/、css/、docs/；仅修改 AGENTS.md 和本开发日志，不修改 index.html、js/、css/ 或业务逻辑。
- 已知风险：AGENTS.md 下方仍保留历史阶段说明；未来任务应优先遵守顶部项目级指引，除非用户明确要求进入后续阶段。

## 2026-05-26 UI / App 工作台视图切换

- 修改目标：把页面从长滚动表单改为 app-like 单屏工作台，按 Profit Calculator、AI Analysis、API Settings 三个主视图切换。
- 涉及文件：index.html、css/style.css、js/main.js、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增稳定顶部导航和 `app-view` 视图切换逻辑；默认只显示利润计算工作台；将现有 AI 选品识别面板挂载到 AI Analysis 工作区；将店铺 API 档案管理恢复到 API Settings 工作区；重写主要布局样式为更接近 SaaS dashboard 的工作台界面。
- 验收方式：打开页面默认只看到 Profit Calculator；点击 AI Analysis / API Settings 会切换主屏而不是滚动到下方；平台切换、利润计算、诊断、AI 占位报告、店铺档案本地管理继续可用；运行 `node --check` 和 `git diff --check`。
- 已知风险：当前仍是静态前端工作台；除用户主动点击已存在的保存、同步、测试或分析按钮外，导航切换本身不应触发真实 API 请求。

## 2026-05-26 API / 安全卖家 API 接入准备

- 修改目标：改善 AI Analysis 中商品链接后的反馈体验，并为未来 Ozon 卖家 API 连接提供安全、合法、后端代理优先的前端准备路径。
- 涉及文件：index.html、css/style.css、js/main.js、js/store-api.js、js/product-selection.js、docs/API_INTEGRATION_PLAN.md、docs/manual-test-cases.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：AI Analysis 新增 Data source / Product link / Store API / Analysis mode 状态卡；商品链接输入后改为手动/预览模式提示，不再显示死胡同式后端未连接文案；API Settings 新增 Ozon 临时连接测试面板，包含 Store name、Client ID、password 类型 API Key、Worker URL、连接状态和测试按钮；新增前端 Worker 调用包装，缺少 Worker URL 时直接返回 backend-not-configured，配置 Worker 后只请求未来 `/api/ozon/test-connection` 或 `/api/ozon/product-summary` 端点。
- 验收方式：输入商品链接时显示专业预览提示；API Key 字段为 password；刷新后 API Key 不恢复；无 Worker URL 时不发送凭证；浏览器不直接请求 Ozon 官方 API；运行 `node --check` 和 `git diff --check`。
- 已知风险：本次未修改 Worker 代码，`/api/ozon/test-connection` 和 `/api/ozon/product-summary` 仍是未来安全端点；除用户主动点击测试或分析按钮并配置 Worker URL 外，不新增真实 API 调用；利润计算和物流规则保持不变。

## 2026-05-26 API / Ozon Worker 测试连接端点

- 修改目标：实现最小安全 Ozon API 连接测试，通过 Cloudflare Worker 验证卖家 Client ID / API Key 是否能认证，不做完整店铺数据同步。
- 涉及文件：worker/index.js、index.html、js/store-api.js、js/main.js、docs/API_INTEGRATION_PLAN.md、docs/DEVELOPMENT_LOG.md。
- 修改内容：新增 Worker 端点 `POST /api/ozon/test-connection`；Worker 校验 Client ID 和 API Key 后使用 Ozon 官方请求头通过后端发送最小只读认证请求；响应只返回 `connected`、`message`、`maskedClientId`、`timestamp`；前端测试按钮调用 Worker URL，不直接请求 Ozon；测试结束后清空 API Key 输入框。
- 验收方式：缺少 Worker URL 时前端不发送凭证；缺少凭证时 Worker 返回失败状态；配置 Worker 后前端只请求 Worker 的 `/api/ozon/test-connection`；浏览器不请求 `api-seller.ozon.ru`；运行 `node --check`、Worker 语法检查和 `git diff --check`。
- 已知风险：连接成功只代表凭证和 Worker 代理可用，不代表已实现产品、订单、广告、流量或财务同步；利润公式、物流规则和计算器 UI 保持不变。
