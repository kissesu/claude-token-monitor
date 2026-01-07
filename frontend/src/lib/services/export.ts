/**
 * @file 导出服务
 * @description 封装数据导出业务逻辑，支持多种格式和进度追踪
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { writable, get } from 'svelte/store';
import { exportStats, downloadBlob, ExportFormat, type ExportParams } from './api';

// ============================================
// 类型定义
// ============================================

/**
 * 导出状态
 */
export type ExportStatus = 'idle' | 'preparing' | 'exporting' | 'downloading' | 'completed' | 'error';

/**
 * 导出状态 Store 类型
 */
export interface ExportState {
  /** 当前状态 */
  status: ExportStatus;

  /** 进度百分比 (0-100) */
  progress: number;

  /** 错误消息 */
  errorMessage: string;

  /** 最后导出时间 */
  lastExportTime: string | null;

  /** 最后导出的文件名 */
  lastFilename: string | null;
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;

  /** 开始日期 (YYYY-MM-DD) */
  startDate?: string;

  /** 结束日期 (YYYY-MM-DD) */
  endDate?: string;

  /** 是否包含详细数据 */
  includeDetails?: boolean;

  /** 自定义文件名（不含扩展名） */
  customFilename?: string;
}

// ============================================
// 工具函数
// ============================================

/**
 * 根据格式获取文件扩展名
 *
 * @param format - 导出格式
 * @returns 文件扩展名
 */
function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.JSON:
      return 'json';
    case ExportFormat.CSV:
      return 'csv';
    case ExportFormat.EXCEL:
      return 'xlsx';
    default:
      return 'json';
  }
}

/**
 * 生成默认文件名
 *
 * @param format - 导出格式
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 生成的文件名
 */
function generateFilename(format: ExportFormat, startDate?: string, endDate?: string): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timepart = now.toTimeString().slice(0, 8).replace(/:/g, '');

  let dateRange = '';
  if (startDate && endDate) {
    dateRange = `_${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}`;
  } else if (startDate) {
    dateRange = `_from-${startDate.replace(/-/g, '')}`;
  } else if (endDate) {
    dateRange = `_to-${endDate.replace(/-/g, '')}`;
  }

  const extension = getFileExtension(format);
  return `claude-token-stats${dateRange}_${timestamp}_${timepart}.${extension}`;
}

/**
 * 获取格式的 MIME 类型
 *
 * @param format - 导出格式
 * @returns MIME 类型
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.JSON:
      return 'application/json';
    case ExportFormat.CSV:
      return 'text/csv';
    case ExportFormat.EXCEL:
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 获取格式的显示名称
 *
 * @param format - 导出格式
 * @returns 显示名称
 */
export function getFormatDisplayName(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.JSON:
      return 'JSON';
    case ExportFormat.CSV:
      return 'CSV';
    case ExportFormat.EXCEL:
      return 'Excel';
    default:
      return format;
  }
}

// ============================================
// 导出状态 Store
// ============================================

/**
 * 创建初始状态
 */
function createInitialState(): ExportState {
  return {
    status: 'idle',
    progress: 0,
    errorMessage: '',
    lastExportTime: null,
    lastFilename: null,
  };
}

/**
 * 导出状态 Store
 */
export const exportState = writable<ExportState>(createInitialState());

/**
 * 更新导出状态
 *
 * @param updates - 状态更新
 */
function updateState(updates: Partial<ExportState>): void {
  exportState.update((state) => ({ ...state, ...updates }));
}

/**
 * 重置导出状态
 */
export function resetExportState(): void {
  exportState.set(createInitialState());
}

// ============================================
// 导出服务
// ============================================

/**
 * 执行数据导出
 *
 * 业务逻辑：
 * 1. 准备导出参数
 * 2. 调用后端 API
 * 3. 下载生成的文件
 * 4. 更新状态
 *
 * @param options - 导出选项
 */
export async function executeExport(options: ExportOptions): Promise<void> {
  const currentState = get(exportState);

  // 防止重复导出
  if (currentState.status !== 'idle' && currentState.status !== 'completed' && currentState.status !== 'error') {
    console.warn('导出正在进行中，请稍候');
    return;
  }

  try {
    // ============================================
    // 第一步：准备导出
    // ============================================
    updateState({
      status: 'preparing',
      progress: 10,
      errorMessage: '',
    });

    // 构建导出参数
    const exportParams: ExportParams = {
      format: options.format,
      start_date: options.startDate,
      end_date: options.endDate,
      include_details: options.includeDetails,
    };

    // ============================================
    // 第二步：调用 API 导出
    // ============================================
    updateState({
      status: 'exporting',
      progress: 30,
    });

    const blob = await exportStats(exportParams);

    // ============================================
    // 第三步：下载文件
    // ============================================
    updateState({
      status: 'downloading',
      progress: 80,
    });

    // 生成文件名
    const filename = options.customFilename
      ? `${options.customFilename}.${getFileExtension(options.format)}`
      : generateFilename(options.format, options.startDate, options.endDate);

    // 触发下载
    downloadBlob(blob, filename);

    // ============================================
    // 第四步：完成
    // ============================================
    updateState({
      status: 'completed',
      progress: 100,
      lastExportTime: new Date().toISOString(),
      lastFilename: filename,
    });

    // 3 秒后自动重置状态
    setTimeout(() => {
      const state = get(exportState);
      if (state.status === 'completed') {
        updateState({ status: 'idle', progress: 0 });
      }
    }, 3000);
  } catch (error) {
    const message = error instanceof Error ? error.message : '导出失败';
    updateState({
      status: 'error',
      progress: 0,
      errorMessage: message,
    });
  }
}

/**
 * 快速导出为 JSON
 *
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 */
export async function exportAsJson(startDate?: string, endDate?: string): Promise<void> {
  return executeExport({
    format: ExportFormat.JSON,
    startDate,
    endDate,
    includeDetails: true,
  });
}

/**
 * 快速导出为 CSV
 *
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 */
export async function exportAsCsv(startDate?: string, endDate?: string): Promise<void> {
  return executeExport({
    format: ExportFormat.CSV,
    startDate,
    endDate,
    includeDetails: false,
  });
}

/**
 * 快速导出为 Excel
 *
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 */
export async function exportAsExcel(startDate?: string, endDate?: string): Promise<void> {
  return executeExport({
    format: ExportFormat.EXCEL,
    startDate,
    endDate,
    includeDetails: true,
  });
}

// ============================================
// 导出服务对象
// ============================================

/**
 * 导出服务
 * 提供统一的导出功能入口
 */
export const exportService = {
  // 状态
  state: exportState,
  reset: resetExportState,

  // 导出方法
  export: executeExport,
  exportJson: exportAsJson,
  exportCsv: exportAsCsv,
  exportExcel: exportAsExcel,

  // 工具方法
  getFileExtension,
  getMimeType,
  getFormatDisplayName,

  // 常量
  formats: ExportFormat,
};

export default exportService;
