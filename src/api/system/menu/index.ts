import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {Menu, MenuForm, MenuQuery, Resource} from './types';

/**
 * 获取路由列表
 */
export function listRoutes() {
  return request({
    url: '/mo-system/api/v1/menus/routes',
    method: 'get',
  });
}

/**
 * 获取菜单表格列表
 *
 * @param queryParams
 */
export function listMenus(queryParams: MenuQuery): AxiosPromise<Menu[]> {
  return request({
    url: '/mo-system/api/v1/menus/list',
    method: 'post',
    data: queryParams,
  });
}

/**
 * 获取菜单下拉树形列表
 */
export function listMenuOptions(): AxiosPromise<OptionType[]> {
  return request({
    url: '/mo-system/api/v1/menus/options',
    method: 'get',
  });
}

/**
 * 获取资源(菜单+权限)树形列表
 */
export function listResources(): AxiosPromise<Resource[]> {
  return request({
    url: '/mo-system/api/v1/menus/resources',
    method: 'get',
  });
}

/**
 * 获取菜单详情
 * @param id
 */
export function getMenuDetail(id: string): AxiosPromise<MenuForm> {
  return request({
    url: '/mo-system/api/v1/menus/' + id,
    method: 'get',
  });
}

/**
 * 添加菜单
 *
 * @param data
 */
export function addMenu(data: MenuForm) {
  return request({
    url: '/mo-system/api/v1/menus',
    method: 'post',
    data: data,
  });
}

/**
 * 修改菜单
 *
 * @param id
 * @param data
 */
export function updateMenu(id: string, data: MenuForm) {
  return request({
    url: '/mo-system/api/v1/menus/' + id,
    method: 'put',
    data: data,
  });
}

/**
 * 删除菜单
 *
 * @param id 菜单ID
 */
export function deleteMenu(id: number) {
  return request({
    url: '/mo-system/api/v1/menus/' + id,
    method: 'delete',
  });
}
