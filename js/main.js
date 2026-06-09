// 负责读取页面输入、更新页面显示、绑定交互事件。
let platform = 'Ozon';
let lastSubsidyField = 'subsidySalePrice';
let currentValidation = { values: {}, errors: [], warnings: [], invalidIds: [], warningIds: [] };
let lastProfitSnapshot = null;
let lastOzonAutoAnalysis = null;
let ozonTemporaryConnectionState = { status: 'not_connected', message: '未测试' };
let currentExtractionRequestId = 0;
let sourcePreviewState = {
  lastPreviewUrl: '',
  activeRequestUrl: '',
  lastRequestId: 0,
  activeRequestId: 0,
  currentPreview: null,
  lastAutoFilledTitle: '',
  lastAutoFilledImage: '',
  lastAutoFilledSourceCost: '',
  lastSuggestedCategory: '',
  isTitleAutoFilledFromPreview: false,
  isImageAutoFilledFromPreview: false,
  isSourceCostAutoFilledFromPreview: false,
  isCategorySuggestedFromAssist: false
};
const DECISION_DATA_WARNING_TEXT = '请先填写来源成本和目标售价，或先在利润计算器中完成售价、采购价、重量和平台测算。否则只能做商品卡片观察，不能判断利润安全边际。';

const apiPreparationFieldIds = [
  'ozonTestStoreName',
  'ozonTestClientId',
  'ozonTestApiKey',
  'ozonWorkerUrl'
];

const manualProductFieldIds = [
  'productEvidencePack',
  'manualProductTitle',
  'manualSourceCost',
  'manualProductCategory',
  'sourcePlatformInput',
  'targetSellingPriceInput',
  'estimatedWeightInput',
  'productMaterialInput',
  'productUsageSceneInput',
  'productSellingPointInput',
  'manualProductNotes',
  'manualProductTextHelper'
];

const manualTestingAssumptionFieldIds = [
  'estimatedExposure',
  'estimatedClickRate',
  'estimatedConversionRate',
  'estimatedExposureNotes',
  'estimatedClickRateNotes',
  'estimatedConversionRateNotes',
  'manualMarketObservationNotes',
  'competitorCount',
  'competitorAvgPrice',
  'competitorMinPrice',
  'competitorMaxPrice',
  'topCompetitorRating',
  'topCompetitorReviews',
  'selectionAdShare',
  'selectionAdType',
  'storeType',
  'storeOrderRange',
  'localPreference',
  'competitorCardQuality',
  'marketCrowding',
  'positiveReviewSignals',
  'negativeReviewSignals',
  'titleClarity',
  'mainImageQuality',
  'sellingPointClarity',
  'categoryFit',
  'specComplexity',
  'visualDifferentiation',
  'returnRiskLevel',
  'reviewTrustLevel'
];

const savedFieldIds = [
  'salePrice',
  'rubRate',
  'weight',
  'length',
  'width',
  'height',
  'purchaseCost',
  'commissionRate',
  'adRate',
  'taxRate',
  'withdrawRate',
  'returnRate',
  'labelFee',
  'otherCostInput',
  'subsidySalePrice',
  'subsidyAmountInput',
  'subsidyRateInput',
  'topicProductTitle',
  'topicTargetPlatform',
  'topicProductCategory',
  'topicMaterial',
  'topicSpecification',
  'topicUsageScene',
  'topicSellingPoints',
  'topicTargetUser',
  'topicEvidencePack',
  'topicCompetitorTags',
  'topicCandidateTags',
  'topicBannedWords',
  'topicCompetitorKeywords',
  'topicAvoidWords',
  'sourceProductUrl',
  'productEvidencePack',
  'manualProductTitle',
  'manualSourceCost',
  'manualProductCategory',
  'sourcePlatformInput',
  'targetSellingPriceInput',
  'estimatedWeightInput',
  'productMaterialInput',
  'productUsageSceneInput',
  'productSellingPointInput',
  'manualProductNotes',
  'manualProductTextHelper',
  'estimatedExposure',
  'estimatedClickRate',
  'estimatedConversionRate',
  'estimatedExposureNotes',
  'estimatedClickRateNotes',
  'estimatedConversionRateNotes',
  'manualMarketObservationNotes',
  'productUrl',
  'imageUrl',
  'productSelectionPlatform',
  'targetCategory',
  'competitorCount',
  'competitorAvgPrice',
  'competitorMinPrice',
  'competitorMaxPrice',
  'topCompetitorRating',
  'topCompetitorReviews',
  'selectionAdShare',
  'selectionAdType',
  'storeType',
  'storeOrderRange',
  'localPreference',
  'competitorCardQuality',
  'marketCrowding',
  'positiveReviewSignals',
  'negativeReviewSignals',
  'titleClarity',
  'mainImageQuality',
  'sellingPointClarity',
  'categoryFit',
  'specComplexity',
  'visualDifferentiation',
  'returnRiskLevel',
  'reviewTrustLevel'
];

const inputRules = {
  salePrice: { label: '预设售价', required: true, min: 0.01, warnAbove: 100000, requiredMessage: '请先填写售价，系统才能计算利润。', minMessage: '售价必须大于 0，请检查后再计算。' },
  rubRate: { label: '人民币兑卢布汇率', required: true, min: 0.01, warnBelow: 5, warnAbove: 30, requiredMessage: '请检查汇率，汇率必须大于 0。', minMessage: '请检查汇率，汇率必须大于 0。' },
  weight: { label: '毛重', required: true, min: 1, warnAbove: 30000, requiredMessage: '请先填写商品重量，系统才能匹配物流渠道。', minMessage: '商品重量必须大于 0，系统才能匹配物流渠道。' },
  length: { label: '长', min: 0, warnAbove: 300, minMessage: '商品长度不能为负数，请检查尺寸。' },
  width: { label: '宽', min: 0, warnAbove: 300, minMessage: '商品宽度不能为负数，请检查尺寸。' },
  height: { label: '高', min: 0, warnAbove: 300, minMessage: '商品高度不能为负数，请检查尺寸。' },
  purchaseCost: { label: '采购成本', min: 0, warnAbove: 100000, minMessage: '采购成本不能为负数，请检查进货价。' },
  commissionRate: { label: '佣金率', min: 0, warnAbove: 100, minMessage: '佣金率不能为负数，请检查平台费率。' },
  adRate: { label: '广告率', min: 0, warnAbove: 100, minMessage: '广告率不能为负数，请检查投放成本。' },
  taxRate: { label: '税率', min: 0, warnAbove: 100, minMessage: '税率不能为负数，请检查税费设置。' },
  withdrawRate: { label: '提现率', min: 0, warnAbove: 100, minMessage: '提现率不能为负数，请检查提现成本。' },
  returnRate: { label: '退货率', min: 0, warnAbove: 100, minMessage: '退货率不能为负数，请检查退货成本。' },
  labelFee: { label: '贴单费', min: 0, warnAbove: 10000, minMessage: '贴单费不能为负数，请检查操作费用。' },
  otherCostInput: { label: '其他费用', min: 0, warnAbove: 100000, minMessage: '其他费用不能为负数，请检查额外成本。' },
  subsidySalePrice: { label: '补贴后售价', min: 0, minMessage: '补贴后售价不能为负数，请检查补贴设置。' },
  subsidyAmountInput: { label: '补贴金额', min: 0, minMessage: '补贴金额不能为负数，请检查补贴设置。' },
  subsidyRateInput: { label: '补贴率', min: 0, warnAbove: 100, minMessage: '补贴率不能为负数，请检查补贴设置。' }
};

function applyTheme() {
  document.body.classList.remove('theme-ozon', 'theme-wildberries', 'theme-yandex');
  document.body.classList.add(platform === 'Wildberries' ? 'theme-wildberries' : platform === 'Yandex' ? 'theme-yandex' : 'theme-ozon');
}

function optionExists(selectEl, value) {
  return Array.from(selectEl.options).some(option => option.value === value);
}

function updateActivePlatformTab() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.platform === platform);
  });
}

function switchAppView(targetView) {
  const nextView = targetView || 'profit';

  document.querySelectorAll('.app-view').forEach(view => {
    const isActive = view.dataset.view === nextView;
    view.classList.toggle('is-active', isActive);
    view.hidden = !isActive;
  });

  document.querySelectorAll('[data-view-target]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.viewTarget === nextView);
  });

  document.body.dataset.activeView = nextView;

  if (nextView === 'ai') {
    renderAiCompactSummary();
    renderAiAnalysisStatusModel();
  }
}

function bindAppViewSwitching() {
  document.querySelectorAll('[data-view-target]').forEach(button => {
    button.addEventListener('click', () => {
      switchAppView(button.dataset.viewTarget);
    });
  });
}

function mountAiAnalysisWorkspace() {
  const panel = document.querySelector('.future-panel');
  const mount = document.getElementById('aiAnalysisMount');

  if (panel && mount && panel.parentElement !== mount) {
    mount.appendChild(panel);
  }
}

function collectFormState() {
  const fields = {};

  savedFieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) fields[id] = el.value;
  });

  return {
    platform,
    supplier: document.getElementById('supplier').value,
    service: document.getElementById('service').value,
    fields
  };
}

function persistFormState() {
  saveFormState(collectFormState());
}

function restoreFormState() {
  const saved = loadFormState();

  if (!saved) return;

  if (saved.platform && rules.some(rule => rule.p === saved.platform)) {
    platform = saved.platform;
  }

  applyTheme();
  updateActivePlatformTab();
  syncProductSelectionPlatform();
  fillSuppliers();

  const supplierEl = document.getElementById('supplier');
  if (saved.supplier && optionExists(supplierEl, saved.supplier)) {
    supplierEl.value = saved.supplier;
    fillServices();
  }

  const serviceEl = document.getElementById('service');
  if (saved.service && optionExists(serviceEl, saved.service)) {
    serviceEl.value = saved.service;
  }

  if (saved.fields) {
    savedFieldIds.forEach(id => {
      if (Object.prototype.hasOwnProperty.call(saved.fields, id)) {
        setInput(id, saved.fields[id]);
      }
    });
  }
}

function readNumber(id) {
  const el = document.getElementById(id);

  if (!el) {
    return { value: 0, empty: true, invalid: true };
  }

  const raw = el.value.trim();

  if (raw === '') {
    return { value: 0, empty: true, invalid: false };
  }

  const n = Number(raw);
  return Number.isFinite(n) ? { value: n, empty: false, invalid: false } : { value: 0, empty: false, invalid: true };
}

function readOptionalNumber(id) {
  const parsed = readNumber(id);
  return parsed.empty || parsed.invalid ? null : parsed.value;
}

function fieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function syncProductSelectionPlatform() {
  const select = document.getElementById('productSelectionPlatform');
  if (select && optionExists(select, platform)) select.value = platform;
}

function v(id) {
  if (currentValidation.values && Object.prototype.hasOwnProperty.call(currentValidation.values, id)) {
    return currentValidation.values[id];
  }

  const n = readNumber(id);
  return n.invalid ? 0 : n.value;
}

function addIssue(list, ids, id, message) {
  list.push(message);
  if (!ids.includes(id)) ids.push(id);
}

function validateInputs() {
  const validation = { values: {}, errors: [], warnings: [], invalidIds: [], warningIds: [] };

  Object.keys(inputRules).forEach(id => {
    const rule = inputRules[id];
    const parsed = readNumber(id);
    validation.values[id] = parsed.value;

    if (parsed.empty) {
      if (rule.required) {
        addIssue(validation.errors, validation.invalidIds, id, rule.requiredMessage || `请填写${rule.label}。`);
      }
      return;
    }

    if (parsed.invalid) {
      validation.values[id] = 0;
      addIssue(validation.errors, validation.invalidIds, id, `${rule.label}不是有效数字，请重新填写。`);
      return;
    }

    if (rule.min !== undefined && parsed.value < rule.min) {
      validation.values[id] = rule.min === 0.01 ? 0 : rule.min;
      addIssue(validation.errors, validation.invalidIds, id, rule.minMessage || `${rule.label}不能小于 ${rule.min}。`);
      return;
    }

    if (rule.warnBelow !== undefined && parsed.value > 0 && parsed.value < rule.warnBelow) {
      addIssue(validation.warnings, validation.warningIds, id, `${rule.label}低于常见范围，请确认是否填错。`);
    }

    if (rule.warnAbove !== undefined && parsed.value > rule.warnAbove) {
      addIssue(validation.warnings, validation.warningIds, id, `${rule.label}高于常见范围，请确认是否填错。`);
    }
  });

  const hasSomeSize = ['length', 'width', 'height'].some(id => readNumber(id).value > 0);
  const hasAllSize = ['length', 'width', 'height'].every(id => readNumber(id).value > 0);

  if (hasSomeSize && !hasAllSize) {
    ['length', 'width', 'height'].forEach(id => {
      if (!readNumber(id).value && !validation.warningIds.includes(id)) validation.warningIds.push(id);
    });
    validation.warnings.push('长、宽、高没有填完整，体积重会暂按 0 计算。');
  }

  const sale = validation.values.salePrice;

  if (sale > 0 && validation.values.purchaseCost > sale) {
    addIssue(validation.warnings, validation.warningIds, 'purchaseCost', '采购成本已经高于售价，请确认是否仍要试算。');
  }

  if (sale > 0 && validation.values.subsidySalePrice > sale) {
    addIssue(validation.warnings, validation.warningIds, 'subsidySalePrice', '补贴后售价高于原售价，系统会按原售价范围计算补贴。');
  }

  if (sale > 0 && validation.values.subsidyAmountInput > sale) {
    addIssue(validation.warnings, validation.warningIds, 'subsidyAmountInput', '补贴金额高于原售价，系统会按不超过原售价处理。');
  }

  return validation;
}

function renderValidation(validation) {
  Object.keys(inputRules).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('input-error', 'input-warning');
  });

  validation.warningIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('input-warning');
  });

  validation.invalidIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('input-warning');
      el.classList.add('input-error');
    }
  });

  const box = document.getElementById('inputValidationNotice');
  if (!box) return;

  box.classList.remove('is-ok', 'has-warning', 'has-error');
  box.textContent = '';

  if (!validation.errors.length && !validation.warnings.length) {
    box.classList.add('is-ok');
    box.textContent = '输入检查通过，结果会随修改自动更新。';
    return;
  }

  box.classList.add(validation.errors.length ? 'has-error' : 'has-warning');

  const title = document.createElement('strong');
  title.textContent = validation.errors.length ? '请先检查这些明显错误：' : '输入提醒：';
  box.appendChild(title);

  const ul = document.createElement('ul');
  validation.errors.concat(validation.warnings).slice(0, 6).forEach(message => {
    const li = document.createElement('li');
    li.textContent = message;
    ul.appendChild(li);
  });
  box.appendChild(ul);
}

function logisticsValidationMessage() {
  const blockingIds = ['salePrice', 'rubRate', 'weight'].filter(id => currentValidation.invalidIds.includes(id));

  if (!blockingIds.length) {
    return '';
  }

  return '请先修正：' + blockingIds.map(id => inputRules[id].label).join('、') + '，再匹配物流渠道。';
}

function getProfitDecision(sale, profit, profitRate) {
  if (!sale) {
    return {
      type: 'waiting',
      status: '等待输入',
      text: '填写售价和成本后，这里会根据利润和利润率给出参考提示。'
    };
  }

  if (profit < 0) {
    return {
      type: 'risk',
      status: '亏损风险',
      text: '当前测算为亏损，仅作参考。建议先检查售价、采购成本、物流费和广告费是否合理。'
    };
  }

  if (profitRate < 10) {
    return {
      type: 'low',
      status: '利润很低',
      text: '当前利润率很低，仅作参考。退货、广告波动、物流误差或汇率变化都可能让利润消失，建议先复查关键成本。'
    };
  }

  if (profitRate < 20) {
    return {
      type: 'low',
      status: '勉强可测',
      text: '当前利润率只是勉强可测，不适合直接放量。建议低风险验证，并优先确认采购、物流、广告和退货假设。'
    };
  }

  if (profitRate < 30) {
    return {
      type: 'healthy',
      status: '可测试利润',
      text: '当前利润率有一定安全空间，但仍只适合谨慎测试。后续需要结合退货、广告波动、汇率和平台规则复核。'
    };
  }

  return {
    type: 'good',
    status: '利润较强',
    text: '当前利润率较强，仅作参考。仍需确认销量、竞争价格、退货率和广告成本是否稳定，不代表利润保证。'
  };
}

function renderProfitDecision(decision) {
  const card = document.getElementById('profitDecisionCard');
  if (!card) return;

  card.classList.remove('decision-waiting', 'decision-risk', 'decision-low', 'decision-healthy', 'decision-good');
  card.classList.add('decision-' + decision.type);
  setText('profitDecisionStatus', decision.status);
  setText('profitDecisionText', decision.text);
}

function renderDiagnosisMessages(messages) {
  const list = document.getElementById('businessDiagnosisList');
  if (!list) return;

  list.textContent = '';
  messages.forEach(message => {
    const li = document.createElement('li');
    li.textContent = message;
    list.appendChild(li);
  });
}

function getCostPressureItem(data) {
  const pressurePriority = ['purchase', 'logistics', 'ad', 'commission', 'other'];

  return [
    { key: 'purchase', name: '采购成本', value: data.purchaseCost, tip: '采购成本是当前最大压力项，建议优先确认供货价、起订量和是否有更稳的采购渠道。' },
    { key: 'logistics', name: '物流费用', value: data.logisticsCost, tip: '物流费用是当前最大压力项，轻小件或更合适的物流渠道可能更适合测试。' },
    { key: 'commission', name: '平台佣金', value: data.commissionCost, tip: '平台佣金是当前最大压力项，需要确认类目佣金是否已经按实际平台规则填写。' },
    { key: 'ad', name: '广告费用', value: data.adCost, tip: '广告费用是当前最大压力项，即使毛利润为正，也可能影响实际投放后的利润。' },
    { key: 'other', name: '其他费用', value: data.otherCost, tip: '其他费用是当前最大压力项，建议拆分确认是否包含包装、损耗或人工等成本。' }
  ]
    .filter(item => item.value > 0)
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return pressurePriority.indexOf(a.key) - pressurePriority.indexOf(b.key);
    })[0] || null;
}

function getCostExplanation(data) {
  if (!data.sale) {
    return ['请先填写有效售价，再查看成本和结果解释。'];
  }

  const explanations = [
    '总成本主要由采购成本、物流费用、平台佣金、广告费用、税费、提现、退货、贴单费和其他费用组成。',
    '利润率 = 利润 / 售价，用来判断当前售价下的安全空间。'
  ];
  const highest = getCostPressureItem(data);

  if (highest) {
    const ratio = data.totalCost ? highest.value / data.totalCost * 100 : 0;
    explanations.push(`${highest.name}占总成本约 ${ratio.toFixed(1)}%，${highest.tip}`);
  } else {
    explanations.push('当前还没有明显的单项成本压力，请补充采购、物流、佣金或广告等成本后再判断。');
  }

  if (data.profit < 0) {
    explanations.push('当前利润为负，建议先降低关键成本或提高售价，再继续评估是否适合测试。');
  } else if (data.profitRate < 10) {
    explanations.push('当前利润率很低，后续退货、广告波动、物流误差或汇率变化都可能让利润消失。');
  } else if (data.profitRate < 20) {
    explanations.push('当前利润率只是勉强可测，安全空间不高，建议先小量测试并复核关键成本。');
  } else if (data.profitRate < 30) {
    explanations.push('当前利润为正且有一定空间，但仍需要结合退货率、广告消耗和汇率波动继续验证。');
  } else {
    explanations.push('当前利润空间较强，但仍不代表最终经营结果，需要继续验证销量、退货和广告稳定性。');
  }

  return explanations;
}

function getNextAction(data) {
  if (!data.sale) {
    return {
      type: 'waiting',
      text: '请先填写有效数据，再查看下一步建议。'
    };
  }

  const pressure = getCostPressureItem(data);

  if (data.profit < 0) {
    return {
      type: 'risk',
      text: pressure ? `当前测算为亏损，建议先检查${pressure.name}，不要直接放大投放。` : '当前测算为亏损，建议先检查售价和成本结构。'
    };
  }

  if (data.profitRate < 10) {
    return {
      type: 'warning',
      text: pressure ? `利润率很低，建议先复查${pressure.name}，不要直接放大投放。` : '利润率很低，建议先复查成本结构，不要直接放大投放。'
    };
  }

  if (data.profitRate < 20) {
    return {
      type: 'warning',
      text: pressure ? `利润率只是勉强可测，建议只做小量验证，并优先检查${pressure.name}。` : '利润率只是勉强可测，建议只做小量验证。'
    };
  }

  if (pressure && pressure.key === 'purchase') {
    return { type: 'warning', text: '优先检查采购成本，当前采购成本对利润压力较大。' };
  }

  if (pressure && pressure.key === 'logistics') {
    return { type: 'warning', text: '当前物流费用偏高，建议优先测试更轻小的商品或更合适的渠道。' };
  }

  if (pressure && pressure.key === 'ad') {
    return { type: 'warning', text: '当前广告费用压力较高，建议先控制预算并小量测试。' };
  }

  if (data.profitRate >= 30) {
    return {
      type: 'good',
      text: '当前利润空间较强，但仍需结合退货率、广告实际消耗和竞争价格判断。'
    };
  }

  return {
    type: 'healthy',
    text: '当前利润有一定空间，但仍建议低风险验证，并复核退货率、广告消耗和汇率波动。'
  };
}

function getBusinessDiagnosis(data) {
  if (!data.sale) {
    return ['请先填写有效售价、重量和成本后再查看诊断。'];
  }

  const pressure = getCostPressureItem(data);
  const messages = [];

  if (data.profit < 0) {
    messages.push('当前测算为亏损，不建议直接上架或放大投放。');
  } else if (data.profitRate < 10) {
    messages.push('当前利润率很低，退货、广告或汇率波动都可能让利润消失。');
  } else if (data.profitRate < 20) {
    messages.push('当前利润率只是勉强可测，适合小量验证，不适合直接放量。');
  } else if (data.profitRate < 30) {
    messages.push('当前利润有一定测试空间，但仍需要用真实广告、退货和物流数据复核。');
  } else {
    messages.push('当前利润空间较强，但仍不代表销量、退货和广告成本已经稳定。');
  }

  if (pressure) {
    messages.push(`当前最大成本压力是${pressure.name}，建议优先复查这项假设。`);
  }

  return messages;
}

function renderCostExplanation(messages) {
  const list = document.getElementById('resultExplanationList');
  if (!list) return;

  list.textContent = '';
  messages.forEach(message => {
    const li = document.createElement('li');
    li.textContent = message;
    list.appendChild(li);
  });
}

function renderNextAction(action) {
  const card = document.getElementById('nextActionCard');
  if (!card) return;

  card.classList.remove('next-action-waiting', 'next-action-risk', 'next-action-warning', 'next-action-healthy', 'next-action-good');
  card.classList.add('next-action-' + action.type);
  setText('nextActionText', action.text);
}

function renderInvalidInputState() {
  const firstError = currentValidation.errors[0] || '请先修正输入错误。';
  lastProfitSnapshot = {
    mainInputValid: false,
    blockingMessage: firstError,
    sale: 0,
    saleRub: 0,
    profit: 0,
    profitRate: 0,
    purchaseCost: 0,
    logisticsCost: 0,
    adCost: 0,
    commissionCost: 0
  };

  setInput('rubPrice', '请先修正输入');
  setText('totalCost', '待校验');
  setText('profit', '待校验');
  setText('profitRate', '待校验');
  setText('subsidyAmountDisplay', '待校验');
  setText('subsidyRateDisplay', '待校验');
  setText('actualSaleDisplay', '待校验');
  setText('matchedChannel', '未匹配');
  setText('chargeWeight', '待校验');
  setText('volumeWeightDisplay', '待校验');
  setText('logisticsCost', '待校验');
  setText('purchaseCostDisplay', '待校验');
  setText('commissionCost', '待校验');
  setText('adCost', '待校验');
  setText('taxCost', '待校验');
  setText('withdrawCost', '待校验');
  setText('returnCostDisplay', '待校验');
  setText('labelFeeDisplay', '待校验');
  setText('otherCostDisplay', '待校验');
  setText('operationFeeDisplay', '待校验');
  setText('unitRateDisplay', '待校验');
  setText('returnRateDisplay', '待校验');
  setText('otherRateDisplay', '待校验');
  renderProfitDecision({
    type: 'waiting',
    status: '请先修正输入',
    text: firstError + ' 当前暂不生成利润判断，避免误导。'
  });
  renderDiagnosisMessages([firstError, '修正后系统会重新生成运营诊断。']);
  renderCostExplanation([firstError, '修正后系统会重新解释成本结构和利润率。']);
  renderNextAction({
    type: 'waiting',
    text: '请先修正输入错误，再查看下一步建议。'
  });
  renderProductSelection(lastProfitSnapshot);
  renderAiCompactSummary();

  const notice = document.getElementById('matchNotice');
  if (notice) {
    notice.classList.add('danger');
    notice.textContent = firstError + ' 修正后系统会重新匹配物流渠道。';
  }

  if (typeof throwTip !== 'undefined') {
    throwTip.style.display = 'none';
    throwTip.innerHTML = '';
  }
}

function getLogisticsInput() {
  return {
    platform,
    supplier: document.getElementById('supplier').value,
    service: document.getElementById('service').value,
    salePrice: v('salePrice'),
    rubRate: v('rubRate'),
    weight: v('weight'),
    length: v('length'),
    width: v('width'),
    height: v('height')
  };
}

function fillSuppliers() {
  const s = document.getElementById('supplier');
  const arr = uniq(rules.filter(r => r.p === platform).map(r => r.s));
  s.innerHTML = arr.map(x => `<option>${x}</option>`).join('');
  fillServices();
}

function fillServices() {
  const sup = document.getElementById('supplier').value;
  const arr = uniq(rules.filter(r => r.p === platform && r.s === sup).map(r => r.t));
  document.getElementById('service').innerHTML = '<option>自动</option>' + arr.map(x => `<option>${x}</option>`).join('');
}

function match() {
  if (logisticsValidationMessage()) {
    return null;
  }

  return matchLogistics(getLogisticsInput());
}

function syncSubsidy(sale) {
  const subsidy = calculateSubsidy({
    sale,
    subSale: v('subsidySalePrice'),
    amount: v('subsidyAmountInput'),
    rate: v('subsidyRateInput'),
    lastSubsidyField
  });

  Object.keys(subsidy.updates).forEach(id => {
    setInput(id, subsidy.updates[id]);
  });

  return subsidy;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setInput(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getText(id, fallback = '等待输入') {
  const el = document.getElementById(id);
  const value = el ? el.textContent.trim() : '';
  return value || fallback;
}

function renderAiCompactSummary() {
  setText('aiSummaryPlatform', platform);

  if (!lastProfitSnapshot || !lastProfitSnapshot.mainInputValid) {
    setText('aiSummarySale', lastProfitSnapshot && lastProfitSnapshot.blockingMessage ? '待校验' : '等待输入');
    setText('aiSummaryTotalCost', '等待输入');
    setText('aiSummaryProfit', '等待输入');
    setText('aiSummaryProfitRate', '等待输入');
    setText('aiSummaryDecision', lastProfitSnapshot && lastProfitSnapshot.blockingMessage ? '请先修正输入' : '等待输入');
    return;
  }

  setText('aiSummarySale', m(lastProfitSnapshot.sale));
  setText('aiSummaryTotalCost', getText('totalCost'));
  setText('aiSummaryProfit', m(lastProfitSnapshot.profit));
  setText('aiSummaryProfitRate', lastProfitSnapshot.profitRate.toFixed(2) + '%');
  setText('aiSummaryDecision', getText('profitDecisionStatus'));
}

function hasConfiguredWorkerUrl() {
  const fromOzonField = fieldValue('ozonWorkerUrl');
  const fromSavedConfig = window.PRODUCT_SELECTION_API_BASE_URL || '';
  return Boolean(fromOzonField || fromSavedConfig);
}

function getProductLinkStatusText() {
  const sourceUrl = fieldValue('sourceProductUrl');
  if (!sourceUrl) return 'Empty';

  try {
    const parsed = new URL(sourceUrl);
    return ['http:', 'https:'].includes(parsed.protocol) ? 'Received' : 'Invalid URL';
  } catch (error) {
    return 'Invalid URL';
  }
}

function renderAiAnalysisStatusModel() {
  const productLinkStatus = getProductLinkStatusText();
  const workerConfigured = hasConfiguredWorkerUrl();
  const apiConnected = ozonTemporaryConnectionState.status === 'connected';

  setText('aiProductLinkStatus', productLinkStatus);
  setText('aiStoreApiStatus', apiConnected ? 'API connected' : 'Not connected');
  setText('aiAnalysisModeStatus', '本地规则 v0.1');
  setText('aiDataSourceStatus', workerConfigured ? 'Product card workspace + optional link helper' : 'Product card workspace + local rules');
}

function setReferenceRateStatus(message, type = '') {
  const el = document.getElementById('referenceRateStatus');
  if (!el) return;

  el.classList.remove('is-ok', 'is-error');
  if (type) el.classList.add(type);
  el.textContent = message;
}

function renderInitialReferenceRateStatus() {
  if (typeof readCachedReferenceExchangeRate !== 'function') return;

  const cached = readCachedReferenceExchangeRate();
  if (!cached) return;

  setReferenceRateStatus(`${cached.source} · ${cached.sourceDate} · 今日已缓存；仅作运营测算参考，非实时/官方/利润保证。`);
}

function renderProductImagePreview(imageUrl) {
  const box = document.getElementById('productImagePreview');
  const img = document.getElementById('productImagePreviewImg');

  if (!box || !img) return;

  const raw = String(imageUrl || '').trim();
  box.classList.add('is-empty');
  img.removeAttribute('src');

  if (!raw) return;

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    img.src = raw;
    box.classList.remove('is-empty');
  } catch (error) {
    box.classList.add('is-empty');
  }
}

function renderProductSelectionReport(report) {
  const card = document.getElementById('productSelectionReport');
  if (!card || !report) return;

  card.classList.remove('selection-waiting', 'selection-risk', 'selection-warning', 'selection-test');
  card.classList.add('selection-' + report.type);

  setText('productSelectionStatus', report.status);
  setText('productSelectionSummary', report.summary);
  setText('selectionPriceText', report.priceText);
  setText('selectionProfitText', report.profitText);
  setText('selectionCardProblemsText', report.cardProblemsText);
  setText('selectionCompetitionText', report.competitionText);
  setText('selectionReviewRiskText', report.reviewRiskText);
  setText('selectionAdText', report.adText);
  setText('selectionLogisticsReturnText', report.logisticsReturnText);
  setText('selectionStoreText', report.storeText);
  setText('aiResultBox', report.summary);
  renderTestingScoreOverview(report.scores);
  renderEvidenceDiagnosis(report.evidenceSummary);

  const list = document.getElementById('selectionNextActions');
  if (!list) return;

  list.textContent = '';
  report.actions.forEach(action => {
    const li = document.createElement('li');
    li.textContent = action;
    list.appendChild(li);
  });
}

function renderTestingScoreOverview(scores) {
  const container = document.getElementById('testingScoreOverview');
  if (!container) return;

  const items = Array.isArray(scores) ? scores : [];
  container.textContent = '';
  container.hidden = !items.length;
  if (!items.length) return;

  items.forEach(item => {
    const score = Number.isFinite(item.score) ? Math.max(0, Math.min(100, Math.round(item.score))) : 0;
    const card = document.createElement('div');
    card.className = 'score-card';
    card.dataset.scoreBand = score >= 75 ? 'good' : score >= 55 ? 'watch' : 'risk';

    const label = document.createElement('span');
    label.textContent = item.label || '评分';

    const value = document.createElement('strong');
    value.textContent = `${score} / 100`;

    const reason = document.createElement('p');
    reason.textContent = item.reason || '未提供评分原因。';

    card.append(label, value, reason);
    container.appendChild(card);
  });
}

function renderEvidenceDiagnosis(evidenceSummary) {
  const container = document.getElementById('evidenceDiagnosisSummary');
  if (!container) return;

  const rows = Array.isArray(evidenceSummary) ? evidenceSummary : [];
  container.textContent = '';
  container.hidden = !rows.length;
  if (!rows.length) return;

  rows.forEach(row => {
    const item = document.createElement('div');
    const label = document.createElement('span');
    const text = document.createElement('p');

    label.textContent = row.label || '证据';
    text.textContent = row.text || '未提供。';
    item.append(label, text);
    container.appendChild(item);
  });
}

const TOPIC_TAG_BOUNDARY_TEXT = '当前模块仅针对 Ozon 主题标签。Wildberries 和 Yandex 更适合单独做关键词助手，不在本模块生成。当前建议基于你提供的商品信息、竞品文本和本地规则生成，不代表平台真实搜索量或官方标签库。';
const TOPIC_TOOL_STRATEGY_TEXT = '工具类、机械类、配件类产品不适合追求太泛的流量。它们的搜索流量可能小，但用户意图更明确。主题标签应优先围绕核心产品词、型号规格、适配对象和具体使用场景，提升精准点击和转化概率。';
const TOPIC_CONSUMER_STRATEGY_TEXT = '普通消费品可以通过场景、材质、季节、人群和功能词扩展流量，但仍然不能使用和产品不匹配的泛词。';

const TOPIC_TAG_RULES = [
  {
    id: 'automotive_endoscope',
    roles: ['core'],
    patterns: [/内窥镜/i, /endoscope/i, /эндоскоп/i],
    tags: [
      { text: 'эндоскоп', reason: '内窥镜核心产品词；如果竞品标签中出现，应优先作为主核心词', ru: true },
      { text: 'автомобильный эндоскоп', reason: '汽车维修场景 + 内窥镜的精准核心组合', ru: true },
      { text: 'эндоскоп для авто', reason: '汽车适配对象 + 内窥镜的长尾方向', ru: true },
      { text: '内窥镜', reason: '中文产品类型词' }
    ]
  },
  {
    id: 'car_repair',
    roles: ['scene'],
    patterns: [/汽车维修/i, /修理厂/i, /ремонт/i, /для ремонта/i, /car repair/i, /auto repair/i],
    tags: [
      { text: 'для ремонта', reason: '维修使用场景词，适合工具类产品长尾', ru: true },
      { text: 'ремонт авто', reason: '汽车维修意图词，适合精准流量', ru: true },
      { text: '汽车维修', reason: '中文使用场景词' }
    ]
  },
  {
    id: 'car_engine',
    roles: ['scene'],
    patterns: [/发动机/i, /engine/i, /двигател/i],
    tags: [
      { text: 'двигатель', reason: '汽车发动机适配 / 检测对象词', ru: true },
      { text: 'ремонт двигателя', reason: '发动机维修场景词', ru: true },
      { text: '发动机检测', reason: '中文使用场景词' }
    ]
  },
  {
    id: 'rotating',
    roles: ['attribute'],
    patterns: [/旋转/i, /360/i, /поворот/i, /rotat/i],
    tags: [
      { text: 'поворотный', reason: '旋转结构 / 功能词', ru: true },
      { text: '360', reason: '旋转角度规格词', ru: true },
      { text: '旋转', reason: '中文功能词' }
    ]
  },
  {
    id: 'high_resolution',
    roles: ['attribute'],
    patterns: [/1080\s*p/i, /高清/i, /пиксель/i, /ips/i],
    tags: [
      { text: '1080p', reason: '清晰度规格词，适合工具类精准长尾', ru: true },
      { text: '高清', reason: '中文功能词' }
    ]
  },
  {
    id: 'cooler_bag',
    roles: ['core'],
    patterns: [/保温包/i, /保冷包/i, /冷藏包/i, /cooler bag/i, /thermal bag/i, /термосумка/i, /сумка холодильник/i],
    tags: [
      { text: 'термосумка', reason: '保温包 / 保冷包核心产品词', ru: true },
      { text: 'сумка холодильник', reason: '保冷袋核心产品词', ru: true },
      { text: '保温包', reason: '中文产品类型词' }
    ]
  },
  {
    id: 'lunch_bag',
    roles: ['core', 'audience'],
    patterns: [/午餐包/i, /便当包/i, /lunch bag/i, /сумка для обеда/i],
    tags: [
      { text: 'сумка для обеда', reason: '午餐包产品词', ru: true },
      { text: '午餐包', reason: '中文产品类型词' }
    ]
  },
  {
    id: 'storage',
    roles: ['core', 'scene'],
    patterns: [/收纳/i, /整理/i, /storage/i, /organizer/i, /хранение/i],
    tags: [
      { text: 'хранение', reason: '收纳 / 存放方向', ru: true },
      { text: '收纳', reason: '中文场景词' }
    ]
  },
  {
    id: 'picnic',
    roles: ['scene', 'audience'],
    patterns: [/野餐/i, /picnic/i, /пикник/i],
    tags: [
      { text: 'пикник', reason: '野餐使用场景', ru: true },
      { text: 'для пикника', reason: '用于野餐的长尾结构', ru: true },
      { text: '野餐', reason: '中文场景词' }
    ]
  },
  {
    id: 'camping',
    roles: ['scene'],
    patterns: [/露营/i, /camping/i, /camp/i, /кемпинг/i],
    tags: [
      { text: 'кемпинг', reason: '露营使用场景', ru: true },
      { text: '露营', reason: '中文场景词' }
    ]
  },
  {
    id: 'beach',
    roles: ['scene'],
    patterns: [/海边/i, /沙滩/i, /beach/i, /пляж/i],
    tags: [
      { text: 'пляж', reason: '海边 / 沙滩使用场景', ru: true },
      { text: '海边', reason: '中文场景词' }
    ]
  },
  {
    id: 'travel',
    roles: ['scene', 'audience'],
    patterns: [/旅行/i, /出行/i, /travel/i, /путешествие/i],
    tags: [
      { text: 'путешествие', reason: '旅行出行场景', ru: true },
      { text: '旅行', reason: '中文场景词' }
    ]
  },
  {
    id: 'outdoor',
    roles: ['scene'],
    patterns: [/户外/i, /outdoor/i, /для улицы/i],
    tags: [
      { text: 'для улицы', reason: '户外使用方向', ru: true },
      { text: '户外', reason: '中文场景词' }
    ]
  },
  {
    id: 'car',
    roles: ['scene', 'audience'],
    patterns: [/车载/i, /自驾/i, /汽车/i, /car/i, /auto/i],
    tags: [
      { text: 'для автомобиля', reason: '车载 / 自驾使用方向，俄语需确认', ru: true, confirm: true },
      { text: '车载旅行', reason: '中文场景词' }
    ]
  },
  {
    id: 'home',
    roles: ['scene'],
    patterns: [/家用/i, /家居/i, /home/i, /дом/i],
    tags: [
      { text: 'дом', reason: '家用场景', ru: true },
      { text: '家用', reason: '中文场景词' }
    ]
  },
  {
    id: 'kitchen',
    roles: ['scene'],
    patterns: [/厨房/i, /kitchen/i, /кухня/i],
    tags: [
      { text: 'кухня', reason: '厨房场景', ru: true },
      { text: '厨房', reason: '中文场景词' }
    ]
  },
  {
    id: 'large_capacity',
    roles: ['attribute', 'conversion'],
    patterns: [/大容量/i, /\b\d+\s*l\b/i, /\d+\s*L/i, /\d+\s*升/i, /large capacity/i, /большая вместимость/i],
    tags: [
      { text: 'большая вместимость', reason: '大容量属性', ru: true },
      { text: '大容量', reason: '中文属性词' }
    ]
  },
  {
    id: 'waterproof',
    roles: ['attribute'],
    patterns: [/防水/i, /waterproof/i, /водонепроницаемый/i],
    tags: [
      { text: 'водонепроницаемый', reason: '防水属性', ru: true },
      { text: '防水', reason: '中文属性词' }
    ]
  },
  {
    id: 'insulated',
    roles: ['attribute', 'conversion'],
    patterns: [/保温/i, /保冷/i, /隔热/i, /insulated/i, /thermal/i, /термоизоляция/i],
    tags: [
      { text: 'термоизоляция', reason: '保温 / 隔热属性', ru: true },
      { text: '保温保冷', reason: '中文属性词' }
    ]
  },
  {
    id: 'pockets',
    roles: ['attribute'],
    patterns: [/口袋/i, /多层/i, /pockets?/i, /карманы/i],
    tags: [
      { text: 'карманы', reason: '口袋 / 分层属性', ru: true },
      { text: '多层口袋', reason: '中文属性词' }
    ]
  },
  {
    id: 'foldable',
    roles: ['attribute'],
    patterns: [/折叠/i, /可折/i, /foldable/i, /складной/i],
    tags: [
      { text: 'складной', reason: '可折叠属性', ru: true },
      { text: '可折叠', reason: '中文属性词' }
    ]
  },
  {
    id: 'lightweight',
    roles: ['attribute'],
    patterns: [/轻便/i, /轻量/i, /lightweight/i, /легкий/i],
    tags: [
      { text: 'легкий', reason: '轻便属性', ru: true },
      { text: '轻便', reason: '中文属性词' }
    ]
  },
  {
    id: 'cotton',
    roles: ['attribute'],
    patterns: [/棉/i, /cotton/i, /хлопок/i],
    tags: [
      { text: 'хлопок', reason: '棉材质', ru: true },
      { text: '棉', reason: '中文材质词' }
    ]
  },
  {
    id: 'polyester',
    roles: ['attribute'],
    patterns: [/涤纶/i, /聚酯/i, /polyester/i, /полиэстер/i],
    tags: [
      { text: 'полиэстер', reason: '涤纶 / 聚酯材质', ru: true },
      { text: '涤纶', reason: '中文材质词' }
    ]
  },
  {
    id: 'plastic',
    roles: ['attribute'],
    patterns: [/塑料/i, /plastic/i, /пластик/i],
    tags: [
      { text: 'пластик', reason: '塑料材质', ru: true },
      { text: '塑料', reason: '中文材质词' }
    ]
  },
  {
    id: 'silicone',
    roles: ['attribute'],
    patterns: [/硅胶/i, /silicone/i, /силикон/i],
    tags: [
      { text: 'силикон', reason: '硅胶材质', ru: true },
      { text: '硅胶', reason: '中文材质词' }
    ]
  },
  {
    id: 'stainless',
    roles: ['attribute'],
    patterns: [/不锈钢/i, /stainless steel/i, /нержавеющая сталь/i],
    tags: [
      { text: 'нержавеющая сталь', reason: '不锈钢材质', ru: true },
      { text: '不锈钢', reason: '中文材质词' }
    ]
  },
  {
    id: 'oxford',
    roles: ['attribute'],
    patterns: [/牛津布/i, /oxford/i],
    tags: [
      { text: 'oxford fabric（俄语需确认）', reason: '牛津布材质线索，俄语表达需卖家确认', confirm: true },
      { text: '牛津布', reason: '中文材质词' }
    ]
  },
  {
    id: 'aluminum_lining',
    roles: ['attribute'],
    patterns: [/铝膜/i, /铝箔/i, /aluminum/i, /foil/i],
    tags: [
      { text: 'алюминиевая фольга（需确认）', reason: '铝膜 / 铝箔内胆线索，俄语表达需卖家确认', ru: true, confirm: true },
      { text: '铝膜内胆', reason: '中文属性词' }
    ]
  },
  {
    id: 'family',
    roles: ['audience', 'conversion'],
    patterns: [/家庭/i, /family/i, /семья/i],
    tags: [
      { text: 'для семьи', reason: '家庭用途方向，俄语需确认', ru: true, confirm: true },
      { text: '家庭户外', reason: '中文用途词' }
    ]
  },
  {
    id: 'baby',
    roles: ['audience'],
    patterns: [/婴儿/i, /宝宝/i, /儿童/i, /baby/i, /детский/i],
    tags: [
      { text: 'детский', reason: '儿童 / 宝宝用途方向', ru: true },
      { text: '儿童', reason: '中文人群词' }
    ]
  },
  {
    id: 'women',
    roles: ['audience'],
    patterns: [/女性/i, /女/i, /women/i, /женский/i],
    tags: [
      { text: 'женский', reason: '女性人群方向，仅在产品确实面向女性时使用', ru: true },
      { text: '女性', reason: '中文人群词' }
    ]
  },
  {
    id: 'men',
    roles: ['audience'],
    patterns: [/男性/i, /男/i, /men/i, /мужской/i],
    tags: [
      { text: 'мужской', reason: '男性人群方向，仅在产品确实面向男性时使用', ru: true },
      { text: '男性', reason: '中文人群词' }
    ]
  }
];

const TOPIC_TAG_AVOID_RULES = [
  { patterns: [/женская сумка/i, /women bag/i, /女包/i], text: 'женская сумка / women bag', reason: '如果不是时尚女包，会吸引错配流量。' },
  { patterns: [/рюкзак/i, /backpack/i, /双肩包/i], text: 'рюкзак / backpack', reason: '如果商品不是双肩背包，不要用背包标签。' },
  { patterns: [/\bbag\b/i, /(^|[\s,，])сумка($|[\s,，])/i, /包$/i], text: 'bag / сумка', reason: '过于宽泛，建议用更具体的产品词替代。' },
  { patterns: [/fashion/i, /мода/i, /时尚/i], text: 'fashion / 时尚', reason: '只有时尚穿搭属性明确时才使用。' },
  { patterns: [/женский/i, /мужской/i, /女性/i, /男性/i], text: 'gender tag', reason: '人群性别不明确时不要使用，会降低流量精准度。' }
];

function topicNormalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getTopicTagInput() {
  return {
    title: fieldValue('topicProductTitle'),
    platform: fieldValue('topicTargetPlatform') || platform,
    category: fieldValue('topicProductCategory'),
    material: fieldValue('topicMaterial'),
    specification: fieldValue('topicSpecification'),
    usageScene: fieldValue('topicUsageScene'),
    sellingPoints: fieldValue('topicSellingPoints'),
    targetUser: fieldValue('topicTargetUser'),
    evidencePack: fieldValue('topicEvidencePack'),
    competitorTags: fieldValue('topicCompetitorTags'),
    candidateTags: fieldValue('topicCandidateTags'),
    bannedWords: fieldValue('topicBannedWords') || fieldValue('topicAvoidWords'),
    competitorKeywords: fieldValue('topicCompetitorKeywords')
  };
}

function topicTextCorpus(input) {
  return [
    input.title,
    input.category,
    input.material,
    input.specification,
    input.usageScene,
    input.sellingPoints,
    input.targetUser,
    input.evidencePack,
    input.competitorTags,
    input.candidateTags,
    input.competitorKeywords,
    input.bannedWords
  ].filter(Boolean).join('\n');
}

function topicTextHasRule(corpus, rule) {
  return rule.patterns.some(pattern => pattern.test(corpus));
}

function buildTopicTag(text, role, rule, sourceText) {
  const appearsInEvidence = text && sourceText.toLowerCase().includes(String(text).toLowerCase().replace(/（.*?）/g, '').trim());
  return {
    text,
    role,
    reason: rule.reason || '基于商品信息和本地标签规则。',
    confidence: appearsInEvidence ? '证据中出现' : rule.confirm ? '需卖家确认' : rule.ru ? '内置保守映射' : '商品信息支持',
    source: appearsInEvidence ? '证据包' : '系统补充'
  };
}

function addTopicTag(group, tag) {
  if (!tag || !tag.text) return;
  if (group.some(item => item.text === tag.text)) return;
  group.push(tag);
}

function formatTopicTags(tags, fallback = '未生成。') {
  if (!tags || !tags.length) return fallback;
  return tags.map(tag => {
    const note = tag.confidence ? `（${tag.confidence}）` : '';
    return `${tag.text}${note}`;
  }).join('、');
}

function formatTopicTagDetails(tags, fallback = '未生成。') {
  if (!tags || !tags.length) return fallback;
  return tags.map(tag => `${tag.text}：${tag.reason}${tag.confidence ? `；${tag.confidence}` : ''}`).join('\n');
}

function extractCustomTopicTerms(value, reason, maxItems = 12) {
  return String(value || '')
    .split(/[\n,，;；、|]+/)
    .map(item => topicNormalizeText(item))
    .filter(item => item.length >= 2 && item.length <= 60)
    .slice(0, maxItems)
    .map(text => ({ text, reason, confidence: '卖家提供' }));
}

const TOPIC_FINAL_TAG_TARGET = 30;
const TOPIC_FINAL_TAG_MAX_LENGTH = 30;
const TOPIC_DEFAULT_BANNED_WORDS = ['ozon', 'wildberries', 'yandex', 'amazon', 'aliexpress', 'taobao', 'tmall', '1688'];
const TOPIC_BROAD_TAGS = [
  'сумка',
  'bag',
  'товар',
  'product',
  'аксессуар',
  'accessory',
  'аксессуары',
  'goods',
  'outdoor bag'
];

function topicTagLength(tag) {
  return Array.from(String(tag || '')).length;
}

function topicCleanTagText(value) {
  return topicNormalizeText(value)
    .replace(/^[\s"'“”‘’`·•\-]+|[\s"'“”‘’`。.!！?？]+$/g, '')
    .replace(/\s+/g, ' ');
}

function topicTagKey(value) {
  return topicFormattedSearchKey(value);
}

function splitTopicTagInput(value, maxItems = 80) {
  return String(value || '')
    .replace(/#/g, '\n')
    .split(/[\n,，;；、|]+/)
    .map(topicCleanTagText)
    .filter(item => item.length >= 2)
    .slice(0, maxItems);
}

function topicCorpusKey(input) {
  return topicFormattedSearchKey(topicTextCorpus(input).replace(/#/g, ' ').replace(/_/g, ' '));
}

function topicEvidenceSupportsText(text, input) {
  const key = topicFormattedSearchKey(text);
  if (!key) return false;
  const corpusKey = topicCorpusKey(input);
  if (corpusKey.includes(key)) return true;
  return key.split(' ').filter(part => part.length >= 2).some(part => corpusKey.includes(part));
}

function extractTopicSpecTerms(input) {
  const text = topicTextCorpus(input);
  const terms = [];
  const addMatches = pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => terms.push(match.toLocaleLowerCase('ru-RU').replace(/\s+/g, '')));
  };

  addMatches(/\b[a-z]{1,4}\d{1,5}[a-z0-9-]*\b/gi);
  addMatches(/\b\d{3,4}\s*p\b/gi);
  addMatches(/\bip\s*\d{2}\b/gi);
  addMatches(/\b\d{3,5}\s*mah\b/gi);
  addMatches(/\b\d+(?:[.,]\d+)?\s*(?:mm|мм)\b/gi);
  addMatches(/\b\d+(?:[.,]\d+)?\s*(?:m|м)\b/gi);
  addMatches(/\b\d+\s*(?:l|л)\b/gi);
  (text.match(/\d+(?:[.,]\d+)?\s*米/g) || []).forEach(match => {
    terms.push(match.replace(/\s*米/g, 'м').replace(',', '.'));
  });
  return uniqueList(terms
    .map(term => term.replace(/^(\d+(?:[.,]\d+)?)l$/i, '$1л'))
    .map(topicCleanTagText)
    .filter(term => !topicContainsCjk(term)), 12);
}

function getTopicBannedWords(input) {
  return uniqueList(TOPIC_DEFAULT_BANNED_WORDS.concat(splitTopicTagInput(input.bannedWords, 40)), 80)
    .map(word => topicCleanTagText(word).toLowerCase())
    .filter(Boolean);
}

function normalizeRawTag(text) {
  return String(text || '')
    .replace(/#+/g, ' ')
    .replace(/[，,]+/g, ' ')
    .replace(/[\/\\()[\]{}<>«»"“”‘’'`~!！?？.:：;；|+=*&^%$@、。·•-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatOzonTag(rawTag) {
  const normalized = normalizeRawTag(rawTag)
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLocaleLowerCase('ru-RU');
  return normalized ? `#${normalized}` : '#';
}

function getFormattedTagLength(tag) {
  return Array.from(String(tag || '')).length;
}

function topicFormattedSearchKey(value) {
  return normalizeRawTag(String(value || '').replace(/_/g, ' '))
    .toLocaleLowerCase('ru-RU');
}

function isValidFormattedTag(tag, bannedWords = []) {
  return isOzonFinalTagSafe(tag, bannedWords);
}

function isOzonFinalTagSafe(tag, bannedWords = []) {
  const value = String(tag || '').trim();
  if (!value.startsWith('#')) return false;
  if (value === '#') return false;
  if (topicContainsCjk(value)) return false;
  if (value.includes(',') || value.includes('，') || /\s/.test(value)) return false;
  if (!/^#[\u0400-\u04FFA-Za-z0-9_]+$/u.test(value)) return false;
  if (getFormattedTagLength(value) > TOPIC_FINAL_TAG_MAX_LENGTH) return false;
  return !topicContainsBannedWord(value, bannedWords);
}

function topicContainsCjk(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ''));
}

function topicContainsBannedWord(tag, bannedWords) {
  const key = topicFormattedSearchKey(tag);
  return bannedWords.find(word => {
    const normalizedWord = topicFormattedSearchKey(word);
    return normalizedWord && key.includes(normalizedWord);
  });
}

function topicIsBroadTag(tag) {
  const key = topicTagKey(tag);
  if (TOPIC_BROAD_TAGS.includes(key)) return true;
  return /^(сумка|bag|товар|product|аксессуар|accessory)$/i.test(key);
}

function topicDetectProfile(input) {
  const corpus = topicTextCorpus(input).toLowerCase();
  return {
    mechanical: /model|型号|compatible|适配|spare part|запчасть|насадка|фильтр|двигатель|кабель|connector|разъем|内窥镜|эндоскоп|endoscope|汽车维修|ремонт|ip67|1080p/.test(corpus),
    fashion: /clothing|fashion|одежда|платье|куртка|обувь|женский|мужской|服装|衣服|女装|男装|鞋|穿搭/.test(corpus),
    homeKitchen: /home|kitchen|дом|кухня|storage|хранение|家用|家居|厨房|收纳|清洁|烹饪/.test(corpus),
    outdoorPicnic: /outdoor|picnic|camping|beach|пикник|кемпинг|пляж|户外|野餐|露营|海边|保温包|термосумка|сумка холодильник/.test(corpus)
  };
}

function getTopicProductType(input, matchedRuleIds = []) {
  const profile = topicDetectProfile(input);
  if (matchedRuleIds.includes('automotive_endoscope') || /内窥镜|эндоскоп|endoscope/.test(topicTextCorpus(input))) {
    return {
      id: 'tool',
      label: '工具 / 汽车维修类产品',
      why: '商品证据中出现内窥镜、汽车维修、发动机检测、型号规格或防水高清等工具属性。',
      strategy: '优先使用核心产品词、型号 / 规格词、适配对象词和维修场景词，避免生活方式泛词。',
      trafficLogic: TOPIC_TOOL_STRATEGY_TEXT
    };
  }
  if (profile.mechanical) {
    return {
      id: 'tool',
      label: '工具 / 机械 / 配件类产品',
      why: '商品证据中出现型号、适配、维修、配件、机械或连接器等精准搜索线索。',
      strategy: '先锁定准确产品词，再补型号规格、适配对象、安装维修和维护场景。',
      trafficLogic: TOPIC_TOOL_STRATEGY_TEXT
    };
  }
  if (profile.fashion) {
    return {
      id: 'fashion',
      label: '服饰 / 时尚类产品',
      why: '商品证据更偏服饰、鞋服、穿搭、性别或风格表达。',
      strategy: '围绕产品类型、性别证据、季节、材质、风格和尺码版型扩展。',
      trafficLogic: '服饰类标签可以扩展风格和季节，但性别、版型、风格词必须有商品证据支持。'
    };
  }
  if (profile.homeKitchen) {
    return {
      id: 'homeKitchen',
      label: '家居 / 厨房消费品',
      why: '商品证据更偏家用、厨房、清洁、收纳或烹饪场景。',
      strategy: '围绕产品类型、材质、功能、尺寸 / 容量和使用场景扩展。',
      trafficLogic: '家居 / 厨房产品适合用功能、材质、容量和场景词覆盖真实使用需求。'
    };
  }
  if (profile.outdoorPicnic) {
    return {
      id: 'ordinary',
      label: '普通户外消费品',
      why: '商品证据中出现野餐、露营、海边、户外、保温包或容量等普通消费场景。',
      strategy: '可使用产品类型 + 场景 + 容量 + 保温保冷 + 便携 / 口袋等功能属性扩展。',
      trafficLogic: TOPIC_CONSUMER_STRATEGY_TEXT
    };
  }
  return {
    id: 'ordinary',
    label: '普通消费品',
    why: '当前证据没有明显机械、配件、服饰或专业工具属性。',
    strategy: '围绕产品类型、场景、材质、功能、规格和用户意图做保守扩展。',
    trafficLogic: TOPIC_CONSUMER_STRATEGY_TEXT
  };
}

function topicIsCoolerBagContext(input, matchedRuleIds = []) {
  return matchedRuleIds.includes('cooler_bag') || /保温包|保冷包|冷藏包|термосумка|сумка холодильник|cooler bag|thermal bag/i.test(topicTextCorpus(input));
}

function topicMismatchReason(tag, input, matchedRuleIds = []) {
  const key = topicTagKey(tag);
  const coolerBagContext = topicIsCoolerBagContext(input, matchedRuleIds);
  const profile = topicDetectProfile(input);
  if (profile.mechanical && /сумка|bag|рюкзак|пикник|кемпинг|пляж|женск|мода|fashion/.test(key)) return '工具 / 机械 / 配件类产品不应使用生活方式、时尚或泛包类标签。';
  if (coolerBagContext && /рюкзак|backpack|双肩包/.test(key)) return '商品不是双肩背包，使用背包词会导入错配流量。';
  if (coolerBagContext && /женская сумка|women bag|女包/.test(key)) return '商品不是时尚女包，性别包类词会误导流量。';
  if (coolerBagContext && /пляжная сумка/.test(key) && !/термо|холод|термосумка/.test(key)) return '更像普通沙滩包，未体现保温/保冷属性。';
  if (coolerBagContext && key === 'outdoor bag') return '英文泛词过宽，未体现保温包产品类型。';
  if (!/жен|女性|women|муж|男性|men/.test(topicTextCorpus(input).toLowerCase()) && /женский|женская|women|мужской|men/.test(key)) return '人群性别缺少商品证据支持。';
  return '';
}

function topicInferTagType(tag, role, input) {
  const key = topicTagKey(tag);
  if (/эндоскоп|термосумка|сумка холодильник|сумка для обеда|保温包|午餐包|хранение/.test(key) || role === 'core') return '核心产品词';
  if (/авто|автомоб|двигател|compatible|适配/.test(key)) return '适配对象词';
  if (/model|型号|запчасть|насадка|фильтр|кабель|connector|t\d+|1080p|ip\d+|\d+\s*(mah|l|л|cm|см|mm|мм|m|м|kg|кг)\b/i.test(key)) return '型号 / 规格词';
  if (/поворот|360|водонепроницаемый|термоизоляция|карманы|高清|防水|隔热|保温|保冷/.test(key)) return '功能词';
  if (/для |пикник|кемпинг|пляж|путешеств|野餐|露营|海边|旅行|车载/.test(key) && /термосумка|сумка холодильник|сумка для обеда|保温包|午餐包/.test(key)) return '长尾组合词';
  if (role === 'scene' || /ремонт|для ремонта|пикник|кемпинг|пляж|путешеств|для улицы|дом|кухня|野餐|露营|海边|旅行|户外|家用|厨房|维修/.test(key)) return '使用场景词';
  if (/хлопок|полиэстер|пластик|силикон|нержавеющая сталь|oxford|фольга|牛津布|铝膜|棉|涤纶|塑料|硅胶|不锈钢/.test(key)) return '材质词';
  if (role === 'attribute' || /большая вместимость|карманы|складной|легкий|容量|口袋|折叠|轻便/.test(key)) return '属性词';
  if (role === 'audience' || /для семьи|детский|женский|мужской|家庭|儿童|女性|男性/.test(key)) return '人群词';
  if (/лето|зима|summer|winter|夏|冬/.test(key)) return '季节词';
  if (input.targetUser && key.includes(input.targetUser.toLowerCase())) return '用途词';
  return '长尾组合词';
}

function topicSourceForTag(tag, fallbackSource, sourceText) {
  const clean = topicTagKey(tag);
  if (clean && String(sourceText || '').toLowerCase().includes(clean)) return '证据包';
  return fallbackSource;
}

function buildTopicCandidateRow(tag, options) {
  const text = topicCleanTagText(tag);
  const formattedTag = formatOzonTag(text);
  const input = options.input;
  const bannedWords = options.bannedWords;
  const matchedRuleIds = options.matchedRuleIds || [];
  const role = options.role || '';
  const type = options.type || topicInferTagType(text, role, input);
  const source = options.source || '系统补充';
  const charCount = getFormattedTagLength(formattedTag);
  const bannedWord = topicContainsBannedWord(formattedTag, bannedWords);
  const mismatchReason = topicMismatchReason(text, input, matchedRuleIds);
  const broad = topicIsBroadTag(text);
  const hasCjk = topicContainsCjk(text);
  const unsafePunctuation = /[\/\\()[\]{}<>«»"“”‘’'`~!！?？.:：;；|+=*&^%$@、。·•-]/.test(text.replace(/^#/, '').replace(/_/g, ''));
  const evidenceSupported = topicEvidenceSupportsText(text, input);
  let status = options.status || '推荐使用';
  let riskLevel = options.riskLevel || '低';
  const reasons = [options.reason || '基于商品信息和本地规则生成。'];
  const issues = [];

  if (charCount > TOPIC_FINAL_TAG_MAX_LENGTH) {
    status = '不建议使用';
    riskLevel = '高';
    issues.push('too-long');
    reasons.push(`超过 ${TOPIC_FINAL_TAG_MAX_LENGTH} 个字符。`);
  }
  if (bannedWord) {
    status = '不建议使用';
    riskLevel = '高';
    issues.push('banned-word');
    reasons.push(`包含品牌词 / 禁用词：${bannedWord}。`);
  }
  if (broad) {
    status = '不建议使用';
    riskLevel = '高';
    issues.push('too-broad');
    reasons.push('标签过于宽泛，新品不建议用作强标签。');
  }
  if (mismatchReason) {
    status = '不建议使用';
    riskLevel = '高';
    issues.push('mismatch');
    reasons.push(mismatchReason);
  }
  if (hasCjk) {
    status = '不建议使用';
    riskLevel = '高';
    issues.push('contains-chinese');
    reasons.push('包含中文，不能进入最终 Ozon 标签；只保留为中文参考。');
  }
  if (unsafePunctuation) {
    status = '不建议使用';
    riskLevel = '高';
    issues.push('unsafe-punctuation');
    reasons.push('包含不安全标点；最终标签只允许 #、_、俄文字母、拉丁字母和数字。');
  }
  if (status !== '不建议使用' && (/需确认|需要卖家确认/.test(options.reason || '') || /（需确认|俄语需确认/.test(text))) {
    status = '需要人工确认';
    riskLevel = riskLevel === '高' ? riskLevel : '中';
    issues.push('needs-manual-confirmation');
    reasons.push('该表达来自保守映射或不稳定翻译，不能直接放入最终强标签。');
  }
  if (source === '竞品标签' && status === '推荐使用') {
    reasons.push(evidenceSupported
      ? '竞品主题标签是最强证据：说明相似商品已经在 Ozon 流量入口使用该表达。'
      : '竞品主题标签可优先参考，但仍需确认是否与当前商品完全一致。');
  }
  if (source === '我的候选标签' && status === '推荐使用' && !evidenceSupported) {
    status = '需要人工确认';
    riskLevel = '中';
    issues.push('candidate-needs-review');
    reasons.push('候选词需要结合实际搜索结果确认是否贴合商品。');
  }

  return {
    text,
    formattedTag,
    charCount,
    type,
    source,
    reason: uniqueList(reasons, 4).join(' '),
    riskLevel,
    status,
    issues,
    role,
    evidenceSupported,
    bannedWords,
    priority: options.priority || 0
  };
}

function buildTopicAvoidTags(input, corpus, matchedRuleIds) {
  const avoid = [];
  const profile = topicDetectProfile(input);
  extractCustomTopicTerms(input.bannedWords, '卖家明确不想使用，需要从标签方案中排除。', 20).forEach(item => addTopicTag(avoid, item));

  TOPIC_TAG_AVOID_RULES.forEach(rule => {
    if (topicTextHasRule([corpus, input.bannedWords].filter(Boolean).join('\n'), rule)) {
      addTopicTag(avoid, { text: rule.text, reason: rule.reason, confidence: '风险提示' });
    }
  });

  const isSpecificBag = matchedRuleIds.includes('cooler_bag') || matchedRuleIds.includes('lunch_bag');
  if (isSpecificBag) {
    addTopicTag(avoid, { text: 'bag / сумка', reason: '产品类型已经更具体，泛包类词会降低流量精准度。', confidence: '风险提示' });
    if (!matchedRuleIds.includes('women')) {
      addTopicTag(avoid, { text: 'женская сумка', reason: '保温包不是时尚女包时不要使用。', confidence: '风险提示' });
    }
    addTopicTag(avoid, { text: 'рюкзак', reason: '非双肩背包不要使用背包标签。', confidence: '风险提示' });
  }
  if (profile.mechanical) {
    addTopicTag(avoid, { text: 'lifestyle', reason: '工具 / 机械 / 配件类产品不适合用生活方式泛词扩流。', confidence: '风险提示' });
    addTopicTag(avoid, { text: 'fashion', reason: '工具 / 机械 / 配件类产品不应使用时尚风格词。', confidence: '风险提示' });
  }

  return avoid;
}

function buildTopicLongTail(coreTags, sceneTags, attributeTags, input) {
  const longTail = [];
  const core = coreTags.find(tag => /эндоскоп/i.test(tag.text))
    || coreTags.find(tag => /термосумка|сумка холодильник|сумка для обеда/i.test(tag.text))
    || coreTags[0];
  const isToolCore = core && /эндоскоп/i.test(core.text);
  const scenes = sceneTags
    .filter(tag => isToolCore
      ? /ремонт|авто|двигател|для автомобиля/i.test(tag.text)
      : /пикник|кемпинг|пляж|путешествие|для улицы/i.test(tag.text))
    .slice(0, 4);
  const attrs = attributeTags
    .filter(tag => isToolCore
      ? /поворот|1080p|водонепроницаемый|ip67|360/i.test(tag.text)
      : /большая вместимость|термоизоляция|водонепроницаемый|карманы/i.test(tag.text))
    .slice(0, 4);
  const scenePhraseMap = {
    'пикник': 'для пикника',
    'кемпинг': 'для кемпинга',
    'пляж': 'для пляжа',
    'путешествие': 'для путешествий',
    'двигатель': 'для двигателя',
    'ремонт авто': 'для ремонта авто'
  };

  if (core) {
    scenes.forEach(scene => {
      const scenePhrase = scenePhraseMap[scene.text] || scene.text;
      addTopicTag(longTail, {
        text: `${core.text} ${scenePhrase}`,
        reason: '产品词 + 使用场景，适合更精准的长尾搜索方向。',
        confidence: core.confidence === '证据中出现' && scene.confidence === '证据中出现' ? '证据中出现' : '俄语需确认'
      });
    });

    attrs.forEach(attr => {
      addTopicTag(longTail, {
        text: `${core.text} ${attr.text}`,
        reason: '产品词 + 属性，强调购买意图和筛选条件。',
        confidence: attr.confidence === '证据中出现' ? '证据中出现' : '俄语需确认'
      });
    });
  }

  if (!longTail.length) {
    const chineseParts = [input.title || input.category, input.usageScene, input.material || input.sellingPoints]
      .map(part => topicNormalizeText(part))
      .filter(Boolean)
      .slice(0, 3);
    if (chineseParts.length) {
      addTopicTag(longTail, {
        text: chineseParts.join(' + '),
        reason: '中文结构可作为长尾方向，俄语翻译需要卖家结合平台搜索确认。',
        confidence: '需卖家确认'
      });
    }
  }

  return longTail.slice(0, 8);
}

function buildTopicSpecTags(input, coreTags) {
  const specTerms = uniqueList(splitTopicTagInput(input.specification, 8)
    .map(term => term.replace(/(\d+)\s*[lL]\b/g, '$1л').replace(/(\d+)\s*米/g, '$1м'))
    .map(topicCleanTagText)
    .filter(term => term && !topicContainsCjk(term))
    .concat(extractTopicSpecTerms(input)), 12);
  const tags = [];
  const core = coreTags.find(tag => /эндоскоп/i.test(tag.text))
    || coreTags.find(tag => /термосумка|сумка холодильник|сумка для обеда/i.test(tag.text))
    || coreTags[0];

  specTerms.forEach(term => {
    addTopicTag(tags, {
      text: term,
      role: 'spec',
      reason: '来自规格 / 型号 / 尺寸字段，适合精确筛选。',
      confidence: '商品信息支持',
      source: '商品信息'
    });
    if (core && !topicContainsCjk(core.text)) {
      addTopicTag(tags, {
        text: `${core.text} ${term}`,
        role: 'longTail',
        reason: '产品词 + 规格，适合 Ozon 新品精准标签。',
        confidence: '商品信息支持',
        source: '系统补充'
      });
    }
  });

  if (/35\s*[lLл]/i.test(topicTextCorpus(input)) && core && !tags.some(tag => /35л/i.test(tag.text))) {
    addTopicTag(tags, {
      text: `${core.text} 35л`,
      role: 'longTail',
      reason: '证据中出现 35L 容量，转为俄语容量写法用于精准长尾。',
      confidence: '证据中出现',
      source: '证据包'
    });
  }

  return tags.slice(0, 8);
}

function topicScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildTopicScores(groups, input, matchedRuleIds, finalRows = [], rejectedRows = []) {
  const evidenceLength = topicTextCorpus(input).length;
  const longTailCount = finalRows.filter(row => row.type === '长尾组合词' || row.type === '规格 / 型号词' || row.type === '型号 / 规格词').length;
  const relevance = topicScore(35 + groups.core.length * 16 + groups.scene.length * 5 + (input.category ? 8 : 0) + Math.min(12, finalRows.length));
  const specificity = topicScore(28 + groups.attribute.length * 6 + longTailCount * 7 + (input.specification ? 8 : 0) - Math.min(12, rejectedRows.filter(row => row.issues.includes('too-broad')).length * 3));
  const coverage = topicScore(24 + Math.min(26, groups.core.length * 10) + Math.min(22, groups.scene.length * 5) + Math.min(18, groups.attribute.length * 3) + (evidenceLength > 80 ? 8 : 0) + Math.min(16, finalRows.length));
  const mismatchRisk = topicScore(42 + (groups.core.length ? 16 : 0) + Math.min(18, rejectedRows.length * 3) + (matchedRuleIds.includes('cooler_bag') || matchedRuleIds.includes('lunch_bag') ? 8 : 0) - Math.min(12, rejectedRows.filter(row => row.issues.includes('mismatch')).length * 3));
  const conversionIntent = topicScore(30 + groups.attribute.length * 5 + groups.scene.length * 4 + groups.audience.length * 5 + longTailCount * 6);

  return [
    {
      label: '相关性评分',
      score: relevance,
      reason: groups.core.length ? '最终标签围绕核心产品词展开，没有让泛词替代产品类型。' : '核心产品类型不足，先补商品名称或类目。'
    },
    {
      label: '具体性评分',
      score: specificity,
      reason: longTailCount ? '已优先使用规格、场景和属性长尾，减少新品泛流量。' : '属性词或长尾组合不足，建议补容量、材质、尺寸或功能。'
    },
    {
      label: '搜索覆盖评分',
      score: coverage,
      reason: finalRows.length ? `当前可推荐 ${finalRows.length} 个标签，但不代表真实搜索量。` : '场景词和长尾词不足，覆盖面偏窄。'
    },
    {
      label: '错配风险控制评分',
      score: mismatchRisk,
      reason: rejectedRows.length ? '已识别并排除品牌词、泛词或错配词。' : '暂未发现明显错配词，但仍需平台搜索结果复核。'
    },
    {
      label: '转化意图评分',
      score: conversionIntent,
      reason: longTailCount && groups.attribute.length ? '长尾标签能同时表达产品、场景、规格或功能，更接近购买意图。' : '购买意图线索不足，建议补使用目的、核心卖点和痛点。'
    }
  ];
}

function buildTopicCombinations(groups) {
  const precision = uniqueList(groups.core.concat(groups.scene.slice(0, 2)).map(tag => tag.text), 8);
  const expansion = uniqueList(groups.core.concat(groups.scene, groups.attribute.slice(0, 4)).map(tag => tag.text), 12);
  const conversion = uniqueList(groups.longTail.concat(groups.attribute, groups.audience).map(tag => tag.text), 12);

  return {
    precision: {
      tags: precision,
      explanation: '用于新品冷启动或预算有限时：流量较小，但更贴近商品本身。'
    },
    expansion: {
      tags: expansion,
      explanation: '用于已有基础点击后扩展：比精准组更宽，但仍围绕商品、场景和属性。'
    },
    conversion: {
      tags: conversion,
      explanation: '用于优化转化：强调使用场景、容量/材质/功能和购买目的。'
    }
  };
}

function topicRowsFromGroup(tags, input, bannedWords, matchedRuleIds) {
  return tags.map(tag => buildTopicCandidateRow(tag.text, {
    input,
    bannedWords,
    matchedRuleIds,
    role: tag.role,
    source: tag.source || '系统补充',
    reason: tag.reason,
    priority: tag.role === 'longTail' ? 24 : tag.role === 'core' ? 20 : tag.role === 'spec' ? 22 : 10
  }));
}

function buildTopicSourceRows(input, bannedWords, matchedRuleIds) {
  const competitorRows = splitTopicTagInput(input.competitorTags, 60).map(tag => buildTopicCandidateRow(tag, {
    input,
    bannedWords,
    matchedRuleIds,
    source: '竞品标签',
    reason: '来自 Ozon 竞品主题标签；相似商品已经使用的表达优先级高于系统猜测。',
    priority: 45
  }));

  const candidateRows = splitTopicTagInput(input.candidateTags, 60).map(tag => buildTopicCandidateRow(tag, {
    input,
    bannedWords,
    matchedRuleIds,
    source: '我的候选标签',
    reason: '来自卖家自己的候选标签。',
    priority: 14
  }));

  return { competitorRows, candidateRows };
}

function formatTopicDecompositionRows(rows, fallback) {
  if (!rows.length) return fallback;
  return rows.slice(0, 18).map(row => {
    const role = topicMeaningForRow(row);
    return `${row.formattedTag || formatOzonTag(row.text)}：${role}；${row.type}；${row.status}；${shortTopicReason(row)}`;
  }).join('\n');
}

function topicMeaningForRow(row) {
  const key = topicTagKey(row.text);
  if (/эндоскоп/.test(key)) return '内窥镜 / 核心产品词';
  if (/авто|автомоб/.test(key)) return '汽车适配对象';
  if (/ремонт/.test(key)) return '维修使用场景';
  if (/двигател/.test(key)) return '发动机适配或维修对象';
  if (/поворот|360/.test(key)) return '旋转结构 / 功能';
  if (/1080p|ip67|mah|mm|мм|м\b|t\d+/.test(key)) return '型号或规格';
  if (/термосумка|сумка холодильник/.test(key)) return '保温包 / 保冷包核心产品词';
  if (/пикник|кемпинг|пляж|путешеств/.test(key)) return '户外使用场景';
  if (/термоизоляция|большая вместимость|карманы/.test(key)) return '保温、容量或结构属性';
  if (/рюкзак|женская сумка|сумка$/.test(key)) return '可能错配或过泛的包类词';
  return row.type || '标签词';
}

function shortTopicReason(row) {
  if (row.issues.includes('too-broad')) return '过泛，不能替代准确产品词。';
  if (row.issues.includes('mismatch')) return '与当前产品类型不匹配。';
  if (row.issues.includes('banned-word')) return '包含品牌词、平台词或禁用词。';
  if (row.issues.includes('too-long')) return `超过 ${TOPIC_FINAL_TAG_MAX_LENGTH} 字符。`;
  if (row.issues.includes('duplicate-intent') || row.issues.includes('duplicate')) return '与更精准标签重复。';
  return row.reason;
}

function collectTopicChineseReference(input, rows) {
  const corpusItems = [
    input.title,
    input.category,
    input.material,
    input.specification,
    input.usageScene,
    input.sellingPoints,
    input.targetUser,
    input.evidencePack,
    input.candidateTags,
    input.competitorTags
  ];
  const fromInputs = corpusItems
    .join('\n')
    .split(/[\n,，;；、。.!！?？|/\\\s]+/)
    .map(item => topicCleanTagText(item))
    .filter(item => item.length >= 2 && item.length <= 12 && topicContainsCjk(item));
  const fromRows = rows
    .map(row => row.text)
    .filter(text => text.length <= 12 && topicContainsCjk(text));
  return uniqueList(fromInputs.concat(fromRows), 18);
}

function topicRowSortScore(row) {
  const statusScore = row.status === '推荐使用' ? 100 : row.status === '可选使用' ? 70 : row.status === '需要人工确认' ? 30 : 0;
  const typeScore = row.type === '长尾组合词' ? 35 : row.type === '型号 / 规格词' || row.type === '规格 / 型号词' ? 32 : row.type === '核心产品词' ? 34 : row.type === '适配对象词' ? 30 : row.type === '功能词' ? 22 : row.type === '属性词' ? 18 : row.type === '使用场景词' || row.type === '场景词' ? 18 : 8;
  const sourceScore = row.source === '竞品标签' ? 24 : row.source === '我的候选标签' ? 8 : row.source === '证据包' ? 10 : 0;
  return statusScore + typeScore + sourceScore + row.priority;
}

function topicIntentKey(row) {
  const key = topicTagKey(row.formattedTag || row.text);
  if (key === 'сумка') return 'generic:bag';
  if (key === 'пикник' || key === 'для пикника' || key.includes('для пикника')) return 'scene:picnic';
  if (key === 'кемпинг' || key.includes('для кемпинга')) return 'scene:camping';
  if (key === 'пляж' || key.includes('для пляжа')) return 'scene:beach';
  return key;
}

function dedupeByIntent(rows) {
  const intentSeen = new Map();
  const keptRows = [];
  const duplicateRows = [];

  rows.forEach(row => {
    const intentKey = topicIntentKey(row);
    if (!intentKey) return;

    if (intentSeen.has(intentKey)) {
      const kept = intentSeen.get(intentKey);
      duplicateRows.push({
        ...row,
        status: row.status === '不建议使用' ? row.status : '不建议使用',
        riskLevel: row.riskLevel === '高' ? row.riskLevel : '中',
        reason: `${row.reason} 与“${kept.formattedTag || kept.text}”表达相近，最终清单只保留更精准的一条。`,
        issues: uniqueList((row.issues || []).concat(['duplicate-intent']), 10)
      });
      return;
    }

    intentSeen.set(intentKey, row);
    keptRows.push(row);
  });

  return { keptRows, duplicateRows };
}

function buildTopicFinalPlan(rows) {
  const seen = new Map();
  const duplicateRows = [];
  const sortedRows = rows.slice().sort((a, b) => topicRowSortScore(b) - topicRowSortScore(a));

  sortedRows.forEach(row => {
    const key = topicTagKey(row.formattedTag || row.text);
    if (!key) return;
    if (seen.has(key)) {
      duplicateRows.push({
        ...row,
        status: row.status === '不建议使用' ? row.status : '不建议使用',
        riskLevel: '中',
        reason: `${row.reason} 与“${seen.get(key).text}”重复，最终清单只保留一个。`,
        issues: uniqueList((row.issues || []).concat(['duplicate']), 10)
      });
      return;
    }
    seen.set(key, row);
  });

  const intentResult = dedupeByIntent(Array.from(seen.values()));
  const dedupedRows = intentResult.keptRows;
  const finalRows = dedupedRows
    .filter(row => ['推荐使用', '可选使用'].includes(row.status))
    .filter(row => isValidFormattedTag(row.formattedTag, row.bannedWords || []))
    .filter(row => !row.issues.includes('banned-word') && !row.issues.includes('too-broad') && !row.issues.includes('mismatch'))
    .slice(0, TOPIC_FINAL_TAG_TARGET);
  const backupRows = dedupedRows
    .filter(row => row.status === '需要人工确认')
    .filter(row => row.charCount <= TOPIC_FINAL_TAG_MAX_LENGTH)
    .slice(0, 12);
  const rejectedRows = dedupedRows
    .filter(row => row.status === '不建议使用')
    .concat(duplicateRows, intentResult.duplicateRows)
    .slice(0, 40);

  return { finalRows, backupRows, rejectedRows, detailRows: finalRows.concat(backupRows, rejectedRows) };
}

function getTopicCoreTerms(reportParts) {
  const rows = reportParts.sourceRows.competitorRows
    .concat(reportParts.plan.finalRows, reportParts.systemRows)
    .filter(row => row.type === '核心产品词' || /эндоскоп|термосумка|сумка холодильник|сумка для обеда/.test(topicTagKey(row.text)));
  const preferred = rows
    .filter(row => isValidFormattedTag(row.formattedTag, row.bannedWords || []))
    .map(row => row.formattedTag || formatOzonTag(row.text));
  return uniqueList(preferred, 5);
}

function buildTopicConfirmationItems(input, missing, plan) {
  const items = [];
  if (missing.length) items.push(`缺失信息：${missing.join('、')}。`);
  if (plan.backupRows.some(row => /нужно|需确认|确认|俄语|manual|candidate/.test(row.reason))) items.push('俄语表达或翻译不确定的词需要在 Ozon 搜索结果中复核。');
  if (!input.category) items.push('类目未确认，可能影响主题标签边界。');
  if (!input.specification && topicDetectProfile(input).mechanical) items.push('型号 / 规格 / 适配对象不足，工具或配件类标签可能不够精准。');
  if (!input.competitorTags) items.push('未提供 Ozon 竞品主题标签，当前结果会更依赖本地规则。');
  if (!items.length) items.push('仍需人工确认俄语语义、型号规格、类目边界和 Ozon 搜索结果是否一致。');
  return uniqueList(items, 8);
}

function formatTopicAnalysisRows(rows, fallback) {
  if (!rows.length) return fallback;
  const keep = rows.filter(row => ['推荐使用', '可选使用'].includes(row.status)).map(row => row.formattedTag);
  const revise = rows.filter(row => row.status === '需要人工确认').map(row => row.formattedTag);
  const remove = rows.filter(row => row.status === '不建议使用').map(row => row.formattedTag);
  return [
    keep.length ? `可借鉴 / 保留：${keep.slice(0, 8).join('、')}` : '',
    revise.length ? `修改或确认：${revise.slice(0, 8).join('、')}` : '',
    remove.length ? `应避免 / 删除：${remove.slice(0, 8).join('、')}` : ''
  ].filter(Boolean).join('\n') || fallback;
}

function buildTopicSynonymNotes(rows) {
  const texts = rows.map(row => topicTagKey(row.text));
  const notes = [];
  if (texts.includes('термосумка') && texts.includes('сумка холодильник')) {
    notes.push('相近意图：термосумка 作为主核心词；сумка холодильник 可作替代核心词；带 35л、для пикника、для кемпинга 的组合更适合长尾精准流量。');
  }
  if (texts.includes('пикник') && texts.includes('для пикника')) {
    notes.push('相近意图：пикник 是场景词；для пикника 更适合和产品词组合成长尾。');
  }
  if (texts.includes('сумка') && texts.some(text => text.includes('термосумка') || text.includes('сумка холодильник'))) {
    notes.push('重复/过宽：сумка 单独使用过泛，已由更具体的 термосумка / сумка холодильник 覆盖。');
  }
  return notes.join('\n');
}

function formatTopicRejectedRows(rows) {
  if (!rows.length) return '暂未识别需要排除的标签。仍需人工检查品牌词、平台词和错配词。';
  const shortReason = row => {
    if (row.issues.includes('too-broad')) return '过泛';
    if (row.issues.includes('mismatch')) return '错配';
    if (row.issues.includes('contains-chinese')) return '含中文';
    if (row.issues.includes('banned-word')) return '禁用词';
    if (row.issues.includes('too-long')) return `超过 ${TOPIC_FINAL_TAG_MAX_LENGTH} 字符`;
    if (row.issues.includes('unsafe-punctuation')) return '不安全标点';
    if (row.issues.includes('duplicate-intent')) return '重复意图';
    if (row.issues.includes('duplicate')) return '重复';
    if (row.issues.includes('needs-manual-confirmation')) return '需确认';
    return row.riskLevel || '风险';
  };
  const summarizeItems = items => {
    const visible = items.slice(0, 5).map(row => `${row.formattedTag || formatOzonTag(row.text)}（${shortReason(row)}）`);
    const extra = items.length > visible.length ? `；另 ${items.length - visible.length} 个` : '';
    return `${visible.join('、')}${extra}`;
  };
  const buckets = [
    { label: '过于宽泛', issue: 'too-broad' },
    { label: '类目错配 / 与产品不符', issue: 'mismatch' },
    { label: '包含中文', issue: 'contains-chinese' },
    { label: '包含品牌词 / 禁用词 / 平台词', issue: 'banned-word' },
    { label: '超过 30 字符', issue: 'too-long' },
    { label: '不安全标点', issue: 'unsafe-punctuation' },
    { label: '重复意图', issue: 'duplicate-intent' },
    { label: '重复标签', issue: 'duplicate' },
    { label: '需要人工确认', issue: 'needs-manual-confirmation' }
  ];
  const lines = buckets.map(bucket => {
    const items = rows
      .filter(row => row.issues.includes(bucket.issue))
      .slice(0, 20);
    return items.length ? `${bucket.label}：${summarizeItems(items)}` : '';
  }).filter(Boolean);

  const covered = new Set();
  buckets.forEach(bucket => {
    rows.filter(row => row.issues.includes(bucket.issue)).forEach(row => covered.add(row));
  });
  const other = rows.filter(row => !covered.has(row)).slice(0, 8);
  if (other.length) {
    lines.push(`其他风险：${summarizeItems(other)}`);
  }

  return lines.join('\n');
}

function buildTopicTagReport(input) {
  const corpus = topicTextCorpus(input);
  const core = [];
  const scene = [];
  const attribute = [];
  const audience = [];
  const matchedRuleIds = [];

  TOPIC_TAG_RULES.forEach(rule => {
    if (!topicTextHasRule(corpus, rule)) return;
    matchedRuleIds.push(rule.id);
    rule.tags.forEach(tagRule => {
      rule.roles.forEach(role => {
        if (role === 'conversion') return;
        const tag = buildTopicTag(tagRule.text, role, { ...tagRule, reason: tagRule.reason }, corpus);
        if (role === 'core') addTopicTag(core, tag);
        if (role === 'scene') addTopicTag(scene, tag);
        if (role === 'attribute') addTopicTag(attribute, tag);
        if (role === 'audience') addTopicTag(audience, tag);
      });
    });
  });

  extractCustomTopicTerms(input.competitorKeywords, '卖家提供的竞品关键词，建议人工确认相关性。', 10).forEach(item => {
    if (!core.some(tag => tag.text === item.text) && !scene.some(tag => tag.text === item.text) && !attribute.some(tag => tag.text === item.text)) {
      addTopicTag(scene, { ...item, reason: item.reason + ' 若是产品词，可移入核心标签；若是场景词，可作为扩展标签。' });
    }
  });

  const avoid = buildTopicAvoidTags(input, corpus, matchedRuleIds);
  const spec = buildTopicSpecTags(input, core);
  const longTail = buildTopicLongTail(core, scene, attribute, input).concat(spec.filter(tag => tag.role === 'longTail'));
  const groups = { core, scene, attribute: attribute.concat(spec.filter(tag => tag.role === 'spec')), audience, longTail, avoid };
  const bannedWords = getTopicBannedWords(input);
  const sourceRows = buildTopicSourceRows(input, bannedWords, matchedRuleIds);
  const systemRows = topicRowsFromGroup(groups.core.concat(groups.scene, groups.attribute, groups.audience, groups.longTail), input, bannedWords, matchedRuleIds);
  const avoidRows = groups.avoid.map(tag => buildTopicCandidateRow(tag.text, {
    input,
    bannedWords,
    matchedRuleIds,
    source: '系统补充',
    reason: tag.reason,
    status: '不建议使用',
    riskLevel: '高',
    priority: 1
  }));
  const plan = buildTopicFinalPlan(sourceRows.competitorRows.concat(systemRows, sourceRows.candidateRows, avoidRows));
  const chineseReference = collectTopicChineseReference(input, plan.detailRows);
  const scores = buildTopicScores(groups, input, matchedRuleIds, plan.finalRows, plan.rejectedRows);
  const combinations = buildTopicCombinations(groups);
  const missing = [];
  const productType = getTopicProductType(input, matchedRuleIds);
  const profile = topicDetectProfile(input);

  if (!input.title) missing.push('商品标题');
  if (!input.category) missing.push('产品类目');
  if (!input.specification && profile.mechanical) missing.push('规格 / 型号 / 适配信息');
  if (!input.usageScene && !scene.length) missing.push('使用场景');
  if (!input.material && !attribute.length) missing.push('材质 / 属性');
  if (!input.evidencePack && !input.competitorTags && !input.competitorKeywords) missing.push('竞品标题、竞品标签或搜索词');

  const coreTerms = getTopicCoreTerms({ sourceRows, plan, systemRows });
  const mainDirection = coreTerms.length
    ? `优先围绕 ${coreTerms.slice(0, 3).join('、')} 做核心产品词，并用规格、场景、功能做长尾。`
    : '核心产品词不足，先补准确产品名称，避免直接使用泛标签。';
  const evidenceStatus = missing.length
    ? `仍缺少：${missing.join('、')}。`
    : '当前证据足够生成 v1.0 Ozon 标签策略，但俄语词仍需平台搜索复核。';
  const confirmationItems = buildTopicConfirmationItems(input, missing, plan);
  const finalNote = plan.finalRows.length < TOPIC_FINAL_TAG_TARGET
    ? '未用弱词凑满。建议补充更多竞品标签、型号、规格或适配场景后再扩展。'
    : '已达到 30 个标签上限，建议先复制当前清单并继续人工复核。';

  return {
    status: plan.finalRows.length ? '已生成 Ozon 标签方案' : '需要补充核心信息',
    summary: `${productType.label}。${mainDirection}${productType.strategy}${evidenceStatus}`,
    productType,
    coreTerms,
    finalNote,
    groups,
    scores,
    combinations,
    plan,
    chineseReference,
    competitorPriority: input.competitorTags
      ? '已优先分析竞品主题标签。竞品标签有价值，是因为它们展示了相似商品已经如何在 Ozon 流量入口描述自己。'
      : '未粘贴竞品主题标签；建议补充 Ozon 相似商品标签后再扩展。',
    competitorAnalysis: [formatTopicDecompositionRows(sourceRows.competitorRows, '未粘贴竞品主题标签。'), buildTopicSynonymNotes(sourceRows.competitorRows)].filter(Boolean).join('\n'),
    candidateAnalysis: [formatTopicAnalysisRows(sourceRows.candidateRows, '未粘贴我的候选标签。'), buildTopicSynonymNotes(sourceRows.candidateRows)].filter(Boolean).join('\n'),
    rejectedAnalysis: formatTopicRejectedRows(plan.rejectedRows),
    warnings: uniqueList([
      TOPIC_TAG_BOUNDARY_TEXT,
      productType.trafficLogic,
      `当前可推荐标签：${plan.finalRows.length} / ${TOPIC_FINAL_TAG_TARGET}。`,
      finalNote,
      confirmationItems.join(' '),
      groups.avoid.length ? `建议避开：${groups.avoid.slice(0, 4).map(tag => tag.text).join('、')}。` : '',
      '不要把这些建议当作平台官方标签库或真实搜索量。'
    ], 8)
  };
}

function renderTopicScoreCards(scores) {
  const container = document.getElementById('topicTagScores');
  if (!container) return;

  container.textContent = '';
  container.hidden = !Array.isArray(scores) || !scores.length;
  if (!scores || !scores.length) return;

  scores.forEach(item => {
    const score = topicScore(item.score);
    const card = document.createElement('div');
    card.className = 'topic-score-card';
    card.dataset.scoreBand = score >= 75 ? 'good' : score >= 55 ? 'watch' : 'risk';

    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = `${score} / 100`;
    const reason = document.createElement('p');
    reason.textContent = item.reason;
    card.append(label, value, reason);
    container.appendChild(card);
  });
}

function renderTopicTagDetailTable(rows) {
  const tbody = document.getElementById('topicTagDetailTableBody');
  if (!tbody) return;
  tbody.textContent = '';

  if (!rows || !rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = '等待生成。';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.dataset.status = row.status;
    [row.formattedTag || formatOzonTag(row.text), row.type, row.source, row.charCount, row.status, row.reason].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function formatTopicBackupRows(rows) {
  if (!rows || !rows.length) return '候补标签：需要人工确认 暂无。';
  const items = rows.map(row => {
    if (topicContainsCjk(row.text)) return `${row.text}（需要翻译确认）`;
    return row.formattedTag || formatOzonTag(row.text);
  });
  return `候补标签：需要人工确认 ${items.join('、')}`;
}

function formatTopicChineseReference(items) {
  if (!items || !items.length) return '暂无中文参考词。';
  return items.map(item => `${item}：只作为中文证据，需要翻译确认后再使用。`).join('\n');
}

function renderTopicTagReport(report) {
  const card = document.getElementById('topicTagReport');
  if (!card || !report) return;

  card.classList.remove('selection-waiting', 'selection-risk', 'selection-warning', 'selection-test');
  card.classList.add(report.plan.finalRows.length ? 'selection-test' : 'selection-warning');
  setText('topicTagStatus', report.status);
  setText('topicTagSummary', report.summary);
  setText('topicProductTypeInsight', `${report.productType.label}：${report.productType.why}\n${report.productType.trafficLogic}`);
  setText('topicCompetitorPriorityInsight', report.competitorPriority);
  setText('topicCoreTermInsight', report.coreTerms.length ? report.coreTerms.join('\n') : '未能确认核心产品词。请补充 Ozon 竞品主题标签或更准确产品名称。');
  setText('topicStrategyInsight', report.productType.strategy);
  setText('topicFinalTagCount', `当前可推荐标签：${report.plan.finalRows.length} / ${TOPIC_FINAL_TAG_TARGET}`);
  setText('topicFinalTagBlock', report.plan.finalRows.length ? report.plan.finalRows.map(row => row.formattedTag).join('\n') : '没有足够证据生成可直接复制的标签。');
  setText('topicFinalTagNote', report.finalNote);
  setText('topicBackupTags', formatTopicBackupRows(report.plan.backupRows));
  setText('topicChineseReference', formatTopicChineseReference(report.chineseReference));
  renderTopicScoreCards(report.scores);
  renderTopicTagDetailTable(report.plan.detailRows);
  setText('topicCompetitorTagAnalysis', report.competitorAnalysis);
  setText('topicCandidateTagAnalysis', report.candidateAnalysis);
  setText('topicRejectedTags', report.rejectedAnalysis);
  setText('topicCoreTags', formatTopicTagDetails(report.groups.core, '未识别核心产品标签。请补准确产品名称，例如“保温包 / 午餐包 / 收纳盒”。'));
  setText('topicSceneTags', formatTopicTagDetails(report.groups.scene, '未识别场景标签。请补野餐、露营、旅行、厨房、家用等使用场景。'));
  setText('topicAttributeTags', formatTopicTagDetails(report.groups.attribute, '未识别属性标签。请补材质、容量、尺寸、功能、颜色或结构。'));
  setText('topicAudienceTags', formatTopicTagDetails(report.groups.audience, '未识别人群或用途标签。只有证据支持时才建议使用。'));
  setText('topicLongTailTags', formatTopicTagDetails(report.groups.longTail, '长尾标签不足。请补产品词、场景词和属性词。'));
  setText('topicAvoidTags', formatTopicTagDetails(report.groups.avoid, '暂未识别需要避开的泛标签。仍需人工检查是否有错配词。'));
  setText('topicPrecisionGroup', `${formatTopicTags(report.combinations.precision.tags.map(text => ({ text })), '未生成。')}\n${report.combinations.precision.explanation}`);
  setText('topicExpansionGroup', `${formatTopicTags(report.combinations.expansion.tags.map(text => ({ text })), '未生成。')}\n${report.combinations.expansion.explanation}`);
  setText('topicConversionGroup', `${formatTopicTags(report.combinations.conversion.tags.map(text => ({ text })), '未生成。')}\n${report.combinations.conversion.explanation}`);

  const warnings = document.getElementById('topicTagWarnings');
  if (warnings) {
    warnings.textContent = '';
    report.warnings.forEach(warning => {
      const li = document.createElement('li');
      li.textContent = warning;
      warnings.appendChild(li);
    });
  }
}

function generateTopicTagReport() {
  const report = buildTopicTagReport(getTopicTagInput());
  renderTopicTagReport(report);
  persistFormState();

  window.requestAnimationFrame(() => {
    scrollToWorkspaceElement('topicTagReport');
  });
}

function bindTopicTagAssistantControls() {
  const button = document.getElementById('generateTopicTagsButton');
  if (!button) return;
  button.addEventListener('click', generateTopicTagReport);
}

function scrollToWorkspaceElement(id) {
  const el = document.getElementById(id);
  if (!el || typeof el.scrollIntoView !== 'function') return;
  el.scrollIntoView({ behavior: 'auto', block: 'center' });
}

function hasValidProfitDecisionSnapshot(profitSnapshot = lastProfitSnapshot) {
  const sale = readNumber('salePrice');
  const purchaseCost = readNumber('purchaseCost');
  const weight = readNumber('weight');
  const rubRate = readNumber('rubRate');

  return Boolean(
    profitSnapshot &&
    profitSnapshot.mainInputValid &&
    !sale.empty &&
    !purchaseCost.empty &&
    !weight.empty &&
    !rubRate.empty &&
    sale.value > 0 &&
    purchaseCost.value > 0 &&
    weight.value > 0 &&
    rubRate.value > 0
  );
}

function getDecisionDataValidation(profitSnapshot = lastProfitSnapshot) {
  const manualProduct = getManualProductInput();
  const hasSourceCost = Number.isFinite(manualProduct.sourceCost) && manualProduct.sourceCost > 0;
  const hasTargetSellingPrice = Number.isFinite(manualProduct.targetSellingPrice) && manualProduct.targetSellingPrice > 0;
  const hasProfitSnapshot = hasValidProfitDecisionSnapshot(profitSnapshot);
  const hasManualCoreProfitInputs = hasSourceCost && hasTargetSellingPrice;
  const hasFullDecisionData = hasManualCoreProfitInputs;
  const shouldWarn = !hasFullDecisionData;

  return {
    hasSourceCost,
    hasTargetSellingPrice,
    hasProfitSnapshot,
    hasManualCoreProfitInputs,
    hasFullDecisionData,
    shouldWarn,
    message: shouldWarn ? DECISION_DATA_WARNING_TEXT : ''
  };
}

function renderDecisionDataValidation(validation) {
  const warning = document.getElementById('decisionValidationWarning');
  const sourceCostInput = document.getElementById('manualSourceCost');
  const targetPriceInput = document.getElementById('targetSellingPriceInput');

  [sourceCostInput, targetPriceInput].forEach(input => {
    if (input) input.classList.remove('input-warning');
  });

  if (!warning) return;

  if (!validation || !validation.shouldWarn) {
    warning.hidden = true;
    warning.textContent = '';
    return;
  }

  warning.hidden = false;
  warning.textContent = validation.message;

  if (!validation.hasSourceCost && sourceCostInput) sourceCostInput.classList.add('input-warning');
  if (!validation.hasTargetSellingPrice && targetPriceInput) targetPriceInput.classList.add('input-warning');
}

function refreshDecisionDataValidationIfVisible() {
  const warning = document.getElementById('decisionValidationWarning');
  if (!warning || warning.hidden) return;
  renderDecisionDataValidation(getDecisionDataValidation(lastProfitSnapshot));
}

function setAutoAnalysisStatus(message, type = '') {
  const el = document.getElementById('autoAnalysisStatus');
  if (!el) return;

  el.classList.remove('is-loading', 'is-error');
  if (type) el.classList.add(type);
  el.textContent = message;
}

function setProductLinkPreviewStatus() {
  const sourceUrl = fieldValue('sourceProductUrl');

  if (!sourceUrl) {
    setAutoAnalysisStatus('来源链接为空；你仍可以直接填写商品信息并生成测品决策报告。');
    renderAiAnalysisStatusModel();
    return;
  }

  try {
    const parsed = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid');
    const workerConfigured = hasConfiguredWorkerUrl();
    setAutoAnalysisStatus(workerConfigured
      ? '已接收可选链接。点击提取按钮后会尝试读取公开商品信息。'
      : '已接收可选链接。当前未配置 Worker，报告仍会基于商品卡片、公开观察和利润快照生成。');
  } catch (error) {
    setAutoAnalysisStatus('商品链接格式不正确，请填写 http 或 https URL。', 'is-error');
  }

  renderAiAnalysisStatusModel();
}

function setAutoAnalysisProgress(activeStep, doneSteps = []) {
  document.querySelectorAll('#autoAnalysisProgress [data-step]').forEach(step => {
    const name = step.dataset.step;
    step.classList.toggle('is-active', name === activeStep);
    step.classList.toggle('is-done', doneSteps.includes(name));
  });
}

const productCategorySuggestionRules = [
  {
    category: '服饰',
    keywords: ['clothing', 'apparel', 'shirt', 't-shirt', 'dress', 'pants', 'jeans', 'hoodie', 'jacket', 'coat', 'skirt', 'top', 'blouse', 'sweater', '服装', '服饰', '衣服', '上衣', '外套', '连衣裙', '裤', '牛仔', '卫衣', '毛衣', '短袖', 't恤']
  },
  {
    category: '鞋靴',
    keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'slipper', 'slippers', 'sandal', 'sandals', 'boot', 'boots', 'footwear', '鞋', '拖鞋', '凉鞋', '运动鞋', '靴']
  },
  {
    category: '母婴童装',
    keywords: ['baby', 'kids', 'kid', 'children', 'child', 'toddler', 'infant', 'newborn', 'maternity', '婴儿', '宝宝', '儿童', '童装', '母婴', '新生儿', '亲子']
  },
  {
    category: '3C配件',
    keywords: ['phone', 'case', 'cable', 'charger', 'adapter', 'usb', 'type-c', 'type c', 'earphone', 'headphone', 'screen protector', '手机', '手机壳', '数据线', '充电器', '充电线', '耳机', '贴膜', '保护壳', '3c']
  },
  {
    category: '饰品',
    keywords: ['jewelry', 'jewellery', 'necklace', 'earrings', 'earring', 'bracelet', 'ring', 'hair clip', 'pendant', '首饰', '饰品', '项链', '耳环', '耳饰', '手链', '戒指', '发夹', '吊坠']
  },
  {
    category: '家居百货',
    keywords: ['kitchen', 'storage', 'organizer', 'home', 'household', 'container', 'rack', 'basket', 'cleaning', 'bathroom', '厨房', '收纳', '置物', '整理', '家居', '百货', '储物', '清洁', '浴室', '厨房用品']
  }
];

function normalizeSourcePreviewUrl(value) {
  return String(value || '').trim();
}

function getPreviewRequestedUrl(preview) {
  if (!preview || typeof preview !== 'object') return '';
  return normalizeSourcePreviewUrl(preview.requestedUrl || preview.inputUrl || '');
}

function sourcePreviewBelongsToUrl(preview, sourceUrl) {
  const requestedUrl = getPreviewRequestedUrl(preview);
  const currentUrl = normalizeSourcePreviewUrl(sourceUrl);
  if (requestedUrl) return requestedUrl === currentUrl;
  return Boolean(preview && preview.source && normalizeSourcePreviewUrl(preview.source.url) === currentUrl);
}

function sourceInputStillMatches(sourceUrl) {
  return normalizeSourcePreviewUrl(fieldValue('sourceProductUrl')) === normalizeSourcePreviewUrl(sourceUrl);
}

function sourceRequestStillCurrent(sourceUrl, requestId) {
  return sourceInputStillMatches(sourceUrl) && sourcePreviewState.activeRequestId === requestId;
}

function formatExtractedSourcePrice(source) {
  if (!source || source.price === null || source.price === undefined || source.price === '') return '未识别价格';

  const price = Number(source.price);
  const priceText = Number.isFinite(price) ? price.toFixed(2) : String(source.price);
  return `${source.currency || '未识别币种'} ${priceText}`;
}

function formatMoneyField(field, fallbackCurrency = '') {
  if (!field || field.value === null || field.value === undefined || field.value === '') return '未识别';
  const value = Number(field.value);
  const valueText = Number.isFinite(value) ? value.toFixed(2) : String(field.value);
  return `${field.currency || fallbackCurrency || '未识别币种'} ${valueText}`;
}

function formatConfidenceField(field) {
  if (!field || !field.value) return '未识别';
  return `${field.value}（${field.confidence || 'low'}）`;
}

function getSourcePriceRoleNotice(source) {
  if (!source) return '未能自动识别价格，请手动确认或补充。';
  if (source.price === null || source.price === undefined || source.price === '') return '未能自动识别价格，请手动确认或补充。';
  if (source.priceRole === 'candidate_source_cost') return '识别到的是候选采购价，请确认是否为真实拿货成本。';
  if (source.priceRole === 'market_reference_price') return '识别到的是平台销售参考价，不等于你的采购成本。';
  return '识别到公开页面价格，但用途未知，请人工确认它是采购价还是销售参考价。';
}

function formatExtractionConfidence(source) {
  const confidence = source && source.confidence ? source.confidence : {};
  return `标题 ${confidence.title || 'none'} / 价格 ${confidence.price || 'none'} / 类目 ${confidence.category || 'none'}`;
}

function formatExtractionSources(source) {
  const sources = source && source.extractionSources ? source.extractionSources : {};
  const parts = [];
  if (sources.title) parts.push(`标题来源：${sources.title}`);
  if (sources.price) parts.push(`价格来源：${sources.price}`);
  if (sources.image) parts.push(`图片来源：${sources.image}`);
  if (sources.category) parts.push(`类目来源：${sources.category}`);
  return parts.join('；') || '暂无可显示的提取来源';
}

function renderSourceExtractionDetails(preview) {
  const el = document.getElementById('sourceExtractionDetails');
  if (!el) return;

  el.classList.remove('is-warning', 'is-error');

  if (!preview || !preview.source) {
    el.textContent = '自动识别商品信息会显示在这里。';
    return;
  }

  const source = preview.source;
  const priceNotice = getSourcePriceRoleNotice(source);
  const platformText = `${source.platform || source.host || '未知平台'} / ${source.platformType || 'unknown'}`;
  const priceText = formatExtractedSourcePrice(source);
  const categoryText = source.categorySuggestion ? `类目建议：${source.categorySuggestion}` : '类目建议：未识别';
  const statusText = preview.ok ? '识别成功' : (preview.message || '识别失败');
  const shippingText = source.shippingFee && source.shippingFee.value !== null
    ? formatMoneyField(source.shippingFee, source.currency)
    : '运费未能自动识别，请后续确认。';
  const totalText = source.totalCandidateSourceCost && source.totalCandidateSourceCost.value !== null
    ? formatMoneyField(source.totalCandidateSourceCost, source.currency)
    : source.platformType === 'supplier'
      ? '价格或运费缺失，未计算总候选采购成本。'
      : '仅供应商/货源页在价格和运费都可见时计算。';
  const specs = Array.isArray(source.specifications) ? source.specifications.slice(0, 6) : [];
  const details = Array.isArray(source.productDetails) ? source.productDetails.slice(0, 6) : [];
  const manualNeeded = Array.isArray(source.manualConfirmationNeeded)
    ? source.manualConfirmationNeeded
    : preview.analysis && Array.isArray(preview.analysis.manualConfirmationNeeded)
      ? preview.analysis.manualConfirmationNeeded
      : [];

  if (!preview.ok) {
    el.classList.add('is-error');
  } else if (source.priceRole === 'candidate_source_cost' || source.priceRole === 'market_reference_price' || source.price === null) {
    el.classList.add('is-warning');
  }

  el.textContent = '';

  const title = document.createElement('div');
  title.className = 'extraction-panel-title';
  title.textContent = statusText;
  el.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'extraction-result-grid';
  const items = [
    ['平台', platformText],
    ['平台类型', source.platformType || 'unknown'],
    ['商品标题', source.title || '未识别标题'],
    ['价格', priceText],
    ['价格角色', `${source.priceRole || 'unknown'}。${priceNotice}`],
    ['运费', shippingText],
    ['总候选采购成本', totalText],
    ['币种', source.currency || (source.shippingFee && source.shippingFee.currency) || '未识别'],
    ['类目建议', source.categorySuggestion || '未识别'],
    ['材质', formatConfidenceField(source.material) === '未识别' ? '材质未能自动识别。' : formatConfidenceField(source.material)],
    ['用途', formatConfidenceField(source.usage)],
    ['场景', formatConfidenceField(source.scene)],
    ['提取置信度', source.extractionConfidence || formatExtractionConfidence(source)],
    ['提取来源', source.extractionSource || formatExtractionSources(source)]
  ];

  items.forEach(([label, value]) => {
    const cell = document.createElement('div');
    const labelEl = document.createElement('span');
    const valueEl = document.createElement('strong');
    labelEl.textContent = label;
    valueEl.textContent = value;
    cell.appendChild(labelEl);
    cell.appendChild(valueEl);
    grid.appendChild(cell);
  });

  const specsCell = document.createElement('div');
  specsCell.className = 'extraction-wide';
  const specsLabel = document.createElement('span');
  specsLabel.textContent = '基础商品细节 / 规格';
  specsCell.appendChild(specsLabel);

  if (specs.length || details.length) {
    const list = document.createElement('ul');
    list.className = 'extraction-spec-list';
    (specs.length ? specs.map(item => `${item.name}: ${item.value}`) : details).forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      list.appendChild(li);
    });
    specsCell.appendChild(list);
  } else {
    const p = document.createElement('p');
    p.textContent = '公开页面未返回可用规格。';
    specsCell.appendChild(p);
  }
  grid.appendChild(specsCell);

  if (!preview.ok || source.failureReason) {
    const failureCell = document.createElement('div');
    failureCell.className = 'extraction-wide';
    const failureLabel = document.createElement('span');
    const failureText = document.createElement('p');
    failureLabel.textContent = '失败原因 / 读取限制';
    failureText.textContent = source.failureReason || preview.message || '该平台可能限制自动读取。你可以补充截图文字、商品描述或运营疑问，系统会基于已识别内容继续分析。';
    failureCell.appendChild(failureLabel);
    failureCell.appendChild(failureText);
    grid.appendChild(failureCell);
  }

  if (manualNeeded.length) {
    const needCell = document.createElement('div');
    needCell.className = 'extraction-wide';
    const needLabel = document.createElement('span');
    const needText = document.createElement('p');
    needLabel.textContent = '需要人工确认';
    needText.textContent = manualNeeded.join('、');
    needCell.appendChild(needLabel);
    needCell.appendChild(needText);
    grid.appendChild(needCell);
  }

  el.appendChild(grid);
}

function resetSourcePreviewTracking() {
  sourcePreviewState.lastPreviewUrl = '';
  sourcePreviewState.activeRequestUrl = '';
  sourcePreviewState.lastRequestId = 0;
  sourcePreviewState.activeRequestId = 0;
  sourcePreviewState.currentPreview = null;
  sourcePreviewState.lastAutoFilledTitle = '';
  sourcePreviewState.lastAutoFilledImage = '';
  sourcePreviewState.lastAutoFilledSourceCost = '';
  sourcePreviewState.lastSuggestedCategory = '';
  sourcePreviewState.isTitleAutoFilledFromPreview = false;
  sourcePreviewState.isImageAutoFilledFromPreview = false;
  sourcePreviewState.isSourceCostAutoFilledFromPreview = false;
  sourcePreviewState.isCategorySuggestedFromAssist = false;
}

function renderWaitingProductSelectionReport(message) {
  renderProductSelectionReport({
    type: 'waiting',
    status: '等待商品信息',
    summary: message || '填写商品基础信息、公开市场观察和产品卡片质量后，可以直接生成测品决策报告；来源链接只是可选辅助。',
    priceText: '等待目标平台、类目、使用场景和竞品价格带。',
    profitText: '等待标题、主图、卖点、材质和类目匹配判断。',
    competitionText: '等待公开市场和评价信任观察。',
    adText: '等待利润计算器快照、采购成本和物流风险输入。',
    storeText: '后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。',
    actions: ['先填写商品基础信息、采购成本、类目和利润计算器基础数据。']
  });
}

function clearAutoFilledSourcePreviewFields() {
  if (
    sourcePreviewState.isTitleAutoFilledFromPreview &&
    fieldValue('manualProductTitle') === sourcePreviewState.lastAutoFilledTitle
  ) {
    setInput('manualProductTitle', '');
  }

  if (
    sourcePreviewState.isImageAutoFilledFromPreview &&
    fieldValue('imageUrl') === sourcePreviewState.lastAutoFilledImage
  ) {
    setInput('imageUrl', '');
    renderProductImagePreview('');
  }

  if (
    sourcePreviewState.isSourceCostAutoFilledFromPreview &&
    fieldValue('manualSourceCost') === sourcePreviewState.lastAutoFilledSourceCost
  ) {
    setInput('manualSourceCost', '');
  }

  if (
    sourcePreviewState.isCategorySuggestedFromAssist &&
    fieldValue('manualProductCategory') === sourcePreviewState.lastSuggestedCategory
  ) {
    setInput('manualProductCategory', '');
  }

  resetSourcePreviewTracking();
}

function clearSourcePreviewDisplay() {
  setText('sourceProductInsight', '来源链接提取未使用或已清空；可直接用商品卡片信息生成报告。');
  setText('sourceKeywordInsight', '关键词和主题标签等待可选链接提取或手动补充。');
  setText('ozonApiInsight', '可选 Ozon 店铺商品摘要未连接，不影响本次测品建议。');
  setText('analysisLimitInsight', '后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。');
  renderSourceExtractionDetails(null);
  renderProductImagePreview('');
}

function handleSourceUrlChanged() {
  const currentUrl = normalizeSourcePreviewUrl(fieldValue('sourceProductUrl'));
  const trackedUrl = normalizeSourcePreviewUrl(sourcePreviewState.lastPreviewUrl || sourcePreviewState.activeRequestUrl);
  const urlChanged = trackedUrl && trackedUrl !== currentUrl;
  currentExtractionRequestId += 1;

  if (urlChanged) {
    clearAutoFilledSourcePreviewFields();
  } else {
    resetSourcePreviewTracking();
  }

  lastOzonAutoAnalysis = null;
  clearSourcePreviewDisplay();
  renderProductSelection(lastProfitSnapshot);
  setProductLinkPreviewStatus();
  setAutoAnalysisProgress('', []);
}

function handleManualTitleChanged() {
  if (
    sourcePreviewState.isTitleAutoFilledFromPreview &&
    fieldValue('manualProductTitle') !== sourcePreviewState.lastAutoFilledTitle
  ) {
    sourcePreviewState.isTitleAutoFilledFromPreview = false;
    sourcePreviewState.lastAutoFilledTitle = '';
  }
}

function handleManualImageChanged() {
  if (
    sourcePreviewState.isImageAutoFilledFromPreview &&
    fieldValue('imageUrl') !== sourcePreviewState.lastAutoFilledImage
  ) {
    sourcePreviewState.isImageAutoFilledFromPreview = false;
    sourcePreviewState.lastAutoFilledImage = '';
  }
}

function handleManualCategoryChanged() {
  if (
    sourcePreviewState.isCategorySuggestedFromAssist &&
    fieldValue('manualProductCategory') !== sourcePreviewState.lastSuggestedCategory
  ) {
    sourcePreviewState.isCategorySuggestedFromAssist = false;
    sourcePreviewState.lastSuggestedCategory = '';
  }
}

function handleManualSourceCostChanged() {
  if (
    sourcePreviewState.isSourceCostAutoFilledFromPreview &&
    fieldValue('manualSourceCost') !== sourcePreviewState.lastAutoFilledSourceCost
  ) {
    sourcePreviewState.isSourceCostAutoFilledFromPreview = false;
    sourcePreviewState.lastAutoFilledSourceCost = '';
  }
}

function normalizeAssistText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function extractTitleFromPastedProductText(value) {
  const lines = String(value || '')
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^(价格|售价|采购价|批发价|促销价|区间价|起批价|price|cost|sale price)\s*[:：-]/i.test(line)) continue;

    const withoutLabel = line.replace(/^(商品标题|标题|品名|product title|title)\s*[:：-]\s*/i, '').trim();
    const clean = withoutLabel.replace(/[|｜]{2,}/g, ' ').trim();

    if (!clean) continue;
    if (/^https?:\/\//i.test(clean)) continue;
    if (/^[¥$€₽\d\s.,~\-起批价促销价区间价格price]+$/i.test(clean)) continue;
    if (clean.length < 3) continue;

    return clean.slice(0, 120);
  }

  return '';
}

function suggestCategoryFromText(value) {
  const text = normalizeAssistText(value).toLowerCase();
  if (!text) return '';

  const match = productCategorySuggestionRules.find(rule =>
    rule.keywords.some(keyword => text.includes(keyword.toLowerCase()))
  );

  return match ? match.category : '待人工确认';
}

function getProductAssistSourceText() {
  const parts = [
    fieldValue('productEvidencePack'),
    fieldValue('manualProductTitle'),
    fieldValue('manualProductTextHelper'),
    fieldValue('manualProductNotes'),
    fieldValue('sourceProductUrl')
  ];

  return parts.filter(Boolean).join('\n');
}

function setManualProductAssistStatus(message) {
  setText('manualProductTextHelperStatus', message || '系统可以根据标题或粘贴文本建议类目，但采购价必须由你确认，避免误把促销价、区间价或起批价当成真实成本。');
}

function applyManualProductTextAssistance(options = {}) {
  const helperText = [fieldValue('manualProductTextHelper'), fieldValue('productEvidencePack')].filter(Boolean).join('\n');
  const extractedTitle = extractTitleFromPastedProductText(helperText);
  const actions = [];
  const titleEmpty = !fieldValue('manualProductTitle');
  const titleAutoOwned = sourcePreviewState.isTitleAutoFilledFromPreview &&
    fieldValue('manualProductTitle') === sourcePreviewState.lastAutoFilledTitle;

  if (extractedTitle && (titleEmpty || (options.replaceAutoTitle && titleAutoOwned))) {
    setInput('manualProductTitle', extractedTitle);
    sourcePreviewState.lastAutoFilledTitle = extractedTitle;
    sourcePreviewState.isTitleAutoFilledFromPreview = true;
    actions.push('已根据粘贴文本建议商品标题');
  }

  const categorySource = getProductAssistSourceText();
  const suggestedCategory = suggestCategoryFromText(categorySource);
  const currentCategory = fieldValue('manualProductCategory');
  const categoryAutoOwned = sourcePreviewState.isCategorySuggestedFromAssist &&
    currentCategory === sourcePreviewState.lastSuggestedCategory;

  if (suggestedCategory && (!currentCategory || categoryAutoOwned)) {
    setInput('manualProductCategory', suggestedCategory);
    sourcePreviewState.lastSuggestedCategory = suggestedCategory;
    sourcePreviewState.isCategorySuggestedFromAssist = true;
    actions.push(`已建议类目：${suggestedCategory}`);
  }

  const costMessage = fieldValue('manualSourceCost')
    ? '采购价已填写，请确认它是真实采购成本。'
    : '采购价会直接影响利润判断，请手动填写或确认。';
  const guidance = '系统可以根据标题或粘贴文本建议类目，但采购价必须由你确认，避免误把促销价、区间价或起批价当成真实成本。';

  setManualProductAssistStatus(actions.length
    ? `${actions.join('；')}。${costMessage}`
    : `${guidance} ${costMessage}`);

  return actions;
}

function renderOzonAnalysisDetails(analysis) {
  const source = analysis && analysis.source ? analysis.source : {};
  const insights = analysis && analysis.insights ? analysis.insights : {};
  const ozon = analysis && analysis.ozon ? analysis.ozon : {};
  const ozonProducts = Array.isArray(ozon.products) ? ozon.products : [];
  const keywords = typeof formatList === 'function' ? formatList(insights.keywords, '等待提取') : '等待提取';
  const tags = typeof formatList === 'function' ? formatList(insights.tags, '等待提取') : '等待提取';
  const productText = ozonProducts.length
    ? ` 样本：${ozonProducts.map(item => item.offer_id || item.product_id || '未命名商品').join('、')}`
    : '';
  const manualGuidance = typeof MANUAL_PRODUCT_GUIDANCE === 'string'
    ? MANUAL_PRODUCT_GUIDANCE
    : '来源链接只是可选辅助；标题、采购成本、类目和卖点以当前商品卡片输入为准。';
  const titleText = source.title || (source.url ? manualGuidance : '未使用来源链接，可直接填写商品卡片信息');
  const platformText = source.platform ? ` · ${source.platform}` : '';
  const priceNotice = source.priceRole ? ` · ${getSourcePriceRoleNotice(source)}` : '';
  const sourceAnalysisText = analysis && analysis.sourceAnalysis && analysis.sourceAnalysis.summary
    ? ` ${analysis.sourceAnalysis.summary}`
    : '';

  setText('sourceProductInsight', `${titleText} · ${source.host || '未知来源'}${platformText} · ${insights.category || source.categorySuggestion || '类目待复核'}${priceNotice}${sourceAnalysisText}`);
  setText('sourceKeywordInsight', `关键词：${keywords}。标签：${tags}。`);
  setText('ozonApiInsight', ozon.status === 'connected'
    ? (ozon.message || 'Ozon 店铺商品摘要已连接。') + productText
    : '可选 Ozon 店铺商品摘要未连接，不影响本次测品建议。');
  setText('analysisLimitInsight', (analysis && analysis.limitations && analysis.limitations.length)
    ? analysis.limitations.join('；')
    : '后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。');
  renderProductImagePreview(source.image || fieldValue('imageUrl'));
  renderSourceExtractionDetails(analysis && analysis.sourcePreview ? analysis.sourcePreview : null);
  renderAiAnalysisStatusModel();
}

function renderOzonAutoAnalysis(analysis) {
  if (!analysis) return;

  lastOzonAutoAnalysis = analysis;
  renderOzonAnalysisDetails(analysis);
  renderProductSelectionReport(analysis.report);
}

function applySourcePreviewToForm(preview, sourceUrl) {
  if (!preview || !preview.source) return '';
  if (!sourcePreviewBelongsToUrl(preview, sourceUrl)) return '';

  const source = preview.source;
  const actions = [];
  sourcePreviewState.lastPreviewUrl = normalizeSourcePreviewUrl(sourceUrl);
  sourcePreviewState.activeRequestUrl = '';
  sourcePreviewState.currentPreview = preview;
  renderSourceExtractionDetails(preview);

  if (preview.ok && source.title && !fieldValue('manualProductTitle')) {
    setInput('manualProductTitle', source.title);
    sourcePreviewState.lastAutoFilledTitle = source.title;
    sourcePreviewState.isTitleAutoFilledFromPreview = true;
    actions.push('已从公开页面预填商品标题');
  }

  const assistActions = applyManualProductTextAssistance({ replaceAutoTitle: false });
  assistActions.forEach(action => actions.push(action));

  if (preview.ok && source.image && !fieldValue('imageUrl')) {
    setInput('imageUrl', source.image);
    renderProductImagePreview(source.image);
    sourcePreviewState.lastAutoFilledImage = source.image;
    sourcePreviewState.isImageAutoFilledFromPreview = true;
    actions.push('已显示公开商品图片预览');
  }

  const currentCategory = fieldValue('manualProductCategory');
  const categoryAutoOwned = sourcePreviewState.isCategorySuggestedFromAssist &&
    currentCategory === sourcePreviewState.lastSuggestedCategory;

  if (preview.ok && source.categorySuggestion && (!currentCategory || categoryAutoOwned)) {
    setInput('manualProductCategory', source.categorySuggestion);
    sourcePreviewState.lastSuggestedCategory = source.categorySuggestion;
    sourcePreviewState.isCategorySuggestedFromAssist = true;
    actions.push(`已建议类目：${source.categorySuggestion}`);
  }

  const hasExtractedPrice = preview.ok && source.price !== null && source.price !== undefined && source.price !== '';
  const extractedPrice = Number(source.price);

  if (hasExtractedPrice && source.priceRole === 'candidate_source_cost') {
    if (Number.isFinite(extractedPrice)) actions.push('识别到候选采购价，请确认是否为真实拿货成本');
    setManualProductAssistStatus('识别到的是候选采购价，请确认是否为真实拿货成本。');
  } else if (hasExtractedPrice && source.priceRole === 'market_reference_price') {
    actions.push('识别到平台销售参考价，不会自动写入采购价');
    setManualProductAssistStatus('识别到的是平台销售参考价，不等于你的采购成本。请手动填写真实采购价。');
  } else if (preview.ok) {
    actions.push('未能自动识别价格，请手动确认或补充');
  }

  if (preview.ok) {
    return actions.length
      ? actions.join('，') + '；手动字段仍可编辑。'
      : '已读取公开商品信息；手动字段仍可编辑。';
  }

  applyManualProductTextAssistance({ replaceAutoTitle: false });

  return preview.message || (typeof getSourcePreviewFallbackMessage === 'function'
    ? getSourcePreviewFallbackMessage()
    : '该平台可能限制自动读取。你可以补充截图文字、商品描述或运营疑问，系统会基于已识别内容继续分析。');
}

function mergeSourcePreviewIntoAnalysis(analysis, preview, sourceUrl) {
  if (!analysis || !preview || !preview.source) return analysis;
  if (!sourcePreviewBelongsToUrl(preview, sourceUrl)) return analysis;

  const source = preview.source;
  analysis.source = analysis.source || {};
  analysis.source.url = sourceUrl || analysis.source.url || source.url;
  analysis.source.host = source.host || analysis.source.host;
  analysis.source.title = preview.ok ? (analysis.source.title || source.title || '') : '';
  analysis.source.image = preview.ok ? (analysis.source.image || source.image || '') : '';
  analysis.source.description = preview.ok ? (analysis.source.description || source.description || '') : '';
  analysis.source.canonicalUrl = preview.ok ? (analysis.source.canonicalUrl || source.canonicalUrl || '') : '';
  analysis.source.platform = analysis.source.platform || source.platform || '';
  analysis.source.platformType = source.platformType || analysis.source.platformType || '';
  analysis.source.finalUrl = source.finalUrl || analysis.source.finalUrl || '';
  analysis.source.price = preview.ok ? source.price : null;
  analysis.source.currency = preview.ok ? source.currency || '' : '';
  analysis.source.priceRole = source.priceRole || analysis.source.priceRole || 'unknown';
  analysis.source.shippingFee = preview.ok ? source.shippingFee || { value: null, currency: '', confidence: 'none', source: '' } : { value: null, currency: '', confidence: 'none', source: '' };
  analysis.source.totalCandidateSourceCost = preview.ok ? source.totalCandidateSourceCost || { value: null, currency: '', confidence: 'none', source: '' } : { value: null, currency: '', confidence: 'none', source: '' };
  analysis.source.categorySuggestion = preview.ok ? source.categorySuggestion || '' : '';
  analysis.source.material = preview.ok ? source.material || { value: '', confidence: 'none', source: '' } : { value: '', confidence: 'none', source: '' };
  analysis.source.usage = preview.ok ? source.usage || { value: '', confidence: 'none', source: '' } : { value: '', confidence: 'none', source: '' };
  analysis.source.scene = preview.ok ? source.scene || { value: '', confidence: 'none', source: '' } : { value: '', confidence: 'none', source: '' };
  analysis.source.specifications = preview.ok && Array.isArray(source.specifications) ? source.specifications : [];
  analysis.source.productDetails = preview.ok && Array.isArray(source.productDetails) ? source.productDetails : [];
  analysis.source.modelDisclosure = source.modelDisclosure || analysis.source.modelDisclosure || '';
  analysis.source.extractionConfidence = source.extractionConfidence || analysis.source.extractionConfidence || 'none';
  analysis.source.extractionSource = source.extractionSource || analysis.source.extractionSource || '';
  analysis.source.failureReason = preview.ok ? '' : source.failureReason || preview.message || '';
  analysis.source.manualConfirmationNeeded = Array.isArray(source.manualConfirmationNeeded) ? source.manualConfirmationNeeded : [];
  analysis.source.confidence = source.confidence || analysis.source.confidence || {};
  analysis.source.extractionSources = source.extractionSources || analysis.source.extractionSources || {};
  analysis.insights = analysis.insights || {};
  if (preview.ok && source.categorySuggestion && !analysis.insights.category) {
    analysis.insights.category = source.categorySuggestion;
  }
  if (preview.ok && preview.analysis) {
    analysis.sourceAnalysis = preview.analysis;
  }
  analysis.sourcePreview = preview;
  analysis.limitations = Array.isArray(analysis.limitations) ? analysis.limitations : [];

  if (Array.isArray(preview.limitations)) {
    analysis.limitations = analysis.limitations.concat(preview.limitations);
  }

  if (!preview.ok && preview.message) {
    analysis.limitations.push(preview.message);
  }

  return analysis;
}

async function checkOzonWorkerHealth() {
  if (typeof requestOzonWorkerHealth !== 'function') return;

  try {
    const health = await requestOzonWorkerHealth();
    const ozon = health.ozon || {};
    const products = Array.isArray(ozon.products) ? ozon.products : [];
    const productText = products.length
      ? ` 样本：${products.map(item => item.offer_id || item.product_id || '未命名商品').join('、')}`
      : '';
    setText('ozonApiInsight', (ozon.message || '等待 Ozon API 状态。') + productText);
    setText('analysisLimitInsight', health.ok
      ? '后端服务已响应。若 Ozon 凭证缺失，请在 Cloudflare 环境变量中配置。'
      : '前端当前未连接 Cloudflare Worker，智能分析会显示 API 服务未连接。');
  } catch (error) {
    setText('ozonApiInsight', error.message || 'API 健康检查失败。');
    setText('analysisLimitInsight', '请检查 js/config.js 中的 Worker 地址和 Cloudflare Worker 部署状态。');
  }
}

function getOzonProductSummaryCredentials() {
  return {
    clientId: fieldValue('ozonTestClientId'),
    apiKey: fieldValue('ozonTestApiKey'),
    limit: 3
  };
}

function getManualProductInput() {
  return {
    evidencePack: fieldValue('productEvidencePack'),
    title: fieldValue('manualProductTitle'),
    sourceCost: readOptionalNumber('manualSourceCost'),
    category: fieldValue('manualProductCategory'),
    sourcePlatform: fieldValue('sourcePlatformInput'),
    targetPlatform: fieldValue('productSelectionPlatform') || platform,
    targetSellingPrice: readOptionalNumber('targetSellingPriceInput'),
    estimatedWeight: readOptionalNumber('estimatedWeightInput'),
    material: fieldValue('productMaterialInput'),
    usageScene: fieldValue('productUsageSceneInput'),
    sellingPoint: fieldValue('productSellingPointInput'),
    notes: fieldValue('manualProductNotes')
  };
}

function getManualTestingAssumptions() {
  return {
    estimatedExposure: readOptionalNumber('estimatedExposure'),
    estimatedClickRate: readOptionalNumber('estimatedClickRate'),
    estimatedConversionRate: readOptionalNumber('estimatedConversionRate'),
    exposureNotes: fieldValue('estimatedExposureNotes'),
    clickRateNotes: fieldValue('estimatedClickRateNotes'),
    conversionRateNotes: fieldValue('estimatedConversionRateNotes'),
    marketObservationNotes: fieldValue('manualMarketObservationNotes'),
    competitorCount: readOptionalNumber('competitorCount'),
    competitorAvgPrice: readOptionalNumber('competitorAvgPrice'),
    competitorMinPrice: readOptionalNumber('competitorMinPrice'),
    competitorMaxPrice: readOptionalNumber('competitorMaxPrice'),
    topCompetitorRating: readOptionalNumber('topCompetitorRating'),
    topCompetitorReviews: readOptionalNumber('topCompetitorReviews'),
    adShare: readOptionalNumber('selectionAdShare'),
    adType: fieldValue('selectionAdType'),
    storeType: fieldValue('storeType'),
    storeOrderRange: fieldValue('storeOrderRange'),
    localPreference: fieldValue('localPreference'),
    competitorCardQuality: fieldValue('competitorCardQuality'),
    marketCrowding: fieldValue('marketCrowding'),
    positiveReviewSignals: fieldValue('positiveReviewSignals'),
    negativeReviewSignals: fieldValue('negativeReviewSignals'),
    titleClarity: fieldValue('titleClarity'),
    mainImageQuality: fieldValue('mainImageQuality'),
    sellingPointClarity: fieldValue('sellingPointClarity'),
    categoryFit: fieldValue('categoryFit'),
    specComplexity: fieldValue('specComplexity'),
    visualDifferentiation: fieldValue('visualDifferentiation'),
    returnRiskLevel: fieldValue('returnRiskLevel'),
    reviewTrustLevel: fieldValue('reviewTrustLevel')
  };
}

function applyCurrentManualAnalysisContext(analysis, profitSnapshot = lastProfitSnapshot) {
  if (!analysis) return analysis;

  analysis.activePlatform = platform;
  analysis.targetPlatform = fieldValue('productSelectionPlatform') || platform;
  analysis.profitDecisionDataAvailable = getDecisionDataValidation(profitSnapshot).hasFullDecisionData;

  if (typeof applyManualProductContext === 'function') {
    applyManualProductContext(analysis, getManualProductInput(), fieldValue('sourceProductUrl'));
  }

  if (typeof applyManualTestingAssumptions === 'function') {
    applyManualTestingAssumptions(analysis, getManualTestingAssumptions());
  }

  if (typeof buildOzonAutoReport === 'function') {
    analysis.report = buildOzonAutoReport(analysis, profitSnapshot);
  }

  return analysis;
}

function buildWorkspaceAnalysisFromCurrentInputs(profitSnapshot = lastProfitSnapshot) {
  const sourceUrl = fieldValue('sourceProductUrl');
  const preview = sourcePreviewState.currentPreview && sourcePreviewBelongsToUrl(sourcePreviewState.currentPreview, sourceUrl)
    ? sourcePreviewState.currentPreview
    : null;
  const source = typeof defaultNormalizedSource === 'function'
    ? defaultNormalizedSource(sourceUrl)
    : {
      url: sourceUrl,
      finalUrl: sourceUrl,
      host: sourceUrl ? normalizeHost(sourceUrl) : '未使用来源链接',
      platform: fieldValue('sourcePlatformInput'),
      platformType: 'unknown',
      title: '',
      image: '',
      price: null,
      currency: '',
      priceRole: 'unknown'
    };
  const analysis = {
    ok: true,
    activePlatform: platform,
    targetPlatform: fieldValue('productSelectionPlatform') || platform,
    source,
    insights: {
      category: '',
      keywords: [],
      tags: [],
      sellingPoints: [],
      painPoints: []
    },
    ozon: {
      status: 'not_required',
      message: '后台数据未提供，本次只基于公开市场观察、商品卡片信息和利润测算进行上架前判断。'
    },
    limitations: ['链接提取只是可选辅助；报告可完全基于商品卡片信息、公开市场观察和利润测算生成。']
  };

  mergeSourcePreviewIntoAnalysis(analysis, preview, sourceUrl);
  applyCurrentManualAnalysisContext(analysis, profitSnapshot);
  return analysis;
}

function generateProductCardDecisionReport() {
  applyManualProductTextAssistance({ replaceAutoTitle: false });
  const validation = getDecisionDataValidation(lastProfitSnapshot);
  renderDecisionDataValidation(validation);
  const analysis = buildWorkspaceAnalysisFromCurrentInputs(lastProfitSnapshot);

  renderOzonAutoAnalysis(analysis);
  setAutoAnalysisStatus(validation.hasFullDecisionData
    ? '测品决策报告已生成。链接提取只是可选辅助；后台数据不是必填。'
    : '商品卡片观察报告已生成。利润数据不足，本次不输出利润安全结论。');
  setAutoAnalysisProgress('', ['report']);
  persistFormState();

  const scrollTargetId = validation.shouldWarn ? 'decisionValidationWarning' : 'productSelectionReport';
  window.requestAnimationFrame(() => {
    scrollToWorkspaceElement(scrollTargetId);
  });
}

function getAnalysisPayload() {
  const selectedStoreId = fieldValue('analysisStoreProfile');
  const storeState = typeof loadStoreApiState === 'function' ? loadStoreApiState() : { stores: [] };
  const selectedStore = storeState.stores.find(store => store.id === selectedStoreId) || null;
  const productSummaryCredentials = getOzonProductSummaryCredentials();

  return {
    sourceUrl: fieldValue('sourceProductUrl'),
    activePlatform: platform,
    clientId: productSummaryCredentials.clientId,
    apiKey: productSummaryCredentials.apiKey,
    limit: productSummaryCredentials.limit,
    manualProduct: getManualProductInput(),
    targetPlatform: fieldValue('productSelectionPlatform') || platform,
    selectedStore: selectedStore ? {
      platform: selectedStore.platform,
      credentialRef: selectedStore.credentialRef,
      name: selectedStore.name
    } : null,
    profitSnapshot: lastProfitSnapshot,
    assumptions: getManualTestingAssumptions()
  };
}

function syncOzonTemporaryConnectionStateFromAnalysis(analysis) {
  const ozon = analysis && analysis.ozon ? analysis.ozon : null;
  if (!ozon || !ozon.status) return;

  ozonTemporaryConnectionState = {
    status: ozon.status,
    message: ozon.message || ''
  };
}

async function runOzonAutoAnalysis() {
  const sourceUrl = fieldValue('sourceProductUrl');
  const button = document.getElementById('autoAnalysisButton');
  const requestId = currentExtractionRequestId + 1;
  currentExtractionRequestId = requestId;

  if (!sourceUrl) {
    setAutoAnalysisStatus('来源链接为空；可直接点击“生成测品决策报告”，链接提取不是必填。');
    setAutoAnalysisProgress('', []);
    setInput('ozonTestApiKey', '');
    return;
  }

  try {
    const parsed = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('只支持 http 或 https 链接。');
    }
  } catch (error) {
    setAutoAnalysisStatus('商品链接格式不正确，请检查后再分析。', 'is-error');
    setAutoAnalysisProgress('', []);
    setInput('ozonTestApiKey', '');
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = '分析中...';
  }

  const trackedUrl = normalizeSourcePreviewUrl(sourcePreviewState.lastPreviewUrl || sourcePreviewState.activeRequestUrl);
  if (trackedUrl && trackedUrl !== normalizeSourcePreviewUrl(sourceUrl)) {
    clearAutoFilledSourcePreviewFields();
  }

  sourcePreviewState.activeRequestUrl = normalizeSourcePreviewUrl(sourceUrl);
  sourcePreviewState.activeRequestId = requestId;
  sourcePreviewState.currentPreview = null;
  lastOzonAutoAnalysis = null;
  clearSourcePreviewDisplay();
  renderProductSelection(lastProfitSnapshot);
  setAutoAnalysisStatus('正在尝试提取可选链接信息……', 'is-loading');
  setAutoAnalysisProgress('link', []);

  try {
    await new Promise(resolve => setTimeout(resolve, 180));
    if (!sourceRequestStillCurrent(sourceUrl, requestId)) {
      setAutoAnalysisStatus('来源链接已变化。旧链接分析已忽略。');
      setAutoAnalysisProgress('', []);
      return;
    }
    setAutoAnalysisProgress('identify', ['link']);

    let sourcePreview = null;
    let sourcePreviewStatus = '';

    if (typeof requestSourcePreview === 'function') {
      try {
        sourcePreview = await requestSourcePreview(sourceUrl);
        if (!sourceRequestStillCurrent(sourceUrl, requestId)) {
          setAutoAnalysisStatus('来源链接已变化。旧链接预览已忽略。');
          setAutoAnalysisProgress('', []);
          return;
        }
        sourcePreviewStatus = applySourcePreviewToForm(sourcePreview, sourceUrl);
      } catch (error) {
        sourcePreview = {
          ok: false,
          requestedUrl: sourceUrl,
          source: {
            url: sourceUrl,
            host: new URL(sourceUrl).hostname.replace(/^www\./, ''),
            platform: '',
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
            material: { value: '', confidence: 'none', source: '' },
            usage: { value: '', confidence: 'none', source: '' },
            scene: { value: '', confidence: 'none', source: '' },
            specifications: [],
            productDetails: [],
            extractionConfidence: 'none',
            extractionSource: '',
            failureReason: error.message || 'source preview 请求失败。',
            manualConfirmationNeeded: []
          },
          message: '公开页面元数据预览暂不可用。你可以补充截图文字、商品描述或运营疑问继续分析。',
          limitations: [error.message || 'source preview 请求失败。']
        };
        renderSourceExtractionDetails(sourcePreview);
        sourcePreviewStatus = sourcePreview.message;
      }
    }

    if (!sourceRequestStillCurrent(sourceUrl, requestId)) {
      setAutoAnalysisStatus('来源链接已变化。旧链接分析已忽略。');
      setAutoAnalysisProgress('', []);
      return;
    }

    applyManualProductTextAssistance({ replaceAutoTitle: false });
    let analysis = await requestOzonProductAnalysis(getAnalysisPayload());
    if (!sourceRequestStillCurrent(sourceUrl, requestId)) {
      setAutoAnalysisStatus('来源链接已变化。旧链接报告已忽略。');
      setAutoAnalysisProgress('', []);
      return;
    }

    analysis = mergeSourcePreviewIntoAnalysis(analysis, sourcePreview, sourceUrl);
    applyCurrentManualAnalysisContext(analysis);
    syncOzonTemporaryConnectionStateFromAnalysis(analysis);
    sourcePreviewState.lastRequestId = requestId;
    sourcePreviewState.activeRequestId = 0;
    setAutoAnalysisProgress('report', ['link', 'identify', 'ozon']);
    renderOzonAutoAnalysis(analysis);
    const ozonConnected = analysis.ozon && analysis.ozon.status === 'connected';
    setAutoAnalysisStatus(
      ozonConnected
        ? '测品建议已生成。请复核利润、手动假设和 Ozon 可选上下文状态。'
        : sourcePreviewStatus || '测品建议已生成。链接提取只是辅助，请查看报告中的数据边界说明。',
      ''
    );
    setAutoAnalysisProgress('', ['link', 'identify', 'ozon', 'report']);
    persistFormState();
  } catch (error) {
    if (!sourceRequestStillCurrent(sourceUrl, requestId)) {
      setAutoAnalysisStatus('来源链接已变化。旧链接错误已忽略。');
      setAutoAnalysisProgress('', []);
      return;
    }
    const fallback = buildApiDisconnectedAnalysis(sourceUrl, lastProfitSnapshot, getManualProductInput());
    fallback.ozon.status = 'api_error';
    fallback.ozon.message = error.message || 'Worker 产品摘要暂不可用。';
    applyCurrentManualAnalysisContext(fallback);
    renderOzonAutoAnalysis(fallback);
    setAutoAnalysisStatus('测品建议已生成。可选店铺摘要暂不可用，请查看报告中的数据边界说明。');
    setAutoAnalysisProgress('', ['link']);
  } finally {
    if (sourcePreviewState.activeRequestId === requestId) {
      sourcePreviewState.activeRequestId = 0;
      sourcePreviewState.activeRequestUrl = '';
    }
    setInput('ozonTestApiKey', '');
    if (button) {
      button.disabled = false;
      button.textContent = '尝试提取链接信息';
    }
  }
}

function loadDemoOzonAnalysis() {
  const demo = buildDemoOzonAnalysis(lastProfitSnapshot);
  renderOzonAutoAnalysis(demo);
  setAutoAnalysisStatus('已加载示例测品报告。真实店铺商品摘要需要部署 Worker 并配置 Ozon API 凭证；曝光、点击、转化仍不是当前自动同步数据。');
  setAutoAnalysisProgress('', ['link', 'identify', 'ozon', 'report']);
}

function renderProductSelection(profitSnapshot) {
  if (lastOzonAutoAnalysis && fieldValue('sourceProductUrl') === (lastOzonAutoAnalysis.source && lastOzonAutoAnalysis.source.url)) {
    applyCurrentManualAnalysisContext(lastOzonAutoAnalysis, profitSnapshot);
    renderOzonAnalysisDetails(lastOzonAutoAnalysis);
    renderProductSelectionReport(lastOzonAutoAnalysis.report);
    return;
  }

  renderProductImagePreview(fieldValue('imageUrl'));

  if (typeof buildOzonAutoReport === 'function') {
    const analysis = buildWorkspaceAnalysisFromCurrentInputs(profitSnapshot);
    renderOzonAnalysisDetails(analysis);
    renderProductSelectionReport(analysis.report);
    return;
  }

  if (typeof analyzeProductSelection !== 'function') return;

  const report = analyzeProductSelection({
    activePlatform: platform,
    targetPlatform: fieldValue('productSelectionPlatform') || platform,
    sourceProductUrl: fieldValue('sourceProductUrl'),
    manualProduct: getManualProductInput(),
    manualAssumptions: getManualTestingAssumptions(),
    productUrl: fieldValue('productUrl'),
    imageUrl: fieldValue('imageUrl'),
    targetCategory: fieldValue('targetCategory'),
    competitorCount: readOptionalNumber('competitorCount'),
    competitorAvgPrice: readOptionalNumber('competitorAvgPrice'),
    competitorMinPrice: readOptionalNumber('competitorMinPrice'),
    competitorMaxPrice: readOptionalNumber('competitorMaxPrice'),
    topCompetitorRating: readOptionalNumber('topCompetitorRating'),
    topCompetitorReviews: readOptionalNumber('topCompetitorReviews'),
    adShare: readOptionalNumber('selectionAdShare'),
    adType: fieldValue('selectionAdType'),
    storeType: fieldValue('storeType'),
    storeOrderRange: fieldValue('storeOrderRange'),
    localPreference: fieldValue('localPreference'),
    ...profitSnapshot
  });

  renderProductSelectionReport(report);
}

async function applyDailyReferenceRate() {
  if (typeof getDailyReferenceExchangeRate !== 'function') return;

  const button = document.getElementById('fetchReferenceRateButton');
  const originalText = button ? button.textContent : '';

  if (button) {
    button.disabled = true;
    button.textContent = '获取中...';
  }

  setReferenceRateStatus('正在获取当日参考汇率...');

  try {
    const reference = await getDailyReferenceExchangeRate();
    setInput('rubRate', reference.rate.toFixed(4));
    persistFormState();
    calc();

    setReferenceRateStatus(`${reference.source} · ${reference.sourceDate} · 仅作运营测算参考，非实时/官方/利润保证。`, 'is-ok');
  } catch (error) {
    setReferenceRateStatus('参考汇率获取失败，请手动填写。', 'is-error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function bindExchangeRateHelper() {
  const button = document.getElementById('fetchReferenceRateButton');

  if (!button) return;

  button.addEventListener('click', () => {
    applyDailyReferenceRate();
  });
}

function bindOzonAnalysisControls() {
  const analyzeButton = document.getElementById('autoAnalysisButton');
  const decisionButton = document.getElementById('generateDecisionReportButton');
  const demoButton = document.getElementById('loadDemoAnalysisButton');

  if (analyzeButton) {
    analyzeButton.addEventListener('click', () => {
      runOzonAutoAnalysis();
    });
  }

  if (decisionButton) {
    decisionButton.addEventListener('click', () => {
      generateProductCardDecisionReport();
    });
  }

  if (demoButton) {
    demoButton.addEventListener('click', () => {
      loadDemoOzonAnalysis();
    });
  }
}

function setStoreApiStatus(message, type = '') {
  const el = document.getElementById('storeApiStatus');
  if (!el) return;

  el.classList.remove('is-ok', 'is-error');
  if (type) el.classList.add(type);
  el.textContent = message;
}

function setBackendConnectionStatus(status, message) {
  const badge = document.getElementById('backendConnectionBadge');
  const healthStatus = document.getElementById('backendHealthStatus');
  const stepStatus = document.getElementById('backendProxyStepStatus');
  const statusText = {
    connected: '后端已连接',
    testing: '测试中',
    failed: '连接失败',
    not_configured: '后端未配置'
  }[status] || '后端未配置';
  const statusClass = status === 'connected' ? 'is-ok' : status === 'testing' ? 'is-testing' : status === 'failed' ? 'is-error' : '';

  if (badge) {
    badge.classList.remove('is-ok', 'is-error', 'is-testing');
    if (statusClass) badge.classList.add(statusClass);
    badge.textContent = statusText;
  }

  if (healthStatus) {
    healthStatus.classList.remove('is-ok', 'is-error');
    if (status === 'connected') healthStatus.classList.add('is-ok');
    if (status === 'failed') healthStatus.classList.add('is-error');
    healthStatus.textContent = message || statusText;
  }

  if (stepStatus) {
    stepStatus.textContent = message || statusText;
  }
}

function renderBackendWorkerUrl() {
  const input = document.getElementById('backendWorkerUrl');
  const ozonInput = document.getElementById('ozonWorkerUrl');
  const value = window.PRODUCT_SELECTION_API_BASE_URL || '';

  if (input) input.value = value;
  if (ozonInput) ozonInput.value = value;
  setBackendConnectionStatus(
    value ? 'not_configured' : 'not_configured',
    value
      ? 'Worker 地址已保存。点击“测试后端”确认后端是否响应。'
      : '后端未配置。请先填写 Worker 地址，再测试后端状态。'
  );
  renderAiAnalysisStatusModel();
}

function getVisibleWorkerUrlInputValue(preferred = 'backend') {
  const backendUrl = fieldValue('backendWorkerUrl');
  const ozonUrl = fieldValue('ozonWorkerUrl');

  if (preferred === 'ozon') {
    return ozonUrl || backendUrl || window.PRODUCT_SELECTION_API_BASE_URL || '';
  }

  return backendUrl || ozonUrl || window.PRODUCT_SELECTION_API_BASE_URL || '';
}

function bindBackendWorkerUrlControls() {
  const saveButton = document.getElementById('saveBackendWorkerUrlButton');
  const testButton = document.getElementById('testBackendHealthButton');
  const input = document.getElementById('backendWorkerUrl');

  if (!input || !saveButton || typeof setSavedWorkerBaseUrl !== 'function') return;

  renderBackendWorkerUrl();
  input.addEventListener('input', () => {
    setInput('ozonWorkerUrl', input.value.trim());
    setBackendConnectionStatus(
      input.value.trim() ? 'not_configured' : 'not_configured',
      input.value.trim()
        ? 'Worker 地址已填写。连接测试前，请保存地址或测试后端状态。'
        : '后端未配置。请先填写 Worker 地址，再测试后端状态。'
    );
    renderAiAnalysisStatusModel();
  });

  saveButton.addEventListener('click', async () => {
    try {
      const savedUrl = setSavedWorkerBaseUrl(input.value);
      input.value = savedUrl;
      setInput('ozonWorkerUrl', savedUrl);
      renderAiAnalysisStatusModel();
      setBackendConnectionStatus('not_configured', 'Worker 地址已保存。点击“测试后端”确认后端是否响应。');
      setStoreApiStatus('Worker 地址已保存。只有在点击同步、测试连接或开始分析时，前端才会请求 Worker。', 'is-ok');
    } catch (error) {
      setBackendConnectionStatus('failed', error.message || 'Worker URL 保存失败。');
      setStoreApiStatus(error.message || 'Worker 地址保存失败。', 'is-error');
    }
  });

  if (testButton) {
    testButton.addEventListener('click', async () => {
      const workerUrl = getVisibleWorkerUrlInputValue('backend');
      const normalized = typeof normalizeWorkerBaseUrl === 'function'
        ? normalizeWorkerBaseUrl(workerUrl)
        : String(workerUrl || '').trim().replace(/\/+$/, '');

      if (!normalized) {
        setBackendConnectionStatus('not_configured', '缺少 Worker 地址：请先填写 Cloudflare Worker 地址。');
        return;
      }

      testButton.disabled = true;
      setInput('backendWorkerUrl', normalized);
      setInput('ozonWorkerUrl', normalized);
      setBackendConnectionStatus('testing', '测试中：正在检查 Cloudflare Worker /api/health。');

      try {
        const response = await fetch(normalized + '/api/health');
        if (!response.ok) throw new Error('API 健康检查失败：' + response.status);
        const health = await response.json().catch(() => ({}));
        const ozon = health.ozon || {};
        const ozonText = ozon.status === 'connected'
          ? '后端已配置 Ozon 长期凭证。'
          : '后端健康；临时测试不要求配置 Ozon 长期凭证。';

        setBackendConnectionStatus('connected', `后端已连接：${health.service || 'Worker'} 已响应。${ozonText}`);
      } catch (error) {
        setBackendConnectionStatus('failed', '后端不可用：' + (error.message || 'Worker 健康检查失败。'));
      } finally {
        testButton.disabled = false;
      }
    });
  }
}

function revealOzonTemporaryCredentialTest(store, backendMessage) {
  switchAppView('api');

  const panel = document.getElementById('ozonDetailsPanel') || document.querySelector('.ozon-connection-panel');
  const clientIdInput = document.getElementById('ozonTestClientId');
  const apiKeyInput = document.getElementById('ozonTestApiKey');
  const visibleWorkerUrl = getVisibleWorkerUrlInputValue();

  if (store && store.name) setInput('ozonTestStoreName', store.name);
  if (visibleWorkerUrl) setInput('ozonWorkerUrl', visibleWorkerUrl);
  setInput('ozonTestApiKey', '');
  setOzonTemporaryConnectionStatus(
    `${backendMessage || '后端未配置该店铺的长期凭证。'} 请在这里临时输入 Ozon Client ID 和 API Key 进行一次只读连接测试；凭证不会保存到浏览器。`
  );

  if (panel && typeof panel.scrollIntoView === 'function') {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (clientIdInput && !clientIdInput.value) {
    clientIdInput.focus();
  } else if (apiKeyInput) {
    apiKeyInput.focus();
  }
}

function setOzonTemporaryConnectionStatus(message, type = '') {
  const status = document.getElementById('ozonTemporaryConnectionStatus');
  const pill = document.getElementById('ozonConnectionPill');

  if (status) {
    status.classList.remove('is-ok', 'is-error');
    if (type) status.classList.add(type);
    status.textContent = message;
  }

  if (pill) {
    pill.classList.remove('is-ok', 'is-error');
    if (type) pill.classList.add(type);
    pill.textContent = type === 'is-ok' ? '已连接' : type === 'is-error' ? '失败' : '未连接';
  }
}

function displayStoreApiStatusLabel(status) {
  return String(status || '等待后端连接档案配置').replace('后端密钥', '后端连接档案');
}

function bindOzonTemporaryConnectionControls() {
  const button = document.getElementById('testOzonConnectionButton');
  const workerInput = document.getElementById('ozonWorkerUrl');
  const backendWorkerInput = document.getElementById('backendWorkerUrl');
  const focusButton = document.getElementById('focusOzonPanelButton');

  if (workerInput && !workerInput.value) {
    workerInput.value = window.PRODUCT_SELECTION_API_BASE_URL || '';
  }

  if (workerInput) {
    workerInput.addEventListener('input', () => {
      renderAiAnalysisStatusModel();
      setOzonTemporaryConnectionStatus('Worker URL 已修改但未测试。Client ID 和 API Key 不会保存到浏览器存储。');
    });
  }

  if (!button) return;

  if (focusButton) {
    focusButton.addEventListener('click', () => {
      const panel = document.getElementById('ozonDetailsPanel');
      if (panel && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  button.addEventListener('click', async () => {
    if (typeof requestOzonTemporaryConnectionTest !== 'function') return;

    button.disabled = true;
    setOzonTemporaryConnectionStatus('测试中：正在请求配置的 Worker 端点测试连接；前端不会直接请求 Ozon 官方 API。');

    try {
      const result = await requestOzonTemporaryConnectionTest({
        storeName: fieldValue('ozonTestStoreName'),
        clientId: fieldValue('ozonTestClientId'),
        apiKey: fieldValue('ozonTestApiKey'),
        workerUrl: getVisibleWorkerUrlInputValue('backend') || (backendWorkerInput ? backendWorkerInput.value.trim() : '')
      });

      ozonTemporaryConnectionState = {
        status: result.status,
        message: result.message
      };
      const identityText = result.maskedClientId ? `（Client ID: ${result.maskedClientId}）` : '';
      const statusLabel = result.status === 'connected'
        ? '已连接'
        : result.status === 'missing_credentials'
          ? '缺少 Client ID 或 API Key'
          : result.status === 'backend_not_configured'
            ? '缺少 Worker 地址'
            : '失败';
      setOzonTemporaryConnectionStatus(`${statusLabel}：${result.message}${identityText}`, result.ok && result.status === 'connected' ? 'is-ok' : 'is-error');
      renderAiAnalysisStatusModel();
    } catch (error) {
      ozonTemporaryConnectionState = {
        status: 'worker_error',
        message: error.message || 'Worker 连接测试失败。'
      };
      setOzonTemporaryConnectionStatus('后端不可用：' + (error.message || 'Worker 连接测试失败。'), 'is-error');
      renderAiAnalysisStatusModel();
    } finally {
      setInput('ozonTestApiKey', '');
      button.disabled = false;
    }
  });
}

function renderStoreApiManager() {
  if (typeof loadStoreApiState !== 'function') return;

  const state = loadStoreApiState();
  const planSelect = document.getElementById('storeApiPlan');
  const capacity = document.getElementById('storeApiCapacity');
  const summary = document.getElementById('storePlatformSummary');
  const list = document.getElementById('storeApiList');
  const analysisSelect = document.getElementById('analysisStoreProfile');
  const limit = storeApiLimit(state.plan);
  const counts = platformStoreCounts(state.stores);

  if (planSelect) planSelect.value = state.plan;
  if (capacity) {
    capacity.textContent = `${STORE_API_PLAN_LABELS[state.plan]} · 已添加 ${state.stores.length} / ${limit} 个店铺`;
  }
  if (summary) {
    summary.innerHTML = ['Ozon', 'Wildberries', 'Yandex']
      .map(name => `<span>${name} ${counts[name] || 0}</span>`)
      .join('');
  }
  if (analysisSelect) {
    const selected = analysisSelect.value;
    analysisSelect.textContent = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '默认 Ozon 凭证 / 未选择店铺';
    analysisSelect.appendChild(defaultOption);

    state.stores.forEach(store => {
      const option = document.createElement('option');
      option.value = store.id;
      option.textContent = `${store.platform} · ${store.name}`;
      analysisSelect.appendChild(option);
    });

    if (selected && state.stores.some(store => store.id === selected)) {
      analysisSelect.value = selected;
    }
  }
  if (!list) return;

  list.textContent = '';
  state.stores.forEach(store => {
    const card = document.createElement('div');
    card.className = 'store-api-card';

    const head = document.createElement('div');
    head.className = 'store-api-card-head';

    const textBox = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'store-api-card-title';
    title.textContent = store.name;

    const meta = document.createElement('div');
    meta.className = 'store-api-card-meta';
    meta.textContent = `${store.platform} · ${displayStoreApiStatusLabel(store.status)}`;

    const actions = document.createElement('div');
    actions.className = 'store-api-card-actions';

    const testButton = document.createElement('button');
    testButton.className = 'store-api-test-button';
    testButton.type = 'button';
    testButton.dataset.testStoreId = store.id;
    testButton.textContent = '测试连接';

    const removeButton = document.createElement('button');
    removeButton.className = 'store-api-remove-button';
    removeButton.type = 'button';
    removeButton.dataset.storeId = store.id;
    removeButton.textContent = '移除';

    const credential = document.createElement('div');
    credential.className = 'store-api-card-meta';
    credential.textContent = `后端连接档案 ID：${store.credentialRef}`;

    textBox.appendChild(title);
    textBox.appendChild(meta);
    actions.appendChild(testButton);
    actions.appendChild(removeButton);
    head.appendChild(textBox);
    head.appendChild(actions);
    card.appendChild(head);
    card.appendChild(credential);
    list.appendChild(card);
  });

  if (!state.stores.length) {
    setStoreApiStatus('未添加店铺。真实 API Key 只允许在临时测试时输入，或后续由后端安全配置。');
  }
}

function bindStoreApiManager() {
  const planSelect = document.getElementById('storeApiPlan');
  const addButton = document.getElementById('addStoreApiButton');
  const syncButton = document.getElementById('syncBackendStoresButton');
  const list = document.getElementById('storeApiList');

  if (planSelect) {
    planSelect.addEventListener('change', () => {
      const state = loadStoreApiState();
      state.plan = planSelect.value;
      saveStoreApiState(state);
      renderStoreApiManager();
      setStoreApiStatus('会员档位已更新。店铺数量限制会按当前档位执行。', 'is-ok');
    });
  }

  if (addButton) {
    addButton.addEventListener('click', () => {
      const state = loadStoreApiState();
      const limit = storeApiLimit(state.plan);

      if (state.stores.length >= limit) {
        setStoreApiStatus(`当前档位最多添加 ${limit} 个店铺，请升级会员档位后再添加。`, 'is-error');
        return;
      }

      const result = createStoreApiProfile({
        platform: fieldValue('storeApiPlatform'),
        name: fieldValue('storeApiName'),
        credentialRef: fieldValue('storeApiCredentialRef')
      });

      if (result.error) {
        setStoreApiStatus(result.error, 'is-error');
        return;
      }

      state.stores.push(result.store);
      saveStoreApiState(state);
      setInput('storeApiName', '');
      setInput('storeApiCredentialRef', '');
      renderStoreApiManager();
      setStoreApiStatus('店铺 API 档案已添加。这个档案 ID 不是 Ozon API Key；真实 API Key 只在临时测试时输入或后续由后端安全配置。', 'is-ok');
    });
  }

  if (syncButton) {
    syncButton.addEventListener('click', async () => {
      try {
        setStoreApiStatus('正在从后端同步真实店铺档案...');
        const result = await requestBackendStoreProfiles();
        const state = loadStoreApiState();
        const limit = storeApiLimit(state.plan);
        const existingKeys = new Set(state.stores.map(store => `${store.platform}:${store.credentialRef}`));
        const incoming = (result.stores || []).filter(store => !existingKeys.has(`${store.platform}:${store.credentialRef}`));
        const available = Math.max(0, limit - state.stores.length);
        const accepted = incoming.slice(0, available).map(store => ({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          platform: store.platform,
          name: store.name,
          credentialRef: store.credentialRef,
          status: store.status || '后端已配置真实凭证',
          createdAt: new Date().toISOString()
        }));

        state.stores.push(...accepted);
        saveStoreApiState(state);
        renderStoreApiManager();
        setStoreApiStatus(`已同步 ${accepted.length} 个后端店铺。${incoming.length > accepted.length ? '当前会员档位容量不足，部分店铺未加入。' : ''}`, 'is-ok');
      } catch (error) {
        setStoreApiStatus(error.message || '后端店铺同步失败。', 'is-error');
      }
    });
  }

  if (list) {
    list.addEventListener('click', async event => {
      const testButton = event.target.closest('[data-test-store-id]');
      if (testButton) {
        const state = loadStoreApiState();
        const store = state.stores.find(item => item.id === testButton.dataset.testStoreId);
        if (!store) return;

        try {
          setStoreApiStatus(`测试中：正在通过 Worker 测试 ${store.name} 的后端连接档案...`);
          const result = await requestStoreApiHealth(store.platform, store.credentialRef, getVisibleWorkerUrlInputValue('backend'));
          const testResult = result.result || {};

          if (store.platform === 'Ozon' && testResult.status === 'missing_credentials') {
            setStoreApiStatus('后端未配置该 Ozon 档案的长期凭证，已打开临时凭证测试表单。', 'is-error');
            revealOzonTemporaryCredentialTest(store, testResult.message);
            return;
          }

          if (testResult.status === 'api_not_connected') {
            setStoreApiStatus('缺少 Worker 地址：请先填写 Cloudflare Worker 地址。', 'is-error');
            return;
          }

          setStoreApiStatus(testResult.message || '测试完成。', testResult.status === 'connected' ? 'is-ok' : 'is-error');
        } catch (error) {
          setStoreApiStatus('后端不可用：' + (error.message || '店铺 API 测试失败。'), 'is-error');
        }
        return;
      }

      const button = event.target.closest('[data-store-id]');
      if (!button) return;

      const state = loadStoreApiState();
      state.stores = state.stores.filter(store => store.id !== button.dataset.storeId);
      saveStoreApiState(state);
      renderStoreApiManager();
      setStoreApiStatus('店铺 API 档案已移除。本操作不会删除后端真实密钥。', 'is-ok');
    });
  }

  renderStoreApiManager();
}

function calc() {
  currentValidation = validateInputs();
  renderValidation(currentValidation);

  if (currentValidation.errors.length) {
    renderInvalidInputState();
    refreshDecisionDataValidationIfVisible();
    return;
  }

  const sale = v('salePrice');
  const subsidy = syncSubsidy(sale);
  const rub = sale * v('rubRate');
  const r = match();
  const log = r ? r.fee : 0;
  const costs = calculateProfit({
    sale,
    logisticsCost: log,
    purchaseCost: v('purchaseCost'),
    commissionRate: v('commissionRate'),
    adRate: v('adRate'),
    taxRate: v('taxRate'),
    withdrawRate: v('withdrawRate'),
    returnRate: v('returnRate'),
    labelFee: v('labelFee'),
    otherCost: v('otherCostInput')
  });

  document.getElementById('rubPrice').value = rub.toFixed(2) + ' ₽';
  setText('subsidyAmountDisplay', m(subsidy.amount));
  setText('subsidyRateDisplay', subsidy.rate.toFixed(2) + '%');
  setText('actualSaleDisplay', m(subsidy.subSale));
  setText('logisticsCost', m(log));
  setText('totalCost', m(costs.total));
  setText('profit', m(costs.profit));
  setText('profitRate', costs.profitRate.toFixed(2) + '%');
  setText('purchaseCostDisplay', m(v('purchaseCost')));
  setText('commissionCost', m(costs.com));
  setText('adCost', m(costs.ad));
  setText('taxCost', m(costs.tax));
  setText('withdrawCost', m(costs.withdraw));
  setText('returnCostDisplay', m(costs.returnCost));
  setText('labelFeeDisplay', m(v('labelFee')));
  setText('otherCostDisplay', m(v('otherCostInput')));
  setText('returnRateDisplay', v('returnRate').toFixed(2) + '%');
  setText('otherRateDisplay', costs.otherRate.toFixed(2) + '%');
  renderProfitDecision(getProfitDecision(sale, costs.profit, costs.profitRate));
  renderCostExplanation(getCostExplanation({
    sale,
    totalCost: costs.total,
    profit: costs.profit,
    profitRate: costs.profitRate,
    purchaseCost: v('purchaseCost'),
    logisticsCost: log,
    commissionCost: costs.com,
    adCost: costs.ad,
    otherCost: v('otherCostInput')
  }));
  renderNextAction(getNextAction({
    sale,
    profit: costs.profit,
    profitRate: costs.profitRate,
    purchaseCost: v('purchaseCost'),
    logisticsCost: log,
    commissionCost: costs.com,
    adCost: costs.ad,
    otherCost: v('otherCostInput')
  }));
  renderDiagnosisMessages(getBusinessDiagnosis({
    sale,
    profit: costs.profit,
    profitRate: costs.profitRate,
    purchaseCost: v('purchaseCost'),
    logisticsCost: log,
    commissionCost: costs.com,
    adCost: costs.ad,
    otherCost: v('otherCostInput')
  }));
  lastProfitSnapshot = {
    mainInputValid: true,
    sale,
    saleRub: rub,
    profit: costs.profit,
    profitRate: costs.profitRate,
    purchaseCost: v('purchaseCost'),
    logisticsCost: log,
    adCost: costs.ad,
    commissionCost: costs.com
  };
  renderAiCompactSummary();
  renderProductSelection(lastProfitSnapshot);
  refreshDecisionDataValidationIfVisible();

  if (r) {
    setText('matchedChannel', r.c);
    setText('chargeWeight', (r.cg / 1000).toFixed(3) + 'kg');
    setText('volumeWeightDisplay', r.vol.toFixed(3) + 'kg');
    setText('operationFeeDisplay', m(r.op) + '/票');
    setText('unitRateDisplay', r.unitText);
    document.getElementById('matchNotice').classList.remove('danger');
    document.getElementById('matchNotice').innerHTML = `已匹配：<b>${r.s} - ${r.c}</b>，时效：<b>${r.d}</b>，尺寸限制：三边和≤${r.sum}cm，最长边≤${r.side}cm。物流单价费用：<b>${m(r.unitFee)}</b>，每票操作费：<b>${m(r.op)}</b>。`;

    if (r.needThrow) {
      throwTip.style.display = 'block';
      throwTip.innerHTML = `⚠️ 此产品需计抛，体积重为 ${r.vol.toFixed(3)} kg，已按体积重计算物流费用。`;
    } else {
      throwTip.style.display = 'none';
      throwTip.innerHTML = '';
    }
  } else {
    setText('matchedChannel', '未匹配');
    setText('chargeWeight', '0g');
    setText('volumeWeightDisplay', volumeKg(v('length'), v('width'), v('height')).toFixed(3) + 'kg');
    setText('operationFeeDisplay', '¥0.00/票');
    setText('unitRateDisplay', '¥0.0000/g');
    document.getElementById('matchNotice').classList.add('danger');
    document.getElementById('matchNotice').textContent = logisticsValidationMessage() || failReason(getLogisticsInput());
    throwTip.style.display = 'none';
    throwTip.innerHTML = '';
  }
}

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  platform = b.dataset.platform;
  updateActivePlatformTab();
  applyTheme();
  syncProductSelectionPlatform();
  fillSuppliers();
  persistFormState();
  calc();
});

supplier.onchange = () => {
  fillServices();
  persistFormState();
  calc();
};

service.onchange = () => {
  persistFormState();
  calc();
};

document.querySelectorAll('input,select,textarea').forEach(e => {
  e.addEventListener('input', () => {
    if (apiPreparationFieldIds.includes(e.id)) {
      renderAiAnalysisStatusModel();
      return;
    }

    if (['subsidySalePrice', 'subsidyAmountInput', 'subsidyRateInput'].includes(e.id)) {
      lastSubsidyField = e.id;
    }

    if (e.id === 'rubRate') {
      setReferenceRateStatus('已手动修改 · 请自行确认汇率假设。');
    }

    if (e.id === 'sourceProductUrl') {
      handleSourceUrlChanged();
    } else {
      if (e.id === 'manualProductTitle') handleManualTitleChanged();
      if (e.id === 'imageUrl') handleManualImageChanged();
      if (e.id === 'manualProductCategory') handleManualCategoryChanged();
      if (e.id === 'manualSourceCost') handleManualSourceCostChanged();
      if (['manualProductTitle', 'manualProductTextHelper', 'manualProductNotes', 'manualSourceCost', 'productEvidencePack'].includes(e.id)) {
        applyManualProductTextAssistance({ replaceAutoTitle: e.id === 'manualProductTextHelper' });
      }
    }

    if (e.id !== 'sourceProductUrl' && (manualProductFieldIds.includes(e.id) || manualTestingAssumptionFieldIds.includes(e.id) || e.id === 'imageUrl')) {
      setProductLinkPreviewStatus();
      setAutoAnalysisProgress('', []);
    }

    persistFormState();
    calc();
  });

  e.addEventListener('change', () => {
    if (apiPreparationFieldIds.includes(e.id)) {
      renderAiAnalysisStatusModel();
      return;
    }

    if (['subsidySalePrice', 'subsidyAmountInput', 'subsidyRateInput'].includes(e.id)) {
      lastSubsidyField = e.id;
    }

    if (e.id === 'rubRate') {
      setReferenceRateStatus('已手动修改 · 请自行确认汇率假设。');
    }

    if (e.id === 'sourceProductUrl') {
      handleSourceUrlChanged();
    } else {
      if (e.id === 'manualProductTitle') handleManualTitleChanged();
      if (e.id === 'imageUrl') handleManualImageChanged();
      if (e.id === 'manualProductCategory') handleManualCategoryChanged();
      if (e.id === 'manualSourceCost') handleManualSourceCostChanged();
      if (['manualProductTitle', 'manualProductTextHelper', 'manualProductNotes', 'manualSourceCost', 'productEvidencePack'].includes(e.id)) {
        applyManualProductTextAssistance({ replaceAutoTitle: e.id === 'manualProductTextHelper' });
      }
    }

    if (e.id !== 'sourceProductUrl' && (manualProductFieldIds.includes(e.id) || manualTestingAssumptionFieldIds.includes(e.id) || e.id === 'imageUrl')) {
      setProductLinkPreviewStatus();
      setAutoAnalysisProgress('', []);
    }

    persistFormState();
    calc();
  });
});

mountAiAnalysisWorkspace();
bindAppViewSwitching();
bindExchangeRateHelper();
bindOzonAnalysisControls();
bindTopicTagAssistantControls();
bindBackendWorkerUrlControls();
bindOzonTemporaryConnectionControls();
bindStoreApiManager();
applyTheme();
updateActivePlatformTab();
fillSuppliers();
restoreFormState();
syncProductSelectionPlatform();
renderInitialReferenceRateStatus();
calc();
renderAiAnalysisStatusModel();
switchAppView('profit');
