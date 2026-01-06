/**
 * @file devops-plan.md
 * @description Claude Token Monitor Docker 部署与 DevOps 计划
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - DevOps 计划

## 一、Docker 部署架构

### 1.1 架构图

```
┌─────────────────────────────────────────────────────┐
│                   Host Machine                       │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │            Docker Container                     │ │
│  │                                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────────┐  │ │
│  │  │   Svelte 前端    │  │   aiohttp 后端      │  │ │
│  │  │  (静态文件)      │◄►│   (API + WS)        │  │ │
│  │  │   Port: 51888   │  │   + watchdog        │  │ │
│  │  └─────────────────┘  └──────────┬──────────┘  │ │
│  │                                   │            │ │
│  │                       ┌───────────▼─────────┐  │ │
│  │                       │      SQLite        │  │ │
│  │                       │    /app/data/      │  │ │
│  │                       └───────────────────┘  │ │
│  └──────────────────────────│─────────────────────┘ │
│                             │ Volume Mount (ro)      │
│                             ▼                        │
│                      ~/.claude/                      │
│                      ├── stats-cache.json            │
│                      └── projects/*.jsonl            │
└─────────────────────────────────────────────────────┘
```

### 1.2 核心原则

- **只读挂载**: `~/.claude` 目录以只读方式挂载
- **无网络依赖**: 不访问任何外部 API
- **单容器部署**: 前后端打包在同一镜像
- **最小权限**: 使用非 root 用户运行

---

## 二、Dockerfile

### 2.1 多阶段构建 Dockerfile

```dockerfile
# ============================================
# Stage 1: 前端构建
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY frontend/ ./
RUN pnpm build

# ============================================
# Stage 2: 后端依赖
# ============================================
FROM python:3.11-alpine AS backend-builder

WORKDIR /app

# 安装编译依赖
RUN apk add --no-cache gcc musl-dev

# 复制依赖文件
COPY backend/requirements.txt ./

# 创建虚拟环境并安装依赖
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# ============================================
# Stage 3: 最终镜像
# ============================================
FROM python:3.11-alpine

# 标签
LABEL maintainer="Atlas.oi"
LABEL version="1.0.0"
LABEL description="Claude Token Monitor - 本地统计数据监控"

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache tini

# 创建非 root 用户
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -D appuser

# 复制 Python 虚拟环境
COPY --from=backend-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 复制后端代码
COPY backend/ ./backend/

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./static/

# 创建数据目录
RUN mkdir -p /app/data /app/logs && \
    chown -R appuser:appgroup /app

# 切换用户
USER appuser

# 暴露端口
EXPOSE 51888

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:51888/api/v1/health || exit 1

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动命令
CMD ["python", "-m", "backend.app.main"]
```

### 2.2 .dockerignore

```
# Git
.git
.gitignore

# Node
node_modules
frontend/node_modules

# Python
__pycache__
*.pyc
*.pyo
.pytest_cache
.coverage
htmlcov
.venv
venv

# IDE
.idea
.vscode
*.swp

# 测试
tests
**/tests

# 文档
docs
*.md
!README.md

# 其他
.env
.env.*
*.log
```

---

## 三、Docker Compose

### 3.1 生产环境 (docker-compose.yml)

```yaml
version: '3.8'

services:
  claude-monitor:
    image: claude-token-monitor:latest
    container_name: claude-monitor
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "${CTM_PORT:-51888}:51888"
    volumes:
      # Claude 数据目录（只读挂载）
      - ${CLAUDE_DIR:-~/.claude}:/data/.claude:ro
      # 持久化数据
      - ./data:/app/data
      # 日志目录
      - ./logs:/app/logs
    environment:
      - TZ=${TZ:-Asia/Shanghai}
      - CTM_CLAUDE_DIR=/data/.claude
      - CTM_LOG_LEVEL=${LOG_LEVEL:-INFO}
    restart: unless-stopped
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 64M
    # 安全配置
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=64m
```

### 3.2 开发环境 (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
      target: backend
    container_name: claude-monitor-backend
    ports:
      - "51888:51888"
    volumes:
      - ${CLAUDE_DIR:-~/.claude}:/data/.claude:ro
      - ./backend:/app/backend
      - ./data:/app/data
    environment:
      - CTM_CLAUDE_DIR=/data/.claude
      - CTM_LOG_LEVEL=DEBUG
    command: python -m backend.app.main --reload

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
      target: frontend
    container_name: claude-monitor-frontend
    ports:
      - "51173:5173"
    volumes:
      - ./frontend:/app/frontend
    command: pnpm dev --host
    depends_on:
      - backend
```

### 3.3 开发环境 Dockerfile (docker/Dockerfile.dev)

```dockerfile
# ============================================
# 开发环境 Dockerfile
# ============================================

# Backend 开发
FROM python:3.11-alpine AS backend

WORKDIR /app

RUN apk add --no-cache gcc musl-dev

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "-m", "backend.app.main", "--reload"]

# Frontend 开发
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install

CMD ["pnpm", "dev", "--host"]
```

---

## 四、CI/CD 配置

### 4.1 GitHub Actions (.github/workflows/ci.yml)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # 代码检查
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Lint Backend
        run: |
          pip install ruff
          ruff check backend/

      - name: Lint Frontend
        run: |
          cd frontend
          pnpm install
          pnpm lint

  # ============================================
  # 后端测试
  # ============================================
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        run: |
          cd backend
          pytest -v --cov=app --cov-report=xml tests/

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage.xml
          flags: backend

  # ============================================
  # 前端测试
  # ============================================
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install

      - name: Run tests
        run: |
          cd frontend
          pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: frontend/coverage/lcov.info
          flags: frontend

  # ============================================
  # 构建 Docker 镜像
  # ============================================
  build:
    needs: [lint, test-backend, test-frontend]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================
  # E2E 测试
  # ============================================
  e2e:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name != 'pull_request'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Start services
        run: |
          docker compose up -d
          sleep 10

      - name: Install Playwright
        run: |
          cd frontend
          pnpm install
          pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd frontend
          pnpm test:e2e

      - name: Stop services
        run: docker compose down
```

### 4.2 发布工作流 (.github/workflows/release.yml)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          platforms: linux/amd64,linux/arm64

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

---

## 五、多平台支持

### 5.1 平台差异处理

| 平台 | Claude 目录 | 文件监听 | 注意事项 |
|------|-------------|----------|----------|
| macOS | `~/.claude` | fsevents | 原生支持 |
| Linux | `~/.claude` | inotify | 原生支持 |
| Windows | `%USERPROFILE%\.claude` | ReadDirectoryChangesW | 需 WSL2 |

### 5.2 Windows WSL2 配置

```yaml
# docker-compose.windows.yml
version: '3.8'

services:
  claude-monitor:
    image: claude-token-monitor:latest
    ports:
      - "51888:51888"
    volumes:
      # WSL2 路径映射
      - /mnt/c/Users/${WINDOWS_USER}/.claude:/data/.claude:ro
      - ./data:/app/data
    environment:
      - CTM_CLAUDE_DIR=/data/.claude
```

### 5.3 跨平台启动脚本

```bash
#!/bin/bash
# scripts/start.sh

# ============================================
# Claude Token Monitor 启动脚本
# ============================================

set -e

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="macOS";;
        Linux*)     OS="Linux";;
        CYGWIN*|MINGW*|MSYS*) OS="Windows";;
        *)          OS="Unknown";;
    esac
    echo "检测到操作系统：$OS"
}

# 检测 Claude 目录
detect_claude_dir() {
    if [ -n "$CLAUDE_DIR" ]; then
        echo "使用环境变量 CLAUDE_DIR：$CLAUDE_DIR"
        return
    fi

    case "$OS" in
        macOS|Linux)
            CLAUDE_DIR="$HOME/.claude"
            ;;
        Windows)
            CLAUDE_DIR="/mnt/c/Users/$USER/.claude"
            ;;
    esac

    if [ ! -d "$CLAUDE_DIR" ]; then
        echo "错误：Claude 目录不存在：$CLAUDE_DIR"
        exit 1
    fi

    echo "Claude 目录：$CLAUDE_DIR"
    export CLAUDE_DIR
}

# 启动服务
start_service() {
    echo "正在启动 Claude Token Monitor..."

    docker compose up -d

    echo ""
    echo "服务已启动！"
    echo "访问地址：http://localhost:${CTM_PORT:-51888}"
}

# 主函数
main() {
    detect_os
    detect_claude_dir
    start_service
}

main
```

---

## 六、Nginx 反向代理配置

### 6.1 nginx.conf (可选)

```nginx
# nginx/nginx.conf
# 用于生产环境反向代理

upstream claude_monitor {
    server 127.0.0.1:51888;
    keepalive 32;
}

server {
    listen 80;
    server_name monitor.example.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monitor.example.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态文件缓存
    location /assets {
        proxy_pass http://claude_monitor;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api {
        proxy_pass http://claude_monitor;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /api/v1/ws {
        proxy_pass http://claude_monitor;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # 默认代理
    location / {
        proxy_pass http://claude_monitor;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 七、监控与日志

### 7.1 日志配置

```python
# backend/app/logger.py
import logging
import sys
from pathlib import Path

def setup_logging(log_level: str = "INFO"):
    """配置日志"""

    # 格式化器
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # 文件处理器
    log_dir = Path("/app/logs")
    log_dir.mkdir(parents=True, exist_ok=True)

    file_handler = logging.handlers.RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10_000_000,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)

    # 根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
```

### 7.2 健康检查端点

```python
# backend/app/api/routes.py

async def health_check(request):
    """
    健康检查端点

    返回：
    - status: 服务状态
    - version: 应用版本
    - uptime: 运行时间
    - claude_dir: Claude 目录状态
    """
    return web.json_response({
        "status": "healthy",
        "version": "1.0.0",
        "uptime": get_uptime(),
        "claude_dir": {
            "path": str(settings.claude_dir),
            "exists": settings.claude_dir.exists(),
            "readable": os.access(settings.claude_dir, os.R_OK)
        }
    })
```

---

## 八、部署清单

### 8.1 首次部署

```bash
# 1. 克隆仓库
git clone https://github.com/your-repo/claude-token-monitor.git
cd claude-token-monitor

# 2. 复制环境配置
cp .env.example .env

# 3. 编辑配置（设置 CLAUDE_DIR）
vim .env

# 4. 构建镜像
make build

# 5. 启动服务
make start

# 6. 检查状态
make health
```

### 8.2 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
make build

# 3. 重启服务
make restart
```

### 8.3 回滚

```bash
# 1. 查看可用镜像
docker images claude-token-monitor

# 2. 使用指定版本
docker compose up -d --no-build
```

---

## 九、镜像大小优化

### 9.1 目标

| 阶段 | 镜像大小 |
|------|----------|
| 基础镜像 (python:3.11-alpine) | ~50MB |
| + Python 依赖 | ~100MB |
| + 前端构建产物 | ~5MB |
| 最终镜像 | ~150MB |

### 9.2 优化策略

1. **多阶段构建**: 分离构建和运行环境
2. **Alpine 基础镜像**: 最小化系统层
3. **依赖精简**: 只安装生产依赖
4. **清理缓存**: pip/pnpm 缓存清理
5. **.dockerignore**: 排除不必要文件

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
