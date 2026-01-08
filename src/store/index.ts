import { create } from 'zustand';
import { AppState, LogEntry } from '../types/store';
import { tauriCommands } from '../hooks/useTauriCommand';

export const useAppStore = create<AppState>((set) => ({
  stats: null,
  dailyActivities: [],
  todayStats: null,
  providers: [],
  activeProviderId: null,
  logs: [
    // Mock initial log for UI dev
    {
      id: '1',
      timestamp: '10:42:15',
      model: 'Sonnet 3.5',
      context: 'claude-monitor / fix-ui-bug',
      cost: 0.084
    }
  ],
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await tauriCommands.getCurrentStats();
      const todayProviderStats = await tauriCommands.getTodayProviderStats();
      const today = new Date();
      const end_date = today.toISOString().slice(0, 10);
      const start_date = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const dailyActivities = await tauriCommands.getDailyActivities({
        start_date,
        end_date
      });

      const todayTotals = todayProviderStats.reduce(
        (acc, item) => ({
          input_tokens: acc.input_tokens + item.today_input_tokens,
          output_tokens: acc.output_tokens + item.today_output_tokens,
          cache_read_tokens: acc.cache_read_tokens + item.today_cache_read_tokens,
          cost_usd: acc.cost_usd + item.today_cost_usd
        }),
        {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_tokens: 0,
          cost_usd: 0
        }
      );

      const total_tokens = todayTotals.cache_read_tokens + todayTotals.input_tokens;
      const cache_hit_rate = total_tokens > 0 ? todayTotals.cache_read_tokens / total_tokens : 0;

      set(() => ({
        stats,
        dailyActivities,
        todayStats: {
          ...todayTotals,
          cache_hit_rate
        }
      }));
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProviders: async () => {
    try {
      // const providers = await invoke<Provider[]>('get_providers');
      // set({ providers });
    } catch (e) {
      console.error(e);
    }
  },

  addLog: (log: LogEntry) => {
    set((state) => ({ logs: [log, ...state.logs].slice(0, 50) }));
  },

  setError: (error: string | null) => set({ error })
}));
