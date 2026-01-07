/**
 * @file Stores 导出入口
 * @description 统一导出所有 Svelte stores，方便其他模块引用
 * @author Atlas.oi
 * @date 2026-01-07
 */

// ============================================
// 统计数据 Store
// ============================================
export {
  statsStore,
  isLoading as statsIsLoading,
  hasError as statsHasError,
  hasData as statsHasData,
  totalTokens,
  totalCost,
  getModelUsageList,
  topModel,
  sortedDailyActivities,
  getRecentActivities,
  cacheEfficiency,
  dataFreshness,
  needsRefresh,
  type ModelSortBy,
} from './statsStore';

// ============================================
// WebSocket Store
// ============================================
export {
  wsStore,
  WsConnectionState,
  WsMessageType,
  isConnected as wsIsConnected,
  isConnecting as wsIsConnecting,
  isDisconnected as wsIsDisconnected,
  hasError as wsHasError,
  canReconnect,
  connectionDuration,
  timeSinceLastMessage,
  needsHeartbeat,
  reconnectStatus,
  connectionStatusText,
  type WsMessage,
  type StatsUpdateMessage,
  type DailyActivityUpdateMessage,
  type NotificationMessage,
  type ReconnectConfig,
} from './wsStore';

// ============================================
// 主题 Store
// ============================================
export {
  themeStore,
  ThemeMode,
  currentMode,
  appliedTheme,
  isLight,
  isDark,
  isSystemMode,
  systemPrefersDark,
  themeName,
  themeIcon,
  type AppliedTheme,
} from './themeStore';
