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

## Cloudflare Worker

Worker files:

- `worker/index.js`
- `worker/wrangler.toml.example`

Expected endpoints:

- `GET /api/health`
- `POST /api/analyze-product`

The Worker can be deployed with Cloudflare dashboard or Wrangler. If using Wrangler, copy the example config to Cloudflare's expected config name locally and do not commit secrets.

## Ozon Credentials

Required Cloudflare environment variables:

- `OZON_CLIENT_ID`
- `OZON_API_KEY`

Rules:

- Do not paste these values into chat.
- Do not put these values in `js/config.js`.
- Do not commit these values to GitHub.
- Configure them only in Cloudflare environment variables or secrets.

## Manual Verification

1. Open the frontend.
2. Confirm the Ozon API status panel shows a clear Worker state.
3. Open `https://your-worker.your-subdomain.workers.dev/api/health`.
4. Expected without credentials: `missing_credentials`.
5. Add Ozon credentials in Cloudflare.
6. Open `/api/health` again.
7. Expected with valid credentials: `connected`.
8. Paste a product URL in the frontend and click `开始智能分析`.

## Current Limitation

Phase 4A checks Ozon API connection and reads public source-page metadata. It does not yet provide verified Ozon market-wide competitor count, average price, rating, reviews, or sales.
