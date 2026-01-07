/**
 * @file HTTP API 服务
 * @description 封装所有后端 API 请求，提供统一的错误处理、拦截器和类型安全
 * @author Atlas.oi
 * @date 2026-01-07
 */

import type {
  ApiResponse,
  ApiError,
  StatsCache,
  DailyActivity,
  StatsSummary,
  TimeRange,
} from '$lib/types';

/**
 * 检测是否在浏览器环境
 */
const browser = typeof window !== 'undefined';

// ============================================
// 配置
// ============================================

/**
 * API 基础 URL
 * 在生产环境可通过环境变量配置
 */
const getApiBaseUrl = (): string => {
  if (!browser) return 'http://localhost:51888';

  // 使用类型断言来访问 Vite 的环境变量
  const meta = import.meta as { env?: { VITE_API_BASE_URL?: string } };
  return meta.env?.VITE_API_BASE_URL || 'http://localhost:51888';
};

const API_BASE_URL = getApiBaseUrl();

const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

/**
 * 请求超时时间（毫秒）
 */
const REQUEST_TIMEOUT = 30000;

/**
 * 重试配置
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// ============================================
// 类型定义
// ============================================

/**
 * 请求配置选项
 */
interface RequestOptions extends RequestInit {
  /** 请求超时时间（毫秒） */
  timeout?: number;

  /** 是否启用重试 */
  retry?: boolean;

  /** 自定义错误处理 */
  errorHandler?: (error: ApiError) => void;
}

/**
 * 导出数据格式
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel',
}

/**
 * 导出请求参数
 */
export interface ExportParams {
  /** 导出格式 */
  format: ExportFormat;

  /** 开始日期（YYYY-MM-DD） */
  start_date?: string;

  /** 结束日期（YYYY-MM-DD） */
  end_date?: string;

  /** 是否包含详细数据 */
  include_details?: boolean;
}

// ============================================
// 工具函数
// ============================================

/**
 * 构建完整的 API URL
 *
 * @param endpoint - API 端点路径
 * @returns 完整的 URL
 */
function buildUrl(endpoint: string): string {
  // 移除开头的斜杠（如果有）
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  return `${API_BASE_URL}${API_PREFIX}/${cleanEndpoint}`;
}

/**
 * 延迟函数（用于重试）
 *
 * @param ms - 延迟毫秒数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 判断 HTTP 状态码是否可以重试
 *
 * @param status - HTTP 状态码
 */
function isRetryableStatus(status: number): boolean {
  return RETRY_CONFIG.retryableStatusCodes.includes(status);
}

/**
 * 创建 ApiError 对象
 *
 * @param message - 错误消息
 * @param status - HTTP 状态码
 * @param code - 错误代码
 * @param details - 详细信息
 */
function createApiError(
  message: string,
  status: number,
  code: string = 'UNKNOWN_ERROR',
  details?: Record<string, unknown>
): ApiError {
  return {
    message,
    status,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 请求超时处理
 *
 * @param promise - fetch Promise
 * @param timeout - 超时时间（毫秒）
 */
async function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), timeout)
    ),
  ]);
}

// ============================================
// 拦截器
// ============================================

/**
 * 请求拦截器
 * 在发送请求前添加通用配置
 *
 * @param options - 请求配置
 */
function requestInterceptor(options: RequestOptions): RequestOptions {
  const headers = new Headers(options.headers);

  // 添加默认 headers
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // 添加自定义 headers（如 API key、认证 token 等）
  // 未来可以从 auth store 获取
  // const token = get(authStore).token;
  // if (token) {
  //   headers.set('Authorization', `Bearer ${token}`);
  // }

  return {
    ...options,
    headers,
  };
}

/**
 * 响应拦截器
 * 统一处理响应数据
 *
 * @param response - fetch Response
 */
async function responseInterceptor<T>(response: Response): Promise<ApiResponse<T>> {
  // 处理非 JSON 响应（如导出文件）
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    // 对于文件下载等场景，返回特殊格式
    if (response.ok) {
      return {
        success: true,
        data: response as unknown as T,
      };
    }
  }

  // 解析 JSON 响应
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (error) {
    throw createApiError(
      '响应数据解析失败',
      response.status,
      'PARSE_ERROR',
      { originalError: String(error) }
    );
  }

  // 检查响应状态
  if (!response.ok) {
    throw createApiError(
      data.error || `HTTP ${response.status} 错误`,
      response.status,
      data.error_code || 'HTTP_ERROR',
      { response: data }
    );
  }

  return data;
}

// ============================================
// 核心请求方法
// ============================================

/**
 * 执行 HTTP 请求（带重试机制）
 *
 * @param url - 请求 URL
 * @param options - 请求配置
 * @param retryCount - 当前重试次数
 */
async function executeRequest<T>(
  url: string,
  options: RequestOptions,
  retryCount: number = 0
): Promise<ApiResponse<T>> {
  try {
    // 应用请求拦截器
    const interceptedOptions = requestInterceptor(options);

    // 执行请求（带超时）
    const timeout = options.timeout || REQUEST_TIMEOUT;
    const response = await withTimeout(fetch(url, interceptedOptions), timeout);

    // 应用响应拦截器
    return await responseInterceptor<T>(response);
  } catch (error) {
    // 判断是否需要重试
    if (
      options.retry !== false &&
      retryCount < RETRY_CONFIG.maxRetries &&
      error instanceof Error
    ) {
      // 检查是否是可重试的错误
      const apiError = error as unknown as ApiError;
      const shouldRetry =
        apiError.status === undefined || isRetryableStatus(apiError.status);

      if (shouldRetry) {
        // 等待后重试
        const retryDelay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
        await delay(retryDelay);

        console.warn(`请求失败，${retryDelay}ms 后重试 (${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
        return executeRequest<T>(url, options, retryCount + 1);
      }
    }

    // 转换为 ApiError 格式
    if (error instanceof Error && !((error as unknown as ApiError).status)) {
      throw createApiError(
        error.message || '请求失败',
        0,
        'REQUEST_FAILED',
        { originalError: error }
      );
    }

    throw error;
  }
}

/**
 * 通用 GET 请求
 *
 * @param endpoint - API 端点
 * @param options - 请求配置
 */
async function get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint);
  return executeRequest<T>(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * 通用 POST 请求
 *
 * @param endpoint - API 端点
 * @param data - 请求体数据
 * @param options - 请求配置
 */
async function post<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint);
  return executeRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * 通用 PUT 请求
 *
 * @param endpoint - API 端点
 * @param data - 请求体数据
 * @param options - 请求配置
 */
async function put<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint);
  return executeRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

/**
 * 通用 DELETE 请求
 *
 * @param endpoint - API 端点
 * @param options - 请求配置
 */
async function del<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint);
  return executeRequest<T>(url, {
    method: 'DELETE',
    ...options,
  });
}

// ============================================
// API 方法
// ============================================

/**
 * 获取当前统计数据
 *
 * @returns 当前统计数据缓存
 */
export async function getCurrentStats(): Promise<StatsCache> {
  const response = await get<StatsCache>('/stats/current');
  return response.data;
}

/**
 * 获取每日活动数据
 *
 * @param startDate - 开始日期（YYYY-MM-DD）
 * @param endDate - 结束日期（YYYY-MM-DD）
 * @returns 每日活动数据列表
 */
export async function getDailyStats(
  startDate?: string,
  endDate?: string
): Promise<DailyActivity[]> {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  const endpoint = params.toString() ? `/stats/daily?${params}` : '/stats/daily';
  const response = await get<DailyActivity[]>(endpoint);
  return response.data;
}

/**
 * 获取历史统计数据
 *
 * @param timeRange - 时间范围
 * @returns 统计汇总数据
 */
export async function getHistoryStats(timeRange: TimeRange): Promise<StatsSummary> {
  const response = await get<StatsSummary>(`/stats/history?range=${timeRange}`);
  return response.data;
}

/**
 * 导出统计数据
 *
 * @param params - 导出参数
 * @returns Blob 对象（文件数据）
 */
export async function exportStats(params: ExportParams): Promise<Blob> {
  const queryParams = new URLSearchParams({
    format: params.format,
    ...(params.start_date && { start_date: params.start_date }),
    ...(params.end_date && { end_date: params.end_date }),
    ...(params.include_details !== undefined && {
      include_details: String(params.include_details),
    }),
  });

  const url = buildUrl(`/export?${queryParams}`);

  // 直接使用 fetch，因为返回的是文件
  const response = await fetch(url, {
    method: 'POST',
    headers: requestInterceptor({}).headers as HeadersInit,
  });

  if (!response.ok) {
    throw createApiError(
      `导出失败: HTTP ${response.status}`,
      response.status,
      'EXPORT_ERROR'
    );
  }

  return await response.blob();
}

/**
 * 下载导出的文件
 *
 * @param blob - 文件数据
 * @param filename - 文件名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (!browser) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放对象 URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * 健康检查
 *
 * @returns 健康检查响应
 */
export async function healthCheck(): Promise<{ status: string; version: string }> {
  const response = await get<{ status: string; version: string }>('/health', {
    retry: false,
    timeout: 5000,
  });
  return response.data;
}

// ============================================
// 导出 API 客户端对象
// ============================================

/**
 * API 客户端
 * 提供所有 API 方法的统一入口
 */
export const apiClient = {
  // 统计数据相关
  stats: {
    getCurrent: getCurrentStats,
    getDaily: getDailyStats,
    getHistory: getHistoryStats,
    export: exportStats,
  },

  // 工具方法
  utils: {
    downloadBlob,
    healthCheck,
  },

  // 原始 HTTP 方法（供特殊场景使用）
  http: {
    get,
    post,
    put,
    delete: del,
  },
};

// ============================================
// 默认导出
// ============================================

export default apiClient;
