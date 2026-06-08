// 规则版选品预判，不调用 AI/API，也不修改利润公式。
const STORE_TYPE_TEXT = {
  vertical: '垂直店',
  mixed: '杂货店',
  new: '新店',
  mature: '成熟店'
};
const OZON_STORE_CONTEXT_WARNING = '后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。';
const OZON_MARKETPLACE_LINK_NOTICE = '当前识别到的是 Ozon 商品页面链接。Seller API 只能读取已授权店铺的商品摘要，不能直接读取任意 Ozon 页面或其他卖家的商品数据。';
const MANUAL_PRODUCT_GUIDANCE = '链接提取只是可选辅助；标题、采购成本、类目和卖点以当前商品卡片输入为准。';
const SOURCE_COST_CONFIRMATION_NOTICE = '采购价会直接影响利润判断，请手动填写或确认。';
const ANALYSIS_MODEL_DISCLOSURE_TEXT = '当前分析模型：本地规则分析模型 v0.1 + 当前利润计算快照。暂未接入大模型 API；不会自动同步真实平台曝光、点击、转化、广告、订单或财务数据。';

function getProductSelectionApiBaseUrl() {
  const inputUrl = ['backendWorkerUrl', 'ozonWorkerUrl']
    .map(id => document.getElementById(id))
    .map(el => el ? el.value : '')
    .find(value => String(value || '').trim());
  const configuredUrl = inputUrl || window.PRODUCT_SELECTION_API_BASE_URL || '';

  if (typeof normalizeWorkerBaseUrl === 'function') {
    return normalizeWorkerBaseUrl(configuredUrl);
  }

  return String(configuredUrl || '').trim().replace(/\/+$/, '');
}

function getSourcePreviewFallbackMessage() {
  return '该平台可能限制自动读取。你可以补充截图文字、商品描述或运营疑问，系统会基于已识别内容继续分析。';
}

function isBlank(value) {
  return String(value || '').trim() === '';
}

function hasPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function rub(n) {
  return Number.isFinite(n) ? n.toFixed(2) + ' ₽' : '未填写';
}

function percent(n) {
  return Number.isFinite(n) ? n.toFixed(2) + '%' : '未填写';
}

function buildWaitingSelectionReport(missing, blockingMessage) {
  const reason = blockingMessage || `等待基础输入：${missing.join('、')}。`;

  return {
    type: 'waiting',
    status: '等待基础输入',
    summary: reason + ' 当前页面不会自动抓取任意网站、平台竞品或店铺经营数据。',
    priceText: '等待来源链接和当前折合售价；竞品价格为可选人工观察，不是必填项。',
    profitText: '等待有效售价、成本和利润测算。',
    cardProblemsText: '等待商品卡片标题、主图、卖点、类目和材质信息。',
    competitionText: '人工曝光、点击、转化和竞品观察是可选估算，留空不会阻止测品报告。',
    reviewRiskText: '等待可见评论数、好评信号或差评痛点。',
    adText: '等待利润计算器基础数据；广告占比是可选人工假设。',
    logisticsReturnText: '等待重量、材质、规格复杂度和退货风险判断。',
    storeText: '等待手动商品类目、卖点和利润快照。',
    actions: ['先补齐来源链接和利润计算器基础输入。', '人工曝光、点击、转化参数可以留空，不代表 API 未同步失败。']
  };
}

function uniqueList(items, maxItems = 8) {
  return [...new Set((items || [])
    .map(item => String(item || '').trim())
    .filter(Boolean))].slice(0, maxItems);
}

function formatList(items, fallback) {
  const clean = uniqueList(items);
  return clean.length ? clean.join('、') : fallback;
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getEvidenceLines(text) {
  return String(text || '')
    .split(/\r?\n|[。；;]+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 80);
}

function pickEvidenceMatches(lines, rules, maxItems = 6) {
  const matches = [];

  lines.forEach(line => {
    rules.forEach(rule => {
      if (rule.pattern.test(line)) matches.push(rule.label || line);
    });
  });

  return uniqueList(matches, maxItems);
}

function extractEvidenceTitle(lines) {
  for (const line of lines) {
    const title = line.replace(/^(商品标题|标题|品名|产品名称|product title|title)\s*[:：-]\s*/i, '').trim();
    if (!title || /^https?:\/\//i.test(title)) continue;
    if (/^(价格|售价|采购价|竞品|评论|差评|担心|疑问|材质|场景)\s*[:：-]/.test(line)) continue;
    if (/^[¥$€₽\d\s.,~\-到至价格price]+$/i.test(title)) continue;
    if (title.length >= 3) return title.slice(0, 120);
  }

  return '';
}

function extractEvidencePrices(text) {
  const prices = [];
  const source = String(text || '');
  const rangePattern = /(\d+(?:\.\d+)?)\s*(?:-|~|到|至)\s*(\d+(?:\.\d+)?)\s*(?:₽|卢布|rub|руб)?/gi;
  const singlePattern = /(?:竞品|售价|价格|均价|price)[^\d]{0,12}(\d+(?:\.\d+)?)\s*(?:₽|卢布|rub|руб)?/gi;
  let match = rangePattern.exec(source);

  while (match) {
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0) {
      prices.push({ type: 'range', min: Math.min(min, max), max: Math.max(min, max) });
    }
    match = rangePattern.exec(source);
  }

  match = singlePattern.exec(source);
  while (match) {
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > 0) prices.push({ type: 'single', value });
    match = singlePattern.exec(source);
  }

  return prices.slice(0, 6);
}

function parseEvidencePack(text) {
  const lines = getEvidenceLines(text);
  const joined = lines.join(' ');
  const materialRules = [
    { pattern: /棉|cotton/i, label: '棉' },
    { pattern: /涤纶|聚酯|polyester/i, label: '涤纶 / 聚酯' },
    { pattern: /硅胶|silicone/i, label: '硅胶' },
    { pattern: /不锈钢|stainless/i, label: '不锈钢' },
    { pattern: /塑料|pp|abs|plastic/i, label: '塑料 / PP / ABS' },
    { pattern: /皮革|真皮|pu\b|leather/i, label: '皮革 / PU' },
    { pattern: /木|wood/i, label: '木质' },
    { pattern: /玻璃|glass/i, label: '玻璃' },
    { pattern: /陶瓷|ceramic/i, label: '陶瓷' }
  ];
  const sceneRules = [
    { pattern: /厨房|烹饪|kitchen/i, label: '厨房' },
    { pattern: /旅行|出行|便携|travel/i, label: '旅行 / 出行' },
    { pattern: /户外|露营|outdoor|camp/i, label: '户外 / 露营' },
    { pattern: /办公|office/i, label: '办公' },
    { pattern: /浴室|卫生间|bathroom/i, label: '浴室' },
    { pattern: /收纳|整理|storage|organizer/i, label: '收纳整理' },
    { pattern: /母婴|儿童|宝宝|baby|kids/i, label: '母婴 / 儿童' },
    { pattern: /车载|汽车|car/i, label: '车载' },
    { pattern: /运动|健身|sport|fitness/i, label: '运动健身' }
  ];
  const riskRules = [
    { pattern: /差评|退货|质量|异味|色差|尺码|易坏|破损|廉价|漏|开裂|变形|不耐用/i },
    { pattern: /担心|顾虑|疑问|不确定|怕|风险/i }
  ];
  const returnRules = [
    { pattern: /退货|尺码|色差|材质不清|异味|过敏|易坏|破损/i }
  ];
  const logisticsRules = [
    { pattern: /重|重量|体积|尺寸|易碎|破损|包装|物流|运费|抛重/i }
  ];
  const trustRules = [
    { pattern: /评论|评价|评分|review|rating|好评|差评/i }
  ];
  const concernRules = [
    { pattern: /担心|顾虑|疑问|不确定|怕|能不能|是否|会不会/i }
  ];
  const sellingPointLines = lines.filter(line =>
    /卖点|优势|特点|亮点|适合|方便|便携|防水|大容量|可折叠|多功能|耐用|轻便|省空间|安装简单|易清洁/i.test(line)
  );
  const categoryHints = pickEvidenceMatches(lines, [
    { pattern: /收纳|整理|organizer/i, label: '收纳整理' },
    { pattern: /服饰|衣|裤|鞋|帽|apparel/i, label: '服饰配件' },
    { pattern: /厨房|厨具|餐具/i, label: '厨房用品' },
    { pattern: /车载|汽车/i, label: '车品' },
    { pattern: /宠物|猫|狗|pet/i, label: '宠物用品' },
    { pattern: /母婴|儿童|宝宝/i, label: '母婴儿童' },
    { pattern: /户外|露营|运动|健身/i, label: '户外运动' },
    { pattern: /数码|手机|电脑|配件/i, label: '数码配件' },
    { pattern: /家居|家用|清洁/i, label: '家居日用' }
  ], 5);
  const negativeLines = lines.filter(line => riskRules.some(rule => rule.pattern.test(line)));
  const concernLines = lines.filter(line => concernRules.some(rule => rule.pattern.test(line)));
  const reviewLines = lines.filter(line => trustRules.some(rule => rule.pattern.test(line)));
  const returnLines = lines.filter(line => returnRules.some(rule => rule.pattern.test(line)));
  const logisticsLines = lines.filter(line => logisticsRules.some(rule => rule.pattern.test(line)));

  return {
    rawText: String(text || '').trim(),
    lines,
    title: extractEvidenceTitle(lines),
    categoryHints,
    materials: pickEvidenceMatches(lines, materialRules, 5),
    usageScenes: pickEvidenceMatches(lines, sceneRules, 5),
    sellingPoints: uniqueList(sellingPointLines, 6),
    competitorPrices: extractEvidencePrices(joined),
    reviewTrustSignals: uniqueList(reviewLines, 5),
    negativeReviewRisks: uniqueList(negativeLines, 6),
    returnRiskHints: uniqueList(returnLines, 5),
    logisticsRiskHints: uniqueList(logisticsLines, 5),
    concerns: uniqueList(concernLines, 6),
    confidence: lines.length >= 3 ? 'medium' : lines.length ? 'low' : 'none'
  };
}

function normalizeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return '未知来源';
  }
}

function isOzonMarketplaceUrl(url) {
  try {
    return /(^|\.)ozon\./i.test(new URL(url).hostname.replace(/^www\./, ''));
  } catch (error) {
    return false;
  }
}

function getOzonMarketplaceLinkNotice(url) {
  return isOzonMarketplaceUrl(url) ? OZON_MARKETPLACE_LINK_NOTICE : '';
}

function buildOptionalOzonContextText(ozon) {
  if (ozon && ozon.status === 'connected') {
    return ozon.message || 'Ozon 店铺商品摘要已连接。';
  }

  return OZON_STORE_CONTEXT_WARNING;
}

function normalizeManualProduct(manualProduct) {
  const product = manualProduct || {};
  const hasCost = product.sourceCost !== null && product.sourceCost !== undefined && String(product.sourceCost).trim() !== '';
  const cost = hasCost ? Number(product.sourceCost) : null;
  const targetSellingPrice = product.targetSellingPrice !== null && product.targetSellingPrice !== undefined && String(product.targetSellingPrice).trim() !== ''
    ? Number(product.targetSellingPrice)
    : null;
  const estimatedWeight = product.estimatedWeight !== null && product.estimatedWeight !== undefined && String(product.estimatedWeight).trim() !== ''
    ? Number(product.estimatedWeight)
    : null;

  return {
    evidencePack: String(product.evidencePack || '').trim(),
    title: String(product.title || '').trim(),
    sourceCost: Number.isFinite(cost) && cost > 0 ? cost : null,
    category: String(product.category || '').trim(),
    sourcePlatform: String(product.sourcePlatform || '').trim(),
    targetPlatform: String(product.targetPlatform || '').trim(),
    targetSellingPrice: Number.isFinite(targetSellingPrice) && targetSellingPrice > 0 ? targetSellingPrice : null,
    estimatedWeight: Number.isFinite(estimatedWeight) && estimatedWeight > 0 ? estimatedWeight : null,
    material: String(product.material || '').trim(),
    usageScene: String(product.usageScene || '').trim(),
    sellingPoint: String(product.sellingPoint || '').trim(),
    notes: String(product.notes || '').trim()
  };
}

function hasManualProductData(manualProduct) {
  const product = normalizeManualProduct(manualProduct);
  return Boolean(product.evidencePack || product.title || product.sourceCost !== null || product.category || product.sourcePlatform || product.material || product.usageScene || product.sellingPoint || product.notes);
}

function formatManualCost(value) {
  return Number.isFinite(value) ? `¥${value.toFixed(2)}` : '未填写';
}

function formatManualNotes(notes) {
  return String(notes || '').trim().replace(/[。.!！]+$/, '');
}

function yuan(n) {
  return Number.isFinite(n) ? `¥${n.toFixed(2)}` : '未填写';
}

function normalizeManualTestingAssumptions(assumptions) {
  const input = assumptions || {};
  const normalizeNonNegative = value => {
    if (value === null || value === undefined || String(value).trim() === '') return null;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
  };

  return {
    estimatedExposure: normalizeNonNegative(input.estimatedExposure),
    estimatedClickRate: normalizeNonNegative(input.estimatedClickRate),
    estimatedConversionRate: normalizeNonNegative(input.estimatedConversionRate),
    exposureNotes: String(input.exposureNotes || '').trim(),
    clickRateNotes: String(input.clickRateNotes || '').trim(),
    conversionRateNotes: String(input.conversionRateNotes || '').trim(),
    marketObservationNotes: String(input.marketObservationNotes || '').trim(),
    competitorCount: normalizeNonNegative(input.competitorCount),
    competitorAvgPrice: normalizeNonNegative(input.competitorAvgPrice),
    competitorMinPrice: normalizeNonNegative(input.competitorMinPrice),
    competitorMaxPrice: normalizeNonNegative(input.competitorMaxPrice),
    topCompetitorRating: normalizeNonNegative(input.topCompetitorRating),
    topCompetitorReviews: normalizeNonNegative(input.topCompetitorReviews),
    adShare: normalizeNonNegative(input.adShare),
    adType: String(input.adType || '').trim(),
    storeType: String(input.storeType || '').trim(),
    storeOrderRange: String(input.storeOrderRange || '').trim(),
    localPreference: String(input.localPreference || '').trim(),
    competitorCardQuality: String(input.competitorCardQuality || '').trim(),
    marketCrowding: String(input.marketCrowding || '').trim(),
    positiveReviewSignals: String(input.positiveReviewSignals || '').trim(),
    negativeReviewSignals: String(input.negativeReviewSignals || '').trim(),
    titleClarity: String(input.titleClarity || '').trim(),
    mainImageQuality: String(input.mainImageQuality || '').trim(),
    sellingPointClarity: String(input.sellingPointClarity || '').trim(),
    categoryFit: String(input.categoryFit || '').trim(),
    specComplexity: String(input.specComplexity || '').trim(),
    visualDifferentiation: String(input.visualDifferentiation || '').trim(),
    returnRiskLevel: String(input.returnRiskLevel || '').trim(),
    reviewTrustLevel: String(input.reviewTrustLevel || '').trim()
  };
}

function hasManualTestingAssumptions(assumptions) {
  const input = normalizeManualTestingAssumptions(assumptions);
  return Boolean(
    input.estimatedExposure !== null ||
    input.estimatedClickRate !== null ||
    input.estimatedConversionRate !== null ||
    input.exposureNotes ||
    input.clickRateNotes ||
    input.conversionRateNotes ||
    input.marketObservationNotes ||
    input.competitorCount !== null ||
    input.competitorAvgPrice !== null ||
    input.competitorMinPrice !== null ||
    input.competitorMaxPrice !== null ||
    input.topCompetitorRating !== null ||
    input.topCompetitorReviews !== null ||
    input.adShare !== null ||
    input.localPreference
  );
}

function applyManualTestingAssumptions(analysis, assumptions) {
  if (!analysis) return analysis;

  analysis.manualAssumptions = normalizeManualTestingAssumptions(assumptions);
  return analysis;
}

function buildProfitCostSnapshotText(profitSnapshot, manualProduct) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    return '请先在利润计算器中补齐售价、重量和成本，报告不会因为人工曝光/点击/转化为空而失败。';
  }

  const totalCost = Number.isFinite(profitSnapshot.sale) && Number.isFinite(profitSnapshot.profit)
    ? profitSnapshot.sale - profitSnapshot.profit
    : null;
  const purchaseText = Number.isFinite(manualProduct.sourceCost)
    ? `手动采购价 ${formatManualCost(manualProduct.sourceCost)}`
    : `采购成本 ${yuan(profitSnapshot.purchaseCost)}`;
  const totalCostText = Number.isFinite(totalCost) ? yuan(totalCost) : '未填写';

  return `${purchaseText}；利润计算器总成本约 ${totalCostText}，其中物流 ${yuan(profitSnapshot.logisticsCost)}、广告 ${yuan(profitSnapshot.adCost)}、佣金 ${yuan(profitSnapshot.commissionCost)}。当前售价折合约 ${rub(profitSnapshot.saleRub)}。`;
}

function buildLogisticsRiskText(profitSnapshot) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid) return '物流风险：等待利润计算器中的重量、尺寸和物流匹配结果。';
  if (!Number.isFinite(profitSnapshot.logisticsCost) || !Number.isFinite(profitSnapshot.sale) || profitSnapshot.sale <= 0) {
    return '物流风险：等待有效物流成本和售价。';
  }

  const ratio = (profitSnapshot.logisticsCost / profitSnapshot.sale) * 100;

  if (ratio >= 25) return `物流风险：物流成本约占售价 ${percent(ratio)}，测品前优先复核重量、尺寸和计抛。`;
  if (ratio >= 15) return `物流风险：物流成本约占售价 ${percent(ratio)}，可以测试但要关注重量和包装波动。`;
  return `物流风险：物流成本约占售价 ${percent(ratio)}，当前不是最主要压力项。`;
}

function buildManualAssumptionText(assumptions) {
  const input = normalizeManualTestingAssumptions(assumptions);
  const parts = [];

  if (input.estimatedExposure !== null) parts.push(`预计曝光量 ${input.estimatedExposure}`);
  if (input.estimatedClickRate !== null) parts.push(`预计点击率 ${percent(input.estimatedClickRate)}`);
  if (input.estimatedConversionRate !== null) parts.push(`预计转化率 ${percent(input.estimatedConversionRate)}`);
  if (input.competitorCount !== null) parts.push(`手动观察竞品 ${input.competitorCount} 个`);
  if (input.competitorAvgPrice !== null) parts.push(`竞品均价约 ${rub(input.competitorAvgPrice)}`);
  if (input.topCompetitorRating !== null || input.topCompetitorReviews !== null) {
    parts.push(`Top 竞品评分 ${input.topCompetitorRating !== null ? input.topCompetitorRating : '未填'}，评论 ${input.topCompetitorReviews !== null ? input.topCompetitorReviews : '未填'}`);
  }
  if (input.exposureNotes) parts.push(`曝光备注：${formatManualNotes(input.exposureNotes)}`);
  if (input.clickRateNotes) parts.push(`点击备注：${formatManualNotes(input.clickRateNotes)}`);
  if (input.conversionRateNotes) parts.push(`转化备注：${formatManualNotes(input.conversionRateNotes)}`);
  if (input.marketObservationNotes) parts.push(`市场观察：${formatManualNotes(input.marketObservationNotes)}`);

  if (!parts.length) {
    return '未填写人工曝光、点击、转化或竞品参数；本次报告不会因此显示失败，先基于商品卡片信息、公开观察和利润测算判断是否值得上架测试。';
  }

  return `以下为人工预估，不代表平台 API 自动同步数据：${parts.join('；')}。`;
}

function buildTestingSuggestionText(type, profitSnapshot, assumptions) {
  const input = normalizeManualTestingAssumptions(assumptions);
  const adText = input.adShare !== null
    ? `手动预估广告占比 ${percent(input.adShare)}`
    : '广告占比未做人工预估';
  const preference = input.localPreference ? ` 本地偏好：${input.localPreference}。` : '';

  if (type === 'risk') {
    return `${adText}。当前利润或成本压力偏高，暂不建议直接开广告或扩大投入，先调整采购、物流、售价或规格。${preference}`;
  }

  if (type === 'warning') {
    return `${adText}。当前只适合谨慎测品：低预算、一件代发验证，重点记录点击、加购、订单和退货，但这些记录需要人工复盘。${preference}`;
  }

  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    return '请先补齐利润计算器基础数据；人工曝光、点击、转化为空不会阻止报告，但利润快照是测品判断的核心。';
  }

  return `${adText}。当前可进入低风险上架测试，但仍要人工记录广告消耗、点击、加购、订单和退货，不视为平台 API 已同步。${preference}`;
}

function applyManualProductContext(analysis, manualProduct, sourceUrl) {
  if (!analysis) return analysis;

  const product = normalizeManualProduct(manualProduct);
  const evidence = parseEvidencePack(product.evidencePack);
  analysis.manualProduct = product;
  analysis.evidencePack = evidence;
  analysis.source = analysis.source || {};
  analysis.source.url = analysis.source.url || sourceUrl;
  analysis.source.host = analysis.source.host || normalizeHost(analysis.source.url);
  analysis.insights = analysis.insights || {};
  analysis.manualBaseContext = analysis.manualBaseContext || {
    sourceTitle: analysis.source.title || '',
    category: analysis.insights.category || '',
    sellingPoints: Array.isArray(analysis.insights.sellingPoints) ? analysis.insights.sellingPoints.slice() : []
  };

  analysis.source.title = product.title || evidence.title || analysis.manualBaseContext.sourceTitle;
  analysis.insights.category = product.category || evidence.categoryHints[0] || analysis.manualBaseContext.category;
  analysis.source.platform = product.sourcePlatform || analysis.source.platform;
  analysis.source.material = product.material
    ? { value: product.material, confidence: 'manual', source: 'product basics' }
    : evidence.materials[0]
      ? { value: evidence.materials[0], confidence: evidence.confidence, source: 'evidence pack' }
      : analysis.source.material;
  analysis.source.usage = product.usageScene
    ? { value: product.usageScene, confidence: 'manual', source: 'product basics' }
    : evidence.usageScenes[0]
      ? { value: evidence.usageScenes[0], confidence: evidence.confidence, source: 'evidence pack' }
      : analysis.source.usage;
  analysis.insights.sellingPoints = product.sellingPoint || product.notes || evidence.sellingPoints.length
    ? uniqueList([product.sellingPoint, product.notes].concat(evidence.sellingPoints, analysis.manualBaseContext.sellingPoints), 6)
    : analysis.manualBaseContext.sellingPoints.slice();

  return analysis;
}

function getProfitReportType(profitSnapshot) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid) return 'waiting';
  if (!Number.isFinite(profitSnapshot.profitRate)) return 'waiting';
  if (profitSnapshot.profit < 0 || profitSnapshot.profitRate < 10) return 'risk';
  if (profitSnapshot.profitRate < 20) return 'warning';
  return 'test';
}

function buildProfitReportText(profitSnapshot) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    return '请先修正利润测算输入，再生成选品报告。';
  }

  if (!Number.isFinite(profitSnapshot.profitRate)) {
    return '等待有效利润率。';
  }

  const base = `当前利润约 ¥${profitSnapshot.profit.toFixed(2)}，利润率约 ${percent(profitSnapshot.profitRate)}。`;

  if (profitSnapshot.profit < 0 || profitSnapshot.profitRate < 10) {
    return base + ' 利润空间过低，暂不建议直接开广告或扩大投入。';
  }

  if (profitSnapshot.profitRate < 20) {
    return base + ' 只能作为小预算谨慎测试，重点复核采购、物流和广告假设。';
  }

  return base + ' 利润具备测试空间，但还需要人工复核点击、转化、评价门槛和退货风险。';
}

function getDecisionStatusLabel(type) {
  if (type === 'risk') return '暂不建议测试';
  if (type === 'warning') return '谨慎测试';
  if (type === 'waiting') return '等待利润测算';
  return '建议上架测试';
}

function buildDecisionConclusionText(type, profitSnapshot, hasTitle) {
  if (!hasTitle) {
    return '优化后再测。当前没有可靠商品标题，产品卡片无法形成清晰搜索和点击判断。';
  }

  if (type === 'waiting') {
    return '等待利润测算。先补齐售价、重量、采购成本和物流输入，再判断是否值得上架测试。';
  }

  if (type === 'risk') {
    return '暂不建议测试。当前采购、售价、物流或竞品压力过高，先调整关键条件。';
  }

  if (type === 'warning') {
    return '谨慎测试。可以一件代发低风险上架，但先限制广告消耗，上架后逐项记录曝光、点击、加购、订单和退货原因。';
  }

  if (profitSnapshot && Number.isFinite(profitSnapshot.profitRate) && profitSnapshot.profitRate >= 30) {
    return '建议上架测试。当前利润率较好，但仍要用一件代发方式验证真实点击、加购、订单和退货。';
  }

  return '建议上架测试。利润具备测试空间，先低风险上架，重点看曝光、点击、加购、订单和退货原因是否支持继续。';
}

function getAnalysisSourceCostContext(manualProduct, source) {
  if (Number.isFinite(manualProduct.sourceCost)) {
    return {
      value: manualProduct.sourceCost,
      label: `已确认采购价 ${formatManualCost(manualProduct.sourceCost)}`,
      isCandidate: false,
      missing: false
    };
  }

  if (source && source.priceRole === 'candidate_source_cost' && source.totalCandidateSourceCost && Number.isFinite(Number(source.totalCandidateSourceCost.value))) {
    return {
      value: Number(source.totalCandidateSourceCost.value),
      label: `公开页面候选总成本 ${formatManualCost(Number(source.totalCandidateSourceCost.value))}`,
      isCandidate: true,
      missing: false
    };
  }

  if (source && source.priceRole === 'candidate_source_cost' && Number.isFinite(Number(source.price))) {
    return {
      value: Number(source.price),
      label: `公开页面候选采购价 ${formatManualCost(Number(source.price))}`,
      isCandidate: true,
      missing: false
    };
  }

  return {
    value: null,
    label: '采购成本未确认',
    isCandidate: false,
    missing: true
  };
}

function buildProfitSafetyText(type, profitSnapshot, manualProduct, source) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    if (Number.isFinite(manualProduct.sourceCost) && Number.isFinite(manualProduct.targetSellingPrice)) {
      return `已填写来源成本 ${formatManualCost(manualProduct.sourceCost)} 和目标售价 ${formatManualCost(manualProduct.targetSellingPrice)}；完整利润率、物流费和平台费用仍需利润计算器快照复核。`;
    }

    return '利润数据不足，本次不输出利润安全结论。请先在利润计算器中完成售价、采购价、重量和平台测算。';
  }

  const sourceCost = getAnalysisSourceCostContext(manualProduct, source);
  const purchaseText = sourceCost.missing
    ? `利润计算器采购成本 ${yuan(profitSnapshot.purchaseCost)}`
    : sourceCost.label;
  const base = `当前单件利润约 ${yuan(profitSnapshot.profit)}，利润率约 ${percent(profitSnapshot.profitRate)}，${purchaseText}。`;
  const costNotice = sourceCost.isCandidate
    ? ' 这是候选采购成本，仍需确认是否为真实拿货成本。'
    : sourceCost.missing
      ? ` ${SOURCE_COST_CONFIRMATION_NOTICE}`
      : '';

  if (type === 'risk') return base + ' 安全边际偏弱，价格、采购或物流任一项波动都可能吞掉利润。' + costNotice;
  if (type === 'warning') return base + ' 安全边际一般，只能用一件代发低风险验证。' + costNotice;
  return base + ' 安全边际可用于上架测试，但仍需要记录真实广告和退货成本。' + costNotice;
}

function buildSuggestedTestQuantityText(type, profitSnapshot, assumptions) {
  const input = normalizeManualTestingAssumptions(assumptions);
  const preference = input.localPreference ? ` 本地偏好：${input.localPreference}。` : '';

  if (!profitSnapshot || !profitSnapshot.mainInputValid || type === 'waiting') {
    return '暂不建议给出上架测试判断。先补齐利润计算器基础数据；后台曝光/点击/转化为空不会阻止报告生成。' + preference;
  }

  if (type === 'risk') {
    return '暂不建议上架测试。除非售价、采购价、物流成本或广告假设明显改善，否则不要进入实测。' + preference;
  }

  if (type === 'warning') {
    return '谨慎上架测试：只适合一件代发低风险验证，重点看曝光、点击、加购、订单和退货信号。' + preference;
  }

  if (Number.isFinite(profitSnapshot.profitRate) && profitSnapshot.profitRate >= 30) {
    return '建议上架测试：用一件代发方式验证真实前台信号，避免在没有数据前扩大广告或运营投入。' + preference;
  }

  return '建议低风险上架测试：先确认点击、加购、订单、退货和广告消耗。' + preference;
}

function buildMinimumPriceFloorText(profitSnapshot) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    return '等待有效售价和成本快照。补齐利润计算器后，页面会给出当前口径下的保本参考价。';
  }

  if (!Number.isFinite(profitSnapshot.sale) || !Number.isFinite(profitSnapshot.profit)) {
    return '当前售价或利润无效，暂时无法给出最低售价底线。';
  }

  const breakEvenPrice = profitSnapshot.sale - profitSnapshot.profit;
  if (!Number.isFinite(breakEvenPrice) || breakEvenPrice <= 0) {
    return '当前成本快照不足以估算保本线。改价前请回到利润计算器重新测算目标售价。';
  }

  const rubRate = Number.isFinite(profitSnapshot.saleRub) && profitSnapshot.sale > 0
    ? profitSnapshot.saleRub / profitSnapshot.sale
    : null;
  const rubText = Number.isFinite(rubRate) ? `（约 ${rub(breakEvenPrice * rubRate)}）` : '';

  return `按当前一次利润快照，售价低于约 ${yuan(breakEvenPrice)}${rubText} 会接近无利润。实际改价前请把目标售价重新输入利润计算器复核。`;
}

function buildMainRiskText(type, profitSnapshot, manualProduct, assumptions, hasCategory, source) {
  const input = normalizeManualTestingAssumptions(assumptions);
  const risks = [];
  const sourceCost = getAnalysisSourceCostContext(manualProduct, source);

  if (!manualProduct.title) risks.push('商品标题未补齐，无法判断具体规格和卖点');
  if (sourceCost.missing) risks.push(SOURCE_COST_CONFIRMATION_NOTICE);
  if (sourceCost.isCandidate) risks.push('公开页面价格只是候选采购成本，需确认起批价、规格价、运费和真实拿货成本');
  if (!hasCategory) risks.push('类目或产品类型未补齐，上架类目和佣金口径需人工复核');
  if (source && source.priceRole === 'market_reference_price') risks.push('当前链接价格是平台销售参考价，不能当作采购成本');
  if (!source || !source.shippingFee || source.shippingFee.value === null) risks.push('运费未能自动识别，请后续确认');
  if (!source || !source.material || !source.material.value) risks.push('材质未能自动识别，退货和差评风险需要人工复核');

  if (type === 'risk') {
    risks.push('利润率偏低，暂不适合广告放量或扩大运营投入');
  } else if (type === 'warning') {
    risks.push('利润率处于谨慎区间，广告、退货或汇率波动可能压缩利润');
  }

  risks.push(buildLogisticsRiskText(profitSnapshot));

  if (input.adShare !== null && input.adShare >= 15) {
    risks.push(`广告占比手动预估为 ${percent(input.adShare)}，需要重点控制投放预算`);
  } else if (input.adShare === null) {
    risks.push('广告占比未填写，实测时要单独记录广告花费');
  }

  return uniqueList(risks, 5).join('；') + '。';
}

function buildDataBoundaryText(ozon, assumptions) {
  const hasOzonData = ozon && ozon.status === 'connected';
  const products = hasOzonData && Array.isArray(ozon.products) ? ozon.products : [];
  const sampleText = products.length
    ? ' 可选店铺样本：' + products
      .map(item => `${item.offer_id || item.product_id || '未命名'}${item.name ? ' / ' + item.name : ''}`)
      .join('；') + '。'
    : '';
  const ozonText = hasOzonData
    ? 'Ozon 店铺商品摘要已连接；它只是你店铺的可选样本上下文，不代表全平台竞品、曝光、点击、转化、广告、订单或财务同步。' + sampleText
    : OZON_STORE_CONTEXT_WARNING;

  return `${ozonText} ${buildManualAssumptionText(assumptions)} 如果配置了 Worker，来源链接只会尝试读取公开页面返回的商品标题、图片、类目建议和可见价格线索；价格必须按候选采购价或平台销售参考价人工确认，不读取库存、SKU、规格、评论、销量、隐藏数据或登录后数据，也不会调用外部商品解析 API。`;
}

function buildSourcePriceRoleText(source) {
  if (!source || source.price === null || source.price === undefined || source.price === '') {
    return '未能自动识别价格，请手动确认或补充。';
  }

  const price = Number(source.price);
  const priceText = Number.isFinite(price) ? price.toFixed(2) : String(source.price);
  const display = `${source.currency || '未识别币种'} ${priceText}`;

  if (source.priceRole === 'candidate_source_cost') {
    return `公开页面价格 ${display} 被标记为候选采购价，请确认是否为真实拿货成本。`;
  }

  if (source.priceRole === 'market_reference_price') {
    return `公开页面价格 ${display} 被标记为平台销售参考价，不等于你的采购成本。`;
  }

  return `公开页面价格 ${display} 的用途未知，请人工确认。`;
}

function buildNextActionList(type, profitSnapshot, manualProduct, assumptions, hasCategory, source) {
  const input = normalizeManualTestingAssumptions(assumptions);
  const actions = [];
  const sourceCost = getAnalysisSourceCostContext(manualProduct, source);

  if (!manualProduct.title || sourceCost.missing || !hasCategory) {
    actions.push('先补齐缺失的标题、真实采购成本或类目信息，再复核一次利润快照。');
  }

  if (sourceCost.isCandidate) {
    actions.push('确认候选采购价是否包含起批、规格差价和运费，不要直接按页面最低价做成本判断。');
  }

  if (type === 'risk') {
    actions.push('暂不建议上架测试，先把售价、采购价、物流成本或广告假设调整到可接受区间。');
  } else if (type === 'warning') {
    actions.push('如要测试，只用一件代发低风险上架，验证有无曝光、点击、加购和订单信号。');
  } else if (type === 'test' && profitSnapshot && Number.isFinite(profitSnapshot.profitRate) && profitSnapshot.profitRate >= 30) {
    actions.push('可上架测试，但先观察真实转化，不要在没有信号前放大广告或运营投入。');
  } else if (type === 'test') {
    actions.push('可低风险上架测试，观察转化后再决定是否继续优化或暂停。');
  }

  actions.push('测试期人工记录点击、加购、订单、退货和广告花费。');
  actions.push('验证前保持一件代发低风险模式，尤其是重货、易损或规格复杂商品。');

  if (input.competitorAvgPrice !== null) {
    actions.push(`用手动记录的竞品均价 ${rub(input.competitorAvgPrice)} 对照当前售价，避免明显脱离价格带。`);
  }

  return uniqueList(actions, 5);
}

function valueLabel(value, labels) {
  return labels[value] || '未判断';
}

function countValues(input, values) {
  return values.reduce((count, value) => count + (input === value ? 1 : 0), 0);
}

function getProductCardWeaknesses(product, assumptions, hasCategory) {
  const weak = [];

  if (!product.title) weak.push('标题缺失，搜索和点击判断不足');
  if (assumptions.titleClarity === 'weak') weak.push('标题不清晰');
  if (assumptions.mainImageQuality === 'weak') weak.push('主图吸引力弱');
  if (assumptions.sellingPointClarity === 'weak' && !product.sellingPoint) weak.push('卖点不清晰');
  if (!hasCategory || assumptions.categoryFit === 'weak') weak.push('类目匹配需要复核');
  if (!product.material && assumptions.returnRiskLevel !== 'low') weak.push('材质不清晰，容易带来退货或差评');
  if (assumptions.specComplexity === 'high') weak.push('规格复杂，买家理解和售后风险偏高');
  if (assumptions.visualDifferentiation === 'weak') weak.push('同质化明显，主图和卖点需要差异化');
  if (assumptions.reviewTrustLevel === 'high') weak.push('评价信任风险偏高');

  return uniqueList(weak, 6);
}

function getProductCardStrengths(product, assumptions) {
  const strengths = [];

  if (product.title && assumptions.titleClarity !== 'weak') strengths.push('标题具备基础表达');
  if (assumptions.mainImageQuality === 'strong') strengths.push('主图有点击吸引力');
  if (product.sellingPoint || assumptions.sellingPointClarity === 'strong') strengths.push('卖点较明确');
  if (product.material) strengths.push('材质信息较清楚');
  if (product.usageScene) strengths.push('使用场景明确');
  if (assumptions.visualDifferentiation === 'strong') strengths.push('视觉差异化较好');

  return uniqueList(strengths, 5);
}

function getPriceCompetitivenessText(profitSnapshot, assumptions) {
  if (!profitSnapshot || !profitSnapshot.mainInputValid || !Number.isFinite(profitSnapshot.saleRub)) {
    return '目标售价或汇率缺失，不能判断价格竞争力。先补目标售价、汇率和平台测算，再把当前售价放进竞品价格带比较。';
  }

  const min = assumptions.competitorMinPrice;
  const max = assumptions.competitorMaxPrice;
  const avg = assumptions.competitorAvgPrice;
  const saleRub = profitSnapshot.saleRub;
  const parts = [`当前售价约 ${rub(saleRub)}`];

  if (avg !== null) {
    const ratio = saleRub / avg;
    parts.push(`竞品均价约 ${rub(avg)}`);
    if (ratio >= 1.25) parts.push('当前售价明显高于竞品均价，先调低目标售价，或把主图第一屏、材质说明和差异化卖点做到比竞品更清楚');
    else if (ratio <= 0.85) parts.push('当前售价低于竞品均价，先回利润计算器确认低价后仍能覆盖广告、物流和退货波动');
    else parts.push('价格落在可比较区间，下一步优先用主图、标题关键词和评价信任提高点击与加购');
  } else if (min !== null && max !== null) {
    parts.push(`竞品价格带约 ${rub(min)} - ${rub(max)}`);
    if (saleRub > max) parts.push('当前售价高于观察到的竞品高位，先调整价格，或在标题和主图中明确更高价的材质、规格或套装理由');
    else if (saleRub < min) parts.push('当前售价低于观察到的竞品低位，先确认利润安全，不要用亏利润的低价换点击');
    else parts.push('当前售价落在观察到的竞品价格带内，上架后看有曝光无点击时优先改主图和标题');
  } else {
    parts.push('未填写竞品价格带。先人工记录 3 个相似卡片的最低价、最高价和主卖规格，再决定是否调价');
  }

  return parts.join('；') + '。';
}

function getReviewRiskText(assumptions) {
  const parts = [];

  if (assumptions.topCompetitorReviews !== null) {
    parts.push(`可见评论数约 ${assumptions.topCompetitorReviews}`);
    if (assumptions.topCompetitorReviews >= 1000) parts.push('头部评价壁垒偏高，新卡片不要用高广告消耗硬推，先用更清楚主图、价格和材质说明降低信任门槛');
    else if (assumptions.topCompetitorReviews <= 50) parts.push('评价壁垒较低，上架后优先看点击到加购是否顺畅，并记录早期差评关键词');
  } else {
    parts.push('未填写可见评论数。先补头部竞品评论量和差评关键词，否则不要把评价信任当作优势');
  }

  if (assumptions.positiveReviewSignals) parts.push(`好评信号：${formatManualNotes(assumptions.positiveReviewSignals)}`);
  if (assumptions.negativeReviewSignals) parts.push(`差评痛点：${formatManualNotes(assumptions.negativeReviewSignals)}`);
  if (assumptions.reviewTrustLevel === 'high') parts.push('你标记的评价信任风险较高');

  return parts.join('；') + '。';
}

function getDecisionFromWorkspace(type, product, assumptions, cardWeaknesses, profitSnapshot, sourceCost) {
  if (!product.title || !product.category) return { type: 'warning', status: '优化后再测' };
  if (sourceCost.missing && (!profitSnapshot || !Number.isFinite(profitSnapshot.purchaseCost) || profitSnapshot.purchaseCost <= 0)) {
    return { type: 'risk', status: '暂不建议测试' };
  }
  if (type === 'risk') return { type: 'risk', status: '暂不建议测试' };
  if (cardWeaknesses.length >= 3 || assumptions.mainImageQuality === 'weak' || assumptions.sellingPointClarity === 'weak') {
    return { type: 'warning', status: '优化后再测' };
  }
  if (type === 'warning' || assumptions.marketCrowding === 'crowded' || assumptions.returnRiskLevel === 'high' || assumptions.reviewTrustLevel === 'high') {
    return { type: 'warning', status: '谨慎测试' };
  }
  return { type: 'test', status: '建议上架测试' };
}

function buildObservationActions(decision, profitSnapshot, product, assumptions, cardWeaknesses) {
  const actions = [];

  actions.push('上架后逐项记录曝光、点击、加购、收藏、订单、退货原因和差评关键词。');
  actions.push('继续条件：有曝光、有点击、有加购或订单，且当前利润率仍能覆盖广告、物流和退货波动。');
  actions.push('优化条件：有曝光但点击弱时改主图和标题；有点击无订单时检查价格、评价、物流时效和主图信任感。');
  actions.push('暂停条件：广告消耗快速吃掉利润、退货/差评集中在材质尺码质量，或竞品价格压到当前保本线附近。');

  if (decision.status === '优化后再测' && cardWeaknesses.length) {
    actions.unshift(`上架前优先处理：${cardWeaknesses.slice(0, 3).join('、')}；对应改标题、改主图、补材质和规格说明。`);
  }

  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    actions.unshift('先补齐利润计算器售价、重量、成本和物流匹配；未补齐前不要输出利润安全结论。');
  }

  if (!product.sourceCost && (!profitSnapshot || !Number.isFinite(profitSnapshot.purchaseCost) || profitSnapshot.purchaseCost <= 0)) {
    actions.unshift('先确认真实采购成本；缺少来源成本时不要做利润安全结论。');
  }

  if (assumptions.negativeReviewSignals) {
    actions.push('详情页提前解释差评痛点，尤其是材质、尺寸、气味、易损和安装限制。');
  }

  return uniqueList(actions, 6);
}

function getEvidencePriceRange(evidence) {
  const prices = evidence && Array.isArray(evidence.competitorPrices) ? evidence.competitorPrices : [];
  const range = prices.find(item => item.type === 'range');
  if (range) return { min: range.min, max: range.max };

  const singles = prices
    .filter(item => item.type === 'single' && Number.isFinite(item.value))
    .map(item => item.value);

  if (!singles.length) return null;
  return { min: Math.min(...singles), max: Math.max(...singles) };
}

function getComparableCompetitorRange(assumptions, evidence) {
  if (assumptions.competitorMinPrice !== null && assumptions.competitorMaxPrice !== null) {
    return {
      min: Math.min(assumptions.competitorMinPrice, assumptions.competitorMaxPrice),
      max: Math.max(assumptions.competitorMinPrice, assumptions.competitorMaxPrice),
      source: '结构化竞品价格'
    };
  }

  if (assumptions.competitorAvgPrice !== null) {
    return {
      min: assumptions.competitorAvgPrice,
      max: assumptions.competitorAvgPrice,
      source: '结构化竞品均价'
    };
  }

  const evidenceRange = getEvidencePriceRange(evidence);
  if (evidenceRange) return { ...evidenceRange, source: '证据包价格线索' };

  return null;
}

function buildScoreDiagnosis(context) {
  const product = context.product;
  const assumptions = context.assumptions;
  const evidence = context.evidence || parseEvidencePack('');
  const profitSnapshot = context.profitSnapshot;
  const cardWeaknesses = context.cardWeaknesses || [];
  const hasProfitDecisionData = context.hasProfitDecisionData;
  const hasCompleteProfitSnapshot = context.hasCompleteProfitSnapshot;
  const competitorRange = getComparableCompetitorRange(assumptions, evidence);
  const saleRub = hasCompleteProfitSnapshot && Number.isFinite(profitSnapshot.saleRub) ? profitSnapshot.saleRub : null;

  let profitScore = 0;
  let profitReason = '利润数据不足，本次不输出利润安全结论。先补来源成本和目标售价；未补齐前只做商品卡片观察，不判断广告、退货或物流容错。';
  if (hasProfitDecisionData && hasCompleteProfitSnapshot && Number.isFinite(profitSnapshot.profitRate)) {
    profitScore = 45 + profitSnapshot.profitRate;
    if (profitSnapshot.profitRate >= 30) profitReason = `利润率约 ${percent(profitSnapshot.profitRate)}，可以承受一定广告、退货和物流波动；上架后仍要记录广告消耗和退货原因，不要在没有订单信号前放大投入。`;
    else if (profitSnapshot.profitRate >= 20) profitReason = `利润率约 ${percent(profitSnapshot.profitRate)}，可以测试但容错不宽；先设广告消耗上限，若有点击无订单，优先检查价格、评价、物流时效和主图信任感。`;
    else if (profitSnapshot.profitRate >= 10) profitReason = `利润率约 ${percent(profitSnapshot.profitRate)}，广告、退货或物流稍高就会压缩利润；先调低采购成本、提高目标售价或复核重量后再测试。`;
    else profitReason = `利润率约 ${percent(profitSnapshot.profitRate)}，当前利润承受不了广告和退货波动；先调整价格、采购价或物流条件，不要直接开高广告消耗。`;
  } else if (hasProfitDecisionData) {
    profitScore = 45;
    profitReason = '来源成本和目标售价已填写，但利润计算器快照不完整。先补售价、采购价、重量、汇率和平台测算，再输出保本线和利润安全判断。';
  }

  let priceScore = 58;
  let priceReason = '未提供可比较竞品价格。先记录 3 个相似商品的低价、高价、主卖规格和主图卖点，再决定是否调整目标售价。';
  if (competitorRange && saleRub !== null) {
    if (saleRub > competitorRange.max * 1.12) {
      priceScore = 42;
      priceReason = `当前售价约 ${rub(saleRub)}，高于${competitorRange.source}上沿 ${rub(competitorRange.max)}；先调整价格，或在主图和标题里明确容量、材质、套装或使用场景差异。`;
    } else if (saleRub < competitorRange.min * 0.9) {
      priceScore = 70;
      priceReason = `当前售价约 ${rub(saleRub)}，低于${competitorRange.source}下沿 ${rub(competitorRange.min)}；先确认利润安全，不要用低价换来无法覆盖广告和退货的订单。`;
    } else {
      priceScore = 64;
      priceReason = `当前售价约 ${rub(saleRub)}，落在${competitorRange.source} ${rub(competitorRange.min)} - ${rub(competitorRange.max)} 内；价格不是主要阻碍，优先改主图、标题关键词和信任说明。`;
    }
  } else if (competitorRange) {
    priceScore = 55;
    priceReason = `${competitorRange.source}约 ${rub(competitorRange.min)} - ${rub(competitorRange.max)}，但缺少可换算目标售价。先补目标售价和汇率，再判断要调价还是强化差异化卖点。`;
  }
  if (assumptions.marketCrowding === 'crowded') priceScore -= 10;
  if (assumptions.marketCrowding === 'gap') priceScore += 8;

  let cardScore = 58;
  if (product.title) cardScore += 8;
  if (product.category) cardScore += 6;
  if (product.material) cardScore += 6;
  if (product.usageScene) cardScore += 6;
  if (product.sellingPoint) cardScore += 8;
  cardScore -= cardWeaknesses.length * 8;
  if (assumptions.titleClarity === 'strong') cardScore += 6;
  if (assumptions.mainImageQuality === 'strong') cardScore += 8;
  if (assumptions.sellingPointClarity === 'strong') cardScore += 6;
  if (assumptions.mainImageQuality === 'weak') cardScore -= 12;
  const cardReason = cardWeaknesses.length
    ? `主要短板：${cardWeaknesses.slice(0, 3).join('、')}。先改标题关键词和主图第一视觉，再补材质、规格和使用场景说明。`
    : '标题、类目、材质、场景或卖点已有基础信息。下一步检查主图第一屏是否能直接说明用途、材质和差异点。';

  let trustScore = 60;
  if (assumptions.topCompetitorReviews !== null && assumptions.topCompetitorReviews >= 1000) trustScore -= 12;
  if (assumptions.topCompetitorReviews !== null && assumptions.topCompetitorReviews <= 50) trustScore += 6;
  if (assumptions.positiveReviewSignals || evidence.reviewTrustSignals.length) trustScore += 6;
  if (assumptions.negativeReviewSignals || evidence.negativeReviewRisks.length) trustScore -= 12;
  if (assumptions.reviewTrustLevel === 'high') trustScore -= 14;
  if (assumptions.reviewTrustLevel === 'low') trustScore += 6;
  const trustReason = assumptions.negativeReviewSignals || evidence.negativeReviewRisks.length
    ? `已看到差评或担心点：${formatList([assumptions.negativeReviewSignals].concat(evidence.negativeReviewRisks), '未提供差评文本')}。上架前把这些点写进详情页解释，评价少时避免高广告消耗。`
    : assumptions.topCompetitorReviews !== null
      ? `可见评论数约 ${assumptions.topCompetitorReviews}。若竞品评价多，新卡片要用更清楚的价格、主图、材质和售后承诺降低信任差距。`
      : '未提供评论数量或评价内容。先补竞品评论量、好评关键词和差评关键词，再判断是否能承受转化信任压力。';

  let logisticsScore = 68;
  if (product.estimatedWeight !== null && product.estimatedWeight >= 1000) logisticsScore -= 14;
  if (product.estimatedWeight !== null && product.estimatedWeight <= 300) logisticsScore += 5;
  if (assumptions.specComplexity === 'high') logisticsScore -= 10;
  if (assumptions.returnRiskLevel === 'high') logisticsScore -= 18;
  if (assumptions.returnRiskLevel === 'low') logisticsScore += 6;
  if (evidence.returnRiskHints.length) logisticsScore -= 10;
  if (evidence.logisticsRiskHints.length) logisticsScore -= 8;
  if (product.material) logisticsScore += 4;
  const logisticsReason = evidence.returnRiskHints.length || evidence.logisticsRiskHints.length
    ? `证据包提到：${formatList(evidence.returnRiskHints.concat(evidence.logisticsRiskHints), '未提供物流或退货风险文本')}。上架前补材质、尺寸、包装和物流时效说明，重货先复核物流成本是否吃掉利润。`
    : product.estimatedWeight !== null
      ? `卖家估重 ${product.estimatedWeight}g。上架前用利润计算器复核重量和物流费，详情页写清材质、尺寸和适用场景来减少退货。`
      : '未提供重量、尺寸或退货痛点。先补重量、材质、尺寸和包装信息，否则不要把物流与退货风险当作低风险。';

  let platformScore = 58;
  if (product.targetPlatform) platformScore += 8;
  if (product.category) platformScore += 8;
  if (product.usageScene) platformScore += 6;
  if (assumptions.categoryFit === 'strong') platformScore += 8;
  if (assumptions.categoryFit === 'weak') platformScore -= 14;
  if (assumptions.marketCrowding === 'crowded') platformScore -= 8;
  if (assumptions.marketCrowding === 'gap') platformScore += 8;
  const platformReason = `目标平台 ${product.targetPlatform || '未选择'}；${product.category ? `类目方向 ${product.category}` : '类目未确认'}；${product.usageScene ? `使用场景 ${product.usageScene}` : '使用场景未明确'}。上架前确认类目、标题关键词和主图场景一致，避免引来不匹配点击。`;

  const scores = [
    { label: '利润安全评分', score: clampScore(profitScore), reason: profitReason },
    { label: '价格竞争力评分', score: clampScore(priceScore), reason: priceReason },
    { label: '产品卡片质量评分', score: clampScore(cardScore), reason: cardReason },
    { label: '评价与信任评分', score: clampScore(trustScore), reason: trustReason },
    { label: '物流与退货风险评分', score: clampScore(logisticsScore), reason: logisticsReason },
    { label: '平台匹配度评分', score: clampScore(platformScore), reason: platformReason }
  ];
  const scorableScores = hasProfitDecisionData ? scores : scores.filter(item => item.label !== '利润安全评分');
  const average = scorableScores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, scorableScores.length);
  let status = '谨慎测试';
  let type = 'warning';

  if (!hasProfitDecisionData) {
    status = '商品卡片观察报告';
    type = 'warning';
  } else if (scores[0].score < 45 || cardScore < 45 || logisticsScore < 40) {
    status = '暂不建议测试';
    type = 'risk';
  } else if (average >= 75 && cardWeaknesses.length <= 1) {
    status = '建议上架测试';
    type = 'test';
  } else if (average >= 62) {
    status = '谨慎测试';
    type = 'warning';
  } else {
    status = '优化后再测';
    type = 'warning';
  }

  return { scores, average: clampScore(average), decision: { type, status } };
}

function buildEvidenceSummaryRows(evidence) {
  if (!evidence || !evidence.rawText) {
    return [
      { label: '证据包结构化结果', text: '未粘贴商品证据包；本次只使用结构化字段、公开观察和利润测算。' },
      { label: '证据可信度', text: '未提供自然语言证据，相关信号按缺失处理。' }
    ];
  }

  return [
    { label: '证据包结构化结果', text: `标题线索：${evidence.title || '未提供'}；类目线索：${formatList(evidence.categoryHints, '未提供')}；材质线索：${formatList(evidence.materials, '未提供')}；场景线索：${formatList(evidence.usageScenes, '未提供')}。` },
    { label: '竞品与评价线索', text: `竞品价格：${evidence.competitorPrices.length ? evidence.competitorPrices.map(item => item.type === 'range' ? `${rub(item.min)} - ${rub(item.max)}` : rub(item.value)).join('、') : '未提供'}；评价/信任：${formatList(evidence.reviewTrustSignals, '未提供')}。` },
    { label: '担心点与风险线索', text: `差评/退货/物流/疑问：${formatList(evidence.negativeReviewRisks.concat(evidence.returnRiskHints, evidence.logisticsRiskHints, evidence.concerns), '未提供')}。` }
  ];
}

function buildPositioningText(product, analysis, evidence) {
  return [
    `目标平台：${analysis.targetPlatform || product.targetPlatform || '未选择'}`,
    product.sourcePlatform ? `来源平台：${product.sourcePlatform}` : '来源平台未确认',
    product.category ? `类目/类型：${product.category}` : evidence.categoryHints.length ? `类目线索：${evidence.categoryHints.join('、')}` : '类目/类型未提供',
    product.usageScene ? `使用场景：${product.usageScene}` : evidence.usageScenes.length ? `场景线索：${evidence.usageScenes.join('、')}` : '使用场景未提供'
  ].join('；') + '。';
}

function buildSellingPointsText(product, evidence, cardStrengths) {
  const points = uniqueList([product.sellingPoint].concat(evidence.sellingPoints, cardStrengths), 6);
  return points.length
    ? `当前可用卖点：${points.join('、')}。改标题时把核心材质、容量/规格和使用场景前置；改主图时让买家第一眼看到用途和差异点。`
    : '未提供明确卖点。先写出一个可放进标题和主图的卖点：容量、材质、使用场景、解决的痛点或与竞品不同的规格。';
}

function buildCardProblemText(product, cardWeaknesses, assumptions, evidence) {
  const problems = cardWeaknesses.slice();
  if (!evidence.rawText) problems.push('证据包缺失，报告无法结构化竞品和评价线索');
  if (assumptions.competitorCardQuality === 'strong') problems.push('头部竞品卡片专业，新卡片需要更清晰主图和差异化卖点');
  if (!product.sellingPoint && !evidence.sellingPoints.length) problems.push('缺少可直接写进标题或主图的卖点');

  return uniqueList(problems, 6).length
    ? `上架前先处理：${uniqueList(problems, 6).join('、')}。动作顺序：先改主图第一视觉，再改标题关键词，最后补材质、规格、尺寸和使用场景说明。`
    : '标题、类目、材质、场景和卖点已有基础信息。上架前仍要检查主图第一视觉、规格表达、材质说明和详情页承诺是否一致。';
}

function buildReviewTrustDiagnosisText(assumptions, evidence) {
  const parts = [];

  if (assumptions.topCompetitorReviews !== null) parts.push(`头部可见评论数约 ${assumptions.topCompetitorReviews}`);
  if (assumptions.positiveReviewSignals) parts.push(`好评信号：${formatManualNotes(assumptions.positiveReviewSignals)}`);
  if (assumptions.negativeReviewSignals) parts.push(`差评痛点：${formatManualNotes(assumptions.negativeReviewSignals)}`);
  if (evidence.reviewTrustSignals.length) parts.push(`证据包评价线索：${evidence.reviewTrustSignals.join('、')}`);
  if (evidence.negativeReviewRisks.length) parts.push(`证据包差评/担心点：${evidence.negativeReviewRisks.slice(0, 4).join('、')}`);

  return parts.length
    ? parts.join('；') + '。评价少时，不要依赖高广告消耗放量；先用清晰主图、材质说明、价格和售后承诺降低信任门槛。'
    : '未提供评论数量、好评或差评文本。先补头部竞品评论量和差评关键词；上架后单独记录评价关键词和退货原因。';
}

function buildLogisticsReturnDiagnosisText(profitSnapshot, product, assumptions, evidence) {
  const parts = [buildLogisticsRiskText(profitSnapshot)];

  if (product.estimatedWeight !== null) parts.push(`卖家估重 ${product.estimatedWeight}g`);
  if (product.material) parts.push(`材质：${product.material}`);
  if (assumptions.returnRiskLevel) parts.push(`你标记的退货风险：${valueLabel(assumptions.returnRiskLevel, { low: '低', medium: '中', high: '高' })}`);
  if (evidence.returnRiskHints.length) parts.push(`退货线索：${evidence.returnRiskHints.slice(0, 4).join('、')}`);
  if (evidence.logisticsRiskHints.length) parts.push(`物流线索：${evidence.logisticsRiskHints.slice(0, 4).join('、')}`);
  parts.push('材质不清时，详情页必须补材质、尺寸和适用限制；重量偏高时，先复核物流成本是否吃掉利润，再决定是否上架测试。');

  return parts.join('；') + '。';
}

function buildOzonAutoReport(analysis, profitSnapshot) {
  const source = analysis.source || {};
  const ozon = analysis.ozon || {};
  const insights = analysis.insights || {};
  const manualProduct = normalizeManualProduct(analysis.manualProduct);
  const manualAssumptions = normalizeManualTestingAssumptions(analysis.manualAssumptions);
  const evidence = analysis.evidencePack || parseEvidencePack(manualProduct.evidencePack);
  const hasCompleteProfitSnapshot = Boolean(profitSnapshot && profitSnapshot.mainInputValid);
  const hasProfitDecisionData = analysis.profitDecisionDataAvailable === true;
  const type = hasCompleteProfitSnapshot ? getProfitReportType(profitSnapshot) : 'warning';
  const displayTitle = manualProduct.title || evidence.title || source.title || '';
  const displayCategory = manualProduct.category || insights.category || evidence.categoryHints[0] || '';
  const hasTitle = !isBlank(displayTitle);
  const hasCategory = !isBlank(displayCategory);
  const effectiveProduct = {
    ...manualProduct,
    title: displayTitle,
    category: displayCategory,
    material: manualProduct.material || (source.material && source.material.value) || evidence.materials[0] || '',
    usageScene: manualProduct.usageScene || (source.usage && source.usage.value) || (source.scene && source.scene.value) || evidence.usageScenes[0] || '',
    sellingPoint: manualProduct.sellingPoint || evidence.sellingPoints[0] || (Array.isArray(insights.sellingPoints) ? insights.sellingPoints[0] : '') || ''
  };
  const sourceCost = getAnalysisSourceCostContext(manualProduct, source);
  const cardWeaknesses = getProductCardWeaknesses(effectiveProduct, manualAssumptions, hasCategory);
  const cardStrengths = getProductCardStrengths(effectiveProduct, manualAssumptions);
  const scoreDiagnosis = buildScoreDiagnosis({
    product: effectiveProduct,
    assumptions: manualAssumptions,
    evidence,
    profitSnapshot,
    cardWeaknesses,
    hasProfitDecisionData,
    hasCompleteProfitSnapshot
  });
  const baseDecision = hasProfitDecisionData
    ? getDecisionFromWorkspace(type, effectiveProduct, manualAssumptions, cardWeaknesses, profitSnapshot, sourceCost)
    : { type: 'warning', status: '商品卡片观察报告' };
  const decision = hasProfitDecisionData
    ? scoreDiagnosis.decision
    : baseDecision;
  const status = decision.status;
  const sourceHost = source.host || normalizeHost(source.url);
  const marketplaceNotice = getOzonMarketplaceLinkNotice(source.url);
  const titleText = hasTitle ? `商品：${displayTitle}。` : '';
  const categoryText = hasCategory ? `类目/类型：${displayCategory}。` : '';
  const sourceText = sourceHost && source.url ? `来源链接辅助：${sourceHost}。` : '未使用来源链接也可以生成判断。';
  const backendText = ozon && ozon.status === 'connected'
    ? '已提供可选店铺样本上下文。'
    : '后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。';
  const summary = hasProfitDecisionData
    ? `${status}：${buildDecisionConclusionText(decision.type, profitSnapshot, hasTitle)} 关键评分均值约 ${scoreDiagnosis.average} / 100。${titleText}${categoryText}${sourceText}${marketplaceNotice}`.trim()
    : `商品卡片观察报告：利润数据不足，本次不输出利润安全结论。${titleText}${categoryText}${sourceText}${marketplaceNotice}`.trim();
  const positioningText = buildPositioningText(effectiveProduct, analysis, evidence);
  const sellingPointsText = buildSellingPointsText(effectiveProduct, evidence, cardStrengths);
  const cardProblemsText = buildCardProblemText(effectiveProduct, cardWeaknesses, manualAssumptions, evidence);
  const priceReviewText = hasProfitDecisionData && hasCompleteProfitSnapshot
    ? `${getPriceCompetitivenessText(profitSnapshot, manualAssumptions)} ${getReviewRiskText(manualAssumptions)}`
    : hasProfitDecisionData
      ? `已填写目标售价 ${yuan(manualProduct.targetSellingPrice)}；先补汇率、物流和平台费用快照，再把售价换算到竞品价格带内判断是否需要调价。 ${getReviewRiskText(manualAssumptions)}`
      : `利润数据不足，本次不输出利润安全结论。${manualProduct.targetSellingPrice ? `已填写目标售价 ${yuan(manualProduct.targetSellingPrice)}，但仍需要利润计算器快照确认汇率、物流和平台费用。` : '目标售价未形成完整利润快照，本次只检查卡片、竞品和评价线索。'} ${getReviewRiskText(manualAssumptions)}`;
  const reviewRiskText = buildReviewTrustDiagnosisText(manualAssumptions, evidence);
  const profitRiskText = hasProfitDecisionData
    ? `${buildProfitSafetyText(decision.type, profitSnapshot, manualProduct, source)} ${buildMinimumPriceFloorText(profitSnapshot)}`
    : `利润数据不足，本次不输出利润安全结论。请先填写来源成本和目标售价。${manualProduct.estimatedWeight ? `卖家估重 ${manualProduct.estimatedWeight}g；物流风险仍需利润计算器复核。` : '如利润计算器毛重缺失，物流风险无法完整判断。'}`;
  const logisticsReturnText = buildLogisticsReturnDiagnosisText(profitSnapshot, effectiveProduct, manualAssumptions, evidence);
  const dataBoundaryText = `${backendText} ${hasProfitDecisionData ? '' : '利润数据不足，本次不输出利润安全结论。'} ${buildManualAssumptionText(manualAssumptions)} 链接提取只是辅助预填，失败不代表工作流失败；不读取库存、SKU、评论明细、销量、隐藏数据或登录后数据，也不调用外部商品解析 API。${source.price ? ' ' + buildSourcePriceRoleText(source) : ''}`;
  const actions = buildObservationActions(decision, profitSnapshot, effectiveProduct, manualAssumptions, cardWeaknesses);

  if (!hasProfitDecisionData) {
    actions.unshift('补齐 AI 页面来源成本和目标售价，再到利润计算器复核售价、采购价、重量和平台测算。');
  } else if (!hasCompleteProfitSnapshot) {
    actions.unshift('已进入测品决策报告；继续补齐利润计算器快照，用于复核物流、佣金、利润率和保本价。');
  }
  actions.unshift('改标题：把容量、材质、使用场景或解决的具体问题放在标题前半段。');
  actions.unshift('改主图：第一屏直接展示用途、尺寸/容量、核心材质和与竞品不同的点。');
  if (cardWeaknesses.length) actions.unshift(`上架前先处理：${cardWeaknesses.slice(0, 3).join('、')}。`);
  const actionCompetitorRange = getComparableCompetitorRange(manualAssumptions, evidence);
  const actionSaleRub = hasCompleteProfitSnapshot && Number.isFinite(profitSnapshot.saleRub) ? profitSnapshot.saleRub : null;
  if (actionCompetitorRange && actionSaleRub !== null && actionSaleRub > actionCompetitorRange.max * 1.12) {
    actions.unshift(`调整价格：当前售价约 ${rub(actionSaleRub)} 高于竞品上沿 ${rub(actionCompetitorRange.max)}，先降价或强化材质/规格差异后再测。`);
  } else if (actionCompetitorRange && actionSaleRub !== null && actionSaleRub < actionCompetitorRange.min * 0.9) {
    actions.push(`低价测试前复核利润：当前售价约 ${rub(actionSaleRub)} 低于竞品下沿 ${rub(actionCompetitorRange.min)}，不要用亏利润价格换点击。`);
  }
  if (manualAssumptions.negativeReviewSignals || evidence.negativeReviewRisks.length) {
    actions.push('强化材质说明：把差评痛点对应的材质、尺寸、气味、易损或安装限制写进详情页。');
  }
  if (manualAssumptions.reviewTrustLevel === 'high' || manualAssumptions.topCompetitorReviews === null || manualAssumptions.topCompetitorReviews >= 1000) {
    actions.push('避免高广告消耗：评价信任不足时，先改主图、价格和详情页承诺，再扩大广告投入。');
  }
  actions.push('有点击无订单时，优先检查价格、评价、物流时效和主图信任感。');

  return {
    type: decision.type,
    status,
    summary,
    scores: scoreDiagnosis.scores,
    evidenceSummary: buildEvidenceSummaryRows(evidence),
    priceText: positioningText,
    profitText: sellingPointsText,
    cardProblemsText,
    competitionText: priceReviewText,
    reviewRiskText,
    adText: profitRiskText,
    logisticsReturnText,
    storeText: dataBoundaryText,
    actions: uniqueList(actions, 8)
  };
}

function buildApiDisconnectedAnalysis(sourceUrl, profitSnapshot, manualProduct) {
  const host = normalizeHost(sourceUrl);
  const marketplaceNotice = getOzonMarketplaceLinkNotice(sourceUrl);

  const analysis = {
    ok: false,
    source: {
      url: sourceUrl,
      finalUrl: sourceUrl,
      host,
      platform: host,
      platformType: 'unknown',
      title: '',
      image: '',
      price: null,
      currency: '',
      priceRole: 'unknown',
      shippingFee: { value: null, currency: '', confidence: 'none', source: '' },
      totalCandidateSourceCost: { value: null, currency: '', confidence: 'none', source: '' },
      categorySuggestion: '',
      material: { value: '', confidence: 'none', source: '' },
      usage: { value: '', confidence: 'none', source: '' },
      scene: { value: '', confidence: 'none', source: '' },
      specifications: [],
      productDetails: [],
      modelDisclosure: ANALYSIS_MODEL_DISCLOSURE_TEXT,
      extractionConfidence: 'none',
      extractionSource: '',
      failureReason: '',
      manualConfirmationNeeded: [],
      confidence: { title: 'none', price: 'none', category: 'none' },
      extractionSources: { title: '', price: '', image: '', category: '' }
    },
    insights: {
      category: '',
      keywords: [],
      tags: [],
      sellingPoints: [],
      painPoints: []
    },
    ozon: {
      status: 'api_not_connected',
      message: 'Store API 未连接。自动读取授权店铺数据需要先配置 Cloudflare Worker 后端。'
    },
    report: {
      type: getProfitReportType(profitSnapshot),
      status: 'Preview / manual',
      summary: `可选链接已接收（${host}）。${marketplaceNotice} 当前模式为产品卡片测品决策工作台：未配置 Worker 时不会从浏览器直接读取商品页或 Ozon 卖家数据。人工曝光、点击、转化参数只用于模拟测品，不代表平台 API 同步。`,
      priceText: `当前售价折合约 ${rub(profitSnapshot && profitSnapshot.saleRub)}。价格带和竞品数据需要授权后端或人工补充，当前不生成实时平台结论。`,
      profitText: buildProfitReportText(profitSnapshot),
      competitionText: 'Store API 尚未连接，当前不会自动读取 Ozon 竞品数量、均价、评分或评论。请先以人工观察和后续授权数据作为输入。',
      adText: '广告判断暂时只基于当前利润测算和人工预估，不代表已同步真实广告、曝光、点击或转化数据。',
      storeText: '商品类目、关键词和主题标签当前处于人工预览状态；后续 Worker 端点可返回经过授权的数据摘要。',
      actions: ['先补齐商品信息和利润测算，再决定是否上架测试。', '人工曝光、点击、转化参数是可选估算，不能当作平台同步数据。', '可选店铺摘要只能通过 Worker 调用官方 Seller API，不要把 API Key 放进前端代码或 localStorage。']
    }
  };

  applyManualProductContext(analysis, manualProduct, sourceUrl);
  analysis.report = buildOzonAutoReport(analysis, profitSnapshot);
  return analysis;
}

function buildWorkerEndpointNotReadyAnalysis(sourceUrl, profitSnapshot, manualProduct) {
  const analysis = buildApiDisconnectedAnalysis(sourceUrl, profitSnapshot, manualProduct);
  analysis.ozon.status = 'endpoint_not_ready';
  analysis.ozon.message = 'Worker 已配置，但未来的 /api/ozon/product-summary 端点尚未可用。';
  analysis.report = buildOzonAutoReport(analysis, profitSnapshot);
  return analysis;
}

function buildDemoOzonAnalysis(profitSnapshot) {
  const analysis = {
    ok: true,
    source: {
      url: 'https://example.com/product/demo',
      finalUrl: 'https://example.com/product/demo',
      host: 'example.com',
      platform: 'Generic ecommerce',
      platformType: 'unknown',
      title: '示例商品：便携收纳包',
      image: '',
      price: null,
      currency: '',
      priceRole: 'unknown',
      categorySuggestion: '家居 / 收纳',
      confidence: { title: 'high', price: 'none', category: 'medium' },
      extractionSources: { title: 'demo data', price: '', image: '', category: 'demo data' }
    },
    insights: {
      category: '家居 / 收纳',
      keywords: ['收纳包', '旅行收纳', '便携整理', 'organizer'],
      tags: ['轻小件', '可测款', '图片影响转化'],
      sellingPoints: ['轻便', '多规格', '适合组合销售'],
      painPoints: ['同质化强', '评价门槛明显', '广告成本需要控制']
    },
    ozon: {
      status: 'missing_credentials',
      message: '示例报告：Ozon API 凭证未配置时，真实后台数据会显示为等待授权。',
      products: [
        { offer_id: 'DEMO-001', product_id: 100001, name: '示例 Ozon 店铺商品 A' },
        { offer_id: 'DEMO-002', product_id: 100002, name: '示例 Ozon 店铺商品 B' }
      ]
    }
  };

  analysis.report = buildOzonAutoReport(analysis, profitSnapshot);
  analysis.report.summary = '这是示例报告，用于确认页面结果形态。真实测品决策可以直接基于商品卡片信息、公开市场观察和利润快照生成；可选店铺摘要需要部署 Worker 并配置 Ozon API 凭证。';
  return analysis;
}

function defaultNormalizedSource(sourceUrl) {
  return {
    url: sourceUrl,
    finalUrl: sourceUrl,
    host: normalizeHost(sourceUrl),
    platform: normalizeHost(sourceUrl),
    platformType: 'unknown',
    title: '',
    image: '',
    description: '',
    canonicalUrl: '',
    price: null,
    currency: '',
    priceRole: 'unknown',
    shippingFee: { value: null, currency: '', confidence: 'none', source: '' },
    totalCandidateSourceCost: { value: null, currency: '', confidence: 'none', source: '' },
    categorySuggestion: '',
    material: { value: '', confidence: 'none', source: '' },
    usage: { value: '', confidence: 'none', source: '' },
    scene: { value: '', confidence: 'none', source: '' },
    specifications: [],
    productDetails: [],
    modelDisclosure: ANALYSIS_MODEL_DISCLOSURE_TEXT,
    extractionConfidence: 'none',
    extractionSource: '',
    failureReason: '',
    manualConfirmationNeeded: [],
    confidence: { title: 'none', price: 'none', category: 'none' },
    extractionSources: { title: '', price: '', image: '', category: '' }
  };
}

async function requestOzonProductAnalysis(payload) {
  const apiBaseUrl = getProductSelectionApiBaseUrl();

  if (!apiBaseUrl) {
    return buildApiDisconnectedAnalysis(payload.sourceUrl, payload.profitSnapshot, payload.manualProduct);
  }

  if ((payload.clientId || payload.apiKey) && typeof validateWorkerUrlForCredentials === 'function') {
    const worker = validateWorkerUrlForCredentials(apiBaseUrl);

    if (worker.error) {
      const analysis = buildApiDisconnectedAnalysis(payload.sourceUrl, payload.profitSnapshot, payload.manualProduct);
      analysis.ozon.status = worker.error;
      analysis.ozon.message = worker.message;
      analysis.report = buildOzonAutoReport(analysis, payload.profitSnapshot);
      return analysis;
    }
  }

  const response = await fetch(apiBaseUrl + '/api/ozon/product-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.status === 404) {
    return buildWorkerEndpointNotReadyAnalysis(payload.sourceUrl, payload.profitSnapshot, payload.manualProduct);
  }

  if (!response.ok) {
    throw new Error('Worker 产品摘要端点返回异常：' + response.status);
  }

  const analysis = await response.json();
  applyManualProductContext(analysis, payload.manualProduct, payload.sourceUrl);
  analysis.report = buildOzonAutoReport(analysis, payload.profitSnapshot);
  return analysis;
}

async function requestSourcePreview(sourceUrl) {
  const apiBaseUrl = getProductSelectionApiBaseUrl();

  if (!apiBaseUrl) {
    return null;
  }

  const response = await fetch(apiBaseUrl + '/api/source/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: sourceUrl })
  });

  const data = await response.json().catch(() => null);

  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      requestedUrl: sourceUrl,
      source: defaultNormalizedSource(sourceUrl),
      message: getSourcePreviewFallbackMessage(),
      limitations: ['source preview 返回了不可读取的响应。']
    };
  }

  if (!data.source) {
    data.source = defaultNormalizedSource(sourceUrl);
  }

  data.source = {
    ...defaultNormalizedSource(sourceUrl),
    ...data.source,
    finalUrl: data.source.finalUrl || data.finalUrl || data.source.url || sourceUrl,
    platformType: data.source.platformType || 'unknown',
    price: data.source.price === undefined ? null : data.source.price,
    currency: data.source.currency || '',
    priceRole: data.source.priceRole || 'unknown',
    shippingFee: data.source.shippingFee || { value: null, currency: '', confidence: 'none', source: '' },
    totalCandidateSourceCost: data.source.totalCandidateSourceCost || { value: null, currency: '', confidence: 'none', source: '' },
    categorySuggestion: data.source.categorySuggestion || '',
    material: data.source.material || { value: '', confidence: 'none', source: '' },
    usage: data.source.usage || { value: '', confidence: 'none', source: '' },
    scene: data.source.scene || { value: '', confidence: 'none', source: '' },
    specifications: Array.isArray(data.source.specifications) ? data.source.specifications : [],
    productDetails: Array.isArray(data.source.productDetails) ? data.source.productDetails : [],
    modelDisclosure: data.source.modelDisclosure || ANALYSIS_MODEL_DISCLOSURE_TEXT,
    extractionConfidence: data.source.extractionConfidence || 'none',
    extractionSource: data.source.extractionSource || '',
    failureReason: data.source.failureReason || '',
    manualConfirmationNeeded: Array.isArray(data.source.manualConfirmationNeeded) ? data.source.manualConfirmationNeeded : [],
    confidence: data.source.confidence || { title: 'none', price: 'none', category: 'none' },
    extractionSources: data.source.extractionSources || { title: '', price: '', image: '', category: '' }
  };

  data.requestedUrl = sourceUrl;

  if (!data.ok && !data.message) {
    data.message = getSourcePreviewFallbackMessage();
  }

  if (!Array.isArray(data.limitations)) {
    data.limitations = [];
  }

  return data;
}

async function requestOzonWorkerHealth() {
  const apiBaseUrl = getProductSelectionApiBaseUrl();

  if (!apiBaseUrl) {
    return {
      ok: false,
      service: 'frontend-only',
      ozon: {
        status: 'api_not_connected',
        message: 'API 服务未连接。部署 Cloudflare Worker 后，请在 js/config.js 配置 PRODUCT_SELECTION_API_BASE_URL。'
      }
    };
  }

  const response = await fetch(apiBaseUrl + '/api/health');

  if (!response.ok) {
    throw new Error('API 健康检查失败：' + response.status);
  }

  return response.json();
}

function analyzeProductSelection(input) {
  const missing = [];

  if (!input.mainInputValid) {
    return buildWaitingSelectionReport([], input.blockingMessage || '请先修正利润测算输入。');
  }

  if (isBlank(input.sourceProductUrl)) missing.push('来源商品链接');
  if (!hasPositiveNumber(input.saleRub)) missing.push('有效售价和汇率');

  if (missing.length) {
    return buildWaitingSelectionReport(missing);
  }

  const actions = [];
  const storeLabel = STORE_TYPE_TEXT[input.storeType] || '未填写';
  const hasCompetitorAvg = hasPositiveNumber(input.competitorAvgPrice);
  const priceRatio = hasCompetitorAvg ? input.saleRub / input.competitorAvgPrice : null;
  const priceHighRisk = priceRatio !== null && priceRatio >= 1.3 && ['new', 'mixed'].includes(input.storeType);
  const priceLow = priceRatio !== null && priceRatio <= 0.85;
  const competitionHigh = input.competitorCount >= 80 || input.topCompetitorReviews >= 1000;
  const strongTopCompetitor = input.topCompetitorRating >= 4.7 && input.topCompetitorReviews >= 500;
  const highAdPressure = Number.isFinite(input.adShare) && input.adShare >= 30;
  const platformMismatch = input.targetPlatform && input.activePlatform && input.targetPlatform !== input.activePlatform;
  let type = 'test';

  let priceText = `当前售价折合约 ${rub(input.saleRub)}。`;
  if (hasCompetitorAvg) {
    priceText += ` 人工观察竞品均价约 ${rub(input.competitorAvgPrice)}。`;
  } else {
    priceText += ' 未填写人工竞品均价，不会因此阻止测品判断。';
  }
  if (priceHighRisk) {
    type = 'warning';
    priceText += ' 当前价明显高于竞品均价，新店或杂货店需要更强图片、评价、广告或差异化卖点支撑。';
    actions.push('先检查主图、标题、评价门槛和竞品卖点，再决定是否提高售价。');
  } else if (priceLow && input.profitRate >= 20) {
    priceText += ' 当前价低于竞品均价，但利润仍有空间；不要只靠低价冲量，需要确认广告和退货波动能否承受。';
    actions.push('可以保留小幅价格优势，但不要把低价当作唯一打法。');
  } else {
    priceText += ' 当前价格没有明显脱离竞品均价，后续应结合评价、图片和广告成本验证。';
  }

  if (hasPositiveNumber(input.competitorMinPrice) && hasPositiveNumber(input.competitorMaxPrice)) {
    priceText += ` 相似竞品价格带约为 ${rub(input.competitorMinPrice)} - ${rub(input.competitorMaxPrice)}。`;
  }

  let profitText = `当前利润率约 ${percent(input.profitRate)}，利润约 ¥${input.profit.toFixed(2)}。`;
  if (input.profit < 0 || (input.profitRate < 10 && highAdPressure)) {
    type = 'risk';
    profitText += ' 在当前利润和广告假设下，不建议直接开广告测试。';
    actions.push('先降低采购、物流或广告假设，或重新测算售价。');
  } else if (input.profitRate < 20) {
    if (type !== 'risk') type = 'warning';
    profitText += ' 利润率只是勉强可测，适合一件代发低风险验证，不适合直接放大投入。';
    actions.push('只做小预算测试，并优先复核采购、物流、广告和退货假设。');
  } else if (input.profitRate < 30) {
    profitText += ' 利润有一定测试空间，但仍需要真实广告和退货数据验证。';
  } else {
    profitText += ' 利润空间较强，但不代表流量、转化和广告成本已经稳定。';
  }

  let competitionText = hasPositiveNumber(input.competitorCount)
    ? `人工观察相似竞品约 ${input.competitorCount} 个。`
    : '未填写人工竞品数量；本次先按商品信息和利润测算判断。';
  if (competitionHigh || strongTopCompetitor) {
    if (type !== 'risk') type = 'warning';
    competitionText += ' 竞争门槛偏高，建议寻找细分类目、差异化卖点或更精准关键词。';
    actions.push('优先找长尾关键词或细分场景，不要直接硬碰头部竞品。');
  } else {
    competitionText += ' 竞争压力暂未显示为极高，但仍需要检查 Top 商品的图片、评价和价格带。';
  }

  if (hasPositiveNumber(input.topCompetitorRating) || hasPositiveNumber(input.topCompetitorReviews)) {
    competitionText += ` Top 竞品评分约 ${input.topCompetitorRating || 0}，评论数约 ${input.topCompetitorReviews || 0}。`;
  }

  let adText = `${input.adType || '手动广告假设'}，${Number.isFinite(input.adShare) ? '预估广告占比 ' + percent(input.adShare) : '广告占比未填写'}。`;
  if (highAdPressure && input.profitRate < 20) {
    if (type !== 'risk') type = 'warning';
    adText += ' 广告占比偏高且利润空间不够，容易把毛利润吃掉。';
    actions.push('先把广告预算控制在小额测试，不要默认 30% 占比长期成立。');
  } else if (highAdPressure) {
    adText += ' 广告会带来流量，但必须用点击、加购、订单和利润一起复盘。';
  } else {
    adText += ' 广告占比相对保守，但仍应记录点击和转化。';
  }

  let storeText = `当前店铺类型为${storeLabel}`;
  if (platformMismatch) {
    if (type !== 'risk') type = 'warning';
    storeText = `目标平台是 ${input.targetPlatform}，但当前利润测算平台是 ${input.activePlatform}。` + storeText;
    actions.push('确认上方平台与选品目标平台一致后，再使用报告结论。');
  }

  if (input.storeOrderRange) {
    storeText += `，近 30 天订单区间为 ${input.storeOrderRange}`;
  }
  storeText += '。';

  if (!input.storeType) {
    storeText += ' 店铺类型未填写，不会阻止测品报告生成。';
  } else if (input.storeType === 'vertical') {
    storeText += ' 垂直店更适合围绕类目沉淀关键词、评价和复购。';
  } else if (input.storeType === 'mixed') {
    if (type !== 'risk') type = 'warning';
    storeText += ' 杂货店更适合轻量测试，广告投入要更保守。';
    actions.push('先低风险上架验证，不要为单个新品过早扩大投入。');
  } else if (input.storeType === 'new') {
    if (type !== 'risk') type = 'warning';
    storeText += ' 新店缺少基础权重和评价，价格、图片和广告测试要更谨慎。';
    actions.push('先做小预算关键词测试，观察曝光、点击和首单成本。');
  } else {
    storeText += ' 成熟店可结合历史流量和老客画像判断是否能承接新品。';
  }

  if (!actions.length) {
    actions.push('可以进入上架测试，但需要记录广告消耗、点击、加购、订单和退货。');
  }

  const status = type === 'risk' ? '暂不建议测试' : type === 'warning' ? '谨慎测试' : '建议上架测试';
  const summary = type === 'risk'
    ? '当前组合风险较高，暂不建议直接开广告或扩大投入。'
    : type === 'warning'
      ? '当前产品可以继续观察，但只适合谨慎、小预算验证。'
      : '当前数据支持上架测试，但仍需人工记录曝光、点击、广告和退货表现。';

  return {
    type,
    status,
    summary,
    priceText,
    profitText,
    competitionText,
    adText,
    storeText,
    actions: [...new Set(actions)].slice(0, 5)
  };
}
