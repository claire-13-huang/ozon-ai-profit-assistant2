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

## Preset Template Rules

- Phase 3 currently implements only one preset: Healthy Profit Baseline.
- The preset only fills existing input fields and existing platform/supplier/service selections.
- The preset does not change formulas, logistics rules, validation rules, diagnosis rules, or CSV export rules.
- After applying the preset, the normal calculation, validation, diagnosis, cost explanation, and localStorage save flow should run.
- Preset values are examples for testing and learning only. They do not represent real-time platform data or guaranteed profit.
- Applying a preset replaces current input values, so users should review all fields before using the result.
- Users can edit any preset-filled field after applying the preset; edited values should recalculate and save normally.
