// 负责读取页面输入、更新页面显示、绑定交互事件。
let platform = 'Ozon';
let lastSubsidyField = 'subsidySalePrice';

function applyTheme() {
  document.body.classList.remove('theme-ozon', 'theme-wildberries', 'theme-yandex');
  document.body.classList.add(platform === 'Wildberries' ? 'theme-wildberries' : platform === 'Yandex' ? 'theme-yandex' : 'theme-ozon');
}

function v(id) {
  const n = parseFloat(document.getElementById(id).value);
  return isNaN(n) ? 0 : n;
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

function calc() {
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
    document.getElementById('matchNotice').textContent = failReason(getLogisticsInput());
    throwTip.style.display = 'none';
    throwTip.innerHTML = '';
  }
}

document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  platform = b.dataset.platform;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  applyTheme();
  fillSuppliers();
  calc();
});

supplier.onchange = () => {
  fillServices();
  calc();
};

service.onchange = calc;

document.querySelectorAll('input,select').forEach(e => {
  e.addEventListener('input', () => {
    if (['subsidySalePrice', 'subsidyAmountInput', 'subsidyRateInput'].includes(e.id)) {
      lastSubsidyField = e.id;
    }

    calc();
  });

  e.addEventListener('change', () => {
    if (['subsidySalePrice', 'subsidyAmountInput', 'subsidyRateInput'].includes(e.id)) {
      lastSubsidyField = e.id;
    }

    calc();
  });
});

applyTheme();
fillSuppliers();
calc();
