import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {Dept, DeptForm, DeptQuery} from './types';

/**
 * 部门树形表格
 *
 * @param queryParams
 */
export function listDepartments(queryParams?: DeptQuery): AxiosPromise<Dept[]> {
  return request({
    url: '/mo-system/api/v1/dept/list',
    method: 'post',
    data: queryParams,
  });
}

/**
 * 部门下拉列表
 */
export function listDeptOptions(): AxiosPromise<OptionType[]> {
  return request({
    url: '/mo-system/api/v1/dept/options',
    method: 'get',
  });
}

/**
 * 获取部门详情
 *
 * @param id
 */
export function getDeptForm(id: string): AxiosPromise<DeptForm> {
  return request({
    url: '/mo-system/api/v1/dept/' + id,
    method: 'get',
  });
}

/**
 * 新增部门
 *
 * @param data
 */
export function addDept(data: DeptForm) {
  return request({
    url: '/mo-system/api/v1/dept',
    method: 'post',
    data: data,
  });
}

/**
 *  修改部门
 *
 * @param id
 * @param data
 */
export function updateDept(id: string, data: DeptForm) {
  return request({
    url: '/mo-system/api/v1/dept/' + id,
    method: 'put',
    data: data,
  });
}

/**
 * 删除部门
 *
 * @param ids
 */
export function deleteDept(ids: string) {
  return request({
    url: '/mo-system/api/v1/dept/' + ids,
    method: 'delete',
  });
}
