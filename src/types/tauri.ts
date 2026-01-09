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

export interface TodayStats {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  cost_usd: number;
  session_count: number;
  message_count: number;
  cache_hit_rate: number;
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
  today_cache_creation_tokens: number;
  today_cost_usd: number;
  cache_hit_rate: number;
}

/**
 * Tauri 命令参数类型
 * 注意：参数名使用 camelCase，Rust 端通过 #[tauri::command(rename_all = "camelCase")] 处理转换
 */
export interface GetDailyActivitiesArgs {
  startDate: string;
  endDate: string;
}

export interface AddProviderArgs {
  apiKey: string;
  displayName?: string;
}

export interface UpdateProviderNameArgs {
  providerId: number;
  displayName: string;
}

export interface DeleteProviderArgs {
  providerId: number;
}

export interface GetProvidersArgs {
  activeOnly?: boolean;
}
