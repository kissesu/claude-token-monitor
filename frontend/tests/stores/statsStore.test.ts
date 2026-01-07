/**
 * @file statsStore 单元测试
 * @description 测试 statsStore 统计数据状态管理的核心方法和派生状态
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  statsStore,
  isLoading,
  hasError,
  hasData,
  totalTokens,
  totalCost,
  getModelUsageList,
  topModel,
  sortedDailyActivities,
  getRecentActivities,
  cacheEfficiency,
  needsRefresh,
} from '$lib/stores/statsStore';
import { TimeRange, ApiStatus } from '$lib/types';
import type { StatsCache, DailyActivity, ModelUsage } from '$lib/types';

describe('statsStore', () => {
  // 每个测试前重置 store
  beforeEach(() => {
    statsStore.reset();
  });

  describe('初始状态', () => {
    it('应有正确的初始状态', () => {
      const state = get(statsStore);

      expect(state.current).toBeNull();
      expect(state.dailyActivities).toEqual([]);
      expect(state.summary).toBeNull();
      expect(state.timeRange).toBe(TimeRange.WEEK);
      expect(state.status).toBe(ApiStatus.IDLE);
      expect(state.error).toBeNull();
      expect(state.lastUpdated).toBeNull();
    });

    it('派生状态应有正确的初始值', () => {
      expect(get(isLoading)).toBe(false);
      expect(get(hasError)).toBe(false);
      expect(get(hasData)).toBe(false);
      expect(get(totalTokens)).toBe(0);
      expect(get(totalCost)).toBe(0);
    });
  });

  describe('setCurrent 方法', () => {
    it('应正确设置统计数据', () => {
      const mockStats: StatsCache = {
        total_tokens: 1000,
        total_cost: 0.05,
        models: {},
      };

      statsStore.setCurrent(mockStats);
      const state = get(statsStore);

      expect(state.current).toEqual(mockStats);
      expect(state.status).toBe(ApiStatus.SUCCESS);
      expect(state.error).toBeNull();
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('应更新派生状态', () => {
      const mockStats: StatsCache = {
        total_tokens: 1500,
        total_cost: 0.075,
        models: {},
      };

      statsStore.setCurrent(mockStats);

      expect(get(hasData)).toBe(true);
      expect(get(totalTokens)).toBe(1500);
      expect(get(totalCost)).toBe(0.075);
    });
  });

  describe('setDailyActivities 方法', () => {
    it('应正确设置每日活动数据', () => {
      const activities: DailyActivity[] = [
        {
          date: '2026-01-07',
          tokens: { input_tokens: 100, output_tokens: 50, cache_read_tokens: 20, cache_creation_tokens: 5 },
          cost: 0.01,
          session_count: 5,
        },
        {
          date: '2026-01-06',
          tokens: { input_tokens: 80, output_tokens: 40, cache_read_tokens: 15, cache_creation_tokens: 3 },
          cost: 0.008,
          session_count: 4,
        },
      ];

      statsStore.setDailyActivities(activities);
      const state = get(statsStore);

      expect(state.dailyActivities).toHaveLength(2);
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('setTimeRange 方法', () => {
    it('应正确设置时间范围', () => {
      statsStore.setTimeRange(TimeRange.MONTH);
      const state = get(statsStore);

      expect(state.timeRange).toBe(TimeRange.MONTH);
    });
  });

  describe('状态管理方法', () => {
    it('setStatus 应正确设置加载状态', () => {
      statsStore.setStatus(ApiStatus.LOADING);

      expect(get(statsStore).status).toBe(ApiStatus.LOADING);
      expect(get(isLoading)).toBe(true);
    });

    it('setError 应正确设置错误状态', () => {
      statsStore.setError('加载失败');
      const state = get(statsStore);

      expect(state.status).toBe(ApiStatus.ERROR);
      expect(state.error).toBe('加载失败');
      expect(get(hasError)).toBe(true);
    });

    it('clearError 应清除错误状态', () => {
      statsStore.setError('加载失败');
      statsStore.clearError();
      const state = get(statsStore);

      expect(state.error).toBeNull();
      expect(state.status).toBe(ApiStatus.IDLE);
    });

    it('refresh 应设置加载中状态', () => {
      statsStore.setError('之前的错误');
      statsStore.refresh();
      const state = get(statsStore);

      expect(state.status).toBe(ApiStatus.LOADING);
      expect(state.error).toBeNull();
    });
  });

  describe('模型使用相关派生状态', () => {
    const mockStatsWithModels: StatsCache = {
      total_tokens: 2000,
      total_cost: 0.1,
      models: {
        'claude-opus-4-5': {
          name: 'claude-opus-4-5',
          tokens: {
            input_tokens: 500,
            output_tokens: 200,
            cache_read_tokens: 50,
            cache_creation_tokens: 10,
          },
          cost: 0.06,
          percentage: 38,
        },
        'claude-sonnet-4-5': {
          name: 'claude-sonnet-4-5',
          tokens: {
            input_tokens: 800,
            output_tokens: 300,
            cache_read_tokens: 100,
            cache_creation_tokens: 40,
          },
          cost: 0.04,
          percentage: 62,
        },
      },
    };

    beforeEach(() => {
      statsStore.setCurrent(mockStatsWithModels);
    });

    it('getModelUsageList 应返回按 tokens 排序的模型列表', () => {
      const list = get(getModelUsageList('tokens'));

      expect(list).toHaveLength(2);
      // sonnet 总 tokens 更多，应排在前面
      expect(list[0].name).toBe('claude-sonnet-4-5');
    });

    it('getModelUsageList 应按 cost 排序', () => {
      const list = get(getModelUsageList('cost'));

      expect(list[0].name).toBe('claude-opus-4-5'); // cost 0.06 > 0.04
    });

    it('getModelUsageList 应按 name 排序', () => {
      const list = get(getModelUsageList('name'));

      expect(list[0].name).toBe('claude-opus-4-5'); // 字母顺序
    });

    it('topModel 应返回使用量最大的模型', () => {
      const top = get(topModel);

      expect(top).not.toBeNull();
      expect(top!.name).toBe('claude-sonnet-4-5');
    });
  });

  describe('每日活动相关派生状态', () => {
    const mockActivities: DailyActivity[] = [
      {
        date: '2026-01-05',
        tokens: { input_tokens: 100, output_tokens: 50, cache_read_tokens: 20, cache_creation_tokens: 5 },
        cost: 0.01,
        session_count: 5,
      },
      {
        date: '2026-01-07',
        tokens: { input_tokens: 150, output_tokens: 70, cache_read_tokens: 30, cache_creation_tokens: 10 },
        cost: 0.015,
        session_count: 7,
      },
      {
        date: '2026-01-06',
        tokens: { input_tokens: 80, output_tokens: 40, cache_read_tokens: 15, cache_creation_tokens: 3 },
        cost: 0.008,
        session_count: 4,
      },
    ];

    beforeEach(() => {
      statsStore.setDailyActivities(mockActivities);
    });

    it('sortedDailyActivities 应按日期升序排序', () => {
      const sorted = get(sortedDailyActivities);

      expect(sorted[0].date).toBe('2026-01-05');
      expect(sorted[1].date).toBe('2026-01-06');
      expect(sorted[2].date).toBe('2026-01-07');
    });

    it('getRecentActivities 应返回最近 N 天数据', () => {
      const recent = get(getRecentActivities(2));

      expect(recent).toHaveLength(2);
      expect(recent[0].date).toBe('2026-01-06');
      expect(recent[1].date).toBe('2026-01-07');
    });
  });

  describe('缓存效率派生状态', () => {
    it('无数据时缓存效率应为 0', () => {
      expect(get(cacheEfficiency)).toBe(0);
    });

    it('有数据时应正确计算缓存效率', () => {
      const mockStats: StatsCache = {
        total_tokens: 1000,
        total_cost: 0.05,
        models: {
          model1: {
            name: 'model1',
            tokens: {
              input_tokens: 400,
              output_tokens: 300,
              cache_read_tokens: 200, // 20% 的缓存读取
              cache_creation_tokens: 100,
            },
            cost: 0.05,
            percentage: 100,
          },
        },
      };

      statsStore.setCurrent(mockStats);

      expect(get(cacheEfficiency)).toBe(20); // 200/1000 * 100 = 20%
    });
  });

  describe('数据新鲜度派生状态', () => {
    it('无数据时 needsRefresh 应为 true', () => {
      expect(get(needsRefresh)).toBe(true);
    });

    it('刚更新的数据 needsRefresh 应为 false', () => {
      statsStore.setCurrent({
        total_tokens: 100,
        total_cost: 0.01,
        models: {},
      });

      expect(get(needsRefresh)).toBe(false);
    });
  });

  describe('reset 方法', () => {
    it('应重置所有状态', () => {
      // 先设置一些数据
      statsStore.setCurrent({ total_tokens: 1000, total_cost: 0.05, models: {} });
      statsStore.setError('错误');
      statsStore.setTimeRange(TimeRange.MONTH);

      // 重置
      statsStore.reset();
      const state = get(statsStore);

      expect(state.current).toBeNull();
      expect(state.error).toBeNull();
      expect(state.timeRange).toBe(TimeRange.WEEK);
      expect(state.status).toBe(ApiStatus.IDLE);
    });
  });
});
