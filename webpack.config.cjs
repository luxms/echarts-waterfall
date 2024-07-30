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
      'echarts/lib/echarts': 'echarts'
    }
  };
};
