/**
 * @file 统计数据类型定义
 * @description 定义 Token 使用统计、缓存数据、模型使用等核心数据结构
 * @author Atlas.oi
 * @date 2026-01-07
 */

/**
 * Token 使用数据
 * 记录各类型 Token 的使用量
 */
export interface TokenUsage {
  /** 输入 Token 数量 */
  input_tokens: number;

  /** 输出 Token 数量 */
  output_tokens: number;

  /** 缓存读取 Token 数量 */
  cache_read_tokens: number;

  /** 缓存创建 Token 数量 */
  cache_creation_tokens: number;
}

/**
 * 统计缓存数据
 * 用于存储和展示整体统计信息
 */
export interface StatsCache {
  /** 总 Token 数 */
  total_tokens: number;

  /** 总费用（美元，后端可能返回 null） */
  total_cost?: number | null;

  /** 总会话数 */
  total_sessions?: number;

  /** 按模型分组的使用数据 */
  models: Record<string, ModelUsage>;

  /** 数据更新时间（ISO 8601 格式） */
  updated_at?: string;

  /** 每日活动数据 */
  daily_activities?: DailyActivity[];

  /** 最后更新时间 */
  last_updated?: string;
}

/**
 * 模型使用数据
 * 记录单个模型的详细使用情况
 */
export interface ModelUsage {
  /** 模型名称 */
  name: string;

  /** 输入 Token 数量 */
  input_tokens: number;

  /** 输出 Token 数量 */
  output_tokens: number;

  /** 缓存读取 Token 数量 */
  cache_read_tokens: number;

  /** 缓存创建 Token 数量 */
  cache_creation_tokens: number;

  /** 费用（美元） */
  cost: number;

  /** 占总使用量的百分比 */
  percentage: number;
}

/**
 * 每日活动数据
 * 用于时间序列图表展示
 */
export interface DailyActivity {
  /** 日期（YYYY-MM-DD 格式） */
  date: string;

  /** 当天 Token 使用详情 */
  tokens: TokenUsage;

  /** 当天费用（美元） */
  cost: number;

  /** 当天会话数 */
  sessions: number;
}

/**
 * 时间范围枚举
 * 用于筛选不同时间段的数据
 */
export enum TimeRange {
  /** 最近 7 天 */
  WEEK = 'week',

  /** 最近 30 天 */
  MONTH = 'month',

  /** 最近 90 天 */
  QUARTER = 'quarter',

  /** 全部时间 */
  ALL = 'all',
}

/**
 * 统计数据汇总
 * 用于仪表板概览展示
 */
export interface StatsSummary {
  /** 总 Token 数 */
  total_tokens: number;

  /** 总费用 */
  total_cost: number;

  /** 总会话数 */
  total_sessions: number;

  /** 平均每会话 Token 数 */
  avg_tokens_per_session: number;

  /** 平均每会话费用 */
  avg_cost_per_session: number;

  /** 数据时间范围 */
  time_range: TimeRange;
}
