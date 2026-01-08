/**
 * @file Tauri 库入口
 * @description Claude Token Monitor 的 Tauri 库定义和命令注册
 * @author Atlas.oi
 * @date 2026-01-08
 */

use tauri::Manager;

pub mod db;
pub mod models;
pub mod services;

/// 示例 Tauri 命令：返回问候语
/// 后续阶段会替换为真实的数据命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Claude Token Monitor.", name)
}

/// 运行 Tauri 应用
/// 配置插件、注册命令、启动应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ============================================
        // 插件注册
        // ============================================
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        // autostart 插件将在 Phase 7 启用
        // .plugin(tauri_plugin_autostart::init(
        //     tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        //     Some(vec!["--minimized"])
        // ))
        // ============================================
        // 应用初始化
        // ============================================
        .setup(|app| {
            // 获取主窗口（用于后续操作）
            // 使用 if let 避免 panic，提高生产环境稳定性
            if let Some(_main_window) = app.get_webview_window("main") {
                println!("Claude Token Monitor 启动成功！");
            } else {
                eprintln!("警告: 无法获取主窗口，应用将继续运行");
            }

            // 后续阶段会在这里初始化：
            // - 数据库连接
            // - 文件监控服务
            // - 解析服务

            Ok(())
        })
        // ============================================
        // 命令注册
        // ============================================
        .invoke_handler(tauri::generate_handler![
            greet,
            // 后续阶段会添加：
            // get_current_stats,
            // get_today_provider_stats,
            // get_daily_activities,
            // get_providers,
            // update_provider_name,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
