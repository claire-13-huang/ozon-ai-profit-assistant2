# Preset Template Design

Date: 2026-05-23

This document translates the seller scenarios in `docs/SELLER_SCENARIOS.md` into safe preset template ideas for a future UI task.

This is a design document only. It does not change product behavior, formulas, logistics rules, validation, storage, or UI.

## 1. Purpose Of Preset Templates

Preset templates should help sellers start from common business situations instead of filling every field from zero.

They are useful because they can:

- reduce repeated input work for common product tests
- help beginner sellers understand typical product situations
- make it faster to test pricing, logistics, purchase cost, advertising, and exchange-rate assumptions
- connect scenario thinking to the actual profit calculation screen
- provide simple learning examples before sellers enter their own product data

Presets should not make business decisions for the seller. They should only provide example inputs that trigger the existing calculator, validation, logistics matching, diagnosis, cost explanation, and next-action rules.

## 2. Recommended Preset Templates

### 1. Low-Price Lightweight Product

Seller situation:
A seller wants to test a small, cheap product where fixed fees may take a large share of the selling price.

Suggested input values:

- Platform: Wildberries
- Supplier: CEL
- Logistics service: Economy
- Selling price: 30 CNY
- Exchange rate: 12.5
- Weight: 120g
- Dimensions: 10cm x 8cm x 3cm
- Purchase cost: 12 CNY
- Commission rate: 12%
- Advertising rate: 8%
- Label fee: 1 CNY
- Other cost: 1 CNY

Expected tool signal:
The tool should match logistics if the current local rules support the selected values. Profit may be positive but tight, and the seller should see which cost item creates the most pressure.

What the seller should learn:
Low-price lightweight products are not automatically safe. Even small logistics, commission, advertising, or label fees can reduce margin quickly.

Risk reminder:
Preset values are examples only. The seller must replace them with real supplier cost, platform rate, package size, and ad assumptions before acting.

Safe to implement in UI later:
Yes. This is a valid and low-complexity preset.

Risk level:
Low risk.

### 2. High Logistics Cost Product

Seller situation:
A seller wants to test a bulky product and needs to understand whether logistics cost makes the product unattractive.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Standard
- Selling price: 300 CNY
- Exchange rate: 12.5
- Weight: 2500g
- Dimensions: 60cm x 40cm x 30cm
- Purchase cost: 60 CNY
- Commission rate: 10%
- Advertising rate: 5%
- Label fee: 2 CNY
- Other cost: 5 CNY

Expected tool signal:
The logistics fee may become one of the largest known cost pressure items. If volume weight applies under the matched rule, charge weight may be higher than actual weight.

What the seller should learn:
Package size and logistics fit can matter as much as purchase cost. A product can look cheap to buy but expensive to ship.

Risk reminder:
The logistics rule data is manually maintained and not a real-time carrier or platform policy source.

Safe to implement in UI later:
Yes, if the template note clearly explains that it is a logistics pressure example.

Risk level:
Medium risk.

### 3. High Purchase Cost Product

Seller situation:
A seller finds a product with possible demand, but supplier cost may leave too little margin.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Auto
- Selling price: 100 CNY
- Exchange rate: 12.5
- Weight: 500g
- Dimensions: 10cm x 10cm x 10cm
- Purchase cost: 80 CNY
- Commission rate: 10%
- Advertising rate: 5%
- Label fee: 1 CNY
- Other cost: 1 CNY

Expected tool signal:
Purchase cost should become a major cost pressure item. The result may show low margin or loss depending on logistics matching.

What the seller should learn:
Supplier price is often the first margin bottleneck. If purchase cost is too high, advertising and returns can quickly turn a product unsafe.

Risk reminder:
The preset does not prove demand. It only shows that the current cost structure is fragile.

Safe to implement in UI later:
Yes. This is useful as a cost-pressure teaching preset.

Risk level:
Low risk.

### 4. High Advertising Test Product

Seller situation:
A seller expects the product to rely on paid traffic and wants to test whether ads consume the profit.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Auto
- Selling price: 120 CNY
- Exchange rate: 12.5
- Weight: 300g
- Dimensions: 12cm x 10cm x 5cm
- Purchase cost: 35 CNY
- Commission rate: 10%
- Advertising rate: 35%
- Label fee: 1 CNY
- Other cost: 2 CNY

Expected tool signal:
Advertising fee should become a major pressure item. The next action should recommend budget control and small-scale testing when advertising pressure is high.

What the seller should learn:
Positive gross profit is not enough if paid traffic is expensive. The ad rate should be tested with conservative assumptions first.

Risk reminder:
The advertising rate is manually entered. The tool cannot predict future click cost, conversion rate, or campaign performance.

Safe to implement in UI later:
Yes, with clear copy that this is an ad-pressure example.

Risk level:
Low risk.

### 5. Subsidy-Dependent Product

Seller situation:
A seller wants to understand how much discount or subsidy is needed to make the buyer-facing price attractive.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Auto
- Selling price: 100 CNY
- Exchange rate: 12.5
- Weight: 500g
- Dimensions: 10cm x 10cm x 10cm
- Purchase cost: 60 CNY
- Commission rate: 10%
- Advertising rate: 10%
- Subsidy after-sale price: 85 CNY

Expected tool signal:
The subsidy panel should show subsidy amount and subsidy rate. Profit decision should still follow the current calculation behavior and should not treat subsidy as guaranteed platform support.

What the seller should learn:
Discounts and subsidies change the business question. Sellers must know who pays the subsidy before judging profit.

Risk reminder:
Do not imply any real platform subsidy policy. The MVP only calculates entered subsidy values.

Safe to implement in UI later:
Yes, but the UI copy must say the subsidy values are examples only.

Risk level:
Medium risk.

### 6. Healthy Profit Baseline

Seller situation:
A seller needs a normal starting example with moderate purchase cost, ordinary package size, and manageable advertising.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Auto
- Selling price: 100 CNY
- Exchange rate: 12.5
- Weight: 500g
- Dimensions: 10cm x 10cm x 10cm
- Purchase cost: 50 CNY
- Commission rate: 10%
- Advertising rate: 5%
- Label fee: 1 CNY
- Other cost: 2 CNY

Expected tool signal:
Profit should be positive if current logistics matching remains close to the current rule set. The tool should show a balanced decision signal and still identify the largest known pressure item.

What the seller should learn:
A healthy baseline is a starting point for learning the calculator. Sellers should adjust one field at a time to see how cost pressure changes.

Risk reminder:
Healthy profit is still not a guarantee. Return rate, ad cost, platform changes, and exchange rate can reduce margin.

Safe to implement in UI later:
Yes. This is the safest first preset.

Risk level:
Low risk.

### 7. Good Profit But Cautious Product

Seller situation:
A seller sees strong margin but wants to remember that returns, competition, and advertising can still affect real profit.

Suggested input values:

- Platform: Yandex
- Supplier: CEL
- Logistics service: Auto
- Selling price: 200 CNY
- Exchange rate: 12.5
- Weight: 500g
- Dimensions: 10cm x 10cm x 10cm
- Purchase cost: 60 CNY
- Commission rate: 10%
- Advertising rate: 8%
- Return rate: 5%
- Label fee: 1 CNY
- Other cost: 3 CNY

Expected tool signal:
Profit decision may show good profit if the margin remains above the current good-profit threshold. The next action should still remind the seller to consider returns and actual ad cost.

What the seller should learn:
Good profit gives more room to test, but it does not remove operating uncertainty.

Risk reminder:
The assistant does not predict sales volume, competition, return behavior, or platform changes.

Safe to implement in UI later:
Yes, after the first simple preset is implemented and verified.

Risk level:
Medium risk.

### 8. Logistics Unmatched Stress Test

Seller situation:
A seller needs to understand what happens when the selected platform, supplier, service, weight, or dimensions cannot match a logistics channel.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Standard
- Selling price: 200 CNY
- Exchange rate: 12.5
- Weight: 40000g
- Dimensions: 80cm x 60cm x 50cm
- Purchase cost: 50 CNY
- Commission rate: 10%
- Advertising rate: 5%

Expected tool signal:
Matched channel should show as unmatched. The logistics notice should explain the mismatch reason. The seller should treat any profit result as incomplete because reliable logistics cost is missing.

What the seller should learn:
Unmatched logistics is not a profitable result. It means the seller must fix package, platform, supplier, service, weight, or price assumptions before trusting profit.

Risk reminder:
Never treat zero logistics fee from an unmatched scenario as real profit.

Safe to implement in UI later:
Delay. This is useful for education, but it can confuse sellers if it appears beside normal presets without strong warning copy.

Risk level:
Should delay.

### 9. Exchange Rate Sensitivity Test

Seller situation:
A seller wants to see how exchange-rate changes can affect ruble price, logistics matching, and profit.

Suggested input values:

First calculation:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Auto
- Selling price: 120 CNY
- Exchange rate: 12.5
- Weight: 300g
- Dimensions: 12cm x 10cm x 5cm
- Purchase cost: 60 CNY
- Commission rate: 10%
- Advertising rate: 10%
- Label fee: 1 CNY
- Other cost: 1 CNY

Second calculation:

- Keep all values the same.
- Change only exchange rate from 12.5 to 12.6.

Expected tool signal:
Ruble price should change. If the converted price crosses a local rule boundary, the matched channel or logistics fee may also change.

What the seller should learn:
Exchange rate is not only a display value. It can affect logistics matching and margin under the current rule set.

Risk reminder:
The exchange rate is manually entered and not automatically updated.

Safe to implement in UI later:
Delay or implement as a guided documentation example first. It needs two-step comparison behavior, which is more complex than a single preset fill.

Risk level:
Should delay.

### 10. Negative Profit Rejection Check

Seller situation:
A seller wants to see an obvious loss case before spending time on listing, images, or ads.

Suggested input values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: Auto
- Selling price: 100 CNY
- Exchange rate: 12.5
- Weight: 500g
- Dimensions: 10cm x 10cm x 10cm
- Purchase cost: 120 CNY
- Commission rate: 10%
- Advertising rate: 5%

Expected tool signal:
Profit decision should show loss risk. The next action should recommend checking the largest pressure item and avoiding scale before assumptions improve.

What the seller should learn:
Some products should be rejected quickly when the base calculation is already negative.

Risk reminder:
This is a warning example, not a recommendation to sell at a loss.

Safe to implement in UI later:
Delay until normal positive presets are already implemented, because beginner users may misunderstand this as a target template.

Risk level:
Should delay.

## 3. Preset Implementation Boundary

Future presets should only fill existing input fields.

Presets may fill:

- platform
- supplier
- logistics service
- selling price
- exchange rate
- weight
- dimensions
- purchase cost
- commission rate
- advertising rate
- tax rate if needed
- withdrawal rate if needed
- return rate if needed
- label fee
- other cost
- subsidy fields when the preset is about subsidy

Presets should NOT:

- change formulas
- bypass validation
- change logistics rules
- change cost pressure logic
- change diagnosis or next-action rules
- save as real historical records
- imply guaranteed profit
- claim real-time platform accuracy
- overwrite future user data without a clear apply action

After a preset fills fields, the existing calculation flow should run normally. If the preset creates warnings or unmatched logistics, those warnings should come from the current validation and matching behavior.

## 4. Future UI Idea

A simple future UI could include:

- a small preset selector near the top of the calculator
- one clear `Apply template` button
- optional reset behavior after presets are proven safe
- short helper text saying preset values are examples only

Recommended future behavior:

- The user chooses a preset.
- The user clicks `Apply template`.
- Existing input fields are filled.
- Existing calculation, validation, logistics matching, diagnosis, explanation, localStorage, and CSV behavior continue normally.
- The UI does not hide or lock any fields; the seller can edit every value after applying a preset.

Avoid building advanced preset management in the first UI version. Do not add saved preset accounts, shared template libraries, backend storage, import/export template files, or automatic recommendations.

## 5. Risk Level Summary

| Preset | Risk level | Reason |
| --- | --- | --- |
| Healthy Profit Baseline | Low risk | Valid normal example and easiest to understand. |
| Low-Price Lightweight Product | Low risk | Simple valid example that teaches tight margin. |
| High Purchase Cost Product | Low risk | Clear cost-pressure example using normal fields. |
| High Advertising Test Product | Low risk | Clear ad-pressure example using normal fields. |
| High Logistics Cost Product | Medium risk | May depend more heavily on current logistics rules and volume-weight behavior. |
| Subsidy-Dependent Product | Medium risk | Needs careful copy so subsidy is not treated as real platform support. |
| Good Profit But Cautious Product | Medium risk | Good signal could be misunderstood as a guarantee if copy is weak. |
| Logistics Unmatched Stress Test | Should delay | Useful for learning but intentionally creates incomplete logistics. |
| Exchange Rate Sensitivity Test | Should delay | Needs two-step comparison and could be confusing as a single apply action. |
| Negative Profit Rejection Check | Should delay | Useful warning case, but not a good first beginner preset. |

## 6. Recommended First Preset For Implementation

Recommended first preset:
Healthy Profit Baseline.

Reason:

- It uses ordinary valid inputs.
- It is easy for a beginner seller to understand.
- It should exercise the normal calculation flow without intentionally creating an error state.
- It helps sellers learn by editing one value at a time.
- It has the lowest risk of implying platform accuracy, guaranteed profit, or advanced comparison behavior.

Suggested first implementation rule:
Add only this one preset first in a later task, then manually verify that it fills fields, triggers the normal calculation, keeps validation active, and does not change formulas or logistics rules.

## 7. Manual Review Checklist

Before any future preset UI implementation:

- Confirm this document still matches `docs/SELLER_SCENARIOS.md`.
- Confirm the suggested fields still exist in the current page.
- Confirm the preset does not require a formula change.
- Confirm the preset does not require changing logistics rules.
- Confirm the result is treated as an example, not a recommendation.
- Confirm manual test cases are updated when UI behavior is added.

## 8. Current Implementation Status

Implemented first preset:
Healthy Profit Baseline.

Current behavior:

- The page has one preset selector and one apply button.
- Applying the preset fills only existing fields and platform/supplier/service selections.
- The implementation uses the existing UI service value `自动`, which corresponds to the design intent of `Auto`.
- After applying the preset, the existing calculation, validation, diagnosis, cost explanation, localStorage, and CSV export behavior are expected to continue normally.
- No other preset templates are implemented yet.

Current preset values:

- Platform: Ozon
- Supplier: CEL
- Logistics service: 自动
- Selling price: 100 CNY
- Exchange rate: 12.5
- Weight: 500g
- Dimensions: 10cm x 10cm x 10cm
- Purchase cost: 50 CNY
- Commission rate: 10%
- Advertising rate: 5%
- Tax rate: 0%
- Withdrawal rate: 0%
- Return rate: 0%
- Label fee: 1 CNY
- Other cost: 2 CNY
