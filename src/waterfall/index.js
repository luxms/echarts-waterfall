import { PRIORITY } from 'echarts/lib/echarts';

import WaterfallView from './WaterfallView';
import WaterfallSeries from './WaterfallSeries';
import WaterfallLayout from './WaterfallLayout';
import WaterfallVisual from './WaterfallVisual';

function install(registers) {
  registers.registerSeriesModel(WaterfallSeries);
  registers.registerChartView(WaterfallView);
  registers.registerLayout(WaterfallLayout);
  registers.registerVisual(PRIORITY.VISUAL.CHART + 1, WaterfallVisual);
}

export default install;
