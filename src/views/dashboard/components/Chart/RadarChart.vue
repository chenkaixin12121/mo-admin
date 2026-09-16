<!-- 雷达图 -->
<template>
  <div :id="id" :class="className" :style="{ height, width }"/>
</template>

<script lang="ts" setup>
import {nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted} from 'vue';
import {EChartsOption, init} from 'echarts';
import resize from '@/utils/resize';

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
  const radarChart = init(document.getElementById(props.id) as HTMLDivElement);
  // 标题文字颜色跟随主题，避免暗色模式下深色标题看不清
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--el-text-color-primary')
      .trim() || '#303133';

  radarChart.setOption({
    title: {
      show: true,
      text: '订单状态统计',
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
      data: ['预定数量', '下单数量', '发货数量']
    },
    radar: {
      // shape: 'circle',
      radius: '60%',
      indicator: [
        {name: '家用电器'},
        {name: '服装箱包'},
        {name: '运动户外'},
        {name: '手机数码'},
        {name: '汽车用品'},
        {name: '家具厨具'}
      ]
    },
    series: [
      {
        name: 'Budget vs spending',
        type: 'radar',
        itemStyle: {
          borderRadius: 6,
          color: function (params: any) {
            //自定义颜色
            const colorList = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'];
            return colorList[params.dataIndex];
          }
        },
        data: [
          {
            value: [400, 400, 400, 400, 400, 400],
            name: '预定数量'
          },
          {
            value: [300, 300, 300, 300, 300, 300],
            name: '下单数量'
          },
          {
            value: [200, 200, 200, 200, 200, 200],
            name: '发货数量'
          }
        ]
      }
    ]
  } as EChartsOption);

  chart.value = radarChart;
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
