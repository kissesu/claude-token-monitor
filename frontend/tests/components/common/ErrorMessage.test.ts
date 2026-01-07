/**
 * @file ErrorMessage 组件单元测试
 * @description 测试 ErrorMessage 错误消息组件的类型渲染、回调函数和事件派发
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';

describe('ErrorMessage 组件', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基础渲染', () => {
    it('应正确渲染错误消息', () => {
      render(ErrorMessage, {
        props: {
          message: '发生了一个错误'
        }
      });

      expect(screen.getByText('发生了一个错误')).toBeInTheDocument();
    });

    it('默认类型应为 error', () => {
      render(ErrorMessage, {
        props: {
          message: '错误消息'
        }
      });

      const container = screen.getByRole('alert');
      expect(container).toBeInTheDocument();
    });
  });

  describe('消息类型', () => {
    it('应渲染 error 类型样式', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误',
          type: 'error'
        }
      });

      const messageDiv = container.querySelector('.error-message');
      expect(messageDiv).toHaveClass('bg-red-50');
    });

    it('应渲染 warning 类型样式', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '警告',
          type: 'warning'
        }
      });

      const messageDiv = container.querySelector('.error-message');
      expect(messageDiv).toHaveClass('bg-yellow-50');
    });

    it('应渲染 info 类型样式', () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '提示',
          type: 'info'
        }
      });

      const messageDiv = container.querySelector('.error-message');
      expect(messageDiv).toHaveClass('bg-blue-50');
    });
  });

  describe('无障碍属性', () => {
    it('error 类型应使用 alert role', () => {
      render(ErrorMessage, {
        props: {
          message: '错误',
          type: 'error'
        }
      });

      const container = screen.getByRole('alert');
      expect(container).toHaveAttribute('aria-live', 'assertive');
    });

    it('warning 类型应使用 status role', () => {
      render(ErrorMessage, {
        props: {
          message: '警告',
          type: 'warning'
        }
      });

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('info 类型应使用 status role', () => {
      render(ErrorMessage, {
        props: {
          message: '提示',
          type: 'info'
        }
      });

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('重试按钮', () => {
    it('无 onRetry 时不渲染重试按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误'
        }
      });

      expect(screen.queryByText('重试')).not.toBeInTheDocument();
    });

    it('有 onRetry 时渲染重试按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误',
          onRetry: () => {}
        }
      });

      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('点击重试按钮应调用 onRetry 回调', async () => {
      const onRetry = vi.fn();

      render(ErrorMessage, {
        props: {
          message: '错误',
          onRetry
        }
      });

      const retryButton = screen.getByText('重试');
      await fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('关闭按钮', () => {
    it('无 onClose 时不渲染关闭按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误'
        }
      });

      expect(screen.queryByText('关闭')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('关闭消息')).not.toBeInTheDocument();
    });

    it('有 onClose 时渲染关闭按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误',
          onClose: () => {}
        }
      });

      // 应该有两个关闭按钮：一个在操作区域，一个在右上角
      expect(screen.getByText('关闭')).toBeInTheDocument();
      expect(screen.getByLabelText('关闭消息')).toBeInTheDocument();
    });

    it('点击关闭按钮应调用 onClose 回调（延迟）', async () => {
      const onClose = vi.fn();

      render(ErrorMessage, {
        props: {
          message: '错误',
          onClose
        }
      });

      const closeButton = screen.getByText('关闭');
      await fireEvent.click(closeButton);

      // 回调应在动画结束后调用（300ms）
      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(350);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('点击右上角关闭按钮也应触发关闭', async () => {
      const onClose = vi.fn();

      render(ErrorMessage, {
        props: {
          message: '错误',
          onClose
        }
      });

      const closeIconButton = screen.getByLabelText('关闭消息');
      await fireEvent.click(closeIconButton);

      vi.advanceTimersByTime(350);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('组件可见性', () => {
    it('点击关闭后组件应隐藏', async () => {
      const { container } = render(ErrorMessage, {
        props: {
          message: '错误',
          onClose: () => {}
        }
      });

      // 初始应可见
      expect(container.querySelector('.error-message')).toBeInTheDocument();

      const closeButton = screen.getByText('关闭');
      await fireEvent.click(closeButton);

      // 点击后立即隐藏
      await waitFor(() => {
        expect(container.querySelector('.error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('同时有重试和关闭', () => {
    it('应同时渲染重试和关闭按钮', () => {
      render(ErrorMessage, {
        props: {
          message: '错误',
          onRetry: () => {},
          onClose: () => {}
        }
      });

      expect(screen.getByText('重试')).toBeInTheDocument();
      expect(screen.getByText('关闭')).toBeInTheDocument();
    });
  });
});
