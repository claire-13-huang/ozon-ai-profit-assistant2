# Phase 4A Deployment Guide

## Purpose

This guide explains how to connect the static frontend to the Cloudflare Worker backend for the Ozon AI product recognition report.

The repository must not contain real Ozon API credentials.

## Frontend Config

The frontend reads the Worker URL from:

```js
js/config.js
```

Before Worker deployment, keep:

```js
window.PRODUCT_SELECTION_API_BASE_URL = '';
```

After Worker deployment, set it to the Worker base URL:

```js
window.PRODUCT_SELECTION_API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';
```

Do not add `/api/health` or `/api/analyze-product` to this value. The frontend appends those paths automatically.

The page also provides a safer runtime shortcut in `店铺 API 管理`:

1. Paste the deployed Worker base URL into `Cloudflare Worker 地址`.
2. Click `保存地址`.
3. The URL is saved in browser localStorage and used immediately for `/api/health`, `/api/stores`, `/api/store-health`, and `/api/analyze-product`.

This runtime field does not store platform API keys. It only stores the public Worker URL.

## Cloudflare Worker

Worker files:

- `worker/index.js`
- `worker/wrangler.toml`
- `worker/wrangler.toml.example`

Expected endpoints:

- `GET /api/health`
- `POST /api/analyze-product`

The Worker can be deployed with Cloudflare dashboard or Wrangler. `worker/wrangler.toml` is safe to commit because it does not contain real secrets.

Wrangler command:

```bash
cd worker
npx wrangler deploy
```

If Wrangler asks for login, complete Cloudflare login in the browser with your own account.

In the Codex desktop non-interactive terminal, Wrangler may refuse deployment unless `CLOUDFLARE_API_TOKEN` is set. Do not paste that token into chat or commit it to the repository. Use one of these safer options:

- run `npx wrangler deploy` yourself in a normal terminal after logging in to Cloudflare
- deploy from the Cloudflare dashboard by uploading/connecting this Worker code
- set `CLOUDFLARE_API_TOKEN` only in your own local terminal session or secure CI secret store, then run the deploy command there

## GitHub Actions Deployment

The repository includes:

```text
.github/workflows/deploy-worker.yml
```

This workflow is manual-only (`workflow_dispatch`) and deploys the Worker through Cloudflare Wrangler. Before running it, add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OZON_CLIENT_ID`
- `OZON_API_KEY`
- `STORE_API_CREDENTIALS_JSON` if multiple real stores are needed; if not used, set it to `[]`

Do not put these values into source files, issues, commits, or chat messages. After the workflow succeeds, copy the public Worker URL into the page's `Cloudflare Worker 地址` field or into `js/config.js`.

Dry-run check:

```bash
cd worker
npx wrangler deploy --dry-run
```

The dry-run should finish without requiring Ozon credentials.

## Ozon Credentials

Required Cloudflare environment variables:

- `OZON_CLIENT_ID`
- `OZON_API_KEY`
- `STORE_API_CREDENTIALS_JSON` for multiple real stores

Rules:

- Do not paste these values into chat.
- Do not put these values in `js/config.js`.
- Do not commit these values to GitHub.
- Configure them only in Cloudflare environment variables or secrets.

## Local Real API Test

For local testing, Wrangler can read secrets from:

```text
worker/.dev.vars
```

This file is ignored by Git and must not be committed. Use `worker/.dev.vars.example` only as a template.

Local test steps:

1. Create `worker/.dev.vars` on your own machine.
2. Add:

```text
OZON_CLIENT_ID="your_real_client_id"
OZON_API_KEY="your_real_api_key"
```

For multiple real stores, use:

```text
STORE_API_CREDENTIALS_JSON='[
  {
    "platform": "Ozon",
    "name": "Ozon 主店",
    "credentialRef": "OZON_MAIN",
    "clientId": "your_real_client_id",
    "apiKey": "your_real_api_key"
  },
  {
    "platform": "Wildberries",
    "name": "WB 主店",
    "credentialRef": "WB_MAIN",
    "token": "your_real_wb_token"
  },
  {
    "platform": "Yandex",
    "name": "Yandex 主店",
    "credentialRef": "YANDEX_MAIN",
    "apiKey": "your_real_yandex_api_key"
  }
]'
```

The frontend can then click `同步后端真实店铺` and choose one store for product analysis.

3. Start the Worker locally:

```bash
cd worker
npx wrangler dev --local --port 8787
```

4. In another local frontend run, set `js/config.js`:

```js
window.PRODUCT_SELECTION_API_BASE_URL = 'http://127.0.0.1:8787';
```

5. Open `/api/health` or refresh the frontend.
6. Expected with valid credentials: Ozon status should show `connected`, and the report can display a small sample from your Ozon product list.

After testing, do not commit `worker/.dev.vars` or any real credential value.

## Manual Verification

1. Open the frontend.
2. Confirm the Ozon API status panel shows a clear Worker state.
3. Open `https://your-worker.your-subdomain.workers.dev/api/health`.
4. Expected without credentials: `missing_credentials`.
5. Add Ozon credentials in Cloudflare.
6. Open `/api/health` again.
7. Expected with valid credentials: `connected`, plus a small shop product sample if Ozon returns products.
8. Open `/api/stores` to confirm the backend returns sanitized store profiles without secrets.
9. Paste a product URL in the frontend, choose a store, and click `开始智能分析`.

## Current Limitation

Phase 4A checks Ozon API connection and reads public source-page metadata. It does not yet provide verified Ozon market-wide competitor count, average price, rating, reviews, or sales.
