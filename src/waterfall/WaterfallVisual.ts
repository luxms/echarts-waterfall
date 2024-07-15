// @ts-ignore
import * as echarts from "echarts/lib/echarts";
import { extend } from "zrender/lib/core/util.js";

const positiveColorQuery = ["itemStyle", "color"];
const negativeColorQuery = ["itemStyle", "color0"];

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
    }); // Only visible series has each data be visual encoded

    if (ecModel.isSeriesFiltered(seriesModel)) {
      return;
    }

    !isLargeRender && progress();

    // @ts-ignore
    function progress() {
      let dataIndex = 0;
      while (dataIndex !== 4) {
        const itemModel = data.getItemModel(dataIndex);
        const sign = data.getItemLayout(dataIndex).sign;
        const style = itemModel.getItemStyle();
        style.fill = getColor(sign, itemModel);
        const existsStyle = data.ensureUniqueItemVisual(dataIndex, "style");
        extend(existsStyle, style);
        dataIndex++;
      }
    }

    // @ts-ignore
    function getColor(sign, model) {
      return model.get(sign > 0 ? positiveColorQuery : negativeColorQuery);
    }
  });
}

echarts.registerVisual(
  echarts.PRIORITY.VISUAL.CHART + 1,
  createWaterfallVisual
);
