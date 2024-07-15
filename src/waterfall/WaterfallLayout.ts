// @ts-ignore
import * as echarts from "echarts/lib/echarts";
// @ts-ignore
import * as zrUtil from "zrender/src/core/util";
// @ts-ignore
import { map, retrieve2 } from "zrender/src/core/util";
// @ts-ignore
import * as subPixelOptimizeUtil from "zrender/src/graphic/helper/subPixelOptimize";

// @ts-ignore
echarts.registerLayout(function (ecModel, api) {
  // @ts-ignore
  ecModel.eachSeriesByType("waterfall", function (seriesModel) {
    const coordSys = seriesModel.coordinateSystem;
    const data = seriesModel.getData();
    const candleWidth = calculateCandleWidth(seriesModel, data);
    const cDimIdx = 0;
    const vDimIdx = 1;
    const coordDims = ["x", "y"];
    const cDimI = data.getDimensionIndex(data.mapDimension(coordDims[cDimIdx]));
    const vDimsI = map(
      data.mapDimensionsAll(coordDims[vDimIdx]),
      data.getDimensionIndex,
      data
    );
    const openDimI = vDimsI[0];
    const closeDimI = vDimsI[1];
    // const lowestDimI = vDimsI[2];
    // const highestDimI = vDimsI[3];

    data.setLayout({
      candleWidth: candleWidth,
      isSimpleBox: candleWidth <= 1.3,
    });

    // if (cDimI < 0 || vDimsI.length < 4) return;
    if (cDimI < 0 || vDimsI.length < 2) return;

    seriesModel.pipelineContext.large ? null : normalProgress();

    function normalProgress() {
      let dataIndex = 0;
      const store = data.getStore();
      while (dataIndex !== 4) {
        const axisDimVal = store.get(cDimI, dataIndex);
        const openVal = store.get(openDimI, dataIndex);
        const closeVal = store.get(closeDimI, dataIndex);
        // const lowestVal = store.get(lowestDimI, dataIndex);
        // const highestVal = store.get(highestDimI, dataIndex);
        const ocLow = Math.min(openVal, closeVal);
        const ocHigh = Math.max(openVal, closeVal);
        const ocLowPoint = getPoint(ocLow, axisDimVal);
        const ocHighPoint = getPoint(ocHigh, axisDimVal);
        // const lowestPoint = getPoint(lowestVal, axisDimVal);
        // const highestPoint = getPoint(highestVal, axisDimVal);
        const ends: any[] = [];
        addBodyEnd(ends, ocHighPoint, 0);
        addBodyEnd(ends, ocLowPoint, 1);
        ends.push(
          // subPixelOptimizePoint(highestPoint),
          subPixelOptimizePoint(ocHighPoint),
          // subPixelOptimizePoint(lowestPoint),
          subPixelOptimizePoint(ocLowPoint)
        );
        const itemModel = data.getItemModel(dataIndex);
        const hasDojiColor = !!itemModel.get(["itemStyle", "borderColorDoji"]);
        data.setItemLayout(dataIndex, {
          sign: getSign(
            store,
            dataIndex,
            openVal,
            closeVal,
            closeDimI,
            hasDojiColor
          ),
          initBaseline:
            openVal > closeVal ? ocHighPoint[vDimIdx] : ocLowPoint[vDimIdx],
          ends: ends,
          // brushRect: makeBrushRect(lowestVal, highestVal, axisDimVal),
          brushRect: makeBrushRect(ocLow, ocHigh, axisDimVal),
        });
        dataIndex++;
      }
      function getPoint(val: any, axisDimVal: any) {
        var p = [];
        p[cDimIdx] = axisDimVal;
        p[vDimIdx] = val;
        return isNaN(axisDimVal) || isNaN(val)
          ? [NaN, NaN]
          : coordSys.dataToPoint(p);
      }
      function addBodyEnd(ends: any, point: any, start: any) {
        var point1 = point.slice();
        var point2 = point.slice();
        point1[cDimIdx] = subPixelOptimize(
          point1[cDimIdx] + candleWidth / 2,
          1,
          false
        );
        point2[cDimIdx] = subPixelOptimize(
          point2[cDimIdx] - candleWidth / 2,
          1,
          true
        );
        start ? ends.push(point1, point2) : ends.push(point2, point1);
      }
      function makeBrushRect(lowestVal: any, highestVal: any, axisDimVal: any) {
        var pmin = getPoint(lowestVal, axisDimVal);
        var pmax = getPoint(highestVal, axisDimVal);
        pmin[cDimIdx] -= candleWidth / 2;
        pmax[cDimIdx] -= candleWidth / 2;
        return {
          x: pmin[0],
          y: pmin[1],
          width: vDimIdx ? candleWidth : pmax[0] - pmin[0],
          height: vDimIdx ? pmax[1] - pmin[1] : candleWidth,
        };
      }
      function subPixelOptimizePoint(point: number[]) {
        point[cDimIdx] = subPixelOptimize(point[cDimIdx], 1);
        return point;
      }
    }
  });
});

const subPixelOptimize = subPixelOptimizeUtil.subPixelOptimize;

/**
 * Get the sign of a single data.
 *
 * @returns 0 for doji with hasDojiColor: true,
 *          1 for positive,
 *          -1 for negative.
 */
// @ts-ignore
function getSign(store, dataIndex, openVal, closeVal, closeDimI, hasDojiColor) {
  var sign;
  if (openVal > closeVal) {
    sign = -1;
  } else if (openVal < closeVal) {
    sign = 1;
  } else {
    sign = hasDojiColor
      ? // When doji color is set, use it instead of color/color0.
        0
      : dataIndex > 0
      ? // If close === open, compare with close of last record
        store.get(closeDimI, dataIndex - 1) <= closeVal
        ? 1
        : -1
      : // No record of previous, set to be positive
        1;
  }
  return sign;
}
// @ts-ignore
function calculateCandleWidth(seriesModel, data) {
  var baseAxis = seriesModel.getBaseAxis();
  var extent;
  var bandWidth =
    baseAxis.type === "category"
      ? baseAxis.getBandWidth()
      : ((extent = baseAxis.getExtent()),
        Math.abs(extent[1] - extent[0]) / data.count());
  var barMaxWidth = parsePercent(
    retrieve2(seriesModel.get("barMaxWidth"), bandWidth),
    bandWidth
  );
  var barMinWidth = parsePercent(
    retrieve2(seriesModel.get("barMinWidth"), 1),
    bandWidth
  );
  var barWidth = seriesModel.get("barWidth");
  return barWidth != null
    ? parsePercent(barWidth, bandWidth)
    : // Put max outer to ensure bar visible in spite of overlap.
      Math.max(Math.min(bandWidth / 2, barMaxWidth), barMinWidth);
}

export function parsePercent(percent: number | string, all: number): number {
  switch (percent) {
    case "center":
    case "middle":
      percent = "50%";
      break;
    case "left":
    case "top":
      percent = "0%";
      break;
    case "right":
    case "bottom":
      percent = "100%";
      break;
  }
  if (zrUtil.isString(percent)) {
    if (_trim(percent).match(/%$/)) {
      return (parseFloat(percent) / 100) * all;
    }

    return parseFloat(percent);
  }

  return percent == null ? NaN : +percent;
}
function _trim(str: string): string {
  return str.replace(/^\s+|\s+$/g, "");
}

// Просто посмотреть, что внутри candlestick
echarts.registerLayout(function (ecModel, api) {
  ecModel.eachSeriesByType("candlestick", function (seriesModel) {
    console.log("candlestick", seriesModel, ecModel);
  });
});
