import * as zrUtil from 'zrender/lib/core/util';
import { map, retrieve2 } from 'zrender/lib/core/util';
import { subPixelOptimize } from 'zrender/lib/graphic/helper/subPixelOptimize';

function WaterfallLayout(ecModel) {
  ecModel.eachSeriesByType('waterfall', function (seriesModel) {
    const coordSys = seriesModel.coordinateSystem;
    const baseAxis = seriesModel.getBaseAxis();
    const valueAxis = coordSys.getOtherAxis(baseAxis);
    let startValue = seriesModel.get('startValue');

    if (startValue) {
      valueAxis.scale.unionExtent([startValue, startValue]);
      valueAxis.scale.calcNiceTicks();
    } else {
      startValue = valueAxis.scale._extent[0];
    }

    const data = seriesModel.getData();
    const barWidth = calculateBarWidth(seriesModel, data);
    const cDimIdx = 0;
    const vDimIdx = 1;
    const coordDims = ['x', 'y'];
    const cDimI = data.getDimensionIndex(data.mapDimension(coordDims[cDimIdx]));
    const vDimsI = map(data.mapDimensionsAll(coordDims[vDimIdx]), data.getDimensionIndex, data);
    const startDimI = vDimsI[0]; // индекс начала столбика
    const endDimI = vDimsI[1]; // индекс конца столбика

    data.setLayout({ barWidth: barWidth });

    // проверка, что value состоит из двух значний: начало и конец столбика
    if (cDimI < 0 || vDimsI.length < 2) return;

    // todo добавить оптимизированный large рендер
    seriesModel.pipelineContext.large ? null : normalProgress();

    function normalProgress() {
      const store = data.getStore();
      data.each((idx) => {
        const axisDimVal = store.get(cDimI, idx); // индекс столбика
        const startVal = store.get(startDimI, idx); // значение начала стобика
        const endVal = store.get(endDimI, idx); // значение конца стобика
        const ocLow = Math.min(startVal, endVal); // меньшее значение
        const ocHigh = Math.max(startVal, endVal); // большее значение
        const ocLowPoint = getPoint(ocLow, axisDimVal); // x - центр столбика, y - нижнее значение
        const ocHighPoint = getPoint(ocHigh, axisDimVal); // x - центр столбика, y - верхнее значение
        const ends = [];

        const nextIds = idx + 1;
        const nextAxisDimVal = store.get(cDimI, nextIds);
        const nextStartVal = store.get(startDimI, nextIds);
        const nextEndVal = store.get(endDimI, nextIds);
        const nextOcHigh = Math.max(nextStartVal, nextEndVal);
        const nextOcHighPoint = getPoint(nextOcHigh, nextAxisDimVal);

        const heightDiff = ocHighPoint[1] - ocLowPoint[1];
        if (heightDiff < 2) {
          ocHighPoint[1] += 1;
          ocLowPoint[1] -= 1;
        }

        const [hightPoint1, hightPoint2] = addBodyEnd(ocHighPoint, 0);
        const [lowPoint1, lowPoint2] = addBodyEnd(ocLowPoint, 1);

        const [nextHightPoint1] = addBodyEnd(nextOcHighPoint, 0);

        ends.push(hightPoint1, hightPoint2, lowPoint1, lowPoint2);

        const lineStartPoint = startVal > endVal ? lowPoint1 : hightPoint2;
        const lineEndPoint = [nextHightPoint1[0], lineStartPoint[1]];

        ends.push(lineStartPoint, lineEndPoint);
        const itemModel = data.getItemModel(idx);
        const hasDojiColor = !!itemModel.get(['itemStyle', 'borderColorDoji']);

        data.setItemLayout(idx, {
          sign: getSign(store, idx, startVal, endVal, endDimI, hasDojiColor),
          initBaseline: startVal > endVal ? ocHighPoint[vDimIdx] : ocLowPoint[vDimIdx],
          ends: ends,
          brushRect: makeBrushRect(ocLow, ocHigh, axisDimVal),
        });
      });
      function getPoint(val, axisDimVal) {
        const p = [];
        p[cDimIdx] = axisDimVal; // 0
        p[vDimIdx] = val; // 0
        return isNaN(axisDimVal) || isNaN(val) ? [NaN, NaN] : coordSys.dataToPoint(p);
      }
      function addBodyEnd(point, start) {
        const point1 = point.slice();
        const point2 = point.slice();
        point1[cDimIdx] = subPixelOptimize(point1[cDimIdx] + barWidth / 2, 1, false);
        point2[cDimIdx] = subPixelOptimize(point2[cDimIdx] - barWidth / 2, 1, true);
        return start ? [point1, point2] : [point2, point1];
      }
      function makeBrushRect(lowestVal, highestVal, axisDimVal) {
        var pmin = getPoint(lowestVal, axisDimVal);
        var pmax = getPoint(highestVal, axisDimVal);
        pmin[cDimIdx] -= barWidth / 2;
        pmax[cDimIdx] -= barWidth / 2;
        return {
          x: pmin[0],
          y: pmin[1],
          width: vDimIdx ? barWidth : pmax[0] - pmin[0],
          height: vDimIdx ? pmax[1] - pmin[1] : barWidth,
        };
      }
      function subPixelOptimizePoint(point) {
        point[cDimIdx] = subPixelOptimize(point[cDimIdx], 1);
        return point;
      }
    }
  });
}

const getValueAxisStart = (baseAxis, valueAxis) => {
  let startValue = valueAxis.model.get('startValue');
  if (!startValue) {
    startValue = 0;
  }
  return valueAxis.toGlobalCoord(
    valueAxis.dataToCoord(valueAxis.type === 'log' ? (startValue > 0 ? startValue : 1) : startValue)
  );
};

/**
 * Get the sign of a single data.
 *
 * @returns 0 for doji with hasDojiColor: true,
 *          1 for positive,
 *          -1 for negative.
 */
// @ts-ignore
function getSign(store, dataIndex, startVal, endVal, closeDimI, hasDojiColor) {
  var sign;
  if (startVal > endVal) {
    sign = -1;
  } else if (startVal < endVal) {
    sign = 1;
  } else {
    sign = hasDojiColor
      ? // When doji color is set, use it instead of color/color0.
        0
      : dataIndex > 0
      ? // If close === open, compare with close of last record
        store.get(closeDimI, dataIndex - 1) <= endVal
        ? 1
        : -1
      : // No record of previous, set to be positive
        1;
  }
  return sign;
}

function calculateBarWidth(seriesModel, data) {
  var baseAxis = seriesModel.getBaseAxis();
  var extent;
  var bandWidth =
    baseAxis.type === 'category'
      ? baseAxis.getBandWidth()
      : ((extent = baseAxis.getExtent()), Math.abs(extent[1] - extent[0]) / data.count());
  var barMaxWidth = parsePercent(retrieve2(seriesModel.get('barMaxWidth'), bandWidth), bandWidth);
  var barMinWidth = parsePercent(retrieve2(seriesModel.get('barMinWidth'), 1), bandWidth);
  var barWidth = seriesModel.get('barWidth');
  return barWidth != null
    ? parsePercent(barWidth, bandWidth)
    : // Put max outer to ensure bar visible in spite of overlap.
      Math.max(Math.min(bandWidth / 2, barMaxWidth), barMinWidth);
}

function parsePercent(percent, all) {
  switch (percent) {
    case 'center':
    case 'middle':
      percent = '50%';
      break;
    case 'left':
    case 'top':
      percent = '0%';
      break;
    case 'right':
    case 'bottom':
      percent = '100%';
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

function _trim(str) {
  return str.replace(/^\s+|\s+$/g, '');
}

export default WaterfallLayout;
