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

export function useTauriEvents(handlers: TauriEventHandlers) {
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];

    const setupListeners = async () => {
      const unlistenStats = await listen<StatsCache>('stats-updated', (event) => {
        handlers.onStatsUpdated?.(event.payload);
      });
      unlisteners.push(unlistenStats);

      const unlistenProvider = await listen<Provider>('provider-switched', (event) => {
        handlers.onProviderSwitched?.(event.payload);
      });
      unlisteners.push(unlistenProvider);

      const unlistenFile = await listen<string[]>('file-changed', (event) => {
        handlers.onFileChanged?.(event.payload);
      });
      unlisteners.push(unlistenFile);
    };

    setupListeners();

    return () => {
      unlisteners.forEach((fn) => fn());
      unlisteners.length = 0;
    };
  }, [handlers]);
}
