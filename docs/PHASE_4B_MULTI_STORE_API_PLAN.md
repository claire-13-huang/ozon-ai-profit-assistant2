# Phase 4B: Multi-Platform Store API Management

## Goal

Phase 4B adds a store API management layer for Ozon / Wildberries / Yandex.

The user can create store API profiles by platform, store name, and backend credential reference. The frontend does not store real API keys.

Real API keys are stored in the Worker/backend through `STORE_API_CREDENTIALS_JSON` or future encrypted credential storage. The frontend syncs sanitized store profiles and lets the seller select one store for product analysis.

## Membership Limits

Current MVP limits:

- Free / no membership: 1 store
- Monthly card: 5 stores
- Yearly card: 10 stores

These limits apply to total connected stores across all platforms in the current MVP.

## Safe Data Model

Frontend may store:

- platform
- store display name
- backend credential reference, for example `OZON_MAIN`
- connection status label

Frontend must not store:

- Ozon API Key
- Wildberries API token
- Yandex OAuth token
- any secret value copied from a seller backend

Real credentials must stay in a backend secret store, Cloudflare environment variables, or a future encrypted database.

## UI Behavior

The store API panel should:

- show membership tier
- show current capacity usage
- show platform counts
- sync real backend-configured stores
- test a selected store API connection
- let the product analysis choose one store profile
- add a store profile when under the limit
- block adding more stores when over the limit
- remove a frontend store profile
- remind users that removing a profile does not delete backend secrets

## Future Backend Requirement

To make multi-store API truly live, the backend needs:

- account login or admin authentication
- encrypted credential storage
- store-to-credential mapping
- per-platform API adapters
- quota checks based on paid plan
- audit log for credential changes

Current Worker support:

- Ozon: validates API credentials and reads product samples.
- Wildberries: validates an analytics token with the official analytics ping endpoint.
- Yandex: validates an API-Key style token against the Partner API campaigns endpoint.

This is not safe to implement as frontend-only localStorage.
