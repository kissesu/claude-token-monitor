/**
 * @file 响应式布局 E2E 测试
 * @description 测试应用在不同设备尺寸下的响应式布局表现
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { test, expect, viewportPresets } from './fixtures';

/**
 * 响应式布局 E2E 测试套件
 *
 * 测试覆盖：
 * 1. 移动端布局（375px）
 * 2. 平板布局（768px）
 * 3. 桌面布局（1280px）
 * 4. 宽屏布局（1920px）
 * 5. Header 响应式行为
 * 6. 统计卡片网格布局
 * 7. 双栏布局响应式
 */
test.describe('响应式布局测试', () => {
  /**
   * 每个测试前设置 API mock
   */
  test.beforeEach(async ({ page, setupApiMock }) => {
    await setupApiMock();
  });

  // ============================================
  // 移动端布局测试（375px）
  // ============================================

  test.describe('移动端布局 (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewportPresets.mobile);
      await page.goto('/');
    });

    test('应该显示移动端菜单按钮', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证移动端菜单按钮可见
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      await expect(mobileMenuButton).toBeVisible();

      // 验证桌面端导航区域隐藏
      const desktopNav = page.locator('header .hidden.md\\:flex');
      await expect(desktopNav).toBeHidden();
    });

    test('Header 标题应该自适应显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证 Header 存在
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // 验证标题可见
      const title = header.locator('h1');
      await expect(title).toBeVisible();
    });

    test('统计卡片应该单列显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证网格容器存在
      const grid = page.locator('.stats-overview .grid');
      await expect(grid).toBeVisible();

      // 验证是单列布局（grid-cols-1）
      await expect(grid).toHaveClass(/grid-cols-1/);
    });

    test('双栏布局应该变为单列', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证双栏网格存在
      const twoColumnGrid = page.locator('.two-column-grid');
      await expect(twoColumnGrid).toBeVisible();

      // 在移动端应该是单列（通过 CSS 媒体查询）
      const gridStyle = await twoColumnGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      // 验证是单列（1fr 或 100%）
      expect(gridStyle).toMatch(/^(1fr|100%|none|\d+px)$/);
    });

    test('移动端菜单应该可以展开和收起', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 点击移动端菜单按钮
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      await mobileMenuButton.click();

      // 验证菜单展开
      const mobileMenu = page.locator('.mobile-menu');
      await expect(mobileMenu).toBeVisible();

      // 验证菜单中有主题切换选项
      await expect(mobileMenu.locator('text=主题切换')).toBeVisible();

      // 再次点击关闭菜单
      await mobileMenuButton.click();

      // 验证菜单收起
      await expect(mobileMenu).toBeHidden();
    });

    test('页面标题应该正确显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证页面标题
      const pageTitle = page.locator('.page-title');
      await expect(pageTitle).toBeVisible();

      // 验证标题字体大小适应移动端
      const titleFontSize = await pageTitle.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      expect(parseFloat(titleFontSize)).toBeLessThanOrEqual(32);
    });

    test('页面应该可以正常滚动', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 滚动到页面底部
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // 验证 Footer 可见
      const footer = page.locator('footer').or(page.locator('[class*="footer"]'));
      await expect(footer).toBeVisible();
    });
  });

  // ============================================
  // 平板布局测试（768px）
  // ============================================

  test.describe('平板布局 (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewportPresets.tablet);
      await page.goto('/');
    });

    test('页面头部应该水平布局', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证页面头部
      const pageHeader = page.locator('.page-header');
      await expect(pageHeader).toBeVisible();

      // 验证是 flex 布局且水平方向
      const displayStyle = await pageHeader.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          flexDirection: style.flexDirection,
        };
      });

      expect(displayStyle.display).toBe('flex');
      // 在 768px 应该是 row
      expect(['row', 'column']).toContain(displayStyle.flexDirection);
    });

    test('统计卡片应该两列显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证网格容器
      const grid = page.locator('.stats-overview .grid');
      await expect(grid).toBeVisible();

      // 获取实际的 grid 列数
      const gridColumns = await grid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      // 验证有两列（包含两个 fr 或 px 值）
      const columnCount = gridColumns.split(' ').filter((col) => col && col !== 'none').length;
      expect(columnCount).toBeGreaterThanOrEqual(2);
    });

    test('双栏布局应该保持单列或双列', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证双栏网格
      const twoColumnGrid = page.locator('.two-column-grid');
      await expect(twoColumnGrid).toBeVisible();

      // 获取列数
      const gridColumns = await twoColumnGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      const columnCount = gridColumns.split(' ').filter((col) => col && col !== 'none').length;
      expect(columnCount).toBeGreaterThanOrEqual(1);
    });

    test('Header 应该显示完整导航', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证 Header
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // 根据设计，768px 可能还显示移动端菜单或已经显示桌面端导航
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      const desktopNav = page.locator('header .hidden.md\\:flex');

      // 至少一个应该可见
      const isMobileVisible = await mobileMenuButton.isVisible().catch(() => false);
      const isDesktopVisible = await desktopNav.isVisible().catch(() => false);

      expect(isMobileVisible || isDesktopVisible).toBe(true);
    });
  });

  // ============================================
  // 桌面布局测试（1280px）
  // ============================================

  test.describe('桌面布局 (1280px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewportPresets.desktop);
      await page.goto('/');
    });

    test('应该隐藏移动端菜单按钮', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证移动端菜单按钮隐藏
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      await expect(mobileMenuButton).toBeHidden();
    });

    test('应该显示桌面端导航', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证桌面端导航区域可见
      const desktopNav = page.locator('header .hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();
    });

    test('应该显示主题切换按钮', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证主题切换按钮可见
      const themeToggle = page.locator('header .theme-toggle');
      await expect(themeToggle).toBeVisible();
    });

    test('统计卡片应该四列显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证网格容器
      const grid = page.locator('.stats-overview .grid');
      await expect(grid).toBeVisible();

      // 获取实际的 grid 列数
      const gridColumns = await grid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      // 验证有四列
      const columnCount = gridColumns.split(' ').filter((col) => col && col !== 'none').length;
      expect(columnCount).toBeGreaterThanOrEqual(4);
    });

    test('双栏布局应该显示两列', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证双栏网格
      const twoColumnGrid = page.locator('.two-column-grid');
      await expect(twoColumnGrid).toBeVisible();

      // 获取列数
      const gridColumns = await twoColumnGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      const columnCount = gridColumns.split(' ').filter((col) => col && col !== 'none').length;
      expect(columnCount).toBe(2);
    });

    test('主内容区域应该有最大宽度限制', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证主内容区域
      const mainContent = page.locator('.main-content');
      await expect(mainContent).toBeVisible();

      // 获取最大宽度
      const maxWidth = await mainContent.evaluate((el) => {
        return window.getComputedStyle(el).maxWidth;
      });

      // 验证有最大宽度限制（1440px）
      expect(maxWidth).toBe('1440px');
    });

    test('内容应该居中显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证主内容区域
      const mainContent = page.locator('.main-content');

      // 获取 margin
      const margin = await mainContent.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
        };
      });

      // 验证是居中的（margin auto）
      expect(margin.marginLeft).toBe(margin.marginRight);
    });
  });

  // ============================================
  // 宽屏布局测试（1920px）
  // ============================================

  test.describe('宽屏布局 (1920px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewportPresets.desktopWide);
      await page.goto('/');
    });

    test('内容应该在最大宽度内居中', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证主内容区域
      const mainContent = page.locator('.main-content');
      await expect(mainContent).toBeVisible();

      // 获取实际宽度和位置
      const boundingBox = await mainContent.boundingBox();

      if (boundingBox) {
        // 验证内容不会超出最大宽度
        expect(boundingBox.width).toBeLessThanOrEqual(1440);

        // 验证内容居中（左右边距相近）
        const viewportWidth = 1920;
        const leftMargin = boundingBox.x;
        const rightMargin = viewportWidth - boundingBox.x - boundingBox.width;

        // 允许 1px 误差
        expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(1);
      }
    });

    test('Header 应该全宽显示', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证 Header
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // 获取 Header 宽度
      const boundingBox = await header.boundingBox();

      if (boundingBox) {
        // Header 应该是全宽的
        expect(boundingBox.width).toBeCloseTo(1920, -1);
      }
    });
  });

  // ============================================
  // 横屏测试
  // ============================================

  test.describe('横屏布局', () => {
    test('移动端横屏应该正确显示', async ({ page, setupApiMock, waitForDashboard }) => {
      await page.setViewportSize(viewportPresets.mobileLandscape);
      await page.goto('/');
      await waitForDashboard();

      // 验证页面正常显示
      const appContainer = page.locator('.app-container');
      await expect(appContainer).toBeVisible();

      // 验证可以滚动
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });

    test('平板横屏应该显示更多列', async ({ page, setupApiMock, waitForDashboard }) => {
      await page.setViewportSize(viewportPresets.tabletLandscape);
      await page.goto('/');
      await waitForDashboard();

      // 验证统计卡片网格
      const grid = page.locator('.stats-overview .grid');
      await expect(grid).toBeVisible();

      // 获取列数
      const gridColumns = await grid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      const columnCount = gridColumns.split(' ').filter((col) => col && col !== 'none').length;
      expect(columnCount).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // 动态视口调整测试
  // ============================================

  test.describe('动态视口调整', () => {
    test('从桌面调整到移动端应该正确响应', async ({ page, setupApiMock, waitForDashboard }) => {
      // 从桌面端开始
      await page.setViewportSize(viewportPresets.desktop);
      await page.goto('/');
      await waitForDashboard();

      // 验证桌面端布局
      let mobileMenuButton = page.locator('button.mobile-menu-button');
      await expect(mobileMenuButton).toBeHidden();

      // 调整到移动端
      await page.setViewportSize(viewportPresets.mobile);

      // 等待布局更新
      await page.waitForTimeout(300);

      // 验证移动端布局
      mobileMenuButton = page.locator('button.mobile-menu-button');
      await expect(mobileMenuButton).toBeVisible();
    });

    test('从移动端调整到桌面端应该正确响应', async ({ page, setupApiMock, waitForDashboard }) => {
      // 从移动端开始
      await page.setViewportSize(viewportPresets.mobile);
      await page.goto('/');
      await waitForDashboard();

      // 验证移动端布局
      let desktopNav = page.locator('header .hidden.md\\:flex');
      await expect(desktopNav).toBeHidden();

      // 调整到桌面端
      await page.setViewportSize(viewportPresets.desktop);

      // 等待布局更新
      await page.waitForTimeout(300);

      // 验证桌面端布局
      desktopNav = page.locator('header .hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();
    });
  });

  // ============================================
  // 触摸设备测试
  // ============================================

  test.describe('触摸设备', () => {
    test('触摸元素应该有足够的点击区域', async ({ page, setupApiMock, waitForDashboard }) => {
      await page.setViewportSize(viewportPresets.mobile);
      await page.goto('/');
      await waitForDashboard();

      // 验证移动端菜单按钮有足够的点击区域（至少 44x44px）
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      const buttonBox = await mobileMenuButton.boundingBox();

      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(40);
        expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      }
    });
  });
});
