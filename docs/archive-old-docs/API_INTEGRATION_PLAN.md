# API Integration Plan

## Purpose

This document defines the safe path for future seller API integration. The current app is still a static frontend profit decision assistant. It must not pretend that browser JavaScript can safely read Ozon seller data or private marketplace pages.

## Why Frontend-Only Is Not Safe

Frontend-only code cannot safely connect to Ozon Seller API because browser JavaScript is visible to users and extensions. Any API key placed in HTML, JavaScript, localStorage, sessionStorage, or browser console can be copied.

The frontend also must not scrape private seller backend pages. Seller data should come from official marketplace APIs after the seller authorizes access.

## Required Architecture

The safe architecture is:

Frontend -> Cloudflare Worker -> Official marketplace seller API -> Normalized seller/product/traffic data -> AI Analysis view

The frontend should only call the configured Cloudflare Worker URL. It must never call the official Ozon API directly.

## Existing Worker Status

The project already contains a `worker/` directory with:

- `worker/index.js`
- `worker/wrangler.toml`
- `worker/wrangler.toml.example`

The current Worker already includes endpoints for health checks, store profile reads, store health checks, product analysis experiments, the first Ozon test-connection endpoint, and a minimal read-only Ozon product-summary endpoint.

## Seller Credentials

For Ozon testing, the seller conceptually needs:

- Store name
- Ozon Seller Client ID
- Ozon API Key / token
- HTTPS Cloudflare Worker URL

Credentials must not be stored in frontend files or browser storage. During early testing, the frontend may hold the Client ID and API Key only in the current page session long enough to send them to the configured Worker over HTTPS.

## Current Status: Ozon Test Connection Through Cloudflare Worker

1. Seller manually enters Client ID and API Key in the API Settings view.
2. Frontend checks that a Worker URL is configured.
3. Frontend sends the credentials only to the configured Cloudflare Worker over HTTPS.
4. Worker tests the connection against the official Ozon Seller API.
5. Frontend receives only safe status/result data.

Status as of 2026-05-28:

- The temporary-credential read-only Ozon connection test succeeded through the deployed Cloudflare Worker.
- Worker URL: `https://ozon-ai-profit-assistant.ozon-ai-profit-assistant-claire.workers.dev`
- Frontend endpoint: `POST /api/ozon/test-connection`
- Worker Ozon endpoint: `POST https://api-seller.ozon.ru/v3/product/list`
- Worker request body uses `limit: 1`.
- This only verifies authentication and minimal read-only product-list access.
- Real credential tests should not be repeated unnecessarily.

The frontend must not print credentials, display the API key after input, or save the API key to localStorage.

This is not full store data sync. A successful test connection only proves that the credentials can authenticate through the backend proxy and that the Worker can reach Ozon Seller API. It does not import orders, products, traffic, finance, or competitor data.

Implemented endpoint:

- `POST /api/ozon/test-connection`
- `POST /api/ozon/product-summary`
- `POST /api/source/preview`

Safe response fields:

- `connected`
- `message`
- `maskedClientId`
- `timestamp`

## Current Status: Minimal Ozon Product Summary Through Worker

Status as of 2026-05-28:

- `POST /api/ozon/product-summary` is implemented in `worker/index.js`.
- The endpoint accepts temporary Ozon credentials in the request body for the current request only.
- The frontend reads `clientId` and `apiKey` directly from the API Settings temporary Ozon input fields only when the seller clicks product analysis.
- The frontend sends `limit: 3` for the product-summary request; the Worker still clamps all requested limits to `1-5`.
- After the analysis request path completes, the frontend clears the Ozon API Key input field.
- The Worker does not store, log, return, or persist the raw API Key.
- The frontend still does not call `https://api-seller.ozon.ru` directly.
- If temporary credentials are missing, the endpoint returns a safe disconnected/missing-credential state instead of reading any seller data.
- The endpoint limits the product sample to 1-5 items and defaults to 3 when no limit is provided.
- Requested limits above 5 are clamped to 5.

Read-only Ozon endpoints used:

- `POST https://api-seller.ozon.ru/v3/product/list`
- `POST https://api-seller.ozon.ru/v3/product/info/list`

Internal `product/list` request body:

```json
{
  "filter": { "visibility": "ALL" },
  "limit": 3
}
```

The Worker builds this body from a safe numeric limit only. It does not forward extra frontend fields to Ozon `product/list`.

Frontend request body:

```json
{
  "sourceUrl": "https://example.com/product",
  "activePlatform": "Ozon",
  "clientId": "temporary_client_id_from_input",
  "apiKey": "temporary_api_key_from_password_input",
  "limit": 3,
  "selectedStore": null,
  "profitSnapshot": {},
  "assumptions": {}
}
```

The example values above are placeholders, not real credentials. The real API Key must never be written into documentation, source files, localStorage, sessionStorage, or console output.

Normalized product-summary response shape:

```json
{
  "ok": true,
  "source": {
    "url": "https://example.com/product",
    "host": "example.com",
    "title": "",
    "image": ""
  },
  "insights": {
    "category": "待人工复核",
    "keywords": [],
    "tags": [],
    "sellingPoints": [],
    "painPoints": []
  },
  "ozon": {
    "status": "connected",
    "message": "Ozon API 已通过 Worker 读取 3 条只读商品样本。",
    "products": [
      {
        "product_id": 123,
        "offer_id": "SKU-001",
        "name": "Product name",
        "visibility": "",
        "status": "unknown",
        "price": null,
        "currency_code": null,
        "stock": null,
        "sellable": null,
        "image": null,
        "product_url": null
      }
    ],
    "sampleCount": 1,
    "requestedLimit": null,
    "limit": 3,
    "limitClamped": false,
    "detailStatus": "connected",
    "maskedClientId": "12***45",
    "timestamp": "2026-05-28T00:00:00.000Z"
  },
  "limitations": [
    "Phase 2.5 只读取 1-5 条授权店铺商品样本。",
    "不执行商品同步、分页、订单、财务、广告、库存或价格写入。"
  ]
}
```

Unavailable fields remain `null`, `unknown`, empty, or omitted. The endpoint does not add extra Ozon endpoints just to fill missing fields.

### Product Summary Status Contract

`POST /api/ozon/product-summary` uses HTTP status and JSON status together:

- Valid request with temporary credentials and readable Ozon response: HTTP `200`, `ok: true`, `ozon.status: "connected"`, `ozon.products` contains `0-5` normalized items, and `ozon.sampleCount` equals the returned product count.
- Missing request body or invalid JSON body: HTTP `400`, `ok: false`, `ozon.status: "invalid_request"`, `ozon.products: []`, `ozon.sampleCount: 0`.
- Missing `clientId` or missing `apiKey`: HTTP `200`, `ok: false`, `ozon.status: "missing_credentials"` when credential fields are present but empty, or `"api_not_connected"` when no credential fields are sent; `ozon.products: []`, `ozon.sampleCount: 0`.
- Invalid or empty credentials that are not sent to Ozon because a field is missing: same as missing credentials.
- Invalid non-empty credentials rejected by Ozon: HTTP `200`, `ok: false`, `ozon.status: "permission_error"` for `401` / `403`, `ozon.products: []`, `ozon.sampleCount: 0`.
- Ozon `product/list` non-200 response: HTTP `200`, `ok: false`, `ozon.status: "product_list_error"` for non-auth failures, `ozon.failureStep: "product_list"`, safe diagnostic metadata with endpoint name and effective limit only, `ozon.products: []`, `ozon.sampleCount: 0`.
- Other Ozon non-200 response: HTTP `200`, `ok: false`, `ozon.status: "api_error"`, `ozon.products: []`, `ozon.sampleCount: 0`.
- Malformed Ozon product-list response: HTTP `502`, `ok: false`, `ozon.status: "malformed_response"`, `ozon.products: []`, `ozon.sampleCount: 0`.
- Unsupported method on this route: HTTP `405`, `ok: false`.
- Unknown route: HTTP `404`, `ok: false`.

Limit handling:

- Missing limit defaults to `3`.
- Limit below `1` is clamped to `1`.
- Limit above `5` is clamped to `5`.
- `ozon.limitClamped` is `true` when the requested numeric limit differs from the effective limit.

The frontend treats real Ozon product data as connected only when `ozon.status === "connected"`. Missing credentials and failed Ozon responses do not use the connected status and return an empty product list with `sampleCount: 0`.

Frontend interpretation:

- Source product link recognition is the main AI Analysis flow.
- Ozon Seller API `product-summary` is optional authorized store context only.
- A failed or missing `product-summary` response must not fail the source-link analysis preview.
- Ozon marketplace product page links are treated as pasted source links; Seller API cannot directly read arbitrary Ozon pages or other sellers' product data.
- When `ozon.status !== "connected"`, the frontend should show the source preview and keep the unavailable store-context warning in the report's single `数据边界` note: `Ozon 店铺商品摘要暂不可用，本次先基于来源链接、手动商品信息和利润测算进行分析。`

## Current AI Analysis Manual Preview Workflow

The AI Analysis page is a manual-preview workflow with optional public metadata preview, not a crawler or product-data scraper:

- The source URL identifies the product source domain, such as `detail.1688.com`, `amazon.com`, a brand site, or an Ozon marketplace page.
- When a Worker URL is configured, the frontend may call `POST /api/source/preview` to attempt a single safe public metadata read for the pasted URL.
- Source preview attempts a platform-aware public product extraction from the single pasted URL. Extraction order is JSON-LD Product, Open Graph metadata, Twitter card metadata, common product meta/itemprop fields, `<title>`, and conservative visible price text patterns returned in the HTML.
- Source preview may return a public visible price only when it is clearly present in returned public page data. It must label the price as `candidate_source_cost`, `market_reference_price`, or `unknown`; it must not invent or infer hidden price.
- Source preview does not extract stock, SKU, specifications, seller data, reviews, sales count, hidden page data, login-only data, orders, or private platform fields.
- The frontend does not call 1688, Taobao, Amazon, Ozon marketplace pages, or any external product parsing API directly.
- The seller manually fills product title, source cost, category/product type, and optional selling-point notes.
- The preview report uses those manual fields together with the current profit calculator snapshot.
- The report is organized as seller-facing decision sections: `测品结论`, `利润安全边际`, `建议测试数量`, `最低售价底线`, `主要风险`, and `下一步动作`.
- Ozon `product-summary` remains optional authorized store context only and cannot block the manual preview.
- Optional exposure, click-rate, conversion-rate, competitor, ad-share, and market-observation fields are manual estimates only. They should be available before the seller clicks `生成测品建议`. Empty optional estimate fields must not block the product-testing decision report.
- The frontend does not read real Ozon exposure, click, conversion, advertising, order, finance, stock, or price data in the current workflow.

Manual product fields used by the frontend:

```json
{
  "manualProduct": {
    "title": "Manual product title",
    "sourceCost": 38.5,
    "category": "Home storage",
    "notes": "Manual selling points or checks"
  }
}
```

If a source URL is recognized but no manual title is entered, the UI should guide the seller instead of showing a failure:

`已识别来源链接，但当前不会自动抓取商品标题。请手动填写商品标题、采购价和类目信息后继续分析。`

The optional manual testing-assumption section should show this explanation:

`当前不会自动读取店铺曝光、点击、转化、广告或订单数据。以下参数仅用于人工模拟测品结果，不代表平台 API 自动同步数据。`

## Current Source Preview Endpoint

`POST /api/source/preview` is a single-URL public product preview endpoint. It is platform-aware, but it is still not a crawler, scraper, headless browser, login session, or external product parser.

Request body:

```json
{
  "url": "https://example.com/product-page"
}
```

Successful response shape:

```json
{
  "ok": true,
  "source": {
    "url": "https://example.com/product-page",
    "finalUrl": "https://example.com/product-page",
    "host": "example.com",
    "platform": "Generic ecommerce",
    "platformType": "unknown",
    "title": "Public page title",
    "image": "https://example.com/og-image.jpg",
    "description": "Public meta description",
    "canonicalUrl": "https://example.com/product-page",
    "price": null,
    "currency": "",
    "priceRole": "unknown",
    "categorySuggestion": "家居百货",
    "confidence": {
      "title": "medium",
      "price": "none",
      "category": "low"
    },
    "extractionSources": {
      "title": "Open Graph title",
      "price": "",
      "image": "Open Graph/Twitter image",
      "category": "local keyword category rule"
    },
    "redirectCount": 0
  },
  "analysis": {
    "summary": "来源平台：Generic ecommerce。已识别商品标题：Public page title。当前结果只基于公开页面返回内容和本地规则。",
    "likelyUseCase": "通用商品页，需要人工判断是货源还是销售参考",
    "sellingPoints": [],
    "riskNotes": [
      "未能自动识别价格，请手动填写或确认。"
    ],
    "manualConfirmationNeeded": [
      "采购价或平台参考价"
    ]
  },
  "finalUrl": "https://example.com/product-page",
  "redirectCount": 0,
  "limitations": []
}
```

Safe fallback response shape:

```json
{
  "ok": false,
  "source": {
    "url": "https://example.com/product-page",
    "host": "example.com",
    "platform": "External source",
    "title": "",
    "image": "",
    "description": "",
    "canonicalUrl": ""
  },
  "message": "无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。",
  "limitations": [],
  "finalUrl": "https://example.com/product-page",
  "redirectCount": 0
}
```

Safety boundaries:

- Accepts only `http:` and `https:` URLs.
- Rejects URLs with username/password credentials.
- Rejects localhost, private IPv4 ranges, local/internal host suffixes, literal IPv6 hosts, and non-standard numeric host forms.
- Uses a short timeout and follows only limited public HTTP redirects: maximum 3 redirects, `GET` method only, with every `Location` resolved against the current URL and rechecked by the same URL safety rules.
- Stops with the manual fallback message when redirect count exceeds the limit, the redirect target is invalid, or the redirect target points to localhost, private/internal addresses, unsafe protocols, credential URLs, or other blocked hosts.
- Reads only a limited amount of response text needed for metadata.
- Detects major ecommerce hosts, including 1688, Taobao, Tmall, Pinduoduo/Yangkeduo, JD, AliExpress, Amazon, Ozon, Wildberries, and Yandex Market.
- Marks 1688/Taobao/Tmall/Pinduoduo/JD/AliExpress prices as `candidate_source_cost`.
- Marks Amazon/Ozon/Wildberries/Yandex Market prices as `market_reference_price`.
- Returns `price: null` when no public visible price is found.
- Does not use Puppeteer, Playwright, browser automation, login cookies, proxy scraping, or external parsing APIs.
- Does not call Ozon Seller API and does not accept Ozon credentials.

Live verification notes as of 2026-06-05:

- `https://example.com/` returns public metadata successfully, including title `Example Domain`.
- Safe redirect handling is live: `http://github.com/` resolves to `https://github.com/` with `redirectCount: 1`; `http://www.cloudflare.com/` resolves to `https://www.cloudflare.com/` with `redirectCount: 1`; `http://amazon.com/` resolves to `https://www.amazon.com/` with `redirectCount: 2`.
- `https://detail.1688.com/offer/123456789.html` and `https://www.1688.com/` currently fall back safely in live checks.
- 1688/Taobao and some ecommerce platforms may block Cloudflare Worker fetches, require dynamic rendering, or return metadata-empty pages. In those cases, the product remains usable through manual title/cost/category input.
- These results do not mean the app can reliably scrape 1688, Taobao, Amazon, Ozon, or other ecommerce product details. The endpoint still does not extract product price, stock, SKU, specifications, reviews, sales count, seller data, hidden platform data, or login-only data.
- Source preview failure must remain a non-blocking state; the seller can continue with manual product information and the profit calculator snapshot.

## Future Worker Endpoints

Planned safe Worker endpoints:

- `POST /api/ozon/store-metrics`
- orders/postings
- finance/profit comparison
- product/category analysis input endpoint for normalized AI Analysis data

These endpoints should return only normalized safe data to the frontend. They should not return raw secrets.

## `/api/ozon/product-summary` Implementation Audit

Current frontend placeholder references exist in `js/product-selection.js`:

- `requestOzonProductAnalysis(...)` requests `apiBaseUrl + '/api/ozon/product-summary'`.
- `buildWorkerEndpointNotReadyAnalysis(...)` displays a safe endpoint-not-ready message when the Worker returns 404.

Current Worker status:

- `worker/index.js` implements `POST /api/ozon/product-summary`.
- The route can trigger a real Ozon read-only API call only when temporary credentials are included in the request body.
- The frontend attaches temporary Ozon credentials only from the current API Settings input fields at product-analysis click time.
- If a credential-bearing request would use an insecure non-local Worker URL, the frontend returns a safe not-connected result and does not send the credentials.
- The browser still does not call `https://api-seller.ozon.ru` directly.

Current scope for `POST /api/ozon/product-summary`:

- read only 1-5 products
- no pagination
- no full-store sync
- no database
- no long-term storage
- no order sync
- no finance sync
- no ad sync
- no stock update
- no price update
- no write operation of any kind

Normalized fields currently allowed:

- `product_id`
- `offer_id`
- product name
- visibility/status
- price, only if safely available from an official read-only endpoint
- stock or sellable status, only if safely available from an official read-only endpoint
- image or product link, only if safely available from an official read-only endpoint

See `docs/PHASE_2_5_OZON_READ_ONLY_CONNECTION_AUDIT.md` for the Phase 2.5 read-only connection and product-summary implementation audit.

## Current Limitation

No real seller API call is performed unless a Worker backend is configured and the seller explicitly clicks a connection or analysis action. If the Worker URL is missing, the app remains in manual/preview mode and shows a clear backend-not-configured message.
