Goal

Refactor the AI Analysis page into a URL-first automatic product extraction workflow.

The user’s product requirement is clear:

The user should paste a product link, and the app should automatically try to identify and extract the product title, product price, shipping fee when publicly available, total candidate source cost, image, platform, category, material, usage, scene, basic product details, and first-pass product analysis.

Manual product title / purchase cost / category input boxes should no longer be the main workflow.

Instead, the page should have:

1. A product URL input.
2. An automatic extraction result area.
3. A user notes / questions area where the user can add their own understanding, doubts, or business context after extraction.
4. A clear analysis model disclosure.
5. A seller-facing product testing report.

Do not stop after only inspecting. Continue implementing, testing, diagnosing failures, fixing failures, and rerunning checks until all Done when conditions pass or a real blocker is reached.

Context

Project path:
`/Users/claireclinton/Documents/ozon项目_副本`

Current product problem:

The current AI Analysis page still feels like manual form filling. The user enters a link, but if extraction fails, the app asks the user to manually fill product title, purchase cost, and category. This is not acceptable for the product direction.

The target product experience is:

User pastes product link
→ app automatically detects platform
→ app automatically extracts product information when possible
→ app displays extracted title, price, shipping, image, material, specs, usage, scene, category, and confidence
→ app generates first-pass product analysis
→ user can add extra notes/questions after extraction
→ report uses extracted data plus profit calculator snapshot
→ if extraction fails, app explains exactly why and keeps the workflow clear

Important:
Manual filling should become fallback/editing/confirmation after extraction, not the visible primary workflow.

Main platforms to support through platform-aware detection and best-effort public extraction:

* 1688
* Taobao
* Tmall
* Pinduoduo
* JD
* AliExpress
* Amazon
* Ozon
* Wildberries
* Yandex Market
* generic ecommerce product pages

Current architecture:

* Frontend: HTML/CSS/Vanilla JavaScript
* Backend: Cloudflare Worker
* No React/Vue/TypeScript
* No database
* No login
* No payment
* No new npm dependency unless explicitly approved
* Cloudflare Worker currently handles `/api/source/preview`
* Current extraction can read public HTML/metadata/JSON-LD/meta/itemprop/visible price patterns when available

Tasks

1. Inspect first:

   * `AGENTS.md`
   * `ACTIVE_GOAL.md` if present
   * `worker/index.js`
   * `index.html`
   * `css/style.css`
   * `js/main.js`
   * `js/product-selection.js`
   * `docs/API_INTEGRATION_PLAN.md`
   * `docs/manual-test-cases.md`
   * `docs/PHASE_2_5_LIVE_CHECKPOINT.md`
   * `docs/DEVELOPMENT_LOG.md`

2. Summarize current AI Analysis workflow and current source extraction behavior before changing files.

3. Refactor AI Analysis UI into a URL-first workflow.

The main visible flow should be:

* `1. 粘贴商品链接`
* `2. 自动识别商品信息`
* `3. 补充你的理解 / 疑问 / 运营观察`
* `4. 生成测品决策报告`

4. Remove or hide the old primary manual input boxes from the main workflow:

   * manual product title
   * manual source cost
   * manual product category
   * manual product notes

They should not appear as the main required form fields before extraction.

5. Replace them with an extraction result panel.

The extraction panel should display:

* platform
* platform type: supplier / marketplace / unknown
* product title
* product image
* product price
* shipping fee if publicly available
* total candidate source cost if price + shipping are both available
* currency
* price role
* category suggestion
* material
* usage
* scene
* basic product details / specs if publicly available
* extraction confidence
* extraction source
* failure reason if extraction fails

6. Add a user note/question area after extraction:

Label:
`你的补充理解 / 疑问 / 运营观察`

Purpose:
The user can add things like:

* 是否担心材质
* 是否担心退货
* 是否适合夏季
* 是否适合俄罗斯市场
* 是否有竞品
* 是否想测试某个卖点
* 任何人工经验判断

This field should enrich the analysis, but it must not replace automatic extraction.

7. Add analysis model disclosure.

The UI must clearly show what model is currently used.

Current model disclosure should say something like:
`当前分析模型：本地规则分析模型 v0.1 + 当前利润计算快照。暂未接入大模型 API；不会自动同步真实平台曝光、点击、转化、广告、订单或财务数据。`

If no LLM API is used, do not imply that ChatGPT/OpenAI/Claude is powering the live analysis.

8. Strengthen `/api/source/preview` output if needed, but stay within the existing Worker architecture.

Extend extraction fields if safely possible:

* `shippingFee`
* `totalCandidateSourceCost`
* `material`
* `usage`
* `scene`
* `specifications`
* `productDetails`
* `modelDisclosure`
* `confidence`

9. Product price and shipping rules:

   * Extract only public visible price data.
   * Extract shipping fee only if clearly public and visible in returned HTML/metadata.
   * If product price is found but shipping fee is not found, do not invent shipping.
   * If shipping is unknown, show `运费未能自动识别，请后续确认。`
   * If price + shipping are both found on a supplier/source platform, show total candidate source cost.
   * If platform is marketplace such as Amazon/Ozon/Wildberries/Yandex Market, visible price is market reference price, not purchase cost.
   * Never silently treat marketplace price as purchase cost.

10. Platform price role:

* 1688 / Taobao / Tmall / Pinduoduo / JD / AliExpress as source platforms:
  `candidate_source_cost`
  Warning:
  `识别到的是候选采购价，请确认是否为真实拿货成本。`

* Amazon / Ozon / Wildberries / Yandex Market:
  `market_reference_price`
  Warning:
  `识别到的是平台销售参考价，不等于你的采购成本。`

11. Material / usage / scene extraction:

* Extract from title, description, JSON-LD, meta description, itemprop, and simple visible public text only.
* Use conservative keyword/rule logic.
* Examples:

  * cotton / 棉 / polyester / 涤纶 / linen / 亚麻 -> material
  * home / outdoor / beach / office / kitchen / travel / baby / sports -> usage/scene
* Do not invent hidden details.
* If material is not found, show `材质未能自动识别。`
* If usage/scene is not found, infer only low-confidence hints from title/category and clearly mark as low confidence.

12. Frontend state lifecycle must be fixed at the same time.

When the user enters a new link:

* immediately clear previous extraction result
* clear previous image
* clear previous price
* clear previous shipping
* clear previous material/specs/use-case/scene
* clear previous analysis report
* clear previous extraction details
* show `正在识别当前链接……`
* if the new link fails, show only the current link failure reason
* old Amazon/Ozon/1688/other product data must never appear under a new URL

13. Async stale-response protection:

* every extraction request must carry a request ID or URL token
* if the URL changes while request is in flight, ignore old response
* stale responses must not update UI or report

14. Report behavior:

* The report must use current extraction data only.
* If price is missing, do not produce a fake profit conclusion.
* If profit calculator snapshot exists, combine it with extraction data.
* If extraction has product title/material/usage/scene, include them in product positioning and risk notes.
* If user notes/questions exist, include them in the analysis as seller context.
* Keep profit calculation formulas unchanged.

15. Failure behavior:
    If a platform blocks extraction, requires dynamic rendering, returns empty metadata, redirects too much, or returns non-HTML:

* show exact failure reason
* do not show old data
* do not say extraction succeeded
* do not force old manual product input boxes as the main workflow
* provide a small fallback message:
  `该平台可能限制自动读取。你可以补充截图文字、商品描述或运营疑问，系统会基于已识别内容继续分析。`

16. Do not implement Playwright/Puppeteer/dynamic renderer in this task.
    If dynamic rendering is required for blocked platforms, stop and document it as a future requirement. Do not add it automatically.

17. Update docs:

* `docs/API_INTEGRATION_PLAN.md`
* `docs/manual-test-cases.md`
* `docs/PHASE_2_5_LIVE_CHECKPOINT.md`
* `docs/DEVELOPMENT_LOG.md`

18. Update manual test cases:

* URL-only workflow loads
* old manual fields are no longer primary required fields
* extraction success fills product result panel
* extraction failure shows failure reason
* user can add notes/questions after extraction
* analysis model disclosure is visible
* Amazon link then blocked link does not keep Amazon data
* supplier candidate price warning appears
* marketplace reference price warning appears
* missing shipping does not invent total cost
* missing price does not fake profit conclusion
* Worker behavior stays safe

Constraints

Do not use real Ozon credentials.

Do not call Ozon Seller API for public source link extraction.

Do not add new Ozon Seller API endpoints.

Do not add write/update/delete/create endpoints.

Do not implement Playwright, Puppeteer, dynamic renderer, browser automation, proxy scraping, login scraping, cookie scraping, captcha bypass, anti-bot bypass, or external parser.

Do not bypass platform access controls.

Do not extract private, hidden, login-only, or seller-private data.

Do not extract stock, SKU, reviews, sales count, orders, or hidden fields.

Do not modify profit formulas.

Do not modify logistics matching logic.

Do not modify platform presets.

Do not deploy.

Do not push.

Do not commit unless explicitly approved after review.

Autonomous execution rule

Do not stop after the first error.

If a check fails:

1. read the error
2. identify the likely cause
3. make the smallest safe fix
4. rerun the check

Continue until all Done when conditions pass or a real blocker is reached.

Stop only for real blockers:

* real credentials are required
* deployment is required
* git push is required
* new backend service is required
* dynamic renderer / Playwright / Puppeteer is required
* destructive file deletion is required
* safety boundary would be violated

Done when

* AI Analysis page is URL-first, not manual-form-first.
* Old manual title/cost/category boxes are removed or hidden from the main workflow.
* User has a notes/questions field after extraction.
* The app attempts automatic extraction from the pasted URL.
* Extracted title, price, shipping, image, material, usage, scene, category, and confidence are displayed when available.
* Missing fields are clearly marked instead of invented.
* Analysis model disclosure is visible.
* Changing link clears old extraction data and old report content.
* Stale async responses are ignored.
* Report uses only current URL extraction, current user notes, and current profit snapshot.
* Profit formulas remain unchanged.
* Logistics logic remains unchanged.
* Worker security boundaries remain intact.
* Static checks pass.
* Documentation is updated.
* No push or deployment is performed.

Required checks

Run:

`node --check worker/index.js`

`node --check js/main.js`

`node --check js/product-selection.js`

`node --check js/store-api.js`

`git diff --check`

Confirm browser-side files do not directly call:

`https://api-seller.ozon.ru`

Final response

Report back with:

* Files inspected
* Files changed
* Current workflow summary before change
* New URL-first workflow
* What manual fields were removed/hidden
* New extraction result fields
* User notes/questions behavior
* Analysis model disclosure text
* How price + shipping are handled
* How material/usage/scene are extracted or marked missing
* How URL-change reset works
* How stale async responses are ignored
* How report data is tied to current URL
* Browser smoke test result
* Static check results
* Whether Worker behavior changed
* Whether any new dynamic renderer/crawler/parser was added
* Whether any real credentials were used
* Whether deployment or push was performed
* Remaining risks
