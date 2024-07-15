// @ts-ignore
import * as echarts from "echarts/lib/echarts";
import { extend } from "zrender/lib/core/util.js";

const positiveColorQuery = ["itemStyle", "color"];
const negativeColorQuery = ["itemStyle", "color0"];
const subtotalColorQuery = ["itemStyle", "color1"];

// @ts-ignore
function createWaterfallVisual(ecModel, api) {
  // @ts-ignore
  ecModel.eachSeriesByType("waterfall", function (seriesModel) {
    const data = seriesModel.getData();
    const isLargeRender = seriesModel.pipelineContext.large;
    data.setVisual({
      legendSymbol: "roundRect",
      colorP: getColor(1, seriesModel),
      colorN: getColor(-1, seriesModel),
      colorS: getColor(0, seriesModel),
    }); // Only visible series has each data be visual encoded

    if (ecModel.isSeriesFiltered(seriesModel)) {
      return;
    }

    !isLargeRender && progress();

    function progress() {
      data.each((idx: number) => {
        const itemModel = data.getItemModel(idx);
        const isSubtotal = itemModel.option.isSubtotal;
        const sign = data.getItemLayout(idx).sign;
        const style = itemModel.getItemStyle();
        style.fill = getColor(isSubtotal ? 0 : sign, itemModel);
        const existsStyle = data.ensureUniqueItemVisual(idx, "style");
        extend(existsStyle, style);
      })
    }

    // @ts-ignore
    function getColor(sign, model) {
      if (sign === 0) return model.get(subtotalColorQuery)
      return model.get(sign > 0 ? positiveColorQuery : negativeColorQuery);
    }
  });
}

echarts.registerVisual(
  echarts.PRIORITY.VISUAL.CHART + 1,
  createWaterfallVisual
);
