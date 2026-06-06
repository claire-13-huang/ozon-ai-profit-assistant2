# AI Product Selection Pre-Decision Plan

## Purpose

This document defines the first safe version of the product selection pre-decision assistant.

The intended long-term goal is: the seller pastes one product URL from any source website worldwide, and the system automatically builds a product selection report for Ozon / Wildberries / Yandex.

The source URL can come from:

- 1688, Taobao, Pinduoduo, JD, or other China supply sites
- Amazon, AliExpress, Shopify stores, brand sites, or independent websites
- any public product page that can be legally and technically read by a future backend service

The future automatic system should identify:

- source product image
- product category
- core attributes
- selling points
- possible buyer pain points
- search keywords
- topic tags

Then it should search the three target platforms and combine:

- current profit calculation
- competitor count
- similar product links
- competitor price range
- top competitor rating and review barrier
- competitor pain points from reviews where data is available
- search keywords and topic tags
- advertising cost assumption
- store type and traffic/order context

The current static page is only an interface and data-shape reservation for that future automatic workflow. It does not scrape marketplace pages, does not call AI APIs, does not connect seller accounts, and does not read platform data automatically.

## Development Workflow Applied

This milestone follows the Codex workflow recommended in the provided Chinese PDF:

- define Goal / Context / Constraints / Done when before coding
- keep the first version small and independently testable
- avoid unrelated refactors
- preserve existing working features
- run syntax checks after JavaScript changes
- verify the page in a real browser after frontend changes
- document changed rules and manual test cases

## Future Automatic Data Source

The desired automatic workflow is:

1. User pastes one source product URL.
2. Backend fetches or extracts the source product page where legally and technically allowed.
3. AI or product parsing logic identifies product image, category, attributes, selling points, pain points, keywords, and topic tags.
4. Backend searches Ozon / Wildberries / Yandex for similar products.
5. Backend aggregates competitor count, average price, price range, rating, review count, review pain points, keywords, and topic tags.
6. Frontend receives structured data and renders the report.

Temporary static fields in the current page represent future auto-filled data:

- target platform
- source product link
- target platform similar product link
- product image URL
- target category
- competitor count
- competitor average price
- competitor minimum and maximum price
- top competitor rating
- top competitor review count
- competitor review pain points
- search keywords
- topic tags
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

- If the source product link, category, competitor count, competitor average price, ad share, store type, or valid profit calculation is missing, show a waiting state.
- In the current static version, missing auto-collected data should be explained as `waiting for backend/API collection`, not as the final desired user behavior.
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

Automatic data collection requires a new backend/API phase. It cannot be completed inside the current static frontend alone.

Future API work requires:

- backend service
- API credentials stored outside the frontend
- clear seller authorization
- platform-specific API limits and error handling
- privacy and data retention rules
- fallback to manual review
- compliance review for scraping or third-party data sources
- rate limits and anti-abuse controls
- source URL parser for many website structures
- image search or visual similarity matching
- keyword extraction and translation between Chinese / English / Russian where useful

Potential future sources:

- Ozon Seller API and Performance API
- Wildberries Analytics API
- Yandex Market Partner API
- compliant third-party marketplace analytics providers
- computer vision or multimodal AI for product image/category recognition
- search APIs or approved crawling only where allowed

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
