/**
 * @file useTauriCommand.ts
 * @description Tauri 命令调用封装
 * @author Atlas.oi
 * @date 2026-01-08
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  DailyActivity,
  GetDailyActivitiesArgs,
  GetProvidersArgs,
  Provider,
  ProviderStats,
  StatsCache,
  UpdateProviderNameArgs
} from '@/types/tauri';

export async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Command ${command} failed:`, error);
    throw error;
  }
}

function assertDailyActivitiesArgs(args: GetDailyActivitiesArgs) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const { start_date, end_date } = args;

  if (!start_date || !end_date) {
    throw new Error('get_daily_activities 需要提供 start_date 和 end_date');
  }

  if (!datePattern.test(start_date) || !datePattern.test(end_date)) {
    throw new Error('get_daily_activities 仅支持 YYYY-MM-DD 格式日期');
  }

  if (start_date > end_date) {
    throw new Error('get_daily_activities 的 start_date 不能晚于 end_date');
  }
}

export const tauriCommands = {
  getCurrentStats: () => invokeCommand<StatsCache>('get_current_stats'),

  getTodayProviderStats: () =>
    invokeCommand<ProviderStats[]>('get_today_provider_stats'),

  getDailyActivities: (args: GetDailyActivitiesArgs) => {
    assertDailyActivitiesArgs(args);
    return invokeCommand<DailyActivity[]>('get_daily_activities', { ...args });
  },

  getProviders: (args?: GetProvidersArgs) =>
    invokeCommand<Provider[]>('get_providers', { ...args }),

  updateProviderName: (args: UpdateProviderNameArgs) =>
    invokeCommand<void>('update_provider_name', { ...args })
};
