# AGENTS.md

## Project Identity

This project is an AI-assisted cross-border ecommerce product extraction and profit decision assistant.

The product serves sellers working with platforms and sources such as:

* Ozon
* Wildberries
* Yandex Market
* Amazon
* AliExpress
* 1688
* Taobao
* Tmall
* Pinduoduo
* JD
* generic ecommerce product pages

The product goal is:

A seller pastes a product link. The app automatically identifies the platform, extracts public product information when available, normalizes the fields, and generates a seller-facing product-testing decision report.

The app should help sellers answer:

* What is this product?
* Which platform/source does it come from?
* What title, image, visible price, shipping fee, currency, category, material, usage, scene, and basic product details can be safely extracted?
* Is the visible price a supplier candidate cost or a marketplace reference price?
* What information still needs manual confirmation?
* Is this product worth a small test?
* What are the profit, logistics, advertising, return, and testing risks?
* What should the seller do next?

This project is a decision assistant, not a full ERP system.

## Current Product Direction

The current product direction is URL-first automatic product extraction plus profit-based product testing decision support.

Manual input should not be the primary workflow.

The target workflow is:

1. User pastes a product URL.
2. The app identifies the platform.
3. The app attempts safe public product extraction.
4. The app extracts title, image, visible price, shipping fee when available, currency, category suggestion, material, usage, scene, basic product details, and confidence when available.
5. The app clearly labels price role:

   * supplier/source platform price = `candidate_source_cost`
   * marketplace page price = `market_reference_price`
   * unknown price role = `unknown`
6. The user may add notes, questions, doubts, or business context after extraction.
7. The app generates a seller-facing product-testing decision report.
8. Manual input remains fallback, editing, or confirmation only.

## Current Technical Stack

Use only:

* HTML
* CSS
* Vanilla JavaScript
* Cloudflare Pages for frontend
* Cloudflare Worker for backend proxy and lightweight public product extraction

Do not introduce the following unless explicitly approved by the user:

* React
* Vue
* TypeScript
* database
* login system
* payment system
* large framework
* new npm dependency
* separate backend service
* Playwright
* Puppeteer
* browser automation
* proxy scraping
* captcha solving
* external product parser

The user is a beginner developer using AI-assisted coding. Keep the code understandable, incremental, and reversible.

## Current Live URLs

Frontend:

`https://ozon-ai-profit-assistant2.pages.dev/`

Worker:

`https://ozon-ai-profit-assistant.ozon-ai-profit-assistant-claire.workers.dev`

## Active Files

Primary execution files:

* `AGENTS.md`
* `ACTIVE_GOAL.md`

Core app files:

* `index.html`
* `css/style.css`
* `js/main.js`
* `js/product-selection.js`
* `js/store-api.js`
* `worker/index.js`

Active docs:

* `docs/DEVELOPMENT_LOG.md`
* `docs/manual-test-cases.md`

Archive folders are historical memory only. Do not treat them as active task files unless explicitly requested.

Archive folders:

* `docs/archive-old-docs/`
* `docs/archive-root-docs/`
* `docs/archive-agent-setup/`

Local run logs:

* `docs/codex-runs/`

`docs/codex-runs/` should stay ignored by Git.

## Source Extraction Rules

The source extraction system must be platform-aware.

Required platform detection should cover at least:

* 1688
* Taobao
* Tmall
* Pinduoduo
* JD
* AliExpress
* Amazon
* Ozon
* Wildberries
* Yandex Market
* generic ecommerce sites

The extractor may attempt, in order:

1. safe redirect resolution
2. JSON-LD Product data
3. Open Graph metadata
4. Twitter card metadata
5. itemprop fields
6. common product meta tags
7. HTML title
8. conservative visible price/title patterns
9. platform-specific static adapters when safe

Never invent product data.

If price is not found, return `price: null`.

If shipping fee is not found, do not invent shipping.

If title is not found, return empty title and a clear fallback reason.

If platform blocks extraction, return a clear fallback message and keep the workflow available.

## Price Role Rules

Supplier/source platforms:

* 1688
* Taobao
* Tmall
* Pinduoduo
* JD
* AliExpress when used as a source platform

Visible price may be treated as:

`candidate_source_cost`

Frontend warning:

`识别到的是候选采购价，请确认是否为真实拿货成本。`

Marketplace platforms:

* Amazon
* Ozon
* Wildberries
* Yandex Market

Visible price must be treated as:

`market_reference_price`

Frontend warning:

`识别到的是平台销售参考价，不等于你的采购成本。`

If price is missing:

`未能自动识别价格，请手动确认或补充。`

If shipping is missing:

`运费未能自动识别，请后续确认。`

Marketplace reference price must never silently fill purchase cost.

## Product Field Rules

Extraction should move toward this normalized product model:

```json
{
  "sourceUrl": "",
  "finalUrl": "",
  "platform": "",
  "platformType": "supplier|marketplace|unknown",
  "title": {
    "value": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "price": {
    "value": null,
    "currency": "",
    "role": "candidate_source_cost|market_reference_price|unknown",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "shippingFee": {
    "value": null,
    "currency": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "totalCandidateSourceCost": {
    "value": null,
    "currency": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "images": [
    {
      "url": "",
      "confidence": "high|medium|low|none",
      "source": ""
    }
  ],
  "material": {
    "value": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "usage": {
    "value": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "scene": {
    "value": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "specifications": [
    {
      "name": "",
      "value": "",
      "confidence": "high|medium|low|none",
      "source": ""
    }
  ],
  "categorySuggestion": {
    "value": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "description": {
    "value": "",
    "confidence": "high|medium|low|none",
    "source": ""
  },
  "extractionConfidence": "high|medium|low|none",
  "extractionSource": "static_html|json_ld|meta|itemprop|visible_text|platform_adapter|manual|user_notes",
  "failureReason": "",
  "manualConfirmationNeeded": []
}
```

## Frontend State Rules

Changing the source URL must always start a new product extraction session.

When URL changes:

* clear old extraction result
* clear old preview image
* clear old extracted title
* clear old extracted price
* clear old shipping fee
* clear old material
* clear old usage
* clear old scene
* clear old specifications
* clear old category suggestion
* clear old extraction details
* clear old analysis report
* show a loading or waiting state for the current URL
* never show previous URL extraction details under the new URL

Every extraction request must carry a request id or URL token.

If an async response returns after the URL changed, ignore that stale response.

Reports must use only:

* current URL
* current extraction result
* current user notes/questions
* current profit snapshot

Old product data must never appear in a new product report.

## Analysis Model Disclosure

The app must clearly disclose the current analysis model.

If no LLM API is used, the UI must not imply ChatGPT, OpenAI, Claude, or another large model is powering the live analysis.

Recommended disclosure:

`当前分析模型：本地规则分析模型 v0.1 + 当前利润计算快照。暂未接入大模型 API；不会自动同步真实平台曝光、点击、转化、广告、订单或财务数据。`

## Product Analysis Rules

The report should be seller-facing, not a technical diagnostic.

Preferred report sections:

* 测品结论
* 利润安全边际
* 建议测试数量
* 最低售价底线
* 主要风险
* 下一步动作
* 数据边界

Decision labels:

* 建议小量测试
* 谨慎测试
* 暂不建议测试

The report should explain:

* why the product is or is not worth testing
* first test quantity
* price floor reference
* profit risk
* logistics/weight risk
* advertising risk
* return risk
* what data is missing
* what the seller should confirm next

Do not produce fake profit conclusions when source cost or profit snapshot is missing.

## Protected Business Logic

Do not change the following unless the user explicitly requests it:

* core profit formulas
* logistics fee logic
* platform preset values
* platform defaults
* Ozon / Wildberries / Yandex platform switching logic

If an existing element ID must be renamed, update every related binding safely in the same change and verify page behavior.

## Safety Boundaries

Do not:

* use real Ozon credentials unless explicitly requested
* ask the user to paste real credentials into chat
* print, save, commit, or log API keys
* call Ozon Seller API for arbitrary public product links
* add new Ozon Seller API endpoints without explicit approval
* add write/update/delete/create endpoints
* update product data, prices, stock, orders, warehouse, logistics, ads, or finance
* implement batch crawling
* implement hidden-data extraction
* bypass anti-bot systems
* bypass captcha
* use login cookies
* use session scraping
* use proxy scraping
* scrape private or login-only data
* extract seller-private data
* extract stock, SKU, reviews, sales count, orders, or hidden fields
* add Playwright, Puppeteer, browser automation, dynamic rendering, external parsers, or new backend services without explicit user approval
* modify profit formulas unless explicitly requested
* modify logistics matching logic unless explicitly requested
* modify platform presets unless explicitly requested

## Git Rules

Do not run `git push` unless explicitly requested.

Do not deploy unless explicitly requested.

Do not commit unless explicitly requested or the user has approved the exact change.

Do not commit unrelated files.

Do not commit:

* real credentials
* `.env`
* local cache
* `worker/.wrangler/`
* `docs/codex-runs/`
* generated secrets
* screenshots containing credentials

## Deployment Rules

Do not deploy unless the user explicitly asks.

If only frontend files changed:

* push to `origin/main` only after approval
* Cloudflare Pages should auto-deploy

If `worker/index.js` changed:

* push to `origin/main` only after approval
* deploy Worker explicitly with `npx wrangler deploy` only after approval
* report Worker Version ID

## Documentation Rules

Meaningful product, API, safety, or UI changes must update:

* `docs/DEVELOPMENT_LOG.md`
* `docs/manual-test-cases.md`

Do not write new active planning documents unless explicitly requested.

Historical documents should stay in archive folders.

## Codex Working Rules

For every task:

1. read `AGENTS.md`
2. read `ACTIVE_GOAL.md`
3. inspect relevant code before changing files
4. summarize current behavior
5. make a minimal implementation plan
6. modify only necessary files
7. do not push unless explicitly requested
8. do not deploy unless explicitly requested
9. do not use real credentials
10. update documentation for meaningful changes
11. run static checks
12. report risks clearly

If a check fails:

1. read the error
2. identify the likely cause
3. make the smallest safe fix
4. rerun the check

Continue until all Done when conditions in `ACTIVE_GOAL.md` pass or a real blocker is reached.

Stop only for real blockers:

* real credentials are required
* deployment is required
* git push is required
* new backend service is required
* dynamic renderer / Playwright / Puppeteer is required
* destructive file deletion is required
* safety boundary would be violated

## Required Check Commands

Run relevant checks before reporting success:

```bash
node --check worker/index.js
node --check js/main.js
node --check js/product-selection.js
node --check js/store-api.js
git diff --check
git status --short
```

If Worker is not meant to change, confirm:

```bash
git diff -- worker/index.js
```

If frontend is changed, verify no direct browser-side Ozon Seller API call exists:

```bash
grep -R "api-seller.ozon.ru" index.html js css
```

Browser-side files must not call Ozon Seller API directly.

## Final Response Format

Every final response must include:

* files inspected
* files changed
* what changed
* what did not change
* checks run
* security result
* whether Worker behavior changed
* whether push/deployment was performed
* remaining risks
