/**
 * @file PROJECT_OVERVIEW.md
 * @description Claude Token Monitor 项目概览与快速导航
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 项目概览

**版本**：1.0.0-dev
**状态**：设计阶段
**作者**：Atlas.oi
**许可证**：MIT

---

## 一、项目简介

Claude Token Monitor 是一个基于 Web UI 的 Claude Code 使用量监控仪表板，支持 Docker 部署，提供实时数据监控、历史趋势分析、费用估算等功能。

### 核心特性

- ✅ **纯本地数据读取**：从 `~/.claude/stats-cache.json` 读取数据，无需网络 API
- ✅ **历史数据永久保留**：SQLite 持久化存储
- ✅ **实时更新**：WebSocket 推送，毫秒级响应
- ✅ **跨设备访问**：Docker 部署，支持局域网/远程访问
- ✅ **跨平台支持**：macOS/Linux/Windows 统一部署
- ✅ **数据导出**：支持 CSV/JSON 格式
- ✅ **费用估算**：基于官方定价自动计算
- ✅ **主题切换**：深色/浅色模式

---

## 二、技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端** | Svelte | 4.x | 编译时框架，零运行时开销 |
| | Vite | 5.x | 快速构建工具 |
| | TypeScript | 5.x | 类型安全 |
| | Layerchart | 1.x | Svelte 原生图表库 |
| **后端** | Python aiohttp | 3.9.x | 异步 Web 框架 |
| | watchdog | 4.x | 文件系统监听 |
| **数据库** | SQLite | 3.x | 轻量级嵌入式数据库 |
| **部署** | Docker | 24.x | 容器化部署 |

---

## 三、文档导航

### 3.1 核心文档

| 文档 | 路径 | 描述 |
|------|------|------|
| **技术设计文档** | [docs/technical-design.md](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/technical-design.md) | 完整技术架构设计（必读） |
| **项目说明** | [README.md](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/README.md) | 快速开始指南 |
| **更新日志** | [CHANGELOG.md](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/CHANGELOG.md) | 版本变更记录 |

### 3.2 分析文档

| 文档 | 路径 | 描述 |
|------|------|------|
| **方案对比** | [docs/solution-comparison.md](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/solution-comparison.md) | 各方案详细对比分析 |
| **Web UI 分析** | [docs/web-ui-docker-analysis.md](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/web-ui-docker-analysis.md) | Web UI Docker 方案分析 |
| **需求分析** | [docs/analysis-report.md](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/analysis-report.md) | 功能需求分析报告 |

### 3.3 配置文件

| 文件 | 路径 | 描述 |
|------|------|------|
| **环境变量示例** | [.env.example](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/.env.example) | 环境变量配置示例 |
| **Git 忽略规则** | [.gitignore](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/.gitignore) | Git 忽略规则 |
| **许可证** | [LICENSE](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/LICENSE) | MIT 开源许可证 |
| **Makefile** | [Makefile](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/Makefile) | 项目自动化脚本 |

---

## 四、快速开始

### 4.1 环境要求

- Docker 24.0+
- Docker Compose 2.0+
- Claude Code 已安装并使用

### 4.2 部署流程

```bash
# 1. 克隆项目
git clone https://github.com/your-org/claude-token-monitor.git
cd claude-token-monitor

# 2. 初始化项目
make setup

# 3. 配置环境变量
# 编辑 .env 文件，设置 CLAUDE_DIR 路径
vim .env

# 4. 构建镜像
make build

# 5. 启动服务
make start

# 6. 访问仪表板
open http://localhost:51888
```

### 4.3 常用命令

```bash
# 启动开发环境（支持热重载）
make dev

# 查看服务日志
make logs

# 运行测试
make test

# 停止服务
make stop

# 清理资源
make clean
```

详见 [README.md - 使用指南](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/README.md#使用指南)

---

## 五、项目结构

```
claude-token-monitor/
├── backend/              # Python 后端服务
│   ├── app/
│   │   ├── main.py       # 应用入口
│   │   ├── models/       # 数据模型
│   │   ├── services/     # 业务逻辑
│   │   ├── api/          # API 路由
│   │   └── utils/        # 工具函数
│   ├── requirements.txt
│   └── tests/
├── frontend/             # Svelte 前端
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   ├── stores/
│   │   │   └── utils/
│   │   └── routes/
│   ├── package.json
│   └── vite.config.ts
├── docker/               # Docker 配置
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── docker-compose.yml
│   └── nginx.conf
├── docs/                 # 文档
├── data/                 # 持久化数据
├── scripts/              # 脚本工具
├── .env.example
├── Makefile
└── README.md
```

完整结构见 [docs/technical-design.md - 目录结构设计](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/technical-design.md#一目录结构设计)

---

## 六、架构设计

### 6.1 系统架构图

```
┌─────────────────────────────────────────────────────┐
│              Docker Container                        │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │   Svelte 前端    │◄──►│  aiohttp 后端    │      │
│  │   (静态文件)     │    │  (API Server)    │      │
│  │   Port: 51888    │    │  + WebSocket     │      │
│  └──────────────────┘    └────────┬─────────┘      │
│                                    │                 │
│                          ┌────────▼─────────┐       │
│                          │   文件监听器      │       │
│                          │   (watchdog)      │       │
│                          └────────┬─────────┘       │
│                                    │                 │
└────────────────────────────────────│─────────────────┘
                                     │ Volume Mount (readonly)
                                     ▼
                              ~/.claude/
                              ├── stats-cache.json
                              └── projects/
                                  └── *.jsonl
```

### 6.2 数据流

1. **文件监听器** 监听 `~/.claude/stats-cache.json` 变化
2. **后端服务** 读取文件并处理数据
3. **数据库** 持久化存储历史数据
4. **WebSocket** 实时推送更新到前端
5. **前端** 渲染图表和统计数据

---

## 七、API 概览

### 7.1 REST API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/stats/current` | 获取当前统计数据 |
| GET | `/api/v1/stats/history` | 获取历史数据 |
| GET | `/api/v1/stats/trends` | 获取趋势数据 |
| GET | `/api/v1/export/csv` | 导出 CSV |
| GET | `/api/v1/export/json` | 导出 JSON |
| GET | `/api/v1/cost/estimate` | 获取费用估算 |
| GET | `/api/v1/health` | 健康检查 |

### 7.2 WebSocket

```
ws://localhost:51888/ws
```

**消息类型**：
- `initial_data` - 初始数据
- `stats_update` - 统计数据更新

详见 [docs/technical-design.md - 后端 API 设计](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/technical-design.md#二后端-api-设计)

---

## 八、数据库设计

### 8.1 主要表

| 表名 | 描述 | 关键字段 |
|------|------|----------|
| `token_usage` | Token 使用记录 | `timestamp`, `model`, `input_tokens`, `output_tokens` |
| `daily_summary` | 每日汇总 | `date`, `total_tokens`, `cache_hit_rate` |
| `model_pricing` | 模型定价 | `model`, `input_price`, `output_price` |

详见 [docs/technical-design.md - 数据库 Schema 设计](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/technical-design.md#三数据库-schema-设计)

---

## 九、安全设计

### 9.1 数据安全

- ✅ **只读挂载**：Docker 卷以只读方式挂载 `~/.claude`
- ✅ **无网络请求**：所有数据来自本地文件
- ✅ **无数据上传**：不访问任何外部 API

### 9.2 访问控制

- 可选密码认证（SHA-256 哈希）
- 可选 JWT Token 认证
- CORS 跨域配置
- 速率限制（100 req/min）

详见 [docs/technical-design.md - 安全设计](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/docs/technical-design.md#五安全设计)

---

## 十、开发路线图

### 10.1 当前阶段：设计阶段（Phase 0）

- [x] 需求分析
- [x] 技术选型
- [x] 架构设计
- [x] 文档编写

### 10.2 开发阶段（Phase 1）

- [ ] 后端 API 实现
  - [ ] 文件读取服务
  - [ ] 数据处理逻辑
  - [ ] REST API 路由
  - [ ] WebSocket 处理器
  - [ ] 数据库操作
- [ ] 前端 UI 开发
  - [ ] 仪表板组件
  - [ ] 图表组件
  - [ ] 数据导出功能
  - [ ] 主题切换
- [ ] Docker 配置
  - [ ] Dockerfile 编写
  - [ ] docker-compose.yml
  - [ ] 跨平台测试

### 10.3 测试阶段（Phase 2）

- [ ] 单元测试
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 性能测试

### 10.4 优化与发布（Phase 3）

- [ ] 性能优化
- [ ] 文档完善
- [ ] CI/CD 配置
- [ ] 发布 v1.0.0

---

## 十一、贡献指南

### 11.1 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 11.2 代码规范

**Python**：
- 遵循 PEP 8
- 使用 type hints
- 代码覆盖率 > 80%

**TypeScript/Svelte**：
- 使用 ESLint + Prettier
- 组件化开发
- 类型安全

### 11.3 提交规范

```
<type>: <subject>

type:
  - feat: 新功能
  - fix: 修复
  - refactor: 重构
  - docs: 文档
  - test: 测试
  - chore: 构建/工具
```

---

## 十二、常见问题

### Q1: 如何配置 Claude 数据目录？

**A**: 编辑 `.env` 文件：

```bash
# macOS/Linux
CLAUDE_DIR=${HOME}/.claude

# Windows (Git Bash)
CLAUDE_DIR=/c/Users/${USERNAME}/.claude
```

### Q2: 如何启用密码保护？

**A**: 生成密码哈希并设置环境变量：

```bash
echo -n "your_password" | sha256sum
# 将输出的哈希值设置到 .env
MONITOR_PASSWORD_HASH=<hash>
```

### Q3: Docker 容器无法访问 ~/.claude 怎么办？

**A**: 检查以下几点：
1. 确认 `~/.claude` 目录存在
2. 检查 Docker 卷权限
3. 确认路径映射正确

### Q4: 数据不实时更新怎么办？

**A**: 切换到轮询模式：

```bash
FILE_WATCH_ENABLED=false
POLL_INTERVAL=5  # 5 秒轮询一次
```

更多问题见 [README.md - 故障排查](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/README.md#故障排查)

---

## 十三、资源链接

### 13.1 技术文档

- [Svelte 官方文档](https://svelte.dev/)
- [Layerchart 文档](https://www.layerchart.com/)
- [aiohttp 文档](https://docs.aiohttp.org/)
- [Docker 文档](https://docs.docker.com/)

### 13.2 相关项目

- [Claude Code](https://claude.ai/code) - Anthropic 官方 CLI 工具

### 13.3 参考资料

- [Claude API 定价](https://www.anthropic.com/pricing)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [WebSocket 协议](https://datatracker.ietf.org/doc/html/rfc6455)

---

## 十四、许可证

本项目采用 MIT 许可证，详见 [LICENSE](/Users/oi/CodeCoding/Code/自研项目/claude-token-monitor/LICENSE) 文件。

---

## 十五、联系方式

**作者**：Atlas.oi
**项目地址**：https://github.com/your-org/claude-token-monitor
**问题反馈**：https://github.com/your-org/claude-token-monitor/issues

---

*最后更新：2026-01-06*
*文档版本：1.0.0*
