// 规则版选品预判，不调用 AI/API，也不修改利润公式。
const STORE_TYPE_TEXT = {
  vertical: '垂直店',
  mixed: '杂货店',
  new: '新店',
  mature: '成熟店'
};
const OZON_STORE_CONTEXT_WARNING = 'Ozon 店铺商品摘要暂不可用，本次先基于来源链接和手动利润数据进行分析。';
const OZON_MARKETPLACE_LINK_NOTICE = '当前识别到的是 Ozon 商品页面链接。Seller API 只能读取已授权店铺的商品摘要，不能直接读取任意 Ozon 页面或其他卖家的商品数据。';

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
  const reason = blockingMessage || `等待自动采集数据：${missing.join('、')}。`;

  return {
    type: 'waiting',
    status: '等待数据',
    summary: reason + ' 当前静态版不会自动抓取任意网站或平台竞品数据，后续需要后端采集服务接入。',
    priceText: '等待来源链接解析、相似竞品均价和当前折合售价。',
    profitText: '等待有效售价、成本和利润测算。',
    competitionText: '等待相似竞品数量、评分、评价、痛点、关键词和主题标签。',
    adText: '等待广告占比假设。',
    storeText: '等待店铺类型和订单区间。',
    actions: ['后续需要新增后端采集服务，前端不能直接完成跨网站抓取。', '正式自动版应优先使用官方 API 或合规数据源，必要时再评估爬虫方案。']
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

  const detail = ozon && ozon.message ? ` 状态：${ozon.message}` : '';
  return OZON_STORE_CONTEXT_WARNING + detail;
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

  return base + ' 利润具备测试空间，但还需要结合 Ozon 流量、转化和评价门槛复盘。';
}

function buildOzonAutoReport(analysis, profitSnapshot) {
  const source = analysis.source || {};
  const ozon = analysis.ozon || {};
  const insights = analysis.insights || {};
  const type = getProfitReportType(profitSnapshot);
  const hasTitle = !isBlank(source.title);
  const hasImage = !isBlank(source.image);
  const hasCategory = !isBlank(insights.category);
  const hasOzonData = ozon.status === 'connected';
  const ozonProducts = Array.isArray(ozon.products) ? ozon.products : [];
  const ozonSampleText = ozonProducts.length
    ? ' 店铺样本商品：' + ozonProducts
      .map(item => `${item.offer_id || item.product_id || '未命名'}${item.name ? ' / ' + item.name : ''}`)
      .join('；')
    : '';
  const actions = [];

  if (!hasTitle || !hasImage) {
    actions.push('来源链接读取不完整，先人工复核商品主图、标题和规格。');
  }

  if (!hasCategory) {
    actions.push('类目识别不完整，上架前需要人工确认 Ozon 目标类目。');
  }

  if (!hasOzonData) actions.push(OZON_STORE_CONTEXT_WARNING);

  if (profitSnapshot && profitSnapshot.profitRate < 10) {
    actions.push('当前利润率低于 10%，不建议直接开广告测试。');
  } else if (profitSnapshot && profitSnapshot.profitRate < 20) {
    actions.push('只用小预算测试关键词，不要直接放量。');
  } else {
    actions.push('可以进入小量测试，但要记录广告消耗、点击、加购、订单和退货。');
  }

  if (uniqueList(insights.keywords).length) {
    actions.push('用识别出的关键词先检查 Ozon 搜索结果和头部商品卡片质量。');
  }

  const status = type === 'risk' ? '暂不建议' : type === 'warning' ? '谨慎测试' : type === 'waiting' ? '数据不足' : '建议小量测试';
  const sourceTitle = hasTitle ? source.title : '未识别标题';
  const sourceHost = source.host || normalizeHost(source.url);
  const marketplaceNotice = getOzonMarketplaceLinkNotice(source.url);
  const summary = `已识别来源：${sourceHost}。${hasTitle ? '商品标题为“' + sourceTitle + '”。' : '商品标题暂未完整识别。'} ${marketplaceNotice}`.trim();

  return {
    type,
    status,
    summary,
    priceText: `当前售价折合约 ${rub(profitSnapshot && profitSnapshot.saleRub)}。Phase 4A 暂不生成 Ozon 全平台竞品均价；若官方 API 或合规数据源可用，后续再补价格带。`,
    profitText: buildProfitReportText(profitSnapshot),
    competitionText: hasOzonData
      ? 'Ozon API 已通过后端连接检查，已能读取你店铺的商品样本。全平台相似竞品数量、均价、评分评论需要后续接入可用的官方报告或合规第三方数据源。' + ozonSampleText
      : buildOptionalOzonContextText(ozon),
    adText: '广告判断沿用当前利润测算中的广告率；搜索与推荐广告应先小预算验证点击、加购和订单，不以低价作为唯一策略。',
    storeText: `识别类目候选：${insights.category || '待人工复核'}。关键词：${formatList(insights.keywords, '待提取')}。主题标签：${formatList(insights.tags, '待提取')}。`,
    actions: uniqueList(actions, 5)
  };
}

function buildApiDisconnectedAnalysis(sourceUrl, profitSnapshot) {
  const host = normalizeHost(sourceUrl);
  const marketplaceNotice = getOzonMarketplaceLinkNotice(sourceUrl);

  return {
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
      summary: `Product link received（${host}）。${marketplaceNotice} 当前模式为手动/预览分析：系统不会从浏览器直接读取商品页或 Ozon 卖家数据。自动数据读取需要卖家通过 Cloudflare Worker 后端完成官方 API 授权；你可以先手动填写流量、曝光、转化或类目趋势备注。`,
      priceText: `当前售价折合约 ${rub(profitSnapshot && profitSnapshot.saleRub)}。价格带和竞品数据需要授权后端或人工补充，当前不生成实时平台结论。`,
      profitText: buildProfitReportText(profitSnapshot),
      competitionText: 'Store API 尚未连接，当前不会自动读取 Ozon 竞品数量、均价、评分或评论。请先以人工观察和后续授权数据作为输入。',
      adText: '广告判断暂时只基于当前利润测算和人工备注。未来 API 连接可同步授权店铺的广告、曝光、点击或转化数据。',
      storeText: '商品类目、关键词和主题标签当前处于人工预览状态；后续 Worker 端点可返回经过授权的数据摘要。',
      actions: ['继续手动补充流量、曝光、转化和类目趋势备注。', '需要自动数据时，先在 API Settings 中配置 HTTPS Worker URL。', '正式测试只能通过 Worker 调用官方 Seller API，不要把 API Key 放进前端代码或 localStorage。']
    }
  };
}

function buildWorkerEndpointNotReadyAnalysis(sourceUrl, profitSnapshot) {
  const analysis = buildApiDisconnectedAnalysis(sourceUrl, profitSnapshot);
  analysis.ozon.status = 'endpoint_not_ready';
  analysis.ozon.message = 'Worker 已配置，但未来的 /api/ozon/product-summary 端点尚未可用。';
  analysis.report.summary = `Product link received。${getOzonMarketplaceLinkNotice(sourceUrl)} Worker URL 已配置，但产品摘要端点尚未实现；当前仍保持手动/预览分析，不抓取页面、不读取未授权数据。`;
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
    return buildApiDisconnectedAnalysis(payload.sourceUrl, payload.profitSnapshot);
  }

  if ((payload.clientId || payload.apiKey) && typeof validateWorkerUrlForCredentials === 'function') {
    const worker = validateWorkerUrlForCredentials(apiBaseUrl);

    if (worker.error) {
      const analysis = buildApiDisconnectedAnalysis(payload.sourceUrl, payload.profitSnapshot);
      analysis.ozon.status = worker.error;
      analysis.ozon.message = worker.message;
      analysis.report.summary = `Product link received。${getOzonMarketplaceLinkNotice(payload.sourceUrl)} 当前不会发送 Ozon 临时凭证，也不会直接请求 Ozon 官方 API。`;
      analysis.report.competitionText = buildOptionalOzonContextText(analysis.ozon);
      return analysis;
    }
  }

  const response = await fetch(apiBaseUrl + '/api/ozon/product-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.status === 404) {
    return buildWorkerEndpointNotReadyAnalysis(payload.sourceUrl, payload.profitSnapshot);
  }

  if (!response.ok) {
    throw new Error('Worker 产品摘要端点返回异常：' + response.status);
  }

  const analysis = await response.json();
  if (!analysis.report) {
    analysis.report = buildOzonAutoReport(analysis, payload.profitSnapshot);
  }
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
  if (isBlank(input.targetCategory)) missing.push('自动识别类目');
  if (!hasPositiveNumber(input.competitorCount)) missing.push('三平台相似竞品数量');
  if (!hasPositiveNumber(input.competitorAvgPrice)) missing.push('三平台相似竞品均价');
  if (!Number.isFinite(input.adShare) || input.adShare < 0) missing.push('预估广告占比');
  if (isBlank(input.storeType)) missing.push('店铺类型');

  if (missing.length) {
    return buildWaitingSelectionReport(missing);
  }

  const actions = [];
  const storeLabel = STORE_TYPE_TEXT[input.storeType] || '未填写';
  const priceRatio = input.saleRub / input.competitorAvgPrice;
  const priceHighRisk = priceRatio >= 1.3 && ['new', 'mixed'].includes(input.storeType);
  const priceLow = priceRatio <= 0.85;
  const competitionHigh = input.competitorCount >= 80 || input.topCompetitorReviews >= 1000;
  const strongTopCompetitor = input.topCompetitorRating >= 4.7 && input.topCompetitorReviews >= 500;
  const highAdPressure = input.adShare >= 30;
  const platformMismatch = input.targetPlatform && input.activePlatform && input.targetPlatform !== input.activePlatform;
  let type = 'test';

  let priceText = `当前售价折合约 ${rub(input.saleRub)}，竞品均价约 ${rub(input.competitorAvgPrice)}。`;
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

  let competitionText = `当前相似竞品约 ${input.competitorCount} 个。`;
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

  let adText = `${input.adType || '手动广告假设'}，预估广告占比 ${percent(input.adShare)}。`;
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

  if (input.storeType === 'vertical') {
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
      : '当前数据支持小量测试，但仍需用真实流量、广告和退货表现复盘。';

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
