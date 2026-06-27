# active.agent.md

## Project

This project is an Ozon / Wildberries / Yandex seller decision assistant.

Local project path:

`/Users/claireclinton/Documents/ozon项目_副本`

Current focus module:

`Ozon Topic Tag Assistant`

Current local target:

`Ozon Topic Tag Assistant v1.2.1 — UI cleanup and confidence logic tightening`

## Tech Stack

Use only:

* HTML
* CSS
* Vanilla JavaScript
* GitHub
* Cloudflare Pages

Do not use:

* React
* Vue
* Tailwind
* Bootstrap
* Backend services
* Crawlers
* Ozon API
* Translation API

## Protected Areas

Do not modify these areas unless explicitly requested:

* Worker behavior
* Profit calculation formulas
* Logistics logic
* Platform presets
* Product Testing Analysis
* Profit Calculator
* API Settings
* Cloudflare Pages configuration

## Product Positioning

The Ozon Topic Tag Assistant is not a normal keyword generator.

It is:

`Ozon topic tag strategy + candidate generation + manual verification assistant`

The assistant must not pretend to know:

* Official Ozon traffic
* Official Ozon search volume
* Official Ozon tag approval status
* Real-time marketplace ranking data

The assistant can only generate candidate tags based on seller-provided product information, competitor tags, competitor keywords, and seller candidate terms.

## Seller Workflow

The intended workflow is:

`Product information → competitor topic tags / competitor keywords → seller candidate tags / backend search terms → competitor tag breakdown → product type judgment → candidate tag generation → high-confidence tags / tags requiring Ozon search verification / rejected tags → manual verification path → final copy-ready tags, one per line`

## Core Output Principle

The module should help the seller quickly answer four questions:

1. Which tags can be copied first?
2. Which tags must be verified on Ozon search?
3. Which tags should be removed?
4. Why?

The module should feel like a seller decision workspace, not an AI report.

## Final Classification Rule

Each normalized tag must have only one final status.

A normalized tag means the same tag after:

* Trimming whitespace
* Normalizing hashtag format
* Lowercasing Cyrillic and Latin letters
* Treating repeated identical tags as the same tag

Allowed final status groups:

1. `High confidence`
2. `Requires Ozon search verification`
3. `Rejected`

Priority order:

`High confidence` > `Requires Ozon search verification` > `Rejected`

A tag must never appear in more than one final status group.

## High-Confidence Tag Rules

A tag can be marked as high-confidence only if it meets all of these conditions:

* It comes from competitor topic tags or very strong product evidence
* It is strongly related to the current product
* It is not a standalone generic word
* It is not a standalone attribute word
* It is not a standalone material word
* It is not a standalone audience word
* It is not a standalone scenario word
* It is not a system-generated filler word
* It has valid hashtag format
* It does not contain Chinese
* It does not contain brand terms
* It does not contain platform terms
* It does not contain IP-risk terms

These tags must not be placed in the high-confidence group:

* `#дом`
* `#легкий`
* `#хлопок`
* `#женский`

They should be moved to `Requires Ozon search verification` or `Rejected`, depending on context.

## UI Principle

The first screen should prioritize seller action, not explanation.

Recommended output order:

1. Product type judgment
2. Final copy-ready tags, one per line
3. Number of tags requiring verification
4. Number of rejected tags
5. Recommended tag table
6. Ozon search verification checklist
7. Rejected tags and reasons

## Current Known Issue

The current v1.2.1 version has one remaining issue:

Some tags that appear in the final high-confidence copy-ready box also appear in rejected detail rows because of duplicate-source handling.

Examples:

* `#эндоскоп`
* `#термосумка`

This is not allowed.

A tag cannot be both `High confidence` and `Rejected`.

## Testing Requirement

For every change in this module, test at least:

* Automotive endoscope
* Picnic cooler bag
* A weak-word case containing `#дом`, `#легкий`, `#хлопок`, `#женский`

Confirm that:

* Final copy-ready tags contain only high-confidence tags
* Verification-required tags do not appear in the final copy-ready box
* Rejected tags do not appear in the final copy-ready box
* The same normalized tag never appears in multiple final status groups

## Reporting Requirement

After each task, report:

* Files changed
* Root cause
* Main UI changes, if any
* Main logic changes
* Test cases used
* Test results
* Safety check results
* Risk points
* Confirmation that protected areas were not modified
