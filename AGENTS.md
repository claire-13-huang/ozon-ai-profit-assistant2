# AGENTS.md

## Project Overview

This project is an AI-driven cross-border ecommerce decision system for Ozon/Wildberries sellers.

Current stage:
MVP profit analysis system.

The goal is NOT to build a full ERP yet.

The current priority is:

* profit calculation
* cost visualization
* seller decision assistance
* stable frontend structure

The long-term direction is:
AI-assisted ecommerce operations and decision making.

---

## Current Tech Stack

Current stack:

* HTML
* CSS
* Vanilla JavaScript

Do NOT:

* introduce React
* introduce Vue
* introduce TypeScript
* over-engineer the project

This project is maintained by a beginner developer using AI-assisted coding.

Keep the structure simple and understandable.

---

## Development Principles

Priority order:

1. MVP first
2. Simplicity first
3. Readability first
4. Small iterations
5. Do not rebuild the whole project unless necessary

Always prefer:

* small modifications
* modular improvements
* incremental refactoring

Avoid:

* massive rewrites
* unnecessary abstractions
* adding too many dependencies

---

## Current Focus

Current focus:
Profit analysis calculator.

Important features:

* selling price
* logistics fee
* commission fee
* advertising fee
* purchase cost
* profit
* profit margin
* subsidy calculation

The UI should emphasize:
left-side cost structure
right-side financial results

This is a decision tool, not just a calculator.

---

## File Structure Rules

Keep:

* CSS separated
* JS separated
* reusable logic modularized gradually

Avoid:

* large inline JavaScript inside HTML
* duplicated calculation logic
* mixing unrelated features into one file

---

## AI Collaboration Rules

Before implementing large features:

1. analyze current structure first
2. explain risks first
3. propose a step-by-step plan first

Complex tasks should be split into small milestones.

Always explain:

* what changed
* which files changed
* how to test
* possible risks

Development log path:

* Always read and update `docs/DEVELOPMENT_LOG.md`
* Do not use the root `DEVELOPMENT_LOG.md` for new records

---

## Important Constraints

The developer is still learning programming fundamentals.

Code should:

* remain understandable
* avoid advanced abstractions
* prioritize maintainability

When suggesting improvements:

* explain the reason clearly
* connect technical choices to real business goals
---

## Phase 2 Development Plan

Current phase:
Phase 2 — Profit Decision MVP Improvement.

The project has completed Phase 1 cleanup:
- AGENTS.md created
- old standalone HTML files archived
- active MVP files formatted
- JavaScript responsibilities separated
- business diagnosis panel added
- current MVP can run as a static frontend app

Phase 2 goal:
Turn the current profit calculator into a seller-facing profit decision assistant.

The goal is NOT to build a full AI platform yet.
The goal is to make the existing MVP more useful for real Ozon/Wildberries sellers by improving:
- business clarity
- input reliability
- diagnosis usefulness
- decision guidance
- testing stability

---

## Phase 2 Product Direction

The current MVP should evolve from:

"利润计算器"

into:

"利润决策助手"

The system should help sellers answer:

1. Can this product be sold profitably?
2. Which cost item is causing pressure?
3. Is logistics cost too high?
4. Is advertising cost eating profit?
5. Is purchase cost leaving enough margin?
6. Does subsidy improve the result?
7. Should the seller test this product carefully?

The product should focus on reducing seller decision cost, not just displaying numbers.

---

## Phase 2 Allowed Work

Allowed in Phase 2:

1. Business rule documentation
2. Manual test case documentation
3. Better input validation
4. Better empty/error states
5. Better cost/result explanation
6. Rule-based diagnosis improvement
7. Small UI improvements for decision-making
8. LocalStorage save/load if simple
9. Manual exchange rate explanation
10. Development log updates

All changes must stay lightweight and beginner-maintainable.

---

## Phase 2 Not Allowed

Do NOT build the following in Phase 2:

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
- React
- Vue
- TypeScript
- npm build tools
- complex multi-page navigation
- large UI redesign

Reason:
The current priority is to stabilize and improve the profit decision MVP before expanding into AI/API/backend systems.

---

## Phase 2 Technical Boundaries

Current stack remains:

- HTML
- CSS
- Vanilla JavaScript
- Static deployment

Current active files:

- index.html
- css/style.css
- js/data-rules.js
- js/calculations.js
- js/diagnosis.js
- js/export.js
- js/main.js
- docs/business-rules.md
- docs/manual-test-cases.md
- docs/DEVELOPMENT_LOG.md

Responsibilities:

- data-rules.js: logistics/platform rules
- calculations.js: pure calculation formulas
- diagnosis.js: rule-based business diagnosis
- export.js: CSV export
- main.js: DOM reading, UI updates, event listeners
- docs/: business rules, test cases, development records

Do not mix unrelated responsibilities back into main.js.

---

## Phase 2 Development Rules

Before modifying code:

1. Explain the current behavior.
2. Explain the problem being solved.
3. Propose a small milestone.
4. Modify only the necessary files.
5. Keep existing formulas unchanged unless explicitly requested.
6. Update docs if business rules change.
7. Add or update manual test cases.
8. Report exactly which files changed.
9. Explain how to manually verify the result.

Each milestone must be independently testable.

Avoid:
- large rewrites
- hidden formula changes
- unnecessary abstractions
- new dependencies
- changing existing element IDs without reason

---

## Phase 2 Priority Order

Priority 1:
Complete and maintain business rules documentation.

Priority 2:
Complete and maintain manual test cases.

Priority 3:
Improve input validation:
- empty selling price
- empty weight
- negative numbers
- zero exchange rate
- abnormal dimensions
- logistics not matched

Priority 4:
Improve error and empty states:
- explain why logistics cannot be matched
- explain which input should be changed
- avoid misleading profit results

Priority 5:
Improve diagnosis:
- explain profit quality
- explain high cost pressure
- explain logistics pressure
- explain advertising pressure
- explain purchase cost pressure
- explain subsidy impact

Priority 6:
Improve decision UI:
- make risk/warning/healthy/good states visually clear
- keep layout simple
- do not redesign the whole page

Priority 7:
Consider simple localStorage save/load only after validation and diagnosis are stable.

---

## Phase 2 Definition of Done

A Phase 2 task is complete only when:

- current page still works
- formulas are unchanged unless requested
- diagnosis updates correctly
- input validation does not block normal use
- manual test cases are updated
- business rules are updated if needed
- node --check passes for modified JS files
- user can manually verify the change in browser
- change is small enough to commit safely

After each completed milestone, commit the change with a clear Git message.
