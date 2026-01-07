/**
 * @file WebSocket 服务
 * @description 管理 WebSocket 连接，提供自动重连、心跳检测和消息分发功能
 * @author Atlas.oi
 * @date 2026-01-07
 */

/**
 * 检测是否在浏览器环境
 */
const browser = typeof window !== 'undefined';

import { get } from 'svelte/store';
import {
  wsStore,
  WsConnectionState,
  WsMessageType,
  type WsMessage,
  type StatsUpdateMessage,
  type DailyActivityUpdateMessage,
  type NotificationMessage,
} from '$lib/stores/wsStore';
import { statsStore } from '$lib/stores/statsStore';

// ============================================
// 配置
// ============================================

/**
 * WebSocket 服务器 URL
 * 在生产环境可通过环境变量配置
 */
const getWsUrl = (): string => {
  if (!browser) return 'ws://localhost:51888/ws';

  // 使用类型断言来访问 Vite 的环境变量
  const meta = import.meta as { env?: { VITE_WS_URL?: string } };
  return meta.env?.VITE_WS_URL || 'ws://localhost:51888/ws';
};

const WS_URL = getWsUrl();

/**
 * 心跳检测间隔（毫秒）
 */
const HEARTBEAT_INTERVAL = 30000; // 30 秒

/**
 * 心跳超时时间（毫秒）
 */
const HEARTBEAT_TIMEOUT = 5000; // 5 秒

/**
 * 连接超时时间（毫秒）
 */
const CONNECTION_TIMEOUT = 10000; // 10 秒

// ============================================
// 类型定义
// ============================================

/**
 * WebSocket 连接选项
 */
interface WebSocketOptions {
  /** 是否自动重连 */
  autoReconnect?: boolean;

  /** 是否启用心跳检测 */
  enableHeartbeat?: boolean;

  /** 连接超时时间（毫秒） */
  connectionTimeout?: number;

  /** 自定义消息处理器 */
  messageHandlers?: Partial<Record<WsMessageType, (data: unknown) => void>>;
}

/**
 * 心跳定时器类型
 */
type HeartbeatTimers = {
  interval: number | null;
  timeout: number | null;
};

// ============================================
// WebSocket 管理类
// ============================================

class WebSocketService {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private heartbeatTimers: HeartbeatTimers = { interval: null, timeout: null };
  private reconnectTimer: number | null = null;
  private connectionTimer: number | null = null;

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      autoReconnect: true,
      enableHeartbeat: true,
      connectionTimeout: CONNECTION_TIMEOUT,
      messageHandlers: {},
      ...options,
    };
  }

  // ============================================
  // 连接管理
  // ============================================

  /**
   * 连接 WebSocket
   */
  connect(): void {
    if (!browser) {
      console.warn('WebSocket 仅在浏览器环境中可用');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket 已连接');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.warn('WebSocket 正在连接中');
      return;
    }

    try {
      console.log('正在连接 WebSocket:', WS_URL);

      // 更新状态为连接中
      wsStore.setConnectionState(WsConnectionState.CONNECTING);
      wsStore.clearError();

      // 创建 WebSocket 连接
      this.ws = new WebSocket(WS_URL);

      // 设置连接超时
      this.setConnectionTimeout();

      // 绑定事件处理器
      this.bindEventHandlers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      console.error('WebSocket 连接失败:', errorMessage);
      wsStore.setError(errorMessage);
      this.handleConnectionError();
    }
  }

  /**
   * 断开连接
   *
   * @param manual - 是否为手动断开
   */
  disconnect(manual: boolean = true): void {
    if (manual) {
      wsStore.markManualDisconnect();
    }

    this.cleanup();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    console.log('WebSocket 已断开');
  }

  /**
   * 重新连接
   */
  reconnect(): void {
    console.log('尝试重新连接 WebSocket');

    this.cleanup();

    // 检查是否可以重连
    const state = get(wsStore);
    if (
      state.manualDisconnect ||
      state.reconnect.attempts >= state.reconnect.maxAttempts
    ) {
      console.warn('无法重连:', state.manualDisconnect ? '手动断开' : '超过最大重试次数');
      return;
    }

    // 增加重连计数
    wsStore.incrementReconnectAttempt();

    // 延迟后重连
    const delay = get(wsStore).reconnect.delay;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);

    console.log(`将在 ${delay}ms 后重连`);
  }

  /**
   * 获取当前连接状态
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================
  // 消息发送
  // ============================================

  /**
   * 发送消息
   *
   * @param type - 消息类型
   * @param data - 消息数据
   */
  send<T = unknown>(type: string, data: T): void {
    if (!this.isConnected()) {
      console.error('WebSocket 未连接，无法发送消息');
      return;
    }

    try {
      const message: WsMessage<T> = {
        type: type as WsMessageType,
        data,
        timestamp: new Date().toISOString(),
      };

      this.ws!.send(JSON.stringify(message));
      console.debug('发送 WebSocket 消息:', type);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  }

  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    this.send('ping', { timestamp: Date.now() });
  }

  // ============================================
  // 事件处理
  // ============================================

  /**
   * 绑定 WebSocket 事件处理器
   */
  private bindEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  /**
   * 处理连接打开事件
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket 连接已建立', event);

    // 清除连接超时定时器
    this.clearConnectionTimeout();

    // 更新状态
    wsStore.setConnectionState(WsConnectionState.CONNECTED);
    wsStore.resetReconnect();

    // 启动心跳检测
    if (this.options.enableHeartbeat) {
      this.startHeartbeat();
    }
  }

  /**
   * 处理收到消息事件
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WsMessage = JSON.parse(event.data);

      console.debug('收到 WebSocket 消息:', message.type);

      // 更新最后消息时间
      wsStore.updateLastMessageTime();

      // 重置心跳超时
      this.resetHeartbeatTimeout();

      // 分发消息
      this.dispatchMessage(message);
    } catch (error) {
      console.error('解析 WebSocket 消息失败:', error);
    }
  }

  /**
   * 处理错误事件
   */
  private handleError(event: Event): void {
    console.error('WebSocket 错误:', event);

    const errorMessage = 'WebSocket 连接错误';
    wsStore.setError(errorMessage);

    this.handleConnectionError();
  }

  /**
   * 处理连接关闭事件
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket 连接已关闭:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    // 清理资源
    this.cleanup();

    // 更新状态
    const state = get(wsStore);
    if (!state.manualDisconnect) {
      wsStore.setConnectionState(WsConnectionState.DISCONNECTED);

      // 自动重连
      if (this.options.autoReconnect) {
        this.reconnect();
      }
    }
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(): void {
    this.clearConnectionTimeout();

    // 自动重连
    if (this.options.autoReconnect) {
      this.reconnect();
    }
  }

  // ============================================
  // 消息分发
  // ============================================

  /**
   * 分发消息到相应的处理器
   */
  private dispatchMessage(message: WsMessage): void {
    // 优先使用自定义处理器
    const customHandler = this.options.messageHandlers[message.type];
    if (customHandler) {
      customHandler(message.data);
      return;
    }

    // 默认处理器
    switch (message.type) {
      case WsMessageType.STATS_UPDATE:
        this.handleStatsUpdate(message.data as StatsUpdateMessage);
        break;

      case WsMessageType.DAILY_ACTIVITY_UPDATE:
        this.handleDailyActivityUpdate(message.data as DailyActivityUpdateMessage);
        break;

      case WsMessageType.NOTIFICATION:
        this.handleNotification(message.data as NotificationMessage);
        break;

      case WsMessageType.PONG:
        console.debug('收到心跳响应');
        break;

      case WsMessageType.ERROR:
        this.handleErrorMessage(message.data as { message: string });
        break;

      default:
        console.warn('未知消息类型:', message.type);
    }
  }

  /**
   * 处理统计数据更新
   */
  private handleStatsUpdate(data: StatsUpdateMessage): void {
    console.log('收到统计数据更新', data);

    // 更新 store
    wsStore.setStats(data.stats);
    statsStore.setCurrent(data.stats);

    // 如果有变化量，可以显示通知
    if (data.changes) {
      console.debug('数据变化:', data.changes);
    }
  }

  /**
   * 处理每日活动更新
   */
  private handleDailyActivityUpdate(data: DailyActivityUpdateMessage): void {
    console.log('收到每日活动更新', data);

    wsStore.setDailyActivity(data.activity);

    // 更新 statsStore 中的每日活动数据
    // 这里需要合并或追加数据
    const currentActivities = get(statsStore).dailyActivities;
    const existingIndex = currentActivities.findIndex((a) => a.date === data.date);

    if (existingIndex >= 0) {
      // 更新已存在的日期数据
      currentActivities[existingIndex] = data.activity;
    } else {
      // 添加新的日期数据
      currentActivities.push(data.activity);
    }

    statsStore.setDailyActivities([...currentActivities]);
  }

  /**
   * 处理系统通知
   */
  private handleNotification(data: NotificationMessage): void {
    console.log('收到系统通知:', data);

    wsStore.setNotification(data);

    // 可以在这里触发浏览器通知
    if (browser && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/favicon.png',
      });
    }
  }

  /**
   * 处理错误消息
   */
  private handleErrorMessage(data: { message: string }): void {
    console.error('服务器错误:', data.message);
    wsStore.setError(data.message);
  }

  // ============================================
  // 心跳检测
  // ============================================

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    // 定时发送心跳
    this.heartbeatTimers.interval = setInterval(() => {
      if (this.isConnected()) {
        this.sendHeartbeat();
        this.setHeartbeatTimeout();
      }
    }, HEARTBEAT_INTERVAL);

    console.debug('心跳检测已启动');
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimers.interval) {
      clearInterval(this.heartbeatTimers.interval);
      this.heartbeatTimers.interval = null;
    }

    if (this.heartbeatTimers.timeout) {
      clearTimeout(this.heartbeatTimers.timeout);
      this.heartbeatTimers.timeout = null;
    }

    console.debug('心跳检测已停止');
  }

  /**
   * 设置心跳超时检测
   */
  private setHeartbeatTimeout(): void {
    this.clearHeartbeatTimeout();

    this.heartbeatTimers.timeout = setTimeout(() => {
      console.warn('心跳超时，连接可能已断开');

      // 关闭当前连接并重连
      if (this.ws) {
        this.ws.close();
      }
    }, HEARTBEAT_TIMEOUT);
  }

  /**
   * 重置心跳超时
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimers.timeout) {
      clearTimeout(this.heartbeatTimers.timeout);
      this.heartbeatTimers.timeout = null;
    }
  }

  /**
   * 清除心跳超时定时器
   */
  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimers.timeout) {
      clearTimeout(this.heartbeatTimers.timeout);
      this.heartbeatTimers.timeout = null;
    }
  }

  // ============================================
  // 超时管理
  // ============================================

  /**
   * 设置连接超时
   */
  private setConnectionTimeout(): void {
    this.clearConnectionTimeout();

    this.connectionTimer = setTimeout(() => {
      console.error('连接超时');

      if (this.ws?.readyState === WebSocket.CONNECTING) {
        this.ws.close();
        wsStore.setError('连接超时');
        this.handleConnectionError();
      }
    }, this.options.connectionTimeout);
  }

  /**
   * 清除连接超时定时器
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  // ============================================
  // 清理资源
  // ============================================

  /**
   * 清理所有定时器和资源
   */
  private cleanup(): void {
    this.stopHeartbeat();
    this.clearConnectionTimeout();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 销毁实例（清理所有资源）
   */
  destroy(): void {
    this.disconnect(true);
    this.cleanup();
    this.ws = null;
  }
}

// ============================================
// 单例实例
// ============================================

let wsServiceInstance: WebSocketService | null = null;

/**
 * 获取 WebSocket 服务单例
 *
 * @param options - WebSocket 配置选项
 */
export function getWebSocketService(options?: WebSocketOptions): WebSocketService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService(options);
  }
  return wsServiceInstance;
}

/**
 * 销毁 WebSocket 服务实例
 */
export function destroyWebSocketService(): void {
  if (wsServiceInstance) {
    wsServiceInstance.destroy();
    wsServiceInstance = null;
  }
}

// ============================================
// 默认导出
// ============================================

export default WebSocketService;
