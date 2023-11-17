<template>
  <div>
    <svg-icon
      :icon-class="isFullscreen ? 'exit-fullscreen' : 'fullscreen'"
      @click="toggle"
    />
  </div>
</template>

<script lang="ts" setup>
import {useFullscreen} from '@vueuse/core';
import SvgIcon from '@/components/SvgIcon/index.vue';

const {isFullscreen, toggle} = useFullscreen();
</script>
