import * as echarts from "echarts";
import "./waterfall";
import "./style.css";

const chart = echarts.init(document.getElementById("main"), null, {
  renderer: "svg",
});
chart.setOption({
  xAxis: {
    data: ["2017-10-24", "2017-10-25", "2017-10-26", "2017-10-27", "2017-10-28"],
    axisLine: { onZero: false }
  },
  yAxis: {
    // startValue: -40
    // min: -40, // как будто нет разницы
  },
  series: [
    {
      clip: false,
      type: "waterfall",
      itemStyle: {
        color: "#47b262",
        color0: "#eb5454",
        color1: "#219ebc",
      },
      data: [
        { value: [0, 34], itemStyle: { color: null }, isSubtotal: true },
        { value: [34, 50] },
        { value: [50, 30] },
        { value: [30, 0], isSubtotal: true },
        { value: [30, 46] },
      ],
      // data: [
      //   [-20, 34],
      //   [40, 35],
      //   [0, 38],
      //   [38, 15],
      // ],
    },
  ],
});

const exampleChart = echarts.init(document.getElementById("example"), null, {
  renderer: "svg",
});
exampleChart.setOption({
  xAxis: {
    data: ["2017-10-24", "2017-10-25", "2017-10-26", "2017-10-27"],
  },
  yAxis: {},
  series: [
    {
      type: "candlestick",
      data: [
        [20, 34, 10, 38],
        [40, 35, 30, 50],
        [31, 38, 33, 44],
        [38, 15, 5, 42],
      ],
    },
  ],
});

window.onresize = chart.resize;
