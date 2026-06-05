// 负责读取页面输入、更新页面显示、绑定交互事件。
let platform = 'Ozon';
let lastSubsidyField = 'subsidySalePrice';
let currentValidation = { values: {}, errors: [], warnings: [], invalidIds: [], warningIds: [] };
let lastProfitSnapshot = null;
let lastOzonAutoAnalysis = null;
let ozonTemporaryConnectionState = { status: 'not_connected', message: '未测试' };
let sourcePreviewState = {
  lastPreviewUrl: '',
  activeRequestUrl: '',
  lastAutoFilledTitle: '',
  lastAutoFilledImage: '',
  lastAutoFilledSourceCost: '',
  lastSuggestedCategory: '',
  isTitleAutoFilledFromPreview: false,
  isImageAutoFilledFromPreview: false,
  isSourceCostAutoFilledFromPreview: false,
  isCategorySuggestedFromAssist: false
};

const apiPreparationFieldIds = [
  'ozonTestStoreName',
  'ozonTestClientId',
  'ozonTestApiKey',
  'ozonWorkerUrl'
];

const manualProductFieldIds = [
  'manualProductTitle',
  'manualSourceCost',
  'manualProductCategory',
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
  'localPreference'
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
  'sourceProductUrl',
  'manualProductTitle',
  'manualSourceCost',
  'manualProductCategory',
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
  'localPreference'
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
      text: '当前利润率只是勉强可测，不适合直接放量。建议小量测试，并优先确认采购、物流、广告和退货假设。'
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
    text: '当前利润有一定空间，但仍建议小量测试，并复核退货率、广告消耗和汇率波动。'
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
  setText('aiAnalysisModeStatus', apiConnected && workerConfigured ? 'Authorized preview' : 'Preview / manual');
  setText('aiDataSourceStatus', apiConnected ? 'API connected' : workerConfigured ? 'Manual + Worker ready' : 'Manual input');
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
  setText('selectionCompetitionText', report.competitionText);
  setText('selectionAdText', report.adText);
  setText('selectionStoreText', report.storeText);
  setText('aiResultBox', report.summary);

  const list = document.getElementById('selectionNextActions');
  if (!list) return;

  list.textContent = '';
  report.actions.forEach(action => {
    const li = document.createElement('li');
    li.textContent = action;
    list.appendChild(li);
  });
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
  const manualTitle = fieldValue('manualProductTitle');

  if (!sourceUrl) {
    setAutoAnalysisStatus('等待粘贴来源商品链接。当前为手动/预览分析模式。');
    renderAiAnalysisStatusModel();
    return;
  }

  try {
    const parsed = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid');
    const workerConfigured = hasConfiguredWorkerUrl();
    setAutoAnalysisStatus(manualTitle
      ? '已识别来源链接。当前会基于商品信息和利润测算生成预览，手动字段仍可编辑。'
      : workerConfigured
        ? '已识别来源链接。点击生成时会尝试读取公开页面元数据；如果读取失败，请手动填写商品标题、采购价和类目信息。'
        : '已识别来源链接，但当前未配置 Worker 公开元数据预览。请手动填写商品标题、采购价和类目信息后继续分析。');
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

function formatExtractedSourcePrice(source) {
  if (!source || source.price === null || source.price === undefined || source.price === '') return '未识别价格';

  const price = Number(source.price);
  const priceText = Number.isFinite(price) ? price.toFixed(2) : String(source.price);
  return `${source.currency || '未识别币种'} ${priceText}`;
}

function getSourcePriceRoleNotice(source) {
  if (!source) return '未能自动识别价格，请手动填写或确认。';
  if (source.price === null || source.price === undefined || source.price === '') return '未能自动识别价格，请手动填写或确认。';
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
    el.textContent = '公开商品信息识别结果会显示在这里。';
    return;
  }

  const source = preview.source;
  const priceNotice = getSourcePriceRoleNotice(source);
  const platformText = `${source.platform || source.host || '未知平台'} / ${source.platformType || 'unknown'}`;
  const priceText = formatExtractedSourcePrice(source);
  const categoryText = source.categorySuggestion ? `类目建议：${source.categorySuggestion}` : '类目建议：未识别';
  const statusText = preview.ok ? '识别成功' : (preview.message || '识别失败，请手动填写。');

  if (!preview.ok) {
    el.classList.add('is-error');
  } else if (source.priceRole === 'candidate_source_cost' || source.priceRole === 'market_reference_price' || source.price === null) {
    el.classList.add('is-warning');
  }

  el.textContent = `${statusText}。平台：${platformText}。价格：${priceText}。${priceNotice}。${categoryText}。置信度：${formatExtractionConfidence(source)}。${formatExtractionSources(source)}。`;
}

function resetSourcePreviewTracking() {
  sourcePreviewState.lastPreviewUrl = '';
  sourcePreviewState.activeRequestUrl = '';
  sourcePreviewState.lastAutoFilledTitle = '';
  sourcePreviewState.lastAutoFilledImage = '';
  sourcePreviewState.lastAutoFilledSourceCost = '';
  sourcePreviewState.lastSuggestedCategory = '';
  sourcePreviewState.isTitleAutoFilledFromPreview = false;
  sourcePreviewState.isImageAutoFilledFromPreview = false;
  sourcePreviewState.isSourceCostAutoFilledFromPreview = false;
  sourcePreviewState.isCategorySuggestedFromAssist = false;
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
  setText('sourceProductInsight', '等待分析来源链接。');
  setText('sourceKeywordInsight', '等待提取关键词和主题标签。');
  setText('ozonApiInsight', '可选 Ozon 店铺商品摘要未连接，不影响本次测品建议。');
  setText('analysisLimitInsight', '未开始分析。');
  renderSourceExtractionDetails(null);
  renderProductImagePreview(fieldValue('imageUrl'));
}

function handleSourceUrlChanged() {
  const currentUrl = normalizeSourcePreviewUrl(fieldValue('sourceProductUrl'));
  const trackedUrl = normalizeSourcePreviewUrl(sourcePreviewState.lastPreviewUrl || sourcePreviewState.activeRequestUrl);
  const urlChanged = trackedUrl && trackedUrl !== currentUrl;

  if (urlChanged) {
    clearAutoFilledSourcePreviewFields();
  } else {
    resetSourcePreviewTracking();
  }

  lastOzonAutoAnalysis = null;
  clearSourcePreviewDisplay();
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
  const helperText = fieldValue('manualProductTextHelper');
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
    : '已识别来源链接，但当前不会自动抓取商品标题。请手动填写商品标题、采购价和类目信息后继续分析。';
  const titleText = source.title || (source.url ? manualGuidance : '未识别标题');
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
    : 'Phase 4A 不生成未经验证的全平台竞品数据；官方 API 不支持的数据会明确标注。');
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
    if (!fieldValue('manualSourceCost') && Number.isFinite(extractedPrice)) {
      const priceText = String(extractedPrice);
      setInput('manualSourceCost', priceText);
      sourcePreviewState.lastAutoFilledSourceCost = priceText;
      sourcePreviewState.isSourceCostAutoFilledFromPreview = true;
      actions.push('已把候选采购价填入采购价字段，请确认是否为真实拿货成本');
    } else {
      actions.push('识别到候选采购价，但当前采购价已填写，请人工复核');
    }
    setManualProductAssistStatus('识别到的是候选采购价，请确认是否为真实拿货成本。');
  } else if (hasExtractedPrice && source.priceRole === 'market_reference_price') {
    actions.push('识别到平台销售参考价，不会自动写入采购价');
    setManualProductAssistStatus('识别到的是平台销售参考价，不等于你的采购成本。请手动填写真实采购价。');
  } else if (preview.ok) {
    actions.push('未能自动识别价格，请手动填写或确认');
  }

  if (preview.ok) {
    return actions.length
      ? actions.join('，') + '；手动字段仍可编辑。'
      : '已读取公开商品信息；手动字段仍可编辑。';
  }

  applyManualProductTextAssistance({ replaceAutoTitle: false });

  return preview.message || (typeof getSourcePreviewFallbackMessage === 'function'
    ? getSourcePreviewFallbackMessage()
    : '无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。');
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
  analysis.source.categorySuggestion = preview.ok ? source.categorySuggestion || '' : '';
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
    title: fieldValue('manualProductTitle'),
    sourceCost: readOptionalNumber('manualSourceCost'),
    category: fieldValue('manualProductCategory'),
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
    localPreference: fieldValue('localPreference')
  };
}

function applyCurrentManualAnalysisContext(analysis, profitSnapshot = lastProfitSnapshot) {
  if (!analysis) return analysis;

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
    selectedStore: selectedStore ? {
      platform: selectedStore.platform,
      credentialRef: selectedStore.credentialRef,
      name: selectedStore.name
    } : null,
    profitSnapshot: lastProfitSnapshot,
    assumptions: {
      adShare: readOptionalNumber('selectionAdShare'),
      adType: fieldValue('selectionAdType') || 'Ozon 搜索与推荐',
      storeType: fieldValue('storeType'),
      storeOrderRange: fieldValue('storeOrderRange'),
      localPreference: fieldValue('localPreference')
    }
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

  if (!sourceUrl) {
    setAutoAnalysisStatus('请先粘贴来源商品链接。', 'is-error');
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
  lastOzonAutoAnalysis = null;
  clearSourcePreviewDisplay();
  setAutoAnalysisStatus('已接收来源链接。正在尝试读取公开页面元数据；如已配置 Worker，仅会请求安全预览和可选授权店铺摘要。', 'is-loading');
  setAutoAnalysisProgress('link', []);

  try {
    await new Promise(resolve => setTimeout(resolve, 180));
    setAutoAnalysisProgress('identify', ['link']);

    let sourcePreview = null;
    let sourcePreviewStatus = '';

    if (typeof requestSourcePreview === 'function') {
      try {
        sourcePreview = await requestSourcePreview(sourceUrl);
        if (!sourceInputStillMatches(sourceUrl)) {
          setAutoAnalysisStatus('来源链接已变化。旧链接预览已忽略，请重新点击生成测品建议。');
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
            priceRole: 'unknown'
          },
          message: '公开页面元数据预览暂不可用，请继续手动填写商品信息。',
          limitations: [error.message || 'source preview 请求失败。']
        };
        renderSourceExtractionDetails(sourcePreview);
        sourcePreviewStatus = sourcePreview.message;
      }
    }

    if (!sourceInputStillMatches(sourceUrl)) {
      setAutoAnalysisStatus('来源链接已变化。旧链接分析已忽略，请重新点击生成测品建议。');
      setAutoAnalysisProgress('', []);
      return;
    }

    applyManualProductTextAssistance({ replaceAutoTitle: false });
    let analysis = await requestOzonProductAnalysis(getAnalysisPayload());
    if (!sourceInputStillMatches(sourceUrl)) {
      setAutoAnalysisStatus('来源链接已变化。旧链接报告已忽略，请重新点击生成测品建议。');
      setAutoAnalysisProgress('', []);
      return;
    }

    analysis = mergeSourcePreviewIntoAnalysis(analysis, sourcePreview, sourceUrl);
    applyCurrentManualAnalysisContext(analysis);
    syncOzonTemporaryConnectionStateFromAnalysis(analysis);
    setAutoAnalysisProgress('report', ['link', 'identify', 'ozon']);
    renderOzonAutoAnalysis(analysis);
    const ozonConnected = analysis.ozon && analysis.ozon.status === 'connected';
    setAutoAnalysisStatus(
      ozonConnected
        ? '测品建议已生成。请复核利润、手动假设和 Ozon 可选上下文状态。'
        : sourcePreviewStatus || '测品建议已生成。请查看报告中的数据边界说明。',
      ''
    );
    setAutoAnalysisProgress('', ['link', 'identify', 'ozon', 'report']);
    persistFormState();
  } catch (error) {
    const fallback = buildApiDisconnectedAnalysis(sourceUrl, lastProfitSnapshot, getManualProductInput());
    fallback.ozon.status = 'api_error';
    fallback.ozon.message = error.message || 'Worker 产品摘要暂不可用。';
    applyCurrentManualAnalysisContext(fallback);
    renderOzonAutoAnalysis(fallback);
    setAutoAnalysisStatus('测品建议已生成。可选店铺摘要暂不可用，请查看报告中的数据边界说明。');
    setAutoAnalysisProgress('', ['link']);
  } finally {
    setInput('ozonTestApiKey', '');
    if (button) {
      button.disabled = false;
      button.textContent = '生成测品建议';
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
  const demoButton = document.getElementById('loadDemoAnalysisButton');

  if (analyzeButton) {
    analyzeButton.addEventListener('click', () => {
      runOzonAutoAnalysis();
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
      if (['manualProductTitle', 'manualProductTextHelper', 'manualProductNotes', 'manualSourceCost'].includes(e.id)) {
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
      if (['manualProductTitle', 'manualProductTextHelper', 'manualProductNotes', 'manualSourceCost'].includes(e.id)) {
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
