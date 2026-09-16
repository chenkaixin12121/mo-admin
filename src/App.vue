<template>
  <el-config-provider :locale="locale" :size="size">
    <router-view/>
  </el-config-provider>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue';

import useStore from '@/store';

// 导入 Element Plus 语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';

const {app, setting} = useStore();

const language = computed(() => app.language);
const size = computed(() => app.size);

const locale = ref();
watch(
  language,
  (value) => {
    locale.value = value == 'en' ? en : zhCn;
  },
  {
    // 初始化立即执行
    immediate: true,
  }
);

// 暗色模式切换：通过 html.dark 类启用 Element Plus 暗色主题
watch(
  () => setting.darkMode,
  (value) => {
    document.documentElement.classList.toggle('dark', value);
  },
  {immediate: true}
);
</script>
