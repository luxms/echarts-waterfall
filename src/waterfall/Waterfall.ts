// @ts-ignore
import * as echarts from 'echarts/lib/echarts';
// @ts-ignore
import * as zrUtil from 'zrender/src/core/util';
// @ts-ignore
import {map, retrieve2} from 'zrender/src/core/util';
// @ts-ignore
import * as subPixelOptimizeUtil from 'zrender/src/graphic/helper/subPixelOptimize';

import './WaterfallSeries'
import './WaterfallView'

echarts.registerLayout(function (ecModel, api) {
    ecModel.eachSeriesByType('waterfall', function (seriesModel) {
        const coordSys = seriesModel.coordinateSystem;
        const data = seriesModel.getData();
        const candleWidth = calculateCandleWidth(seriesModel, data);
        const cDimIdx = 0;
        const vDimIdx = 1;
        const coordDims = ['x', 'y'];
        const cDimI = data.getDimensionIndex(data.mapDimension(coordDims[cDimIdx]));
        // тут по идее должен быть список из двух элементов: начало и конец стобика
        // value dimension indexes

        // data._dimSummary.encode.y
        //  ['open', 'close', 'lowest', 'highest']

        const vDimsI = map(data.mapDimensionsAll(coordDims[vDimIdx]), data.getDimensionIndex, data);
        // const openDimI = vDimsI[0];
        // const closeDimI = vDimsI[1]; // I в конце это индекс
        // const lowestDimI = vDimsI[2];
        // const highestDimI = vDimsI[3];

        const openDimI = 1;
        const closeDimI = 2; // I в конце это индекс
        const lowestDimI = 3;
        const highestDimI = 4;
        debugger;

        data.setLayout({
            candleWidth: candleWidth,
            isSimpleBox: candleWidth <= 1.3
        });

        // тут проверка, что все дименшены найдены
        // if (cDimI < 0 || vDimsI.length < 4) return;

        // это из wordcloud, может пригодится
        // seriesModel.layoutInstance = {
        //     ondraw: null,
        // };

        normalProgress()

        // reset в candlestick возвращает такое значение,
        // но судя по типизации eachSeriesByType никакого значения мы не возвращаем
        // return { progress: normalProgress }

        function normalProgress() {
            let dataIndex = 0;
            const store = data.getStore();
            while (dataIndex !== 4) {
                const axisDimVal = store.get(cDimI, dataIndex) as number;
                const openVal = store.get(openDimI, dataIndex) as number;
                const closeVal = store.get(closeDimI, dataIndex) as number;
                const lowestVal = store.get(lowestDimI, dataIndex) as number;
                const highestVal = store.get(highestDimI, dataIndex) as number;

                const ocLow = Math.min(openVal, closeVal);
                const ocHigh = Math.max(openVal, closeVal);

                const ocLowPoint = getPoint(ocLow, axisDimVal);
                const ocHighPoint = getPoint(ocHigh, axisDimVal);
                const lowestPoint = getPoint(lowestVal, axisDimVal);
                const highestPoint = getPoint(highestVal, axisDimVal);

                const ends: number[][] = [];
                addBodyEnd(ends, ocHighPoint, 0);
                addBodyEnd(ends, ocLowPoint, 1);

                ends.push(
                    subPixelOptimizePoint(ocHighPoint),
                    subPixelOptimizePoint(ocLowPoint),
                    subPixelOptimizePoint(lowestPoint),
                    subPixelOptimizePoint(ocLowPoint)
                );

                const itemModel = data.getItemModel(dataIndex);
                const hasDojiColor = !!itemModel.get(['itemStyle', 'borderColorDoji']);
                // тут вроде как должен сеттиться layout для каждого столбика
                data.setItemLayout(dataIndex, {
                    sign: getSign(store, dataIndex, openVal, closeVal, closeDimI, hasDojiColor),
                    initBaseline: openVal > closeVal
                        ? ocHighPoint[vDimIdx] : ocLowPoint[vDimIdx], // open point.
                    ends: ends,
                    brushRect: {x: 230.40000000000003, y: 440, width: 153.60000000000002, height: -266},
                    //brushRect: makeBrushRect(lowestVal, highestVal, axisDimVal)
                });
                debugger;
                dataIndex++
            }

            function getPoint(val: number, axisDimVal: number) {
                const p = [];
                p[cDimIdx] = axisDimVal;
                p[vDimIdx] = val;
                return (isNaN(axisDimVal) || isNaN(val))
                    ? [NaN, NaN]
                    : coordSys.dataToPoint(p);
            }

            function addBodyEnd(ends: number[][], point: number[], start: number) {
                const point1 = point.slice();
                const point2 = point.slice();

                point1[cDimIdx] = subPixelOptimize(
                    point1[cDimIdx] + candleWidth / 2, 1, false
                );
                point2[cDimIdx] = subPixelOptimize(
                    point2[cDimIdx] - candleWidth / 2, 1, true
                );

                start
                    ? ends.push(point1, point2)
                    : ends.push(point2, point1);
            }
            function subPixelOptimizePoint(point: number[]) {
                point[cDimIdx] = subPixelOptimize(point[cDimIdx], 1);
                return point;
            }
        }
    });
});

const subPixelOptimize = subPixelOptimizeUtil.subPixelOptimize;

function getSign(
    store: any, dataIndex: number, openVal: number, closeVal: number, closeDimI: any,
    hasDojiColor: boolean
): -1 | 1 | 0 {
    let sign: -1 | 1 | 0;
    if (openVal > closeVal) {
        sign = -1;
    }
    else if (openVal < closeVal) {
        sign = 1;
    }
    else {
        sign = hasDojiColor
            // When doji color is set, use it instead of color/color0.
            ? 0
            : (dataIndex > 0
                // If close === open, compare with close of last record
                ? (store.get(closeDimI, dataIndex - 1) <= closeVal ? 1 : -1)
                // No record of previous, set to be positive
                : 1
            );
    }
    return sign;
}

function calculateCandleWidth(seriesModel: any, data: any) {
    const baseAxis = seriesModel.getBaseAxis();
    let extent;

    const bandWidth = baseAxis.type === 'category'
        ? baseAxis.getBandWidth()
        : (
            extent = baseAxis.getExtent(),
            Math.abs(extent[1] - extent[0]) / data.count()
        );

    const barMaxWidth = parsePercent(
        retrieve2(seriesModel.get('barMaxWidth'), bandWidth),
        bandWidth
    );
    const barMinWidth = parsePercent(
        retrieve2(seriesModel.get('barMinWidth'), 1),
        bandWidth
    );
    const barWidth = seriesModel.get('barWidth');

    return barWidth != null
        ? parsePercent(barWidth, bandWidth)
        // Put max outer to ensure bar visible in spite of overlap.
        : Math.max(Math.min(bandWidth / 2, barMaxWidth), barMinWidth);
}

export function parsePercent(percent: number | string, all: number): number {
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
            return parseFloat(percent) / 100 * all;
        }

        return parseFloat(percent);
    }

    return percent == null ? NaN : +percent;
}
function _trim(str: string): string {
    return str.replace(/^\s+|\s+$/g, '');
}


// Просто посмотреть, что внутри candlestick
echarts.registerLayout(function (ecModel, api) {
    ecModel.eachSeriesByType('candlestick', function (seriesModel) {
        console.log('candlestick', seriesModel, ecModel)
    });
});

