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
