/**
 * @file WebSocket 状态管理
 * @description 管理 WebSocket 连接状态、实时推送数据和重连逻辑的 Svelte store
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { StatsCache, DailyActivity } from '$lib/types';

// ============================================
// 类型定义
// ============================================

/**
 * WebSocket 连接状态枚举
 */
export enum WsConnectionState {
  /** 连接中 */
  CONNECTING = 'connecting',

  /** 已连接 */
  CONNECTED = 'connected',

  /** 断开连接 */
  DISCONNECTED = 'disconnected',

  /** 连接错误 */
  ERROR = 'error',

  /** 重连中 */
  RECONNECTING = 'reconnecting',
}

/**
 * WebSocket 消息类型
 */
export enum WsMessageType {
  /** 统计数据更新 */
  STATS_UPDATE = 'stats_update',

  /** 每日活动更新 */
  DAILY_ACTIVITY_UPDATE = 'daily_activity_update',

  /** 系统通知 */
  NOTIFICATION = 'notification',

  /** 心跳响应 */
  PONG = 'pong',

  /** 错误消息 */
  ERROR = 'error',
}

/**
 * WebSocket 消息基础结构
 */
export interface WsMessage<T = unknown> {
  /** 消息类型 */
  type: WsMessageType;

  /** 消息数据 */
  data: T;

  /** 时间戳（ISO 8601 格式） */
  timestamp: string;
}

/**
 * 统计数据更新消息
 */
export interface StatsUpdateMessage {
  /** 更新的统计数据 */
  stats: StatsCache;

  /** 变化量（可选） */
  changes?: {
    tokens_delta: number;
    cost_delta: number;
  };
}

/**
 * 每日活动更新消息
 */
export interface DailyActivityUpdateMessage {
  /** 更新的日期 */
  date: string;

  /** 活动数据 */
  activity: DailyActivity;
}

/**
 * 系统通知消息
 */
export interface NotificationMessage {
  /** 通知标题 */
  title: string;

  /** 通知内容 */
  message: string;

  /** 通知级别 */
  level: 'info' | 'warning' | 'error' | 'success';
}

/**
 * 重连配置
 */
export interface ReconnectConfig {
  /** 当前重试次数 */
  attempts: number;

  /** 最大重试次数 */
  maxAttempts: number;

  /** 当前延迟时间（毫秒） */
  delay: number;

  /** 初始延迟时间（毫秒） */
  initialDelay: number;

  /** 最大延迟时间（毫秒） */
  maxDelay: number;

  /** 延迟增长因子 */
  backoffMultiplier: number;
}

/**
 * WebSocket 状态
 */
interface WsState {
  /** 连接状态 */
  connectionState: WsConnectionState;

  /** 最后收到的统计数据 */
  lastStats: StatsCache | null;

  /** 最后收到的每日活动数据 */
  lastDailyActivity: DailyActivity | null;

  /** 最后收到的通知 */
  lastNotification: NotificationMessage | null;

  /** 错误信息 */
  error: string | null;

  /** 连接时间 */
  connectedAt: Date | null;

  /** 最后消息时间 */
  lastMessageAt: Date | null;

  /** 重连配置 */
  reconnect: ReconnectConfig;

  /** 是否手动断开 */
  manualDisconnect: boolean;
}

// ============================================
// 初始状态
// ============================================

const initialReconnectConfig: ReconnectConfig = {
  attempts: 0,
  maxAttempts: 10,
  delay: 1000,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
};

const initialState: WsState = {
  connectionState: WsConnectionState.DISCONNECTED,
  lastStats: null,
  lastDailyActivity: null,
  lastNotification: null,
  error: null,
  connectedAt: null,
  lastMessageAt: null,
  reconnect: { ...initialReconnectConfig },
  manualDisconnect: false,
};

// ============================================
// 主 Store
// ============================================

/**
 * 创建 WebSocket 状态存储
 */
function createWsStore() {
  const { subscribe, set, update } = writable<WsState>(initialState);

  return {
    subscribe,

    /**
     * 设置连接状态
     *
     * @param state - WebSocket 连接状态
     */
    setConnectionState: (state: WsConnectionState) => {
      update((current) => {
        const newState: WsState = {
          ...current,
          connectionState: state,
        };

        // 连接成功时重置重连配置和错误
        if (state === WsConnectionState.CONNECTED) {
          newState.connectedAt = new Date();
          newState.error = null;
          newState.reconnect = { ...initialReconnectConfig };
          newState.manualDisconnect = false;
        }

        // 断开连接时清除连接时间
        if (state === WsConnectionState.DISCONNECTED) {
          newState.connectedAt = null;
        }

        return newState;
      });
    },

    /**
     * 设置统计数据
     *
     * @param stats - 统计数据
     */
    setStats: (stats: StatsCache) => {
      update((state) => ({
        ...state,
        lastStats: stats,
        lastMessageAt: new Date(),
      }));
    },

    /**
     * 设置每日活动数据
     *
     * @param activity - 每日活动数据
     */
    setDailyActivity: (activity: DailyActivity) => {
      update((state) => ({
        ...state,
        lastDailyActivity: activity,
        lastMessageAt: new Date(),
      }));
    },

    /**
     * 设置通知
     *
     * @param notification - 通知消息
     */
    setNotification: (notification: NotificationMessage) => {
      update((state) => ({
        ...state,
        lastNotification: notification,
        lastMessageAt: new Date(),
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
        connectionState: WsConnectionState.ERROR,
        error,
      }));
    },

    /**
     * 清除错误
     */
    clearError: () => {
      update((state) => ({
        ...state,
        error: null,
      }));
    },

    /**
     * 增加重连尝试次数并更新延迟时间
     */
    incrementReconnectAttempt: () => {
      update((state) => {
        const newAttempts = state.reconnect.attempts + 1;
        const newDelay = Math.min(
          state.reconnect.delay * state.reconnect.backoffMultiplier,
          state.reconnect.maxDelay
        );

        return {
          ...state,
          connectionState: WsConnectionState.RECONNECTING,
          reconnect: {
            ...state.reconnect,
            attempts: newAttempts,
            delay: newDelay,
          },
        };
      });
    },

    /**
     * 重置重连配置
     */
    resetReconnect: () => {
      update((state) => ({
        ...state,
        reconnect: { ...initialReconnectConfig },
      }));
    },

    /**
     * 标记为手动断开
     */
    markManualDisconnect: () => {
      update((state) => ({
        ...state,
        manualDisconnect: true,
        connectionState: WsConnectionState.DISCONNECTED,
      }));
    },

    /**
     * 更新最后消息时间（用于心跳检测）
     */
    updateLastMessageTime: () => {
      update((state) => ({
        ...state,
        lastMessageAt: new Date(),
      }));
    },

    /**
     * 重置所有数据
     */
    reset: () => {
      set(initialState);
    },
  };
}

// ============================================
// 导出主 Store 实例
// ============================================

export const wsStore = createWsStore();

// ============================================
// Derived Stores（派生状态）
// ============================================

/**
 * 是否已连接
 */
export const isConnected: Readable<boolean> = derived(
  wsStore,
  ($ws) => $ws.connectionState === WsConnectionState.CONNECTED
);

/**
 * 是否正在连接
 */
export const isConnecting: Readable<boolean> = derived(
  wsStore,
  ($ws) =>
    $ws.connectionState === WsConnectionState.CONNECTING ||
    $ws.connectionState === WsConnectionState.RECONNECTING
);

/**
 * 是否断开连接
 */
export const isDisconnected: Readable<boolean> = derived(
  wsStore,
  ($ws) => $ws.connectionState === WsConnectionState.DISCONNECTED
);

/**
 * 是否有错误
 */
export const hasError: Readable<boolean> = derived(
  wsStore,
  ($ws) => $ws.connectionState === WsConnectionState.ERROR
);

/**
 * 是否可以重连
 */
export const canReconnect: Readable<boolean> = derived(
  wsStore,
  ($ws) =>
    !$ws.manualDisconnect &&
    $ws.reconnect.attempts < $ws.reconnect.maxAttempts &&
    ($ws.connectionState === WsConnectionState.DISCONNECTED ||
      $ws.connectionState === WsConnectionState.ERROR)
);

/**
 * 连接时长（秒）
 */
export const connectionDuration: Readable<number | null> = derived(
  wsStore,
  ($ws) => {
    if (!$ws.connectedAt) return null;

    const now = new Date().getTime();
    const connected = $ws.connectedAt.getTime();
    return Math.floor((now - connected) / 1000);
  }
);

/**
 * 距离上次消息的时间（秒）
 */
export const timeSinceLastMessage: Readable<number | null> = derived(
  wsStore,
  ($ws) => {
    if (!$ws.lastMessageAt) return null;

    const now = new Date().getTime();
    const lastMessage = $ws.lastMessageAt.getTime();
    return Math.floor((now - lastMessage) / 1000);
  }
);

/**
 * 是否需要心跳检测（超过 30 秒无消息）
 */
export const needsHeartbeat: Readable<boolean> = derived(
  [isConnected, timeSinceLastMessage],
  ([$connected, $timeSinceLastMessage]) => {
    return $connected && $timeSinceLastMessage !== null && $timeSinceLastMessage > 30;
  }
);

/**
 * 重连状态描述文本
 */
export const reconnectStatus: Readable<string> = derived(
  wsStore,
  ($ws) => {
    if ($ws.connectionState !== WsConnectionState.RECONNECTING) return '';

    const { attempts, maxAttempts, delay } = $ws.reconnect;
    return `重连中 (${attempts}/${maxAttempts})，等待 ${Math.floor(delay / 1000)} 秒`;
  }
);

/**
 * 连接状态显示文本
 */
export const connectionStatusText: Readable<string> = derived(
  wsStore,
  ($ws) => {
    switch ($ws.connectionState) {
      case WsConnectionState.CONNECTING:
        return '正在连接...';
      case WsConnectionState.CONNECTED:
        return '已连接';
      case WsConnectionState.DISCONNECTED:
        return '已断开';
      case WsConnectionState.ERROR:
        return '连接错误';
      case WsConnectionState.RECONNECTING:
        return '重连中...';
      default:
        return '未知状态';
    }
  }
);
