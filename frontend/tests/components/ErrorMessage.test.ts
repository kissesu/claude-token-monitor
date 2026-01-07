/**
 * @file ErrorMessage 组件单元测试
 * @description 测试 ErrorMessage 组件的渲染和功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';

describe('ErrorMessage', () => {
  // ============================================
  // 基础渲染测试
  // ============================================

  describe('基础渲染', () => {
    it('应该渲染错误消息', () => {
      render(ErrorMessage, {
        props: {
          message: '这是一条错误消息',
          type: 'error',
        },
      });

      expect(screen.getByText('这是一条错误消息')).toBeInTheDocument();
    });

    it('应该有正确的 ARIA 属性', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('应该显示图标', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ============================================
  // 消息类型测试
  // ============================================

  describe('消息类型', () => {
    it('error 类型应该有正确的样式', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      const errorContainer = container.querySelector('.error-message');
      expect(errorContainer?.className).toContain('bg-red-50');
      expect(errorContainer?.className).toContain('border-red-200');
    });

    it('warning 类型应该有正确的样式', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '警告消息',
          type: 'warning',
        },
      });

      const warningContainer = container.querySelector('.error-message');
      expect(warningContainer?.className).toContain('bg-yellow-50');
      expect(warningContainer?.className).toContain('border-yellow-200');
    });

    it('info 类型应该有正确的样式', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '信息消息',
          type: 'info',
        },
      });

      const infoContainer = container.querySelector('.error-message');
      expect(infoContainer?.className).toContain('bg-blue-50');
      expect(infoContainer?.className).toContain('border-blue-200');
    });

    it('error 类型应该使用 alert role', () => {
      render(ErrorMessage, {
        props: {
          message: '错误',
          type: 'error',
        },
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('warning 和 info 类型应该使用 status role', () => {
      const { rerender } = render(ErrorMessage, {
        props: {
          message: '警告',
          type: 'warning',
        },
      });

      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender({
        message: '信息',
        type: 'info',
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // ============================================
  // 重试功能测试
  // ============================================

  describe('重试功能', () => {
    it('有 onRetry 回调时应该显示重试按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onRetry: vi.fn(),
        },
      });

      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('没有 onRetry 回调时不应该显示重试按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      expect(screen.queryByText('重试')).not.toBeInTheDocument();
    });

    it('点击重试按钮应该调用 onRetry 回调', async () => {
      const onRetry = vi.fn();

      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onRetry,
        },
      });

      const retryButton = screen.getByText('重试');
      await fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('点击重试按钮应该派发 retry 事件', async () => {
      const { component } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onRetry: vi.fn(),
        },
      });

      const retryHandler = vi.fn();
      component.$on('retry', retryHandler);

      const retryButton = screen.getByText('重试');
      await fireEvent.click(retryButton);

      expect(retryHandler).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // 关闭功能测试
  // ============================================

  describe('关闭功能', () => {
    it('有 onClose 回调时应该显示关闭按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onClose: vi.fn(),
        },
      });

      // 应该有两个关闭按钮：操作区的"关闭"文字按钮和右上角的 X 按钮
      const closeButtons = screen.getAllByRole('button', { name: /关闭/i });
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('没有 onClose 回调时不应该显示关闭按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      expect(screen.queryByText('关闭')).not.toBeInTheDocument();
    });

    it('点击关闭按钮应该隐藏消息', async () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onClose: vi.fn(),
        },
      });

      const closeButton = screen.getByLabelText('关闭消息');
      await fireEvent.click(closeButton);

      // 消息应该立即隐藏
      expect(container.querySelector('.error-message')).not.toBeInTheDocument();
    });

    it('点击关闭按钮应该在动画后调用 onClose 回调', async () => {
      vi.useFakeTimers();

      const onClose = vi.fn();

      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onClose,
        },
      });

      const closeButton = screen.getByLabelText('关闭消息');
      await fireEvent.click(closeButton);

      // onClose 应该在 300ms 后被调用
      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(onClose).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('点击关闭按钮应该派发 close 事件', async () => {
      vi.useFakeTimers();

      const { component } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onClose: vi.fn(),
        },
      });

      const closeHandler = vi.fn();
      component.$on('close', closeHandler);

      const closeButton = screen.getByLabelText('关闭消息');
      await fireEvent.click(closeButton);

      // close 事件应该在 300ms 后被派发
      vi.advanceTimersByTime(300);

      expect(closeHandler).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  // ============================================
  // 可见性测试
  // ============================================

  describe('可见性', () => {
    it('初始时应该可见', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      expect(container.querySelector('.error-message')).toBeInTheDocument();
    });

    it('关闭后应该不可见', async () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onClose: vi.fn(),
        },
      });

      const closeButton = screen.getByLabelText('关闭消息');
      await fireEvent.click(closeButton);

      expect(container.querySelector('.error-message')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 深色模式支持测试
  // ============================================

  describe('深色模式', () => {
    it('应该有深色模式样式类', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      const errorContainer = container.querySelector('.error-message');
      expect(errorContainer?.className).toContain('dark:bg-red-900/20');
      expect(errorContainer?.className).toContain('dark:border-red-800');
    });
  });

  // ============================================
  // 布局和样式测试
  // ============================================

  describe('布局和样式', () => {
    it('应该有正确的布局类', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
        },
      });

      const errorContainer = container.querySelector('.error-message');
      expect(errorContainer).toHaveClass('border');
      expect(errorContainer).toHaveClass('rounded-lg');
      expect(errorContainer).toHaveClass('p-4');
      expect(errorContainer).toHaveClass('shadow-md');
    });

    it('消息文本应该可以换行', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '这是一条非常长的错误消息，应该能够正确换行显示',
          type: 'error',
        },
      });

      const messageText = container.querySelector('p');
      expect(messageText).toHaveClass('break-words');
    });
  });

  // ============================================
  // 组合测试
  // ============================================

  describe('组合测试', () => {
    it('应该同时支持重试和关闭按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息',
          type: 'error',
          onRetry: vi.fn(),
          onClose: vi.fn(),
        },
      });

      expect(screen.getByText('重试')).toBeInTheDocument();
      expect(screen.getByLabelText('关闭消息')).toBeInTheDocument();
    });

    it('应该为长消息提供良好的布局', () => {
      const longMessage =
        '这是一条非常长的错误消息。它包含了很多详细信息来描述发生了什么问题。这条消息应该能够正确地换行并保持良好的可读性。';

      render(ErrorMessage, {
        props: {
          message: longMessage,
          type: 'error',
          onRetry: vi.fn(),
          onClose: vi.fn(),
        },
      });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('不同类型应该有不同的视觉样式', () => {
      const types: Array<'error' | 'warning' | 'info'> = ['error', 'warning', 'info'];
      const bgClasses = {
        error: 'bg-red-50',
        warning: 'bg-yellow-50',
        info: 'bg-blue-50',
      };

      types.forEach((type) => {
        const { container } = render(ErrorMessage, {
          props: {
            message: `${type} 消息`,
            type,
          },
        });

        const errorContainer = container.querySelector('.error-message');
        expect(errorContainer?.className).toContain(bgClasses[type]);
      });
    });
  });
});
