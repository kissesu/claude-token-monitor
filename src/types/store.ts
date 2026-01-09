import { StatsCache, Provider, DailyActivity, ProviderStats, TodayStats } from './tauri';

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
  todayStats: TodayStats | null;
  
  // Providers
  providers: Provider[];
  providerStats: ProviderStats[];
  activeProviderId: number | null;
  
  // Logs
  logs: LogEntry[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  fetchProviders: () => Promise<void>;
  updateProviderName: (id: number, name: string) => Promise<void>;
  addProvider: (apiKey: string, name?: string) => Promise<void>;
  deleteProvider: (id: number) => Promise<void>;
  addLog: (log: LogEntry) => void;
  setError: (error: string | null) => void;
}
