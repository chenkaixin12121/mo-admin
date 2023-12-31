import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {FileInfo} from './types';

/**
 * 上传文件
 *
 * @param file
 */
export function uploadFileApi(file: File): AxiosPromise<FileInfo> {
  const formData = new FormData();
  formData.append('file', file);
  return request({
    url: '/mo-admin/oss',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 删除文件
 *
 * @param filePath 文件名
 */
export function deleteFileApi(filePath: string) {
  const formData = new FormData();
  formData.append('key', filePath);
  return request({
    url: '/mo-admin/oss',
    method: 'delete',
    data: formData
  });
}
