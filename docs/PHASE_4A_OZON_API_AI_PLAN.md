# Phase 4A: Ozon API + AI Product Recognition Plan

## Goal

Phase 4A turns the product selection area from a manual placeholder into an automatic Ozon-first analysis flow.

The seller should paste one source product URL, click `开始智能分析`, and see:

- source product recognition status
- product title, image, category candidate, keywords, and tags when available
- Ozon API connection status
- profit and advertising judgment based on the existing calculator
- clear next actions

This phase does not promise exact Ozon competitor count, average price, rating, reviews, or sales unless an official API or compliant data source provides them.

## Architecture

Frontend remains:

- `index.html`
- `css/style.css`
- Vanilla JavaScript

New backend:

- Cloudflare Worker under `worker/`
- `GET /api/health`
- `POST /api/analyze-product`

The frontend calls the Worker. The Worker reads public source-page metadata and checks Ozon API credentials.

## Security Rules

Real Ozon credentials must never be saved in:

- frontend JavaScript
- HTML
- CSS
- GitHub
- documentation
- chat messages

Use Cloudflare environment variables:

- `OZON_CLIENT_ID`
- `OZON_API_KEY`

If credentials are missing, the UI must show `等待 Ozon API 授权`.

## Current Data Behavior

The Worker can:

- read public page title/meta/description/image when the source website allows it
- infer a rough category candidate from visible text
- extract simple keywords and tags
- call Ozon product list as a health check when credentials are configured

The Worker cannot guarantee:

- that every source website can be read
- exact market-wide Ozon competitor count
- exact Ozon competitor average price
- competitor ratings and reviews
- sales volume or traffic

Those require deeper official reports, seller authorization, or compliant third-party analytics.

## UI Behavior

The first screen should not look empty after clicking analysis.

Required states:

- waiting for link
- analyzing
- API service not connected
- Ozon credentials missing
- analysis completed
- example report
- invalid link

Manual competitor fields remain available only as a development/debug section.

## Validation

Manual checks:

- invalid URL shows an error
- no Worker URL shows `API 服务未连接`
- demo report renders without backend
- existing profit calculator still works
- exchange rate helper still works
- preset template still works
- CSV export still works
- `node --check js/product-selection.js js/main.js worker/index.js` passes

## Next Milestones

1. Deploy Worker to Cloudflare free plan.
2. Configure Worker URL in the frontend as `window.PRODUCT_SELECTION_API_BASE_URL`.
3. Add Ozon credentials in Cloudflare environment variables.
4. Verify `/api/health`.
5. Expand Ozon adapter only after confirming which official API methods provide useful seller data.

Deployment details are documented in `docs/PHASE_4A_DEPLOYMENT_GUIDE.md`.
