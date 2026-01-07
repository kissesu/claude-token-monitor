/**
 * @file E2E 测试通用工具和 Fixtures
 * @description 提供 E2E 测试的通用工具函数、mock 数据和扩展 fixtures
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { test as base, expect } from '@playwright/test';

// ============================================
// Mock 数据定义
// ============================================

/**
 * Mock 统计数据
 * 用于 API 拦截时返回的测试数据
 */
export const mockStatsData = {
  period: {
    start: '2026-01-01T00:00:00Z',
    end: '2026-01-07T23:59:59Z',
  },
  models: {
    'claude-sonnet-4-5-20250929': {
      model_id: 'claude-sonnet-4-5-20250929',
      tokens: {
        input_tokens: 150000,
        output_tokens: 50000,
        cache_read_tokens: 30000,
        cache_creation_tokens: 10000,
      },
      cost: {
        input_cost: 0.45,
        output_cost: 0.75,
        cache_read_cost: 0.03,
        cache_creation_cost: 0.0375,
        total_cost: 1.2675,
      },
      request_count: 100,
    },
    'claude-opus-4-5-20251101': {
      model_id: 'claude-opus-4-5-20251101',
      tokens: {
        input_tokens: 80000,
        output_tokens: 30000,
        cache_read_tokens: 20000,
        cache_creation_tokens: 5000,
      },
      cost: {
        input_cost: 1.2,
        output_cost: 2.25,
        cache_read_cost: 0.15,
        cache_creation_cost: 0.1875,
        total_cost: 3.7875,
      },
      request_count: 50,
    },
  },
};

/**
 * Mock 每日活动数据
 */
export const mockDailyActivities = [
  { date: '2026-01-01', tokens: 30000, cost: 0.5, sessions: 10 },
  { date: '2026-01-02', tokens: 45000, cost: 0.75, sessions: 15 },
  { date: '2026-01-03', tokens: 60000, cost: 1.0, sessions: 20 },
  { date: '2026-01-04', tokens: 35000, cost: 0.6, sessions: 12 },
  { date: '2026-01-05', tokens: 55000, cost: 0.9, sessions: 18 },
  { date: '2026-01-06', tokens: 70000, cost: 1.2, sessions: 25 },
  { date: '2026-01-07', tokens: 45000, cost: 0.8, sessions: 15 },
];

// ============================================
// 扩展 Fixtures
// ============================================

/**
 * 扩展的测试 fixture 类型
 */
interface CustomFixtures {
  /**
   * 设置 API mock
   * 拦截 API 请求并返回 mock 数据
   */
  setupApiMock: () => Promise<void>;

  /**
   * 等待页面完全加载
   * 包括数据加载和动画完成
   */
  waitForDashboard: () => Promise<void>;
}

/**
 * 扩展的 Playwright test fixture
 * 提供常用的测试辅助功能
 */
export const test = base.extend<CustomFixtures>({
  /**
   * 设置 API mock fixture
   *
   * 业务逻辑：
   * 1. 拦截所有后端 API 请求
   * 2. 返回预定义的 mock 数据
   * 3. 模拟 WebSocket 连接状态
   */
  setupApiMock: async ({ page }, use) => {
    const setup = async () => {
      // 拦截统计数据 API
      await page.route('**/api/stats/current', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockStatsData),
        });
      });

      // 拦截每日活动数据 API
      await page.route('**/api/stats/daily', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDailyActivities),
        });
      });

      // 拦截导出 API
      await page.route('**/api/export/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, filename: 'export-2026-01-07.json' }),
        });
      });
    };

    await use(setup);
  },

  /**
   * 等待仪表板加载完成 fixture
   *
   * 业务逻辑：
   * 1. 等待加载指示器消失
   * 2. 等待主要内容区域可见
   * 3. 等待统计卡片渲染
   */
  waitForDashboard: async ({ page }, use) => {
    const wait = async () => {
      // 等待加载指示器消失（如果存在）
      const loadingSpinner = page.locator('.loading-container');
      if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
      }

      // 等待仪表板内容区域可见
      await page.locator('.dashboard-content').waitFor({ state: 'visible', timeout: 30000 });

      // 等待统计概览区域可见
      await page.locator('.stats-overview').waitFor({ state: 'visible', timeout: 10000 });
    };

    await use(wait);
  },
});

// ============================================
// 导出 expect
// ============================================

export { expect };

// ============================================
// 通用工具函数
// ============================================

/**
 * 等待动画完成
 *
 * @param page - Playwright 页面对象
 * @param ms - 等待时间（毫秒），默认 300ms
 */
export async function waitForAnimation(page: { waitForTimeout: (ms: number) => Promise<void> }, ms = 300): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * 获取页面当前主题
 *
 * @param page - Playwright 页面对象
 * @returns 当前主题 'dark' | 'light'
 */
export async function getCurrentTheme(page: { locator: (selector: string) => { evaluate: (fn: (el: Element) => string) => Promise<string> } }): Promise<string> {
  const html = page.locator('html');
  const hasDarkClass = await html.evaluate((el) => el.classList.contains('dark'));
  return hasDarkClass ? 'dark' : 'light';
}

/**
 * 设置视口大小
 *
 * @param page - Playwright 页面对象
 * @param width - 视口宽度
 * @param height - 视口高度
 */
export async function setViewport(
  page: { setViewportSize: (size: { width: number; height: number }) => Promise<void> },
  width: number,
  height: number
): Promise<void> {
  await page.setViewportSize({ width, height });
}

/**
 * 视口预设尺寸
 */
export const viewportPresets = {
  /**
   * 移动端 - iPhone SE
   */
  mobile: { width: 375, height: 667 },

  /**
   * 移动端横屏
   */
  mobileLandscape: { width: 667, height: 375 },

  /**
   * 平板 - iPad
   */
  tablet: { width: 768, height: 1024 },

  /**
   * 平板横屏
   */
  tabletLandscape: { width: 1024, height: 768 },

  /**
   * 桌面 - 标准
   */
  desktop: { width: 1280, height: 800 },

  /**
   * 桌面 - 宽屏
   */
  desktopWide: { width: 1920, height: 1080 },

  /**
   * 桌面 - 4K
   */
  desktop4k: { width: 2560, height: 1440 },
};

/**
 * 测试数据生成器
 */
export const testDataGenerators = {
  /**
   * 生成随机 Token 数量
   *
   * @param min - 最小值
   * @param max - 最大值
   * @returns 随机 Token 数量
   */
  randomTokenCount(min = 1000, max = 100000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 生成随机费用
   *
   * @param min - 最小值
   * @param max - 最大值
   * @returns 随机费用（保留 4 位小数）
   */
  randomCost(min = 0.01, max = 10): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(4));
  },

  /**
   * 生成日期字符串
   *
   * @param daysAgo - 几天前
   * @returns ISO 日期字符串
   */
  dateString(daysAgo = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  },
};
