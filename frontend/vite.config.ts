/**
 * @file Vite 配置文件
 * @description Svelte 项目的 Vite 构建配置，包含性能优化、代码分割和压缩设置
 *              目标：gzip 打包体积 < 100KB，首屏加载时间 < 1s
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      svelte(),
      // ============================================
      // Gzip 预压缩插件
      // 生成 .gz 文件，服务器可直接返回压缩文件
      // ============================================
      isProduction &&
        compression({
          // 使用 gzip 压缩算法
          algorithm: 'gzip',
          // 文件扩展名
          ext: '.gz',
          // 只压缩大于 1KB 的文件
          threshold: 1024,
          // 删除原始文件（设为 false 保留原文件）
          deleteOriginFile: false,
          // 压缩等级（1-9，9 最高压缩率）
          compressionOptions: { level: 9 },
        }),
      // ============================================
      // Brotli 预压缩插件
      // 比 gzip 压缩率更高，现代浏览器支持
      // ============================================
      isProduction &&
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 1024,
          deleteOriginFile: false,
        }),
      // ============================================
      // Bundle 可视化分析插件
      // 生成 stats.html 用于分析打包体积
      // ============================================
      isProduction &&
        visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // 可选: sunburst, treemap, network
        }),
    ].filter(Boolean),

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
      // 生产环境不生成 sourcemap 以减少体积
      sourcemap: !isProduction,
      // 启用 CSS 代码分割
      cssCodeSplit: true,
      // 设置 chunk 大小警告阈值 (KB)
      chunkSizeWarningLimit: 250,
      // 优化压缩配置
      minify: 'esbuild',
      // 生产环境启用更激进的压缩
      target: 'es2020',
      // 模块预加载配置（新版本属性名）
      modulePreload: {
        polyfill: false,
      },
      // CSS 性能优化
      cssMinify: true,
      // 设置静态资源内联阈值 (bytes)
      // 小于 4KB 的资源内联为 base64，减少 HTTP 请求
      assetsInlineLimit: 4096,
      // 静态资源输出目录
      assetsDir: 'assets',
      // Rollup 优化配置
      rollupOptions: {
        output: {
          // ============================================
          // 手动分割 chunks，优化首屏加载
          // 策略：
          // 1. svelte-runtime：Svelte 核心，所有页面必需
          // 2. charts：图表库 + 所有依赖（layerchart, d3, svelte-ux 等）
          // 3. vendor：其他第三方库，首屏不需要可延迟
          // 注意：不再单独拆分 ui chunk，避免循环依赖问题
          // ============================================
          manualChunks: (id) => {
            // Svelte 运行时 - 核心框架，首屏必需
            if (id.includes('node_modules/svelte')) {
              return 'svelte-runtime';
            }
            // 图表相关库及其所有依赖统一处理
            // 包含 layerchart、d3 系列、svelte-ux 及其所有子依赖
            if (
              id.includes('node_modules/layerchart') ||
              id.includes('node_modules/d3') ||
              id.includes('node_modules/svelte-ux') ||
              id.includes('node_modules/internmap') ||
              id.includes('node_modules/delaunator') ||
              id.includes('node_modules/robust-predicates') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/prism')
            ) {
              return 'charts';
            }
            // 其他所有 node_modules 归入 vendor
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // 优化 chunk 文件命名
          chunkFileNames: 'assets/[name]-[hash].js',
          // 入口文件命名
          entryFileNames: 'assets/[name]-[hash].js',
          // 静态资源命名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            // CSS 文件单独处理
            if (ext === 'css') {
              return 'assets/styles-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // 控制 chunk 的紧凑性
          compact: isProduction,
          // 生成更小的输出
          generatedCode: {
            constBindings: true,
            objectShorthand: true,
            arrowFunctions: true,
          },
        },
        // 外部化优化：避免重复打包
        treeshake: {
          // 启用更激进的 tree-shaking
          moduleSideEffects: 'no-external',
          // 标记纯函数调用
          annotations: true,
          // 移除未使用的代码
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          unknownGlobalSideEffects: false,
        },
      },
      // 报告压缩体积（含 gzip）
      reportCompressedSize: true,
    },

    // 优化依赖预构建
    optimizeDeps: {
      // 预构建这些依赖以加速开发服务器启动
      include: ['svelte'],
      // 排除大型图表库，按需加载
      exclude: [],
    },

    // 生产环境配置
    esbuild: {
      // 生产环境移除 console 和 debugger
      drop: isProduction ? ['console', 'debugger'] : [],
      // 保持函数名用于调试（开发环境）
      keepNames: !isProduction,
    },

    // CSS 优化配置
    css: {
      // 开发环境使用 sourcemap
      devSourcemap: !isProduction,
      // PostCSS 处理由 postcss.config.js 控制
    },

    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
