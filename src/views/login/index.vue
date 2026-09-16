<template>
  <div class="login-container">
    <div class="login-card">
      <div class="title-container">
        <h3 class="title">{{ $t('login.title') }}</h3>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        auto-complete="on"
        class="login-form"
        label-position="left"
      >
        <el-form-item prop="username">
          <el-input
            ref="username"
            v-model="loginForm.username"
            :placeholder="$t('login.username')"
            auto-complete="on"
            name="username"
            tabindex="1"
            type="text"
          >
            <template #prefix>
              <svg-icon icon-class="user"/>
            </template>
          </el-input>
        </el-form-item>

        <el-tooltip
          :disabled="capslockTooltipDisabled"
          :content="$t('login.capsLock')"
          placement="right"
        >
          <el-form-item prop="password">
            <el-input
              :key="passwordType"
              ref="passwordRef"
              v-model="loginForm.password"
              :placeholder="$t('login.password')"
              :type="passwordType"
              auto-complete="on"
              name="password"
              tabindex="2"
              @blur="capslockTooltipDisabled = true"
              @keyup="checkCapslock"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <svg-icon icon-class="password"/>
              </template>
              <template #suffix>
                <span class="show-pwd" @click="showPwd">
                  <svg-icon
                    :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
                  />
                </span>
              </template>
            </el-input>
          </el-form-item>
        </el-tooltip>

        <!-- 验证码 -->
        <el-form-item prop="verifyCode" class="captcha-item">
          <el-input
            v-model="loginForm.verifyCode"
            :placeholder="$t('login.code')"
            auto-complete="off"
            tabindex="3"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <svg-icon icon-class="valid_code"/>
            </template>
          </el-input>

          <div class="captcha">
            <img
              :src="verifyCodeImgUrl"
              @click="handleCaptchaGenerate"
            />
          </div>
        </el-form-item>

        <el-button
          :loading="loading"
          size="default"
          style="width: 100%; margin-top: 4px"
          type="primary"
          @click.prevent="handleLogin"
        >{{ $t('login.login') }}
        </el-button>
      </el-form>
    </div>

    <div v-if="showCopyright == true" class="copyright">
      <p>{{ $t('login.copyright') }}</p>
      <p>{{ $t('login.icp') }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, onMounted, reactive, ref, toRefs, watch} from 'vue';
import {useI18n} from 'vue-i18n';

// 组件依赖
import {ElForm, ElInput} from 'element-plus';
import router from '@/router';
import SvgIcon from '@/components/SvgIcon/index.vue';

// 状态管理依赖
import useStore from '@/store';

// API依赖
import {getCaptcha} from '@/api/auth';
import {useRoute} from 'vue-router';
import {LoginForm} from '@/api/auth/types';

const {user} = useStore();
const route = useRoute();
const {t} = useI18n();

const loginFormRef = ref(ElForm);
const passwordRef = ref(ElInput);

const state = reactive({
  redirect: '',
  loginForm: {
    username: '',
    password: '',
    verifyCode: '',
  } as LoginForm,
  loginRules: {
    username: [{required: true, message: t('login.usernameRequired'), trigger: 'blur'}],
    password: [
      {
        required: true,
        message: t('login.passwordRequired'),
        trigger: 'blur',
        validator: validatePassword,
      },
    ],
    verifyCode: [{required: true, message: t('login.verifyCodeRequired'), trigger: 'blur'}],
  },
  loading: false,
  passwordType: 'password',
  verifyCodeImgUrl: '',
  // 大写提示禁用
  capslockTooltipDisabled: true,
  otherQuery: {},
  clientHeight: document.documentElement.clientHeight,
  showCopyright: true,
});

function validatePassword(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value || value.length < 6) {
    callback(new Error(t('login.passwordMin')));
  } else {
    callback();
  }
}

const {
  loginForm,
  loginRules,
  loading,
  passwordType,
  verifyCodeImgUrl,
  capslockTooltipDisabled,
  showCopyright,
} = toRefs(state);

function checkCapslock(e: KeyboardEvent) {
  state.capslockTooltipDisabled = !e.getModifierState('CapsLock');
}

function showPwd() {
  if (state.passwordType === 'password') {
    state.passwordType = '';
  } else {
    state.passwordType = 'password';
  }
  nextTick(() => {
    passwordRef.value.focus();
  });
}

function handleLogin() {
  loginFormRef.value.validate((valid: boolean) => {
    if (valid) {
      state.loading = true;
      user
        .login(state.loginForm)
        .then(() => {
          router.push({path: state.redirect || '/', query: state.otherQuery});
          state.loading = false;
        })
        .catch(() => {
          state.loading = false;
          handleCaptchaGenerate();
        });
    } else {
      return false;
    }
  });
}

// 获取验证码
function handleCaptchaGenerate() {
  getCaptcha()
    .then(({data}) => {
      const {captchaImgBase64, verifyCodeKey} = data;
      verifyCodeImgUrl.value = captchaImgBase64;
      loginForm.value.verifyCodeKey = verifyCodeKey;
      // 刷新验证码后清空输入，避免残留上一次的验证码
      loginForm.value.verifyCode = '';
    })
    .catch(() => {
      // 验证码加载失败，静默处理，点击验证码图片可重新加载
    });
}

watch(
  route,
  () => {
    const query = route.query;
    if (query) {
      state.redirect = query.redirect as string;
      state.otherQuery = getOtherQuery(query);
    }
  },
  {
    immediate: true,
  }
);

function getOtherQuery(query: Record<string, unknown>) {
  return Object.keys(query).reduce((acc: Record<string, unknown>, cur: string) => {
    if (cur !== 'redirect') {
      acc[cur] = query[cur];
    }
    return acc;
  }, {});
}

onMounted(() => {
  handleCaptchaGenerate();
  window.onresize = () => {
    if (state.clientHeight > document.documentElement.clientHeight) {
      state.showCopyright = false;
    } else {
      state.showCopyright = true;
    }
  };
});
</script>

<style lang="scss">
/* 登录页输入框统一样式：浅色圆角、聚焦高亮 */
.login-container {
  .el-input {
    .el-input__wrapper {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 1px 12px;
      box-shadow: none;
      transition: all 0.2s;

      &:hover {
        background: #eef1f5;
      }

      &.is-focus {
        background: #fff;
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }

    .el-input__inner {
      height: 42px;
      color: #303133;
      caret-color: var(--el-color-primary);

      &:-webkit-autofill {
        box-shadow: 0 0 0 1000px #f5f7fa inset !important;
        -webkit-text-fill-color: #303133 !important;
      }
    }

    .el-input__prefix {
      color: #a8abb2;
    }
  }

  .el-form-item {
    margin-bottom: 24px;
  }
}
</style>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e6f0ff 0%, #f5f7fa 45%, #eef4ff 100%);

  .login-card {
    width: 420px;
    max-width: calc(100% - 32px);
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(22, 119, 255, 0.12);
    padding: 40px 40px 32px;
    position: relative;
    z-index: 1;
  }

  .title-container {
    .title {
      font-size: 24px;
      color: #1f2329;
      margin: 0 0 32px;
      text-align: center;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }

  .show-pwd {
    font-size: 16px;
    color: #a8abb2;
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .captcha-item {
    display: flex;
    align-items: center;

    .el-input {
      flex: 1;
      margin-right: 12px;
    }

    .captcha {
      flex-shrink: 0;

      img {
        height: 42px;
        display: block;
        border-radius: 6px;
        cursor: pointer;
      }
    }
  }

  .copyright {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    font-size: 12px;
    text-align: center;
    color: #a8abb2;

    p {
      margin: 4px 0;
    }
  }
}
</style>
