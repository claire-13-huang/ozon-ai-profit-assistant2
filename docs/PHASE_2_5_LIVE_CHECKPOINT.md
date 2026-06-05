# Phase 2.5 Live Checkpoint

Date: 2026-06-05

This checkpoint records the current deployed state of the AI product-testing workflow. It is documentation only and does not change frontend, Worker, API, calculation, logistics, or deployment behavior.

## Live URLs

- Frontend: `https://ozon-ai-profit-assistant2.pages.dev/`
- Worker: `https://ozon-ai-profit-assistant.ozon-ai-profit-assistant-claire.workers.dev`

Latest verified frontend commit:

- `ad8d7cb Refine AI analysis as product testing workflow`

## Current Deployed Capability

The live frontend is a static seller decision assistant for product testing. The current AI Analysis workflow is positioned as:

- `AI 测品决策报告`
- Main action: `生成测品建议`

Current live capabilities:

- Recognizes a pasted source link domain, such as `detail.1688.com`, `ozon.ru`, `amazon.com`, or a brand-site domain.
- Lets the seller manually enter product information:
  - 商品标题
  - 采购价
  - 类目或产品类型
  - 卖点或备注
- Uses the current profit calculator snapshot in the report:
  - sale price
  - total cost
  - profit
  - profit margin
  - purchase cost
  - logistics cost when available
- Generates an AI product-testing decision report focused on whether the product is worth a small test.
- Keeps optional testing assumptions clearly manual:
  - exposure
  - click rate
  - conversion rate
  - competitor observations
  - ad/share assumptions
- Works when optional exposure, click, conversion, competitor, or ad assumptions are empty.
- Shows Ozon store product-summary only as optional authorized store context.
- Keeps source-link analysis and manual product testing usable when Ozon store context is unavailable.
- Runs as a Cloudflare Pages frontend.
- Has a deployed Cloudflare Worker backend available for approved Worker endpoints and optional Ozon read-only connection tests.

## Current Safety Boundaries

The current live workflow must be described as manual product testing, not full automatic AI operations.

Safety boundaries:

- Do not put real Ozon Client ID or API Key in frontend files.
- Do not store real Ozon API keys in localStorage, sessionStorage, source code, commits, docs, logs, or chat.
- Browser-side code must not call `https://api-seller.ozon.ru` directly.
- Official seller API access must go through the Cloudflare Worker.
- Ozon product-summary is optional authorized store context only.
- Missing Ozon context must not block source-link and manual-profit analysis.
- Optional exposure, click, conversion, competitor, and ad assumptions are manual estimates only.
- Manual assumptions must not be presented as synced platform API data.
- Ozon marketplace product page links are only source links; Seller API cannot read arbitrary Ozon marketplace pages or other sellers' product data.

Current optional warning when Ozon store context is unavailable:

`Ozon 店铺商品摘要暂不可用，本次先基于来源链接、手动商品信息和利润测算进行分析。`

## Current Non-Capabilities

The current live workflow does not provide:

- automatic 1688 page scraping
- automatic Taobao page scraping
- automatic Amazon page scraping
- automatic Ozon marketplace page scraping
- external product parsing API integration
- real Ozon exposure sync
- real Ozon click sync
- real Ozon conversion sync
- real Ozon ad sync
- real Ozon order sync
- real Ozon finance sync
- stock update
- price update
- write/update/delete/create Ozon endpoints
- full-store product sync
- pagination
- database
- login
- payment
- long-term credential storage
- ERP, inventory, order, or finance management

## Current Limitations

- Source links identify the domain only; the frontend does not automatically read product title, source price, image, specifications, ratings, or sales from source pages.
- Product title, source cost, category, and notes must be entered manually.
- Optional exposure, click rate, conversion rate, competitor count, competitor price, and ad/share values are manual estimates.
- The report can support a testing decision, but it is not proof of future sales performance.
- Ozon product-summary can only use authorized seller context through the Worker and temporary credentials when explicitly provided.
- Product-summary is not market-wide competitor analysis.
- The system does not verify real marketplace demand, search volume, rating threshold, review quality, ad CPC, conversion rate, return rate, or stock pressure.
- Heavy or oversized products still require manual review of logistics channel fit, dimensional weight, packaging, and return risk.

## Seller-Facing Manual Test Checklist

Use this checklist to evaluate whether the live report answers:

- Is this product worth a small test?
- What is the profit risk?
- What is the logistics or weight risk?
- What information is still missing?
- What should the seller do next?

### 1. Likely Profitable Product

Manual test setup:

- Choose a lightweight product with moderate purchase cost.
- Fill source link, product title, purchase cost, category, and selling point notes.
- Enter a reasonable profit calculator setup with healthy profit margin.
- Leave optional exposure/click/conversion assumptions empty first.

Expected evaluation:

- Report should still appear without optional assumptions.
- Report should identify that profit has testing space.
- Next action should recommend small testing, not direct scaling.
- Missing information should remain clear: real demand, clicks, conversion, reviews, and return risk still need manual testing.

### 2. Low-Margin Product

Manual test setup:

- Choose a product where purchase cost, logistics, commission, or advertising leaves low profit margin.
- Fill manual product information.
- Use the profit calculator to create low margin, such as below 10% or near break-even.

Expected evaluation:

- Report should warn that the product is risky or only suitable for cautious testing.
- Profit risk should be visible before optional traffic assumptions.
- Next action should suggest lowering cost, changing price, changing product, or avoiding ad spend until assumptions improve.

### 3. Heavy Or Logistics-Risk Product

Manual test setup:

- Choose a heavy or bulky product.
- Fill weight and dimensions in the profit calculator.
- Fill manual product title, cost, category, and notes.

Expected evaluation:

- Report should mention logistics or weight risk when logistics cost becomes a meaningful pressure item.
- Seller should be prompted to review channel fit, dimensional weight, packaging, and return cost.
- Product should not look safe only because optional exposure/click/conversion assumptions are optimistic.

### 4. 1688 Source Link

Manual test setup:

- Paste a `detail.1688.com` source link.
- Fill title, purchase cost, category, and selling point notes manually.

Expected evaluation:

- Source domain should be recognized.
- Report should not fail because title, image, price, or specifications are not automatically read.
- Manual product information should drive the decision report.

### 5. Ozon Marketplace Link

Manual test setup:

- Paste an `ozon.ru` product page link.
- Fill manual product information.

Expected evaluation:

- Report should treat the Ozon link as a source link.
- Seller API limitation should remain clear: it cannot read arbitrary Ozon marketplace pages or other sellers' products.
- Manual product information and profit snapshot should continue driving the decision.

### 6. Optional Assumptions Empty

Manual test setup:

- Fill manual product information and valid profit calculator values.
- Leave exposure, click rate, conversion rate, competitor observations, and ad/share assumptions empty.

Expected evaluation:

- Report should appear.
- Report should not show a hard failure just because optional assumptions are empty.
- Report should explicitly rely on manual product information and profit calculation first.

### 7. Optional Assumptions Filled

Manual test setup:

- Fill manual exposure, click rate, conversion rate, competitor observations, and ad/share assumptions.

Expected evaluation:

- Report may include those assumptions.
- Report must label them as manual estimates.
- Report must not imply Ozon traffic, ad, order, or finance API data was synced.

## What Should Be Tested Manually Next

Recommended next manual tests:

- Run one likely profitable product through the live workflow.
- Run one low-margin product through the live workflow.
- Run one heavy or bulky product through the live workflow.
- Compare report wording when optional assumptions are empty versus filled.
- Confirm seller can identify what information is still missing before deciding to test.
- Confirm Ozon unavailable context remains optional and does not block the report.
- Confirm no browser request goes directly to `https://api-seller.ozon.ru`.
- Confirm no real API key is saved after any temporary credential test.

## What Should Not Be Built Yet

Do not build the following until the manual workflow is stable and explicitly approved:

- real Ozon exposure/click/conversion/ad/order/finance sync
- stock or price update workflows
- write/update/delete/create Ozon endpoints
- automatic 1688/Taobao/Amazon/Ozon page scraping
- external product parsing API integration
- database
- login or user accounts
- payment or membership billing
- inventory management
- order management
- automated product sync
- ERP features
- crawler-based competitor analysis
- automatic AI claims based on unverified marketplace data

## Current Done State

- Frontend live state confirmed on Cloudflare Pages.
- Worker live URL recorded.
- Latest verified frontend commit recorded.
- Worker behavior unchanged in the latest frontend refactor.
- No real Ozon credentials were used for this checkpoint.
- No real Ozon API call was made for this checkpoint.
- No scraping, crawler, external product parsing API, or new backend behavior was added for this checkpoint.
