/**
 * @file stats.rs
 * @description 统计相关 Tauri Commands
 * @author Atlas.oi
 * @date 2026-01-08
 */
use tauri::State;

use crate::db::Repository;
use crate::models::{DailyActivity, ProviderStats, StatsCache, TodayStats};

/// 获取当前统计数据
#[tauri::command]
pub async fn get_current_stats(db: State<'_, Repository>) -> Result<StatsCache, String> {
    println!("IPC 调用: get_current_stats");
    db.get_current_stats().map_err(|e| e.to_string())
}

/// 获取今日各供应商统计
#[tauri::command]
pub async fn get_today_provider_stats(
    db: State<'_, Repository>,
) -> Result<Vec<ProviderStats>, String> {
    println!("IPC 调用: get_today_provider_stats");
    db.get_today_provider_stats().map_err(|e| e.to_string())
}

/// 获取今日汇总统计
#[tauri::command]
pub async fn get_today_stats(db: State<'_, Repository>) -> Result<TodayStats, String> {
    println!("IPC 调用: get_today_stats");
    db.get_today_stats().map_err(|e| e.to_string())
}

/// 获取每日活动记录
#[tauri::command(rename_all = "camelCase")]
pub async fn get_daily_activities(
    db: State<'_, Repository>,
    start_date: String,
    end_date: String,
) -> Result<Vec<DailyActivity>, String> {
    println!(
        "IPC 调用: get_daily_activities, start_date={}, end_date={}",
        start_date, end_date
    );
    db.get_daily_activities(&start_date, &end_date)
        .map_err(|e| e.to_string())
}
