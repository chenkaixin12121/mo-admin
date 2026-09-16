<!-- 饼图 -->
<template>
  <div :id="id" :class="className" :style="{ height, width }"/>
</template>

<script lang="ts" setup>
import {nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted,} from 'vue';
import {EChartsOption, init} from 'echarts';
import resize from '@/utils/resize';

const props = defineProps({
  id: {
    type: String,
    default: 'pieChart',
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
  const pieChart = init(document.getElementById(props.id) as HTMLDivElement);
  // 标题文字颜色跟随主题，避免暗色模式下深色标题看不清
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--el-text-color-primary')
      .trim() || '#303133';

  pieChart.setOption({
    title: {
      show: true,
      text: '产品分类总览',
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
    legend: {
      top: 'bottom',
    },
    series: [
      {
        name: 'Nightingale Chart',
        type: 'pie',
        radius: [50, 130],
        center: ['50%', '50%'],
        roseType: 'area',
        itemStyle: {
          borderRadius: 1,
          color: function (params: any) {
            //自定义颜色
            const colorList = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'];
            return colorList[params.dataIndex];
          },
        },
        data: [
          {value: 26, name: '家用电器'},
          {value: 27, name: '户外运动'},
          {value: 24, name: '汽车用品'},
          {value: 23, name: '手机数码'},
        ],
      },
    ],
  } as EChartsOption);

  chart.value = pieChart;
}

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
