import axios, {AxiosResponse} from 'axios';
import {ElMessage, ElMessageBox} from 'element-plus';
import {localStorage} from '@/utils/storage';
import useStore from '@/store';

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
  (error: any) => {
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
      ElMessageBox.confirm('当前页面已失效，请重新登录', 'Warning', {
        confirmButtonText: 'OK',
        type: 'warning',
      }).then(() => {
        localStorage.clear();
        window.location.href = '/';
      });
    }

    ElMessage({
      message: msg || '系统出错',
      type: 'error',
    });
    return Promise.reject(new Error(msg || 'Error'));
  },
  (error: any) => {
    if (error.response?.data) {
      const {msg} = error.response.data;
      ElMessage({
        message: msg || '系统出错',
        type: 'error',
      });
    } else {
      ElMessage({
        message: error.message || '网络异常，请稍后重试',
        type: 'error',
      });
    }
    return Promise.reject(error);
  }
);

// 导出 axios 实例
export default service;
