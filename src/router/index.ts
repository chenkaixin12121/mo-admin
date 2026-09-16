import {createRouter, createWebHashHistory, RouteRecordRaw} from 'vue-router';
import useStore from '@/store';

export const Layout = () => import('@/layout/index.vue');

// 参数说明: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
// 静态路由
export const constantRoutes: Array<RouteRecordRaw> = [
  {
    path: '/redirect',
    component: Layout,
    meta: {hidden: true},
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: {hidden: true},
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: {hidden: true},
  },

  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        name: 'Dashboard',
        meta: {title: 'dashboard', icon: 'homepage', affix: true},
      },
      {
        path: '401',
        component: () => import('@/views/error-page/401.vue'),
        meta: {hidden: true},
      }
    ],
  },
];

// 创建路由
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes as RouteRecordRaw[],
  // 刷新时，滚动条位置还原
  scrollBehavior: () => ({left: 0, top: 0}),
});

// 重置路由
export function resetRouter() {
  const {permission} = useStore();
  permission.$reset();
  // 重置路由匹配器，仅保留静态路由，彻底清除动态路由(含嵌套路由)
  const newRouter = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes as RouteRecordRaw[],
  });
  // vue-router 4 未在类型中暴露 matcher，运行时存在，此处需断言绕过类型检查
  (router as any).matcher = (newRouter as any).matcher;
}

export default router;
