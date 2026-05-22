// 只维护预设模板数据，不参与公式计算。
const presetTemplates = [
  {
    id: 'healthyProfitBaseline',
    name: 'Healthy Profit Baseline',
    platform: 'Ozon',
    supplier: 'CEL',
    service: '自动',
    fields: {
      salePrice: '100',
      rubRate: '12.5',
      weight: '500',
      length: '10',
      width: '10',
      height: '10',
      purchaseCost: '50',
      commissionRate: '10',
      adRate: '5',
      taxRate: '0',
      withdrawRate: '0',
      returnRate: '0',
      labelFee: '1',
      otherCostInput: '2',
      subsidySalePrice: '',
      subsidyAmountInput: '',
      subsidyRateInput: ''
    }
  }
];

function getPresetTemplate(id) {
  return presetTemplates.find(template => template.id === id) || null;
}
