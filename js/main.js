// 负责读取页面输入、更新页面显示、绑定交互事件。
let platform = 'Ozon';
let lastSubsidyField = 'subsidySalePrice';
let currentValidation = { values: {}, errors: [], warnings: [], invalidIds: [], warningIds: [] };
let lastProfitSnapshot = null;
let lastOzonAutoAnalysis = null;

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

function setAutoAnalysisProgress(activeStep, doneSteps = []) {
  document.querySelectorAll('#autoAnalysisProgress [data-step]').forEach(step => {
    const name = step.dataset.step;
    step.classList.toggle('is-active', name === activeStep);
    step.classList.toggle('is-done', doneSteps.includes(name));
  });
}

function renderOzonAnalysisDetails(analysis) {
  const source = analysis && analysis.source ? analysis.source : {};
  const insights = analysis && analysis.insights ? analysis.insights : {};
  const ozon = analysis && analysis.ozon ? analysis.ozon : {};
  const keywords = typeof formatList === 'function' ? formatList(insights.keywords, '等待提取') : '等待提取';
  const tags = typeof formatList === 'function' ? formatList(insights.tags, '等待提取') : '等待提取';

  setText('sourceProductInsight', `${source.title || '未识别标题'} · ${source.host || '未知来源'} · ${insights.category || '类目待复核'}`);
  setText('sourceKeywordInsight', `关键词：${keywords}。标签：${tags}。`);
  setText('ozonApiInsight', ozon.message || '等待 Ozon API 状态。');
  setText('analysisLimitInsight', (analysis && analysis.limitations && analysis.limitations.length)
    ? analysis.limitations.join('；')
    : 'Phase 4A 不生成未经验证的全平台竞品数据；官方 API 不支持的数据会明确标注。');
  renderProductImagePreview(source.image || fieldValue('imageUrl'));
}

function renderOzonAutoAnalysis(analysis) {
  if (!analysis) return;

  lastOzonAutoAnalysis = analysis;
  renderOzonAnalysisDetails(analysis);
  renderProductSelectionReport(analysis.report);
}

async function checkOzonWorkerHealth() {
  if (typeof requestOzonWorkerHealth !== 'function') return;

  try {
    const health = await requestOzonWorkerHealth();
    const ozon = health.ozon || {};
    setText('ozonApiInsight', ozon.message || '等待 Ozon API 状态。');
    setText('analysisLimitInsight', health.ok
      ? '后端服务已响应。若 Ozon 凭证缺失，请在 Cloudflare 环境变量中配置。'
      : '前端当前未连接 Cloudflare Worker，智能分析会显示 API 服务未连接。');
  } catch (error) {
    setText('ozonApiInsight', error.message || 'API 健康检查失败。');
    setText('analysisLimitInsight', '请检查 js/config.js 中的 Worker 地址和 Cloudflare Worker 部署状态。');
  }
}

function getAnalysisPayload() {
  return {
    sourceUrl: fieldValue('sourceProductUrl'),
    activePlatform: platform,
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

async function runOzonAutoAnalysis() {
  const sourceUrl = fieldValue('sourceProductUrl');
  const button = document.getElementById('autoAnalysisButton');

  if (!sourceUrl) {
    setAutoAnalysisStatus('请先粘贴来源商品链接。', 'is-error');
    setAutoAnalysisProgress('', []);
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
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = '分析中...';
  }

  setAutoAnalysisStatus('正在读取链接并生成 Ozon 选品报告...', 'is-loading');
  setAutoAnalysisProgress('link', []);

  try {
    await new Promise(resolve => setTimeout(resolve, 180));
    setAutoAnalysisProgress('identify', ['link']);

    const analysis = await requestOzonProductAnalysis(getAnalysisPayload());
    setAutoAnalysisProgress('report', ['link', 'identify', 'ozon']);
    renderOzonAutoAnalysis(analysis);
    setAutoAnalysisStatus(analysis.ok ? '分析完成。请根据报告复核利润、广告和 Ozon 数据状态。' : analysis.report.summary, analysis.ok ? '' : 'is-error');
    setAutoAnalysisProgress('', ['link', 'identify', 'ozon', 'report']);
    persistFormState();
  } catch (error) {
    const fallback = buildApiDisconnectedAnalysis(sourceUrl, lastProfitSnapshot);
    fallback.report.summary = error.message || fallback.report.summary;
    renderOzonAutoAnalysis(fallback);
    setAutoAnalysisStatus(error.message || 'API 服务异常，请稍后重试。', 'is-error');
    setAutoAnalysisProgress('', ['link']);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = '开始智能分析';
    }
  }
}

function loadDemoOzonAnalysis() {
  const demo = buildDemoOzonAnalysis(lastProfitSnapshot);
  renderOzonAutoAnalysis(demo);
  setAutoAnalysisStatus('已加载示例报告。真实数据需要部署 Worker 并配置 Ozon API 凭证。');
  setAutoAnalysisProgress('', ['link', 'identify', 'ozon', 'report']);
}

function renderProductSelection(profitSnapshot) {
  if (lastOzonAutoAnalysis && fieldValue('sourceProductUrl') === (lastOzonAutoAnalysis.source && lastOzonAutoAnalysis.source.url)) {
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

function applyPresetTemplate(templateId) {
  if (typeof getPresetTemplate !== 'function') return;

  const template = getPresetTemplate(templateId);
  if (!template) return;

  if (template.platform && rules.some(rule => rule.p === template.platform)) {
    platform = template.platform;
  }

  applyTheme();
  updateActivePlatformTab();
  syncProductSelectionPlatform();
  fillSuppliers();

  const supplierEl = document.getElementById('supplier');
  if (template.supplier && optionExists(supplierEl, template.supplier)) {
    supplierEl.value = template.supplier;
    fillServices();
  }

  const serviceEl = document.getElementById('service');
  if (template.service && optionExists(serviceEl, template.service)) {
    serviceEl.value = template.service;
  }

  Object.keys(template.fields).forEach(id => {
    setInput(id, template.fields[id]);
  });

  lastSubsidyField = 'subsidySalePrice';
  persistFormState();
  calc();
  setText('presetApplyStatus', `已应用预设：${template.name}，当前输入已替换为示例值。`);
}

function bindPresetControls() {
  const select = document.getElementById('presetTemplateSelect');
  const button = document.getElementById('applyPresetButton');

  if (!select || !button) return;

  button.addEventListener('click', () => {
    applyPresetTemplate(select.value);
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

document.querySelectorAll('input,select').forEach(e => {
  e.addEventListener('input', () => {
    if (['subsidySalePrice', 'subsidyAmountInput', 'subsidyRateInput'].includes(e.id)) {
      lastSubsidyField = e.id;
    }

    if (e.id === 'rubRate') {
      setReferenceRateStatus('已手动修改 · 请自行确认汇率假设。');
    }

    if (e.id === 'sourceProductUrl') {
      lastOzonAutoAnalysis = null;
      setAutoAnalysisStatus('链接已修改，请重新开始智能分析。');
      setAutoAnalysisProgress('', []);
    }

    persistFormState();
    calc();
  });

  e.addEventListener('change', () => {
    if (['subsidySalePrice', 'subsidyAmountInput', 'subsidyRateInput'].includes(e.id)) {
      lastSubsidyField = e.id;
    }

    if (e.id === 'rubRate') {
      setReferenceRateStatus('已手动修改 · 请自行确认汇率假设。');
    }

    if (e.id === 'sourceProductUrl') {
      lastOzonAutoAnalysis = null;
      setAutoAnalysisStatus('链接已修改，请重新开始智能分析。');
      setAutoAnalysisProgress('', []);
    }

    persistFormState();
    calc();
  });
});

bindExchangeRateHelper();
bindPresetControls();
bindOzonAnalysisControls();
applyTheme();
updateActivePlatformTab();
fillSuppliers();
restoreFormState();
syncProductSelectionPlatform();
renderInitialReferenceRateStatus();
calc();
checkOzonWorkerHealth();
