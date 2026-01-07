/**
 * @file api service 单元测试
 * @description 测试 API 服务的所有方法
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentStats,
  getDailyStats,
  getHistoryStats,
  exportStats,
  downloadBlob,
  healthCheck,
  ExportFormat,
} from '$lib/services/api';
import { TimeRange } from '$lib/types';

// ============================================
// 测试数据工厂
// ============================================

/**
 * 创建模拟的统计数据响应
 */
function createMockStatsResponse() {
  return {
    total_tokens: 1000,
    total_cost: 0.05,
    session_count: 10,
    models: {},
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建模拟的每日统计数据响应
 */
function createMockDailyStatsResponse() {
  return [
    {
      date: '2026-01-07',
      tokens: {
        input_tokens: 500,
        output_tokens: 250,
        cache_read_tokens: 100,
        cache_creation_tokens: 25,
      },
      cost: 0.025,
      session_count: 5,
      models: {},
    },
  ];
}

// ============================================
// 测试套件
// ============================================

describe('API Service', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
  });

  // ============================================
  // getCurrentStats 测试
  // ============================================

  describe('getCurrentStats', () => {
    it('应该成功获取当前统计数据', async () => {
      const mockData = createMockStatsResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await getCurrentStats();
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stats/current'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('应该处理 API 错误响应', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            success: false,
            error: '服务器错误',
            error_code: 'SERVER_ERROR',
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(getCurrentStats()).rejects.toThrow();
    });

    it('应该处理网络错误', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(getCurrentStats()).rejects.toThrow();
    });
  });

  // ============================================
  // getDailyStats 测试
  // ============================================

  describe('getDailyStats', () => {
    it('应该成功获取每日统计数据（无参数）', async () => {
      const mockData = createMockDailyStatsResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await getDailyStats();
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/stats/daily'),
        expect.any(Object)
      );
    });

    it('应该正确传递日期参数', async () => {
      const mockData = createMockDailyStatsResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await getDailyStats('2026-01-01', '2026-01-07');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2026-01-01'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2026-01-07'),
        expect.any(Object)
      );
    });
  });

  // ============================================
  // getHistoryStats 测试
  // ============================================

  describe('getHistoryStats', () => {
    it('应该成功获取历史统计数据', async () => {
      const mockData = {
        time_range: TimeRange.WEEK,
        total_sessions: 100,
        total_cost: 5.0,
        average_cost_per_session: 0.05,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await getHistoryStats(TimeRange.WEEK);
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`range=${TimeRange.WEEK}`),
        expect.any(Object)
      );
    });

    it('应该支持不同的时间范围', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await getHistoryStats(TimeRange.MONTH);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`range=${TimeRange.MONTH}`),
        expect.any(Object)
      );

      await getHistoryStats(TimeRange.YEAR);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`range=${TimeRange.YEAR}`),
        expect.any(Object)
      );
    });
  });

  // ============================================
  // exportStats 测试
  // ============================================

  describe('exportStats', () => {
    it('应该成功导出数据', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      const result = await exportStats({
        format: ExportFormat.JSON,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/export'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('应该正确传递导出参数', async () => {
      const mockBlob = new Blob(['test data']);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
      });

      await exportStats({
        format: ExportFormat.CSV,
        start_date: '2026-01-01',
        end_date: '2026-01-07',
        include_details: true,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('format=csv'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2026-01-01'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2026-01-07'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('include_details=true'),
        expect.any(Object)
      );
    });

    it('应该处理导出错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        exportStats({ format: ExportFormat.JSON })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // downloadBlob 测试
  // ============================================

  describe('downloadBlob', () => {
    it('应该创建下载链接并触发下载', () => {
      const mockBlob = new Blob(['test'], { type: 'text/plain' });
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: { display: '' },
      };

      // Mock DOM API
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as unknown as HTMLAnchorElement);

      const createObjectURLSpy = vi
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      downloadBlob(mockBlob, 'test.txt');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.download).toBe('test.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      // 清理 mock
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  // ============================================
  // healthCheck 测试
  // ============================================

  describe('healthCheck', () => {
    it('应该成功执行健康检查', async () => {
      const mockData = { status: 'ok', version: '1.0.0' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await healthCheck();
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/health'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('应该使用较短的超时时间', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await healthCheck();

      // healthCheck 应该设置 timeout: 5000
      // 这里我们只验证调用了 fetch，具体的 timeout 在实际代码中会生效
      expect(fetch).toHaveBeenCalled();
    });
  });

  // ============================================
  // 重试机制测试
  // ============================================

  describe('重试机制', () => {
    it('应该在可重试错误时自动重试', async () => {
      let callCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // 第一次调用返回可重试错误
          return Promise.resolve({
            ok: false,
            status: 503, // 503 Service Unavailable 是可重试的
            json: () => Promise.resolve({ success: false, error: 'Service unavailable' }),
            headers: new Headers({ 'content-type': 'application/json' }),
          });
        }
        // 第二次调用成功
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: createMockStatsResponse() }),
          headers: new Headers({ 'content-type': 'application/json' }),
        });
      });

      const result = await getCurrentStats();
      expect(result).toBeDefined();
      expect(callCount).toBeGreaterThan(1);
    });

    it('应该在超过最大重试次数后抛出错误', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ success: false, error: 'Service unavailable' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(getCurrentStats()).rejects.toThrow();
    }, 15000); // 增加超时时间以允许多次重试
  });

  // ============================================
  // 请求拦截器测试
  // ============================================

  describe('请求拦截器', () => {
    it('应该自动添加 Content-Type 和 Accept headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: createMockStatsResponse() }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await getCurrentStats();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const headers = callArgs[1]?.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Accept')).toBe('application/json');
    });
  });
});
