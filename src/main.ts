import * as echarts from "echarts";
import "./waterfall";
import "./style.css";

const chart = echarts.init(document.getElementById("main"), null, {
  renderer: "svg",
});
chart.setOption({
  xAxis: {
    data: ["2017-10-24", "2017-10-25", "2017-10-26", "2017-10-27"],
    axisLine: { onZero: false }
  },
  yAxis: {
    // startValue: -40
    min: -40, // как будто нет разницы
  },
  series: [
    {
      clip: false,
      type: "waterfall",
      itemStyle: {
        color: "#eb5454",
        color0: "#47b262",
      },
      // data: [
      //   { value: [20, 34], itemStyle: { color: "red" } },
      //   { value: [40, 35], itemStyle: { color: "purple" } },
      //   { value: [31, 38], itemStyle: { color: "yellow" } },
      //   { value: [38, 15], itemStyle: { color: "green" } },
      // ],
      data: [
        [-20, 34],
        [40, 35],
        [0, 38],
        [38, 15],
      ],
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
