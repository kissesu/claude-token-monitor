/**
 * @file wsStore 单元测试
 * @description 测试 wsStore 的所有方法和 derived stores
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  wsStore,
  WsConnectionState,
  isConnected,
  isConnecting,
  isDisconnected,
  hasError,
  canReconnect,
  connectionDuration,
  timeSinceLastMessage,
  needsHeartbeat,
  reconnectStatus,
  connectionStatusText,
  type NotificationMessage,
} from '$lib/stores/wsStore';
import type { StatsCache, DailyActivity } from '$lib/types';

// ============================================
// 测试数据工厂
// ============================================

/**
 * 创建模拟的统计数据
 */
function createMockStatsCache(): StatsCache {
  return {
    total_tokens: 1000,
    total_cost: 0.05,
    session_count: 5,
    models: {},
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建模拟的每日活动数据
 */
function createMockDailyActivity(): DailyActivity {
  return {
    date: '2026-01-07',
    tokens: {
      input_tokens: 500,
      output_tokens: 250,
      cache_read_tokens: 100,
      cache_creation_tokens: 25,
    },
    cost: 0.025,
    session_count: 3,
    models: {},
  };
}

/**
 * 创建模拟的通知消息
 */
function createMockNotification(): NotificationMessage {
  return {
    title: '测试通知',
    message: '这是一条测试通知消息',
    level: 'info',
  };
}

// ============================================
// 测试套件
// ============================================

describe('wsStore', () => {
  // 每个测试前重置 store 状态
  beforeEach(() => {
    wsStore.reset();
  });

  // ============================================
  // 初始状态测试
  // ============================================

  describe('初始状态', () => {
    it('应该有正确的初始值', () => {
      const state = get(wsStore);

      expect(state.connectionState).toBe(WsConnectionState.DISCONNECTED);
      expect(state.lastStats).toBeNull();
      expect(state.lastDailyActivity).toBeNull();
      expect(state.lastNotification).toBeNull();
      expect(state.error).toBeNull();
      expect(state.connectedAt).toBeNull();
      expect(state.lastMessageAt).toBeNull();
      expect(state.manualDisconnect).toBe(false);
    });

    it('派生 stores 应该反映初始状态', () => {
      expect(get(isConnected)).toBe(false);
      expect(get(isConnecting)).toBe(false);
      expect(get(isDisconnected)).toBe(true);
      expect(get(hasError)).toBe(false);
      expect(get(canReconnect)).toBe(true);
      expect(get(connectionDuration)).toBeNull();
      expect(get(timeSinceLastMessage)).toBeNull();
      expect(get(needsHeartbeat)).toBe(false);
    });
  });

  // ============================================
  // 状态修改方法测试
  // ============================================

  describe('setConnectionState', () => {
    it('应该正确设置连接状态', () => {
      wsStore.setConnectionState(WsConnectionState.CONNECTING);

      const state = get(wsStore);
      expect(state.connectionState).toBe(WsConnectionState.CONNECTING);
      expect(get(isConnecting)).toBe(true);
    });

    it('连接成功时应该重置重连配置和错误', () => {
      // 先设置错误和重连尝试
      wsStore.setError('测试错误');
      wsStore.incrementReconnectAttempt();

      // 然后连接成功
      wsStore.setConnectionState(WsConnectionState.CONNECTED);

      const state = get(wsStore);
      expect(state.connectionState).toBe(WsConnectionState.CONNECTED);
      expect(state.error).toBeNull();
      expect(state.reconnect.attempts).toBe(0);
      expect(state.connectedAt).toBeInstanceOf(Date);
      expect(state.manualDisconnect).toBe(false);
      expect(get(isConnected)).toBe(true);
    });

    it('断开连接时应该清除连接时间', () => {
      // 先连接
      wsStore.setConnectionState(WsConnectionState.CONNECTED);
      expect(get(wsStore).connectedAt).not.toBeNull();

      // 然后断开
      wsStore.setConnectionState(WsConnectionState.DISCONNECTED);
      expect(get(wsStore).connectedAt).toBeNull();
      expect(get(isDisconnected)).toBe(true);
    });
  });

  describe('setStats', () => {
    it('应该正确设置统计数据', () => {
      const mockStats = createMockStatsCache();
      wsStore.setStats(mockStats);

      const state = get(wsStore);
      expect(state.lastStats).toEqual(mockStats);
      expect(state.lastMessageAt).toBeInstanceOf(Date);
    });
  });

  describe('setDailyActivity', () => {
    it('应该正确设置每日活动数据', () => {
      const mockActivity = createMockDailyActivity();
      wsStore.setDailyActivity(mockActivity);

      const state = get(wsStore);
      expect(state.lastDailyActivity).toEqual(mockActivity);
      expect(state.lastMessageAt).toBeInstanceOf(Date);
    });
  });

  describe('setNotification', () => {
    it('应该正确设置通知', () => {
      const mockNotification = createMockNotification();
      wsStore.setNotification(mockNotification);

      const state = get(wsStore);
      expect(state.lastNotification).toEqual(mockNotification);
      expect(state.lastMessageAt).toBeInstanceOf(Date);
    });
  });

  describe('setError', () => {
    it('应该正确设置错误信息', () => {
      const errorMessage = '测试错误消息';
      wsStore.setError(errorMessage);

      const state = get(wsStore);
      expect(state.error).toBe(errorMessage);
      expect(state.connectionState).toBe(WsConnectionState.ERROR);
      expect(get(hasError)).toBe(true);
    });
  });

  describe('clearError', () => {
    it('应该清除错误', () => {
      wsStore.setError('测试错误');
      wsStore.clearError();

      const state = get(wsStore);
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // 重连机制测试
  // ============================================

  describe('incrementReconnectAttempt', () => {
    it('应该增加重连尝试次数', () => {
      wsStore.incrementReconnectAttempt();

      const state = get(wsStore);
      expect(state.reconnect.attempts).toBe(1);
      expect(state.connectionState).toBe(WsConnectionState.RECONNECTING);
      expect(get(isConnecting)).toBe(true);
    });

    it('应该按照退避算法增加延迟时间', () => {
      const initialDelay = get(wsStore).reconnect.delay;

      wsStore.incrementReconnectAttempt();
      const delay1 = get(wsStore).reconnect.delay;

      wsStore.incrementReconnectAttempt();
      const delay2 = get(wsStore).reconnect.delay;

      expect(delay1).toBeGreaterThan(initialDelay);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('延迟时间不应超过最大值', () => {
      // 多次增加重连尝试
      for (let i = 0; i < 20; i++) {
        wsStore.incrementReconnectAttempt();
      }

      const state = get(wsStore);
      expect(state.reconnect.delay).toBeLessThanOrEqual(state.reconnect.maxDelay);
    });
  });

  describe('resetReconnect', () => {
    it('应该重置重连配置', () => {
      // 先增加重连尝试
      wsStore.incrementReconnectAttempt();
      wsStore.incrementReconnectAttempt();

      // 然后重置
      wsStore.resetReconnect();

      const state = get(wsStore);
      expect(state.reconnect.attempts).toBe(0);
      expect(state.reconnect.delay).toBe(state.reconnect.initialDelay);
    });
  });

  describe('markManualDisconnect', () => {
    it('应该标记为手动断开', () => {
      wsStore.markManualDisconnect();

      const state = get(wsStore);
      expect(state.manualDisconnect).toBe(true);
      expect(state.connectionState).toBe(WsConnectionState.DISCONNECTED);
      expect(get(canReconnect)).toBe(false);
    });
  });

  describe('updateLastMessageTime', () => {
    it('应该更新最后消息时间', () => {
      wsStore.updateLastMessageTime();

      const state = get(wsStore);
      expect(state.lastMessageAt).toBeInstanceOf(Date);
    });
  });

  describe('reset', () => {
    it('应该重置所有数据到初始状态', () => {
      // 设置一些数据
      wsStore.setConnectionState(WsConnectionState.CONNECTED);
      wsStore.setStats(createMockStatsCache());
      wsStore.setError('测试错误');

      // 重置
      wsStore.reset();

      const state = get(wsStore);
      expect(state.connectionState).toBe(WsConnectionState.DISCONNECTED);
      expect(state.lastStats).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // 派生 Stores 测试
  // ============================================

  describe('canReconnect', () => {
    it('手动断开时不能重连', () => {
      wsStore.markManualDisconnect();
      expect(get(canReconnect)).toBe(false);
    });

    it('超过最大重试次数时不能重连', () => {
      const maxAttempts = get(wsStore).reconnect.maxAttempts;

      for (let i = 0; i < maxAttempts; i++) {
        wsStore.incrementReconnectAttempt();
      }

      expect(get(canReconnect)).toBe(false);
    });

    it('连接中时不能重连', () => {
      wsStore.setConnectionState(WsConnectionState.CONNECTING);
      expect(get(canReconnect)).toBe(false);
    });

    it('已连接时不能重连', () => {
      wsStore.setConnectionState(WsConnectionState.CONNECTED);
      expect(get(canReconnect)).toBe(false);
    });

    it('断开连接且未达到最大重试次数时可以重连', () => {
      wsStore.setConnectionState(WsConnectionState.DISCONNECTED);
      expect(get(canReconnect)).toBe(true);
    });
  });

  describe('connectionDuration', () => {
    it('未连接时应该返回 null', () => {
      expect(get(connectionDuration)).toBeNull();
    });

    it('已连接时应该返回连接时长', () => {
      wsStore.setConnectionState(WsConnectionState.CONNECTED);

      const duration = get(connectionDuration);
      expect(duration).not.toBeNull();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('timeSinceLastMessage', () => {
    it('没有消息时应该返回 null', () => {
      expect(get(timeSinceLastMessage)).toBeNull();
    });

    it('收到消息后应该返回时间差', () => {
      wsStore.updateLastMessageTime();

      const time = get(timeSinceLastMessage);
      expect(time).not.toBeNull();
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('needsHeartbeat', () => {
    it('未连接时不需要心跳', () => {
      expect(get(needsHeartbeat)).toBe(false);
    });

    it('已连接但刚收到消息时不需要心跳', () => {
      wsStore.setConnectionState(WsConnectionState.CONNECTED);
      wsStore.updateLastMessageTime();

      expect(get(needsHeartbeat)).toBe(false);
    });
  });

  describe('reconnectStatus', () => {
    it('非重连状态时应该返回空字符串', () => {
      expect(get(reconnectStatus)).toBe('');
    });

    it('重连状态时应该返回状态描述', () => {
      wsStore.incrementReconnectAttempt();

      const status = get(reconnectStatus);
      expect(status).toContain('重连中');
      expect(status).toContain('1/10'); // 1次尝试，共10次最大尝试
    });
  });

  describe('connectionStatusText', () => {
    it('应该返回正确的连接状态文本', () => {
      wsStore.setConnectionState(WsConnectionState.CONNECTING);
      expect(get(connectionStatusText)).toBe('正在连接...');

      wsStore.setConnectionState(WsConnectionState.CONNECTED);
      expect(get(connectionStatusText)).toBe('已连接');

      wsStore.setConnectionState(WsConnectionState.DISCONNECTED);
      expect(get(connectionStatusText)).toBe('已断开');

      wsStore.setConnectionState(WsConnectionState.ERROR);
      expect(get(connectionStatusText)).toBe('连接错误');

      wsStore.setConnectionState(WsConnectionState.RECONNECTING);
      expect(get(connectionStatusText)).toBe('重连中...');
    });
  });
});
