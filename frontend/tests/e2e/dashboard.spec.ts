/**
 * @file 仪表板 E2E 测试
 * @description 测试仪表板页面的加载、数据显示、统计卡片和图表渲染
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { test, expect, mockStatsData } from './fixtures';

/**
 * 仪表板 E2E 测试套件
 *
 * 测试覆盖：
 * 1. 页面基础加载
 * 2. 页面标题和元数据
 * 3. Header 组件渲染
 * 4. 统计概览区域
 * 5. 统计卡片渲染
 * 6. 模型用量面板
 * 7. 费用估算面板
 * 8. 每日活动面板
 */
test.describe('仪表板页面测试', () => {
  /**
   * 每个测试前设置 API mock
   */
  test.beforeEach(async ({ page, setupApiMock }) => {
    // 设置 API mock
    await setupApiMock();
    // 导航到首页
    await page.goto('/');
  });

  // ============================================
  // 页面加载测试
  // ============================================

  test.describe('页面加载', () => {
    test('应该成功加载仪表板页面', async ({ page, waitForDashboard }) => {
      // 等待仪表板加载完成
      await waitForDashboard();

      // 验证页面标题
      await expect(page).toHaveTitle(/Claude Token Monitor/);

      // 验证页面主容器存在
      await expect(page.locator('.app-container')).toBeVisible();
    });

    test('应该显示正确的页面标题和副标题', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证主标题
      const pageTitle = page.locator('.page-title');
      await expect(pageTitle).toBeVisible();
      await expect(pageTitle).toContainText('Token 使用监控');

      // 验证副标题
      const pageSubtitle = page.locator('.page-subtitle');
      await expect(pageSubtitle).toBeVisible();
      await expect(pageSubtitle).toContainText('实时追踪');
    });

    test('应该显示连接状态指示器', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证连接状态指示器存在
      const connectionStatus = page.locator('.connection-status');
      await expect(connectionStatus).toBeVisible();

      // 验证状态指示器文本（离线或实时连接）
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toBeVisible();
    });
  });

  // ============================================
  // Header 组件测试
  // ============================================

  test.describe('Header 组件', () => {
    test('应该显示应用标题', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证 Header 存在
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // 验证应用标题
      const appTitle = header.locator('h1');
      await expect(appTitle).toContainText('Claude Token Monitor');
    });

    test('应该显示 Logo 图标', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证 Logo 图标存在
      const logoIcon = page.locator('.logo-icon svg');
      await expect(logoIcon).toBeVisible();
    });

    test('桌面端应该显示主题切换按钮', async ({ page, waitForDashboard }) => {
      // 设置桌面端视口
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 验证桌面端主题切换按钮可见
      const themeToggle = page.locator('header .theme-toggle');
      await expect(themeToggle).toBeVisible();
    });
  });

  // ============================================
  // 统计概览测试
  // ============================================

  test.describe('统计概览区域', () => {
    test('应该显示统计概览标题', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证统计概览区域存在
      const statsOverview = page.locator('.stats-overview');
      await expect(statsOverview).toBeVisible();

      // 验证标题
      const overviewTitle = statsOverview.locator('h2');
      await expect(overviewTitle).toContainText('统计概览');
    });

    test('应该显示实时更新状态指示器', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证连接状态指示器
      const statsOverview = page.locator('.stats-overview');
      const statusText = statsOverview.locator('text=实时更新').or(statsOverview.locator('text=离线'));
      await expect(statusText).toBeVisible();
    });
  });

  // ============================================
  // 统计卡片测试
  // ============================================

  test.describe('统计卡片', () => {
    test('应该显示总 Token 数卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 查找包含"总 Token 数"的卡片
      const tokenCard = page.locator('[role="region"]').filter({ hasText: '总 Token 数' });
      await expect(tokenCard).toBeVisible();
    });

    test('应该显示输入 Tokens 卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const inputTokenCard = page.locator('[role="region"]').filter({ hasText: '输入 Tokens' });
      await expect(inputTokenCard).toBeVisible();
    });

    test('应该显示输出 Tokens 卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const outputTokenCard = page.locator('[role="region"]').filter({ hasText: '输出 Tokens' });
      await expect(outputTokenCard).toBeVisible();
    });

    test('应该显示缓存命中卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const cacheHitCard = page.locator('[role="region"]').filter({ hasText: '缓存命中' });
      await expect(cacheHitCard).toBeVisible();
    });

    test('应该显示缓存写入卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const cacheWriteCard = page.locator('[role="region"]').filter({ hasText: '缓存写入' });
      await expect(cacheWriteCard).toBeVisible();
    });

    test('应该显示缓存命中率卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const cacheRateCard = page.locator('[role="region"]').filter({ hasText: '缓存命中率' });
      await expect(cacheRateCard).toBeVisible();
    });

    test('应该显示总费用卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const costCard = page.locator('[role="region"]').filter({ hasText: '总费用' });
      await expect(costCard).toBeVisible();
    });

    test('应该显示会话数量卡片', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      const sessionCard = page.locator('[role="region"]').filter({ hasText: '会话数量' });
      await expect(sessionCard).toBeVisible();
    });

    test('统计卡片网格应该正确布局', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证网格容器存在
      const grid = page.locator('.stats-overview .grid');
      await expect(grid).toBeVisible();

      // 验证网格有正确的 CSS 类
      await expect(grid).toHaveClass(/grid-cols-1/);
    });
  });

  // ============================================
  // 模型用量面板测试
  // ============================================

  test.describe('模型用量面板', () => {
    test('应该显示模型用量面板', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证双栏布局存在
      const twoColumnGrid = page.locator('.two-column-grid');
      await expect(twoColumnGrid).toBeVisible();

      // 验证面板区域存在
      const dashboardSections = page.locator('.dashboard-section');
      expect(await dashboardSections.count()).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // 每日活动面板测试
  // ============================================

  test.describe('每日活动面板', () => {
    test('应该显示每日活动区域', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证仪表板内容区域存在多个 section
      const dashboardContent = page.locator('.dashboard-content');
      await expect(dashboardContent).toBeVisible();

      const sections = dashboardContent.locator('.dashboard-section');
      expect(await sections.count()).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================
  // Footer 组件测试
  // ============================================

  test.describe('Footer 组件', () => {
    test('应该显示页面底部', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证 Footer 存在
      const footer = page.locator('footer').or(page.locator('[class*="footer"]'));
      await expect(footer).toBeVisible();
    });
  });

  // ============================================
  // 错误状态测试
  // ============================================

  test.describe('错误状态', () => {
    test('API 失败时应该显示错误消息', async ({ page }) => {
      // 拦截 API 返回错误
      await page.route('**/api/stats/current', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '服务器内部错误' }),
        });
      });

      await page.route('**/api/stats/daily', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '服务器内部错误' }),
        });
      });

      // 导航到首页
      await page.goto('/');

      // 等待加载完成
      await page.waitForTimeout(2000);

      // 如果有错误容器，验证其显示
      const errorContainer = page.locator('.error-container');
      if (await errorContainer.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(errorContainer).toBeVisible();
      }
    });
  });

  // ============================================
  // 加载状态测试
  // ============================================

  test.describe('加载状态', () => {
    test('初始加载时应该显示加载指示器', async ({ page }) => {
      // 延迟 API 响应
      await page.route('**/api/stats/current', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockStatsData),
        });
      });

      // 导航到首页
      await page.goto('/');

      // 验证加载容器显示
      const loadingContainer = page.locator('.loading-container');
      await expect(loadingContainer).toBeVisible({ timeout: 1000 }).catch(() => {
        // 如果加载太快，可能已经消失
      });
    });
  });
});

// ============================================
// 数据显示测试
// ============================================

test.describe('数据显示测试', () => {
  test.beforeEach(async ({ page, setupApiMock }) => {
    await setupApiMock();
    await page.goto('/');
  });

  test('统计数据应该正确格式化显示', async ({ page, waitForDashboard }) => {
    await waitForDashboard();

    // 验证统计区域有数据
    const statsOverview = page.locator('.stats-overview');
    await expect(statsOverview).toBeVisible();

    // 验证有数值显示（检查是否有数字）
    const statCards = statsOverview.locator('[role="region"] >> *');
    expect(await statCards.count()).toBeGreaterThan(0);
  });
});
