// @ts-nocheck
import { extend } from 'zrender/lib/core/util.js';

const positiveColorQuery = ['itemStyle', 'colorPositive'];
const negativeColorQuery = ['itemStyle', 'colorNegative'];
const subtotalColorQuery = ['itemStyle', 'colorSubtotal'];

function WaterfallVisual(ecModel) {
  ecModel.eachSeriesByType('waterfall', function (seriesModel) {
    const data = seriesModel.getData();
    const isLargeRender = seriesModel.pipelineContext.large;

    data.setVisual({
      legendSymbol: 'roundRect',
      colorPositive: getColor(1, seriesModel),
      colorNegative: getColor(-1, seriesModel),
      colorSubtotal: getColor(0, seriesModel),
    });

    if (ecModel.isSeriesFiltered(seriesModel)) return;

    !isLargeRender && progress();

    function progress() {
      data.each((idx: number) => {
        const itemModel = data.getItemModel(idx);
        const isSubtotal = itemModel.option.isSubtotal;
        const sign = data.getItemLayout(idx).sign;
        const style = itemModel.getItemStyle();
        const color = getColor(isSubtotal ? 0 : sign, itemModel);
        style.fill = color;
        const existsStyle = data.ensureUniqueItemVisual(idx, 'style');
        extend(existsStyle, style);
      });
    }
  });
}

export function getColor(sign, model) {
  if (sign === 0) return model.get(subtotalColorQuery);
  const res = model.get(sign > 0 ? positiveColorQuery : negativeColorQuery);
  return res;
}

export default WaterfallVisual;
