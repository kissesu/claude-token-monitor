/**
 * @file file_watcher.rs
 * @description 文件监控服务，监听 Claude CLI 数据目录变更
 * @author Atlas.oi
 * @date 2026-01-08
 */

use notify::{Event, RecursiveMode, Watcher};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum FileWatcherError {
    #[error("Failed to create watcher: {0}")]
    WatcherCreation(#[from] notify::Error),
    #[error("Home directory not found")]
    HomeDirNotFound,
}

pub struct FileWatcher {
    claude_dir: PathBuf,
    watcher: notify::RecommendedWatcher,
}

impl FileWatcher {
    /// 创建文件监控服务
    pub fn new(app: AppHandle) -> Result<Self, FileWatcherError> {
        let claude_dir = dirs::home_dir()
            .ok_or(FileWatcherError::HomeDirNotFound)?
            .join(".claude");

        let watcher = notify::recommended_watcher(move |event: Result<Event, _>| {
            if let Ok(event) = event {
                match event.kind {
                    notify::EventKind::Modify(_) | notify::EventKind::Create(_) => {
                        println!("检测到文件变更: {:?}", event.paths);
                        let _ = app.emit("file-changed", event.paths);
                    }
                    _ => {}
                }
            }
        })?;

        Ok(Self { claude_dir, watcher })
    }

    /// 启动监控
    pub fn start(&mut self) -> Result<(), FileWatcherError> {
        // 监控 settings.json
        self.watcher
            .watch(&self.claude_dir.join("settings.json"), RecursiveMode::NonRecursive)?;

        // 监控 projects 目录
        self.watcher
            .watch(&self.claude_dir.join("projects"), RecursiveMode::Recursive)?;

        // 监控 stats-cache.json（可选）
        let stats_cache = self.claude_dir.join("stats-cache.json");
        if stats_cache.exists() {
            self.watcher
                .watch(&stats_cache, RecursiveMode::NonRecursive)?;
        }

        println!("文件监控已启动: {}", self.claude_dir.display());

        Ok(())
    }
}
