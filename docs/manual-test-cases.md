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
