/**
 * @file useTauriCommand.ts
 * @description Tauri 命令调用封装
 * @author Atlas.oi
 * @date 2026-01-08
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  AddProviderArgs,
  DailyActivity,
  DeleteProviderArgs,
  GetDailyActivitiesArgs,
  GetProvidersArgs,
  Provider,
  ProviderStats,
  StatsCache,
  TodayStats,
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

/**
 * 验证日期活动查询参数
 * @param args - 查询参数，包含 startDate 和 endDate
 * @throws {Error} 当参数无效时抛出错误
 */
function assertDailyActivitiesArgs(args: GetDailyActivitiesArgs) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const { startDate, endDate } = args;

  if (!startDate || !endDate) {
    throw new Error('get_daily_activities 需要提供 startDate 和 endDate');
  }

  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    throw new Error('get_daily_activities 仅支持 YYYY-MM-DD 格式日期');
  }

  if (startDate > endDate) {
    throw new Error('get_daily_activities 的 startDate 不能晚于 endDate');
  }
}

export const tauriCommands = {
  getCurrentStats: () => invokeCommand<StatsCache>('get_current_stats'),

  getTodayProviderStats: () =>
    invokeCommand<ProviderStats[]>('get_today_provider_stats'),

  getTodayStats: () => invokeCommand<TodayStats>('get_today_stats'),

  getDailyActivities: (args: GetDailyActivitiesArgs) => {
    assertDailyActivitiesArgs(args);
    return invokeCommand<DailyActivity[]>('get_daily_activities', { ...args });
  },

  getProviders: (args?: GetProvidersArgs) =>
    invokeCommand<Provider[]>('get_providers', { ...args }),

  addProvider: (args: AddProviderArgs) =>
    invokeCommand<Provider>('add_provider', { ...args }),

  deleteProvider: (args: DeleteProviderArgs) =>
    invokeCommand<void>('delete_provider', { ...args }),

  updateProviderName: (args: UpdateProviderNameArgs) =>
    invokeCommand<void>('update_provider_name', { ...args })
};
