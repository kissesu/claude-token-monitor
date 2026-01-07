/**
 * @file Services 导出入口
 * @description 统一导出所有服务模块，方便其他模块引用
 * @author Atlas.oi
 * @date 2026-01-07
 */

// ============================================
// API Service
// ============================================
export {
  default as apiClient,
  getCurrentStats,
  getDailyStats,
  getHistoryStats,
  exportStats,
  downloadBlob,
  healthCheck,
  ExportFormat,
  type ExportParams,
} from './api';

// ============================================
// WebSocket Service
// ============================================
export {
  default as WebSocketService,
  getWebSocketService,
  destroyWebSocketService,
} from './websocket';

// ============================================
// Export Service
// ============================================
export {
  exportState,
  resetExportState,
  executeExport,
  exportAsJson,
  exportAsCsv,
  exportAsExcel,
  exportService,
  getMimeType,
  getFormatDisplayName,
  type ExportState,
  type ExportStatus,
  type ExportOptions,
} from './export';
