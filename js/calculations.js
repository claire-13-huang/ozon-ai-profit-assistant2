// 只放不直接读取或修改页面 DOM 的计算函数。
function m(n) {
  return '¥' + n.toFixed(2);
}

function uniq(a) {
  return [...new Set(a)];
}

function volumeKg(l, wd, h) {
  return l && wd && h ? l * wd * h / 12000 : 0;
}

function feeParts(r, cg, rate) {
  if (!r) {
    return { unitText: '¥0.0000/g', op: 0, unitFee: 0, total: 0 };
  }

  if (r.rub) {
    const op = r.fr / rate;
    const unit = (r.rkg / 1000) / rate;
    const unitFee = cg * unit;
    return { unitText: '¥' + unit.toFixed(4) + '/g', op, unitFee, total: op + unitFee };
  }

  if (r.rkg) {
    const unit = r.rkg / 1000;
    const unitFee = cg * unit;
    return { unitText: '¥' + unit.toFixed(4) + '/g', op: r.f, unitFee, total: r.f + unitFee };
  }

  const unitFee = cg * r.rg;
  return { unitText: '¥' + r.rg.toFixed(4) + '/g', op: r.f, unitFee, total: r.f + unitFee };
}

function matchLogistics(input) {
  const price = input.salePrice;
  const rate = input.rubRate;
  const rub = price * rate;
  const w = input.weight;
  const l = input.length;
  const wd = input.width;
  const h = input.height;
  const sum = l + wd + h;
  const side = Math.max(l, wd, h);
  const vol = volumeKg(l, wd, h);

  if (!price || !w) {
    return null;
  }

  const list = rules
    .filter(r => r.p === input.platform && r.s === input.supplier && (input.service === '自动' || r.t === input.service) && w >= r.minG && w <= r.maxG && rub >= r.minR && rub <= r.maxR && (!sum || sum <= r.sum) && (!side || side <= r.side))
    .map(r => {
      const vg = vol * 1000;
      const cg = r.v ? Math.max(w, vg) : w;
      const parts = feeParts(r, cg, rate);
      return { ...r, cg, vol, needThrow: r.v && vg > w, unitFee: parts.unitFee, op: parts.op, unitText: parts.unitText, fee: parts.total };
    });

  list.sort((a, b) => a.fee - b.fee);
  return list[0] || null;
}

function failReason(input) {
  const price = input.salePrice;
  const rate = input.rubRate;
  const rub = price * rate;
  const w = input.weight;
  const l = input.length;
  const wd = input.width;
  const h = input.height;
  const sum = l + wd + h;
  const side = Math.max(l, wd, h);
  const base = rules.filter(r => r.p === input.platform && r.s === input.supplier && (input.service === '自动' || r.t === input.service));

  if (!price || !w) {
    return '请先输入预设售价和毛重。';
  }

  if (!base.some(r => w >= r.minG && w <= r.maxG)) {
    return '重量不符合当前供应商/时效的渠道范围。';
  }

  if (!base.some(r => rub >= r.minR && rub <= r.maxR)) {
    return '售价折合卢布后不符合当前渠道货值范围。';
  }

  if (sum && side && !base.some(r => sum <= r.sum && side <= r.side)) {
    return `尺寸超限：当前三边和 ${sum.toFixed(1)}cm，最长边 ${side.toFixed(1)}cm。`;
  }

  return '未找到符合当前价格、重量、尺寸、平台、供应商和时效的渠道。';
}

function calculateSubsidy(input) {
  const sale = input.sale;
  let subSale = input.subSale;
  let amount = input.amount;
  let rate = input.rate;
  const updates = {};

  if (!sale) {
    return { subSale: 0, amount: 0, rate: 0, updates };
  }

  if (input.lastSubsidyField === 'subsidyAmountInput') {
    amount = Math.min(Math.max(amount, 0), sale);
    subSale = sale - amount;
    rate = amount / sale * 100;
    updates.subsidySalePrice = subSale.toFixed(2);
    updates.subsidyRateInput = rate.toFixed(2);
  } else if (input.lastSubsidyField === 'subsidyRateInput') {
    rate = Math.min(Math.max(rate, 0), 100);
    amount = sale * rate / 100;
    subSale = sale - amount;
    updates.subsidySalePrice = subSale.toFixed(2);
    updates.subsidyAmountInput = amount.toFixed(2);
  } else {
    if (!subSale) {
      amount = 0;
      rate = 0;
    } else {
      subSale = Math.min(Math.max(subSale, 0), sale);
      amount = sale - subSale;
      rate = amount / sale * 100;
    }

    updates.subsidyAmountInput = amount ? amount.toFixed(2) : '';
    updates.subsidyRateInput = rate ? rate.toFixed(2) : '';
  }

  return { subSale, amount, rate, updates };
}

function calculateProfit(input) {
  const com = input.sale * input.commissionRate / 100;
  const ad = input.sale * input.adRate / 100;
  const tax = input.sale * input.taxRate / 100;
  const withdraw = input.sale * input.withdrawRate / 100;
  const returnCost = input.sale * input.returnRate / 100;
  const total = input.purchaseCost + input.logisticsCost + com + ad + tax + withdraw + returnCost + input.labelFee + input.otherCost;
  const profit = input.sale - total;
  const profitRate = input.sale ? profit / input.sale * 100 : 0;
  const otherRate = input.sale ? input.otherCost / input.sale * 100 : 0;

  return { com, ad, tax, withdraw, returnCost, total, profit, profitRate, otherRate };
}
