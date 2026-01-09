# Claude Token Monitor

Tauri 2.x 桌面端 Claude CLI Token 使用量监控与可视化应用

## 项目简介

Claude Token Monitor 是一个轻量级桌面应用，实时监控和可视化 Claude CLI 的 Token 使用情况。通过监控 `~/.claude/` 目录下的文件变化，自动记录每次对话的 Token 消耗，并提供直观的图表展示和数据分析功能。

## 核心功能

- **实时监控**：自动监控 Claude CLI 的 Token 使用情况
- **多供应商区分**：按 API Key 区分不同中转站的 Token 使用统计
- **今日优先**：优先显示当天各供应商的 Token 消耗和缓存命中率
- **历史记录**：完整记录每次对话的详细 Token 消耗
- **可视化展示**：提供多维度的图表展示和数据分析
- **趋势分析**：展示 Token 使用趋势和统计信息
- **桌面端体验**：原生桌面应用，启动快、体积小

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Tauri 2.x | 轻量级跨平台桌面框架 |
| 后端 | Rust | 高性能、内存安全 |
| 前端 | React 18 + TypeScript | 现代化前端框架 |
| 样式 | TailwindCSS 3.4 | 原子化 CSS |
| 状态管理 | Zustand | 轻量级状态管理 |
| 图表 | Recharts | React 原生图表库 |
| 数据库 | SQLite | 轻量级本地数据库 |

## 项目结构

```
claude-token-monitor/
├── src-tauri/                  # Tauri Rust 后端
│   ├── Cargo.toml              # Rust 依赖配置
│   ├── tauri.conf.json         # Tauri 配置
│   └── src/
│       ├── main.rs             # 应用入口
│       ├── commands/           # Tauri Commands (IPC)
│       ├── services/           # 核心服务（文件监控、解析等）
│       ├── db/                 # 数据库层
│       └── models/             # 数据模型
│
├── src/                        # React 前端
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 主应用组件
│   ├── types/                  # TypeScript 类型
│   ├── stores/                 # Zustand 状态管理
│   ├── hooks/                  # React Hooks
│   └── components/             # React 组件
│       ├── layout/             # 布局组件
│       ├── common/             # 通用组件
│       ├── charts/             # 图表组件
│       ├── dashboard/          # 仪表板面板
│       └── provider/           # 供应商相关组件
│
├── docs/                       # 项目文档
│   └── tauri-desktop-plan.md   # 完整项目方案
│
├── index.html                  # HTML 入口
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # TailwindCSS 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 前端依赖
```

## 快速开始

### 环境要求

- Rust 1.75+
- Node.js 18+
- pnpm 8+
- 系统 WebView（macOS 自带，Windows 需要 WebView2）

### 开发环境

```bash
# 克隆项目
git clone <repository-url>
cd claude-token-monitor

# 安装前端依赖
pnpm install

# 启动开发模式
pnpm tauri dev
```

### 构建发布

```bash
# 构建桌面应用
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`：
- macOS: `.dmg` / `.app`
- Windows: `.msi` / `.exe`
- Linux: `.AppImage` / `.deb`

## 架构特点

### Tauri IPC 通信

```
┌─────────────────────────────────────────────────┐
│              React Frontend (WebView)            │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Zustand  │  │   Hooks   │  │ Components  │  │
│  │  Stores   │  │ useTauri  │  │             │  │
│  └─────┬─────┘  └─────┬─────┘  └─────────────┘  │
│        │              │                          │
└────────┼──────────────┼──────────────────────────┘
         │   invoke()   │   listen()
         ▼              ▼
┌────────────────────────────────────────────────┐
│              Tauri Core (Rust)                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │  Commands  │  │   Events   │  │ Services │  │
│  │  Handler   │  │  Emitter   │  │          │  │
│  └────────────┘  └────────────┘  └──────────┘  │
└────────────────────────────────────────────────┘
```

### 数据流

1. **文件监控**: Rust 使用 `notify` crate 监控 `~/.claude/` 目录
2. **数据解析**: 解析 settings.json（供应商）和 *.jsonl（Token 使用）
3. **数据存储**: SQLite 本地数据库持久化
4. **事件推送**: 通过 Tauri Events 推送到前端
5. **UI 更新**: React 响应式更新界面

## 文档

- [完整项目方案](docs/tauri-desktop-plan.md) - 详细的技术设计和实施计划

## 开发状态

> **当前阶段**: 架构重构规划中

### 里程碑

- [ ] Phase 0: 项目初始化 - Tauri 2.x 项目骨架
- [ ] Phase 1: Rust 后端核心 - 文件监控、解析、数据库
- [ ] Phase 2: IPC 通信层 - Commands + Events
- [x] Phase 3: React 基础架构 - 类型、Store、布局
- [x] Phase 4: 核心数据展示 - StatCard、表格、实时更新
- [x] Phase 5: 供应商功能 - 多供应商区分统计
- [ ] Phase 6: 图表可视化 - 趋势图、饼图、热力图
- [ ] Phase 7: 测试与打包 - 跨平台构建

## 许可证

MIT License

## 作者

Atlas.oi

---

**注意**：本项目仅用于个人学习和监控用途，请遵守 Claude API 使用条款。
