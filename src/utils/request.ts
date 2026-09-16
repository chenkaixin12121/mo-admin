import axios, {AxiosError, AxiosResponse} from 'axios';
import {localStorage} from '@/utils/storage';
import useStore from '@/store';
import i18n from '@/lang';

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: {'Content-Type': 'application/json;charset=utf-8'},
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 已显式指定 Authorization(如登录接口的 Basic 认证)则不覆盖
    if (config.headers.Authorization) {
      return config;
    }
    const {user} = useStore();
    if (user.token) {
      config.headers.Authorization = `${localStorage.get('token')}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 响应数据为二进制流处理(Excel导出/模板下载)，优先于业务码判断
    if (
      response.data instanceof ArrayBuffer ||
      response.data instanceof Blob
    ) {
      return response;
    }

    const {code, msg} = response.data;
    if (String(code) === '0') {
      return response.data;
    }

    if (code === 'A003') {
      ElMessageBox.confirm(
        i18n.global.t('common.sessionExpired'),
        i18n.global.t('common.warning'),
        {
          confirmButtonText: i18n.global.t('common.confirm'),
          type: 'warning',
        }
      ).then(() => {
        localStorage.clear();
        window.location.href = '/';
      });
    }

    ElMessage({
      message: msg || i18n.global.t('common.systemError'),
      type: 'error',
    });
    return Promise.reject(
      new Error(msg || i18n.global.t('common.systemError'))
    );
  },
  (error: AxiosError) => {
    if (error.response?.data) {
      const {msg} = error.response.data as {msg?: string};
      ElMessage({
        message: msg || i18n.global.t('common.systemError'),
        type: 'error',
      });
    } else {
      ElMessage({
        message: error.message || i18n.global.t('common.networkError'),
        type: 'error',
      });
    }
    return Promise.reject(error);
  }
);

// 导出 axios 实例
export default service;
