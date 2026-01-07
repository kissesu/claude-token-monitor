/**
 * @file websocket service 单元测试
 * @description 测试 WebSocket 服务的所有方法和连接管理
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import WebSocketService, {
  getWebSocketService,
  destroyWebSocketService,
} from '$lib/services/websocket';
import { wsStore, WsConnectionState, WsMessageType } from '$lib/stores/wsStore';
import { statsStore } from '$lib/stores/statsStore';

// ============================================
// Mock WebSocket (已在 setup.ts 中配置)
// ============================================

// 全局 MockWebSocket 已经在 setup.ts 中定义

// ============================================
// 测试套件
// ============================================

describe('WebSocket Service', () => {
  let service: WebSocketService;

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // 重置 stores
    wsStore.reset();
    statsStore.reset();

    // 创建新的服务实例
    service = new WebSocketService();
  });

  afterEach(() => {
    // 清理服务实例
    if (service) {
      service.destroy();
    }

    // 恢复真实定时器
    vi.useRealTimers();
  });

  // ============================================
  // 连接管理测试
  // ============================================

  describe('connect', () => {
    it('应该成功建立 WebSocket 连接', () => {
      service.connect();

      expect(service.getReadyState()).toBe(WebSocket.CONNECTING);
      expect(get(wsStore).connectionState).toBe(WsConnectionState.CONNECTING);
    });

    it('连接成功时应该更新状态为 CONNECTED', () => {
      service.connect();

      // 模拟连接成功
      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      expect(get(wsStore).connectionState).toBe(WsConnectionState.CONNECTED);
      expect(get(wsStore).error).toBeNull();
    });

    it('已连接时不应该重复连接', () => {
      service.connect();

      // 模拟连接成功
      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const consoleSpy = vi.spyOn(console, 'warn');

      // 尝试再次连接
      service.connect();

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket 已连接');
    });

    it('连接超时时应该触发错误', () => {
      service.connect();

      // 快进到连接超时时间
      vi.advanceTimersByTime(10000);

      expect(get(wsStore).error).toBeTruthy();
    });
  });

  describe('disconnect', () => {
    it('应该断开 WebSocket 连接', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      service.disconnect(true);

      expect(get(wsStore).manualDisconnect).toBe(true);
      expect(get(wsStore).connectionState).toBe(WsConnectionState.DISCONNECTED);
    });

    it('手动断开时应该标记为手动断开', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      service.disconnect(true);

      expect(get(wsStore).manualDisconnect).toBe(true);
    });

    it('非手动断开时不应该标记为手动断开', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      service.disconnect(false);

      expect(get(wsStore).manualDisconnect).toBe(false);
    });
  });

  describe('reconnect', () => {
    it('应该在断开后自动重连', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      // 模拟连接关闭
      ws.onclose?.(new CloseEvent('close', { code: 1006, reason: 'Abnormal close' }));

      expect(get(wsStore).connectionState).toBe(WsConnectionState.RECONNECTING);
      expect(get(wsStore).reconnect.attempts).toBe(1);
    });

    it('手动断开时不应该自动重连', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      service.disconnect(true);

      // 模拟连接关闭
      ws.onclose?.(new CloseEvent('close', { code: 1000, reason: 'Normal close' }));

      expect(get(wsStore).reconnect.attempts).toBe(0);
    });

    it('超过最大重试次数时不应该继续重连', () => {
      // 手动设置重连次数到最大值
      for (let i = 0; i < 10; i++) {
        wsStore.incrementReconnectAttempt();
      }

      const consoleSpy = vi.spyOn(console, 'warn');

      service.reconnect();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('无法重连'),
        expect.any(String)
      );
    });

    it('重连延迟应该使用指数退避算法', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const initialDelay = get(wsStore).reconnect.delay;

      // 第一次断开重连
      ws.onclose?.(new CloseEvent('close', { code: 1006 }));
      const delay1 = get(wsStore).reconnect.delay;

      // 清理并再次重连
      vi.advanceTimersByTime(delay1);
      (service as any).ws = new WebSocket('ws://localhost:51888/ws');
      (service as any).ws.onopen?.(new Event('open'));

      // 第二次断开重连
      (service as any).ws.onclose?.(new CloseEvent('close', { code: 1006 }));
      const delay2 = get(wsStore).reconnect.delay;

      expect(delay1).toBeGreaterThan(initialDelay);
      expect(delay2).toBeGreaterThan(delay1);
    });
  });

  describe('isConnected', () => {
    it('未连接时应该返回 false', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('连接成功时应该返回 true', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      expect(service.isConnected()).toBe(true);
    });
  });

  // ============================================
  // 消息发送测试
  // ============================================

  describe('send', () => {
    it('应该成功发送消息', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const sendSpy = vi.spyOn(ws, 'send');

      service.send('test', { data: 'test data' });

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"test"')
      );
      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"data":{"data":"test data"}')
      );
    });

    it('未连接时不应该发送消息', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      service.send('test', { data: 'test data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket 未连接，无法发送消息'
      );
    });
  });

  // ============================================
  // 消息接收测试
  // ============================================

  describe('message handling', () => {
    it('应该正确处理 STATS_UPDATE 消息', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const mockStats = {
        total_tokens: 1000,
        total_cost: 0.05,
        session_count: 5,
        models: {},
        timestamp: new Date().toISOString(),
      };

      const message = {
        type: WsMessageType.STATS_UPDATE,
        data: {
          stats: mockStats,
          changes: { total_tokens: 100 },
        },
        timestamp: new Date().toISOString(),
      };

      ws.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) })
      );

      expect(get(wsStore).lastStats).toEqual(mockStats);
      expect(get(statsStore).current).toEqual(mockStats);
    });

    it('应该正确处理 DAILY_ACTIVITY_UPDATE 消息', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const mockActivity = {
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

      const message = {
        type: WsMessageType.DAILY_ACTIVITY_UPDATE,
        data: {
          date: '2026-01-07',
          activity: mockActivity,
        },
        timestamp: new Date().toISOString(),
      };

      ws.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) })
      );

      expect(get(wsStore).lastDailyActivity).toEqual(mockActivity);
    });

    it('应该正确处理 NOTIFICATION 消息', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const mockNotification = {
        title: '测试通知',
        message: '这是一条测试通知',
        level: 'info' as const,
      };

      const message = {
        type: WsMessageType.NOTIFICATION,
        data: mockNotification,
        timestamp: new Date().toISOString(),
      };

      ws.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) })
      );

      expect(get(wsStore).lastNotification).toEqual(mockNotification);
    });

    it('应该正确处理 ERROR 消息', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const message = {
        type: WsMessageType.ERROR,
        data: { message: '服务器错误消息' },
        timestamp: new Date().toISOString(),
      };

      ws.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) })
      );

      expect(get(wsStore).error).toBe('服务器错误消息');
    });

    it('应该正确处理 PONG 心跳响应', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const consoleSpy = vi.spyOn(console, 'debug');

      const message = {
        type: WsMessageType.PONG,
        data: {},
        timestamp: new Date().toISOString(),
      };

      ws.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) })
      );

      expect(consoleSpy).toHaveBeenCalledWith('收到心跳响应');
    });

    it('应该处理无效的 JSON 消息', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const consoleSpy = vi.spyOn(console, 'error');

      ws.onmessage?.(new MessageEvent('message', { data: 'invalid json' }));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('解析 WebSocket 消息失败'),
        expect.any(Error)
      );
    });
  });

  // ============================================
  // 心跳检测测试
  // ============================================

  describe('heartbeat', () => {
    it('连接成功后应该启动心跳检测', () => {
      const servicWithHeartbeat = new WebSocketService({
        enableHeartbeat: true,
      });

      servicWithHeartbeat.connect();

      const ws = (servicWithHeartbeat as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const sendSpy = vi.spyOn(ws, 'send');

      // 快进到心跳间隔时间
      vi.advanceTimersByTime(30000);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"')
      );

      servicWithHeartbeat.destroy();
    });

    it('禁用心跳时不应该发送心跳消息', () => {
      const serviceWithoutHeartbeat = new WebSocketService({
        enableHeartbeat: false,
      });

      serviceWithoutHeartbeat.connect();

      const ws = (serviceWithoutHeartbeat as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const sendSpy = vi.spyOn(ws, 'send');

      // 快进到心跳间隔时间
      vi.advanceTimersByTime(30000);

      expect(sendSpy).not.toHaveBeenCalled();

      serviceWithoutHeartbeat.destroy();
    });

    it('心跳超时时应该关闭连接', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const closeSpy = vi.spyOn(ws, 'close');

      // 快进到心跳间隔 + 超时时间
      vi.advanceTimersByTime(30000 + 5000);

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // 自定义消息处理器测试
  // ============================================

  describe('custom message handlers', () => {
    it('应该使用自定义消息处理器', () => {
      const customHandler = vi.fn();

      const serviceWithHandler = new WebSocketService({
        messageHandlers: {
          [WsMessageType.STATS_UPDATE]: customHandler,
        },
      });

      serviceWithHandler.connect();

      const ws = (serviceWithHandler as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      const message = {
        type: WsMessageType.STATS_UPDATE,
        data: { test: 'data' },
        timestamp: new Date().toISOString(),
      };

      ws.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) })
      );

      expect(customHandler).toHaveBeenCalledWith({ test: 'data' });

      serviceWithHandler.destroy();
    });
  });

  // ============================================
  // 单例模式测试
  // ============================================

  describe('singleton pattern', () => {
    it('getWebSocketService 应该返回单例实例', () => {
      const instance1 = getWebSocketService();
      const instance2 = getWebSocketService();

      expect(instance1).toBe(instance2);

      destroyWebSocketService();
    });

    it('destroyWebSocketService 应该销毁单例实例', () => {
      const instance1 = getWebSocketService();
      destroyWebSocketService();
      const instance2 = getWebSocketService();

      expect(instance1).not.toBe(instance2);

      destroyWebSocketService();
    });
  });

  // ============================================
  // 资源清理测试
  // ============================================

  describe('cleanup', () => {
    it('destroy 应该清理所有资源', () => {
      service.connect();

      const ws = (service as any).ws as WebSocket;
      ws.onopen?.(new Event('open'));

      service.destroy();

      expect((service as any).ws).toBeNull();
      expect((service as any).heartbeatTimers.interval).toBeNull();
      expect((service as any).heartbeatTimers.timeout).toBeNull();
      expect((service as any).reconnectTimer).toBeNull();
      expect((service as any).connectionTimer).toBeNull();
    });
  });
});
