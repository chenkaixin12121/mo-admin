import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {MemberPageResult, MemberQuery} from './types';

/**
 * 获取会员分页列表
 *
 * @param queryParams
 */
export function listMemeberPages(
  queryParams: MemberQuery
): AxiosPromise<MemberPageResult> {
  return request({
    url: '/mo-member/api/v1/users/pages',
    method: 'post',
    data: queryParams,
  });
}

/**
 * 获取会员详情
 *
 * @param id
 */
export function getMemberDetail(id: number) {
  return request({
    url: '/mo-member/api/v1/users/' + id,
    method: 'get',
  });
}

/**
 * 添加会员
 *
 * @param data
 */
export function addMember(data: object) {
  return request({
    url: '/mo-member/api/v1/users',
    method: 'post',
    data: data,
  });
}

/**
 * 添加会员
 *
 * @param id
 * @param data
 */
export function updateMember(id: number, data: object) {
  return request({
    url: '/mo-member/api/v1/users/' + id,
    method: 'put',
    data: data,
  });
}
