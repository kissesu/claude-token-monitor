# Claude Token Monitor - Tauri 2.x 桌面端重构方案

> **文档版本**: v1.1.0
> **创建日期**: 2026-01-08
> **最后更新**: 2026-01-08
> **作者**: Atlas.oi
> **项目**: Claude Token Monitor 桌面端重构

---

## 一、项目概述

### 1.1 重构目标

将 Claude Token Monitor 从 **Web 应用**（Python FastAPI + Svelte）重构为 **Tauri 2.x 桌面端应用**（Rust + React），实现轻量级、高性能的本地 Token 监控工具。

### 1.2 为什么选择 Tauri 2.x

| 特性 | Tauri 2.x | Electron | 说明 |
|------|-----------|----------|------|
| 打包体积 | ~3-10MB | ~150MB+ | Tauri 使用系统 WebView |
| 内存占用 | ~30-50MB | ~150-300MB | 无 Chromium 开销 |
| 启动速度 | <1s | 2-5s | Rust 原生性能 |
| 安全性 | 高 | 中 | 默认最小权限 |
| 跨平台 | macOS/Windows/Linux | 同 | 原生系统集成 |

### 1.3 核心架构变更

```
┌──────────────────────────────────────────────────────────────┐
│                       旧架构 (Web)                            │
├──────────────────────────────────────────────────────────────┤
│  Browser  ←→  FastAPI (Python)  ←→  SQLite                   │
│            HTTP/WebSocket                                     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    新架构 (Tauri Desktop)                     │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    React Frontend                        │ │
│  │  (WebView - 系统原生渲染引擎)                            │ │
│  └────────────────────────┬────────────────────────────────┘ │
│                           │ IPC (invoke/events)              │
│  ┌────────────────────────┴────────────────────────────────┐ │
│  │                    Tauri Core (Rust)                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │FileWatch │ │ Parser   │ │ Database │ │ Commands   │  │ │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Handler    │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│  ┌────────────────────────┴────────────────────────────────┐ │
│  │              ~/.claude/ (本地文件系统)                   │ │
│  │  settings.json | projects/*/*.jsonl | stats-cache.json  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、技术栈

### 2.1 核心技术

| 模块 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 桌面框架 | Tauri | 2.x | 轻量级跨平台桌面框架 |
| 后端语言 | Rust | 1.75+ | 高性能、内存安全 |
| 前端框架 | React | 19.x | 最新版本，支持 Compiler |
| 构建工具 | Vite | 5.x | 快速开发体验 |
| 样式方案 | TailwindCSS | 3.4.x | 原子化 CSS |
| UI 组件库 | shadcn/ui | latest | 基于 Radix UI，高质量可访问组件 |
| 状态管理 | Zustand | 5.x | 轻量级状态管理 |
| 图表库 | Recharts | 2.x | React 原生图表 |
| 数据库 | SQLite | - | Rust rusqlite 驱动 |
| 类型安全 | TypeScript | 5.x | 前端类型安全 |

### 2.2 Tauri 2.x 核心依赖

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
tauri-plugin-autostart = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.31", features = ["bundled"] }
notify = "6"  # 文件监控
chrono = "0.4"
sha2 = "0.10"  # API Key 哈希
dirs = "5"    # 跨平台用户目录
thiserror = "1"  # 错误处理
```

### 2.3 前端依赖

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "@tauri-apps/plugin-autostart": "^2.0.0",
    "zustand": "^5.0.0",
    "recharts": "^2.14.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "vite": "^5.4.0"
  }
}
```

> **关于 shadcn/ui**：不是 npm 包，而是通过 CLI 复制组件源码到项目中。
> 初始化：`npx shadcn@latest init`
> 添加组件：`npx shadcn@latest add button dialog dropdown-menu toast`

---

## 三、目标项目结构

```
claude-token-monitor/
├── src-tauri/                      # Tauri Rust 后端
│   ├── Cargo.toml                  # Rust 依赖配置
│   ├── tauri.conf.json             # Tauri 配置
│   ├── capabilities/               # 权限配置
│   │   └── default.json
│   ├── icons/                      # 应用图标
│   └── src/
│       ├── main.rs                 # 应用入口
│       ├── lib.rs                  # 库入口
│       ├── commands/               # Tauri Commands (IPC)
│       │   ├── mod.rs
│       │   ├── stats.rs            # 统计数据命令
│       │   ├── provider.rs         # 供应商管理命令
│       │   └── settings.rs         # 设置命令
│       ├── services/               # 核心服务
│       │   ├── mod.rs
│       │   ├── file_watcher.rs     # 文件监控服务
│       │   ├── parser.rs           # JSONL 解析服务
│       │   ├── provider_tracker.rs # 供应商跟踪服务
│       │   └── pricing.rs          # 价格计算服务
│       ├── db/                     # 数据库层
│       │   ├── mod.rs
│       │   ├── schema.rs           # 数据库 Schema
│       │   ├── migrations.rs       # 数据库迁移
│       │   └── repository.rs       # 数据仓库
│       └── models/                 # 数据模型
│           ├── mod.rs
│           ├── stats.rs
│           ├── provider.rs
│           └── message.rs
│
├── src/                            # React 前端
│   ├── main.tsx                    # React 入口
│   ├── App.tsx                     # 主应用组件
│   ├── App.css                     # 全局样式
│   ├── index.css                   # TailwindCSS 入口
│   ├── vite-env.d.ts
│   │
│   ├── types/                      # TypeScript 类型
│   │   ├── stats.ts
│   │   ├── provider.ts
│   │   ├── tauri.ts                # Tauri IPC 类型
│   │   └── index.ts
│   │
│   ├── stores/                     # Zustand 状态管理
│   │   ├── useStatsStore.ts
│   │   ├── useProviderStore.ts
│   │   ├── useThemeStore.ts
│   │   └── index.ts
│   │
│   ├── hooks/                      # React Hooks
│   │   ├── useTauriEvents.ts       # Tauri 事件监听
│   │   ├── useTauriCommand.ts      # Tauri 命令调用
│   │   ├── useTheme.ts
│   │   └── index.ts
│   │
│   ├── components/                 # React 组件
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx         # 桌面端侧边栏
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── index.ts
│   │   ├── common/
│   │   │   ├── StatCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── index.ts
│   │   ├── charts/
│   │   │   ├── TrendChart.tsx
│   │   │   ├── CostChart.tsx
│   │   │   ├── ModelPieChart.tsx
│   │   │   ├── ActivityHeatmap.tsx
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── ModelUsagePanel.tsx
│   │   │   ├── CostEstimatePanel.tsx
│   │   │   ├── DailyActivityPanel.tsx
│   │   │   └── index.ts
│   │   └── provider/               # 供应商相关组件
│   │       ├── ProviderSelector.tsx
│   │       ├── ProviderStatsCard.tsx
│   │       ├── TodayOverview.tsx
│   │       └── index.ts
│   │
│   └── __tests__/                  # 测试文件
│
├── public/                         # 静态资源
├── index.html                      # HTML 入口
├── vite.config.ts                  # Vite 配置
├── tailwind.config.js              # TailwindCSS 配置
├── tsconfig.json                   # TypeScript 配置
├── package.json                    # 前端依赖
└── docs/                           # 项目文档
    └── tauri-desktop-plan.md       # 本文档
```

### 3.1 Tauri 2.x 权限配置 (Capabilities)

> **⚠️ 安全重点**：Tauri 2.x 默认关闭所有文件访问权限，必须显式配置。
> 这是 Tauri 比 Electron 更安全的核心原因。

```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Claude Token Monitor 默认权限",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "notification:default",
    {
      "identifier": "fs:allow-read-text-file",
      "allow": [
        { "path": "$HOME/.claude/**" }
      ]
    },
    {
      "identifier": "fs:allow-exists",
      "allow": [
        { "path": "$HOME/.claude/**" }
      ]
    },
    {
      "identifier": "fs:allow-watch",
      "allow": [
        { "path": "$HOME/.claude/**" }
      ]
    },
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled"
  ]
}
```

> **跨平台路径说明**：Claude CLI 在所有平台统一使用 `~/.claude` 目录。
> `$HOME` 在 Tauri 中会自动解析为各平台的用户主目录：
> - macOS: `/Users/<username>/.claude`
> - Windows: `C:\Users\<username>\.claude`
> - Linux: `/home/<username>/.claude`

**权限说明**：

| 权限 | 用途 | 范围限制 |
|------|------|----------|
| `fs:allow-read-text-file` | 读取配置和 JSONL 文件 | 仅 `~/.claude/**` |
| `fs:allow-exists` | 检查文件是否存在 | 仅 `~/.claude/**` |
| `fs:allow-watch` | 监控文件变更 | 仅 `~/.claude/**` |
| `notification:default` | 发送系统通知 | 无限制 |
| `autostart:*` | 开机自启动控制 | 无限制 |

**跨平台路径说明**：
- `$HOME` 在 Tauri 中会自动解析为各平台的用户目录
- macOS: `/Users/<username>`
- Windows: `C:\Users\<username>`
- Linux: `/home/<username>`

---

## 三点五、数据源与数据流说明

### 3.5.1 数据源层级

| 层级 | 数据源 | 用途 | 持久性 |
|------|--------|------|--------|
| L1 | `settings.json` | 当前活跃的 API Key 和 Base URL | Claude CLI 配置 |
| L2 | `projects/*/*.jsonl` | 会话级别的详细 Token 使用记录 | 会话历史 |
| L3 | `stats-cache.json` | Claude CLI 汇总统计（可选） | 临时缓存 |
| L4 | 本地 SQLite | 应用自建的持久化数据 | 主数据源 |

### 3.5.2 get_providers 命令说明

**数据源**：本地 SQLite 数据库 `providers` 表

**筛选规则**：
- 返回所有已发现的供应商记录
- 按 `last_seen_at` 降序排列（最近使用的在前）
- 可选参数 `active_only` 仅返回当前活跃供应商

**供应商发现机制**：
1. 应用启动时读取 `settings.json`，提取 `ANTHROPIC_AUTH_TOKEN`
2. 对 API Key 计算 SHA256 哈希，查询数据库是否已存在
3. 若不存在则新建记录；若存在则更新 `last_seen_at`
4. 当 `settings.json` 变更时触发 `provider-switched` 事件

**provider-switched 事件触发条件**：
- `settings.json` 文件被修改
- 文件内的 `ANTHROPIC_AUTH_TOKEN` 值发生变化
- 新 API Key 哈希与数据库中当前活跃供应商不同

### 3.5.3 stats-cache.json 的角色

> **设计决策**：`stats-cache.json` 作为**可选数据源**，用于兼容旧版本和快速启动。

| 场景 | 行为 |
|------|------|
| 文件存在 | 启动时读取作为初始展示数据，后续以数据库为准 |
| 文件不存在 | 完全依赖数据库，无影响 |
| 数据库已有历史 | 忽略 stats-cache.json，以数据库为权威 |

**后续优化**：
- Phase 2 完成后可评估是否移除此监控项
- 若 JSONL 解析足够稳定，可在 v1.1 版本中删除 stats-cache.json 依赖

---

## 四、核心功能模块

### 4.1 文件监控服务 (Rust)

```rust
// src-tauri/src/services/file_watcher.rs

use notify::{Watcher, RecursiveMode, Event};
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
    /// 监控的文件类型
    /// - settings.json: 供应商切换检测
    /// - projects/*/*.jsonl: 会话消息记录
    /// - stats-cache.json: 统计缓存（可选，用于兼容旧版本）
    pub fn new(app: AppHandle) -> Result<Self, FileWatcherError> {
        let claude_dir = dirs::home_dir()
            .ok_or(FileWatcherError::HomeDirNotFound)?
            .join(".claude");

        let watcher = notify::recommended_watcher(move |event: Result<Event, _>| {
            if let Ok(event) = event {
                match event.kind {
                    notify::EventKind::Modify(_) => {
                        // 发送事件到前端
                        app.emit("file-changed", event.paths).ok();
                    }
                    _ => {}
                }
            }
        })?;

        Ok(Self { claude_dir, watcher })
    }

    pub fn start(&mut self) -> Result<(), FileWatcherError> {
        // 监控 settings.json（供应商切换检测）
        self.watcher.watch(
            &self.claude_dir.join("settings.json"),
            RecursiveMode::NonRecursive
        )?;

        // 监控 projects 目录（会话 JSONL 文件）
        self.watcher.watch(
            &self.claude_dir.join("projects"),
            RecursiveMode::Recursive
        )?;

        // 监控 stats-cache.json（统计缓存，可选）
        // 注意：后续版本可能仅依赖数据库，此监控项可移除
        let stats_cache = self.claude_dir.join("stats-cache.json");
        if stats_cache.exists() {
            self.watcher.watch(&stats_cache, RecursiveMode::NonRecursive)?;
        }

        Ok(())
    }
}
```

### 4.2 Tauri Commands (IPC 接口)

```rust
// src-tauri/src/commands/stats.rs

use tauri::State;
use crate::db::Repository;
use crate::models::{StatsCache, DailyActivity, ProviderStats, Provider};

/// 获取当前统计数据
#[tauri::command]
pub async fn get_current_stats(
    db: State<'_, Repository>
) -> Result<StatsCache, String> {
    db.get_current_stats()
        .map_err(|e| e.to_string())
}

/// 获取今日各供应商统计
#[tauri::command]
pub async fn get_today_provider_stats(
    db: State<'_, Repository>
) -> Result<Vec<ProviderStats>, String> {
    db.get_today_provider_stats()
        .map_err(|e| e.to_string())
}

/// 获取每日活动记录
#[tauri::command]
pub async fn get_daily_activities(
    db: State<'_, Repository>,
    start_date: String,
    end_date: String
) -> Result<Vec<DailyActivity>, String> {
    db.get_daily_activities(&start_date, &end_date)
        .map_err(|e| e.to_string())
}

/// 更新供应商显示名称
#[tauri::command]
pub async fn update_provider_name(
    db: State<'_, Repository>,
    provider_id: i64,
    display_name: String
) -> Result<(), String> {
    db.update_provider_display_name(provider_id, &display_name)
        .map_err(|e| e.to_string())
}

/// 获取供应商列表
#[tauri::command]
pub async fn get_providers(
    db: State<'_, Repository>,
    active_only: Option<bool>
) -> Result<Vec<Provider>, String> {
    match active_only {
        Some(true) => db.get_active_providers(),
        _ => db.get_all_providers(),
    }
    .map_err(|e| e.to_string())
}
```

### 4.3 前端 Tauri 事件监听

> **⚠️ React 19 + StrictMode 注意事项**：
> React 19 的 StrictMode 在开发模式下会运行两次 Effect。
> 如果不正确清理 Tauri 事件监听器，会导致：
> 1. 事件被重复注册（一次文件变动触发两次更新）
> 2. 内存泄漏（组件卸载后监听器仍在运行）
>
> **解决方案**：必须在 cleanup 函数中调用所有 `unlisten` 函数。

```typescript
// src/hooks/useTauriEvents.ts

import { useEffect, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useStatsStore } from '@/stores';
import { useProviderStore } from '@/stores';
import type { StatsCache, Provider } from '@/types';

/**
 * 监听 Tauri 后端事件
 * - file-changed: 文件变更通知
 * - stats-updated: 统计数据更新
 * - provider-switched: 供应商切换
 *
 * 注意：正确处理 React StrictMode 下的双重挂载和异步竞态
 */
export function useTauriEvents() {
  const { refreshStats } = useStatsStore();
  // 使用 ref 防止 StrictMode 下重复注册
  const isSetup = useRef(false);

  useEffect(() => {
    // 防止 StrictMode 双重注册
    if (isSetup.current) return;
    isSetup.current = true;

    // 取消标记，用于处理异步竞态
    let cancelled = false;
    const unlisteners: UnlistenFn[] = [];

    const setupListeners = async () => {
      // 监听统计数据更新
      const unlisten1 = await listen<StatsCache>('stats-updated', (event) => {
        if (!cancelled) {
          useStatsStore.getState().setCurrent(event.payload);
        }
      });
      if (!cancelled) unlisteners.push(unlisten1);

      // 监听供应商切换
      const unlisten2 = await listen<Provider>('provider-switched', (event) => {
        if (!cancelled) {
          useProviderStore.getState().setActiveProvider(event.payload);
        }
      });
      if (!cancelled) unlisteners.push(unlisten2);

      // 监听文件变更
      const unlisten3 = await listen<string[]>('file-changed', () => {
        if (!cancelled) {
          refreshStats();
        }
      });
      if (!cancelled) unlisteners.push(unlisten3);
    };

    setupListeners();

    // ⚠️ 关键：cleanup 函数必须正确清理所有监听器并处理异步竞态
    return () => {
      cancelled = true;
      isSetup.current = false;
      // 同步清理所有已注册的监听器
      unlisteners.forEach(fn => fn());
      // 清空数组防止重复清理
      unlisteners.length = 0;
    };
  }, [refreshStats]);
}
```

### 4.4 前端调用 Tauri Commands

```typescript
// src/hooks/useTauriCommand.ts

import { invoke } from '@tauri-apps/api/core';
import type { StatsCache, ProviderStats, DailyActivity, Provider } from '@/types';

/**
 * 调用 Tauri 后端命令
 */
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

// 封装常用命令
export const tauriCommands = {
  getCurrentStats: () => invokeCommand<StatsCache>('get_current_stats'),

  getTodayProviderStats: () =>
    invokeCommand<ProviderStats[]>('get_today_provider_stats'),

  getDailyActivities: (startDate: string, endDate: string) =>
    invokeCommand<DailyActivity[]>('get_daily_activities', {
      start_date: startDate,
      end_date: endDate
    }),

  getProviders: (activeOnly?: boolean) =>
    invokeCommand<Provider[]>('get_providers', { active_only: activeOnly }),

  updateProviderName: (providerId: number, displayName: string) =>
    invokeCommand<void>('update_provider_name', {
      provider_id: providerId,
      display_name: displayName
    }),
};
```

---

## 五、数据库设计

### 5.1 Schema (SQLite)

```sql
-- 供应商表
CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_hash TEXT NOT NULL UNIQUE,     -- SHA256 哈希
    api_key_prefix TEXT NOT NULL,          -- 前 8 字符
    display_name TEXT,                      -- 用户自定义名称
    base_url TEXT,                          -- API Base URL
    is_active INTEGER DEFAULT 0,            -- 是否当前活跃
    first_seen_at TEXT NOT NULL,            -- 首次发现时间
    last_seen_at TEXT NOT NULL              -- 最后使用时间
);

-- 消息使用记录表
CREATE TABLE IF NOT EXISTS message_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,               -- 会话 UUID
    message_id TEXT NOT NULL,               -- 消息 UUID
    model TEXT NOT NULL,                    -- 模型名称
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- 每日统计汇总表
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    date TEXT NOT NULL,                     -- YYYY-MM-DD
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cache_read_tokens INTEGER DEFAULT 0,
    total_cache_creation_tokens INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    UNIQUE(provider_id, date),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- 供应商切换日志表
CREATE TABLE IF NOT EXISTS provider_switch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    switched_at TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_message_usage_provider ON message_usage(provider_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_created ON message_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_provider ON daily_stats(provider_id);
```

---

## 六、分阶段实施计划

### 阶段总览

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Phase 0 │ 项目初始化      │ Tauri 2.x 项目骨架，React 可启动                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 1 │ Rust 后端核心   │ 文件监控、解析、数据库基础                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 2 │ IPC 通信层      │ Tauri Commands + Events，前后端打通             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 3 │ React 基础架构  │ 类型、Store、布局、主题                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 4 │ 核心数据展示    │ StatCard、数据表格、实时更新                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 5 │ 供应商功能      │ 供应商管理、今日统计、切换追踪                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 6 │ 图表可视化      │ TrendChart、PieChart、Heatmap                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 7 │ 系统托盘与自启  │ 托盘图标、最小化到托盘、开机自启动              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 8 │ 测试与打包      │ 单元测试、E2E 测试、跨平台打包                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 依赖关系图

```
P0 (初始化)
 └─→ P1 (Rust 后端)
      └─→ P2 (IPC 层)
           └─→ P3 (React 架构)
                └─→ P4 (数据展示) ─→ P5 (供应商) ─→ P6 (图表)
                                                      └─→ P7 (托盘/自启)
                                                           └─→ P8 (测试打包)
```

---

### Phase 0: 项目初始化

**目标**: Tauri 2.x 项目骨架可运行

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P0-1 | 归档旧项目结构 | - | `legacy_archive/` 目录（保留参考） |
| P0-2 | 初始化 Tauri 2.x | P0-1 | `src-tauri/`、`tauri.conf.json` |
| P0-3 | 初始化 React 前端 | P0-2 | `src/main.tsx`、`src/App.tsx`、Vite 配置 |
| P0-4 | 配置 TailwindCSS | P0-3 | `tailwind.config.js`、`index.css` |
| P0-5 | 验证项目启动 | P0-4 | `pnpm tauri dev` 成功运行 |

#### P0-1: 归档旧项目结构

> **重要提示**：不直接删除旧代码！在重构过程中需要参考旧的 Python 逻辑（Token 计算、解析逻辑）。

**归档步骤**：
```bash
# 1. 确认 Git 状态干净
git status

# 2. 创建归档目录并移动旧代码
mkdir -p legacy_archive
mv backend/ legacy_archive/
mv frontend/ legacy_archive/
mv docker/ legacy_archive/ 2>/dev/null || true

# 3. 保留 .gitignore 中的归档目录（可选择不提交）
echo "legacy_archive/" >> .gitignore

# 4. 提交归档操作
git add .
git commit -m "chore: 归档旧 Web 架构代码到 legacy_archive/"
```

- [ ] **创建归档目录**：`mkdir -p legacy_archive`
- [ ] **移动 `backend/`**：Python FastAPI 后端（保留 Token 计算逻辑参考）
- [ ] **移动 `frontend/`**：Svelte 前端（保留 UI 布局参考）
- [ ] **移动 `docker/`**：Docker 相关配置
- [ ] **更新 `.gitignore`**：添加 `legacy_archive/`（可选）
- [ ] **清理 Makefile**：移除旧的启动命令

#### P0-2: 初始化 Tauri 2.x 项目
- [ ] 安装 Tauri CLI: `pnpm add -D @tauri-apps/cli`
- [ ] 初始化项目: `pnpm tauri init`
- [ ] 配置 `tauri.conf.json`
  - 应用名称: Claude Token Monitor
  - 窗口尺寸: 1200x800
  - 开发服务器端口: 51173

#### P0-3: 初始化 React 前端
- [ ] 创建 `src/main.tsx`
- [ ] 创建 `src/App.tsx`（Hello Tauri）
- [ ] 配置 `vite.config.ts`
- [ ] 配置 TailwindCSS

#### P0-4: 验证项目启动
- [ ] `pnpm tauri dev` 启动成功
- [ ] 桌面窗口显示 React 页面
- [ ] 开发热更新正常

**验收标准**: 桌面窗口显示 React 页面，热更新正常

#### 运行验证

```bash
# 启动开发服务器
pnpm tauri dev
```

**预期效果**:
- [ ] 桌面窗口正常打开（1200x800）
- [ ] 显示 "Hello Tauri" React 页面
- [ ] 修改 `src/App.tsx` 后自动热更新
- [ ] 控制台无 Rust 编译错误
- [ ] 控制台无前端构建错误

**检查清单**:
```bash
# 验证 Rust 编译
cd src-tauri && cargo check

# 验证前端构建
pnpm build

# 验证 Tauri 配置
pnpm tauri info
```

---

### Phase 1: Rust 后端核心

**目标**: 文件监控、解析、数据库基础功能完成

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P1-1 | 数据库模块 | P0 完成 | `db/schema.rs`、`db/migrations.rs`、`db/repository.rs` |
| P1-2 | 文件监控服务 | P1-1 | `services/file_watcher.rs` |
| P1-3 | 解析服务 | P1-1 | `services/parser.rs` (settings.json + JSONL) |
| P1-4 | 供应商跟踪服务 | P1-3 | `services/provider_tracker.rs` |
| P1-5 | 价格计算服务 | P1-1 | `services/pricing.rs` |
| P1-6 | 数据模型定义 | P0 完成 | `models/stats.rs`、`models/provider.rs`、`models/message.rs` |
| P1-7 | Rust 单元测试 | P1-1~P1-6 | 各服务测试通过 |

**关键依赖库**:
```toml
notify = "6"           # 文件监控
rusqlite = "0.31"      # SQLite
sha2 = "0.10"          # API Key 哈希
tokio = "1"            # 异步运行时
```

#### P1-1: 数据库模块
- [ ] 创建 `src-tauri/src/db/schema.rs`
- [ ] 实现数据库初始化和迁移
- [ ] 实现基础 CRUD 操作
- [ ] 单元测试

#### P1-2: 文件监控服务
- [ ] 创建 `src-tauri/src/services/file_watcher.rs`
- [ ] 实现 `~/.claude/settings.json` 监控
- [ ] 实现 `~/.claude/projects/*/*.jsonl` 监控
- [ ] 文件变更事件发射

#### P1-3: 解析服务
- [ ] 创建 `src-tauri/src/services/parser.rs`
- [ ] 实现 settings.json 解析（提取 API Key）
- [ ] 实现 JSONL 消息解析（提取 Token 使用）
- [ ] API Key 哈希处理

#### P1-4: 供应商跟踪服务
- [ ] 创建 `src-tauri/src/services/provider_tracker.rs`
- [ ] 实现供应商识别和切换检测
- [ ] 实现消息-供应商关联

#### P1-5: 价格计算服务
- [ ] 创建 `src-tauri/src/services/pricing.rs`
- [ ] 实现各模型价格计算
- [ ] 缓存 Token 价格折扣

**验收标准**: 所有 Rust 服务单元测试通过

#### 运行验证

```bash
# 启动开发服务器（保持后端服务运行）
pnpm tauri dev
```

**预期效果**:
- [ ] 应用启动时自动初始化 SQLite 数据库
- [ ] 文件监控服务开始监听 `~/.claude/` 目录
- [ ] 控制台输出文件变更事件日志
- [ ] 修改 `~/.claude/settings.json` 触发事件

**检查清单**:
```bash
# 运行 Rust 单元测试
cd src-tauri && cargo test

# 验证数据库文件创建（按平台）
# macOS:   ~/Library/Application Support/com.claude-token-monitor/
# Windows: %APPDATA%\com.claude-token-monitor\
# Linux:   ~/.local/share/com.claude-token-monitor/
# 使用 Rust 代码获取: tauri::api::path::app_data_dir()

# 检查日志输出
pnpm tauri dev 2>&1 | grep -E "(file_watcher|parser|db)"
```

**临时调试 UI**（确保后端可运行）:
- 在 `App.tsx` 添加简单的状态展示
- 显示数据库连接状态
- 显示文件监控状态

---

### Phase 2: IPC 通信层

**目标**: Tauri Commands + Events 打通前后端

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P2-1 | Tauri Commands 定义 | P1 完成 | `commands/stats.rs`、`commands/provider.rs` |
| P2-2 | Tauri Events 定义 | P2-1 | `stats-updated`、`provider-switched`、`file-changed` |
| P2-3 | 前端类型定义 | P2-1 | `src/types/tauri.ts` |
| P2-4 | 前端调用封装 | P2-3 | `src/hooks/useTauriCommand.ts`、`useTauriEvents.ts` |

**Commands 清单**:

| Command | 功能 | 参数 | 返回 |
|---------|------|------|------|
| `get_current_stats` | 获取当前统计 | - | `StatsCache` |
| `get_today_provider_stats` | 今日供应商统计 | - | `ProviderStats[]` |
| `get_daily_activities` | 每日活动记录 | `start_date`, `end_date` | `DailyActivity[]` |
| `get_providers` | 供应商列表 | - | `Provider[]` |
| `update_provider_name` | 更新供应商名称 | `provider_id`, `display_name` | `void` |

**Events 清单**:

| Event | 触发条件 | Payload |
|-------|----------|---------|
| `stats-updated` | 统计数据更新 | `StatsCache` |
| `provider-switched` | 供应商切换 | `Provider` |
| `file-changed` | 文件变更 | `string[]` (路径列表) |

#### P2-1: 定义 Tauri Commands
- [ ] `get_current_stats` - 获取当前统计
- [ ] `get_today_provider_stats` - 获取今日供应商统计
- [ ] `get_daily_activities` - 获取每日活动
- [ ] `get_providers` - 获取供应商列表
- [ ] `update_provider_name` - 更新供应商名称

#### P2-2: 定义 Tauri Events
- [ ] `stats-updated` - 统计数据更新
- [ ] `provider-switched` - 供应商切换
- [ ] `file-changed` - 文件变更通知

#### P2-3: 前端类型定义
- [ ] 创建 `src/types/tauri.ts`
- [ ] 定义 Command 参数和返回类型
- [ ] 定义 Event payload 类型

#### P2-4: 前端 Hooks
- [ ] 创建 `src/hooks/useTauriCommand.ts`
- [ ] 创建 `src/hooks/useTauriEvents.ts`

**验收标准**: 前端可成功调用 Tauri Commands 并接收 Events

---

### Phase 3: React 基础架构

**目标**: 类型、Store、布局、主题系统完成

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P3-1 | 类型定义 | P2 完成 | `types/stats.ts`、`types/provider.ts` |
| P3-2 | Zustand Stores | P3-1 | `stores/useStatsStore.ts`、`useProviderStore.ts`、`useThemeStore.ts` |
| P3-3 | 布局组件 - Header | P3-2 | `components/layout/Header.tsx` |
| P3-4 | 布局组件 - Sidebar | P3-2 | `components/layout/Sidebar.tsx` (桌面端导航) |
| P3-5 | 主题系统 | P3-2 | `hooks/useTheme.ts`、`ThemeToggle.tsx` |
| P3-6 | App 集成 | P3-3~P3-5 | 更新 `App.tsx`，整合布局和主题 |

#### P3-1: 类型定义
- [ ] 创建 `src/types/stats.ts`
- [ ] 创建 `src/types/provider.ts`
- [ ] 创建 `src/types/index.ts`

#### P3-2: Zustand Stores
- [ ] 创建 `src/stores/useStatsStore.ts`
- [ ] 创建 `src/stores/useProviderStore.ts`
- [ ] 创建 `src/stores/useThemeStore.ts`

#### P3-3: 布局组件
- [ ] 创建 `src/components/layout/Header.tsx`
- [ ] 创建 `src/components/layout/Sidebar.tsx`（桌面端导航）
- [ ] 创建 `src/components/layout/ThemeToggle.tsx`

#### P3-4: 主题系统
- [ ] 创建 `src/hooks/useTheme.ts`
- [ ] 实现暗色/亮色模式切换
- [ ] localStorage 持久化

#### P3-5: App 集成
- [ ] 更新 `App.tsx` 使用布局组件
- [ ] 集成主题系统
- [ ] 集成 Tauri 事件监听

**验收标准**: 应用有完整布局，主题切换正常，Store 响应式更新

---

### Phase 4: 核心数据展示

**目标**: StatCard、数据表格、实时更新

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P4-1 | StatCard 组件 | P3 完成 | `components/common/StatCard.tsx` |
| P4-2 | DataTable 组件 | P3 完成 | `components/common/DataTable.tsx` |
| P4-3 | Loading/Error 组件 | P3 完成 | `LoadingSpinner.tsx`、`ErrorMessage.tsx` |
| P4-4 | StatsOverview 面板 | P4-1 | `dashboard/StatsOverview.tsx` (4 列 StatCard) |
| P4-5 | ModelUsagePanel | P4-2 | `dashboard/ModelUsagePanel.tsx` (模型用量表格) |
| P4-6 | DailyActivityPanel | P4-2 | `dashboard/DailyActivityPanel.tsx` (日期选择 + 列表) |
| P4-7 | CostEstimatePanel | P4-1, P4-2 | `dashboard/CostEstimatePanel.tsx` (费用汇总) |

**StatsOverview 显示指标**:
- 总 Token 数
- 总费用 (USD)
- 会话数
- 缓存命中率

#### P4-1: 通用组件
- [ ] 创建 `src/components/common/StatCard.tsx`
- [ ] 创建 `src/components/common/DataTable.tsx`
- [ ] 创建 `src/components/common/LoadingSpinner.tsx`
- [ ] 创建 `src/components/common/ErrorMessage.tsx`

#### P4-2: StatsOverview 面板
- [ ] 创建 `src/components/dashboard/StatsOverview.tsx`
- [ ] 4 列 StatCard 网格
- [ ] 显示：总 Token、总费用、会话数、缓存命中率

#### P4-3: ModelUsagePanel
- [ ] 创建 `src/components/dashboard/ModelUsagePanel.tsx`
- [ ] 模型使用数据表格
- [ ] 排序功能

#### P4-4: DailyActivityPanel
- [ ] 创建 `src/components/dashboard/DailyActivityPanel.tsx`
- [ ] 日期范围选择
- [ ] 每日活动列表

#### P4-5: CostEstimatePanel
- [ ] 创建 `src/components/dashboard/CostEstimatePanel.tsx`
- [ ] 费用汇总
- [ ] 费用明细表格

**验收标准**: Dashboard 显示真实数据，实时更新正常

---

### Phase 5: 供应商功能

**目标**: 供应商管理、今日统计、切换追踪

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P5-1 | ProviderSelector | P4 完成 | `provider/ProviderSelector.tsx` (下拉选择) |
| P5-2 | ProviderStatsCard | P4-1 | `provider/ProviderStatsCard.tsx` (单供应商统计) |
| P5-3 | TodayOverview | P5-1, P5-2 | `provider/TodayOverview.tsx` (今日各供应商对比) |
| P5-4 | 供应商命名编辑 | P5-1 | 编辑 display_name，实时更新 UI |

#### P5-1: 供应商选择器
- [ ] 创建 `src/components/provider/ProviderSelector.tsx`
- [ ] 下拉选择当前供应商
- [ ] 显示 API Key 前缀和自定义名称

#### P5-2: 供应商统计卡片
- [ ] 创建 `src/components/provider/ProviderStatsCard.tsx`
- [ ] 单个供应商的今日统计
- [ ] 缓存命中率进度条

#### P5-3: 今日总览面板
- [ ] 创建 `src/components/provider/TodayOverview.tsx`
- [ ] 今日各供应商统计对比
- [ ] 快速切换视图

#### P5-4: 供应商命名
- [ ] 编辑供应商显示名称
- [ ] 实时更新 UI

**验收标准**: 可按供应商筛选统计，自定义命名持久化

---

### Phase 6: 图表可视化

**目标**: TrendChart、PieChart、Heatmap

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P6-1 | Recharts 配置 | P4 完成 | 主题配色、响应式配置 |
| P6-2 | TrendChart | P6-1 | `charts/TrendChart.tsx` (Token 趋势折线图) |
| P6-3 | CostChart | P6-1 | `charts/CostChart.tsx` (费用柱状图，按模型堆叠) |
| P6-4 | ModelPieChart | P6-1 | `charts/ModelPieChart.tsx` (模型占比环形图) |
| P6-5 | ActivityHeatmap | P6-1 | `charts/ActivityHeatmap.tsx` (GitHub 风格热力图) |

#### P6-1: Recharts 配置
- [ ] 安装 recharts
- [ ] 配置图表主题（颜色、字体）

#### P6-2: TrendChart
- [ ] 创建 `src/components/charts/TrendChart.tsx`
- [ ] Token 使用趋势折线图
- [ ] 多系列支持

#### P6-3: CostChart
- [ ] 创建 `src/components/charts/CostChart.tsx`
- [ ] 费用趋势柱状图
- [ ] 按模型堆叠

#### P6-4: ModelPieChart
- [ ] 创建 `src/components/charts/ModelPieChart.tsx`
- [ ] 模型占比饼图/环形图
- [ ] 图例交互

#### P6-5: ActivityHeatmap
- [ ] 创建 `src/components/charts/ActivityHeatmap.tsx`
- [ ] GitHub 风格日历热力图
- [ ] 指标切换

**验收标准**: 所有图表响应式显示，交互正常

---

### Phase 7: 系统托盘与开机自启动

**目标**: 实现后台运行、托盘图标、开机自启动

> **设计理念**：作为"监控器"，用户通常希望它在后台默默工作，而不是一直占据任务栏。

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P7-1 | 系统托盘基础 | P6 完成 | 托盘图标、右键菜单 |
| P7-2 | 窗口行为控制 | P7-1 | 关闭窗口 = 最小化到托盘 |
| P7-3 | 托盘状态指示 | P7-1 | 托盘图标显示连接状态 |
| P7-4 | 开机自启动 | P7-1 | 设置页面开关、autostart 插件 |
| P7-5 | 前端设置页面 | P7-4 | 设置面板 UI |

#### P7-1: 系统托盘基础

**Rust 后端配置**：
```rust
// src-tauri/src/main.rs
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 创建托盘菜单
            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // 创建托盘图标
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Claude Token Monitor")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] 添加托盘图标资源（16x16, 32x32）
- [ ] 创建托盘右键菜单（显示窗口、退出）
- [ ] 单击托盘图标显示窗口

#### P7-2: 窗口行为控制

```rust
// 在 setup 中添加窗口关闭事件处理
.on_window_event(|window, event| {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        // 阻止默认关闭行为，改为隐藏窗口
        api.prevent_close();
        window.hide().unwrap();
    }
})
```

- [ ] 拦截窗口关闭事件
- [ ] 关闭窗口时隐藏到托盘而非退出
- [ ] 托盘菜单"退出"才真正退出应用

#### P7-3: 托盘状态指示

- [ ] 正常状态：默认图标
- [ ] 监控中：带绿点图标
- [ ] 错误状态：带红点图标
- [ ] 动态更新托盘 tooltip 显示今日统计

#### P7-4: 开机自启动

**Cargo.toml 依赖**：
```toml
[dependencies]
tauri-plugin-autostart = "2"
```

**Rust 配置**：
```rust
// src-tauri/src/main.rs
use tauri_plugin_autostart::MacosLauncher;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]) // 启动时最小化到托盘
        ))
        // ...
}
```

**前端调用**：
```typescript
// src/hooks/useAutostart.ts
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

export function useAutostart() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    isEnabled().then(setEnabled);
  }, []);

  const toggle = async () => {
    if (enabled) {
      await disable();
    } else {
      await enable();
    }
    setEnabled(!enabled);
  };

  return { enabled, toggle };
}
```

- [ ] 安装 `tauri-plugin-autostart`
- [ ] 配置 macOS LaunchAgent
- [ ] 配置 Windows 注册表启动项
- [ ] 配置 Linux XDG autostart

#### P7-5: 前端设置页面

- [ ] 创建 `src/components/settings/SettingsPanel.tsx`
- [ ] 开机自启动开关
- [ ] 最小化到托盘开关
- [ ] 通知设置

**验收标准**:
- 关闭窗口后应用继续在托盘运行
- 开机自启动可正常开启/关闭
- 托盘图标正确显示状态

---

### Phase 8: 测试与打包

**目标**: 单元测试、E2E 测试、跨平台打包

| 任务 ID | 任务描述 | 依赖 | 交付物 |
|---------|----------|------|--------|
| P7-1 | Rust 单元测试 | P1 完成 | 数据库、解析、价格计算测试 |
| P7-2 | React 单元测试 | P4 完成 | Store、Hook、组件测试 |
| P7-3 | E2E 测试 | P6 完成 | Playwright 配置、启动/数据/主题测试 |
| P7-4 | macOS 打包 | P7-1~P7-3 | DMG 安装包 (Intel + Apple Silicon) |
| P7-5 | Windows 打包 | P7-1~P7-3 | NSIS 安装包 |
| P7-6 | Linux 打包 | P7-1~P7-3 | AppImage / deb 包 |
| P7-7 | CI/CD 配置 | P7-4~P7-6 | GitHub Actions 自动构建发布 |

#### P7-1: Rust 单元测试
- [ ] 数据库操作测试
- [ ] 解析服务测试
- [ ] 价格计算测试

#### P7-2: React 单元测试
- [ ] Store 测试
- [ ] Hook 测试
- [ ] 组件测试

#### P7-3: E2E 测试
- [ ] 配置 Playwright
- [ ] 应用启动测试
- [ ] 数据加载测试
- [ ] 主题切换测试

#### P7-4: 跨平台打包
- [ ] macOS DMG 打包
- [ ] Windows NSIS 安装包
- [ ] Linux AppImage/deb 打包

#### P7-5: CI/CD 配置
- [ ] GitHub Actions 自动构建
- [ ] 自动发布 Release

**验收标准**: 所有测试通过，三平台安装包可用

---

## 七、关键技术决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 桌面框架 | Tauri 2.x | 体积小、性能好、安全性高 |
| 后端语言 | Rust | Tauri 原生支持、内存安全 |
| 前端框架 | React 18 | 生态成熟、TypeScript 支持好 |
| 状态管理 | Zustand | 轻量、与 React 集成简单 |
| 图表库 | Recharts | React 原生、文档完善 |
| 数据库 | SQLite | 轻量、无需额外服务 |
| IPC 方式 | Tauri Commands + Events | 官方推荐、类型安全 |

---

## 八、与旧架构对比

| 特性 | 旧架构 (Web) | 新架构 (Tauri) |
|------|-------------|----------------|
| 后端 | Python FastAPI | Rust |
| 前端 | Svelte | React |
| 通信 | HTTP + WebSocket | Tauri IPC |
| 部署 | 服务器/Docker | 桌面安装包 |
| 启动 | 依赖服务启动 | 双击运行 |
| 更新 | 手动部署 | 自动更新 |
| 体积 | ~100MB+ | ~10-20MB |
| 内存 | ~200MB+ | ~50-80MB |

---

## 九、风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Rust 学习曲线 | 高 | 中 | 保持代码简单，充分利用社区 crate |
| Tauri 2.x 文档不完善 | 中 | 中 | 参考官方示例和 Discord 社区 |
| 跨平台兼容性 | 中 | 低 | 早期在多平台测试 |
| 文件权限问题 | 中 | 中 | 使用 Tauri 插件处理权限 |

---

## 十、验收标准

### 功能验收

- [ ] 实时监控 `~/.claude/` 目录文件变化
- [ ] 正确解析 Token 使用数据
- [ ] 按供应商区分统计
- [ ] 今日使用优先显示
- [ ] 历史数据图表展示
- [ ] 暗色/亮色主题切换
- [ ] 供应商自定义命名

### 性能验收

- [ ] 应用启动 < 2 秒
- [ ] 内存占用 < 100MB
- [ ] 安装包体积 < 30MB
- [ ] UI 响应流畅（60fps）

### 平台验收

- [ ] macOS (Intel + Apple Silicon) 正常运行
- [ ] Windows 10/11 正常运行
- [ ] Linux (Ubuntu 22.04+) 正常运行

---

*文档版本: v1.1.0*
*最后更新: 2026-01-08*
