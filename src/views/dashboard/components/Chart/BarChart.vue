<!--  线 + 柱混合图 -->
<template>
  <div :id="id" :class="className" :style="{ height, width }"/>
</template>

<script lang="ts" setup>
import {nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, watch,} from 'vue';
import {useI18n} from 'vue-i18n';
import echarts from '@/utils/echarts';
import type {EChartsOption} from 'echarts';
import resize from '@/utils/resize';

const {t, locale} = useI18n();

const props = defineProps({
  id: {
    type: String,
    default: 'barChart',
  },
  className: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: '200px',
    required: true,
  },
  height: {
    type: String,
    default: '200px',
    required: true,
  },
});

const {mounted, chart, beforeDestroy, activated, deactivated} = resize();

function initChart() {
  const el = document.getElementById(props.id) as HTMLDivElement;
  const existing = echarts.getInstanceByDom(el);
  if (existing) {
    existing.dispose();
  }
  const barChart = echarts.init(el);
  // 标题文字颜色跟随主题，避免暗色模式下深色标题看不清
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--el-text-color-primary')
      .trim() || '#303133';

  barChart.setOption({
    title: {
      show: true,
      text: t('dashboard.performance'),
      x: 'center',
      padding: 15,
      textStyle: {
        fontSize: 18,
        fontStyle: 'normal',
        fontWeight: 'bold',
        color: textColor,
      },
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '10%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
    },
    legend: {
      x: 'center',
      y: 'bottom',
      data: [
        t('dashboard.income'),
        t('dashboard.grossProfit'),
        t('dashboard.incomeGrowth'),
        t('dashboard.profitGrowth'),
      ],
    },
    xAxis: [
      {
        type: 'category',
        data: [
          t('dashboard.zhejiang'),
          t('dashboard.beijing'),
          t('dashboard.shanghai'),
          t('dashboard.guangdong'),
          t('dashboard.shenzhen'),
        ],
        axisPointer: {
          type: 'shadow',
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        min: 0,
        max: 10000,
        interval: 2000,
        axisLabel: {
          formatter: '{value} ',
        },
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: '{value}%',
        },
      },
    ],
    series: [
      {
        name: t('dashboard.income'),
        type: 'bar',
        data: [7000, 7100, 7200, 7300, 7400],
        barWidth: 20,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {offset: 0, color: '#83bff6'},
            {offset: 0.5, color: '#188df0'},
            {offset: 1, color: '#188df0'},
          ]),
        },
      },
      {
        name: t('dashboard.grossProfit'),
        type: 'bar',
        data: [8000, 8200, 8400, 8600, 8800],
        barWidth: 20,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {offset: 0, color: '#25d73c'},
            {offset: 0.5, color: '#1bc23d'},
            {offset: 1, color: '#179e61'},
          ]),
        },
      },
      {
        name: t('dashboard.incomeGrowth'),
        type: 'line',
        yAxisIndex: 1,
        data: [60, 65, 70, 75, 80],
        itemStyle: {
          color: '#67C23A',
        },
      },
      {
        name: t('dashboard.profitGrowth'),
        type: 'line',
        yAxisIndex: 1,
        data: [70, 75, 80, 85, 90],
        itemStyle: {
          color: '#409EFF',
        },
      },
    ],
  } as EChartsOption);
  chart.value = barChart;
}

// 语言切换后重新渲染图表文案
watch(locale, () => {
  initChart();
});

onBeforeUnmount(() => {
  beforeDestroy();
});

onActivated(() => {
  activated();
});

onDeactivated(() => {
  deactivated();
});

onMounted(() => {
  mounted();
  nextTick(() => {
    initChart();
  });
});
</script>
