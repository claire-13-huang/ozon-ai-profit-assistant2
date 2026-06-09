# ACTIVE_GOAL.md

## Goal

Upgrade the current Topic Tag Assistant into **Ozon Topic Tag Strategy Assistant v1.0**.

This is not a simple keyword generator anymore.

The module must become a seller-facing Ozon tag strategy tool that works in this order:

`competitor tags / competitor title → tag decomposition → product type judgment → strategy explanation → final Ozon topic tags`

The core idea:

* Competitor tags and competitor titles are stronger evidence than AI-generated guesses.
* The assistant should first analyze competitor wording.
* Then it should decide the product type.
* Then it should generate a final Ozon topic tag plan.

This task only applies to **Ozon topic tags**.

Wildberries and Yandex should not be treated as topic-tag platforms in this module. Their keyword functions should remain future modules.

## Current Problem

The current Topic Tag Assistant still behaves like a general tag generator.

Problems found in user testing:

1. It outputs too much Chinese explanation.
2. It does not deeply analyze competitor tags first.
3. It does not clearly extract the competitor core product word.
4. It does not explain the difference between ordinary consumer products and tool / mechanical / accessory products.
5. It does not tell the seller why tool products need more precise long-tail tags.
6. It does not use competitor tags as the main signal.
7. It still implies Ozon / Wildberries / Yandex share the same tag logic.
8. The final output does not clearly teach the seller the traffic strategy behind the tags.

## Product Positioning

Rename / clarify this module as:

`Ozon 主题标签策略助手`

This module is only for Ozon topic tag planning.

Wildberries and Yandex should be shown as future keyword assistants if needed, not handled here.

## Required Workflow

The module should be structured as 4 steps:

### Step 1. 商品基础

Inputs:

* 商品标题 / 产品名称
* Ozon 类目
* 规格 / 型号 / 尺寸
* 材质
* 使用场景
* 核心卖点

### Step 2. 竞品标签样本

Inputs:

* 竞品标题 / 搜索词 / 商品证据包
* 竞品主题标签
* 我的候选标签
* 品牌词 / 禁用词

Competitor topic tags should be treated as the strongest evidence.

The assistant should explain that competitor tags are useful because they show how similar products are already describing themselves on platform traffic entrances.

### Step 3. AI 拆解

The assistant must decompose competitor tags and product evidence into:

* 核心产品词
* 型号 / 规格词
* 适配对象词
* 使用场景词
* 材质词
* 功能词
* 人群 / 用途词
* 季节词
* 泛词
* 错配词
* 品牌 / 禁用词

Each detected word should show:

* original word
* Chinese meaning or role explanation
* type
* whether it is usable
* reason

### Step 4. 最终 Ozon 主题标签

Generate final Ozon tags:

* one tag per line
* starts with `#`
* multi-word tags use `_`
* no Chinese
* no spaces
* no commas
* no slashes
* no brackets
* no punctuation except `#` and `_`
* max 30 characters using `Array.from(tag).length`
* up to 30 tags
* no brand words
* no banned words
* no unsupported platform words

Final tag list should be directly copy-ready.

## Product Type Strategy

The assistant must judge product type before generating tags.

### Ordinary Consumer Product

Examples:

* picnic bag
* storage box
* kitchen item
* home item
* clothing
* accessories

Strategy:

* more scene tags
* more use-case tags
* material tags
* attribute tags
* seasonal tags
* user-intent tags
* broader traffic expansion is acceptable if still relevant

Seller explanation:

`普通消费品可以通过场景、材质、季节、人群和功能词扩展流量，但仍然不能使用和产品不匹配的泛词。`

### Tool / Mechanical / Accessory Product

Examples:

* automotive endoscope
* car repair tool
* phone replacement part
* machine part
* cable connector
* filter
* nozzle
* spare part
* adapter

Strategy:

* prioritize exact product word
* model / specification words
* compatibility words
* use-scene words
* repair / installation / maintenance intent
* avoid broad lifestyle words
* avoid irrelevant user / season tags

Seller explanation:

`工具类、机械类、配件类产品不适合追求太泛的流量。它们的搜索流量可能小，但用户意图更明确。主题标签应优先围绕核心产品词、型号规格、适配对象和具体使用场景，提升精准点击和转化概率。`

### Clothing / Fashion Product

Strategy:

* product type
* gender if supported
* season
* material
* style
* size / fit if provided
* avoid unsupported style or gender words

### Home / Kitchen Product

Strategy:

* product type
* material
* function
* size / capacity
* use scene
* storage / cleaning / cooking intent if supported

## Ozon-Only Rule

This module must clearly say:

`当前模块仅针对 Ozon 主题标签。Wildberries 和 Yandex 更适合单独做关键词助手，不在本模块生成。`

In the UI:

* Change module title to `Ozon 主题标签`
* Avoid saying this module generates tags for Ozon / WB / Yandex together
* Keep WB / Yandex keyword modules as future modules, not this one

## Output Sections

The report should include these sections in this order:

### 1. 产品类型判断

Show:

* product type
* why it belongs to this type
* recommended tag strategy
* traffic logic

Example for automotive endoscope:

`该产品属于工具 / 汽车维修类产品。主题标签不应追求泛流量，而应优先使用核心产品词、型号规格、适配对象和维修场景词。`

### 2. 竞品词拆解

Analyze competitor title and competitor topic tags.

For each important word show:

* word
* Chinese meaning / role
* type
* recommended / optional / avoid / needs confirmation
* reason

Example:

* `эндоскоп` = core product word
* `автомобильный_эндоскоп` = product + car scene
* `поворотный` = function / structure word
* `1080p` = specification word
* `1м` = specification word
* `для_ремонта` = use-scene word
* `сумка` = mismatch if product is automotive endoscope

### 3. 核心词提取

Show the true core product term.

For automotive endoscope, prioritize:

* `эндоскоп`
* `автомобильный_эндоскоп`
* `эндоскоп_для_авто`
* related words only if supported by evidence

If the competitor tag already provides a stronger core word than the system guess, the competitor word should win.

### 4. 标签策略建议

Explain how to build the final tag set:

* core product tags
* model / specification tags
* scene / use tags
* function tags
* long-tail precision tags
* tags to avoid

### 5. 最终可复制 Ozon 主题标签

Show final tags at the top of the practical output area.

Rules:

* one per line
* starts with `#`
* words joined by `_`
* no Chinese
* no unsafe punctuation
* max 30 characters
* up to 30 tags
* do not fill weak tags just to reach 30

Show:

`当前可推荐标签：X / 30`

If fewer than 30 tags:

`未用弱词凑满。建议补充更多竞品标签、型号、规格或适配场景后再扩展。`

### 6. 不建议使用的标签

Group rejected tags by reason:

* too broad
* wrong product type
* contains Chinese
* contains banned / brand word
* over 30 characters
* unsafe punctuation
* duplicate intent
* unsupported by evidence

### 7. 人工确认项

Show items that need seller confirmation:

* Russian wording uncertainty
* translation uncertainty
* model / specification uncertainty
* category uncertainty

## UI Requirements

Improve the module layout.

Do not make the page a long dense report.

Preferred layout:

Top:

* product type judgment
* core strategy conclusion
* final copy-ready tag list

Middle:

* competitor word decomposition
* final tag strategy

Bottom:

* rejected tags
* confirmation list
* collapsed detail table

The detail table should be collapsed by default.

Use compact tables or compact rows, not large repeated cards.

The user should first understand:

1. What type of product this is
2. What tag strategy fits this type
3. Which competitor words are useful
4. Which final Ozon tags to copy

## Required Example Test 1: Automotive Endoscope

Product title:

`汽车旋转式内窥镜`

Ozon category:

`汽车配件`

Specification:

`T42 单镜头 1米硬线`

Usage scene:

`汽车维修`

Target user / purpose:

`家庭汽车维修，修理厂`

Selling points:

`适用于汽车发动机的检测与维修工作。1080高清像素，2600mah续航，8mm微镜头，IP67级别防水。`

Evidence pack:

`эндоскоп автомобильный поворотный 360 эндоскопия двигателя infsue 4,3-дюймовый IPS-экран 1080P пиксельный 6,2 мм объектив линия 1 м водонепроницаемая IP67, для ремонта автомобильных двигателей`

Competitor topic tags:

`#эндоскоп #эндоскоп_автомобильный #эндоскоп_поворотный #автомобильный_эндоскоп`

My candidate tags:

`эндоскоп автомобильный поворотный`

Expected:

* product type is judged as tool / automotive repair product
* strategy explains precision over broad traffic
* core word is extracted as `эндоскоп`
* competitor tags are analyzed first
* final tags are based on competitor core words plus model/spec/use scene
* final tags contain no Chinese
* final tags use `#` and `_`
* no final tag exceeds 30 characters
* broad lifestyle words are not used
* output explains why this product should use precise long-tail tags

## Required Example Test 2: Picnic Cooler Bag

Use this product to confirm ordinary consumer product strategy still works:

Product title:

`野餐保温包 35L 大容量 多层口袋 保温保冷`

Category:

`户外 / 野餐 / 保温包`

Material:

`牛津布 / 铝膜内胆`

Specification:

`35L`

Usage scene:

`野餐、露营、海边、车载旅行`

Selling points:

`35L大容量，保温保冷，多层口袋，可手提，适合家庭户外`

Competitor topic tags:

`термосумка, сумка холодильник, пикник, кемпинг, пляж, сумка, рюкзак, женская сумка, большая вместимость, термоизоляция, карманы`

Expected:

* product type is ordinary outdoor consumer product
* strategy allows scene / capacity / function expansion
* `рюкзак` and `женская сумка` are rejected
* final tags are Ozon-formatted and no Chinese
* final tags focus on product type + scene + capacity + insulation

## Do Not Modify

Do not modify:

* profit formulas
* logistics logic
* platform presets
* Worker behavior
* Product Testing Analysis
* Profit Calculator
* API Settings

Do not add:

* LLM API
* crawler
* parser
* dynamic renderer
* backend
* dependency
* scraping
* real credentials

Do not commit.

Do not push.

Do not deploy.

## Required Checks

Run:

```bash
node --check js/main.js
node --check js/product-selection.js
node --check js/store-api.js
node --check worker/index.js
git diff --check
grep -R "api-seller.ozon.ru" index.html js css
grep -R "占位模块，仅用于功能中心导航结构" index.html js css
```

Also confirm:

```bash
git diff -- worker/index.js
```

## Browser Test

Open the local app and verify:

* module title is Ozon-specific
* automotive endoscope sample works
* picnic cooler bag sample works
* product type judgment is different between the two samples
* competitor tags are analyzed before final tag output
* final tags are copy-ready
* final tags contain no Chinese
* final tags use `#` and `_`
* no final tag exceeds 30 characters
* rejected tags are grouped clearly
* detail table is collapsed by default
* other modules still open
* no console errors

## Final Response

Report back with:

* files inspected
* files changed
* old problem summary
* new Ozon-only positioning
* new workflow
* product type judgment logic
* competitor tag decomposition logic
* final tag generation logic
* automotive endoscope browser test result
* picnic cooler bag browser test result
* static check results
* whether Worker changed
* whether formulas / logistics / presets changed
* whether commit / push / deploy was performed
* remaining risks
