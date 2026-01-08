import { create } from 'zustand';
import { AppState, LogEntry } from '../types/store';
// import { invoke } from '@tauri-apps/api/core'; // Tauri 2.0
// import { StatsCache, Provider } from '../types/tauri';

export const useAppStore = create<AppState>((set) => ({
  stats: null,
  dailyActivities: [],
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
      // TODO: Replace with actual Tauri invoke
      // const stats = await invoke<StatsCache>('get_stats');
      // set({ stats });
      
      // Mock data for Phase 3 visual verification
      set(() => ({
        stats: {
          total_input_tokens: 800230,
          total_output_tokens: 400120,
          total_cache_read_tokens: 2500000,
          total_cache_creation_tokens: 100000,
          total_cost_usd: 29.96,
          total_sessions: 24,
          total_messages: 1450,
          cache_hit_rate: 0.845,
          models: [],
          updated_at: new Date().toISOString()
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
