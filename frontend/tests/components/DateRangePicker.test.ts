/**
 * @file DateRangePicker 组件单元测试
 * @description 测试 DateRangePicker 组件的渲染和功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';

describe('DateRangePicker', () => {
  // ============================================
  // 基础渲染测试
  // ============================================

  describe('基础渲染', () => {
    it('应该渲染所有快捷选项按钮', () => {
      render(DateRangePicker);

      expect(screen.getByText('今日')).toBeInTheDocument();
      expect(screen.getByText('过去 7 天')).toBeInTheDocument();
      expect(screen.getByText('过去 30 天')).toBeInTheDocument();
      expect(screen.getByText('本月')).toBeInTheDocument();
      expect(screen.getByText('自定义')).toBeInTheDocument();
    });

    it('应该渲染开始日期和结束日期输入框', () => {
      render(DateRangePicker);

      expect(screen.getByLabelText('开始日期')).toBeInTheDocument();
      expect(screen.getByLabelText('结束日期')).toBeInTheDocument();
    });

    it('应该使用初始日期值', () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-01',
          endDate: '2026-01-07',
        },
      });

      const startInput = screen.getByLabelText('开始日期') as HTMLInputElement;
      const endInput = screen.getByLabelText('结束日期') as HTMLInputElement;

      expect(startInput.value).toBe('2026-01-01');
      expect(endInput.value).toBe('2026-01-07');
    });
  });

  // ============================================
  // 快捷选项测试
  // ============================================

  describe('快捷选项', () => {
    it('点击"今日"应该设置今天的日期', async () => {
      const { component } = render(DateRangePicker);

      const handleChange = vi.fn();
      component.$on('change', handleChange);

      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);

      expect(handleChange).toHaveBeenCalled();
      const eventData = handleChange.mock.calls[0][0].detail;
      expect(eventData.startDate).toBe(eventData.endDate);
    });

    it('点击"过去 7 天"应该设置正确的日期范围', async () => {
      const { component } = render(DateRangePicker);

      const handleChange = vi.fn();
      component.$on('change', handleChange);

      const last7DaysButton = screen.getByText('过去 7 天');
      await fireEvent.click(last7DaysButton);

      expect(handleChange).toHaveBeenCalled();
      const eventData = handleChange.mock.calls[0][0].detail;
      expect(eventData.startDate).toBeTruthy();
      expect(eventData.endDate).toBeTruthy();

      // 验证日期范围是否正确
      const start = new Date(eventData.startDate);
      const end = new Date(eventData.endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    it('点击"过去 30 天"应该设置正确的日期范围', async () => {
      const { component } = render(DateRangePicker);

      const handleChange = vi.fn();
      component.$on('change', handleChange);

      const last30DaysButton = screen.getByText('过去 30 天');
      await fireEvent.click(last30DaysButton);

      expect(handleChange).toHaveBeenCalled();
      const eventData = handleChange.mock.calls[0][0].detail;
      expect(eventData.startDate).toBeTruthy();
      expect(eventData.endDate).toBeTruthy();

      // 验证日期范围是否正确
      const start = new Date(eventData.startDate);
      const end = new Date(eventData.endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it('点击"本月"应该设置从本月第一天到今天', async () => {
      const { component } = render(DateRangePicker);

      const handleChange = vi.fn();
      component.$on('change', handleChange);

      const thisMonthButton = screen.getByText('本月');
      await fireEvent.click(thisMonthButton);

      expect(handleChange).toHaveBeenCalled();
      const eventData = handleChange.mock.calls[0][0].detail;

      // 验证开始日期是本月第一天
      const startDate = new Date(eventData.startDate);
      expect(startDate.getDate()).toBe(1);
    });

    it('选中的快捷选项应该有高亮样式', async () => {
      render(DateRangePicker);

      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);

      expect(todayButton).toHaveClass('bg-primary-500');
    });
  });

  // ============================================
  // 自定义日期输入测试
  // ============================================

  describe('自定义日期输入', () => {
    it('修改开始日期应该触发 change 事件', async () => {
      const { component } = render(DateRangePicker);

      const handleChange = vi.fn();
      component.$on('change', handleChange);

      const startInput = screen.getByLabelText('开始日期');
      await fireEvent.input(startInput, { target: { value: '2026-01-01' } });

      expect(handleChange).toHaveBeenCalled();
      const eventData = handleChange.mock.calls[0][0].detail;
      expect(eventData.startDate).toBe('2026-01-01');
    });

    it('修改结束日期应该触发 change 事件', async () => {
      const { component } = render(DateRangePicker);

      const handleChange = vi.fn();
      component.$on('change', handleChange);

      const endInput = screen.getByLabelText('结束日期');
      await fireEvent.input(endInput, { target: { value: '2026-01-07' } });

      expect(handleChange).toHaveBeenCalled();
      const eventData = handleChange.mock.calls[0][0].detail;
      expect(eventData.endDate).toBe('2026-01-07');
    });

    it('手动输入日期应该切换到自定义模式', async () => {
      render(DateRangePicker);

      // 先选择快捷选项
      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);

      // 然后手动修改日期
      const startInput = screen.getByLabelText('开始日期');
      await fireEvent.input(startInput, { target: { value: '2026-01-01' } });

      // 自定义按钮应该被选中
      const customButton = screen.getByText('自定义');
      expect(customButton).toHaveClass('bg-primary-500');
    });
  });

  // ============================================
  // 日期范围验证测试
  // ============================================

  describe('日期范围验证', () => {
    it('结束日期早于开始日期时应该显示错误提示', async () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-07',
          endDate: '2026-01-01',
        },
      });

      // 应该显示验证错误消息
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent('结束日期不能早于开始日期');
    });

    it('有效的日期范围不应该显示错误提示', () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-01',
          endDate: '2026-01-07',
        },
      });

      const errorMessage = screen.queryByRole('alert');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('开始日期等于结束日期应该是有效的', () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-07',
          endDate: '2026-01-07',
        },
      });

      const errorMessage = screen.queryByRole('alert');
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 无障碍性测试
  // ============================================

  describe('无障碍性', () => {
    it('应该有正确的 ARIA 属性', () => {
      const { container } = render(DateRangePicker);

      // 组件有多个 role="group"，选择最外层的
      const picker = container.querySelector('.date-range-picker');
      expect(picker).toHaveAttribute('aria-labelledby', 'date-range-picker-title');
    });

    it('快捷按钮应该有 aria-checked 属性（role="radio"）', async () => {
      render(DateRangePicker);

      const todayButton = screen.getByText('今日');
      await fireEvent.click(todayButton);

      // 组件使用 role="radio" 和 aria-checked，而不是 aria-pressed
      expect(todayButton).toHaveAttribute('role', 'radio');
      expect(todayButton).toHaveAttribute('aria-checked', 'true');
    });

    it('错误消息应该有 aria-live', async () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-07',
          endDate: '2026-01-01',
        },
      });

      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('输入框应该有 aria-describedby 关联错误消息', async () => {
      render(DateRangePicker, {
        props: {
          startDate: '2026-01-07',
          endDate: '2026-01-01',
        },
      });

      const startInput = screen.getByLabelText('开始日期');
      expect(startInput).toHaveAttribute('aria-describedby', 'date-range-error');
    });
  });
});
