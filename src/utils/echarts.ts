// 按需引入 echarts 模块，减小打包体积
import * as echarts from 'echarts/core';
import {BarChart, LineChart, PieChart, RadarChart} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';

// 注册用到的图表与组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

export default echarts;
