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
- If profit margin is below 10%, explain that return, advertising, or exchange-rate changes may reduce profit.
- If profit is positive, keep the wording as operational reference, not a final business conclusion.
