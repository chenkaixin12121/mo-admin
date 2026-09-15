/**
 * window.localStorage 浏览器永久缓存
 */
export const localStorage = {
  // 设置永久缓存
  set(key: string, val: any) {
    window.localStorage.setItem(key, JSON.stringify(val));
  },
  // 获取永久缓存
  get(key: string) {
    const json: any = window.localStorage.getItem(key);
    if (json === null) {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch {
      // 非 JSON 字符串(如被其他脚本直接写入)时原样返回，避免启动崩溃
      return json;
    }
  },
  // 移除永久缓存
  remove(key: string) {
    window.localStorage.removeItem(key);
  },
  // 移除全部永久缓存
  clear() {
    window.localStorage.clear();
  },
};

/**
 * window.sessionStorage 浏览器临时缓存
 */
export const sessionStorage = {
  // 设置临时缓存
  set(key: string, val: any) {
    window.sessionStorage.setItem(key, JSON.stringify(val));
  },
  // 获取临时缓存
  get(key: string) {
    const json: any = window.sessionStorage.getItem(key);
    if (json === null) {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch {
      // 非 JSON 字符串(如被其他脚本直接写入)时原样返回，避免启动崩溃
      return json;
    }
  },
  // 移除临时缓存
  remove(key: string) {
    window.sessionStorage.removeItem(key);
  },
  // 移除全部临时缓存
  clear() {
    window.sessionStorage.clear();
  },
};
