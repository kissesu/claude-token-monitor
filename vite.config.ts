/**
 * @file Vite 构建配置
 * @description Tauri + React + TypeScript 项目的 Vite 配置
 * @author Atlas.oi
 * @date 2026-01-08
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Tauri 期望固定端口，如果端口不可用则失败
const port = 51173;
const host = 'localhost';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 路径别名配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vite 清除屏幕会导致 Tauri 命令行输出混乱
  clearScreen: false,

  // Tauri 开发服务器配置
  server: {
    port,
    host,
    strictPort: true,
    // 在 Tauri 启动前等待 Vite 服务器准备好
    watch: {
      // 监控 src-tauri 目录会导致 Rust 代码变更时触发页面刷新
      ignored: ['**/src-tauri/**'],
    },
  },

  // 生产构建配置
  build: {
    // Tauri 支持 es2021
    target: ['es2021', 'chrome100', 'safari14'],
    // 禁用最小化以便调试（生产环境可启用）
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // 生成 sourcemap 以便调试
    sourcemap: !!process.env.TAURI_DEBUG,
  },

  // 环境变量前缀
  envPrefix: ['VITE_', 'TAURI_'],
});
