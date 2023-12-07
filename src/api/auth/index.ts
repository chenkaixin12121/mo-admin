import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {LoginForm, LoginResult, VerifyCode} from './types';

/**
 *
 * @param data {LoginForm}
 * @returns
 */
export function loginApi(data: LoginForm): AxiosPromise<LoginResult> {
  return request({
    url: '/mo-auth/oauth2/token',
    method: 'post',
    params: data,
    headers: {
      Authorization: 'Basic bW8tYWRtaW4tY2xpZW50OnNlY3JldA==', // 客户端信息Base64明文：mo-admin-client:secret
    },
  });
}

/**
 * 登出
 */
export function logoutApi() {
  return request({
    url: '/mo-admin/api/v1/users/logout',
    method: 'post',
  });
}

/**
 * 获取图片验证码
 */
export function getCaptcha(): AxiosPromise<VerifyCode> {
  return request({
    url: '/captcha?t=' + new Date().getTime().toString(),
    method: 'get',
  });
}
