import * as echarts from 'echarts'
import './waterfall/Waterfall'
import './style.css'

const chart = echarts.init(document.getElementById('main'), null, { renderer: 'svg' });
chart.setOption({
  xAxis: {
      data: ['2017-10-24', '2017-10-25', '2017-10-26', '2017-10-27']
  },
  yAxis: {},
  series: [ {
    clip: false,
      type: 'waterfall',
      data: [
        [20, 34, 10, 38],
        [40, 35, 30, 50],
        [31, 38, 33, 44],
        [38, 15, 5, 42]
      ]
  } ]
});

const exampleChart = echarts.init(document.getElementById('example'), null, { renderer: 'svg' });
exampleChart.setOption({
  xAxis: {
      data: ['2017-10-24', '2017-10-25', '2017-10-26', '2017-10-27']
  },
  yAxis: {},
  series: [ {
    type: 'candlestick',
    data: [
      [20, 34, 10, 38],
      [40, 35, 30, 50],
      [31, 38, 33, 44],
      [38, 15, 5, 42]
    ]
  } ]
});
