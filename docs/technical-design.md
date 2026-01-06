/**
 * @file technical-design.md
 * @description Claude Token Monitor Web UI 完整技术设计文档
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 完整技术设计文档

## 一、目录结构设计

```
claude-token-monitor/
├── backend/                          # Python 后端服务
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # 应用入口
│   │   ├── config.py                 # 配置管理
│   │   ├── models/                   # 数据模型
│   │   │   ├── __init__.py
│   │   │   ├── database.py           # SQLite ORM
│   │   │   └── schemas.py            # Pydantic 数据模型
│   │   ├── services/                 # 业务逻辑
│   │   │   ├── __init__.py
│   │   │   ├── stats_reader.py       # 统计数据读取
│   │   │   ├── file_watcher.py       # 文件监听器
│   │   │   ├── data_processor.py     # 数据处理与聚合
│   │   │   └── export_service.py     # CSV/JSON 导出
│   │   ├── api/                      # API 路由
│   │   │   ├── __init__.py
│   │   │   ├── routes.py             # REST API 路由
│   │   │   └── websocket.py          # WebSocket 处理器
│   │   └── utils/                    # 工具函数
│   │       ├── __init__.py
│   │       ├── logger.py             # 日志配置
│   │       └── pricing.py            # 费用计算器
│   ├── requirements.txt              # Python 依赖
│   └── tests/                        # 单元测试
│       ├── __init__.py
│       ├── test_stats_reader.py
│       └── test_data_processor.py
│
├── frontend/                         # Svelte 前端
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/           # UI 组件
│   │   │   │   ├── Dashboard.svelte  # 主仪表板
│   │   │   │   ├── TokenChart.svelte # Token 趋势图
│   │   │   │   ├── ModelStats.svelte # 模型统计卡片
│   │   │   │   ├── CostEstimator.svelte # 费用估算器
│   │   │   │   └── ExportPanel.svelte   # 导出面板
│   │   │   ├── stores/               # Svelte Store
│   │   │   │   ├── stats.ts          # 统计数据 store
│   │   │   │   └── theme.ts          # 主题切换 store
│   │   │   ├── utils/
│   │   │   │   ├── api.ts            # API 客户端
│   │   │   │   ├── websocket.ts      # WebSocket 客户端
│   │   │   │   └── formatters.ts     # 数据格式化工具
│   │   │   └── types/
│   │   │       └── index.ts          # TypeScript 类型定义
│   │   ├── routes/
│   │   │   └── +page.svelte          # 主页面
│   │   ├── app.html                  # HTML 模板
│   │   └── app.css                   # 全局样式
│   ├── static/                       # 静态资源
│   ├── package.json
│   ├── vite.config.ts
│   ├── svelte.config.js
│   └── tsconfig.json
│
├── docker/                           # Docker 配置
│   ├── Dockerfile                    # 生产环境镜像
│   ├── Dockerfile.dev                # 开发环境镜像
│   ├── docker-compose.yml            # 服务编排
│   ├── docker-compose.dev.yml        # 开发环境编排
│   └── nginx.conf                    # Nginx 配置（可选）
│
├── scripts/                          # 脚本工具
│   ├── build.sh                      # 构建脚本
│   ├── start.sh                      # 启动脚本
│   └── migrate.py                    # 数据库迁移脚本
│
├── data/                             # 持久化数据（挂载卷）
│   └── monitor.db                    # SQLite 数据库
│
├── docs/                             # 文档
│   ├── analysis-report.md
│   ├── solution-comparison.md
│   ├── web-ui-docker-analysis.md
│   └── technical-design.md           # 本文档
│
├── .env.example                      # 环境变量示例
├── Makefile                          # 项目管理命令
├── README.md                         # 项目说明
└── .gitignore
```

---

## 二、后端 API 设计

### 2.1 REST API 端点列表

#### 2.1.1 统计数据

| 方法 | 路径 | 描述 | 响应示例 |
|------|------|------|----------|
| GET | `/api/v1/stats/current` | 获取当前统计数据 | `{ "models": {...}, "totals": {...} }` |
| GET | `/api/v1/stats/history` | 获取历史数据 | `{ "data": [...], "pagination": {...} }` |
| GET | `/api/v1/stats/models` | 获取模型列表 | `["claude-opus-4", ...]` |
| GET | `/api/v1/stats/trends` | 获取趋势数据 | `{ "daily": [...], "weekly": [...] }` |

#### 2.1.2 数据导出

| 方法 | 路径 | 描述 | 响应类型 |
|------|------|------|----------|
| GET | `/api/v1/export/csv` | 导出 CSV 格式 | `text/csv` |
| GET | `/api/v1/export/json` | 导出 JSON 格式 | `application/json` |

#### 2.1.3 费用估算

| 方法 | 路径 | 描述 | 响应示例 |
|------|------|------|----------|
| GET | `/api/v1/cost/estimate` | 获取费用估算 | `{ "total_cost": 12.34, "breakdown": {...} }` |
| GET | `/api/v1/cost/pricing` | 获取定价表 | `{ "models": {...} }` |

#### 2.1.4 系统状态

| 方法 | 路径 | 描述 | 响应示例 |
|------|------|------|----------|
| GET | `/api/v1/health` | 健康检查 | `{ "status": "ok" }` |
| GET | `/api/v1/version` | 获取版本信息 | `{ "version": "1.0.0" }` |

### 2.2 REST API 详细设计

#### 2.2.1 获取历史数据

```http
GET /api/v1/stats/history?start_date=2026-01-01&end_date=2026-01-06&model=claude-opus-4&page=1&limit=50
```

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| start_date | string | 否 | 30 天前 | 开始日期（ISO 8601） |
| end_date | string | 否 | 今天 | 结束日期（ISO 8601） |
| model | string | 否 | all | 模型过滤器 |
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 50 | 每页数量（最大 100） |

**响应示例**：

```json
{
  "data": [
    {
      "timestamp": "2026-01-06T12:00:00Z",
      "model": "claude-opus-4",
      "input_tokens": 1000,
      "output_tokens": 500,
      "cache_creation_tokens": 200,
      "cache_read_tokens": 800,
      "total_cost": 0.05
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "total_pages": 25
  }
}
```

#### 2.2.2 获取趋势数据

```http
GET /api/v1/stats/trends?period=daily&days=30
```

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| period | string | 否 | daily | 聚合周期（hourly/daily/weekly/monthly） |
| days | int | 否 | 30 | 统计天数 |

**响应示例**：

```json
{
  "period": "daily",
  "data": [
    {
      "date": "2026-01-06",
      "total_tokens": 15000,
      "input_tokens": 10000,
      "output_tokens": 5000,
      "cache_hit_rate": 0.75,
      "cost": 1.25
    }
  ]
}
```

### 2.3 WebSocket 实时推送方案

#### 2.3.1 连接流程

```
Client                          Server
  |                               |
  |-- WS Connect (/ws) --------->|
  |<-- Connection Accepted -------|
  |                               |
  |<-- Initial Data -------------|  (发送当前统计数据)
  |                               |
  |                               |-- File Change Detected
  |<-- Stats Update -------------|  (推送增量更新)
  |                               |
  |-- Ping ------------------->|
  |<-- Pong --------------------|
```

#### 2.3.2 消息格式

**服务器推送消息**：

```json
{
  "type": "stats_update",
  "timestamp": "2026-01-06T12:00:00Z",
  "data": {
    "model": "claude-opus-4",
    "input_tokens": 1000,
    "output_tokens": 500
  }
}
```

**客户端订阅消息**：

```json
{
  "type": "subscribe",
  "models": ["claude-opus-4", "claude-sonnet-4"]
}
```

#### 2.3.3 WebSocket 实现（Python）

```python
from aiohttp import web
import aiohttp

class WebSocketManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        self.connections = set()

    async def handle_websocket(self, request):
        """处理 WebSocket 连接"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        # 添加到连接池
        self.connections.add(ws)

        try:
            # 发送初始数据
            initial_data = await self.get_current_stats()
            await ws.send_json({
                "type": "initial_data",
                "data": initial_data
            })

            # 监听客户端消息
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    await self.handle_message(ws, msg.json())
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print(f'WebSocket error: {ws.exception()}')
        finally:
            # 从连接池移除
            self.connections.discard(ws)

        return ws

    async def broadcast(self, message: dict):
        """向所有连接广播消息"""
        dead_connections = set()

        for ws in self.connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.add(ws)

        # 清理失效连接
        self.connections -= dead_connections
```

### 2.4 数据刷新策略

#### 2.4.1 文件监听方案（推荐）

**优点**：
- 实时性高（毫秒级响应）
- 资源占用低
- 无轮询开销

**实现**：

```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import asyncio

class StatsFileHandler(FileSystemEventHandler):
    """统计文件变化监听器"""

    def __init__(self, ws_manager, data_processor):
        self.ws_manager = ws_manager
        self.data_processor = data_processor
        self._last_modified = 0

    def on_modified(self, event):
        """文件修改时触发"""
        if not event.is_directory and event.src_path.endswith('stats-cache.json'):
            # 防抖处理（避免重复触发）
            current_time = time.time()
            if current_time - self._last_modified < 1:
                return

            self._last_modified = current_time

            # 异步处理数据更新
            asyncio.create_task(self._handle_update())

    async def _handle_update(self):
        """处理数据更新"""
        try:
            # 读取最新数据
            new_data = await self.data_processor.read_stats()

            # 存储到数据库
            await self.data_processor.save_to_db(new_data)

            # 广播到所有客户端
            await self.ws_manager.broadcast({
                "type": "stats_update",
                "timestamp": datetime.now().isoformat(),
                "data": new_data
            })
        except Exception as e:
            print(f"Error handling stats update: {e}")

# 启动文件监听
observer = Observer()
handler = StatsFileHandler(ws_manager, data_processor)
observer.schedule(handler, path=str(CLAUDE_DIR), recursive=False)
observer.start()
```

#### 2.4.2 轮询方案（备用）

**使用场景**：
- Docker 挂载卷无法触发文件事件
- Windows 环境兼容性问题

**实现**：

```python
import asyncio

async def poll_stats_file(interval: int = 5):
    """定期轮询统计文件"""
    last_mtime = 0

    while True:
        try:
            stats_file = CLAUDE_DIR / "stats-cache.json"
            current_mtime = stats_file.stat().st_mtime

            if current_mtime > last_mtime:
                last_mtime = current_mtime
                await handle_stats_update()

        except Exception as e:
            print(f"Poll error: {e}")

        await asyncio.sleep(interval)
```

---

## 三、数据库 Schema 设计

### 3.1 SQLite 表结构

#### 3.1.1 模型使用记录表（token_usage）

```sql
CREATE TABLE token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    model VARCHAR(50) NOT NULL,

    -- Token 统计
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens INTEGER NOT NULL DEFAULT 0,

    -- 费用计算
    input_cost REAL NOT NULL DEFAULT 0.0,
    output_cost REAL NOT NULL DEFAULT 0.0,
    cache_creation_cost REAL NOT NULL DEFAULT 0.0,
    cache_read_cost REAL NOT NULL DEFAULT 0.0,
    total_cost REAL GENERATED ALWAYS AS (
        input_cost + output_cost + cache_creation_cost + cache_read_cost
    ) STORED,

    -- 会话信息（可选）
    session_id VARCHAR(100),
    project_name VARCHAR(100),

    -- 索引优化
    INDEX idx_timestamp (timestamp),
    INDEX idx_model (model),
    INDEX idx_session (session_id)
);
```

#### 3.1.2 每日汇总表（daily_summary）

```sql
CREATE TABLE daily_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,

    -- 总计数据
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0.0,

    -- 缓存效率
    cache_hit_rate REAL GENERATED ALWAYS AS (
        CASE
            WHEN (total_cache_read_tokens + total_input_tokens) > 0
            THEN CAST(total_cache_read_tokens AS REAL) / (total_cache_read_tokens + total_input_tokens)
            ELSE 0.0
        END
    ) STORED,

    -- 会话统计
    session_count INTEGER NOT NULL DEFAULT 0,

    INDEX idx_date (date)
);
```

#### 3.1.3 模型定价表（model_pricing）

```sql
CREATE TABLE model_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model VARCHAR(50) NOT NULL UNIQUE,

    -- 官方定价（美元/百万 tokens）
    input_price REAL NOT NULL,
    output_price REAL NOT NULL,
    cache_creation_price REAL NOT NULL,
    cache_read_price REAL NOT NULL,

    -- 元数据
    effective_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,

    INDEX idx_model_active (model, is_active)
);
```

#### 3.1.4 模型定价初始数据

```sql
INSERT INTO model_pricing (model, input_price, output_price, cache_creation_price, cache_read_price, effective_date) VALUES
    ('claude-opus-4', 15.00, 75.00, 18.75, 1.50, '2024-11-01'),
    ('claude-sonnet-4', 3.00, 15.00, 3.75, 0.30, '2024-10-22'),
    ('claude-haiku-4', 0.80, 4.00, 1.00, 0.08, '2024-11-01');
```

### 3.2 数据迁移策略

#### 3.2.1 从 stats-cache.json 导入历史数据

```python
async def migrate_from_stats_cache():
    """从 stats-cache.json 迁移历史数据到 SQLite"""

    # 读取原始数据
    stats_file = CLAUDE_DIR / "stats-cache.json"
    with open(stats_file) as f:
        stats_data = json.load(f)

    # 插入数据库
    async with aiosqlite.connect('monitor.db') as db:
        for model, data in stats_data.items():
            await db.execute("""
                INSERT INTO token_usage
                (timestamp, model, input_tokens, output_tokens,
                 cache_creation_tokens, cache_read_tokens)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                datetime.now(),
                model,
                data.get('input_tokens', 0),
                data.get('output_tokens', 0),
                data.get('cache_creation_tokens', 0),
                data.get('cache_read_tokens', 0)
            ))

        await db.commit()
```

### 3.3 数据保留策略

```python
async def cleanup_old_data(retention_days: int = 365):
    """清理超过保留期的原始数据（保留汇总数据）"""

    cutoff_date = datetime.now() - timedelta(days=retention_days)

    async with aiosqlite.connect('monitor.db') as db:
        # 删除旧的详细记录
        await db.execute("""
            DELETE FROM token_usage
            WHERE timestamp < ?
        """, (cutoff_date,))

        # 保留每日汇总数据（永久）
        await db.commit()
```

---

## 四、Docker 部署架构

### 4.1 Dockerfile 设计

#### 4.1.1 多阶段构建（生产环境）

```dockerfile
# ============================================
# 阶段 1：构建前端
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 安装依赖
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 构建静态文件
COPY frontend/ ./
RUN pnpm run build

# ============================================
# 阶段 2：Python 运行环境
# ============================================
FROM python:3.11-alpine AS runtime

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    sqlite \
    tzdata \
    curl

# 安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/app ./app

# 从前端构建阶段复制静态文件
COPY --from=frontend-builder /app/frontend/build ./static

# 创建数据目录
RUN mkdir -p /data

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:51888/api/v1/health || exit 1

# 暴露端口
EXPOSE 51888

# 启动服务
CMD ["python", "-m", "app.main"]
```

#### 4.1.2 开发环境 Dockerfile

```dockerfile
FROM python:3.11-alpine

WORKDIR /app

# 安装系统依赖（包含开发工具）
RUN apk add --no-cache \
    sqlite \
    tzdata \
    curl \
    bash \
    git

# 安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 安装开发依赖
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    black \
    ruff

# 挂载代码目录（通过 volume）
VOLUME /app

# 开发模式启动（自动重载）
CMD ["python", "-m", "app.main", "--reload"]
```

### 4.2 docker-compose.yml（生产环境）

```yaml
version: '3.8'

services:
  # ============================================
  # Claude Token Monitor 主服务
  # ============================================
  claude-monitor:
    image: claude-token-monitor:latest
    container_name: claude-monitor

    # 端口映射（使用五位数端口避免冲突）
    ports:
      - "51888:51888"

    # 卷挂载
    volumes:
      # Claude 数据目录（只读）
      - ${CLAUDE_DIR:-~/.claude}:/data/.claude:ro

      # 持久化数据库
      - ./data:/app/data

      # 时区配置
      - /etc/localtime:/etc/localtime:ro

    # 环境变量
    environment:
      - TZ=Asia/Shanghai
      - CLAUDE_DATA_DIR=/data/.claude
      - DATABASE_PATH=/app/data/monitor.db
      - LOG_LEVEL=INFO
      - ENABLE_COST_ESTIMATION=true
      - FILE_WATCH_ENABLED=true

    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:51888/api/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

    # 重启策略
    restart: unless-stopped

    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M

    # 网络配置
    networks:
      - monitor-network

networks:
  monitor-network:
    driver: bridge
```

### 4.3 docker-compose.dev.yml（开发环境）

```yaml
version: '3.8'

services:
  claude-monitor-dev:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev

    container_name: claude-monitor-dev

    ports:
      - "51888:51888"    # 后端 API
      - "51173:5173"    # Vite 开发服务器（热重载）

    volumes:
      # 代码挂载（支持热重载）
      - ./backend:/app/backend
      - ./frontend:/app/frontend

      # Claude 数据目录
      - ${CLAUDE_DIR:-~/.claude}:/data/.claude:ro

      # 数据库
      - ./data:/app/data

    environment:
      - TZ=Asia/Shanghai
      - CLAUDE_DATA_DIR=/data/.claude
      - DATABASE_PATH=/app/data/monitor.db
      - LOG_LEVEL=DEBUG
      - DEV_MODE=true

    # 开发模式无需健康检查
    restart: "no"

    networks:
      - monitor-network

    # 启动前端开发服务器
    command: >
      sh -c "
        cd /app/frontend && pnpm install && pnpm run dev --host &
        cd /app/backend && python -m app.main --reload
      "

networks:
  monitor-network:
    driver: bridge
```

### 4.4 跨平台路径映射

#### 4.4.1 配置文件（.env）

```bash
# ============================================
# Claude 数据目录配置（跨平台）
# ============================================

# macOS / Linux
CLAUDE_DIR=${HOME}/.claude

# Windows (Git Bash / WSL)
# CLAUDE_DIR=/c/Users/${USERNAME}/.claude

# Windows (PowerShell)
# CLAUDE_DIR=${env:USERPROFILE}\.claude
```

#### 4.4.2 自动检测脚本（scripts/detect-claude-dir.sh）

```bash
#!/bin/bash

# ============================================
# 自动检测 Claude 数据目录
# ============================================

detect_claude_dir() {
    if [ -d "$HOME/.claude" ]; then
        echo "$HOME/.claude"
    elif [ -d "/c/Users/$USER/.claude" ]; then
        # Windows Git Bash
        echo "/c/Users/$USER/.claude"
    elif [ -d "$USERPROFILE/.claude" ]; then
        # Windows CMD
        echo "$USERPROFILE/.claude"
    else
        echo "错误：未找到 Claude 数据目录" >&2
        exit 1
    fi
}

CLAUDE_DIR=$(detect_claude_dir)
echo "检测到 Claude 数据目录：$CLAUDE_DIR"
export CLAUDE_DIR
```

#### 4.4.3 Windows 特殊处理

**docker-compose.windows.yml**：

```yaml
version: '3.8'

services:
  claude-monitor:
    image: claude-token-monitor:latest

    ports:
      - "51888:51888"

    volumes:
      # Windows 路径格式
      - C:\Users\${USERNAME}\.claude:/data/.claude:ro
      - .\data:/app/data

    environment:
      - TZ=Asia/Shanghai
      - CLAUDE_DATA_DIR=/data/.claude

    restart: unless-stopped
```

### 4.5 Nginx 反向代理（可选）

**适用场景**：
- 多服务部署
- HTTPS 支持
- 负载均衡

```nginx
upstream claude_monitor_backend {
    server localhost:51888;
}

server {
    listen 443 ssl http2;
    server_name monitor.example.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 静态文件缓存
    location /assets/ {
        proxy_pass http://claude_monitor_backend;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, immutable";
    }

    # API 请求
    location /api/ {
        proxy_pass http://claude_monitor_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://claude_monitor_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # 前端页面
    location / {
        proxy_pass http://claude_monitor_backend;
        proxy_set_header Host $host;
    }
}

# HTTP 跳转 HTTPS
server {
    listen 80;
    server_name monitor.example.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 五、安全设计

### 5.1 认证机制（可选）

#### 5.1.1 JWT Token 认证

**适用场景**：
- 远程访问需要认证
- 多用户管理

**实现方案**：

```python
from datetime import datetime, timedelta
import jwt
from aiohttp import web

SECRET_KEY = "your-secret-key-here"  # 从环境变量读取
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 小时

async def create_access_token(data: dict) -> str:
    """生成 JWT Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(request: web.Request) -> bool:
    """验证 JWT Token"""
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return False

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return True
    except jwt.ExpiredSignatureError:
        return False
    except jwt.JWTError:
        return False

# 中间件
@web.middleware
async def auth_middleware(request, handler):
    """认证中间件"""

    # 公开路径
    public_paths = ['/api/v1/health', '/api/v1/version', '/login']

    if request.path in public_paths:
        return await handler(request)

    # 验证 Token
    if not await verify_token(request):
        return web.json_response(
            {'error': 'Unauthorized'},
            status=401
        )

    return await handler(request)
```

#### 5.1.2 简单密码认证

**适用场景**：
- 单用户本地部署
- 快速部署

**实现方案**：

```python
import hashlib
from aiohttp import web

def check_password(password: str) -> bool:
    """验证密码"""
    # 从环境变量读取密码哈希
    expected_hash = os.getenv('MONITOR_PASSWORD_HASH')

    if not expected_hash:
        # 未设置密码，允许访问
        return True

    # 计算密码哈希
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    return password_hash == expected_hash

async def login(request: web.Request):
    """登录接口"""
    data = await request.json()
    password = data.get('password')

    if check_password(password):
        # 创建会话
        session = await get_session(request)
        session['authenticated'] = True

        return web.json_response({'status': 'ok'})

    return web.json_response(
        {'error': 'Invalid password'},
        status=401
    )
```

### 5.2 CORS 配置

#### 5.2.1 开发环境（宽松配置）

```python
from aiohttp import web
import aiohttp_cors

def setup_cors_dev(app: web.Application):
    """开发环境 CORS 配置"""
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        )
    })

    # 为所有路由添加 CORS
    for route in list(app.router.routes()):
        cors.add(route)
```

#### 5.2.2 生产环境（严格配置）

```python
def setup_cors_prod(app: web.Application):
    """生产环境 CORS 配置"""

    # 允许的源（从环境变量读取）
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '').split(',')

    cors = aiohttp_cors.setup(app, defaults={
        origin: aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers=["Content-Type", "Authorization"],
            allow_headers=["Content-Type", "Authorization"],
            allow_methods=["GET", "POST", "OPTIONS"]
        )
        for origin in allowed_origins
    })

    for route in list(app.router.routes()):
        cors.add(route)
```

### 5.3 安全头设置

```python
@web.middleware
async def security_headers_middleware(request, handler):
    """安全头中间件"""
    response = await handler(request)

    # 设置安全头
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # CSP 策略
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self' ws: wss:;"
    )

    return response
```

### 5.4 速率限制

```python
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    """简单速率限制器"""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        """检查是否允许请求"""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.window_seconds)

        # 清理过期记录
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip] if ts > cutoff
        ]

        # 检查请求数
        if len(self.requests[client_ip]) >= self.max_requests:
            return False

        # 记录请求
        self.requests[client_ip].append(now)
        return True

rate_limiter = RateLimiter()

@web.middleware
async def rate_limit_middleware(request, handler):
    """速率限制中间件"""
    client_ip = request.remote

    if not rate_limiter.is_allowed(client_ip):
        return web.json_response(
            {'error': 'Rate limit exceeded'},
            status=429
        )

    return await handler(request)
```

### 5.5 数据访问控制

```python
import os

def validate_data_path(path: str) -> bool:
    """验证数据路径，防止路径遍历攻击"""

    # 规范化路径
    real_path = os.path.realpath(path)
    allowed_base = os.path.realpath(os.getenv('CLAUDE_DATA_DIR'))

    # 检查是否在允许的目录内
    return real_path.startswith(allowed_base)

async def read_stats_safe():
    """安全读取统计文件"""
    stats_file = os.path.join(
        os.getenv('CLAUDE_DATA_DIR'),
        'stats-cache.json'
    )

    if not validate_data_path(stats_file):
        raise ValueError("Invalid file path")

    with open(stats_file) as f:
        return json.load(f)
```

---

## 六、部署流程

### 6.1 快速启动（生产环境）

```bash
# 克隆项目
git clone https://github.com/your-org/claude-token-monitor.git
cd claude-token-monitor

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 CLAUDE_DIR 路径

# 构建镜像
make build

# 启动服务
make start

# 访问
open http://localhost:51888
```

### 6.2 开发环境启动

```bash
# 启动开发环境
make dev

# 前端热重载：http://localhost:51173
# 后端 API：http://localhost:51888
```

### 6.3 Makefile 命令

```makefile
# ============================================
# Claude Token Monitor - Makefile
# ============================================

# 变量定义
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_DEV = $(DOCKER_COMPOSE) -f docker-compose.dev.yml
IMAGE_NAME = claude-token-monitor
BACKEND_PORT = 51888
FRONTEND_PORT = 51173

# 平台检测
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
    DETECTED_OS := $(shell uname -s)
endif

.PHONY: help build start stop restart logs dev test clean

# ============================================
# 默认目标：显示帮助
# ============================================
help:
	@echo "Claude Token Monitor - 可用命令："
	@echo ""
	@echo "  make build      - 构建 Docker 镜像"
	@echo "  make start      - 启动生产环境服务"
	@echo "  make stop       - 停止服务"
	@echo "  make restart    - 重启服务"
	@echo "  make logs       - 查看日志"
	@echo "  make dev        - 启动开发环境"
	@echo "  make test       - 运行测试"
	@echo "  make clean      - 清理容器和镜像"
	@echo ""

# ============================================
# 构建镜像
# ============================================
build:
	@echo "正在构建 Docker 镜像..."
	docker build -t $(IMAGE_NAME):latest -f docker/Dockerfile .
	@echo "✓ 镜像构建完成"

# ============================================
# 启动服务（生产环境）
# ============================================
start:
	@echo "正在启动服务..."
	@echo "平台：$(DETECTED_OS)"
	$(DOCKER_COMPOSE) up -d
	@echo "✓ 服务已启动"
	@echo "访问地址：http://localhost:$(BACKEND_PORT)"

# ============================================
# 停止服务
# ============================================
stop:
	@echo "正在停止服务..."
	$(DOCKER_COMPOSE) down
	@echo "✓ 服务已停止"

# ============================================
# 重启服务
# ============================================
restart: stop start

# ============================================
# 查看日志
# ============================================
logs:
	$(DOCKER_COMPOSE) logs -f

# ============================================
# 启动开发环境
# ============================================
dev:
	@echo "正在启动开发环境..."
	$(DOCKER_COMPOSE_DEV) up
	@echo ""
	@echo "✓ 开发环境已启动"
	@echo "前端开发服务器：http://localhost:$(FRONTEND_PORT)"
	@echo "后端 API：http://localhost:$(BACKEND_PORT)"

# ============================================
# 运行测试
# ============================================
test:
	@echo "正在运行测试..."
	cd backend && pytest -v --cov=app tests/
	@echo "✓ 测试完成"

# ============================================
# 清理容器和镜像
# ============================================
clean:
	@echo "正在清理..."
	$(DOCKER_COMPOSE) down -v --rmi all
	@echo "✓ 清理完成"

# ============================================
# 数据库迁移
# ============================================
migrate:
	@echo "正在执行数据库迁移..."
	docker exec claude-monitor python scripts/migrate.py
	@echo "✓ 迁移完成"

# ============================================
# 端口清理（跨平台）
# ============================================
clean-ports:
ifeq ($(DETECTED_OS),Windows)
	@echo "清理 Windows 端口..."
	@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(BACKEND_PORT)') do taskkill /F /PID %%a 2>nul || exit 0
	@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(FRONTEND_PORT)') do taskkill /F /PID %%a 2>nul || exit 0
else
	@echo "清理端口..."
	@lsof -ti:$(BACKEND_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:$(FRONTEND_PORT) | xargs kill -9 2>/dev/null || true
endif
	@echo "✓ 端口清理完成"
```

---

## 七、监控与日志

### 7.1 应用日志

```python
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    """配置日志系统"""

    # 日志格式
    log_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)

    # 文件处理器（自动轮转）
    file_handler = RotatingFileHandler(
        '/app/logs/monitor.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(log_format)

    # 根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
```

### 7.2 性能监控

```python
import time
from functools import wraps

def monitor_performance(func):
    """性能监控装饰器"""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()

        try:
            result = await func(*args, **kwargs)

            elapsed_time = time.time() - start_time

            # 记录慢查询（超过 1 秒）
            if elapsed_time > 1.0:
                logging.warning(
                    f"Slow operation: {func.__name__} took {elapsed_time:.2f}s"
                )

            return result

        except Exception as e:
            elapsed_time = time.time() - start_time
            logging.error(
                f"Error in {func.__name__} after {elapsed_time:.2f}s: {e}"
            )
            raise

    return wrapper
```

---

## 八、测试策略

### 8.1 后端测试

#### 8.1.1 单元测试（pytest）

```python
# tests/test_stats_reader.py

import pytest
from app.services.stats_reader import StatsReader

@pytest.fixture
def stats_reader():
    """创建测试用的统计数据读取器"""
    return StatsReader(test_mode=True)

@pytest.mark.asyncio
async def test_read_stats_cache(stats_reader):
    """测试读取统计缓存文件"""
    stats = await stats_reader.read_stats_cache()

    assert 'models' in stats
    assert isinstance(stats['models'], dict)

@pytest.mark.asyncio
async def test_calculate_cache_hit_rate(stats_reader):
    """测试缓存命中率计算"""
    rate = stats_reader.calculate_cache_hit_rate(
        cache_read=800,
        input_tokens=1000
    )

    assert 0 <= rate <= 1
    assert rate == pytest.approx(0.444, abs=0.01)
```

#### 8.1.2 集成测试

```python
# tests/test_api.py

import pytest
from aiohttp.test_utils import TestClient

@pytest.mark.asyncio
async def test_get_current_stats(aiohttp_client):
    """测试获取当前统计数据 API"""
    client = await aiohttp_client(create_app())

    resp = await client.get('/api/v1/stats/current')
    assert resp.status == 200

    data = await resp.json()
    assert 'models' in data
    assert 'totals' in data

@pytest.mark.asyncio
async def test_websocket_connection(aiohttp_client):
    """测试 WebSocket 连接"""
    client = await aiohttp_client(create_app())

    async with client.ws_connect('/ws') as ws:
        # 接收初始数据
        msg = await ws.receive_json()
        assert msg['type'] == 'initial_data'
```

### 8.2 前端测试

#### 8.2.1 组件测试（Vitest）

```typescript
// tests/Dashboard.test.ts

import { render, screen } from '@testing-library/svelte';
import Dashboard from '$lib/components/Dashboard.svelte';

describe('Dashboard Component', () => {
  it('renders model statistics', () => {
    render(Dashboard, {
      props: {
        stats: {
          models: {
            'claude-opus-4': {
              input_tokens: 1000,
              output_tokens: 500
            }
          }
        }
      }
    });

    expect(screen.getByText('claude-opus-4')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });
});
```

### 8.3 端到端测试（Playwright）

```typescript
// tests/e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('should display token statistics', async ({ page }) => {
    await page.goto('http://localhost:51888');

    // 等待数据加载
    await page.waitForSelector('[data-testid="model-stats"]');

    // 验证数据显示
    const tokenCount = await page.textContent('[data-testid="total-tokens"]');
    expect(parseInt(tokenCount)).toBeGreaterThan(0);
  });

  test('should update data in real-time via WebSocket', async ({ page }) => {
    await page.goto('http://localhost:51888');

    // 记录初始值
    const initialValue = await page.textContent('[data-testid="total-tokens"]');

    // 等待 WebSocket 更新
    await page.waitForTimeout(5000);

    // 验证数据变化
    const updatedValue = await page.textContent('[data-testid="total-tokens"]');
    // 注意：此测试需要实际的数据变化才能通过
  });
});
```

---

## 九、性能优化

### 9.1 数据库优化

```sql
-- 为常用查询创建索引
CREATE INDEX idx_token_usage_model_timestamp
    ON token_usage(model, timestamp DESC);

-- 为日期范围查询优化
CREATE INDEX idx_token_usage_timestamp_model
    ON token_usage(timestamp DESC, model);

-- 分析表统计信息
ANALYZE token_usage;
ANALYZE daily_summary;
```

### 9.2 缓存策略

```python
from functools import lru_cache
from datetime import datetime, timedelta

class DataCache:
    """数据缓存管理器"""

    def __init__(self, ttl_seconds: int = 60):
        self.ttl = ttl_seconds
        self._cache = {}
        self._timestamps = {}

    def get(self, key: str):
        """获取缓存数据"""
        if key in self._cache:
            # 检查是否过期
            if datetime.now() - self._timestamps[key] < timedelta(seconds=self.ttl):
                return self._cache[key]

            # 过期，删除
            del self._cache[key]
            del self._timestamps[key]

        return None

    def set(self, key: str, value):
        """设置缓存数据"""
        self._cache[key] = value
        self._timestamps[key] = datetime.now()

# 使用示例
data_cache = DataCache(ttl_seconds=60)

@lru_cache(maxsize=128)
def get_model_pricing(model: str):
    """获取模型定价（内存缓存）"""
    # 从数据库读取
    return fetch_pricing_from_db(model)
```

### 9.3 前端性能优化

```typescript
// 虚拟滚动（处理大量历史数据）
import { VirtualList } from 'svelte-virtual-list';

// 防抖处理
import { debounce } from 'lodash-es';

const handleSearch = debounce((query: string) => {
  // 执行搜索
}, 300);

// 懒加载图表
import { onMount } from 'svelte';

let chartComponent;

onMount(async () => {
  chartComponent = await import('$lib/components/TokenChart.svelte');
});
```

---

## 十、故障排查

### 10.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 无法连接 WebSocket | 代理/防火墙拦截 | 配置代理转发 WebSocket 协议 |
| 数据不更新 | 文件监听失败 | 切换到轮询模式 |
| 数据库锁定 | 并发写入冲突 | 使用 WAL 模式 |
| 容器无法访问宿主机文件 | 权限问题 | 检查 Docker 卷权限 |

### 10.2 数据库 WAL 模式

```python
import aiosqlite

async def init_database():
    """初始化数据库（启用 WAL 模式）"""
    async with aiosqlite.connect('monitor.db') as db:
        # 启用 WAL 模式（提高并发性能）
        await db.execute('PRAGMA journal_mode=WAL')

        # 优化配置
        await db.execute('PRAGMA synchronous=NORMAL')
        await db.execute('PRAGMA cache_size=-64000')  # 64MB
        await db.execute('PRAGMA temp_store=MEMORY')

        await db.commit()
```

---

## 十一、版本发布流程

### 11.1 语义化版本

```
主版本号.次版本号.修订号

- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能新增
- 修订号：向下兼容的问题修正
```

### 11.2 发布清单

- [ ] 更新版本号（`package.json`、`pyproject.toml`）
- [ ] 运行完整测试套件
- [ ] 更新 CHANGELOG.md
- [ ] 构建 Docker 镜像
- [ ] 打标签并推送
- [ ] 发布 GitHub Release
- [ ] 更新文档

---

## 十二、总结

### 12.1 技术栈总览

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Svelte | 4.x |
| 构建工具 | Vite | 5.x |
| 类型检查 | TypeScript | 5.x |
| UI 组件 | 自定义 + Skeleton UI | - |
| 图表库 | Layerchart | 1.x |
| 后端框架 | aiohttp | 3.9.x |
| 数据库 | SQLite | 3.x |
| 文件监听 | watchdog | 4.x |
| 容器化 | Docker | 24.x |

### 12.2 关键特性

| 特性 | 实现方式 | 优势 |
|------|----------|------|
| 实时更新 | WebSocket + 文件监听 | 毫秒级响应 |
| 历史数据 | SQLite 持久化 | 永久保留 |
| 跨平台部署 | Docker 容器化 | 一次构建，到处运行 |
| 数据导出 | CSV/JSON | 灵活分析 |
| 费用估算 | 基于官方定价计算 | 准确可靠 |
| 主题切换 | CSS 变量 | 深色/浅色 |

### 12.3 项目优势

1. **纯本地数据**：无网络依赖，数据安全
2. **轻量高效**：Svelte 编译时优化，零运行时开销
3. **部署简单**：Docker 一键启动
4. **扩展性强**：RESTful API + WebSocket
5. **跨平台支持**：macOS/Linux/Windows 统一部署

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
*作者：Atlas.oi*
