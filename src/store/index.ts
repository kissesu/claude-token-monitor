import { create } from 'zustand';
import { AppState, LogEntry } from '../types/store';
import { tauriCommands } from '../hooks/useTauriCommand';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';

function debugLog(...args: unknown[]) {
  if (!DEBUG) return;
  console.log('[DEBUG]', ...args);
}

export const useAppStore = create<AppState>((set, get) => ({
  stats: null,
  dailyActivities: [],
  todayStats: null,
  providers: [],
  providerStats: [],
  activeProviderId: null,
  logs: [],
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      debugLog('fetchStats start');
      const stats = await tauriCommands.getCurrentStats();
      // 获取今日各供应商统计，用于 Providers 页面展示和 Dashboard 汇总
      const providerStats = await tauriCommands.getTodayProviderStats();
      const todayStats = await tauriCommands.getTodayStats();

      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const today = new Date();
      const endDate = formatLocalDate(today);
      const startDate = formatLocalDate(
        new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
      );
      const dailyActivities = await tauriCommands.getDailyActivities({
        startDate,
        endDate
      });
      debugLog('fetchStats success', {
        providers: providerStats.length,
        dailyActivities: dailyActivities.length
      });

      // 找出当前活跃的 Provider ID
      const activeProvider = providerStats.find(p => p.provider.is_active);

      set(() => ({
        stats,
        dailyActivities,
        providerStats, // 保存到 State
        providers: providerStats.map(p => p.provider), // 同时也更新 providers 列表
        activeProviderId: activeProvider ? activeProvider.provider.id : null,
        todayStats
      }));
    } catch (e) {
      debugLog('fetchStats error', e);
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProviders: async () => {
    // 这个方法可能不再需要单独调用，因为 fetchStats 已经覆盖了
    // 但保留作为特定刷新的入口
    try {
      debugLog('fetchProviders start');
      const providerStats = await tauriCommands.getTodayProviderStats();
      set({ 
        providerStats,
        providers: providerStats.map(p => p.provider)
      });
      debugLog('fetchProviders success', { providers: providerStats.length });
    } catch (e) {
      debugLog('fetchProviders error', e);
      set({ error: (e as Error).message });
    }
  },

  updateProviderName: async (id: number, name: string) => {
    try {
      debugLog('updateProviderName', { id, name });
      await tauriCommands.updateProviderName({
        providerId: id,
        displayName: name
      });
      // 乐观更新
      set(state => ({
        providers: state.providers.map(p => p.id === id ? { ...p, display_name: name } : p),
        providerStats: state.providerStats.map(p => p.provider.id === id ? { ...p, provider: { ...p.provider, display_name: name } } : p)
      }));
      // 可以在这里重新 fetch 以确保一致性
    } catch (e) {
      debugLog('updateProviderName error', e);
      set({ error: (e as Error).message });
    }
  },

  addProvider: async (apiKey: string, name?: string) => {
    try {
      debugLog('addProvider', { apiKeyPrefix: apiKey.slice(0, 8) });
      await tauriCommands.addProvider({ apiKey, displayName: name });
      // 刷新数据以获取最新统计（虽然刚添加的统计为0）
      get().fetchStats();
    } catch (e) {
      debugLog('addProvider error', e);
      set({ error: (e as Error).message });
      throw e; // 让 UI 捕获错误
    }
  },

  deleteProvider: async (id: number) => {
    try {
      debugLog('deleteProvider', { id });
      await tauriCommands.deleteProvider({ providerId: id });
      // 乐观更新：从列表中移除
      set(state => ({
        providers: state.providers.filter(p => p.id !== id),
        providerStats: state.providerStats.filter(p => p.provider.id !== id)
      }));
    } catch (e) {
      debugLog('deleteProvider error', e);
      set({ error: (e as Error).message });
    }
  },

  addLog: (log: LogEntry) => {
    set((state) => ({ logs: [log, ...state.logs].slice(0, 50) }));
  },

  setError: (error: string | null) => set({ error }),

  setActiveProviderId: (id: number | null) => set({ activeProviderId: id })
}));
