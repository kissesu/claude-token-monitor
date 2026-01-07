/**
 * @file Vitest 测试配置文件
 * @description 配置 Vitest 测试框架，包括 jsdom 环境、路径别名、覆盖率报告和测试 setup
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import path from 'path';

export default mergeConfig(
  // 继承 vite.config.ts 的基础配置（路径别名、插件等）
  viteConfig({ mode: 'development', command: 'serve' }),
  defineConfig({
    test: {
      // ============================================
      // 基础测试环境配置
      // ============================================

      // 启用全局 API（describe、it、expect 等无需导入）
      globals: true,

      // 使用 jsdom 模拟浏览器 DOM 环境
      // 这是测试 Svelte 组件的必要配置
      environment: 'jsdom',

      // ============================================
      // 测试 Setup 文件
      // 在每个测试文件运行前执行，配置全局 mock 和测试工具
      // ============================================
      setupFiles: ['./tests/setup.ts'],

      // ============================================
      // 测试文件匹配规则
      // ============================================
      include: [
        // 标准测试文件目录
        'tests/**/*.{test,spec}.{js,ts}',
        // 组件同级测试目录
        'src/**/__tests__/**/*.{test,spec}.{js,ts}',
        // 组件同级测试文件
        'src/**/*.{test,spec}.{js,ts}',
      ],

      // 排除的目录
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.svelte-kit/**',
      ],

      // ============================================
      // 路径别名配置
      // 确保测试代码可以使用 $lib 路径
      // ============================================
      alias: {
        $lib: path.resolve(__dirname, './src/lib'),
      },

      // ============================================
      // 覆盖率报告配置（使用 v8）
      // ============================================
      coverage: {
        // 使用 v8 覆盖率引擎（比 c8 更快）
        provider: 'v8',

        // 覆盖率报告输出目录
        reportsDirectory: './coverage',

        // 报告格式：文本、HTML、JSON
        reporter: ['text', 'html', 'json', 'lcov'],

        // 包含在覆盖率分析中的文件
        include: [
          'src/lib/**/*.{ts,svelte}',
        ],

        // 排除的文件
        exclude: [
          // 类型定义文件不需要测试覆盖
          'src/lib/types/**',
          // 测试文件本身
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/__tests__/**',
          // demo 和 README 文件
          '**/*.demo.svelte',
          '**/*.README.md',
        ],

        // 覆盖率阈值：目标 > 70%
        thresholds: {
          // 全局覆盖率阈值
          global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
          },
        },

        // 在终端显示覆盖率摘要
        skipFull: false,

        // 启用所有文件覆盖率（即使未被测试引用）
        all: true,
      },

      // ============================================
      // 测试报告配置
      // ============================================
      reporters: ['default'],

      // ============================================
      // 其他配置
      // ============================================

      // 测试超时时间（毫秒）
      testTimeout: 10000,

      // 启用线程池以提高测试速度
      pool: 'threads',

      // 失败时重试次数
      retry: 0,

      // 监听模式下只运行相关测试
      passWithNoTests: true,

      // 测试隔离：每个测试文件在独立环境运行
      isolate: true,

      // 在 CI 环境中禁用彩色输出
      color: true,

      // Mock 配置
      mockReset: true,
      restoreMocks: true,
      clearMocks: true,
    },
  })
);
