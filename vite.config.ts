import {ConfigEnv, loadEnv, UserConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {createSvgIconsPlugin} from 'vite-plugin-svg-icons';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers';
import path from 'path';

// @see: https://gitee.com/holysheng/vite2-config-description/blob/master/vite.config.ts
export default ({mode}: ConfigEnv): UserConfig => {
  // 获取 .env 环境配置文件
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue(),
      // Element Plus API（ElMessage 等）按需自动导入
      AutoImport({
        resolvers: [ElementPlusResolver({importStyle: false})],
        // 自动生成的类型声明文件位置
        dts: 'types/auto-imports.d.ts',
      }),
      // Element Plus 组件按需自动注册
      Components({
        resolvers: [ElementPlusResolver({importStyle: false})],
        dts: 'types/components.d.ts',
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        // 指定symbolId格式
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    // 本地反向代理解决浏览器跨域限制
    server: {
      host: 'localhost',
      port: Number(env.VITE_APP_PORT),
      open: true, // 运行自动打开浏览器
      proxy: {
        [env.VITE_APP_BASE_API]: {
          // 本地API地址
          target: 'http://localhost:8010',
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(new RegExp('^' + env.VITE_APP_BASE_API), ''),
        },
      },
    },
    resolve: {
      // Vite路径别名配置
      alias: {
        '@': path.resolve('./src'), // @代替src
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // 手动拆分稳定的大依赖，利于浏览器长期缓存
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
            echarts: ['echarts', 'zrender'],
          },
        },
      },
    },
  };
};
