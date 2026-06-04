// 规则版选品预判，不调用 AI/API，也不修改利润公式。
const STORE_TYPE_TEXT = {
  vertical: '垂直店',
  mixed: '杂货店',
  new: '新店',
  mature: '成熟店'
};
const OZON_STORE_CONTEXT_WARNING = 'Ozon 店铺商品摘要暂不可用，本次先基于来源链接、手动商品信息和利润测算进行分析。';
const OZON_MARKETPLACE_LINK_NOTICE = '当前识别到的是 Ozon 商品页面链接。Seller API 只能读取已授权店铺的商品摘要，不能直接读取任意 Ozon 页面或其他卖家的商品数据。';
const MANUAL_PRODUCT_GUIDANCE = '已识别来源链接，但当前不会自动抓取商品标题。请手动填写商品标题、采购价和类目信息后继续分析。';

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
    competitionText: '人工曝光、点击、转化和竞品观察是可选估算，留空不会阻止测品报告。',
    adText: '等待利润计算器基础数据；广告占比是可选人工假设。',
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

  return {
    title: String(product.title || '').trim(),
    sourceCost: Number.isFinite(cost) && cost >= 0 ? cost : null,
    category: String(product.category || '').trim(),
    notes: String(product.notes || '').trim()
  };
}

function hasManualProductData(manualProduct) {
  const product = normalizeManualProduct(manualProduct);
  return Boolean(product.title || product.sourceCost !== null || product.category || product.notes);
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
    localPreference: String(input.localPreference || '').trim()
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
    return '未填写人工曝光、点击、转化或竞品参数；本次报告不会因此显示失败，先基于商品信息和利润测算判断是否值得小量测试。';
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
    return `${adText}。当前利润或成本压力偏高，暂不建议直接开广告或放大库存，先调整采购、物流、售价或规格。${preference}`;
  }

  if (type === 'warning') {
    return `${adText}。当前只适合谨慎测品：小预算、小库存，重点记录点击、加购、订单和退货，但这些记录需要人工复盘。${preference}`;
  }

  if (!profitSnapshot || !profitSnapshot.mainInputValid) {
    return '请先补齐利润计算器基础数据；人工曝光、点击、转化为空不会阻止报告，但利润快照是测品判断的核心。';
  }

  return `${adText}。当前可进入小量测试，但仍要人工记录广告消耗、点击、加购、订单和退货，不视为平台 API 已同步。${preference}`;
}

function applyManualProductContext(analysis, manualProduct, sourceUrl) {
  if (!analysis) return analysis;

  const product = normalizeManualProduct(manualProduct);
  analysis.manualProduct = product;
  analysis.source = analysis.source || {};
  analysis.source.url = analysis.source.url || sourceUrl;
  analysis.source.host = analysis.source.host || normalizeHost(analysis.source.url);
  analysis.insights = analysis.insights || {};
  analysis.manualBaseContext = analysis.manualBaseContext || {
    sourceTitle: analysis.source.title || '',
    category: analysis.insights.category || '',
    sellingPoints: Array.isArray(analysis.insights.sellingPoints) ? analysis.insights.sellingPoints.slice() : []
  };

  analysis.source.title = product.title || analysis.manualBaseContext.sourceTitle;
  analysis.insights.category = product.category || analysis.manualBaseContext.category;
  analysis.insights.sellingPoints = product.notes
    ? uniqueList([product.notes].concat(analysis.manualBaseContext.sellingPoints), 5)
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
    return base + ' 利润空间过低，暂不建议直接开广告或放大库存。';
  }

  if (profitSnapshot.profitRate < 20) {
    return base + ' 只能作为小预算谨慎测试，重点复核采购、物流和广告假设。';
  }

  return base + ' 利润具备测试空间，但还需要人工复核点击、转化、评价门槛和退货风险。';
}

function buildOzonAutoReport(analysis, profitSnapshot) {
  const source = analysis.source || {};
  const ozon = analysis.ozon || {};
  const insights = analysis.insights || {};
  const manualProduct = normalizeManualProduct(analysis.manualProduct);
  const manualAssumptions = normalizeManualTestingAssumptions(analysis.manualAssumptions);
  const type = getProfitReportType(profitSnapshot);
  const displayTitle = manualProduct.title || source.title || '';
  const displayCategory = manualProduct.category || insights.category || '';
  const displayNotes = formatManualNotes(manualProduct.notes);
  const hasTitle = !isBlank(displayTitle);
  const hasImage = !isBlank(source.image);
  const hasCategory = !isBlank(displayCategory);
  const hasOzonData = ozon.status === 'connected';
  const hasManualData = hasManualProductData(manualProduct);
  const ozonProducts = Array.isArray(ozon.products) ? ozon.products : [];
  const ozonSampleText = ozonProducts.length
    ? ' 店铺样本商品：' + ozonProducts
      .map(item => `${item.offer_id || item.product_id || '未命名'}${item.name ? ' / ' + item.name : ''}`)
      .join('；')
    : '';
  const actions = [];

  if (!hasTitle) {
    actions.push('先手动填写商品标题、采购价和类目信息，再判断是否进入小量测试。');
  } else if (!hasImage) {
    actions.push('来源链接不会自动抓取主图，请人工复核商品主图、规格和页面卖点。');
  }

  if (!hasCategory) {
    actions.push('请手动补充类目或产品类型，上架前仍需要人工确认 Ozon 目标类目。');
  }

  if (!hasOzonData) actions.push(OZON_STORE_CONTEXT_WARNING);

  if (profitSnapshot && profitSnapshot.profitRate < 10) {
    actions.push('当前利润率低于 10%，暂不建议进入测品。');
  } else if (profitSnapshot && profitSnapshot.profitRate < 20) {
    actions.push('只做小预算谨慎测试，不要直接放量。');
  } else {
    actions.push('可以进入小量测试，但曝光、点击、加购、订单和退货需要人工记录复盘。');
  }

  if (uniqueList(insights.keywords).length) {
    actions.push('用识别出的关键词先检查 Ozon 搜索结果和头部商品卡片质量。');
  }

  const status = type === 'risk' ? '暂不建议' : type === 'warning' ? '谨慎测试' : type === 'waiting' ? '等待利润测算' : '建议小量测试';
  const sourceHost = source.host || normalizeHost(source.url);
  const marketplaceNotice = getOzonMarketplaceLinkNotice(source.url);
  const manualSummaryParts = [
    hasTitle ? `手动商品：${displayTitle}` : MANUAL_PRODUCT_GUIDANCE,
    `采购价：${formatManualCost(manualProduct.sourceCost)}`,
    `类目/类型：${displayCategory || '未填写'}`,
    displayNotes ? `卖点/备注：${displayNotes}` : ''
  ].filter(Boolean);
  const summary = hasManualData
    ? `已识别来源：${sourceHost}。${manualSummaryParts.join('。')}。${marketplaceNotice}`.trim()
    : `已识别来源：${sourceHost}。${hasTitle ? '商品标题为“' + displayTitle + '”。' : MANUAL_PRODUCT_GUIDANCE} ${marketplaceNotice}`.trim();
  const logisticsRiskText = buildLogisticsRiskText(profitSnapshot);

  return {
    type,
    status,
    summary,
    priceText: `${buildProfitCostSnapshotText(profitSnapshot, manualProduct)} 当前不抓取来源站价格或 Ozon 全平台竞品均价；需要人工录入或后续接入合规数据源。`,
    profitText: buildProfitReportText(profitSnapshot),
    competitionText: hasOzonData
      ? 'Ozon API 已通过后端连接检查，已能读取你店铺的商品样本。全平台相似竞品数量、均价、评分评论需要后续接入可用的官方报告或合规第三方数据源。' + ozonSampleText
      : `${buildOptionalOzonContextText(ozon)} ${buildManualAssumptionText(manualAssumptions)}`,
    adText: buildTestingSuggestionText(type, profitSnapshot, manualAssumptions),
    storeText: `手动类目/产品类型：${displayCategory || '待人工补充'}。${displayNotes ? '卖点/备注：' + displayNotes + '。' : ''}${logisticsRiskText} 关键词：${formatList(insights.keywords, '待提取')}。主题标签：${formatList(insights.tags, '待提取')}。`,
    actions: uniqueList(actions, 5)
  };
}

function buildApiDisconnectedAnalysis(sourceUrl, profitSnapshot, manualProduct) {
  const host = normalizeHost(sourceUrl);
  const marketplaceNotice = getOzonMarketplaceLinkNotice(sourceUrl);

  const analysis = {
    ok: false,
    source: {
      url: sourceUrl,
      host,
      title: '',
      image: ''
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
      summary: `Product link received（${host}）。${marketplaceNotice} 当前模式为手动测品预览：系统不会从浏览器直接读取商品页或 Ozon 卖家数据。人工曝光、点击、转化参数只用于模拟测品，不代表平台 API 同步。`,
      priceText: `当前售价折合约 ${rub(profitSnapshot && profitSnapshot.saleRub)}。价格带和竞品数据需要授权后端或人工补充，当前不生成实时平台结论。`,
      profitText: buildProfitReportText(profitSnapshot),
      competitionText: 'Store API 尚未连接，当前不会自动读取 Ozon 竞品数量、均价、评分或评论。请先以人工观察和后续授权数据作为输入。',
      adText: '广告判断暂时只基于当前利润测算和人工预估，不代表已同步真实广告、曝光、点击或转化数据。',
      storeText: '商品类目、关键词和主题标签当前处于人工预览状态；后续 Worker 端点可返回经过授权的数据摘要。',
      actions: ['先补齐商品信息和利润测算，再决定是否小量测试。', '人工曝光、点击、转化参数是可选估算，不能当作平台同步数据。', '正式测试只能通过 Worker 调用官方 Seller API，不要把 API Key 放进前端代码或 localStorage。']
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
  analysis.report.actions = ['确认 Worker 后端需要新增 /api/ozon/product-summary。', '端点完成前继续使用人工备注和利润测算做预判。', '不要从浏览器直接调用 Ozon 官方 API 或保存真实 API Key。'];
  return analysis;
}

function buildDemoOzonAnalysis(profitSnapshot) {
  const analysis = {
    ok: true,
    source: {
      url: 'https://example.com/product/demo',
      host: 'example.com',
      title: '示例商品：便携收纳包',
      image: ''
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
  analysis.report.summary = '这是示例报告，用于确认页面结果形态。真实报告需要部署 Worker 并配置 Ozon API 凭证。';
  return analysis;
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
    profitText += ' 利润率只是勉强可测，适合小量验证，不适合直接放量。';
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
    storeText += ' 杂货店更适合轻量测试，库存和广告投入要更保守。';
    actions.push('先小批量上架验证，不要为单个新品压太多库存。');
  } else if (input.storeType === 'new') {
    if (type !== 'risk') type = 'warning';
    storeText += ' 新店缺少基础权重和评价，价格、图片和广告测试要更谨慎。';
    actions.push('先做小预算关键词测试，观察曝光、点击和首单成本。');
  } else {
    storeText += ' 成熟店可结合历史流量和老客画像判断是否能承接新品。';
  }

  if (!actions.length) {
    actions.push('可以进入小量测试，但需要记录广告消耗、点击、加购、订单和退货。');
  }

  const status = type === 'risk' ? '暂不建议' : type === 'warning' ? '谨慎测试' : '建议小量测试';
  const summary = type === 'risk'
    ? '当前组合风险较高，暂不建议直接开广告或放大库存。'
    : type === 'warning'
      ? '当前产品可以继续观察，但只适合谨慎、小预算验证。'
      : '当前数据支持小量测试，但仍需人工记录曝光、点击、广告和退货表现。';

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
