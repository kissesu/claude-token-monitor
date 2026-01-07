/**
 * @file LoadingSpinner 组件单元测试
 * @description 测试 LoadingSpinner 加载指示器组件的不同尺寸、颜色和文本渲染
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';

describe('LoadingSpinner 组件', () => {
  describe('基础渲染', () => {
    it('应正确渲染默认状态', () => {
      render(LoadingSpinner);

      // 应有 status role
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();

      // 默认应显示屏幕阅读器可见的加载提示
      expect(screen.getByText('正在加载中，请稍候...')).toBeInTheDocument();
    });

    it('应正确设置无障碍属性', () => {
      render(LoadingSpinner);

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-busy', 'true');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('尺寸属性', () => {
    it('应渲染小尺寸 (sm)', () => {
      const { container } = render(LoadingSpinner, {
        props: { size: 'sm' }
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('应渲染中等尺寸 (md) 作为默认值', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-10', 'h-10');
    });

    it('应渲染大尺寸 (lg)', () => {
      const { container } = render(LoadingSpinner, {
        props: { size: 'lg' }
      });

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('w-16', 'h-16');
    });
  });

  describe('颜色属性', () => {
    it('应使用默认主题颜色', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('border-primary-500');
    });

    it('应应用自定义颜色', () => {
      const { container } = render(LoadingSpinner, {
        props: { color: '#ff5500' }
      });

      const spinner = container.querySelector('.spinner');
      // 自定义颜色时不应用默认颜色类
      expect(spinner).not.toHaveClass('border-primary-500');
      // 应有内联样式
      expect(spinner?.getAttribute('style')).toContain('border-top-color: #ff5500');
    });
  });

  describe('文本属性', () => {
    it('无文本时应显示屏幕阅读器提示', () => {
      render(LoadingSpinner);

      const srText = screen.getByText('正在加载中，请稍候...');
      expect(srText).toHaveClass('sr-only');
    });

    it('有文本时应显示加载文本', () => {
      render(LoadingSpinner, {
        props: { text: '加载中...' }
      });

      expect(screen.getByText('加载中...')).toBeInTheDocument();
      // 有自定义文本时不显示 sr-only 提示
      expect(screen.queryByText('正在加载中，请稍候...')).not.toBeInTheDocument();
    });

    it('文本尺寸应与 spinner 尺寸匹配', () => {
      const { container: containerSm } = render(LoadingSpinner, {
        props: { size: 'sm', text: '小' }
      });
      expect(containerSm.querySelector('.loading-text')).toHaveClass('text-sm');

      const { container: containerMd } = render(LoadingSpinner, {
        props: { size: 'md', text: '中' }
      });
      expect(containerMd.querySelector('.loading-text')).toHaveClass('text-base');

      const { container: containerLg } = render(LoadingSpinner, {
        props: { size: 'lg', text: '大' }
      });
      expect(containerLg.querySelector('.loading-text')).toHaveClass('text-lg');
    });
  });

  describe('动画', () => {
    it('spinner 应有旋转动画类', () => {
      const { container } = render(LoadingSpinner);

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
