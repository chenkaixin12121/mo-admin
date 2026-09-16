<!-- 雷达图 -->
<template>
  <div :id="id" :class="className" :style="{ height, width }"/>
</template>

<script lang="ts" setup>
import {nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import echarts from '@/utils/echarts';
import type {EChartsOption} from 'echarts';
import resize from '@/utils/resize';

const {t, locale} = useI18n();

const props = defineProps({
  id: {
    type: String,
    default: 'radarChart'
  },
  className: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: '200px',
    required: true
  },
  height: {
    type: String,
    default: '200px',
    required: true
  }
});

const {mounted, chart, beforeDestroy, activated, deactivated} = resize();

function initChart() {
  const el = document.getElementById(props.id) as HTMLDivElement;
  const existing = echarts.getInstanceByDom(el);
  if (existing) {
    existing.dispose();
  }
  const radarChart = echarts.init(el);
  // 标题文字颜色跟随主题，避免暗色模式下深色标题看不清
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--el-text-color-primary')
      .trim() || '#303133';

  radarChart.setOption({
    title: {
      show: true,
      text: t('dashboard.orderStatus'),
      x: 'center',
      padding: 15,
      textStyle: {
        fontSize: 18,
        fontStyle: 'normal',
        fontWeight: 'bold',
        color: textColor
      }
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '10%',
      containLabel: true
    },
    legend: {
      x: 'center',
      y: 'bottom',
      data: [
        t('dashboard.reservedQty'),
        t('dashboard.orderQty'),
        t('dashboard.shippedQty'),
      ]
    },
    radar: {
      // shape: 'circle',
      radius: '60%',
      indicator: [
        {name: t('dashboard.homeAppliance')},
        {name: t('dashboard.clothing')},
        {name: t('dashboard.sportOutdoor')},
        {name: t('dashboard.phoneDigital')},
        {name: t('dashboard.autoParts')},
        {name: t('dashboard.furniture')}
      ]
    },
    series: [
      {
        name: 'Budget vs spending',
        type: 'radar',
        itemStyle: {
          borderRadius: 6,
          color: function (params: {dataIndex: number}) {
            //自定义颜色
            const colorList = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'];
            return colorList[params.dataIndex];
          }
        },
        data: [
          {
            value: [400, 400, 400, 400, 400, 400],
            name: t('dashboard.reservedQty')
          },
          {
            value: [300, 300, 300, 300, 300, 300],
            name: t('dashboard.orderQty')
          },
          {
            value: [200, 200, 200, 200, 200, 200],
            name: t('dashboard.shippedQty')
          }
        ]
      }
    ]
  } as EChartsOption);

  chart.value = radarChart;
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

<style lang="scss" scoped></style>
