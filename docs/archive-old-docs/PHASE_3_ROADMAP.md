# Phase 3 Productization Roadmap

Date: 2026-05-23

## 1. Phase 3 Positioning

Phase 3 should focus on productization and seller workflow improvement.

The project has already moved from a simple profit calculator toward a lightweight profit decision assistant. Phase 3 should make the tool feel more useful in daily seller work: easier to start, easier to compare scenarios, easier to explain results, and easier to reuse past calculations.

Phase 3 should not jump into real AI API integration yet. The product should first prove that the manual decision workflow is useful and stable.

## 2. Phase 3 Main Goal

Make the tool feel like a daily-use product for Ozon/Wildberries/Yandex sellers.

The user should be able to:

- start from common seller scenarios
- understand what each input means
- compare logistics or cost assumptions
- save useful calculation schemes
- export or review results with less manual effort
- trust that rules, assumptions, and limitations are clearly documented

## 3. Recommended Phase 3 Scope

Recommended small productization milestones:

- preset scenario templates
- saved calculation schemes
- manual exchange rate explanation
- channel comparison
- better test/report workflow
- seller workflow examples
- stronger documentation
- export improvements if safe
- UI copy polish
- data source notes for logistics rules

The scope should remain static HTML/CSS/Vanilla JavaScript unless there is a strong reason to change later.

## 4. What Phase 3 Should Not Include Yet

Do not build these in Phase 3:

- real AI API integration
- OpenAI API calls
- backend
- database
- login system
- user accounts
- crawler
- automatic product link scraping
- ERP features
- inventory management
- order management
- React/Vue/TypeScript migration
- n8n/Dify/Hermes runtime integration
- true multi-agent automation

These ideas may become relevant later, but they would add too much complexity before the core seller workflow is fully proven.

## 5. Suggested Milestone Order

### Milestone 1: Seller Scenario Examples

- Goal: add documented examples that show how a seller should use the calculator for common decisions.
- Why it matters: beginner users need examples before they trust the result.
- Files likely involved: `docs/manual-test-cases.md`, `docs/business-rules.md`, possibly a small UI copy area later.
- Risk level: low.
- Manual verification: read examples and confirm they match existing calculation behavior.

### Milestone 2: Preset Scenario Templates

- Goal: provide a few simple presets such as light small item, medium item, high ad cost test, and low margin warning case.
- Why it matters: sellers can start faster and learn by changing known examples.
- Files likely involved: `index.html`, `js/main.js`, `css/style.css`, docs.
- Risk level: medium, because presets write values into existing inputs.
- Manual verification: apply each preset, confirm inputs update, validation still works, and formulas remain unchanged.

### Milestone 3: Saved Calculation Schemes

- Goal: allow users to save multiple named local scenarios in the browser.
- Why it matters: sellers often compare several products or price assumptions.
- Files likely involved: `js/storage.js`, `js/main.js`, `index.html`, `css/style.css`, docs.
- Risk level: medium.
- Manual verification: save, load, rename/delete if implemented, refresh page, and confirm calculations restore correctly.

### Milestone 4: Manual Exchange Rate Explanation

- Goal: explain that exchange rate is manually entered and affects ruble price and logistics matching.
- Why it matters: sellers need to understand why exchange-rate changes can affect channel match and profit.
- Files likely involved: `index.html`, `js/main.js`, docs.
- Risk level: low.
- Manual verification: change exchange rate and confirm ruble price, logistics matching, and explanation remain clear.

### Milestone 5: Channel Comparison

- Goal: show several matching logistics options instead of only the cheapest match, if the current rule data supports it.
- Why it matters: sellers may choose speed, price, or channel reliability, not only lowest cost.
- Files likely involved: `js/calculations.js`, `js/main.js`, `index.html`, `css/style.css`, docs.
- Risk level: medium-high, because it touches logistics matching behavior.
- Manual verification: compare matched options for several platforms and confirm current cheapest-match behavior is preserved or clearly replaced.

### Milestone 6: Export Improvements

- Goal: improve CSV export with clearer fields and assumptions, if safe.
- Why it matters: sellers need records for review and comparison.
- Files likely involved: `js/export.js`, docs.
- Risk level: low-medium.
- Manual verification: export after valid input, open CSV, confirm Chinese text and values are correct.

### Milestone 7: Better Testing And Reporting Workflow

- Goal: make manual checks easier and more repeatable before future automation.
- Why it matters: the project is still beginner-maintained and needs reliable review habits.
- Files likely involved: `docs/manual-test-cases.md`, `docs/NIGHT_RUNBOOK.md`, possibly a simple check script much later.
- Risk level: low if documentation-only.
- Manual verification: follow the checklist and confirm it is understandable.

### Milestone 8: UI Copy Polish

- Goal: make labels, warnings, diagnosis, and next actions more business-oriented and less technical.
- Why it matters: the target user is a seller, not a developer.
- Files likely involved: `index.html`, `js/main.js`, docs.
- Risk level: low.
- Manual verification: read the page as a seller and confirm every message answers what to do next.

### Milestone 9: Logistics Rule Data Source Notes

- Goal: document where logistics rules come from, when they were last updated, and what needs manual verification.
- Why it matters: manually maintained logistics rules can become outdated.
- Files likely involved: `docs/business-rules.md`, `js/data-rules.js` comments if needed.
- Risk level: low.
- Manual verification: confirm notes do not imply rules are automatically updated.

## 6. Recommended First Phase 3 Milestone

Recommended first task: Seller Scenario Examples.

Why this is safest:

- It can be documentation-first.
- It does not require formula changes.
- It helps the user and future agents understand real seller workflows.
- It prepares the ground for later preset templates.
- It is easy to verify manually.

Suggested first deliverable:

- Add 3-5 documented seller scenarios to `docs/manual-test-cases.md` or a new scenario document.
- Each scenario should include input values, expected decision state, cost pressure, and seller takeaway.

## 7. Future AI/API Gate

Real AI/API work should wait until these conditions are met:

- stable MVP usage flow
- clear user value from existing rule-based assistant
- business rules validated by real or realistic seller scenarios
- data schema clarified for product, cost, logistics, and result records
- API cost and risk understood
- manual workflow tested
- Git workflow stable
- privacy and data handling expectations documented
- clear decision on which AI task is actually useful

Until then, keep diagnosis rule-based and transparent.

## 8. Future Automation Gate

Night automation should become real only after these conditions are met:

- manual night workflow has succeeded multiple times
- branch workflow is stable
- test checklist is stable
- rollback process is clear
- no automatic merge or deploy
- secrets are not exposed
- reports are easy for the user to review
- one-task-per-night discipline is proven

Automation should support product delivery. It should not become a distraction from seller value.

## 9. Phase 3 Review Recommendation

Phase 3 is ready for human review as a roadmap.

Recommended review question:

Which Phase 3 milestone gives the seller the most immediate value with the least implementation risk?

Default recommendation:

Start with documentation-first seller scenarios, then move to simple preset templates.
