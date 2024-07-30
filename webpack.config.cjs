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
      'echarts/lib/echarts': 'echarts',
      'zrender/lib/core/util': 'zrender',
      'zrender/lib/core': 'zrender',
      'zrender': 'zrender',
      'zrender/lib/core/platform.js': 'zrender/lib/core/platform.js',
      './node_modules/zrender/lib/core/matrix.js': './node_modules/zrender/lib/core/matrix.js'
    }
  };
};
