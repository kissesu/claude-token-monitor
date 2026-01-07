/**
 * @file LoadingSpinner 组件单元测试
 * @description 测试 LoadingSpinner 组件的渲染和功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';

describe('LoadingSpinner', () => {
  // ============================================
  // 基础渲染测试
  // ============================================

  describe('基础渲染', () => {
    it('应该渲染加载指示器', () => {
      render(LoadingSpinner);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('应该有默认的无障碍文本', () => {
      render(LoadingSpinner);

      expect(screen.getByText('正在加载中，请稍候...')).toBeInTheDocument();
    });

    it('应该有正确的 ARIA 属性', () => {
      render(LoadingSpinner);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ============================================
  // 尺寸变体测试
  // ============================================

  describe('尺寸变体', () => {
    it('应该渲染小尺寸加载器', () => {
      const { container } = render(LoadingSpinner, {
        props: { size: 'sm' },
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('应该渲染中等尺寸加载器（默认）', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-10');
      expect(spinner).toHaveClass('h-10');
    });

    it('应该渲染大尺寸加载器', () => {
      const { container } = render(LoadingSpinner, {
        props: { size: 'lg' },
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-16');
      expect(spinner).toHaveClass('h-16');
    });
  });

  // ============================================
  // 自定义颜色测试
  // ============================================

  describe('自定义颜色', () => {
    it('应该使用默认颜色', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('border-primary-500');
    });

    it('应该应用自定义颜色', () => {
      const { container } = render(LoadingSpinner, {
        props: { color: '#FF5733' },
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner?.getAttribute('style')).toContain('border-top-color: #FF5733');
      expect(spinner?.getAttribute('style')).toContain('border-right-color: #FF5733');
    });

    it('自定义颜色时不应该有默认颜色类', () => {
      const { container } = render(LoadingSpinner, {
        props: { color: '#FF5733' },
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner).not.toHaveClass('border-primary-500');
    });
  });

  // ============================================
  // 加载文本测试
  // ============================================

  describe('加载文本', () => {
    it('没有文本时应该显示默认的屏幕阅读器文本', () => {
      render(LoadingSpinner);

      const srText = screen.getByText('正在加载中,请稍候...');
      expect(srText).toHaveClass('sr-only');
    });

    it('应该显示自定义文本', () => {
      render(LoadingSpinner, {
        props: { text: '正在处理数据...' },
      });

      expect(screen.getByText('正在处理数据...')).toBeInTheDocument();
    });

    it('文本尺寸应该与加载器尺寸匹配', () => {
      const { container } = render(LoadingSpinner, {
        props: {
          size: 'lg',
          text: '加载中',
        },
      });

      const text = container.querySelector('.loading-text');
      expect(text).toHaveClass('text-lg');
    });

    it('小尺寸时文本应该更小', () => {
      const { container } = render(LoadingSpinner, {
        props: {
          size: 'sm',
          text: '加载中',
        },
      });

      const text = container.querySelector('.loading-text');
      expect(text).toHaveClass('text-sm');
    });

    it('有自定义文本时不应该显示默认屏幕阅读器文本', () => {
      render(LoadingSpinner, {
        props: { text: '加载中' },
      });

      expect(screen.queryByText('正在加载中,请稍候...')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 动画测试
  // ============================================

  describe('动画', () => {
    it('加载器应该有旋转动画类', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('spinner 应该隐藏于屏幕阅读器', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ============================================
  // 样式测试
  // ============================================

  describe('样式', () => {
    it('应该有正确的布局类', () => {
      const { container } = render(LoadingSpinner);

      const spinnerContainer = container.querySelector('.loading-spinner-container');
      expect(spinnerContainer).toHaveClass('flex');
      expect(spinnerContainer).toHaveClass('flex-col');
      expect(spinnerContainer).toHaveClass('items-center');
      expect(spinnerContainer).toHaveClass('justify-center');
    });

    it('加载器应该是圆形', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('rounded-full');
    });

    it('加载器应该有边框', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('border-4');
    });
  });

  // ============================================
  // 深色模式支持测试
  // ============================================

  describe('深色模式', () => {
    it('应该有深色模式的边框颜色类', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner?.className).toContain('dark:border-surface-700');
    });

    it('文本应该支持深色模式', () => {
      const { container } = render(LoadingSpinner, {
        props: { text: '加载中' },
      });

      const text = container.querySelector('.loading-text');
      expect(text?.className).toContain('dark:text-surface-400');
    });
  });

  // ============================================
  // 组合测试
  // ============================================

  describe('组合测试', () => {
    it('应该同时支持自定义尺寸、颜色和文本', () => {
      const { container } = render(LoadingSpinner, {
        props: {
          size: 'lg',
          color: '#00FF00',
          text: '正在加载大量数据...',
        },
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-16');
      expect(spinner).toHaveClass('h-16');
      expect(spinner?.getAttribute('style')).toContain('#00FF00');
      expect(screen.getByText('正在加载大量数据...')).toBeInTheDocument();
    });

    it('应该在各种尺寸下正确显示', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      const sizeClasses = {
        sm: 'w-6',
        md: 'w-10',
        lg: 'w-16',
      };

      sizes.forEach((size) => {
        const { container } = render(LoadingSpinner, { props: { size } });
        const spinner = container.querySelector('.spinner');
        expect(spinner).toHaveClass(sizeClasses[size]);
      });
    });
  });
});
