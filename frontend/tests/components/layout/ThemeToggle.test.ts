/**
 * @file ThemeToggle 组件单元测试
 * @description 测试 ThemeToggle 主题切换组件的主题切换、持久化和系统主题检测
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ThemeToggle from '$lib/components/layout/ThemeToggle.svelte';

describe('ThemeToggle 组件', () => {
  const THEME_STORAGE_KEY = 'claude-token-monitor-theme';

  beforeEach(() => {
    // 清理 DOM 和 localStorage
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('基础渲染', () => {
    it('应渲染主题切换按钮', () => {
      render(ThemeToggle);

      // 组件使用 role="switch" 而不是 role="button"
      const button = screen.getByRole('switch');
      expect(button).toBeInTheDocument();
    });

    it('应有正确的无障碍属性', async () => {
      render(ThemeToggle);

      // 等待 onMount 执行
      await waitFor(() => {
        const button = screen.getByRole('switch');
        // 组件使用 role="switch" 和 aria-checked，而不是 aria-pressed
        expect(button).toHaveAttribute('aria-checked');
      });
    });

    it('按钮应有 title 属性提示', async () => {
      render(ThemeToggle);

      await waitFor(() => {
        const button = screen.getByRole('switch');
        expect(button).toHaveAttribute('title');
      });
    });
  });

  describe('主题初始化', () => {
    it('无存储时应使用系统主题（默认 light）', async () => {
      // matchMedia mock 默认返回 matches: false（非暗色模式）
      render(ThemeToggle);

      await waitFor(() => {
        // 系统主题为 light，所以不应添加 dark 类
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    it('有存储的 dark 主题时应应用暗色模式', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      render(ThemeToggle);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('有存储的 light 主题时应应用亮色模式', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      render(ThemeToggle);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    it('存储无效值时应使用系统主题', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'invalid');

      render(ThemeToggle);

      await waitFor(() => {
        // 系统主题为 light（matchMedia mock 返回 matches: false）
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('主题切换', () => {
    it('点击按钮应切换主题', async () => {
      // 从 light 开始
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      render(ThemeToggle);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });

      const button = screen.getByRole('switch');
      await fireEvent.click(button);

      // 应切换到 dark
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('从暗色模式切换到亮色模式', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      render(ThemeToggle);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      const button = screen.getByRole('switch');
      await fireEvent.click(button);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('切换主题应保存到 localStorage', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      render(ThemeToggle);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });

      const button = screen.getByRole('switch');
      await fireEvent.click(button);

      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('多次切换应正确交替主题', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      render(ThemeToggle);

      const button = screen.getByRole('switch');

      // 切换到 dark
      await fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

      // 切换回 light
      await fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

      // 再次切换到 dark
      await fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });
  });

  describe('图标显示', () => {
    it('暗色模式时应显示太阳图标', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      const { container } = render(ThemeToggle);

      await waitFor(() => {
        const button = screen.getByRole('switch');
        expect(button).toHaveAttribute('aria-label', '切换到亮色模式');
      });

      // 暗色模式显示太阳图标（提示用户可以切换到亮色）
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('亮色模式时应显示月亮图标', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      const { container } = render(ThemeToggle);

      await waitFor(() => {
        const button = screen.getByRole('switch');
        expect(button).toHaveAttribute('aria-label', '切换到暗色模式');
      });

      // 亮色模式显示月亮图标（提示用户可以切换到暗色）
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('切换主题后图标应更新', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      render(ThemeToggle);

      const button = screen.getByRole('switch');

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', '切换到亮色模式');
      });

      await fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', '切换到暗色模式');
      });
    });
  });

  describe('aria-checked 属性', () => {
    it('暗色模式时 aria-checked 应为 true', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      render(ThemeToggle);

      await waitFor(() => {
        const button = screen.getByRole('switch');
        // 组件使用 role="switch" 和 aria-checked，而不是 aria-pressed
        expect(button).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('亮色模式时 aria-checked 应为 false', async () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');

      render(ThemeToggle);

      await waitFor(() => {
        const button = screen.getByRole('switch');
        // 组件使用 role="switch" 和 aria-checked，而不是 aria-pressed
        expect(button).toHaveAttribute('aria-checked', 'false');
      });
    });
  });
});
