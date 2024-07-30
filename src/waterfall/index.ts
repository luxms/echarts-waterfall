// @ts-nocheck
import { PRIORITY } from 'echarts/lib/echarts';
import type { EChartsExtensionInstallRegisters } from 'echarts/lib/echarts';

import WaterfallView from './WaterfallView';
import WaterfallSeries from './WaterfallSeries';
import WaterfallLayout from './WaterfallLayout';
import WaterfallVisual from './WaterfallVisual';

function install(registers: EChartsExtensionInstallRegisters) {
  registers.registerSeriesModel(WaterfallSeries);
  registers.registerChartView(WaterfallView);
  registers.registerLayout(WaterfallLayout);
  registers.registerVisual(PRIORITY.VISUAL.CHART + 1, WaterfallVisual);
}

export default install;
