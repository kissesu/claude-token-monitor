/**
 * @file provider.rs
 * @description 供应商相关 Tauri Commands
 * @author Atlas.oi
 * @date 2026-01-08
 */

use tauri::State;

use crate::db::Repository;
use crate::models::Provider;

/// 获取供应商列表
#[tauri::command(rename_all = "camelCase")]
pub async fn get_providers(
    db: State<'_, Repository>,
    active_only: Option<bool>,
) -> Result<Vec<Provider>, String> {
    println!(
        "IPC 调用: get_providers, active_only={}",
        active_only.unwrap_or(false)
    );
    db.get_all_providers(active_only.unwrap_or(false))
        .map_err(|e| e.to_string())
}

/// 添加新供应商（手动）
#[tauri::command(rename_all = "camelCase")]
pub async fn add_provider(
    db: State<'_, Repository>,
    api_key: String,
    display_name: Option<String>,
) -> Result<Provider, String> {
    println!(
        "IPC 调用: add_provider, display_name={:?}",
        display_name
    );
    db.create_provider(&api_key, display_name)
        .map_err(|e| e.to_string())
}

/// 删除供应商
#[tauri::command(rename_all = "camelCase")]
pub async fn delete_provider(
    db: State<'_, Repository>,
    provider_id: i64,
) -> Result<(), String> {
    println!("IPC 调用: delete_provider, provider_id={}", provider_id);
    db.delete_provider(provider_id).map_err(|e| e.to_string())
}

/// 更新供应商显示名称
#[tauri::command(rename_all = "camelCase")]
pub async fn update_provider_name(
    db: State<'_, Repository>,
    provider_id: i64,
    display_name: String,
) -> Result<(), String> {
    println!(
        "IPC 调用: update_provider_name, provider_id={}, display_name={}",
        provider_id, display_name
    );
    db.update_provider_display_name(provider_id, &display_name)
        .map_err(|e| e.to_string())
}
