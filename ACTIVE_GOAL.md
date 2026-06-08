# ACTIVE_GOAL.md

## Goal

Upgrade the AI Analysis page from a manual Product Card Testing Decision Workspace into an Evidence Pack + Product Testing Score Diagnosis system.

The current page workflow is usable, but the analysis is still too weak and too manual.

The new goal is:

The seller can paste one block of product evidence, competitor observations, review signals, and personal doubts. The system should structure that evidence, score the product across key dimensions, and output a stronger seller-facing testing decision.

Do not build a new page from scratch.

Improve the existing AI Analysis page.

Do not add large model API integration in this task.

Use local rule-based analysis only for now.

## Product Direction

The product should help beginner Ozon / Wildberries / Yandex sellers answer:

* Is this product worth listing and testing?
* What is the product positioning?
* What are the main selling points?
* What are the product card weaknesses?
* Is the price competitive?
* Is the profit margin safe?
* Are reviews or trust signals weak?
* Is logistics or return risk high?
* What should the seller fix before listing?
* What should the seller observe after listing?
* Should the seller continue, optimize, or pause?

The page should feel less like a form and more like a decision assistant.

## Core UX Change

Add a new primary input area:

`商品证据包 / 竞品观察 / 我的疑问`

This should be a large textarea where the seller can paste natural language evidence, for example:

* product title
* source product description
* competitor titles
* competitor price range
* competitor review observations
* visible negative review points
* product material
* usage scenario
* worries about returns
* doubts about price
* doubts about category
* seller’s own operating judgment

The existing structured fields can remain, but the evidence pack should become the main analysis input.

## Keep Existing Workflow

Keep the current sections:

* 商品基础信息
* 公开市场与竞品观察
* 产品卡片质量判断
* 利润与风险判断
* 测品决策报告

But improve them so the evidence pack can enrich the report.

Do not require a product URL.

Do not depend on successful link extraction.

Do not require backend store data.

## Evidence Pack Parsing

Add local rule-based parsing from the evidence pack.

The system should attempt to identify:

* product title
* product type
* category hints
* material hints
* usage / scene hints
* selling points
* competitor price signals
* review trust signals
* negative review risks
* return risk hints
* logistics risk hints
* seller doubts or concerns

Do not invent facts.

If the evidence is missing, say it is missing.

If confidence is low, mark it as low confidence.

## Scoring System

Add a product testing score diagnosis.

Use 0-100 scores for:

1. `利润安全评分`
2. `价格竞争力评分`
3. `产品卡片质量评分`
4. `评价与信任评分`
5. `物流与退货风险评分`
6. `平台匹配度评分`

Also calculate an overall decision:

* `建议上架测试`
* `优化后再测`
* `谨慎测试`
* `暂不建议测试`

Scoring should be rule-based and explainable.

Do not use fake precision.

Show short explanations for each score.

Example:

* `价格竞争力评分：62 / 100`
* `原因：目标售价接近竞品价格区间上沿，若没有更强主图或卖点，转化压力较大。`

## Report Upgrade

The report should include:

* 测品结论
* 关键评分总览
* 商品定位
* 核心卖点
* 产品卡片问题
* 价格竞争判断
* 评价与信任风险
* 利润安全边际
* 物流与退货风险
* 上架前优化建议
* 上架后观察指标
* 继续 / 优化 / 暂停条件
* 数据边界

The report should be more specific and action-oriented.

Avoid vague phrases such as:

* 需要进一步观察
* 建议综合判断
* 可以适当优化
* 存在一定风险

Use concrete seller actions:

* 优先优化主图第一视觉
* 标题需要突出容量 / 材质 / 使用场景
* 目标售价高于竞品区间时，需要强化差异化卖点
* 评价少时，不要依赖高广告消耗放量
* 材质不清时，详情页必须补充材质说明
* 重量偏高时，优先检查物流成本是否吃掉利润
* 有点击无订单时，优先检查价格、评价、物流时效和主图信任感

## One-Piece Fulfillment Logic

Keep one-piece fulfillment / dropshipping testing logic.

Do not recommend stock quantity.

Do not use:

* 首批备货
* 第一批货备多少
* 批量进货
* 备货数量
* 5-10 件测试数量

Use:

* 是否值得上架测试
* 是否需要优化后再测
* 是否谨慎测试
* 是否暂不建议测试
* 上架后观察哪些指标
* 什么情况下继续 / 优化 / 暂停

## Profit Data Logic

Use the existing profit calculator snapshot and structured fields.

Do not modify profit formulas.

If source cost or target selling price is missing:

* still generate a limited product card observation report
* do not output a full profit safety conclusion
* show:
  `利润数据不足，本次不输出利润安全结论。`

If source cost and target selling price exist:

* include profit safety score
* include minimum safe price reference if available
* explain whether the product has enough margin for ads, returns, and logistics pressure

## Backend Data Logic

The user currently may not have store backend data.

Therefore:

* do not require impressions
* do not require clicks
* do not require add-to-cart
* do not require orders
* do not require ad spend
* do not require conversion rate
* do not require store API authorization

If backend data is missing, show:

`后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。`

## Link Extraction Role

Link extraction remains optional helper only.

Do not make link extraction the core workflow.

If link extraction succeeds, it can prefill information.

If it fails, the report must still work from evidence pack and structured fields.

Do not continue trying to make arbitrary ecommerce links fully extractable through Cloudflare Worker.

## UI Requirements

Improve the AI Analysis page so that:

1. Evidence pack textarea is visually prominent.
2. Structured fields are still available but not overwhelming.
3. Score cards appear near the top of the report.
4. The final decision label is visually clear.
5. Missing data is shown as a data boundary, not as a silent failure.
6. The report feels like a seller decision coach, not a plain form summary.

## Do Not Implement

Do not implement:

* OpenAI API
* Claude API
* large model API
* Playwright
* Puppeteer
* dynamic renderer
* crawler
* proxy scraping
* login scraping
* cookie scraping
* captcha bypass
* anti-bot bypass
* external parser
* database
* login system
* payment system
* new backend service
* browser extension
* new npm dependency

Do not bypass platform access controls.

Do not use real credentials.

Do not call Ozon Seller API.

Do not modify profit formulas.

Do not modify logistics matching logic.

Do not modify platform presets.

Do not push.

Do not deploy.

Do not commit unless explicitly approved.

## Tasks

### 1. Inspect current files

Inspect:

* `AGENTS.md`
* `ACTIVE_GOAL.md`
* `index.html`
* `css/style.css`
* `js/main.js`
* `js/product-selection.js`
* `js/store-api.js`
* `worker/index.js`
* `docs/manual-test-cases.md`
* `docs/DEVELOPMENT_LOG.md`

### 2. Summarize current workflow

Before changing files, summarize:

* current AI Analysis workflow
* current report generation logic
* why the analysis feels weak
* where the UI still feels too manual

### 3. Add evidence pack input

Add a large textarea labeled:

`商品证据包 / 竞品观察 / 我的疑问`

Helper text:

`可以粘贴商品标题、竞品价格、评论痛点、材质描述、使用场景、你的担心点。系统会先结构化这些证据，再生成测品判断。`

### 4. Add evidence parsing logic

Add local rule-based parsing for:

* material
* usage / scene
* selling points
* competitor pressure
* review trust
* return risk
* logistics risk
* seller concerns

### 5. Add scoring engine

Add 0-100 scoring for:

* profit safety
* price competitiveness
* product card quality
* review / trust
* logistics / return risk
* platform fit

Each score must include a short explanation.

### 6. Upgrade report

Make the report more specific, more action-oriented, and less generic.

The report should use evidence pack content, structured fields, and profit snapshot together.

### 7. Keep current safety and business boundaries

Do not change Worker behavior unless strictly necessary.

Do not change formulas.

Do not change logistics logic.

Do not change platform presets.

### 8. Update docs

Update:

* `docs/manual-test-cases.md`
* `docs/DEVELOPMENT_LOG.md`

## Required Checks

Run:

```bash
node --check worker/index.js
node --check js/main.js
node --check js/product-selection.js
node --check js/store-api.js
git diff --check
git status --short
```

Confirm browser-side files do not directly call:

```bash
grep -R "api-seller.ozon.ru" index.html js css
```

## Manual Browser Checks

Run the app locally and verify:

* Evidence pack textarea is visible.
* User can generate a report from evidence pack + minimal structured fields.
* Score cards appear in the report.
* Missing source cost / target price generates limited report.
* Filled source cost / target price generates stronger report.
* No stock quantity recommendation appears.
* Link extraction failure does not block the workflow.
* Existing profit calculator still works.
* Existing API Settings still works.
* No browser console JavaScript errors.

## Done When

* Evidence pack input exists.
* Evidence pack can enrich the report.
* Local rule-based parsing extracts useful hints.
* Score cards are shown.
* Report is more specific and action-oriented.
* Missing data is clearly marked.
* One-piece fulfillment testing logic remains.
* No stocking quantity logic appears.
* Link extraction is optional helper only.
* Profit formulas are unchanged.
* Logistics logic is unchanged.
* Platform presets are unchanged.
* No new scraper / dynamic renderer / parser is added.
* No real credentials are used.
* Static checks pass.
* Browser smoke test passes as much as possible.
* Documentation is updated.
* No push, deploy, or commit is performed.

## Final Response

Report back with:

* Files inspected
* Files changed
* Old analysis weakness summary
* New evidence pack workflow
* Evidence parsing logic
* Scoring dimensions and rules
* Report improvements
* How missing profit data is handled
* How link extraction is treated
* Static check results
* Browser smoke test result
* Whether Worker behavior changed
* Whether any new API / crawler / parser / dynamic renderer was added
* Whether real credentials were used
* Whether push / deploy / commit was performed
* Remaining risks
