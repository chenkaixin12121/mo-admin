<template>
  <div class="drawer-container">
    <h3 class="drawer-title">{{ $t('settings.title') }}</h3>

    <div class="drawer-item">
      <span>{{ $t('settings.themeColor') }}</span>
      <theme-picker @change="themeChange"/>
    </div>

    <div class="drawer-item">
      <span>{{ $t('settings.tagsView') }}</span>
      <el-switch v-model="tagsView"/>
    </div>

    <div class="drawer-item">
      <span>{{ $t('settings.fixedHeader') }}</span>
      <el-switch v-model="fixedHeader"/>
    </div>

    <div class="drawer-item">
      <span>{{ $t('settings.sidebarLogo') }}</span>
      <el-switch v-model="sidebarLogo"/>
    </div>

    <div class="drawer-item">
      <span>{{ $t('settings.darkMode') }}</span>
      <el-switch v-model="darkMode"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, watch} from 'vue';

import ThemePicker from '@/components/ThemePicker/index.vue';

import useStore from '@/store';

const {setting} = useStore();

const state = reactive({
  fixedHeader: setting.fixedHeader,
  tagsView: setting.tagsView,
  sidebarLogo: setting.sidebarLogo,
  darkMode: setting.darkMode,
});

const {fixedHeader, tagsView, sidebarLogo, darkMode} = toRefs(state);

function themeChange(val: any) {
  setting.changeSetting({key: 'theme', value: val});
}

watch(
  () => state.fixedHeader,
  (value) => {
    setting.changeSetting({key: 'fixedHeader', value: value});
  }
);

watch(
  () => state.tagsView,
  (value) => {
    setting.changeSetting({key: 'tagsView', value: value});
  }
);

watch(
  () => state.sidebarLogo,
  (value) => {
    setting.changeSetting({key: 'sidebarLogo', value: value});
  }
);

watch(
  () => state.darkMode,
  (value) => {
    setting.changeSetting({key: 'darkMode', value: value});
  }
);
</script>

<style lang="scss" scoped>
.drawer-container {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;

  .drawer-title {
    margin: 0 0 8px;
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
  }

  .drawer-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--el-text-color-regular);
    font-size: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
