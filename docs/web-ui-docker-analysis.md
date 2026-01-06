/**
 * @file web-ui-docker-analysis.md
 * @description Claude Token Monitor Web UI Docker 方案分析（纯本地数据读取）
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - Web UI Docker 方案分析

## 核心原则

**所有数据均来自 Claude Code 本地存储目录 `~/.claude/`，无需网络请求或第三方服务依赖。**

---

## 一、数据来源

### 1.1 数据文件

| 文件路径 | 用途 | 刷新机制 |
|----------|------|----------|
| `~/.claude/stats-cache.json` | 聚合统计数据 | 会话结束时更新 |
| `~/.claude/projects/*/*.jsonl` | 实时会话日志 | 每条消息即时写入 |

### 1.2 数据读取方式

```python
# 纯本地文件读取，无网络请求
import json
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude"

def read_stats():
    """读取本地统计数据"""
    stats_file = CLAUDE_DIR / "stats-cache.json"
    with open(stats_file) as f:
        return json.load(f)
```

---

## 二、架构设计

### 2.1 正确的架构图

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

### 2.2 关键点

- **只读挂载**：`~/.claude` 目录以只读方式挂载到容器
- **无网络依赖**：不访问任何外部 API
- **无代理服务**：不拦截任何请求
- **纯数据展示**：只负责读取和展示本地统计数据

---

## 三、技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | **Svelte + Vite + TypeScript** | 编译时框架，零运行时开销 |
| UI 框架 | Skeleton UI / 自定义 | 轻量级 |
| 图表 | **Layerchart** (D3 封装) | Svelte 原生图表库 |
| 后端 | Python aiohttp | 异步 IO，高性能 |
| 文件监听 | watchdog | 监听文件变化 |
| 数据库 | SQLite | 存储历史数据（可选） |
| 部署 | Docker 单容器 | 简单部署 |

### 3.1 为什么选择 Svelte 而非 Vue/React/Next.js

| 对比项 | Svelte | Vue 3 | Next.js |
|--------|--------|-------|---------|
| 打包体积 | ~5KB | ~30KB | ~80KB |
| 运行时开销 | 无 | 有 | 有 |
| 响应式实现 | 编译时 | 运行时 Proxy | 运行时 |
| 学习曲线 | 低 | 中 | 高 |
| 适合仪表板 | 最佳 | 良好 | 过重 |

**结论**：Svelte 最适合这种轻量级实时数据仪表板场景。

---

## 四、Docker 部署

### 4.1 docker-compose.yml

```yaml
version: '3.8'
services:
  claude-monitor:
    image: claude-token-monitor:latest
    container_name: claude-monitor
    ports:
      - "51888:51888"
    volumes:
      # 只读挂载，不修改任何原始文件
      - ~/.claude:/data/.claude:ro
    environment:
      - TZ=Asia/Shanghai
    restart: unless-stopped
```

### 4.2 Dockerfile

```dockerfile
FROM python:3.11-alpine

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用
COPY . .

# 构建前端
RUN cd frontend && npm install && npm run build

# 暴露端口
EXPOSE 51888

# 启动服务
CMD ["python", "main.py"]
```

---

## 五、功能特性

### 5.1 核心功能

| 功能 | 描述 |
|------|------|
| Token 统计 | 显示各模型的 token 用量 |
| 缓存命中率 | 计算并展示缓存效率 |
| 费用估算 | 基于官方定价计算费用 |
| 历史趋势 | 按日/周/月查看趋势图 |
| 实时更新 | WebSocket 推送数据变化 |

### 5.2 数据刷新策略

```python
# 监听文件变化
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class StatsHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith('stats-cache.json'):
            # 文件变化时推送更新
            await websocket.broadcast(read_stats())
```

---

## 六、优缺点分析

### 6.1 优点

| 优点 | 说明 |
|------|------|
| 远程访问 | 浏览器访问，支持局域网/远程 |
| 完整可视化 | Layerchart 图表，趋势分析 |
| 历史数据 | SQLite 存储，支持时间范围查询 |
| API 扩展 | RESTful API，易于集成 |
| 部署简单 | Docker 一键部署 |
| 数据安全 | 只读挂载，不修改原始文件 |

### 6.2 缺点

| 缺点 | 说明 |
|------|------|
| 需要 Docker | 依赖 Docker 环境 |
| 资源占用 | 比 Statusline 占用更多资源 |
| 无终端集成 | 需要浏览器查看 |
| 延迟较高 | 文件监听有一定延迟 |

---

## 七、与其他方案对比

| 特性 | Statusline | Desktop | Web UI Docker |
|------|:----------:|:-------:|:-------------:|
| 历史数据 | ❌ | ✅ | ✅ |
| 趋势图表 | ❌ | ✅ | ✅ |
| 远程访问 | ❌ | ❌ | ✅ |
| 终端集成 | ✅ | ❌ | ❌ |
| 资源占用 | 低 | 中 | 中 |
| 部署难度 | 低 | 中 | 低 |

---

## 八、评分

**综合评分：8.5/10**

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | 9/10 | 支持历史、图表、远程访问 |
| 部署便利性 | 9/10 | Docker 一键部署 |
| 数据安全性 | 10/10 | 只读挂载，无网络依赖 |
| 资源效率 | 7/10 | 比终端方案占用更多资源 |
| 扩展性 | 9/10 | API 支持，易于集成 |

---

## 九、适用场景

**推荐使用**：
- 需要远程查看统计数据
- 需要历史趋势分析
- 需要可视化图表
- 团队共享监控面板

**不推荐**：
- 纯终端工作流用户
- 资源受限环境
- 不想安装 Docker 的用户

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
