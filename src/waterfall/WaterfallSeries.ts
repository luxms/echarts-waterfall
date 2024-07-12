// @ts-nocheck
import * as echarts from 'echarts';

// Видимо тоже расширяет (создает новый) класс, к чему-то можно обращаться по this
// Нас в превую очередь интересует SeriesOption
// interface SeriesModel<Opt extends SeriesOption = SeriesOption> extends DataFormatMixin, PaletteMixin<Opt>, DataHost
// --------------------------
echarts.extendSeriesModel({
  type: 'series.waterfall',

  optionUpdated: function () {
    const option = this.option;
    option.gridSize = Math.max(Math.floor(option.gridSize), 4);
  },

  // Первым делом приходим сюда
  getInitialData: function (option, ecModel) {
    // createDimensions(source: Source | OptionSourceData, opt?: PrepareSeriesDataSchemaParams): SeriesDimensionDefine[];
    const dimensions = echarts.helper.createDimensions(option.data, {
      coordDimensions: ['x', 'y']
    });
    // constructor(dimensionsInput: SeriesDataSchema | SeriesDimensionDefineLoose[], hostModel: HostModel);
    const list = new echarts.List(dimensions, this);
    list.initData(option.data);
    debugger;
    return list;
  },

  // Дименшены из candlestick
  defaultValueDimensions: [
    {name: 'open', defaultTooltip: true},
    {name: 'close', defaultTooltip: true},
    {name: 'lowest', defaultTooltip: true},
    {name: 'highest', defaultTooltip: true},
  ],

  // Опции из candlestick
  defaultOption: {
    z: 2,
    coordinateSystem: 'cartesian2d',
    legendHoverLink: true,
    layout: null,
    clip: true,
    itemStyle: {
      color: '#eb5454', // positive
      color0: '#47b262', // negative
      borderColor: '#eb5454',
      borderColor0: '#47b262',
      borderColorDoji: null,
      borderWidth: 1
    },
    emphasis: {
      scale: true,
      itemStyle: {
        borderWidth: 2
      }
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
    animationDuration: 300
  }
});
