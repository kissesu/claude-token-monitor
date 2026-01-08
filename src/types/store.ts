import { StatsCache, Provider, DailyActivity } from './tauri';

export interface LogEntry {
  id: string;
  timestamp: string;
  model: string;
  context: string;
  cost: number;
}

export interface AppState {
  // Stats
  stats: StatsCache | null;
  dailyActivities: DailyActivity[];
  todayStats: {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cost_usd: number;
    cache_hit_rate: number;
  } | null;
  
  // Providers
  providers: Provider[];
  activeProviderId: number | null;
  
  // Logs
  logs: LogEntry[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  fetchProviders: () => Promise<void>;
  addLog: (log: LogEntry) => void;
  setError: (error: string | null) => void;
}
