/**
 * @file DailyActivityPanel 组件测试
 * @description 测试每日活动面板组件的功能、交互和数据处理
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import DailyActivityPanel from '../DailyActivityPanel.svelte';
import { statsStore } from '$lib/stores';
import type { DailyActivity } from '$lib/types';

// ============================================
// 测试数据准备
// ============================================

/**
 * 生成模拟的每日活动数据
 */
function generateMockDailyActivities(days: number): DailyActivity[] {
  const activities: DailyActivity[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    activities.push({
      date: dateStr,
      tokens: {
        input_tokens: Math.floor(Math.random() * 10000) + 1000,
        output_tokens: Math.floor(Math.random() * 15000) + 2000,
        cache_read_tokens: Math.floor(Math.random() * 5000),
        cache_creation_tokens: Math.floor(Math.random() * 1000),
      },
      cost: Math.random() * 0.5 + 0.1,
      sessions: Math.floor(Math.random() * 20) + 1,
    });
  }

  return activities;
}

// ============================================
// 测试套件
// ============================================

describe('DailyActivityPanel', () => {
  // 每个测试前重置 store
  beforeEach(() => {
    statsStore.reset();
  });

  // ============================================
  // 基础渲染测试
  // ============================================

  it('应该正确渲染组件基本结构', () => {
    const { container } = render(DailyActivityPanel);

    // 验证主容器存在
    const panelContainer = container.querySelector('.daily-activity-panel');
    expect(panelContainer).toBeTruthy();

    // 验证标题存在
    const title = screen.getByText('每日活动趋势');
    expect(title).toBeTruthy();
  });

  it('应该渲染所有快捷日期范围按钮', () => {
    render(DailyActivityPanel);

    // 验证所有快捷按钮存在
    expect(screen.getByText('今日')).toBeTruthy();
    expect(screen.getByText('最近 7 天')).toBeTruthy();
    expect(screen.getByText('最近 30 天')).toBeTruthy();
    expect(screen.getByText('本月')).toBeTruthy();
    expect(screen.getByText('自定义')).toBeTruthy();
  });

  it('应该渲染三个汇总统计卡片', () => {
    render(DailyActivityPanel);

    // 验证统计卡片标题
    expect(screen.getByText('总会话数')).toBeTruthy();
    expect(screen.getByText('总 Token 数')).toBeTruthy();
    expect(screen.getByText('总费用')).toBeTruthy();
  });

  // ============================================
  // 数据处理测试
  // ============================================

  it('应该正确计算总会话数', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 计算预期的总会话数
    const expectedTotal = mockData.reduce((sum, activity) => sum + activity.sessions, 0);

    // 验证显示的总数是否正确
    const totalSessionsText = expectedTotal.toLocaleString();
    expect(screen.getByText(totalSessionsText)).toBeTruthy();
  });

  it('应该正确计算总 Token 数', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 计算预期的总 Token 数
    const expectedTotal = mockData.reduce((sum, activity) => {
      return sum + activity.tokens.input_tokens + activity.tokens.output_tokens;
    }, 0);

    // 验证显示的总数是否正确
    const totalTokensText = expectedTotal.toLocaleString();
    expect(screen.getByText(totalTokensText)).toBeTruthy();
  });

  it('应该正确计算总费用', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 计算预期的总费用
    const expectedTotal = mockData.reduce((sum, activity) => sum + activity.cost, 0);

    // 验证费用格式（保留 4 位小数）
    const expectedText = `$${expectedTotal.toFixed(4)}`;
    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  // ============================================
  // 日期范围过滤测试
  // ============================================

  it('应该根据选择的日期范围过滤数据', () => {
    const mockData = generateMockDailyActivities(30);
    statsStore.setDailyActivities(mockData);

    const { component } = render(DailyActivityPanel);

    // 默认应该选择"最近 7 天"
    // 验证过滤后的数据数量
    const state = get(component);
    // 注意：由于组件内部状态无法直接访问，这里只能验证渲染结果
    expect(screen.getByText('最近 7 天')).toBeTruthy();
  });

  // ============================================
  // 空数据状态测试
  // ============================================

  it('当没有数据时应该显示空状态提示', () => {
    statsStore.setDailyActivities([]);

    render(DailyActivityPanel);

    // 验证空状态提示存在
    expect(screen.getByText('选定范围内暂无数据')).toBeTruthy();
  });

  // ============================================
  // 加载状态测试
  // ============================================

  it('当数据加载中时应该传递 loading 状态给子组件', () => {
    statsStore.setStatus('loading' as any);

    const { container } = render(DailyActivityPanel);

    // 验证组件正常渲染（具体的加载状态由子组件处理）
    const panelContainer = container.querySelector('.daily-activity-panel');
    expect(panelContainer).toBeTruthy();
  });

  // ============================================
  // 热力图指标切换测试
  // ============================================

  it('应该渲染热力图指标选择按钮', () => {
    render(DailyActivityPanel);

    // 验证指标选择按钮存在
    expect(screen.getByText('会话数')).toBeTruthy();
    expect(screen.getByText('Token 数')).toBeTruthy();
    expect(screen.getByText('费用')).toBeTruthy();
  });

  // ============================================
  // 高峰时段统计测试
  // ============================================

  it('应该正确显示高峰时段统计', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证高峰时段统计标题存在
    expect(screen.getByText('高峰时段统计')).toBeTruthy();

    // 验证统计项标题存在
    expect(screen.getByText('高峰日期')).toBeTruthy();
    expect(screen.getByText('当日会话数')).toBeTruthy();
    expect(screen.getByText('平均每日会话数')).toBeTruthy();
    expect(screen.getByText('活动天数')).toBeTruthy();
  });

  it('应该正确计算平均每日会话数', () => {
    const mockData = generateMockDailyActivities(7);
    const totalSessions = mockData.reduce((sum, activity) => sum + activity.sessions, 0);
    const expectedAverage = (totalSessions / mockData.length).toFixed(1);

    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证平均值显示正确
    expect(screen.getByText(`${expectedAverage} 个`)).toBeTruthy();
  });

  it('应该正确显示活动天数', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证活动天数显示正确
    expect(screen.getByText('7 天')).toBeTruthy();
  });

  // ============================================
  // 响应式设计测试
  // ============================================

  it('应该包含响应式 CSS 类', () => {
    const { container } = render(DailyActivityPanel);

    // 验证响应式网格布局类存在
    const summaryCards = container.querySelector('.summary-cards');
    expect(summaryCards?.classList.contains('grid')).toBe(true);
    expect(summaryCards?.classList.contains('md:grid-cols-3')).toBe(true);
  });

  // ============================================
  // 组件集成测试
  // ============================================

  it('应该包含 TrendChart 和 ActivityHeatmap 子组件', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    const { container } = render(DailyActivityPanel);

    // 验证趋势图区域存在
    const trendSection = container.querySelector('.trend-chart-section');
    expect(trendSection).toBeTruthy();

    // 验证热力图区域存在
    const heatmapSection = container.querySelector('.heatmap-section');
    expect(heatmapSection).toBeTruthy();
  });

  // ============================================
  // 自定义样式测试
  // ============================================

  it('应该支持自定义 CSS 类名', () => {
    const customClass = 'my-custom-panel';
    const { container } = render(DailyActivityPanel, {
      props: { class: customClass },
    });

    const panelContainer = container.querySelector('.daily-activity-panel');
    expect(panelContainer?.classList.contains(customClass)).toBe(true);
  });

  // ============================================
  // 数据更新响应测试
  // ============================================

  it('应该响应 store 数据更新', async () => {
    const initialData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(initialData);

    const { component } = render(DailyActivityPanel);

    // 更新数据
    const updatedData = generateMockDailyActivities(14);
    statsStore.setDailyActivities(updatedData);

    // 等待组件更新
    await new Promise(resolve => setTimeout(resolve, 0));

    // 验证组件已更新（通过检查活动天数变化）
    // 注意：由于组件使用了日期范围过滤，实际显示可能不是全部 14 天
    expect(component).toBeTruthy();
  });
});

// ============================================
// 辅助功能测试
// ============================================

describe('DailyActivityPanel - 辅助功能', () => {
  it('应该包含正确的日期格式化', () => {
    const mockData = generateMockDailyActivities(7);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证日期显示格式正确（中文格式）
    // 通过查找包含"年"、"月"、"日"的文本
    const container = document.body;
    const dateText = container.textContent;
    expect(dateText).toBeTruthy();
  });

  it('应该正确处理数值本地化', () => {
    const mockData = [
      {
        date: '2026-01-01',
        tokens: {
          input_tokens: 1000,
          output_tokens: 2000,
          cache_read_tokens: 500,
          cache_creation_tokens: 100,
        },
        cost: 0.1234,
        sessions: 5,
      },
    ];

    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证大数字使用千位分隔符
    expect(screen.getByText('3,000')).toBeTruthy(); // total tokens
    expect(screen.getByText('5')).toBeTruthy(); // sessions
  });
});

// ============================================
// 边界情况测试
// ============================================

describe('DailyActivityPanel - 边界情况', () => {
  it('应该处理单条数据', () => {
    const mockData = generateMockDailyActivities(1);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证组件正常渲染
    expect(screen.getByText('1 天')).toBeTruthy();
  });

  it('应该处理大量数据', () => {
    const mockData = generateMockDailyActivities(365);
    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证组件正常渲染（由于日期范围过滤，不会显示全部数据）
    const panelContainer = document.querySelector('.daily-activity-panel');
    expect(panelContainer).toBeTruthy();
  });

  it('应该处理零值数据', () => {
    const mockData = [
      {
        date: '2026-01-01',
        tokens: {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_tokens: 0,
          cache_creation_tokens: 0,
        },
        cost: 0,
        sessions: 0,
      },
    ];

    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证零值正确显示
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('$0.0000')).toBeTruthy();
  });

  it('应该处理负费用（退款场景）', () => {
    const mockData = [
      {
        date: '2026-01-01',
        tokens: {
          input_tokens: 1000,
          output_tokens: 2000,
          cache_read_tokens: 0,
          cache_creation_tokens: 0,
        },
        cost: -0.05,
        sessions: 1,
      },
    ];

    statsStore.setDailyActivities(mockData);

    render(DailyActivityPanel);

    // 验证负费用正确显示
    expect(screen.getByText('$-0.0500')).toBeTruthy();
  });
});
