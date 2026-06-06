Implement Phase A: formalize the frontend extraction lifecycle and stale-state management.

The app must treat every new source URL as a new product analysis session.

When the user enters a new product link, all old extraction data, old preview image, old extracted title, old extracted price, old category suggestion, old analysis details, and old report content from the previous link must be cleared or ignored unless the field was manually edited by the user.

Continue autonomously:
- inspect the current code first
- make a minimal implementation plan
- implement the fix
- run required checks
- if checks fail, diagnose and fix
- continue until Done when conditions pass or a real blocker is reached

Stop only for real blockers:
- real credentials are required
- deployment or git push is required
- new backend service is required
- Playwright/Puppeteer/dynamic renderer is required
- destructive file deletion is required

Constraints:
- do not use real Ozon credentials
- do not call Ozon Seller API
- do not change Worker behavior
- do not add new APIs
- do not add Playwright, Puppeteer, crawler, proxy, login, captcha bypass, or external parser
- do not modify profit formulas
- do not modify logistics matching logic
- do not modify platform presets
- do not push
- do not deploy

Done when:
- changing URL creates a clean new extraction session
- old extracted product data never appears in a new URL report
- auto-filled fields are cleared correctly on URL change
- user-edited fields are preserved correctly
- stale async responses are ignored
- report uses only current URL data
- Worker behavior remains unchanged
- static checks pass

Required checks:
- node --check js/product-selection.js
- node --check js/main.js
- node --check js/store-api.js
- git diff --check
- git diff -- worker/index.js must show no output

Final response must include:
- Files inspected
- Files changed
- What changed
- How URL-change reset works
- How auto-owned vs user-owned fields are tracked
- How stale async responses are ignored
- Browser smoke test result
- Static check results
- Whether Worker behavior changed
- Whether any new API/dynamic renderer/crawler/parser was added
- Whether deployment or push was performed
- Remaining risks