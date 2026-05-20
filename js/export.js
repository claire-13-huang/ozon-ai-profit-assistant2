// 只负责把当前页面结果导出为 CSV。
function exportToCSV() {
  const data = {
    '平台': platform,
    '供应商': supplier.value,
    '时效': service.value,
    '预设售价': v('salePrice'),
    '卢布售价': rubPrice.value,
    '补贴后售价': v('subsidySalePrice'),
    '补贴金额': subsidyAmountDisplay.textContent,
    '补贴率': subsidyRateDisplay.textContent,
    '匹配渠道': matchedChannel.textContent,
    '计费重量': chargeWeight.textContent,
    '体积重': volumeWeightDisplay.textContent,
    '渠道操作费': operationFeeDisplay.textContent,
    '物流单价': unitRateDisplay.textContent,
    '物流费用': logisticsCost.textContent,
    '退货率': returnRateDisplay.textContent,
    '退货费用': returnCostDisplay.textContent,
    '总成本': totalCost.textContent,
    '利润': profit.textContent,
    '利润率': profitRate.textContent
  };
  let csv = 'data:text/csv;charset=utf-8,\uFEFF' + Object.keys(data).join(',') + '\n' + Object.values(data).join(',') + '\n';
  const a = document.createElement('a');
  a.href = encodeURI(csv);
  a.download = '多平台物流利润计算表_' + new Date().toLocaleDateString() + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
