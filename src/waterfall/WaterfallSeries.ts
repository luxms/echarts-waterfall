// @ts-nocheck
import * as echarts from "echarts/lib/echarts";
import { WhiskerBoxCommonMixin } from "echarts/lib/chart/helper/whiskerBoxCommon.js";
import * as zrUtil from "zrender/lib/core/util";

const WaterfallSeries = echarts.extendSeriesModel({
  type: "series.waterfall",

  optionUpdated: function () {
    const option = this.option;
    option.gridSize = Math.max(Math.floor(option.gridSize), 4);
  },

  getInitialData: function (option, ecModel) {
    const dimensions = echarts.helper.createDimensions(option.data, {
      coordDimensions: this.defaultValueDimensions,
    });
    const list = new echarts.List(dimensions, this);
    list.initData(option.data);
    return list;
  },

  defaultValueDimensions: [
    { name: "open", defaultTooltip: true },
    { name: "close", defaultTooltip: true },
  ],

  defaultOption: {
    z: 2,
    coordinateSystem: "cartesian2d",
    legendHoverLink: true,
    layout: null,
    clip: true,
    itemStyle: {
      color: "green",
      color0: "red",
      color1: "blue",
      borderWidth: 1,
    },
    emphasis: {
      scale: true,
      itemStyle: {
        borderWidth: 2,
      },
    },
    barMaxWidth: null,
    barMinWidth: null,
    barWidth: null,
    large: true,
    largeThreshold: 600,
    progressive: 3e3,
    progressiveThreshold: 1e4,
    progressiveChunkMode: "mod",
    animationEasing: "linear",
    animationDuration: 300,
  },
});

zrUtil.mixin(WaterfallSeries, WhiskerBoxCommonMixin, true);
