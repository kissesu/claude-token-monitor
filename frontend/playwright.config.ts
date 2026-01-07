/**
 * @file Playwright E2E 测试配置文件
 * @description 配置 Playwright 进行端到端测试，包含多浏览器支持、截图和视频录制
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * 开发服务器端口
 * 与 vite.config.ts 保持一致
 */
const DEV_SERVER_PORT = 51173;

/**
 * 基础 URL
 */
const BASE_URL = `http://localhost:${DEV_SERVER_PORT}`;

/**
 * Playwright 配置
 *
 * 配置项说明：
 * 1. testDir - 测试文件目录
 * 2. fullyParallel - 启用完全并行测试
 * 3. forbidOnly - CI 环境禁止 .only 测试
 * 4. retries - 失败重试次数
 * 5. workers - 并行工作线程数
 * 6. reporter - 测试报告格式
 * 7. use - 全局测试选项
 * 8. projects - 多浏览器配置
 * 9. webServer - 开发服务器配置
 */
export default defineConfig({
  // ============================================
  // 基础配置
  // ============================================

  /**
   * 测试文件目录
   */
  testDir: './tests/e2e',

  /**
   * 测试文件匹配模式
   */
  testMatch: '**/*.spec.ts',

  /**
   * 启用完全并行测试
   * 提高测试执行效率
   */
  fullyParallel: true,

  /**
   * CI 环境禁止 .only 测试
   * 防止意外提交专注测试
   */
  forbidOnly: !!process.env.CI,

  /**
   * 失败重试次数
   * CI 环境重试 2 次，本地不重试
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * 并行工作线程数
   * CI 环境单线程，本地 50% CPU
   */
  workers: process.env.CI ? 1 : undefined,

  // ============================================
  // 测试报告配置
  // ============================================

  /**
   * 测试报告格式
   * - html: 生成 HTML 报告
   * - list: 控制台列表输出
   */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // ============================================
  // 全局测试选项
  // ============================================

  use: {
    /**
     * 基础 URL
     * 所有 page.goto() 将相对于此 URL
     */
    baseURL: BASE_URL,

    /**
     * 收集追踪信息
     * 仅在首次重试时收集，用于调试失败测试
     */
    trace: 'on-first-retry',

    /**
     * 截图策略
     * - only-on-failure: 仅失败时截图
     */
    screenshot: 'only-on-failure',

    /**
     * 视频录制策略
     * - on-first-retry: 首次重试时录制
     */
    video: 'on-first-retry',

    /**
     * 全局超时设置
     * 动作超时：10 秒
     */
    actionTimeout: 10000,

    /**
     * 导航超时
     * 页面加载超时：30 秒
     */
    navigationTimeout: 30000,

    /**
     * 地理位置（可选，用于测试本地化）
     */
    // locale: 'zh-CN',

    /**
     * 时区设置
     */
    timezoneId: 'Asia/Shanghai',
  },

  // ============================================
  // 多浏览器配置
  // ============================================

  projects: [
    /**
     * Chromium 浏览器测试（主要）
     * 桌面 Chrome
     */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    /**
     * Firefox 浏览器测试（可选）
     * 桌面 Firefox
     */
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    /**
     * WebKit 浏览器测试（可选）
     * 桌面 Safari
     */
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    /**
     * 移动端 Chrome 测试
     * Pixel 5 设备模拟
     */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    /**
     * 移动端 Safari 测试
     * iPhone 12 设备模拟
     */
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  // ============================================
  // 开发服务器配置
  // ============================================

  webServer: {
    /**
     * 启动命令
     * 使用 pnpm 启动开发服务器
     */
    command: 'pnpm dev',

    /**
     * 服务器 URL
     * 等待服务器在此 URL 可用后开始测试
     */
    url: BASE_URL,

    /**
     * 是否复用已运行的服务器
     * 本地开发时复用，CI 环境启动新服务器
     */
    reuseExistingServer: !process.env.CI,

    /**
     * 服务器启动超时
     * 等待 60 秒
     */
    timeout: 60 * 1000,

    /**
     * 标准输出处理
     * 忽略服务器输出，保持测试输出清晰
     */
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // ============================================
  // 输出目录配置
  // ============================================

  /**
   * 测试结果输出目录
   */
  outputDir: 'test-results',

  // ============================================
  // 全局超时配置
  // ============================================

  /**
   * 单个测试超时
   * 默认 30 秒
   */
  timeout: 30 * 1000,

  /**
   * expect 断言超时
   * 默认 5 秒
   */
  expect: {
    timeout: 5000,
  },
});
