/**
 * @file StatCard 组件单元测试
 * @description 测试 StatCard 统计卡片组件的渲染、数值动画、趋势指示器功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import StatCard from '$lib/components/common/StatCard.svelte';

describe('StatCard 组件', () => {
  // 在每个测试前推进定时器
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基础渲染', () => {
    it('应正确渲染标题', () => {
      render(StatCard, {
        props: {
          title: '总 Token 数',
          value: 1000
        }
      });

      expect(screen.getByText('总 Token 数')).toBeInTheDocument();
    });

    it('应正确渲染字符串类型的数值', () => {
      render(StatCard, {
        props: {
          title: '状态',
          value: '在线'
        }
      });

      expect(screen.getByText('在线')).toBeInTheDocument();
    });

    it('应正确渲染单位', () => {
      render(StatCard, {
        props: {
          title: '费用',
          value: 10.5,
          unit: 'USD'
        }
      });

      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('应正确设置无障碍属性', () => {
      render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100
        }
      });

      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', '测试卡片统计卡片');
    });
  });

  describe('图标渲染', () => {
    it('应渲染 Font Awesome 图标', () => {
      const { container } = render(StatCard, {
        props: {
          title: '统计',
          value: 100,
          icon: 'fa-chart-bar'
        }
      });

      const iconElement = container.querySelector('i.fas.fa-chart-bar');
      expect(iconElement).toBeInTheDocument();
    });

    it('应渲染自定义 SVG 图标', () => {
      const svgIcon = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>';
      const { container } = render(StatCard, {
        props: {
          title: '统计',
          value: 100,
          icon: svgIcon
        }
      });

      // SVG 应该被渲染
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('无图标时不渲染图标容器', () => {
      const { container } = render(StatCard, {
        props: {
          title: '统计',
          value: 100
        }
      });

      const iconWrapper = container.querySelector('.icon-wrapper');
      expect(iconWrapper).toBeNull();
    });
  });

  describe('数值动画', () => {
    it('数字类型值应从 0 动画到目标值', async () => {
      render(StatCard, {
        props: {
          title: '测试',
          value: 1000
        }
      });

      // 初始显示应为 0
      expect(screen.getByText('0')).toBeInTheDocument();

      // 推进时间以完成动画
      vi.advanceTimersByTime(1100);

      // 等待 DOM 更新
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });
    });

    it('字符串值不应有动画效果', () => {
      render(StatCard, {
        props: {
          title: '状态',
          value: '运行中'
        }
      });

      // 字符串值应立即显示
      expect(screen.getByText('运行中')).toBeInTheDocument();
    });
  });

  describe('趋势指示器', () => {
    it('应渲染上升趋势指示器', () => {
      render(StatCard, {
        props: {
          title: '增长',
          value: 100,
          trend: 'up',
          trendValue: '+15%'
        }
      });

      // 推进动画时间
      vi.advanceTimersByTime(1100);

      // 验证趋势值显示
      expect(screen.getByText('+15%')).toBeInTheDocument();

      // 验证趋势指示器的无障碍属性
      const trendIndicator = screen.getByRole('status');
      expect(trendIndicator).toHaveAttribute('aria-label', '上升 +15%');
    });

    it('应渲染下降趋势指示器', () => {
      render(StatCard, {
        props: {
          title: '下降',
          value: 100,
          trend: 'down',
          trendValue: '-10%'
        }
      });

      vi.advanceTimersByTime(1100);

      expect(screen.getByText('-10%')).toBeInTheDocument();

      const trendIndicator = screen.getByRole('status');
      expect(trendIndicator).toHaveAttribute('aria-label', '下降 -10%');
    });

    it('缺少趋势方向时不渲染指示器', () => {
      render(StatCard, {
        props: {
          title: '测试',
          value: 100,
          trendValue: '+5%'
        }
      });

      expect(screen.queryByText('+5%')).not.toBeInTheDocument();
    });

    it('缺少趋势值时不渲染指示器', () => {
      render(StatCard, {
        props: {
          title: '测试',
          value: 100,
          trend: 'up'
        }
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('数值格式化', () => {
    it('应正确格式化大数字（千分位）', async () => {
      render(StatCard, {
        props: {
          title: '大数值',
          value: 1234567
        }
      });

      vi.advanceTimersByTime(1100);

      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
      });
    });

    it('应正确处理零值', async () => {
      render(StatCard, {
        props: {
          title: '零值',
          value: 0
        }
      });

      // 零值应直接显示
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
