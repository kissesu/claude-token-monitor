/**
 * @file Svelte 配置文件
 * @description Svelte 编译器配置
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // 使用 Vite 预处理器处理 TypeScript 和 PostCSS
  preprocess: vitePreprocess(),

  // 编译器选项
  compilerOptions: {
    // 启用开发模式下的运行时检查
    dev: process.env.NODE_ENV !== 'production',
  },
};
