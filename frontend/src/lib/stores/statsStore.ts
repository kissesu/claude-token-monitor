/**
 * @file 统计数据状态管理
 * @description 管理 Token 使用统计数据的 Svelte store，支持实时更新、加载状态和错误处理
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { writable, derived, type Readable } from 'svelte/store';
import type {
  StatsCache,
  DailyActivity,
  StatsSummary,
  ModelUsage,
} from '$lib/types';
import { TimeRange, ApiStatus } from '$lib/types';

// ============================================
// 类型定义
// ============================================

/**
 * 统计数据存储状态
 */
interface StatsState {
  /** 当前统计数据 */
  current: StatsCache | null;

  /** 每日活动数据列表 */
  dailyActivities: DailyActivity[];

  /** 统计汇总数据 */
  summary: StatsSummary | null;

  /** 当前选择的时间范围 */
  timeRange: TimeRange;

  /** 加载状态 */
  status: ApiStatus;

  /** 错误信息 */
  error: string | null;

  /** 上次更新时间 */
  lastUpdated: Date | null;
}

/**
 * 模型使用排序选项
 */
export type ModelSortBy = 'tokens' | 'cost' | 'percentage' | 'name';

// ============================================
// 初始状态
// ============================================

const initialState: StatsState = {
  current: null,
  dailyActivities: [],
  summary: null,
  timeRange: TimeRange.WEEK,
  status: ApiStatus.IDLE,
  error: null,
  lastUpdated: null,
};

// ============================================
// 主 Store
// ============================================

/**
 * 创建统计数据主存储
 * 使用 Svelte 4 的 writable store
 */
function createStatsStore() {
  const { subscribe, set, update } = writable<StatsState>(initialState);

  return {
    subscribe,

    /**
     * 设置当前统计数据
     *
     * @param data - 统计数据缓存
     */
    setCurrent: (data: StatsCache) => {
      update((state) => ({
        ...state,
        current: data,
        lastUpdated: new Date(),
        status: ApiStatus.SUCCESS,
        error: null,
      }));
    },

    /**
     * 设置每日活动数据
     *
     * @param activities - 每日活动数据列表
     */
    setDailyActivities: (activities: DailyActivity[]) => {
      update((state) => ({
        ...state,
        dailyActivities: activities,
        lastUpdated: new Date(),
      }));
    },

    /**
     * 设置统计汇总数据
     *
     * @param summary - 统计汇总
     */
    setSummary: (summary: StatsSummary) => {
      update((state) => ({
        ...state,
        summary,
        timeRange: summary.time_range,
        lastUpdated: new Date(),
      }));
    },

    /**
     * 设置时间范围
     *
     * @param range - 时间范围
     */
    setTimeRange: (range: TimeRange) => {
      update((state) => ({
        ...state,
        timeRange: range,
      }));
    },

    /**
     * 设置加载状态
     *
     * @param status - API 状态
     */
    setStatus: (status: ApiStatus) => {
      update((state) => ({
        ...state,
        status,
        error: status === ApiStatus.LOADING ? null : state.error,
      }));
    },

    /**
     * 设置错误信息
     *
     * @param error - 错误消息
     */
    setError: (error: string) => {
      update((state) => ({
        ...state,
        status: ApiStatus.ERROR,
        error,
      }));
    },

    /**
     * 清除错误状态
     */
    clearError: () => {
      update((state) => ({
        ...state,
        error: null,
        status: state.status === ApiStatus.ERROR ? ApiStatus.IDLE : state.status,
      }));
    },

    /**
     * 重置所有数据
     */
    reset: () => {
      set(initialState);
    },

    /**
     * 刷新数据
     * 将状态设置为加载中，供外部调用 API 后更新
     */
    refresh: () => {
      update((state) => ({
        ...state,
        status: ApiStatus.LOADING,
        error: null,
      }));
    },
  };
}

// ============================================
// 导出主 Store 实例
// ============================================

export const statsStore = createStatsStore();

// ============================================
// Derived Stores（派生状态）
// ============================================

/**
 * 是否正在加载
 */
export const isLoading: Readable<boolean> = derived(
  statsStore,
  ($stats) => $stats.status === ApiStatus.LOADING
);

/**
 * 是否有错误
 */
export const hasError: Readable<boolean> = derived(
  statsStore,
  ($stats) => $stats.status === ApiStatus.ERROR
);

/**
 * 是否有数据
 */
export const hasData: Readable<boolean> = derived(
  statsStore,
  ($stats) => $stats.current !== null
);

/**
 * 总 Token 数量（从 current 中提取）
 */
export const totalTokens: Readable<number> = derived(
  statsStore,
  ($stats) => $stats.current?.total_tokens ?? 0
);

/**
 * 总费用（从 current 中提取）
 */
export const totalCost: Readable<number> = derived(
  statsStore,
  ($stats) => $stats.current?.total_cost ?? 0
);

/**
 * 模型使用列表（按使用量排序）
 *
 * @param sortBy - 排序字段，默认按 tokens 降序
 */
export function getModelUsageList(sortBy: ModelSortBy = 'tokens'): Readable<ModelUsage[]> {
  return derived(statsStore, ($stats) => {
    if (!$stats.current?.models) return [];

    const modelList = Object.values($stats.current.models);

    // 根据排序字段排序
    return modelList.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return b.cost - a.cost;
        case 'percentage':
          return b.percentage - a.percentage;
        case 'tokens':
        default:
          const aTotalTokens =
            a.tokens.input_tokens +
            a.tokens.output_tokens +
            a.tokens.cache_read_tokens +
            a.tokens.cache_creation_tokens;
          const bTotalTokens =
            b.tokens.input_tokens +
            b.tokens.output_tokens +
            b.tokens.cache_read_tokens +
            b.tokens.cache_creation_tokens;
          return bTotalTokens - aTotalTokens;
      }
    });
  });
}

/**
 * 最常用的模型（按 tokens 数量）
 */
export const topModel: Readable<ModelUsage | null> = derived(
  statsStore,
  ($stats) => {
    if (!$stats.current?.models) return null;

    const modelList = Object.values($stats.current.models);
    if (modelList.length === 0) return null;

    return modelList.reduce((top, current) => {
      const topTotal =
        top.tokens.input_tokens +
        top.tokens.output_tokens +
        top.tokens.cache_read_tokens +
        top.tokens.cache_creation_tokens;
      const currentTotal =
        current.tokens.input_tokens +
        current.tokens.output_tokens +
        current.tokens.cache_read_tokens +
        current.tokens.cache_creation_tokens;

      return currentTotal > topTotal ? current : top;
    });
  }
);

/**
 * 每日活动数据（按日期排序）
 */
export const sortedDailyActivities: Readable<DailyActivity[]> = derived(
  statsStore,
  ($stats) => {
    return [...$stats.dailyActivities].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }
);

/**
 * 最近 N 天的活动数据
 *
 * @param days - 天数
 */
export function getRecentActivities(days: number): Readable<DailyActivity[]> {
  return derived(sortedDailyActivities, ($activities) => {
    return $activities.slice(-days);
  });
}

/**
 * 缓存效率（缓存命中 tokens 占比）
 */
export const cacheEfficiency: Readable<number> = derived(
  statsStore,
  ($stats) => {
    if (!$stats.current) return 0;

    const total = $stats.current.total_tokens;
    if (total === 0) return 0;

    // 计算所有模型的缓存读取 tokens 总和
    const cacheReadTotal = Object.values($stats.current.models).reduce(
      (sum, model) => sum + model.tokens.cache_read_tokens,
      0
    );

    return (cacheReadTotal / total) * 100;
  }
);

/**
 * 数据新鲜度（距离上次更新的分钟数）
 */
export const dataFreshness: Readable<number | null> = derived(
  statsStore,
  ($stats) => {
    if (!$stats.lastUpdated) return null;

    const now = new Date().getTime();
    const lastUpdate = $stats.lastUpdated.getTime();
    const diffMinutes = Math.floor((now - lastUpdate) / (1000 * 60));

    return diffMinutes;
  }
);

/**
 * 是否需要刷新数据（超过 5 分钟）
 */
export const needsRefresh: Readable<boolean> = derived(
  dataFreshness,
  ($freshness) => {
    if ($freshness === null) return true;
    return $freshness > 5;
  }
);
