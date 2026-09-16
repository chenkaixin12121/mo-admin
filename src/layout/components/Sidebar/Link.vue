<template>
  <a v-if="isExternal(to)" :href="to" rel="noopener" target="_blank">
    <slot/>
  </a>
  <div v-else @click="push">
    <slot/>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import {isExternal} from '@/utils/validate';
import {useRouter} from 'vue-router';

import useStore from '@/store';

export default defineComponent({
  props: {
    to: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const {app} = useStore();
    const sidebar = computed(() => app.sidebar);
    const device = computed(() => app.device);

    const push = () => {
      if (device.value === 'mobile' && sidebar.value.opened) {
        app.closeSideBar(false);
      }
      router.push(props.to).catch((err) => {
        console.error(err);
      });
    };
    return {
      push,
      isExternal,
    };
  },
});
</script>
