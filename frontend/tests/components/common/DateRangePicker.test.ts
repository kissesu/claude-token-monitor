/**
 * @file DateRangePicker 组件单元测试
 * @description 测试 DateRangePicker 日期范围选择器的快捷选项、日期输入和验证功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';

describe('DateRangePicker 组件', () => {
  // 固定当前日期以确保测试可重复
  const mockDate = new Date('2026-01-07');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基础渲染', () => {
    it('应正确渲染组件结构', () => {
      render(DateRangePicker);

      expect(screen.getByText('快捷选择')).toBeInTheDocument();
      expect(screen.getByText('开始日期')).toBeInTheDocument();
      expect(screen.getByText('结束日期')).toBeInTheDocument();
    });

    it('应渲染所有快捷选项按钮', () => {
      render(DateRangePicker);

      expect(screen.getByText('今日')).toBeInTheDocument();
      expect(screen.getByText('过去 7 天')).toBeInTheDocument();
      expect(screen.getByText('过去 30 天')).toBeInTheDocument();
      expect(screen.getByText('本月')).toBeInTheDocument();
      expect(screen.getByText('自定义')).toBeInTheDocument();
    });

    it('应正确设置无障碍属性', () => {
      render(DateRangePicker);

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-label', '日期范围预设选项');
    });
  });

  describe('快捷选项', () => {
    it('点击"今日"应设置开始和结束日期为今天', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      // 监听 change 事件
      component.$on('change', handleChange);

      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            startDate: '2026-01-07',
            endDate: '2026-01-07'
          }
        })
      );
    });

    it('点击"过去 7 天"应设置正确的日期范围', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      component.$on('change', handleChange);

      const last7DaysButton = screen.getByText('过去 7 天');
      await fireEvent.click(last7DaysButton);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            startDate: '2025-12-31', // 7 天前
            endDate: '2026-01-07'
          }
        })
      );
    });

    it('点击"过去 30 天"应设置正确的日期范围', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      component.$on('change', handleChange);

      const last30DaysButton = screen.getByText('过去 30 天');
      await fireEvent.click(last30DaysButton);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            startDate: '2025-12-08', // 30 天前
            endDate: '2026-01-07'
          }
        })
      );
    });

    it('点击"本月"应设置本月第一天到今天', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      component.$on('change', handleChange);

      const thisMonthButton = screen.getByText('本月');
      await fireEvent.click(thisMonthButton);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            startDate: '2026-01-01',
            endDate: '2026-01-07'
          }
        })
      );
    });

    it('点击"自定义"不应触发 change 事件', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      component.$on('change', handleChange);

      const customButton = screen.getByText('自定义');
      await fireEvent.click(customButton);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('选中的快捷选项应有高亮样式', async () => {
      render(DateRangePicker);

      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);

      expect(todayButton).toHaveClass('bg-primary-500');
      expect(todayButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('日期输入', () => {
    it('应正确使用初始日期值', () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-01',
          endDate: '2026-01-07'
        }
      });

      const startInput = screen.getByLabelText('开始日期') as HTMLInputElement;
      const endInput = screen.getByLabelText('结束日期') as HTMLInputElement;

      expect(startInput.value).toBe('2026-01-01');
      expect(endInput.value).toBe('2026-01-07');
    });

    it('修改开始日期应触发 change 事件', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      component.$on('change', handleChange);

      const startInput = screen.getByLabelText('开始日期');
      await fireEvent.input(startInput, { target: { value: '2026-01-05' } });

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            startDate: '2026-01-05'
          })
        })
      );
    });

    it('修改结束日期应触发 change 事件', async () => {
      const handleChange = vi.fn();
      const { component } = render(DateRangePicker);

      component.$on('change', handleChange);

      const endInput = screen.getByLabelText('结束日期');
      await fireEvent.input(endInput, { target: { value: '2026-01-10' } });

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            endDate: '2026-01-10'
          })
        })
      );
    });

    it('手动输入日期应切换到自定义模式', async () => {
      render(DateRangePicker);

      // 先点击今日
      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);
      expect(todayButton).toHaveAttribute('aria-pressed', 'true');

      // 手动修改日期
      const startInput = screen.getByLabelText('开始日期');
      await fireEvent.input(startInput, { target: { value: '2026-01-01' } });

      // 今日按钮应取消选中，自定义按钮应选中
      expect(todayButton).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('自定义')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('日期验证', () => {
    it('有效日期范围不应显示错误提示', async () => {
      render(DateRangePicker);

      const startInput = screen.getByLabelText('开始日期');
      const endInput = screen.getByLabelText('结束日期');

      await fireEvent.input(startInput, { target: { value: '2026-01-01' } });
      await fireEvent.input(endInput, { target: { value: '2026-01-07' } });

      expect(screen.queryByText('结束日期不能早于开始日期')).not.toBeInTheDocument();
    });

    it('无效日期范围应显示错误提示', async () => {
      render(DateRangePicker);

      const startInput = screen.getByLabelText('开始日期');
      const endInput = screen.getByLabelText('结束日期');

      await fireEvent.input(startInput, { target: { value: '2026-01-10' } });
      await fireEvent.input(endInput, { target: { value: '2026-01-05' } });

      expect(screen.getByText('结束日期不能早于开始日期')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('错误提示应有正确的无障碍属性', async () => {
      render(DateRangePicker);

      const startInput = screen.getByLabelText('开始日期');
      const endInput = screen.getByLabelText('结束日期');

      await fireEvent.input(startInput, { target: { value: '2026-01-10' } });
      await fireEvent.input(endInput, { target: { value: '2026-01-05' } });

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('同一天日期', () => {
    it('开始和结束日期相同应为有效范围', async () => {
      render(DateRangePicker);

      const startInput = screen.getByLabelText('开始日期');
      const endInput = screen.getByLabelText('结束日期');

      await fireEvent.input(startInput, { target: { value: '2026-01-07' } });
      await fireEvent.input(endInput, { target: { value: '2026-01-07' } });

      expect(screen.queryByText('结束日期不能早于开始日期')).not.toBeInTheDocument();
    });
  });
});
