/**
 * @file API 响应类型定义
 * @description 定义后端 API 的请求和响应数据结构
 * @author Atlas.oi
 * @date 2026-01-07
 */

/**
 * API 响应基础结构
 * 所有 API 响应都遵循此结构
 *
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T> {
  /** 请求是否成功 */
  success: boolean;

  /** 响应数据 */
  data: T;

  /** 错误信息（仅在 success 为 false 时存在） */
  error?: string;

  /** 错误代码（可选） */
  error_code?: string;
}

/**
 * 健康检查响应
 * GET /api/health 的响应结构
 */
export interface HealthResponse {
  /** 服务状态 */
  status: string;

  /** 服务版本号 */
  version: string;

  /** 服务名称 */
  service: string;

  /** 服务启动时间（ISO 8601 格式） */
  uptime?: string;
}

/**
 * 分页请求参数
 * 用于列表查询接口
 */
export interface PaginationParams {
  /** 页码（从 1 开始） */
  page?: number;

  /** 每页数量 */
  page_size?: number;

  /** 排序字段 */
  sort_by?: string;

  /** 排序方向 */
  sort_order?: 'asc' | 'desc';
}

/**
 * 分页响应结构
 * 包含分页元数据和数据列表
 *
 * @template T - 列表项的类型
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  items: T[];

  /** 总记录数 */
  total: number;

  /** 当前页码 */
  page: number;

  /** 每页数量 */
  page_size: number;

  /** 总页数 */
  total_pages: number;

  /** 是否有下一页 */
  has_next: boolean;

  /** 是否有上一页 */
  has_prev: boolean;
}

/**
 * API 错误类型
 * 用于统一的错误处理
 */
export interface ApiError {
  /** 错误消息 */
  message: string;

  /** 错误代码 */
  code: string;

  /** HTTP 状态码 */
  status: number;

  /** 详细错误信息（可选） */
  details?: Record<string, unknown>;

  /** 错误发生时间 */
  timestamp: string;
}

/**
 * API 请求状态
 * 用于前端状态管理
 */
export enum ApiStatus {
  /** 空闲状态 */
  IDLE = 'idle',

  /** 加载中 */
  LOADING = 'loading',

  /** 成功 */
  SUCCESS = 'success',

  /** 失败 */
  ERROR = 'error',
}
