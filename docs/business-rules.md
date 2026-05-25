# Business Rules

## Profit Formula

- Profit formula remains unchanged in Phase 2 explanation work.
- Total cost is calculated from purchase cost, logistics fee, commission, advertising fee, tax, withdrawal fee, return cost, label fee, and other cost.
- Profit margin means `profit / selling price`.

## Result Explanation Rules

- Show result explanations only after inputs pass validation.
- Always explain that total cost is made from purchase, logistics, commission, advertising, tax, withdrawal, return, label, and other fees.
- Always explain that profit margin is the safety space under the current selling price.
- Identify the highest cost pressure item from existing calculated values only:
  - purchase cost
  - logistics fee
  - commission fee
  - advertising fee
  - other cost
- If no reliable cost pressure exists, show a general explanation instead of inventing a reason.

## Cost Pressure Logic

- Compare the known cost item amounts after calculation.
- The highest positive amount is treated as the current main pressure item.
- If profit is negative, explain that cost or selling price should be reviewed before testing.
- If profit margin is below 10%, explain that return, advertising, logistics error, or exchange-rate changes may remove profit.
- If profit margin is from 10% to below 20%, explain that the result is only barely testable and should not be treated as healthy.
- If profit margin is from 20% to below 30%, explain that the result has some safety space but still needs small-scale testing.
- If profit margin is 30% or higher, explain that margin is stronger but still not guaranteed.
- If profit is positive, keep the wording as operational reference, not a final business conclusion.

## Next Action Rules

- Show next action only after inputs pass blocking validation.
- If profit is negative, show a risk action and recommend checking the highest cost pressure item first.
- If profit margin is below 10%, show a warning action and recommend rechecking cost structure before scaling spend.
- If profit margin is from 10% to below 20%, show a warning action and recommend only small validation testing.
- If purchase cost is the highest pressure item, recommend checking supply price and purchase assumptions.
- If logistics fee is the highest pressure item, recommend checking product size, weight, and channel fit.
- If advertising fee is the highest pressure item, recommend controlling budget and testing in small scale.
- If profit margin is from 20% to below 30%, show cautious testing guidance, not a guaranteed healthy conclusion.
- If profit margin is 30% or higher, show a stronger but still cautious action.
- If input is invalid, show a neutral message and do not show a confident next action.

## Diagnosis Rules

- Show rule-based diagnosis after inputs pass blocking validation.
- Use the same conservative margin bands as the profit decision and next action.
- If profit margin is from 10% to below 20%, diagnosis should say the result is only barely testable and not suitable for direct scaling.
- Diagnosis should mention the largest known cost pressure item when one exists.
- Diagnosis remains an operating reference only and does not guarantee sales, profit, or platform accuracy.

## LocalStorage Save/Load Rules

- Save only user-editable form values and selected platform/supplier/service.
- Do not save calculated result text such as profit, total cost, logistics fee, diagnosis, or explanation output.
- Restore saved values when the page loads, then run the normal validation and calculation flow.
- Invalid saved values are allowed to restore, but they must still be caught by validation.
- If `localStorage` is unavailable or blocked, fail silently and keep the calculator usable.
- No sensitive secrets or API keys should be entered or saved in this MVP.
- There is currently no reset/clear button, so no visible clear behavior is added in this milestone.

## Daily Reference Exchange Rate Rules

- The exchange rate field remains manually editable.
- The user must click `获取当日参考汇率` before the app fills a reference exchange rate.
- The app must not silently overwrite a user-entered exchange rate on page load.
- The current reference source is Frankfurter, using a no-key public API.
- The UI wording must use `当日参考汇率`, not `实时汇率`.
- The reference rate is only for operational testing and learning. It is not trading-grade, guaranteed, platform-official, or real-time.
- When a reference rate is applied, the existing calculation, validation, diagnosis, cost explanation, and localStorage save flow should run normally.
- If fetching fails, keep the existing manually entered value and show `参考汇率获取失败，请手动填写。`
- A successfully fetched reference rate can be cached in localStorage for the same local day to reduce repeat requests.
- The exchange rate helper does not change profit formulas or logistics rules.

## Preset Template Rules

- Phase 3 currently implements only one preset: Healthy Profit Baseline.
- The preset only fills existing input fields and existing platform/supplier/service selections.
- The preset does not change formulas, logistics rules, validation rules, diagnosis rules, or CSV export rules.
- After applying the preset, the normal calculation, validation, diagnosis, cost explanation, and localStorage save flow should run.
- Preset values are examples for testing and learning only. They do not represent real-time platform data or guaranteed profit.
- Applying a preset replaces current input values, so users should review all fields before using the result.
- Users can edit any preset-filled field after applying the preset; edited values should recalculate and save normally.

## Product Selection Pre-Decision Rules

- The intended product selection assistant starts from one source product URL from any website worldwide.
- The future automatic version should identify product category, images, attributes, selling points, pain points, keywords, and topic tags from that source link.
- It should then search Ozon / Wildberries / Yandex for similar products and collect competitor count, average price, price range, rating, review count, review pain points, keywords, and topic tags.
- The current static frontend does not scrape marketplace pages, read product images automatically, call AI APIs, connect seller accounts, or use backend services.
- Temporary manual fields represent future auto-filled data and should not be treated as the final intended workflow.
- The report must combine collected competitor signals with the current profit calculation.
- Required report inputs are source product link, target category, competitor count, competitor average price, estimated advertising share, store type, and valid profit calculation.
- If required inputs are missing, show a waiting state and do not generate a confident conclusion.
- Missing competitor/category data should be explained as waiting for future backend/API collection.

## Phase 4A Ozon API Product Recognition Rules

- The Ozon AI product selection assistant starts from one source product URL.
- The first automatic version prioritizes Ozon only; Wildberries and Yandex remain future platform adapters.
- The frontend must not call Ozon directly because Ozon credentials must not be exposed in browser JavaScript.
- A Cloudflare Worker may read public source-page metadata and check Ozon API connection status.
- If the Worker is not deployed, the page must show `API 服务未连接`.
- If Ozon credentials are not configured, the page must show `等待 Ozon API 授权`.
- If the source website blocks reading, the report should say that the source page cannot be automatically read.
- The report may use the existing profit, profit rate, logistics cost, purchase cost, commission cost, and advertising cost.
- If profit rate is below 10%, the report should warn against direct advertising tests.
- If profit rate is between 10% and 20%, the report should recommend only small-budget cautious testing.
- If official Ozon API data does not provide competitor count, average price, ratings, reviews, traffic, or sales, the report must label that limitation instead of generating fake data.

## Phase 4B Store API Profile Rules

- Store API profiles are supported for Ozon, Wildberries, and Yandex.
- The frontend can store store display name, platform, backend credential reference, and connection status.
- The frontend must not store real API keys, API tokens, OAuth tokens, or seller backend secrets.
- No membership allows 1 store profile.
- Monthly card allows 5 store profiles.
- Yearly card allows 10 store profiles.
- The current limit is counted across all platforms together.
- If the current tier limit is reached, adding another store profile should be blocked with a clear message.
- Removing a frontend store profile does not delete backend secrets.
- Available conclusions are `建议小量测试`, `谨慎测试`, `暂不建议`, and `等待数据`.
- If profit is negative, show `暂不建议`.
- If profit margin is below 10% and estimated advertising share is 30% or higher, show `暂不建议`.
- If profit margin is from 10% to below 20%, show `谨慎测试` and recommend small-budget validation only.
- Compare the current selling price converted to RUB with the manually entered competitor average price.
- If current RUB price is at least 30% higher than competitor average price and the store is new or mixed, warn about conversion pressure.
- If current RUB price is lower than competitor average price while profit margin is still healthy, warn that low price should not be the only strategy.
- If competitor count is high or the top competitor review count is high, warn that the competition barrier is high.
- Store type affects wording only:
  - vertical store: emphasize category fit, keyword accumulation, and reviews
  - mixed store: emphasize lightweight testing and inventory risk
  - new store: emphasize small ad budgets and first-order cost
  - mature store: emphasize historical traffic and customer fit
- The report is an operating reference only and does not guarantee orders, profit, traffic, or advertising results.
