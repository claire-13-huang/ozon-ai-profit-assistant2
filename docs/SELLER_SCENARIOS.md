# Seller Scenario Examples

Date: 2026-05-23

These examples show how an Ozon, Wildberries, or Yandex seller can use the current profit decision assistant before choosing whether to test a product.

The examples are based on the current MVP behavior documented in `docs/business-rules.md`:

- The tool calculates total cost from purchase cost, logistics fee, commission, advertising fee, tax, withdrawal fee, return cost, label fee, and other cost.
- Profit margin means `profit / selling price`.
- The tool identifies the largest known cost pressure item from current calculated values.
- The diagnosis and next action are rule-based operating references, not final business conclusions.
- Logistics matching uses the local rule data currently maintained in `js/data-rules.js`; it is not a real-time platform policy source.

Unless a scenario says otherwise, leave optional tax, withdrawal, return, label, and other cost fields as `0`.

## 1. Low-Price Lightweight Product

### Scenario name
Low-price lightweight accessory test.

### Seller situation
A seller wants to test a small, cheap item such as a lightweight accessory. The product is easy to ship, but the selling price is low, so fixed logistics and platform costs may quickly reduce profit.

### Example input values
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

### What the tool should show
- A matched logistics channel if the current local rules support the selected platform, supplier, service, weight, and dimensions.
- Profit may be positive but the profit margin should be tight.
- The tool should highlight the largest known pressure item, such as purchase cost, logistics cost, commission, or advertising cost.
- The next action should stay cautious if profit margin is low.

### How the seller should interpret the result
Low-price products can look easy to sell, but small fees take a large share of the selling price. A small increase in advertising, return cost, or logistics cost may remove the remaining profit.

### Recommended next action
Use this product only as a small test. Check whether the supplier price can be reduced, whether packaging can stay small, and whether advertising can be controlled.

### Risk reminder
Do not treat low weight alone as safe. Low selling price leaves very little room for cost mistakes.

## 2. High Logistics Cost Product

### Scenario name
Bulky product with high shipping pressure.

### Seller situation
A seller wants to test a product that is not very expensive but has a large package size. The business question is whether logistics cost makes the product unsuitable for cross-border testing.

### Example input values
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

### What the tool should show
- A logistics fee that may become one of the largest cost items.
- If the current matching rule uses volume weight, the tool may show charge weight higher than actual weight.
- The cost explanation should identify logistics fee as the main pressure item when it is the largest known cost.
- Profit decision may become low margin or loss depending on the matched fee.

### How the seller should interpret the result
The product may not be bad because of purchase cost, but because the package is too large for the current channel. Large size can turn a seemingly profitable product into a risky test.

### Recommended next action
Check if the product can be repacked smaller, whether another channel fits better, or whether the selling price can support the logistics cost. Do not scale advertising before confirming logistics.

### Risk reminder
The logistics rule data is local and manually maintained. Confirm current carrier rules before making a real shipment decision.

## 3. High Purchase Cost Product

### Scenario name
Supplier cost leaves too little margin.

### Seller situation
A seller finds a product with good market demand, but the supplier price is high. The seller needs to know whether the product still has enough margin after platform and logistics costs.

### Example input values
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

### What the tool should show
- Purchase cost should be a major cost pressure item.
- Profit decision may show low profit or loss.
- The result explanation should recommend checking cost or selling price before testing.

### How the seller should interpret the result
The product may sell, but the seller has too little room for logistics, ads, returns, and exchange-rate changes. A high purchase cost usually makes the product fragile.

### Recommended next action
Negotiate supplier price, reduce packaging or add-on costs, or compare whether a higher selling price is realistic. If the market cannot accept a higher price, do not start with a large test.

### Risk reminder
High demand does not fix poor unit economics. The tool only checks the current cost structure; it does not prove market demand.

## 4. High Advertising Cost Product

### Scenario name
Product depends on paid traffic.

### Seller situation
A seller expects that the product needs paid ads to get orders. The question is whether advertising cost will consume most of the profit.

### Example input values
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

### What the tool should show
- Advertising fee should become a major cost pressure item.
- The next action should recommend controlling budget and testing at small scale when advertising is the largest pressure.
- Profit may still be positive, but the result should not be treated as stable.

### How the seller should interpret the result
This product may depend on traffic efficiency. If real ad cost is higher than expected, the product can quickly move from profitable to risky.

### Recommended next action
Start with a small advertising test, set a spending limit, and review profit again with the actual ad rate after collecting early data.

### Risk reminder
The advertising rate is manually entered. The tool does not know future click cost, conversion rate, or campaign quality.

## 5. Negative Profit Product

### Scenario name
Clear loss before launch.

### Seller situation
A seller is considering a product where the supplier cost is already higher than the target selling price. The seller needs a quick warning before spending time on listing or ads.

### Example input values
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

### What the tool should show
- Profit decision should show loss risk.
- Result explanation should say current profit is negative.
- Next action should recommend checking the largest cost pressure item before scaling or advertising.

### How the seller should interpret the result
The product should not move into active testing under the current assumptions. The problem is visible before considering return rate or unexpected fees.

### Recommended next action
Change the selling price, renegotiate purchase cost, or reject the product for now. Recalculate only after the core assumptions improve.

### Risk reminder
Do not use advertising or platform promotion to hide a negative base calculation. Promotion usually adds more cost or reduces realized price.

## 6. Subsidy-Dependent Product

### Scenario name
Product only looks attractive with a subsidy.

### Seller situation
A seller wants to know whether a product can be attractive to buyers only after a discount or subsidy. The seller needs to see the subsidy amount while still checking the original profit structure.

### Example input values
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

### What the tool should show
- The subsidy panel should show subsidy amount and subsidy rate based on the entered selling price and after-subsidy price.
- Profit decision should still be based on the main selling price and current cost inputs.
- If profit margin is low, the next action should remain cautious.

### How the seller should interpret the result
The subsidy panel helps the seller understand how much price support is needed. It does not prove who pays the subsidy or guarantee that the product is profitable after promotion.

### Recommended next action
Confirm whether the subsidy is paid by the seller, the platform, or another promotion mechanism before making the decision. If the seller pays the subsidy, recheck the real selling price and cost pressure carefully.

### Risk reminder
Do not treat subsidy display as confirmed platform support. The MVP calculates subsidy information, but it does not verify platform campaign rules.

## 7. Healthy Profit Product

### Scenario name
Balanced product for small test.

### Seller situation
A seller finds a product with moderate cost, ordinary logistics, and manageable advertising. The seller wants to decide whether it is safe enough for a controlled test.

### Example input values
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

### What the tool should show
- Profit should be positive.
- Profit decision should be in the healthy range if the current costs stay close to the example.
- The result explanation should still show the largest known cost pressure item.
- Next action should recommend reviewing return rate, advertising cost, and exchange-rate changes.

### How the seller should interpret the result
This type of product may be suitable for a small test because there is some profit space. The seller still needs to confirm actual return cost, ad cost, and logistics accuracy.

### Recommended next action
Run a controlled test, keep order volume small at first, and update the inputs after real operating costs are known.

### Risk reminder
Healthy profit is not a guarantee. Actual return rate, ad spend, and exchange-rate changes can reduce the margin.

## 8. Good Profit But Still Risky Product

### Scenario name
Strong margin with operating uncertainty.

### Seller situation
A product appears to have strong margin, but the seller expects possible return pressure, competition, or unstable advertising cost.

### Example input values
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

### What the tool should show
- Profit decision should show good profit if the margin stays above the current good-profit threshold.
- The next action should still remind the seller to consider return rate and actual advertising cost.
- The cost explanation should identify the largest known pressure item instead of saying the product is automatically safe.

### How the seller should interpret the result
Good margin gives more room for testing, but the product still needs operational validation. High margin does not remove risks from returns, price competition, or ad volatility.

### Recommended next action
Proceed with a test plan, but monitor actual ad cost, return rate, and competitor pricing. Keep the scenario updated with real data.

### Risk reminder
The assistant is a decision support tool. It does not predict future sales volume, competition, or platform changes.

## 9. Logistics Unmatched Product

### Scenario name
Product cannot find a matching logistics channel.

### Seller situation
A seller checks a product that is too heavy or too large for the selected platform, supplier, or logistics service. The seller needs to know that the calculation is not reliable until logistics is matched.

### Example input values
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

### What the tool should show
- Matched channel should show as unmatched.
- The match notice should explain why no channel matched, such as weight, price range, size, platform, supplier, or service constraints.
- Profit output may still render with logistics fee as zero, so the seller must treat the result as incomplete.

### How the seller should interpret the result
An unmatched logistics result means the seller does not have a reliable shipping cost for the selected setup. Profit should not be trusted until the logistics issue is fixed.

### Recommended next action
Try a different platform, supplier, service, weight, or package size. If the product still cannot match, do not proceed with listing based on this calculation.

### Risk reminder
Never treat a zero logistics fee from an unmatched scenario as real profit. It means the logistics cost is missing.

## 10. Exchange Rate Sensitivity Scenario

### Scenario name
Product near a logistics price boundary.

### Seller situation
A seller has a product where the selling price converted to rubles is close to a logistics rule boundary. A small exchange-rate change may affect ruble price, matching channel, and profit margin.

### Example input values
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

### What the tool should show
- Ruble price should change when exchange rate changes.
- If the converted ruble price crosses a current local rule boundary, the matched channel and logistics fee may change.
- Profit margin may move from healthy to low if logistics cost increases enough.

### How the seller should interpret the result
Exchange rate is not only a currency display field. In the current tool, it can affect ruble price, logistics matching, and logistics fee for some channels.

### Recommended next action
For products near a boundary, test several exchange-rate assumptions before deciding whether the product is safe. Keep a buffer instead of relying on one exact rate.

### Risk reminder
The exchange rate is manually entered and not automatically updated. Always confirm the real exchange-rate assumption before making an operating decision.

## Manual Verification Checklist

- Open the static page and enter one scenario at a time.
- Confirm invalid inputs are not required for these examples unless the scenario is intentionally unmatched.
- Confirm the scenario produces the expected type of business signal: low margin, high cost pressure, loss risk, healthy profit, good profit, unmatched logistics, subsidy display, or exchange-rate sensitivity.
- Do not require exact profit values to match this document if logistics rules are later updated.
- If a scenario no longer matches the intended signal after rule updates, update this document and the manual test cases together.
