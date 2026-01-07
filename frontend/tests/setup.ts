/**
 * @file Vitest 测试 Setup 文件
 * @description 配置测试环境，包括全局 mock、测试工具和 DOM 扩展
 *              在每个测试文件运行前自动执行
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';

// ============================================
// 关键 Mock 必须在所有导入之前设置
// 使用 vi.hoisted() 确保这些 mock 在模块加载前就已定义
// ============================================

// matchMedia Mock - 必须在 themeStore 导入前设置
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, // 默认不匹配（非暗色模式）
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ============================================
// 全局测试生命周期钩子
// ============================================

/**
 * 每个测试结束后清理 DOM
 * @testing-library/svelte 的 render 会将组件挂载到 DOM
 * 需要在每个测试后清理，避免测试间相互影响
 */
afterEach(() => {
  cleanup();
});

// ============================================
// localStorage Mock
// 用于测试 themeStore 等需要持久化的功能
// ============================================

/**
 * 创建一个内存中的 localStorage mock
 * 支持 getItem、setItem、removeItem、clear 方法
 */
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    // 用于测试时检查存储内容
    _getStore: () => store,
  };
};

// 全局 localStorage mock 实例
let localStorageMock: ReturnType<typeof createLocalStorageMock>;

beforeAll(() => {
  // 初始化 localStorage mock
  localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

beforeEach(() => {
  // 每个测试前清空 localStorage
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ============================================
// Fetch Mock
// 用于测试 API 服务
// ============================================

/**
 * 创建一个可配置的 fetch mock
 * 支持成功响应、错误响应和网络错误
 */
export const createFetchMock = () => {
  return {
    // 模拟成功响应
    mockSuccess: <T>(data: T, status = 200) => {
      return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        headers: new Headers(),
      });
    },

    // 模拟错误响应
    mockError: (status: number, message: string) => {
      return vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: () => Promise.resolve({ error: message }),
        text: () => Promise.resolve(message),
        headers: new Headers(),
      });
    },

    // 模拟网络错误
    mockNetworkError: () => {
      return vi.fn().mockRejectedValue(new Error('Network error'));
    },
  };
};

// 默认 fetch mock（返回空成功响应）
beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  });
});

beforeEach(() => {
  // 重置 fetch mock
  vi.mocked(global.fetch).mockClear();
});

// ============================================
// WebSocket Mock
// 用于测试 WebSocket 服务
// ============================================

/**
 * WebSocket Mock 类
 * 模拟浏览器 WebSocket API，支持连接、消息、关闭等事件
 */
export class MockWebSocket {
  // WebSocket 状态常量
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // 实例属性
  readonly CONNECTING = MockWebSocket.CONNECTING;
  readonly OPEN = MockWebSocket.OPEN;
  readonly CLOSING = MockWebSocket.CLOSING;
  readonly CLOSED = MockWebSocket.CLOSED;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  protocol: string = '';
  extensions: string = '';
  bufferedAmount: number = 0;
  binaryType: BinaryType = 'blob';

  // 事件处理器
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  // 内部状态
  private _sentMessages: unknown[] = [];

  constructor(url: string, _protocols?: string | string[]) {
    this.url = url;

    // 模拟异步连接（下一个事件循环打开连接）
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: unknown): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this._sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        const event = new CloseEvent('close', { code: code ?? 1000, reason: reason ?? '' });
        this.onclose(event);
      }
    }, 0);
  }

  // 测试辅助方法
  addEventListener(_type: string, _listener: EventListener): void {
    // 简化实现，实际使用 on* 属性
  }

  removeEventListener(_type: string, _listener: EventListener): void {
    // 简化实现
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }

  // 测试辅助：获取发送的消息
  getSentMessages(): unknown[] {
    return [...this._sentMessages];
  }

  // 测试辅助：模拟收到消息
  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      const event = new MessageEvent('message', { data: JSON.stringify(data) });
      this.onmessage(event);
    }
  }

  // 测试辅助：模拟连接错误
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// 全局 WebSocket mock
beforeAll(() => {
  // @ts-expect-error - MockWebSocket 实现了 WebSocket 接口的核心方法
  global.WebSocket = MockWebSocket;
});

// ============================================
// 动画帧 Mock
// 用于测试动画效果（如 StatCard 的数字动画）
// ============================================

beforeAll(() => {
  let frameId = 0;
  const callbacks: Map<number, FrameRequestCallback> = new Map();

  // requestAnimationFrame mock
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId;
    callbacks.set(id, callback);
    // 立即执行回调以加速测试
    setTimeout(() => {
      const cb = callbacks.get(id);
      if (cb) {
        callbacks.delete(id);
        cb(performance.now());
      }
    }, 16); // 模拟 60fps
    return id;
  });

  // cancelAnimationFrame mock
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    callbacks.delete(id);
  });
});

// ============================================
// ResizeObserver Mock
// 用于测试响应式组件
// ============================================

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(_target: Element): void {
      // 简化实现：立即触发回调
    }

    unobserve(_target: Element): void {
      // 简化实现
    }

    disconnect(): void {
      // 简化实现
    }
  };
});

// ============================================
// IntersectionObserver Mock
// 用于测试懒加载组件
// ============================================

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    callback: IntersectionObserverCallback;
    root: Element | null = null;
    rootMargin: string = '';
    thresholds: readonly number[] = [];

    constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
      this.callback = callback;
    }

    observe(_target: Element): void {
      // 简化实现
    }

    unobserve(_target: Element): void {
      // 简化实现
    }

    disconnect(): void {
      // 简化实现
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
});

// ============================================
// 测试工具函数
// ============================================

/**
 * 等待指定时间
 * 用于测试异步操作和动画效果
 * @param ms - 等待毫秒数
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 等待下一个事件循环
 * 用于测试 Svelte 响应式更新
 */
export const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * 创建模拟的统计数据
 * 用于测试 statsStore 和相关组件
 */
export const createMockStatsData = () => ({
  current: {
    totalTokens: {
      input: 1000,
      output: 500,
      cacheRead: 200,
      cacheCreation: 50,
    },
    totalCost: 0.0525,
    sessionCount: 10,
    models: {
      'claude-opus-4-5-20251101': {
        input: 500,
        output: 250,
        cacheRead: 100,
        cacheCreation: 25,
        cost: 0.03,
        percentage: 50,
      },
      'claude-sonnet-4-5-20250514': {
        input: 500,
        output: 250,
        cacheRead: 100,
        cacheCreation: 25,
        cost: 0.0225,
        percentage: 50,
      },
    },
  },
  dailyActivities: [
    { date: '2026-01-07', tokens: { input: 1000, output: 500, cacheRead: 200, cacheCreation: 50 }, cost: 0.0525, sessionCount: 10 },
    { date: '2026-01-06', tokens: { input: 800, output: 400, cacheRead: 150, cacheCreation: 30 }, cost: 0.042, sessionCount: 8 },
  ],
});

/**
 * 创建模拟的 WebSocket 消息
 * 用于测试 wsStore 和 WebSocket 服务
 */
export const createMockWsMessage = (type: string, data: unknown) => ({
  type,
  data,
  timestamp: Date.now(),
});

// ============================================
// 控制台警告过滤
// 过滤已知的无害警告，保持测试输出清洁
// ============================================

const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // 过滤 Svelte 的开发模式警告
  console.warn = (...args: unknown[]) => {
    const message = args[0]?.toString() ?? '';
    // 过滤已知警告
    if (message.includes('Unknown prop')) return;
    if (message.includes('accessibility')) return;
    originalWarn(...args);
  };

  // 过滤 React/testing-library 的常见警告
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() ?? '';
    // 过滤 act 警告
    if (message.includes('act(...)')) return;
    if (message.includes('not wrapped in act')) return;
    originalError(...args);
  };
});

afterEach(() => {
  // 恢复原始 console 方法（在测试套件结束时）
});

// ============================================
// 导出全局类型扩展
// ============================================

declare global {
  // 扩展 Window 接口以支持 mock
  interface Window {
    localStorage: ReturnType<typeof createLocalStorageMock>;
  }
}
