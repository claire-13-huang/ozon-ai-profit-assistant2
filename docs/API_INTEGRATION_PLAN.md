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
