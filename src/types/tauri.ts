/**
 * @file tauri.ts
 * @description Tauri IPC 类型定义
 * @author Atlas.oi
 * @date 2026-01-08
 */

export interface ModelUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  cost_usd: number;
  message_count: number;
}

export interface StatsCache {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_read_tokens: number;
  total_cache_creation_tokens: number;
  total_cost_usd: number;
  total_sessions: number;
  total_messages: number;
  cache_hit_rate: number;
  models: ModelUsage[];
  updated_at: string;
}

export interface DailyActivity {
  date: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  session_count: number;
  message_count: number;
}

export interface Provider {
  id: number;
  api_key_hash: string;
  api_key_prefix: string;
  display_name?: string | null;
  base_url?: string | null;
  is_active: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export interface ProviderStats {
  provider: Provider;
  today_input_tokens: number;
  today_output_tokens: number;
  today_cache_read_tokens: number;
  today_cost_usd: number;
  cache_hit_rate: number;
}

export interface GetDailyActivitiesArgs {
  start_date: string;
  end_date: string;
}

export interface UpdateProviderNameArgs {
  provider_id: number;
  display_name: string;
}

export interface GetProvidersArgs {
  active_only?: boolean;
}
