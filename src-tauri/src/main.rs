// 在 Windows 生产构建中隐藏控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! @file Tauri 应用主入口
//! @description Claude Token Monitor 桌面应用的 Rust 入口点
//! @author Atlas.oi
//! @date 2026-01-08

fn main() {
    claude_token_monitor_lib::run()
}
