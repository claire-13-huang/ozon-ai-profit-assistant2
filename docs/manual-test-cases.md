# Manual Test Cases

## Function Center / Modular Navigation

1. Function Center is visible on app load
   - Input: open `index.html`.
   - Expected: the page shows `功能中心` with module cards for `利润计算器`, `选品测品分析`, `主题标签助手`, `标题关键词助手`, `详情页优化`, `广告数据复盘`, and `API 设置`.

2. Module statuses are correct
   - Input: inspect the Function Center cards.
   - Expected: `利润计算器` and `选品测品分析` show `已可用`; `API 设置` shows `设置`; `主题标签助手`, `标题关键词助手`, `详情页优化`, and `广告数据复盘` show `下一阶段`.

3. Only the selected main module is visible
   - Input: click each module card and top navigation button.
   - Expected: only the selected module panel is visible below the Function Center; previous module panels are hidden, so the page does not become one long stacked workflow.

4. Profit Calculator module is preserved
   - Input: click `利润计算器`, enter sale price, purchase cost, weight, dimensions, exchange rate, commission and ad assumptions.
   - Expected: platform tabs, logistics matching, total cost, profit, profit rate, decision copy, and CSV export still work with the existing formulas.

5. Product Testing Analysis module is preserved
   - Input: click `选品测品分析`, fill evidence pack and product testing fields, then click `生成测品决策报告`.
   - Expected: Evidence Pack, six score cards, report sections, and limited `商品卡片观察报告` behavior still work.

6. Future modules are placeholders only
   - Input: click `主题标签助手`, `标题关键词助手`, `详情页优化`, and `广告数据复盘`.
   - Expected: each module opens a placeholder panel that explains future input and output. No tag generation, title generation, detail page generation, or advertising analysis engine runs.

7. API Settings remains accessible
   - Input: click `API 设置`.
   - Expected: the existing API settings / backend connection section opens. It does not ask the user to store real API keys in frontend storage.

8. Switching modules preserves inputs
   - Input: fill a few calculator fields and evidence pack fields, switch to placeholders and back.
   - Expected: previously entered calculator and product testing inputs remain in place.

9. No new engine or extraction behavior appears
   - Input: inspect future placeholder modules and generated reports.
   - Expected: no LLM API, crawler, dynamic renderer, parser, new backend, or new dependency behavior is introduced.

## AI Analysis Product Card Testing Decision Workspace

1. Evidence pack is the primary input
   - Input: open the app, switch to `AI Analysis`.
   - Expected: the page shows a large textarea labeled `商品证据包 / 竞品观察 / 我的疑问` with helper text `可以粘贴商品标题、竞品价格、评论痛点、材质描述、使用场景、你的担心点。系统会先结构化这些证据，再生成测品判断。`

2. Evidence pack enriches the report
   - Input: paste a block containing a product title, competitor price range, review pain points, material, usage scene, selling point, and seller doubts; leave the source link empty; click `生成测品决策报告`.
   - Expected: report includes structured evidence rows for title/category/material/scene, competitor/review signals, and doubts/risks. Missing evidence is marked as not provided; no hidden platform data is invented.

3. Product testing score diagnosis appears
   - Input: generate a report with evidence pack and structured card-quality fields.
   - Expected: `关键评分总览` shows six score cards: `利润安全评分`, `价格竞争力评分`, `产品卡片质量评分`, `评价与信任评分`, `物流与退货风险评分`, and `平台匹配度评分`, each with a 0-100 score and a short rule-based reason.

4. Upgraded report sections are visible
   - Input: generate a report after filling evidence pack, basic product fields, market observations, and card-quality fields.
   - Expected: report includes `测品结论`, `关键评分总览`, `商品定位`, `核心卖点`, `产品卡片问题`, `价格竞争判断`, `评价与信任风险`, `利润安全边际`, `物流与退货风险`, `上架前优化建议`, `上架后观察指标`, `继续 / 优化 / 暂停条件`, and `数据边界`.

5. Limited report with missing profit fields
   - Input: leave 来源成本 and 目标售价 empty, paste an evidence pack, and click `生成测品决策报告`.
   - Expected: the page scrolls to the visible warning first; report status is `商品卡片观察报告`; report says `利润数据不足，本次不输出利润安全结论。`; score cards still render, but profit safety reason says profit data is insufficient.

6. Full score report requires AI page profit fields
   - Input: fill 来源成本 and 目标售价 with positive numbers, paste an evidence pack, and click `生成测品决策报告`.
   - Expected: no missing-profit warning remains; the page scrolls to the report; status is one of `建议上架测试`, `优化后再测`, `谨慎测试`, `暂不建议测试`; report includes profit safety scoring and, when a complete profit snapshot exists, minimum safe price reference.

7. Saved calculator snapshot cannot bypass missing AI fields
   - Input: complete the profit calculator, then clear AI Analysis 来源成本 or 目标售价 and click `生成测品决策报告`.
   - Expected: missing-profit warning appears and the report stays in `商品卡片观察报告` mode until both AI page fields are positive numbers.

8. Backend-missing boundary is explicit
   - Input: generate any report without optional Store API data.
   - Expected: `数据边界` includes `后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。`

9. No new backend or extraction dependency is required
   - Input: inspect the generated report after using only evidence pack and manual fields.
   - Expected: report works without a product URL, without Store API authorization, without LLM API, and without crawler/dynamic-renderer/parser behavior.

10. Score explanations are seller-actionable
   - Input: generate a report with evidence pack, competitor price range, review pain points, weak main image, missing material, and complete source cost / target selling price.
   - Expected: each score reason names a concrete action, such as adjusting price, changing title keywords, changing the main image, strengthening material/spec details, avoiding high ad spend, or recording exposure/click/add-to-cart/order signals.

11. High price produces a concrete price action
   - Input: make current target price clearly higher than the manually observed competitor price range, then generate a report.
   - Expected: the price score or action list tells the seller to adjust price, or to justify the higher price with material/spec/package/use-scene differentiation. It must not only say the product has generic price risk.

12. Weak product card produces concrete card fixes
   - Input: mark title clarity, main image quality, selling point clarity, or category fit as weak.
   - Expected: report says to change the title, improve the first main-image visual, and add material/spec/usage details. It should not use vague wording such as `可以适当优化`.

13. Review/trust weakness limits ad spending
   - Input: enter high competitor review count, negative review signals, or high review trust risk.
   - Expected: report says not to rely on high ad spend before improving main image, price, material explanation, and trust details.

14. Missing evidence stays bounded
   - Input: leave evidence pack, competitor price, review signals, and backend data empty, then generate a report.
   - Expected: report states missing evidence/data boundaries and asks the seller to collect specific public inputs. It does not invent demand, orders, ad performance, review details, or platform backend data.

1. Product-card workspace loads
   - Input: open the app, switch to `AI Analysis`.
   - Expected: the main visible flow is `商品基础信息 -> 公开市场与竞品观察 -> 产品卡片质量判断 -> 利润与风险判断 -> 测品决策报告`; 商品标题、来源平台、目标平台、类目、采购成本、目标售价、估重、材质、使用场景和核心卖点 are primary fields.

2. Analysis model disclosure is visible
   - Input: inspect the AI Analysis panel.
   - Expected: the page shows `当前分析模型：本地规则分析模型 v0.1 + 当前利润计算快照。暂未接入大模型 API；不会自动同步真实平台曝光、点击、转化、广告、订单或财务数据。`

12. Report works without a source link
   - Input: leave 来源商品链接 empty, fill 商品基础信息, 公开市场观察, 产品卡片质量判断, and valid profit calculator inputs, then click `生成测品决策报告`.
   - Expected: a report is generated from current product-card inputs, public observations, and the profit snapshot. The report includes seller-facing diagnosis sections and does not depend on successful link extraction.

4. Link extraction is optional helper only
   - Input: configure a safe Worker URL, paste a readable public product URL with title, image, JSON-LD/meta price, and optional specs, then click `尝试提取链接信息`.
   - Expected: the extraction panel displays platform, platform type, title, image, price, currency, price role, category suggestion, confidence, extraction source, and any specs returned from public JSON-LD/meta/itemprop data.

5. Extraction failure does not block the workspace
   - Input: paste a blocked or metadata-empty product URL and click `尝试提取链接信息`.
   - Expected: the panel shows the current URL failure reason and fallback message: `该平台可能限制自动读取。你可以补充截图文字、商品描述或运营疑问，系统会基于已识别内容继续分析。`; the seller can still click `生成测品决策报告` without successful extraction.

6. Product card quality drives recommendations
   - Input: mark title clarity, main image quality, selling point clarity, category fit, spec complexity, visual differentiation, return risk, and review trust risk, then generate a report.
   - Expected: weak card quality can produce `优化后再测` or `谨慎测试`; strong card quality supports `建议上架测试` only when profit and risk inputs also allow it.

7. Competitor and review observations are manual
   - Input: fill competitor price range, visible review count, competitor card quality, market crowding, positive review signals, and negative review pain points.
   - Expected: report discusses price competitiveness and review/trust risk as manual public observations only; it does not imply platform API synchronization.

18. No stocking quantity wording appears
   - Input: generate reports for high, medium, and low margin cases.
   - Expected: decision labels are one of `建议上架测试`, `优化后再测`, `谨慎测试`, `暂不建议测试`; report does not mention first-batch stocking quantity or fixed piece counts.

10. Amazon then blocked link does not keep Amazon data
   - Input: use a URL that returns Amazon title/image/price metadata, generate a report, then replace it with a blocked/fallback URL and generate again.
   - Expected: changing the link immediately clears old extraction, image, price, shipping, material, specs, category, and report; the second report contains only the second URL and its current fallback data.

11. Stale async response is ignored
   - Input: start extraction for URL A, quickly change the field to URL B before URL A returns.
   - Expected: URL A response is ignored because request id/current URL no longer match; only URL B can update the extraction panel or report.

12. Supplier candidate price warning appears
   - Input: paste a 1688/Taobao/Tmall/Pinduoduo/JD/AliExpress URL that returns a public visible price.
   - Expected: platform type is `supplier`, price role is `candidate_source_cost`, and the UI shows `识别到的是候选采购价，请确认是否为真实拿货成本。`; the price is not silently treated as confirmed purchase cost.

13. Marketplace reference price warning appears
   - Input: paste an Amazon/Ozon/Wildberries/Yandex Market URL that returns a public visible price.
   - Expected: platform type is `marketplace`, price role is `market_reference_price`, and the UI shows `识别到的是平台销售参考价，不等于你的采购成本。`; purchase cost is not filled from marketplace price.

14. Missing shipping does not invent total cost
   - Input: use a supplier URL that returns price but no clear public shipping fee.
   - Expected: shipping shows `运费未能自动识别，请后续确认。`; total candidate source cost remains missing and is not invented.

15. Price plus shipping can create supplier total candidate cost
    - Input: use a supplier URL or fixture that returns a clear public price and a clear public shipping fee.
    - Expected: `totalCandidateSourceCost` is shown as price + shipping, marked as a candidate source cost that still requires confirmation.

16. Missing price does not fake profit conclusion
    - Input: use a URL with title/image but no price and leave the profit calculator purchase cost unconfirmed.
    - Expected: report highlights missing price/source cost confirmation instead of producing a fake purchasing-cost conclusion.

17. Material / usage / scene are conservative
    - Input: use public title/description containing clear keywords such as cotton, polyester, kitchen, travel, outdoor, baby, sports, home, office, or beach.
    - Expected: material, usage, or scene appears with low confidence and a keyword-rule source; if absent, material says `材质未能自动识别。`

18. Worker behavior stays safe
    - Input: inspect `/api/source/preview` response for readable and blocked pages.
    - Expected: response contains only public normalized fields and limitations; no stock, SKU, reviews, sales count, seller-private data, login-only data, hidden fields, crawler output, browser-rendered content, or external parser data appears.

19. Missing core profit fields shows visible warning
    - Input: leave 来源成本 and 目标售价 empty, keep the profit calculator incomplete, then click `生成测品决策报告`.
    - Expected: a warning appears above the button with `请先填写来源成本和目标售价，或先在利润计算器中完成售价、采购价、重量和平台测算。否则只能做商品卡片观察，不能判断利润安全边际。`; the page scrolls to that warning.

20. Limited card observation report still generates
    - Input: fill product title, platforms, weight, selling point, competitor price range, review count, competitor link/observation, and card quality fields, but leave profit calculator incomplete; click `生成测品决策报告`.
    - Expected: report status is `商品卡片观察报告` and clearly says `利润数据不足，本次不输出利润安全结论。`

30. Complete AI page profit data scrolls to report
    - Input: fill 来源成本 and 目标售价 with positive numbers, then click `生成测品决策报告`.
    - Expected: no blocking warning remains; the page scrolls to the generated report.

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

## App Workspace View Switching

1. Profit Calculator should be the only default workspace
   - Input: open `index.html`.
   - Expected: only the Profit Calculator workspace is visible; AI Analysis and API Settings are not visible below the calculator.

2. AI Analysis should switch the main screen
   - Input: click `AI Analysis` in the top navigation.
   - Expected: the screen switches to the AI workspace; it shows a compact profit summary and AI/product-analysis placeholder cards, not the full calculator form.

3. API Settings should switch the main screen
   - Input: click `API Settings` in the top navigation.
   - Expected: the screen switches to a clean Store Integration Center with a header, backend connection card, marketplace cards, Ozon setup flow, and security notes.

4. Switching views should not change calculator results
   - Input: calculate a valid sample product, switch to AI Analysis, then switch back to Profit Calculator.
   - Expected: sale price, platform, cost inputs, logistics result, profit, profit rate, and diagnosis remain unchanged.

5. Platform tabs should still work inside Profit Calculator
   - Input: switch between Ozon, Wildberries, and Yandex tabs in the Profit Calculator workspace.
   - Expected: active platform theme and supplier/service choices update normally; no AI or API workspace appears below the calculator.

6. Opening API Settings should not make a real API request
   - Input: click `API Settings` without pressing save, sync, or test buttons.
   - Expected: no backend/API request is triggered by navigation alone; the page shows placeholder connection states.

## AI Analysis Manual Preview Workflow

### Source Link Public Metadata Preview

1. Example public metadata preview success
   - Input: configure a safe Worker URL, send `POST /api/source/preview` with `{ "url": "https://example.com/" }`, or paste `https://example.com/` in AI Analysis and click `生成测品建议`.
   - Expected: Worker returns safe public metadata such as source domain/title when readable; live verification returned title `Example Domain`; response may include `finalUrl`, `redirectCount`, `platform`, `platformType`, `confidence`, and `extractionSources`; no stock, SKU, specs, reviews, sales count, hidden data, or login-only data appears.

2. 1688 public link preview success or redirect fallback
   - Input: configure a safe Worker URL, paste a valid `https://detail.1688.com/...` URL, leave 商品标题 empty, and click `生成测品建议`.
   - Expected: `/api/source/preview` is attempted through the Worker. If public metadata is readable after at most 3 safe public GET redirects, source domain and public title are shown and 商品标题 may be prefilled. If blocked, unreadable, or still unresolved after redirects, the UI shows `该链接跳转后仍无法读取公开页面信息，请手动填写商品标题、采购价和类目信息。` or the normal public-metadata fallback; manual analysis still works.

3. Ozon marketplace page preview stays separate from Seller API
   - Input: configure a safe Worker URL, paste an `https://www.ozon.ru/...` marketplace page, leave Ozon Client ID/API Key empty, and click `生成测品建议`.
   - Expected: source preview attempts public metadata only; Seller API limitation notice remains separate; no text claims Seller API can read arbitrary Ozon marketplace pages or other sellers' products.

4. Amazon or brand-site public metadata preview
   - Input: configure a safe Worker URL, paste an Amazon or brand-site product URL, leave 商品标题 empty, and click `生成测品建议`.
   - Expected: if public `<title>`, `og:title`, `og:image`, `description`, or canonical metadata is readable, title/image preview appears; if not, manual workflow continues with friendly fallback.

5. Invalid URL rejection
   - Input: send `POST /api/source/preview` with `{ "url": "abc" }`, or enter an invalid source URL in the frontend and click `生成测品建议`.
   - Expected: safe error appears; no Worker fetch to a product page is attempted; manual report is not blocked after the seller enters a valid URL.

6. Private/internal URL rejection
   - Input: send `POST /api/source/preview` with `http://127.0.0.1/`, `http://localhost/`, `http://192.168.1.10/`, or an internal/local hostname.
   - Expected: Worker rejects the request with safe JSON; no private/internal page is fetched.

7. Safe public redirect success
   - Input: send `POST /api/source/preview` with a public URL that redirects to `https://example.com/` in one or two hops.
   - Expected: Worker follows only `GET` redirects, resolves relative `Location` values against the current URL, validates every redirect target with the same public URL safety checks, and returns readable metadata with `redirectCount` greater than `0` when successful.

8. HTTP-to-HTTPS redirect success
   - Input: send `POST /api/source/preview` with `http://github.com/` or `http://www.cloudflare.com/`.
   - Expected: Worker safely follows the public HTTP-to-HTTPS redirect, returns readable metadata, and reports `redirectCount: 1`.

9. Amazon two-step redirect success
   - Input: send `POST /api/source/preview` with `http://amazon.com/`.
   - Expected: Worker safely follows the public redirects to `https://www.amazon.com/`, returns public metadata when readable, detects `Amazon`, marks the platform type as marketplace, and reports `redirectCount: 2`. If a public visible price is present, `priceRole` is `market_reference_price`; response still must not include stock, SKU, specs, reviews, sales count, seller data, hidden data, or login-only data.

10. 1688 safe fallback remains expected
   - Input: send `POST /api/source/preview` with `https://detail.1688.com/offer/123456789.html` or `https://www.1688.com/`.
   - Expected: If metadata is not readable, Worker returns a safe fallback. 1688/Taobao and some ecommerce platforms may block Cloudflare Worker fetches, require dynamic rendering, or return metadata-empty pages. In those cases, the product remains usable through manual title/cost/category input.

11. Redirect loop or too many redirects fallback
   - Input: send `POST /api/source/preview` with a URL that redirects more than 3 times.
   - Expected: Worker stops after the redirect limit and returns `该链接跳转后仍无法读取公开页面信息，请手动填写商品标题、采购价和类目信息。`; no crawler, batch fetch, browser automation, or retry loop is started.

12. Redirect to private/local address rejection
   - Input: send `POST /api/source/preview` with a public URL whose `Location` points to `http://127.0.0.1/`, `http://localhost/`, `http://192.168.1.10/`, an internal/local hostname, a credential URL, or an unsafe protocol.
   - Expected: Worker rejects the redirect target with safe JSON and returns `该链接跳转后仍无法读取公开页面信息，请手动填写商品标题、采购价和类目信息。`; no private/internal target is fetched.

13. Preview failure should not block manual analysis
   - Input: configure a Worker URL, paste a source link that blocks public fetch, manually fill 商品标题 / 采购价 / 类目, and click `生成测品建议`.
   - Expected: report still generates from manual fields and profit snapshot; preview failure appears only as friendly guidance or limitation text.

14. Source preview must not extract restricted product data
   - Input: inspect `/api/source/preview` response for a readable page.
   - Expected: response contains only safe public product fields such as `url`, `host`, `platform`, `platformType`, `title`, `image`, `description`, `canonicalUrl`, optional `price`, `currency`, `priceRole`, `categorySuggestion`, `confidence`, `extractionSources`, `finalUrl`, and `redirectCount`; no stock, SKU, specs, seller data, reviews, orders, sales count, or hidden data appears.

15. Generic JSON-LD Product page
   - Input: test a public product page that returns JSON-LD Product data with `name`, `image`, `offers.price`, and `offers.priceCurrency`.
   - Expected: title, image, price, currency, category when available, confidence, and extraction sources are shown. Price remains a public visible price line only and must still be manually confirmed.

16. Supplier price should be candidate source cost
   - Input: paste a 1688, Taobao, Tmall, Pinduoduo, JD, or AliExpress product URL that returns a public visible price.
   - Expected: platform is detected; `platformType` is `supplier`; `priceRole` is `candidate_source_cost`; if `采购价` is empty the frontend may fill it and shows `识别到的是候选采购价，请确认是否为真实拿货成本。`; all fields remain editable.

17. Marketplace price should not become purchase cost
   - Input: paste an Amazon, Ozon, Wildberries, or Yandex Market product URL that returns a public visible price.
   - Expected: platform is detected; `platformType` is `marketplace`; `priceRole` is `market_reference_price`; the frontend shows `识别到的是平台销售参考价，不等于你的采购成本。`; `采购价` is not silently filled.

18. No price found
   - Input: paste a readable product page that returns title/image but no public visible price.
   - Expected: `price` is `null`, price confidence is `none`, and the frontend shows `未能自动识别价格，请手动填写或确认。`

19. Ozon extraction or fallback
   - Input: paste an `ozon.ru` product page.
   - Expected: Ozon is detected as marketplace. Public readable title/image/price may appear when available; if blocked or metadata-empty, fallback is clear and Seller API limitation remains separate.

20. Wildberries extraction or fallback
   - Input: paste a `wildberries.ru` product page.
   - Expected: Wildberries is detected as marketplace. Public readable fields may appear when available; if blocked or dynamic, the manual workflow remains available and no old data is reused.

21. Yandex Market extraction or fallback
   - Input: paste a `market.yandex.ru` product page.
   - Expected: Yandex Market is detected as marketplace and any visible price is market reference price; blocked/dynamic pages show fallback guidance.

22. Taobao/Tmall extraction or fallback
   - Input: paste `item.taobao.com` and `detail.tmall.com` product URLs.
   - Expected: Taobao/Tmall are detected as suppliers; visible prices are candidate source costs; blocked or login/dynamic pages show fallback without claiming success.

23. Pinduoduo extraction or fallback
   - Input: paste a `pinduoduo.com` or `yangkeduo.com` product URL.
   - Expected: Pinduoduo is detected as supplier; visible prices are candidate source costs; fallback is clear if blocked.

24. AliExpress extraction or fallback
   - Input: paste an `aliexpress.com` product URL.
   - Expected: AliExpress is detected as supplier; visible price is candidate source cost; fallback is clear if blocked or metadata-empty.

25. Source preview should clear stale metadata when URL changes
   - Input: configure a safe Worker URL, paste `http://amazon.com/`, click `生成测品建议`, and confirm public Amazon title metadata appears. Then replace the source URL with a blocked or fallback link such as a 1688/Ozon-related URL and click `生成测品建议` again.
   - Expected: previous Amazon title, image, description, canonical URL, and source metadata are cleared before the second report. If the second preview fails, the report shows fallback guidance for the current URL only and does not show Amazon metadata.

26. Auto-filled preview title should clear on a different URL
   - Input: paste a link that successfully auto-fills 商品标题 from public metadata, do not manually edit the title, then replace the source URL with a different link.
   - Expected: the old auto-filled title is cleared when the URL changes, so the next report cannot reuse the previous link title.

27. Manually typed title should survive URL changes
   - Input: paste a source link, manually type 商品标题, then replace the source URL with a different link.
   - Expected: the manually typed title remains in place unless the seller clears it. The report uses the current URL and the user-entered title, not stale preview metadata.

28. Preview failure should not block manual report after stale metadata reset
   - Input: after a successful preview, replace the URL with a blocked/fallback source, manually fill or keep manual 商品标题 / 采购价 / 类目, and click `生成测品建议`.
   - Expected: report still generates from current source URL, current manual fields, and the profit snapshot. No previous title/image/source metadata appears.

29. Metadata success can also suggest category
   - Input: configure a safe Worker URL, paste a source link that returns public title metadata, leave 商品标题 and 类目或产品类型 empty, then click `生成测品建议`.
   - Expected: title may auto-fill from public metadata. If the title contains a supported keyword such as clothing, shoes, phone case, jewelry, kitchen, storage, or organizer, category is suggested only when the category field is empty.

30. Metadata failure plus pasted text suggests title and category
   - Input: paste a blocked/fallback source link, paste visible product text into `粘贴商品标题/详情文本（可选）`, leave 商品标题 and 类目或产品类型 empty, then click `生成测品建议`.
   - Expected: 商品标题 is suggested from the first meaningful pasted-text line, 类目或产品类型 is suggested from simple keyword rules, and all fields remain editable.

31. User-edited title is preserved
   - Input: let public metadata or pasted text suggest a title, then manually edit 商品标题 and trigger analysis again.
   - Expected: the app does not overwrite the manually edited title unexpectedly.

32. User-entered category is not overwritten
   - Input: manually enter 类目或产品类型, then paste helper text with keywords for a different category.
   - Expected: the manually entered category remains unchanged unless the seller clears or edits it.

33. Source cost is never guessed from pasted helper text
   - Input: paste helper text that includes visible prices, ranges, promotional text, or supplier notes, but leave 采购价 empty.
   - Expected: 采购价 stays empty. The report reminds: `采购价会直接影响利润判断，请手动填写或确认。` No guessed price, stock, SKU, specs, reviews, sales count, seller data, or hidden data appears.

34. First URL success then second URL fallback must not keep stale data
   - Input: first use a URL that successfully returns title/image/price, then immediately replace it with a blocked 1688/Taobao/Ozon page and click `生成测品建议`.
   - Expected: the second report only shows the current URL fallback. Old title, image, price, priceRole, confidence, and extraction sources do not appear.

1. Manual product information only should generate a testing decision
   - Input: leave source URL empty, fill 商品标题, 采购价, 类目或产品类型, 材质, 使用场景, 核心卖点, 产品卡片质量判断, and valid profit calculator inputs; click `生成测品决策报告`.
   - Expected: report appears from manual product information, public observation fields, and current profit calculator snapshot; empty exposure/click/conversion assumptions do not cause `数据不足`; report sections focus on product-card quality, price competitiveness, review risk, profit safety, logistics/return risk, and continue/optimize/pause conditions.

2. Optional manual testing assumptions should be labeled as estimates
   - Input: expand the optional manual assumption panel before clicking `生成测品决策报告`; fill 预计曝光量（手动预估）, 预计点击率（手动预估）, 预计转化率（手动预估）, exposure/click/conversion notes, competitor observations, and optional ad-share assumptions.
   - Expected: the fields are clearly part of the pre-generation workflow; report includes those values as manual estimates only; UI shows `当前不会自动读取店铺曝光、点击、转化、广告或订单数据。以下参数仅用于人工模拟测品结果，不代表平台 API 自动同步数据。`; no text implies API sync.

3. Report should not fail when optional metrics are empty
   - Input: clear 预计曝光量 / 预计点击率 / 预计转化率 and all optional backend/ad assumptions; keep manual product info, card quality inputs, public market observations, and profit calculator inputs valid; click `生成测品决策报告`.
   - Expected: report still shows a testing decision based on profit margin, total cost, source cost, category, selling point, and logistics/profit snapshot; `数据边界` explains optional assumptions are empty but does not make the report look failed.

4. High-margin product should produce listing-test decision
   - Input: set profit calculator values so profit margin is 30% or higher, fill product-card and public market fields, then click `生成测品决策报告`.
   - Expected: decision label can be `建议上架测试` when card quality and market risk are acceptable; report reminds the seller to record exposure, clicks, add-to-cart, orders, returns, review signals, and ad spend.

5. Medium-margin product should produce cautious decision
   - Input: set profit calculator values so profit margin is between 10% and 20%, fill product-card and public market fields, then click `生成测品决策报告`.
   - Expected: decision label is `谨慎测试` or `优化后再测`; report warns that ad spend, returns, review trust, card quality, or logistics changes may compress profit.

6. Low-margin or negative product should not be recommended
   - Input: set profit calculator values so profit margin is below 10% or profit is negative, fill product-card and public market fields, then click `生成测品决策报告`.
   - Expected: decision label is `暂不建议测试`; report tells the seller to improve price, purchase cost, logistics cost, card quality, review risk, or ad assumptions before testing.

7. 1688 link with manual product information
   - Input: paste a valid `detail.1688.com` URL, enter 商品标题, 采购价, 类目或产品类型, and card-quality fields, then click `生成测品决策报告`.
   - Expected: source domain is optional context; manual product information and card-quality fields drive the decision; optional Ozon context unavailable appears only once under `数据边界`.

8. Ozon product page link with manual product information
   - Input: paste an `ozon.ru` product page URL and fill the manual product fields.
   - Expected: Seller API limitation notice appears; manual product information and profit snapshot still drive the testing decision.

9. 1688 link with empty manual fields
   - Input: open AI Analysis, paste a valid `https://detail.1688.com/...` product URL, leave 商品标题 / 采购价 / 类目 empty, then click `生成测品建议`.
   - Expected: source domain is recognized; the UI shows `已识别来源链接，但当前不会自动抓取商品标题。请手动填写商品标题、采购价和类目信息后继续分析。`; no hard failure state appears.

10. 1688 link with manual product information
   - Input: paste a valid `detail.1688.com` URL, enter 商品标题, 采购价, 类目或产品类型, and optional 卖点或备注, then click `生成测品建议`.
   - Expected: analysis preview shows the source domain, manual product title, source cost, category/product type, notes, and current profit snapshot if available; editing the manual fields after analysis refreshes the preview; Ozon context unavailable appears only once under `数据边界`.

11. Ozon product page link with manual fields
   - Input: paste an `ozon.ru` product page URL and fill the manual product fields.
   - Expected: the page is recognized as an Ozon marketplace/product page; the Seller API limitation notice appears; manual analysis preview still continues and does not claim Seller API can read arbitrary Ozon pages or competitor products.

12. Amazon or external source link with manual fields
   - Input: paste an Amazon or brand-site product URL and fill manual title, source cost, category, and notes.
   - Expected: source domain is recognized and the manual fields drive the analysis preview; no scraping, crawler, or external product API request is required.

13. Ozon store context unavailable remains optional
   - Input: run AI Analysis without Ozon credentials or with Ozon context unavailable.
   - Expected: report still renders from source link + manual fields; the only Ozon unavailable warning appears under `数据边界`: `Ozon 店铺商品摘要暂不可用，本次先基于来源链接、手动商品信息和利润测算进行分析。`

14. No direct source-page scraping
   - Input: inspect browser network during the above tests.
   - Expected: browser-side code does not call `https://api-seller.ozon.ru`, 1688/Taobao/Amazon product parsing APIs, or scraper/crawler endpoints.

## Safe Seller API Integration Preparation

1. Product link should enter manual preview mode
   - Input: open AI Analysis, enter `https://example.com/product`.
   - Expected: status says the product link was received, current mode is manual/preview, and automatic data reading requires backend store API authorization.

2. AI Analysis should show connection status cards
   - Input: enter or clear the product link.
   - Expected: Data source, Product link, Store API, and Analysis mode cards update without claiming real API access.

3. Missing Worker URL should block credential sending
   - Input: open API Settings, fill Ozon Client ID and API Key, leave Worker URL empty, click `Test Ozon connection`.
   - Expected: status says backend/Worker is not configured and credentials are not sent anywhere.

4. API key field should be masked
   - Input: inspect the Ozon API key field.
   - Expected: field type is `password`; the key is not displayed as plain text after input.

5. API key should not be saved to localStorage
   - Input: type an Ozon API key, refresh the page.
   - Expected: the API key field is empty after refresh; localStorage contains no Ozon API key value.

6. Browser should not call Ozon official API directly
   - Input: use AI Analysis and API Settings without a Worker implementation.
   - Expected: browser requests do not go to `api-seller.ozon.ru`; only configured Worker URLs may be requested after explicit button clicks.

7. Missing future Worker endpoint should fail gracefully
   - Input: configure a Worker URL that does not implement `/api/ozon/test-connection`, then click `Test Ozon connection`.
   - Expected: status says the endpoint is not ready; credentials are not stored in frontend storage.

8. Calculator should remain unchanged
   - Input: return to Profit Calculator and use sale price 100, exchange rate 12.5, weight 500g, dimensions 10/10/10, purchase cost 50, commission 10%, advertising 5%, label fee 1, other cost 2.
   - Expected: total cost, profit, profit rate, logistics matching, and diagnosis behave the same as before this API preparation change.

9. Worker test endpoint should return safe status only
   - Input: send `POST /api/ozon/test-connection` to the Worker with test Client ID and API Key.
   - Expected: response includes only `connected`, `message`, `maskedClientId`, and `timestamp`; it never returns the API key.

10. Frontend should clear API key after test
    - Input: enter Client ID and API Key, click `Test Ozon connection`.
    - Expected: the API key input is cleared after the test finishes, regardless of success or failure.

11. API Settings should separate backend endpoint from seller credentials
    - Input: open API Settings.
    - Expected: Cloudflare Worker URL appears in the Backend connection card; Ozon Client ID and Ozon API Key appear only in the Temporary credential test step.

12. Backend health check should use Worker only
    - Input: enter the deployed Worker URL and click `Test health`.
    - Expected: backend badge changes through Testing to Backend connected or Failed; request goes to `{Worker URL}/api/health`; no Ozon API key is requested.

13. Marketplace cards should not overclaim future integrations
    - Input: inspect Ozon, Wildberries, and Yandex cards.
    - Expected: Ozon is active/testable; Wildberries and Yandex are marked `Coming soon` with disabled actions and no fake connection claim.

14. Ozon store profile test should reveal temporary credential testing when backend credentials are missing
    - Input: open API Settings, enter the deployed Worker URL, add one Ozon store profile, then click `测试连接` on that store card while the backend has no long-term Ozon credentials configured.
    - Expected: the status explains that backend credentials are missing, the Ozon temporary Client ID / API Key test form is revealed or focused, the store name is filled, and the API key field remains password type.

15. Temporary profile connection test should only call the Worker
    - Input: in the revealed temporary test form, leave Client ID / API Key empty once, then enter dummy values and click `Test Ozon connection`.
    - Expected: empty fields show a missing credential message; dummy credentials are sent only to `{Worker URL}/api/ozon/test-connection`; the browser does not call `api-seller.ozon.ru`; the API key is not saved to localStorage/sessionStorage and is cleared after the test.

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

## Preset Panel Removal

1. Common preset panel should not appear
   - Input: open the page and inspect the left-side input area.
   - Expected: the `常用预设` panel, preset selector, and `应用预设` button are not visible.

2. Manual input still works after preset removal
   - Input: manually fill sale price, exchange rate, weight, dimensions, purchase cost, commission, and advertising rate.
   - Expected: total cost, profit, profit margin, diagnosis, next action, and cost explanation update through the normal calculation flow.

3. Same inputs should keep the same diagnosis
   - Input: use the same values twice, including any equal-cost edge case.
   - Expected: decision text, risk wording, next action, and cost-pressure diagnosis stay the same for the same inputs.

## Daily Reference Exchange Rate Helper

1. Manual exchange rate input still works
   - Input: manually change exchange rate to a valid value, such as 12.30.
   - Expected: ruble price, logistics matching, total cost, profit, diagnosis, and cost explanation update normally; the helper status says the rate was manually changed.

2. Fetch daily reference exchange rate
   - Input: click `今日参考`.
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

7. Fill manual values, then fetch reference rate
   - Input: manually fill a valid calculation, then click `今日参考`.
   - Expected: the exchange rate updates to the reference value, and calculation/diagnosis/cost explanation recalculate.

8. CSV export after using fetched reference rate
   - Input: fetch the reference rate, confirm valid calculation, then click CSV export.
   - Expected: CSV still downloads with the current calculated result.

## Phase 3 Visual Polish And Exchange Rate UX

1. Page visual hierarchy is calmer
   - Input: open the page on desktop.
   - Expected: the page uses a light gray background, white panels, thin borders, low shadow, and no large colorful gradient container; the title reads `利润决策助手`.

2. Left input area remains readable
   - Input: inspect selling price, logistics/product info, and cost fields.
   - Expected: inputs stay grouped on the left, labels are readable, and the user can still edit the same fields without layout overlap.

3. Right result area remains decision-focused
   - Input: enter valid calculation data.
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

## Product Selection Pre-Decision Assistant

1. Empty key fields should show waiting state
   - Input: clear 商品标题, 类目, 采购成本, or profit calculator inputs.
   - Expected: product selection report asks for missing product-card or profit inputs, explains that backend/API collection is optional, and does not give a fake confident decision.

2. High profit, low competition, vertical store
   - Input: sale price 120, exchange rate 12.5, valid weight/dimensions/costs with profit margin above 20%; product title/category/selling point filled; competitor count 15; competitor average price 1600 RUB; ad share 15%; card quality marked acceptable.
   - Expected: report shows `建议上架测试` or `谨慎测试`, with next actions focused on validating exposure, clicks, add-to-cart, orders, reviews, returns, and ad spend.

3. Low profit with 30% ad share
   - Input: adjust current calculator until profit margin is below 10%, fill source product URL/category, competitor count 30, competitor average price near current RUB price, ad share 30%, store type vertical.
   - Expected: report shows `暂不建议` and says current profit/ad assumption is not suitable for direct advertising.

4. Moderate profit should stay cautious
   - Input: manually set profit margin between 10% and 20%, fill required selection fields.
   - Expected: report shows `谨慎测试` and recommends small-budget validation only.

5. Price higher than competitor average for a new store
   - Input: set current RUB price at least 30% higher than competitor average price, store type new, required fields filled.
   - Expected: price section warns that stronger images, reviews, ads, or differentiation are needed.

6. Price lower than competitor average but healthy profit
   - Input: set current RUB price below competitor average, profit margin above 20%, required fields filled.
   - Expected: report does not blindly encourage low-price selling; it asks the user to confirm ad and return volatility.

7. High competition barrier
   - Input: required fields filled; competitor count 100 or top competitor reviews 1500.
   - Expected: competition section warns that the barrier is high and suggests long-tail keywords or differentiated positioning.

8. Product image URL preview is optional
   - Input: enter a valid image URL.
   - Expected: image preview appears. Clear the image URL and the preview disappears. Calculation should not be affected.

9. localStorage restores selection fields
   - Input: fill source product URL and temporary product selection fields, refresh the page.
   - Expected: source product URL and product selection fields restore and the report recalculates after page load.

10. Existing features still work
    - Input: after using product selection fields, change exchange rate and export CSV.
    - Expected: exchange rate helper, profit calculation, diagnosis, cost explanation, and CSV export remain usable.

## Phase 4A Ozon AI Product Recognition

1. Empty source URL should not start analysis
   - Input: leave source product URL empty and click `生成测品建议`.
   - Expected: status shows that a source product link is required; existing profit calculation remains unchanged.

2. Invalid source URL should show a clear error
   - Input: enter `abc` and click `生成测品建议`.
   - Expected: status says the link format is invalid; no confident product report is generated.

3. Worker not configured should still show a result state
   - Input: enter a valid `https://example.com/product` URL and click `生成测品建议` while `PRODUCT_SELECTION_API_BASE_URL` is not configured.
   - Expected: report shows `API 服务未连接`, explains that Cloudflare Worker is required, and displays current profit judgment if calculator inputs are valid.

4. Demo report should render without backend
   - Input: click `查看示例报告`.
   - Expected: product recognition, keywords, Ozon API status, report summary, and next actions are visible.

5. Low profit should warn against advertising
   - Input: create a calculation where profit margin is below 10%, then load demo report or analyze a URL.
   - Expected: report status is risk-oriented and warns against direct advertising tests.

6. Existing workflows should remain usable
   - Input: after using the Ozon AI product section, change price, exchange rate, and export CSV.
   - Expected: original calculator, exchange rate helper, localStorage, diagnosis, and CSV export still work.

7. Worker health status should stay passive on page load
   - Input: open the page with `window.PRODUCT_SELECTION_API_BASE_URL = ''` in `js/config.js`.
   - Expected: Ozon API status remains a placeholder and page navigation does not make a backend request automatically.

8. Worker URL config should not require code edits during testing
   - Input: after deploying Worker, paste the Worker base URL into `Cloudflare Worker 地址` and click `保存地址`.
   - Expected: the page stores the public Worker URL in localStorage and uses `/api/health` and `/api/analyze-product` through that base URL.

9. Valid Ozon credentials should show real shop sample
   - Input: run Worker with valid `OZON_CLIENT_ID` and `OZON_API_KEY`, then open `/api/health`.
   - Expected: Ozon status is `connected`; response includes `sampleCount`; if the shop has products, response includes up to five sample products.

10. Frontend should show Ozon shop sample after API connection
    - Input: configure `js/config.js` to the running Worker URL and refresh the page.
    - Expected: Ozon API status text includes connection success and sample product identifiers when Ozon returns products.

11. GitHub Actions deploy workflow should not contain secrets
    - Input: inspect `.github/workflows/deploy-worker.yml`.
    - Expected: workflow reads Cloudflare and platform credentials from GitHub Secrets only, passes Worker secrets through the official Wrangler Action `secrets` input, and no real token or API key is committed.

## Phase 4B Store API Profile Management

1. Free tier should allow only one store
   - Input: choose `未开通会员`, add one store profile, then try to add another.
   - Expected: first store is added; second add is blocked with a clear limit message.

2. Monthly card should allow up to five stores
   - Input: choose `月卡`, add five store profiles across Ozon / Wildberries / Yandex, then try a sixth.
   - Expected: five profiles are allowed; sixth is blocked.

3. Yearly card should allow ten stores
   - Input: choose `年卡`, add store profiles until capacity shows 10 / 10.
   - Expected: the panel shows total capacity and platform counts correctly.

4. Store profile should not ask for real API key
   - Input: inspect the add store form.
   - Expected: the form asks for `后端连接档案 ID` / local connection profile information, not an API key or token value.

5. Removing a store updates capacity
   - Input: add several store profiles, remove one.
   - Expected: capacity and platform counts update; status explains that backend secrets are not deleted.

6. Store profiles should restore after refresh
   - Input: add profiles and refresh the page.
   - Expected: membership tier, capacity, platform counts, and store cards restore from localStorage.

7. Backend store sync should not expose secrets
   - Input: configure `STORE_API_CREDENTIALS_JSON` in Worker and open `/api/stores`.
   - Expected: response includes platform, name, credentialRef, and status; it does not include apiKey, token, clientId, or OAuth secret.

8. Store connection test should call backend
   - Input: sync backend stores, then click `测试连接` on one store card.
   - Expected: status shows connected or a clear API/auth error from the backend.

8a. Ozon store connection test should offer temporary credentials when no backend credentials exist
   - Input: add a frontend-only Ozon store profile with a backend connection profile ID, configure the Worker URL, then click `测试连接`.
   - Expected: if `/api/store-health` returns `missing_credentials`, the page opens or focuses the Ozon temporary credential test form instead of leaving only a dead-end error.

9. Product analysis should use selected store
   - Input: sync backend stores, choose one store in `选择用于分析的店铺`, paste product URL, and click `生成测品建议`.
   - Expected: backend receives platform and credentialRef for the selected store and uses that store's real API credentials.

10. Ozon product-summary should handle missing temporary credentials safely
   - Input: send `POST /api/ozon/product-summary` with JSON body `{ "sourceUrl": "https://example.com/product", "clientId": "", "apiKey": "", "limit": 10 }`.
   - Expected: response is safe JSON with `ok: false`, `ozon.status: "missing_credentials"`, `ozon.products: []`, `ozon.sampleCount: 0`, and `limit: 5`; it does not call Ozon with missing credentials and does not expose any API Key.

11. Ozon product-summary should remain read-only and limited
   - Input: inspect `worker/index.js`.
   - Expected: `POST /api/ozon/product-summary` only uses `POST https://api-seller.ozon.ru/v3/product/list` and `POST https://api-seller.ozon.ru/v3/product/info/list`, limits product count to 1-5, and does not add product sync, pagination, storage, price update, stock update, or any write/update/delete/create endpoint.

12. Ozon product-summary missing body should not look connected
   - Input: send `POST /api/ozon/product-summary` without a JSON body.
   - Expected: response returns HTTP `400`, `ok: false`, `ozon.status: "invalid_request"`, `ozon.products: []`, and `ozon.sampleCount: 0`.

13. Ozon product-summary limit below one should clamp to one
   - Input: send `POST /api/ozon/product-summary` with JSON body `{ "sourceUrl": "https://example.com/product", "clientId": "", "apiKey": "", "limit": 0 }`.
   - Expected: response does not call Ozon, returns missing-credential state, and reports `limit: 1` with `limitClamped: true`.

14. Ozon product-summary product/list HTTP 400 should return safe diagnostics
   - Input: mock Ozon `POST /v3/product/list` to return HTTP `400` with a non-secret error body, then send non-empty dummy temporary credential fields to `POST /api/ozon/product-summary`.
   - Expected: response returns safe JSON with `ok: false`, `ozon.status: "product_list_error"`, `ozon.failureStep: "product_list"`, `ozon.products: []`, `ozon.sampleCount: 0`, and diagnostic metadata containing only endpoint name, HTTP status, effective limit, visibility, and a sanitized Ozon error message. It must not expose Client ID, API Key, token, or raw secret-bearing objects.

15. Ozon product-summary unsupported method should return 405
   - Input: send `GET /api/ozon/product-summary`.
   - Expected: response returns HTTP `405` and `ok: false`.

16. Unknown Worker route should return 404
   - Input: send `POST /api/not-found`.
   - Expected: response returns HTTP `404` and `ok: false`.

17. Product analysis should pass temporary credentials only at request time
   - Input: configure a valid HTTPS Worker URL, type Ozon Client ID and API Key into the temporary credential fields, paste a source product URL, and click `生成测品建议`.
   - Expected: browser sends `clientId`, `apiKey`, and `limit: 3` only to `{Worker URL}/api/ozon/product-summary`; the browser does not call `api-seller.ozon.ru` directly, and the API Key input is cleared after the request path completes.

18. Product analysis should clear API Key after mocked success
   - Input: point Worker URL to a local mock endpoint that returns HTTP `200` with `ok: true` and `ozon.status: "connected"`, type a dummy API Key, then click `生成测品建议`.
   - Expected: the API Key input is cleared after the request path completes; only the configured local mock Worker receives the dummy request.

19. Product analysis should clear API Key after mocked Worker failure
   - Input: point Worker URL to a local mock endpoint that returns HTTP `500`, type a dummy API Key, then click `生成测品建议`.
   - Expected: the page shows a safe Worker error/manual fallback state, and the API Key input is cleared after the request path completes.

20. Product analysis should clear API Key after network error
   - Input: point Worker URL to an allowed local URL where no server is listening, type a dummy API Key, then click `生成测品建议`.
   - Expected: the page shows a safe Worker unavailable/manual fallback state, and the API Key input is cleared after the thrown fetch/network error path.

21. Product analysis should clear API Key when source URL validation stops the request
   - Input: type a dummy Ozon API Key, leave the source product URL empty or enter an invalid URL, then click `生成测品建议`.
   - Expected: no Worker request is sent, no Ozon request is made, and the API Key input is cleared.

22. Product analysis should not store temporary API Key
   - Input: type an Ozon API Key in the temporary field, click `生成测品建议`, then inspect localStorage/sessionStorage and refresh the page.
   - Expected: no localStorage or sessionStorage value contains the Ozon API Key, and the API Key field is empty after refresh.

23. Product analysis should not send credentials to insecure remote Worker URL
   - Input: enter a non-local `http://` Worker URL, type temporary Ozon credentials, paste a source product URL, and click `生成测品建议`.
   - Expected: frontend shows a safe Worker URL security message, does not call Ozon directly, does not send temporary credentials to that Worker URL, and does not show connected product data.

24. Product analysis with missing temporary credentials should remain safe
   - Input: configure a valid Worker URL, leave Client ID or API Key empty, paste a source product URL, and click `生成测品建议`.
   - Expected: Worker returns missing-credential state; the page does not crash, `ozon.status` is not `connected`, no product sample is shown as real connected data, and `ozon.sampleCount` is `0`.

25. 1688 source link should not fail when Ozon credentials are missing
    - Input: paste a valid `1688.com` product/source URL, leave Ozon Client ID or API Key empty, and click `生成测品建议`.
    - Expected: source link is recognized, the analysis preview appears, and Ozon missing credentials are shown only as optional store-context warning: `Ozon 店铺商品摘要暂不可用，本次先基于来源链接、手动商品信息和利润测算进行分析。`

26. 1688 source link should not fail when product-summary returns HTTP 400
    - Input: paste a valid `1688.com` product/source URL, use a mocked Worker response where `/api/ozon/product-summary` returns `ozon.status: "product_list_error"`.
    - Expected: source link is recognized, the analysis preview remains visible, and the Ozon product-list failure appears only in optional store-context status. It must not replace the source analysis summary.

27. Ozon marketplace source link should clarify Seller API limits
    - Input: paste an Ozon product page URL and use a mocked product-summary HTTP 400 response.
    - Expected: the page recognizes the pasted link as an Ozon marketplace/product page and shows: `当前识别到的是 Ozon 商品页面链接。Seller API 只能读取已授权店铺的商品摘要，不能直接读取任意 Ozon 页面或其他卖家的商品数据。` The source analysis preview still appears.

28. Other seller Ozon link should not be treated as Seller API-readable store data
    - Input: paste another seller's Ozon product URL and use a mocked product-summary HTTP 400 response.
    - Expected: the source link preview remains visible, the Ozon Seller API limitation text appears, and the product-summary error is shown only as optional warning.
