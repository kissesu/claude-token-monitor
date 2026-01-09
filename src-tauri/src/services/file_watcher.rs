/**
 * @file file_watcher.rs
 * @description 文件监控服务，监听 Claude CLI 数据目录变更
 * @author Atlas.oi
 * @date 2026-01-08
 */

use notify::{Event, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};
use thiserror::Error;

use crate::db::Repository;
use crate::services::parser::{parse_jsonl_line, parse_settings};

#[derive(Error, Debug)]
pub enum FileWatcherError {
    #[error("Failed to create watcher: {0}")]
    WatcherCreation(#[from] notify::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Home directory not found")]
    HomeDirNotFound,
}

pub struct FileWatcher {
    claude_dir: PathBuf,
    watcher: notify::RecommendedWatcher,
    app: AppHandle,
}

impl FileWatcher {
    /// 创建文件监控服务
    pub fn new(app: AppHandle) -> Result<Self, FileWatcherError> {
        let claude_dir = dirs::home_dir()
            .ok_or(FileWatcherError::HomeDirNotFound)?
            .join(".claude");

        let app_handle = app.clone();
        let watcher = notify::recommended_watcher(move |event: Result<Event, _>| {
            match event {
                Ok(event) => {
                    match event.kind {
                        notify::EventKind::Modify(_) | notify::EventKind::Create(_) => {
                            println!("检测到文件变更: {:?}", event.paths);
                            let paths = event.paths.clone();
                            let _ = app_handle.emit("file-changed", paths.clone());
                            let app_handle = app_handle.clone();
                            std::thread::spawn(move || {
                                if let Err(error) = handle_file_changes(&app_handle, &paths) {
                                    eprintln!("文件变更处理失败: {}", error);
                                }
                            });
                        }
                        _ => {}
                    }
                }
                Err(e) => {
                    eprintln!("文件监控事件错误: {}", e);
                }
            }
        })?;

        Ok(Self {
            claude_dir,
            watcher,
            app,
        })
    }

    /// 启动监控
    pub fn start(&mut self) -> Result<(), FileWatcherError> {
        if !self.claude_dir.exists() {
            std::fs::create_dir_all(&self.claude_dir)?;
        }

        self.watcher
            .watch(&self.claude_dir, RecursiveMode::Recursive)?;

        println!("文件监控已启动: {}", self.claude_dir.display());
        let app = self.app.clone();
        let claude_dir = self.claude_dir.clone();
        std::thread::spawn(move || {
            if let Err(error) = scan_existing_files(&app, &claude_dir) {
                eprintln!("启动扫描失败: {}", error);
            }
        });

        Ok(())
    }
}

fn scan_existing_files(app: &AppHandle, claude_dir: &Path) -> Result<(), FileWatcherError> {
    let mut paths = Vec::new();
    collect_relevant_files(claude_dir, &mut paths)?;
    if paths.is_empty() {
        return Ok(());
    }
    handle_file_changes(app, &paths)
}

fn collect_relevant_files(dir: &Path, paths: &mut Vec<PathBuf>) -> Result<(), FileWatcherError> {
    if !dir.exists() {
        return Ok(());
    }
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            collect_relevant_files(&path, paths)?;
        } else if is_settings_file(&path) || is_jsonl_file(&path) {
            paths.push(path);
        }
    }
    Ok(())
}
/// 处理文件变更
///
/// 业务逻辑：
/// 1. 解析 settings.json 更新供应商信息
/// 2. 解析 JSONL 文件记录消息使用数据
/// 3. 发送事件通知前端刷新
fn handle_file_changes(app: &AppHandle, paths: &[PathBuf]) -> Result<(), FileWatcherError> {
    let repository = app.state::<Repository>();
    let mut updated_stats = false;
    let mut skipped_lines = 0;

    // 处理 settings.json 文件
    let mut updated_provider = None;
    for path in paths {
        if is_settings_file(path) {
            match std::fs::read_to_string(path) {
                Ok(content) => {
                    match parse_settings(&content) {
                        Ok(settings) => {
                            match repository.upsert_provider(&settings.api_key, settings.base_url) {
                                Ok(provider) => {
                                    println!("供应商信息已更新: {}", provider.api_key_prefix);
                                    updated_provider = Some(provider);
                                }
                                Err(e) => {
                                    eprintln!("供应商更新失败 [{}]: {}", path.display(), e);
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Settings 解析失败 [{}]: {}", path.display(), e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("文件读取失败 [{}]: {}", path.display(), e);
                }
            }
        }
    }

    if let Some(provider) = updated_provider.clone() {
        if let Err(e) = app.emit("provider-switched", provider) {
            eprintln!("发送 provider-switched 事件失败: {}", e);
        }
    }

    let active_provider = if let Some(provider) = updated_provider {
        Some(provider)
    } else {
        repository.get_active_provider().ok().flatten()
    };

    // 处理 JSONL 文件
    if let Some(provider) = active_provider {
        for path in paths {
            if is_jsonl_file(path) {
                match std::fs::read_to_string(path) {
                    Ok(content) => {
                        for line in content.lines() {
                            match parse_jsonl_line(line) {
                                Ok(Some(record)) => {
                                    match repository.insert_message_usage(provider.id, &record) {
                                        Ok(_) => {
                                            updated_stats = true;
                                        }
                                        Err(e) => {
                                            // 重复记录是正常情况，不记录为错误
                                            if !e.to_string().contains("duplicate") {
                                                eprintln!("消息记录插入失败: {}", e);
                                            }
                                        }
                                    }
                                }
                                Ok(None) => {
                                    // 非消息行（如系统日志），正常跳过
                                    skipped_lines += 1;
                                }
                                Err(e) => {
                                    eprintln!("JSONL 行解析失败 [{}]: {}", path.display(), e);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("JSONL 文件读取失败 [{}]: {}", path.display(), e);
                    }
                }
            }
        }
    }

    // 记录跳过的行数（调试用）
    if skipped_lines > 0 {
        println!("跳过 {} 行非消息数据", skipped_lines);
    }

    if updated_stats {
        match repository.get_current_stats() {
            Ok(stats) => {
                if let Err(e) = app.emit("stats-updated", stats) {
                    eprintln!("发送 stats-updated 事件失败: {}", e);
                }
            }
            Err(e) => {
                eprintln!("获取统计数据失败: {}", e);
            }
        }
    }

    Ok(())
}

fn is_settings_file(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name == "settings.json")
        .unwrap_or(false)
}

fn is_jsonl_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("jsonl"))
        .unwrap_or(false)
}
