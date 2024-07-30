// @ts-nocheck
import { WhiskerBoxCommonMixin } from 'echarts/lib/chart/helper/whiskerBoxCommon';
import { SeriesModel, helper, List } from 'echarts/lib/echarts';
import { mixin } from 'zrender/lib/core/util';

interface IWaterfallOption {
  itemStyle: {
    colorPositive: string;
    colorNegative: string;
    colorSubtotal: string;
  };
  isSubtotal: boolean;
  //label: SeriesLabelOption;
}

const WaterfallSeries = SeriesModel.extend({
  type: 'series.waterfall',

  getInitialData: function (option) {
    const dimensions = helper.createDimensions(option.data, {
      coordDimensions: this.defaultValueDimensions,
    });
    const list = new List(dimensions, this);
    list.initData(option.data);
    return list;
  },

  defaultValueDimensions: [
    { name: 'start', defaultTooltip: true },
    { name: 'end', defaultTooltip: true },
  ],

  defaultOption: {
    itemStyle: {
      colorPositive: 'green',
      colorNegative: 'red',
      colorSubtotal: 'blue',
    },
    isSubtotal: false,
    label: { show: false },
    septum: { show: false },
    z: 2,
    coordinateSystem: 'cartesian2d',
    legendHoverLink: true,
    layout: null,
    clip: true,
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
    progressiveChunkMode: 'mod',
    animationEasing: 'linear',
    animationDuration: 300,
  },
});

mixin(WaterfallSeries, WhiskerBoxCommonMixin, true);

export default WaterfallSeries;
