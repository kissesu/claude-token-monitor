/**
 * @file useTauriEvents.ts
 * @description Tauri 事件监听封装
 * @author Atlas.oi
 * @date 2026-01-08
 */

import { useEffect } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { Provider, StatsCache } from '@/types/tauri';

export interface TauriEventHandlers {
  onStatsUpdated?: (payload: StatsCache) => void;
  onProviderSwitched?: (payload: Provider) => void;
  onFileChanged?: (paths: string[]) => void;
}

/**
 * 监听 Tauri 后端发送的事件
 *
 * 使用示例：
 * ```typescript
 * const handlers = useMemo(() => ({
 *   onStatsUpdated: (stats) => console.log('统计更新', stats),
 *   onFileChanged: () => fetchStats()
 * }), [fetchStats]);
 *
 * useTauriEvents(handlers);
 * ```
 *
 * @param handlers - 事件处理函数集合，需使用 useMemo 包装避免重复订阅
 */
export function useTauriEvents(handlers: TauriEventHandlers) {
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    let isCleanedUp = false;

    const setupListeners = async () => {
      try {
        const unlistenStats = await listen<StatsCache>('stats-updated', (event) => {
          handlers.onStatsUpdated?.(event.payload);
        });
        if (!isCleanedUp) unlisteners.push(unlistenStats);

        const unlistenProvider = await listen<Provider>('provider-switched', (event) => {
          handlers.onProviderSwitched?.(event.payload);
        });
        if (!isCleanedUp) unlisteners.push(unlistenProvider);

        const unlistenFile = await listen<string[]>('file-changed', (event) => {
          handlers.onFileChanged?.(event.payload);
        });
        if (!isCleanedUp) unlisteners.push(unlistenFile);
      } catch (error) {
        // Tauri 事件监听器设置失败，记录错误但不阻断应用
        console.error('Tauri 事件监听器设置失败:', error);
      }
    };

    setupListeners();

    return () => {
      isCleanedUp = true;
      unlisteners.forEach((fn) => fn());
    };
  }, [handlers]);
}
