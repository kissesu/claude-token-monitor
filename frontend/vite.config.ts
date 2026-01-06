/**
 * @file Vite 配置文件
 * @description Svelte 项目的 Vite 构建配置，包含路径别名和插件设置
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],

  resolve: {
    alias: {
      // 配置路径别名 $lib -> src/lib
      $lib: path.resolve(__dirname, './src/lib'),
    },
  },

  server: {
    port: 51173,
    strictPort: true,
    host: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  test: {
    globals: true,
    environment: 'jsdom',
  },
});
