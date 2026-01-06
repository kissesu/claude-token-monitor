# Claude Token Monitor

基于 Claude CLI 的 Token 使用量监控与可视化系统

## 项目简介

Claude Token Monitor 是一个实时监控和可视化 Claude CLI Token 使用情况的工具。通过解析 `~/.claude/usage.json` 文件，自动记录每次对话的 Token 消耗，并提供直观的图表展示和数据分析功能。

## 核心功能

- **实时监控**：自动监控 Claude CLI 的 Token 使用情况
- **历史记录**：完整记录每次对话的详细 Token 消耗
- **可视化展示**：提供多维度的图表展示和数据分析
- **趋势分析**：展示 Token 使用趋势和统计信息
- **导出功能**：支持数据导出为 CSV 或 JSON 格式

## 技术栈

### 后端
- **Python 3.11+**：核心开发语言
- **FastAPI**：高性能 Web 框架
- **SQLite**：轻量级数据库
- **SQLAlchemy**：ORM 框架
- **Pydantic**：数据验证

### 前端
- **SvelteKit**：现代化前端框架
- **TypeScript**：类型安全
- **Tailwind CSS**：样式框架
- **Chart.js**：图表可视化

## 项目结构

```
claude-token-monitor/
├── backend/                # 后端服务
│   ├── app/
│   │   ├── core/          # 核心模块（配置、日志等）
│   │   ├── api/           # API 路由
│   │   ├── db/            # 数据库模型和操作
│   │   └── main.py        # 应用入口
│   └── tests/             # 后端测试
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/ # Svelte 组件
│   │   │   ├── stores/     # 状态管理
│   │   │   ├── services/   # API 服务
│   │   │   └── types/      # TypeScript 类型
│   │   └── routes/         # 页面路由
│   └── tests/             # 前端测试
├── docker/                # Docker 配置
├── data/                  # 数据库文件（gitignore）
├── scripts/               # 工具脚本
├── .env.example           # 环境变量模板
└── README.md
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- pnpm 8+
- Claude CLI（已配置）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd claude-token-monitor
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 根据实际情况修改 .env 文件
   ```

3. **启动后端服务**
   ```bash
   make backend-run
   ```

4. **启动前端服务**
   ```bash
   make frontend-run
   ```

5. **访问应用**
   - 前端地址：http://localhost:51173
   - 后端 API：http://localhost:51888

## 开发指南

### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 51888
```

### 前端开发

```bash
cd frontend
pnpm install
pnpm dev --port 51173
```

### 运行测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
pnpm test
```

## 配置说明

主要配置项（`.env` 文件）：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| CLAUDE_DIR | Claude CLI 配置目录 | ~/.claude |
| DATABASE_PATH | 数据库文件路径 | data/monitor.db |
| BACKEND_PORT | 后端服务端口 | 51888 |
| FRONTEND_PORT | 前端服务端口 | 51173 |
| LOG_LEVEL | 日志级别 | INFO |
| DEBUG | 调试模式 | false |

## 数据结构

### usage.json 示例

```json
{
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  },
  "timestamp": "2026-01-07T10:30:00Z"
}
```

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 作者

Atlas.oi

## 更新日志

### 2026-01-07
- 初始化项目结构
- 完成 Phase 0 基础框架搭建

---

**注意**：本项目仅用于个人学习和监控用途，请遵守 Claude API 使用条款。
