module.exports = (env, options) => {
  return {
    entry: {
      'echarts-waterfall': __dirname + '/index.js'
    },
    output: {
      libraryTarget: 'umd',
      library: ['echarts-waterfall'],
      path: __dirname + '/dist',
      filename: options.mode === 'production' ? '[name].min.js' : '[name].js'
    },
    optimization: {
      concatenateModules: true
    },
    devtool: 'source-map',
    externals: {
      'echarts/lib/echarts': 'echarts/lib/echarts',
      'zrender/lib/core/util': 'zrender/lib/core/util',
      'zrender/lib/graphic/helper/subPixelOptimize': 'zrender/lib/graphic/helper/subPixelOptimize',
      'zrender/lib/core': 'zrender/lib/core',
      'zrender/lib/graphic/Path': 'zrender/lib/graphic/Path',
      'zrender/lib/core/platform': 'zrender/lib/core/platform',
      'echarts/lib/data': 'echarts/lib/data',
      'echarts/lib/chart/helper/labelHelper': 'echarts/lib/chart/helper/labelHelper',
      'echarts/lib/label/labelStyle': 'echarts/lib/label/labelStyle',
      'echarts/lib/chart/helper/whiskerBoxCommon': 'echarts/lib/chart/helper/whiskerBoxCommon',
      'echarts/lib/util/states': 'echarts/lib/util/states',
    }
  };
};
