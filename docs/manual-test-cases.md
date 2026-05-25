# Manual Test Cases

## Cost And Result Explanation

1. Normal valid input with balanced costs
   - Input: sale price 100, exchange rate 12.5, weight 500g, dimensions 10/10/10, purchase cost 30, commission 10%, advertising 5%.
   - Expected: result explanation appears, total cost composition is explained, profit margin meaning is explained, and one highest cost pressure item is shown.

2. High purchase cost
   - Input: use normal valid input, then set purchase cost much higher than other costs, such as 80.
   - Expected: explanation identifies purchase cost as the main pressure item.

3. High logistics fee
   - Input: use valid input with low purchase cost and choose product weight/dimensions that create high logistics cost.
   - Expected: explanation identifies logistics fee as the main pressure item when logistics is the largest known cost.

4. High advertising rate
   - Input: use normal valid input, then set advertising rate high, such as 40%.
   - Expected: explanation identifies advertising fee as a pressure item and warns that ad spend can reduce real profit.

5. Low profit margin
   - Input: adjust purchase cost or advertising rate until profit margin is below 10% but not negative.
   - Expected: explanation says low profit margin may be affected by return, ad fluctuation, or exchange-rate changes.

6. Negative profit
   - Input: set purchase cost higher than selling price, such as sale price 100 and purchase cost 120.
   - Expected: explanation says current profit is negative and suggests reviewing cost or selling price before testing.

7. Invalid input should not show misleading explanation
   - Input: clear selling price, set exchange rate to 0, or set negative purchase cost.
   - Expected: validation message appears and explanation says to fix input first.

8. CSV export still works after valid calculation
   - Input: return to a valid normal input.
   - Expected: calculation results update normally and CSV export still downloads.

## Decision-Focused UI

1. Negative profit should show strong risk state and cautious next action
   - Input: sale price 100, exchange rate 12.5, weight 500g, dimensions 10/10/10, purchase cost 120.
   - Expected: profit decision shows risk and next action warns not to scale before checking the main cost pressure.

2. Low profit margin should show warning state and small-test suggestion
   - Input: sale price 100, exchange rate 12.5, weight 500g, dimensions 10/10/10, purchase cost 75.
   - Expected: next action recommends small testing and checking the pressure item.

3. High purchase cost should recommend checking purchase cost
   - Input: use valid input and make purchase cost the largest cost item.
   - Expected: next action recommends checking purchase cost.

4. High logistics cost should recommend checking logistics/channel/product size
   - Input: use valid input and increase weight or dimensions so logistics fee is the largest cost item.
   - Expected: next action recommends checking product size, weight, or channel fit.

5. High advertising rate should recommend checking ad budget or test scale
   - Input: use valid input and set advertising rate high enough to become the largest cost item.
   - Expected: next action recommends controlling budget and small-scale testing.

6. Healthy profit should show neutral-positive next action
   - Input: adjust costs so profit margin is between 20% and 30%.
   - Expected: next action says the result has some space but still needs small testing and review of return rate, ads, and exchange-rate changes.

7. Good profit should show positive but still cautious next action
   - Input: use valid input with profit margin above 30%.
   - Expected: next action says profit space is stronger but still needs return, ad, and competition validation.

8. Invalid input should not show confident next action
   - Input: clear selling price or set exchange rate to 0.
   - Expected: next action asks the user to fix input first.

9. CSV export still works after valid calculation
   - Input: return to valid input and click export.
   - Expected: CSV still downloads.

## LocalStorage Save/Load

1. Fill normal valid values, refresh page, values restore
   - Input: sale price 100, exchange rate 12.5, weight 500g, dimensions 10/10/10, purchase cost 30, commission 10%, advertising 5%.
   - Expected: after refresh, the same input values are restored and calculation runs again.

2. Change platform/supplier/service, refresh page, selections restore
   - Input: switch platform and choose a supplier/service combination.
   - Expected: after refresh, platform, supplier, and service are restored when those options still exist.

3. Fill invalid value, refresh page, validation still catches it
   - Input: set purchase cost to -5 or exchange rate to 0, then refresh.
   - Expected: invalid value is restored and validation shows the same blocking error.

4. Clear/reset values if reset behavior exists
   - Input: no reset/clear button currently exists.
   - Expected: no reset behavior is tested in this milestone; clearing can be added later with a dedicated button.

5. Recalculate after restore
   - Input: refresh after valid saved values.
   - Expected: logistics, profit decision, cost explanation, and result cards update after restore.

6. CSV export still works after restore
   - Input: refresh after valid saved values, then click CSV export.
   - Expected: CSV still downloads with the restored calculation state.

7. localStorage unavailable should not break the app if detectable
   - Input: test in private/restricted storage mode if available.
   - Expected: app still calculates normally; values may simply not persist.

## Healthy Profit Baseline Preset

1. Apply Healthy Profit Baseline preset
   - Input: click the preset apply button for `Healthy Profit Baseline`.
   - Expected: platform switches to Ozon, supplier is CEL, service is automatic, and the preset status confirms the template was applied.

2. Confirm input fields are filled
   - Input: inspect the form after applying the preset.
   - Expected: sale price 100, exchange rate 12.5, weight 500g, dimensions 10/10/10, purchase cost 50, commission 10%, advertising 5%, tax 0%, withdrawal 0%, return 0%, label fee 1, and other cost 2 are filled.

3. Confirm profit calculation updates
   - Input: apply the preset and review the result area.
   - Expected: total cost, profit, profit margin, logistics match, diagnosis, next action, and cost explanation update through the normal calculation flow.

4. Confirm conservative wording for moderate margin
   - Input: apply the preset and review the profit decision, next action, diagnosis, and cost explanation.
   - Expected: because the current preset margin is around 10%-20%, the tool should describe it as only barely testable or requiring small validation, not as healthy or guaranteed; the diagnosis panel should no longer show the default placeholder.

5. Confirm preset warning explains replacement behavior
   - Input: read the preset note before applying the preset.
   - Expected: the note says applying a preset replaces current input values and that preset values are only for learning/testing, not real-time data or profit guarantee.

6. Refresh page and confirm localStorage restores preset values
   - Input: apply the preset, refresh the page.
   - Expected: platform, supplier, service, and preset-filled inputs restore; calculation runs again after restore.

7. Modify one preset-filled value and confirm calculation updates
   - Input: after applying the preset, change purchase cost or advertising rate.
   - Expected: total cost, profit, profit margin, diagnosis, next action, and cost explanation update automatically.

8. Enter invalid value after applying preset and confirm validation still works
   - Input: after applying the preset, set exchange rate to 0 or purchase cost to -1.
   - Expected: validation shows an error, misleading profit output is blocked, and normal calculation returns after fixing the value.

9. CSV export after applying preset
   - Input: apply the preset, confirm valid calculation, then click CSV export.
   - Expected: CSV still downloads with the current calculated result.

10. Edit purchase cost after applying preset
   - Input: apply `Healthy Profit Baseline`, then change purchase cost from 50 to 120.
   - Expected: purchase cost display, total cost, profit, profit margin, diagnosis, next action, and cost explanation update using 120. The preset should not keep purchase cost fixed after manual editing.

11. Same inputs should keep the same diagnosis
   - Input: use the same values twice, including any equal-cost edge case.
   - Expected: decision text, risk wording, next action, and cost-pressure diagnosis stay the same for the same inputs.

## Daily Reference Exchange Rate Helper

1. Manual exchange rate input still works
   - Input: manually change exchange rate to a valid value, such as 12.30.
   - Expected: ruble price, logistics matching, total cost, profit, diagnosis, and cost explanation update normally; the helper status says the rate was manually changed.

2. Fetch daily reference exchange rate
   - Input: click `获取当日参考汇率`.
   - Expected: the exchange rate field is filled with a positive reference CNY/RUB value when the public source is available; the compact status note shows source, date, and reference-only wording without stretching the form row.

3. Confirm calculation updates after fetched rate fills
   - Input: after fetching the reference rate, review the result area.
   - Expected: ruble price, logistics matching, total cost, profit, profit margin, diagnosis, and cost explanation update through the normal calculation flow.

4. Refresh page and confirm localStorage behavior
   - Input: fetch the reference rate, then refresh the page.
   - Expected: the fetched exchange rate restores through existing form localStorage; the helper may also show same-day cached reference information if available.

5. Fetch failure behavior
   - Input: simulate failure by disabling network or temporarily making the source endpoint unavailable in a local test.
   - Expected: the page does not break, the existing manually entered rate stays unchanged, and the status shows `参考汇率获取失败，请手动填写。`

6. Validation still catches exchange rate = 0
   - Input: set exchange rate to 0 after using the helper.
   - Expected: validation shows an error and misleading profit output is blocked.

7. Apply Healthy Profit Baseline, then fetch reference rate
   - Input: apply `Healthy Profit Baseline`, then click `获取当日参考汇率`.
   - Expected: preset fields remain filled, the exchange rate updates to the reference value, and calculation/diagnosis/cost explanation recalculate.

8. CSV export after using fetched reference rate
   - Input: fetch the reference rate, confirm valid calculation, then click CSV export.
   - Expected: CSV still downloads with the current calculated result.

## Phase 3 Visual Polish And Exchange Rate UX

1. Page visual hierarchy is calmer
   - Input: open the page on desktop.
   - Expected: the page uses a light gray background, white panels, thin borders, low shadow, and no large colorful gradient container; the title reads `利润决策助手`.

2. Left input area remains readable
   - Input: inspect selling price, preset, logistics/product info, and cost fields.
   - Expected: inputs stay grouped on the left, labels are readable, and the user can still edit the same fields without layout overlap.

3. Right result area remains decision-focused
   - Input: enter valid calculation data or apply `Healthy Profit Baseline`.
   - Expected: calculation result cards, decision card, next action, explanation, diagnosis, and logistics notice remain visible and update normally.

4. Exchange rate control is easier to understand
   - Input: inspect the exchange rate field.
   - Expected: the exchange rate can still be manually edited; the reference-rate button is compact and labeled `今日参考`; the helper text explains that manual input is the default.

5. Mobile layout does not overlap
   - Input: open the page around 390px wide or use browser responsive mode.
   - Expected: tabs, input fields, result cards, and the exchange-rate button stack cleanly with no clipped text or overlap.

6. CSV export still works after visual changes
   - Input: complete a valid calculation and click `导出为 CSV`.
   - Expected: CSV export still downloads with current calculated values.

## Product Selection Pre-Decision Assistant

1. Empty key fields should show waiting state
   - Input: clear source product URL or competitor average price, while keeping the profit calculator valid.
   - Expected: product selection report shows `等待数据`, explains that backend/API collection is not connected yet, and does not give a confident decision.

2. High profit, low competition, vertical store
   - Input: sale price 120, exchange rate 12.5, valid weight/dimensions/costs with profit margin above 20%; source product URL filled; temporary auto-filled target category filled; competitor count 15; competitor average price 1600 RUB; ad share 15%; store type vertical.
   - Expected: report shows `建议小量测试` or cautious small-test wording, with next actions focused on validating ads, clicks, orders, and returns.

3. Low profit with 30% ad share
   - Input: adjust current calculator until profit margin is below 10%, fill source product URL/category, competitor count 30, competitor average price near current RUB price, ad share 30%, store type vertical.
   - Expected: report shows `暂不建议` and says current profit/ad assumption is not suitable for direct advertising.

4. Moderate profit should stay cautious
   - Input: use Healthy Profit Baseline or set profit margin between 10% and 20%, fill required selection fields.
   - Expected: report shows `谨慎测试` and recommends small-budget validation only.

5. Price higher than competitor average for a new store
   - Input: set current RUB price at least 30% higher than competitor average price, store type new, required fields filled.
   - Expected: price section warns that stronger images, reviews, ads, or differentiation are needed.

6. Price lower than competitor average but healthy profit
   - Input: set current RUB price below competitor average, profit margin above 20%, required fields filled.
   - Expected: report does not blindly encourage low-price selling; it asks the user to confirm ad and return volatility.

7. High competition barrier
   - Input: required fields filled; competitor count 100 or top competitor reviews 1500.
   - Expected: competition section warns that the barrier is high and suggests long-tail keywords or differentiated positioning.

8. Product image URL preview is optional
   - Input: enter a valid image URL.
   - Expected: image preview appears. Clear the image URL and the preview disappears. Calculation should not be affected.

9. localStorage restores selection fields
   - Input: fill source product URL and temporary product selection fields, refresh the page.
   - Expected: source product URL and product selection fields restore and the report recalculates after page load.

10. Existing features still work
    - Input: after using product selection fields, apply preset, change exchange rate, and export CSV.
    - Expected: preset, exchange rate helper, profit calculation, diagnosis, cost explanation, and CSV export remain usable.

## Phase 4A Ozon AI Product Recognition

1. Empty source URL should not start analysis
   - Input: leave source product URL empty and click `开始智能分析`.
   - Expected: status shows that a source product link is required; existing profit calculation remains unchanged.

2. Invalid source URL should show a clear error
   - Input: enter `abc` and click `开始智能分析`.
   - Expected: status says the link format is invalid; no confident product report is generated.

3. Worker not configured should still show a result state
   - Input: enter a valid `https://example.com/product` URL and click `开始智能分析` while `PRODUCT_SELECTION_API_BASE_URL` is not configured.
   - Expected: report shows `API 服务未连接`, explains that Cloudflare Worker is required, and displays current profit judgment if calculator inputs are valid.

4. Demo report should render without backend
   - Input: click `查看示例报告`.
   - Expected: product recognition, keywords, Ozon API status, report summary, and next actions are visible.

5. Low profit should warn against advertising
   - Input: create a calculation where profit margin is below 10%, then load demo report or analyze a URL.
   - Expected: report status is risk-oriented and warns against direct advertising tests.

6. Existing workflows should remain usable
   - Input: after using the Ozon AI product section, change price, exchange rate, preset, and export CSV.
   - Expected: original calculator, exchange rate helper, preset, localStorage, diagnosis, and CSV export still work.

7. Worker health status should be visible on page load
   - Input: open the page with `window.PRODUCT_SELECTION_API_BASE_URL = ''` in `js/config.js`.
   - Expected: Ozon API status explains that the frontend is not connected to Cloudflare Worker.

8. Worker URL config should not require code edits during testing
   - Input: after deploying Worker, paste the Worker base URL into `Cloudflare Worker 地址` and click `保存地址`.
   - Expected: the page stores the public Worker URL in localStorage and uses `/api/health` and `/api/analyze-product` through that base URL.

9. Valid Ozon credentials should show real shop sample
   - Input: run Worker with valid `OZON_CLIENT_ID` and `OZON_API_KEY`, then open `/api/health`.
   - Expected: Ozon status is `connected`; response includes `sampleCount`; if the shop has products, response includes up to five sample products.

10. Frontend should show Ozon shop sample after API connection
    - Input: configure `js/config.js` to the running Worker URL and refresh the page.
    - Expected: Ozon API status text includes connection success and sample product identifiers when Ozon returns products.

11. GitHub Actions deploy workflow should not contain secrets
    - Input: inspect `.github/workflows/deploy-worker.yml`.
    - Expected: workflow reads Cloudflare and platform credentials from GitHub Secrets only, passes Worker secrets through the official Wrangler Action `secrets` input, and no real token or API key is committed.

## Phase 4B Store API Profile Management

1. Free tier should allow only one store
   - Input: choose `未开通会员`, add one store profile, then try to add another.
   - Expected: first store is added; second add is blocked with a clear limit message.

2. Monthly card should allow up to five stores
   - Input: choose `月卡`, add five store profiles across Ozon / Wildberries / Yandex, then try a sixth.
   - Expected: five profiles are allowed; sixth is blocked.

3. Yearly card should allow ten stores
   - Input: choose `年卡`, add store profiles until capacity shows 10 / 10.
   - Expected: the panel shows total capacity and platform counts correctly.

4. Store profile should not ask for real API key
   - Input: inspect the add store form.
   - Expected: the form asks for backend credential reference, not an API key or token value.

5. Removing a store updates capacity
   - Input: add several store profiles, remove one.
   - Expected: capacity and platform counts update; status explains that backend secrets are not deleted.

6. Store profiles should restore after refresh
   - Input: add profiles and refresh the page.
   - Expected: membership tier, capacity, platform counts, and store cards restore from localStorage.

7. Backend store sync should not expose secrets
   - Input: configure `STORE_API_CREDENTIALS_JSON` in Worker and open `/api/stores`.
   - Expected: response includes platform, name, credentialRef, and status; it does not include apiKey, token, clientId, or OAuth secret.

8. Store connection test should call backend
   - Input: sync backend stores, then click `测试连接` on one store card.
   - Expected: status shows connected or a clear API/auth error from the backend.

9. Product analysis should use selected store
   - Input: sync backend stores, choose one store in `选择用于分析的店铺`, paste product URL, and click `开始智能分析`.
   - Expected: backend receives platform and credentialRef for the selected store and uses that store's real API credentials.
