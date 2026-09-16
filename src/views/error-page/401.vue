<!-- setup 无法设置组件名称，组件名称keepAlive必须 -->
<script lang="ts">
export default {
  name: 'Page401',
};
</script>

<script lang="ts" setup>
import {reactive, toRefs} from 'vue';
import {useRouter} from 'vue-router';
import {ArrowLeft} from '@element-plus/icons-vue';

const state = reactive({
  errGif: new URL(
    `../../assets/401_images/401.gif`,
    import.meta.url).href,
})

const {errGif} = toRefs(state)

const router = useRouter();

function back() {
  router.back();
}
</script>

<template>
  <div class="errPage-container">
    <el-button class="pan-back-btn" :icon="ArrowLeft" @click="back">
      {{ $t('error.back') }}
    </el-button>
    <el-row>
      <el-col :span="12">
        <h1 class="text-jumbo text-ginormous">Oops!</h1>
        <h2>{{ $t('error.unauthorized') }}</h2>
        <h6>{{ $t('error.unauthorizedTip') }}</h6>
        <ul class="list-unstyled">
          <li class="link-type">
            <router-link to="/dashboard">{{ $t('error.goHome') }}</router-link>
          </li>
        </ul>
      </el-col>
      <el-col :span="12">
        <img :src="errGif" alt="401" height="428" width="313"/>
      </el-col>
    </el-row>
  </div>
</template>


<style lang="scss" scoped>
.errPage-container {
  width: 800px;
  max-width: 100%;
  margin: 100px auto;

  .pan-back-btn {
    background: var(--el-color-primary);
    color: #fff;
    border: none !important;
  }

  .pan-gif {
    margin: 0 auto;
    display: block;
  }

  .pan-img {
    display: block;
    margin: 0 auto;
    width: 100%;
  }

  .text-jumbo {
    font-size: 60px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .list-unstyled {
    font-size: 14px;

    li {
      padding-bottom: 5px;
    }

    a {
      color: var(--el-color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
