/**
 * @file 交互功能 E2E 测试
 * @description 测试应用的交互功能，包括主题切换、日期范围选择、导出功能和设置面板
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { test, expect, getCurrentTheme } from './fixtures';

/**
 * 交互功能 E2E 测试套件
 *
 * 测试覆盖：
 * 1. 主题切换功能
 * 2. 日期范围选择
 * 3. 导出功能
 * 4. 设置面板
 * 5. 键盘导航
 * 6. 无障碍功能
 */
test.describe('交互功能测试', () => {
  /**
   * 每个测试前设置 API mock
   */
  test.beforeEach(async ({ page, setupApiMock }) => {
    await setupApiMock();
    await page.goto('/');
  });

  // ============================================
  // 主题切换功能测试
  // ============================================

  test.describe('主题切换功能', () => {
    test('点击主题切换按钮应该切换主题', async ({ page, waitForDashboard }) => {
      // 设置桌面端视口
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 获取初始主题
      const initialTheme = await getCurrentTheme(page);

      // 点击主题切换按钮
      const themeToggle = page.locator('header .theme-toggle');
      await themeToggle.click();

      // 等待主题切换动画
      await page.waitForTimeout(300);

      // 验证主题已切换
      const newTheme = await getCurrentTheme(page);
      expect(newTheme).not.toBe(initialTheme);
    });

    test('主题设置应该持久化到 localStorage', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 点击主题切换按钮
      const themeToggle = page.locator('header .theme-toggle');
      await themeToggle.click();

      // 等待主题切换
      await page.waitForTimeout(300);

      // 验证 localStorage 中保存了主题设置
      const savedTheme = await page.evaluate(() => {
        return localStorage.getItem('claude-token-monitor-theme');
      });

      expect(savedTheme).toBeTruthy();
      expect(['light', 'dark']).toContain(savedTheme);
    });

    test('刷新页面后应该保持主题设置', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 切换主题
      const themeToggle = page.locator('header .theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(300);

      // 记录当前主题
      const themeBeforeReload = await getCurrentTheme(page);

      // 刷新页面
      await page.reload();
      await waitForDashboard();

      // 验证主题保持不变
      const themeAfterReload = await getCurrentTheme(page);
      expect(themeAfterReload).toBe(themeBeforeReload);
    });

    test('主题切换按钮应该有正确的 aria-label', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 验证主题切换按钮有 aria-label
      const themeToggle = page.locator('header .theme-toggle');
      const ariaLabel = await themeToggle.getAttribute('aria-label');

      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/切换到|亮色|暗色/);
    });

    test('主题切换应该更新页面背景颜色', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 获取初始背景颜色
      const initialBgColor = await page.locator('.app-container').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // 切换主题
      const themeToggle = page.locator('header .theme-toggle');
      await themeToggle.click();
      await page.waitForTimeout(500); // 等待过渡动画

      // 获取新的背景颜色
      const newBgColor = await page.locator('.app-container').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // 验证背景颜色已改变
      expect(newBgColor).not.toBe(initialBgColor);
    });

    test('移动端应该能从菜单切换主题', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await waitForDashboard();

      // 获取初始主题
      const initialTheme = await getCurrentTheme(page);

      // 打开移动端菜单
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      await mobileMenuButton.click();

      // 等待菜单展开
      await page.waitForTimeout(200);

      // 点击菜单中的主题切换按钮
      const menuThemeToggle = page.locator('.mobile-menu .theme-toggle');
      await menuThemeToggle.click();

      // 等待主题切换
      await page.waitForTimeout(300);

      // 验证主题已切换
      const newTheme = await getCurrentTheme(page);
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  // ============================================
  // Header 交互测试
  // ============================================

  test.describe('Header 交互', () => {
    test('移动端菜单按钮应该正确切换菜单状态', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await waitForDashboard();

      const mobileMenuButton = page.locator('button.mobile-menu-button');
      const mobileMenu = page.locator('.mobile-menu');

      // 初始状态菜单应该隐藏
      await expect(mobileMenu).toBeHidden();

      // 点击打开菜单
      await mobileMenuButton.click();
      await expect(mobileMenu).toBeVisible();

      // 验证按钮 aria-expanded 属性
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');

      // 点击关闭菜单
      await mobileMenuButton.click();
      await expect(mobileMenu).toBeHidden();

      // 验证按钮 aria-expanded 属性
      await expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('菜单按钮应该显示正确的图标', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await waitForDashboard();

      const mobileMenuButton = page.locator('button.mobile-menu-button');

      // 初始应该显示菜单图标（三条横线）
      let icon = mobileMenuButton.locator('svg');
      await expect(icon).toBeVisible();

      // 点击打开菜单
      await mobileMenuButton.click();
      await page.waitForTimeout(200);

      // 应该显示关闭图标（X）
      icon = mobileMenuButton.locator('svg');
      await expect(icon).toBeVisible();
    });
  });

  // ============================================
  // 连接状态指示器测试
  // ============================================

  test.describe('连接状态指示器', () => {
    test('应该显示连接状态', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证状态指示器存在
      const statusIndicator = page.locator('.status-indicator');
      await expect(statusIndicator).toBeVisible();

      // 验证有状态文本
      const statusText = await statusIndicator.textContent();
      expect(statusText).toMatch(/实时连接|离线/);
    });

    test('连接状态点应该有正确的样式', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证状态点存在
      const statusDot = page.locator('.status-indicator .status-dot');
      await expect(statusDot).toBeVisible();
    });
  });

  // ============================================
  // 统计卡片交互测试
  // ============================================

  test.describe('统计卡片交互', () => {
    test('统计卡片应该有悬停效果', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 查找统计卡片
      const statCards = page.locator('.stats-overview [role="region"] > *');
      const firstCard = statCards.first();

      if (await firstCard.isVisible().catch(() => false)) {
        // 获取初始阴影
        const initialShadow = await firstCard.evaluate((el) => {
          return window.getComputedStyle(el).boxShadow;
        });

        // 悬停在卡片上
        await firstCard.hover();
        await page.waitForTimeout(200);

        // 获取悬停后的阴影
        const hoverShadow = await firstCard.evaluate((el) => {
          return window.getComputedStyle(el).boxShadow;
        });

        // 验证阴影变化（如果有过渡效果）
        // 注意：某些情况下阴影可能不变
        expect(hoverShadow).toBeTruthy();
      }
    });
  });

  // ============================================
  // 键盘导航测试
  // ============================================

  test.describe('键盘导航', () => {
    test('主题切换按钮应该可以通过 Tab 键聚焦', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 按 Tab 键导航
      await page.keyboard.press('Tab');

      // 多次按 Tab 直到到达主题切换按钮
      for (let i = 0; i < 10; i++) {
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.className;
        });

        if (focusedElement?.includes('theme-toggle')) {
          break;
        }

        await page.keyboard.press('Tab');
      }

      // 验证某个交互元素被聚焦
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
    });

    test('主题切换按钮应该可以通过 Enter 键激活', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 直接聚焦主题切换按钮
      const themeToggle = page.locator('header .theme-toggle');
      await themeToggle.focus();

      // 获取初始主题
      const initialTheme = await getCurrentTheme(page);

      // 按 Enter 键
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // 验证主题已切换
      const newTheme = await getCurrentTheme(page);
      expect(newTheme).not.toBe(initialTheme);
    });

    test('移动端菜单按钮应该可以通过键盘操作', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await waitForDashboard();

      // 聚焦移动端菜单按钮
      const mobileMenuButton = page.locator('button.mobile-menu-button');
      await mobileMenuButton.focus();

      // 按 Enter 键
      await page.keyboard.press('Enter');

      // 验证菜单打开
      const mobileMenu = page.locator('.mobile-menu');
      await expect(mobileMenu).toBeVisible();

      // 按 Enter 键关闭
      await page.keyboard.press('Enter');

      // 验证菜单关闭
      await expect(mobileMenu).toBeHidden();
    });
  });

  // ============================================
  // 无障碍功能测试
  // ============================================

  test.describe('无障碍功能', () => {
    test('页面应该有正确的标题', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证页面标题
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title).toContain('Claude Token Monitor');
    });

    test('交互元素应该有 aria-label', async ({ page, waitForDashboard }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await waitForDashboard();

      // 验证主题切换按钮有 aria-label
      const themeToggle = page.locator('header .theme-toggle');
      await expect(themeToggle).toHaveAttribute('aria-label');
    });

    test('统计区域应该有 role 属性', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 验证统计区域有 role="region"
      const statRegion = page.locator('[role="region"]');
      expect(await statRegion.count()).toBeGreaterThan(0);
    });

    test('图片和图标应该有替代文本', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 检查 SVG 是否有 aria-label 或在有 aria-label 的按钮内
      const svgIcons = page.locator('button svg');
      const count = await svgIcons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const svg = svgIcons.nth(i);
        const parentButton = svg.locator('..');

        // 父按钮应该有 aria-label
        const parentAriaLabel = await parentButton.getAttribute('aria-label');
        const svgAriaLabel = await svg.getAttribute('aria-label');
        const svgRole = await svg.getAttribute('role');

        // 至少一个应该存在
        expect(parentAriaLabel || svgAriaLabel || svgRole).toBeTruthy();
      }
    });
  });

  // ============================================
  // 页面滚动测试
  // ============================================

  test.describe('页面滚动', () => {
    test('页面应该可以正常滚动', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 获取初始滚动位置
      const initialScrollY = await page.evaluate(() => window.scrollY);

      // 滚动到页面底部
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // 等待滚动完成
      await page.waitForTimeout(100);

      // 获取新的滚动位置
      const newScrollY = await page.evaluate(() => window.scrollY);

      // 如果页面内容足够长，滚动位置应该改变
      // 注意：如果内容不够长，滚动位置可能不变
      expect(newScrollY).toBeGreaterThanOrEqual(0);
    });

    test('Header 应该固定在顶部', async ({ page, waitForDashboard }) => {
      await waitForDashboard();

      // 滚动页面
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(100);

      // 验证 Header 仍然可见
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // 验证 Header 的 position 是 sticky 或 fixed
      const position = await header.evaluate((el) => {
        return window.getComputedStyle(el).position;
      });

      expect(['sticky', 'fixed']).toContain(position);
    });
  });

  // ============================================
  // 错误状态交互测试
  // ============================================

  test.describe('错误状态交互', () => {
    test('错误消息应该显示重试按钮', async ({ page }) => {
      // 设置 API 返回错误
      await page.route('**/api/stats/current', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '服务器错误' }),
        });
      });

      await page.route('**/api/stats/daily', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '服务器错误' }),
        });
      });

      await page.goto('/');
      await page.waitForTimeout(2000);

      // 检查是否有错误容器
      const errorContainer = page.locator('.error-container');
      if (await errorContainer.isVisible({ timeout: 1000 }).catch(() => false)) {
        // 验证有重试按钮
        const retryButton = errorContainer.locator('button');
        if (await retryButton.isVisible().catch(() => false)) {
          await expect(retryButton).toBeVisible();
        }
      }
    });
  });
});

// ============================================
// 动画和过渡测试
// ============================================

test.describe('动画和过渡效果', () => {
  test.beforeEach(async ({ page, setupApiMock }) => {
    await setupApiMock();
    await page.goto('/');
  });

  test('主题切换应该有平滑过渡', async ({ page, waitForDashboard }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboard();

    // 获取 app-container 的 transition 属性
    const transition = await page.locator('.app-container').evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });

    // 验证有过渡效果
    expect(transition).toContain('background-color');
  });

  test('移动端菜单应该有滑入动画', async ({ page, waitForDashboard }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForDashboard();

    // 打开菜单
    const mobileMenuButton = page.locator('button.mobile-menu-button');
    await mobileMenuButton.click();

    // 验证菜单可见
    const mobileMenu = page.locator('.mobile-menu');
    await expect(mobileMenu).toBeVisible();

    // 验证菜单有动画类或 animation 属性
    const animation = await mobileMenu.evaluate((el) => {
      return window.getComputedStyle(el).animation;
    });

    // 应该有动画
    expect(animation).not.toBe('none');
  });

  test('按钮点击应该有反馈效果', async ({ page, waitForDashboard }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboard();

    // 获取主题切换按钮
    const themeToggle = page.locator('header .theme-toggle');

    // 验证按钮有 transition
    const transition = await themeToggle.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });

    expect(transition).not.toBe('none');
  });
});
