# AI Product Selection Pre-Decision Plan

## Purpose

This document defines the first safe version of the product selection pre-decision assistant.

The goal is to help Ozon / Wildberries / Yandex sellers combine:

- current profit calculation
- competitor count
- competitor price range
- top competitor rating and review barrier
- advertising cost assumption
- store type and traffic/order context

The first version is a manual / semi-automatic decision helper. It does not scrape marketplace pages, does not call AI APIs, does not connect seller accounts, and does not read platform data automatically.

## Development Workflow Applied

This milestone follows the Codex workflow recommended in the provided Chinese PDF:

- define Goal / Context / Constraints / Done when before coding
- keep the first version small and independently testable
- avoid unrelated refactors
- preserve existing working features
- run syntax checks after JavaScript changes
- verify the page in a real browser after frontend changes
- document changed rules and manual test cases

## First Version Data Source

The user manually enters or copies the key marketplace signals:

- target platform
- product link
- product image URL
- target category
- competitor count
- competitor average price
- competitor minimum and maximum price
- top competitor rating
- top competitor review count
- estimated advertising share
- advertising type
- store type
- recent order range
- local preference or notes

The current profit calculator provides:

- selling price
- selling price converted to RUB
- logistics cost
- purchase cost
- commission cost
- advertising cost
- profit
- profit margin

## Report Output

The page should output a decision report, not a guaranteed score.

Allowed report conclusions:

- `建议小量测试`
- `谨慎测试`
- `暂不建议`
- `等待数据`

The report explains:

- price position versus competitor average price
- current profit and profit margin quality
- competition barrier from competitor count, rating, and reviews
- advertising pressure under the entered ad share
- store fit based on vertical store, mixed store, new store, or mature store
- next practical actions

## First Version Rules

- If the product link, target category, competitor count, competitor average price, ad share, store type, or valid profit calculation is missing, show a waiting state.
- If profit is negative, show `暂不建议`.
- If profit margin is below 10% and estimated ad share is 30% or higher, show `暂不建议`.
- If profit margin is from 10% to below 20%, show `谨慎测试`.
- If current RUB price is 30% higher than competitor average price and the store is new or mixed, show price conversion risk.
- If current RUB price is meaningfully lower than competitor average price while profit is still healthy, warn that low price should not be the only strategy.
- If competitor count is high or top competitor reviews are high, warn that the competition barrier is high.
- If the store is vertical, emphasize category fit and review/keyword accumulation.
- If the store is mixed, emphasize lightweight testing and inventory risk.
- If the store is new, emphasize small ad budgets and first-order cost.
- If the store is mature, suggest using historical traffic and customer fit.

## Future API Gate

Automatic data collection should only be considered after the rule-based workflow is stable.

Future API work requires:

- backend service
- API credentials stored outside the frontend
- clear seller authorization
- platform-specific API limits and error handling
- privacy and data retention rules
- fallback to manual input

Potential future sources:

- Ozon Seller API and Performance API
- Wildberries Analytics API
- Yandex Market Partner API
- compliant third-party marketplace analytics providers

## Explicit Non-Goals

Do not add in this version:

- OpenAI API calls
- real AI model integration
- backend
- database
- login
- user accounts
- crawler
- automatic product link scraping
- automatic competitor scraping
- inventory or ERP features
- React / Vue / TypeScript

## Manual Verification

The page is acceptable when:

- existing profit calculation still works
- product selection report updates after manual competitor fields are filled
- empty key fields show a waiting state
- low profit plus 30% ad share warns against advertising
- high price versus competitor average warns about conversion risk
- high competitor count or high review barrier warns about competition
- localStorage restores the new fields
- CSV export remains usable
- `node --check` passes for modified JavaScript files
