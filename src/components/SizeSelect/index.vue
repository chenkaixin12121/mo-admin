<template>
  <el-dropdown class="size-select" trigger="click" @command="handleSetSize">
    <div class="size-select__icon">
      <svg-icon class-name="size-icon" icon-class="size"/>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item of sizeOptions"
          :key="item.value"
          :command="item.value"
          :disabled="(size || 'default') == item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {ElMessage} from 'element-plus';
import {useI18n} from 'vue-i18n';

import useStore from '@/store';
import SvgIcon from '@/components/SvgIcon/index.vue';

const {app} = useStore();
const {t} = useI18n();
const size = computed(() => app.size);

const sizeOptions = computed(() => [
  {label: t('size.default'), value: 'default'},
  {label: t('size.large'), value: 'large'},
  {label: t('size.small'), value: 'small'},
]);

function handleSetSize(size: string) {
  app.setSize(size);
  ElMessage.success(t('size.success'));
}
</script>

<style lang="scss" scoped>
.size-select__icon {
  line-height: 50px;
  color: var(--el-text-color-regular);
}
</style>
