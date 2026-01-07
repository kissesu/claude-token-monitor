/**
 * @file StatCard 组件单元测试
 * @description 测试 StatCard 组件的渲染和功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatCard from '$lib/components/common/StatCard.svelte';

describe('StatCard', () => {
  // ============================================
  // 基础渲染测试
  // ============================================

  describe('基础渲染', () => {
    it('应该渲染标题和数值', () => {
      render(StatCard, {
        props: {
          title: '总 Tokens',
          value: 1000,
        },
      });

      expect(screen.getByText('总 Tokens')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('应该渲染字符串类型的数值', () => {
      render(StatCard, {
        props: {
          title: '模型',
          value: 'Claude Opus',
        },
      });

      expect(screen.getByText('Claude Opus')).toBeInTheDocument();
    });

    it('应该渲染单位', () => {
      render(StatCard, {
        props: {
          title: '总费用',
          value: 0.05,
          unit: 'USD',
        },
      });

      expect(screen.getByText('USD')).toBeInTheDocument();
    });
  });

  // ============================================
  // 图标测试
  // ============================================

  describe('图标', () => {
    it('应该渲染 Font Awesome 图标', () => {
      const { container } = render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
          icon: 'fa-chart-line',
        },
      });

      const icon = container.querySelector('.fa-chart-line');
      expect(icon).toBeInTheDocument();
    });

    it('没有图标时不应该渲染图标元素', () => {
      const { container } = render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
        },
      });

      const iconWrapper = container.querySelector('.icon-wrapper');
      expect(iconWrapper).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 趋势指示器测试
  // ============================================

  describe('趋势指示器', () => {
    it('应该渲染上升趋势', () => {
      render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
          trend: 'up',
          trendValue: '+10%',
        },
      });

      expect(screen.getByText('+10%')).toBeInTheDocument();
      expect(screen.getByLabelText(/上升/)).toBeInTheDocument();
    });

    it('应该渲染下降趋势', () => {
      render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
          trend: 'down',
          trendValue: '-5%',
        },
      });

      expect(screen.getByText('-5%')).toBeInTheDocument();
      expect(screen.getByLabelText(/下降/)).toBeInTheDocument();
    });

    it('没有趋势时不应该渲染趋势指示器', () => {
      const { container } = render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
        },
      });

      const trendIndicator = container.querySelector('.trend-indicator');
      expect(trendIndicator).not.toBeInTheDocument();
    });
  });

  // ============================================
  // 数值格式化测试
  // ============================================

  describe('数值格式化', () => {
    it('应该正确格式化大数字', () => {
      render(StatCard, {
        props: {
          title: '大数字',
          value: 1234567,
        },
      });

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('应该处理小数', () => {
      render(StatCard, {
        props: {
          title: '小数',
          value: 123.45,
        },
      });

      // 组件会四舍五入到整数
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('应该处理零值', () => {
      render(StatCard, {
        props: {
          title: '零值',
          value: 0,
        },
      });

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('应该处理负数', () => {
      render(StatCard, {
        props: {
          title: '负数',
          value: -100,
        },
      });

      expect(screen.getByText('-100')).toBeInTheDocument();
    });
  });

  // ============================================
  // 无障碍性测试
  // ============================================

  describe('无障碍性', () => {
    it('应该有正确的 ARIA 属性', () => {
      render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
        },
      });

      // 组件使用 role="article" 而不是 role="region"
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', '测试卡片统计卡片');
    });

    it('趋势指示器应该有状态角色', () => {
      render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
          trend: 'up',
          trendValue: '+10%',
        },
      });

      const trendElement = screen.getByLabelText(/上升/);
      expect(trendElement).toHaveAttribute('role', 'status');
    });
  });

  // ============================================
  // 样式和交互测试
  // ============================================

  describe('样式和交互', () => {
    it('卡片应该有正确的 CSS 类', () => {
      const { container } = render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
        },
      });

      const card = container.querySelector('.stat-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('stat-card');
    });

    it('应该有悬停效果类', () => {
      const { container } = render(StatCard, {
        props: {
          title: '测试卡片',
          value: 100,
        },
      });

      const card = container.querySelector('.stat-card');
      expect(card).toHaveClass('hover:shadow-lg');
    });
  });

  // ============================================
  // 边界情况测试
  // ============================================

  describe('边界情况', () => {
    it('应该处理空字符串', () => {
      render(StatCard, {
        props: {
          title: '空字符串',
          value: '',
        },
      });

      // 空字符串应该正常渲染
      expect(screen.getByText('空字符串')).toBeInTheDocument();
    });

    it('应该处理非常长的文本', () => {
      const longText = 'A'.repeat(100);
      render(StatCard, {
        props: {
          title: '长文本',
          value: longText,
        },
      });

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('应该同时显示趋势和单位', () => {
      render(StatCard, {
        props: {
          title: '完整卡片',
          value: 100,
          unit: 'tokens',
          trend: 'up',
          trendValue: '+10%',
        },
      });

      expect(screen.getByText('tokens')).toBeInTheDocument();
      expect(screen.getByText('+10%')).toBeInTheDocument();
    });
  });
});
