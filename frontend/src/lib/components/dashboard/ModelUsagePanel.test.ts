/**
 * @file ModelUsagePanel 组件测试
 * @description 测试模型使用面板的基本功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { statsStore } from '$lib/stores';
import type { StatsCache } from '$lib/types';
import ModelUsagePanel from '$lib/components/dashboard/ModelUsagePanel.svelte';

describe('ModelUsagePanel', () => {
  // ============================================
  // 测试前准备
  // 设置模拟数据
  // ============================================
  beforeEach(() => {
    const mockData: StatsCache = {
      total_tokens: 150000,
      total_cost: 0.5,
      updated_at: new Date().toISOString(),
      models: {
        'claude-opus-4': {
          name: 'claude-opus-4',
          tokens: {
            input_tokens: 50000,
            output_tokens: 20000,
            cache_read_tokens: 10000,
            cache_creation_tokens: 5000,
          },
          cost: 0.3,
          percentage: 56.67,
        },
        'claude-sonnet-3.5': {
          name: 'claude-sonnet-3.5',
          tokens: {
            input_tokens: 30000,
            output_tokens: 15000,
            cache_read_tokens: 5000,
            cache_creation_tokens: 2000,
          },
          cost: 0.15,
          percentage: 34.67,
        },
        'claude-haiku-3': {
          name: 'claude-haiku-3',
          tokens: {
            input_tokens: 8000,
            output_tokens: 4000,
            cache_read_tokens: 1000,
            cache_creation_tokens: 0,
          },
          cost: 0.05,
          percentage: 8.67,
        },
      },
    };

    statsStore.setCurrent(mockData);
  });

  // ============================================
  // 测试用例：组件渲染
  // ============================================
  it('应该正确渲染组件标题', () => {
    render(ModelUsagePanel);
    expect(screen.getByText('模型用量统计')).toBeTruthy();
  });

  it('应该显示模型筛选下拉框', () => {
    render(ModelUsagePanel);
    const filterSelect = screen.getByLabelText('筛选模型') as HTMLSelectElement;
    expect(filterSelect).toBeTruthy();
  });

  it('应该显示排序方式下拉框', () => {
    render(ModelUsagePanel);
    const sortSelect = screen.getByLabelText('排序方式') as HTMLSelectElement;
    expect(sortSelect).toBeTruthy();
  });

  // ============================================
  // 测试用例：数据表格
  // ============================================
  it('应该渲染所有模型的数据行', () => {
    render(ModelUsagePanel);

    // 检查是否显示了三个模型
    expect(screen.getByText('claude-opus-4')).toBeTruthy();
    expect(screen.getByText('claude-sonnet-3.5')).toBeTruthy();
    expect(screen.getByText('claude-haiku-3')).toBeTruthy();
  });

  it('应该正确显示合计行', () => {
    render(ModelUsagePanel);
    expect(screen.getByText('合计')).toBeTruthy();
  });

  // ============================================
  // 测试用例：Props 属性
  // ============================================
  it('应该支持隐藏图表', () => {
    const { container } = render(ModelUsagePanel, {
      props: {
        showChart: false,
      },
    });

    const chartSection = container.querySelector('.chart-section');
    expect(chartSection).toBeFalsy();
  });

  it('应该支持隐藏表格', () => {
    const { container } = render(ModelUsagePanel, {
      props: {
        showTable: false,
      },
    });

    const tableSection = container.querySelector('.table-section');
    expect(tableSection).toBeFalsy();
  });

  // ============================================
  // 测试用例：空数据状态
  // ============================================
  it('应该在没有数据时显示空状态', () => {
    // 清空数据
    statsStore.reset();

    render(ModelUsagePanel);
    expect(screen.getByText('暂无模型使用数据')).toBeTruthy();
  });
});
