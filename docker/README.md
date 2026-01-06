# Docker 配置使用指南

**作者**: Atlas.oi  
**日期**: 2026-01-07  
**版本**: 1.0.0

---

## 快速开始

### 生产环境

```bash
# 1. 检查环境
make check-env

# 2. 构建镜像
make build

# 3. 启动服务
make start

# 4. 访问应用
open http://localhost:51888
```

### 开发环境

```bash
# 启动开发环境（前后端都会启动）
make dev

# 前端：http://localhost:51173
# 后端：http://localhost:51888
```

---

## 配置文件说明

### 1. Dockerfile（生产环境）

**路径**: `docker/Dockerfile`

**多阶段构建流程**:

```
第一阶段 (frontend-builder)
├─ 基础镜像：node:20-alpine
├─ 安装 pnpm
├─ 安装前端依赖
└─ 构建前端静态资源

第二阶段 (python-builder)
├─ 基础镜像：python:3.11-alpine
├─ 安装编译依赖
└─ 构建 Python 依赖包

第三阶段 (运行时镜像)
├─ 基础镜像：python:3.11-alpine
├─ 复制 Python 依赖
├─ 复制后端代码
├─ 复制前端静态资源
└─ 配置非 root 用户
```

**关键特性**:
- 使用 Alpine Linux（镜像体积小）
- 非 root 用户运行（appuser）
- 自动健康检查
- 时区设置为 Asia/Shanghai

---

### 2. Dockerfile.dev（开发环境）

**路径**: `docker/Dockerfile.dev`

**特点**:
- 包含开发工具（git、bash）
- 安装开发依赖
- 支持代码热重载
- 调试模式启用

**与生产环境的区别**:
```diff
+ 包含 gcc、git 等开发工具
+ 安装 requirements-dev.txt
+ DEBUG=true
+ WATCHFILES_FORCE_POLLING=true
- 不进行多阶段构建优化
```

---

### 3. docker-compose.yml（生产环境）

**路径**: `docker-compose.yml`

**服务配置**:

```yaml
服务: claude-token-monitor
容器名: claude-monitor
端口: 51888:51888
重启策略: unless-stopped
网络: claude-monitor-network (bridge)
```

**资源限制**:

| 资源 | 限制 | 预留 |
|------|------|------|
| CPU | 1.0 核 | 0.25 核 |
| 内存 | 512 MB | 128 MB |

**卷挂载**:

```
~/.claude     → /claude        (只读，Claude CLI 配置)
./data        → /app/data      (读写，数据库文件)
./logs        → /app/logs      (读写，日志文件)
./exports     → /app/exports   (读写，导出文件)
```

**健康检查**:
- 端点：`/api/v1/health`
- 检查间隔：30秒
- 超时时间：3秒
- 重试次数：3次
- 启动等待：5秒

---

### 4. docker-compose.dev.yml（开发环境）

**路径**: `docker-compose.dev.yml`

**服务拆分**:

#### 后端服务 (backend)

```yaml
容器名: claude-monitor-backend-dev
端口: 51888
挂载: ./backend → /app/backend
热重载: 启用
日志级别: DEBUG
```

#### 前端服务 (frontend)

```yaml
容器名: claude-monitor-frontend-dev
端口: 51173
挂载: ./frontend → /app
Node modules: 命名卷（提高性能）
开发服务器: Vite (0.0.0.0:51173)
```

**网络**: `claude-monitor-dev-network`

---

## 环境变量

### 生产环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `CLAUDE_DIR` | `/claude` | Claude CLI 配置目录 |
| `DATABASE_PATH` | `/app/data/monitor.db` | 数据库文件路径 |
| `BACKEND_PORT` | `51888` | 后端服务端口 |
| `API_PREFIX` | `/api/v1` | API 路径前缀 |
| `LOG_LEVEL` | `INFO` | 日志级别 |
| `DEBUG` | `false` | 调试模式 |
| `TZ` | `Asia/Shanghai` | 时区设置 |

### 开发环境额外变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DEBUG` | `true` | 启用调试模式 |
| `LOG_LEVEL` | `DEBUG` | 详细日志 |
| `WATCHFILES_FORCE_POLLING` | `true` | 强制轮询文件变化 |
| `NODE_ENV` | `development` | Node 环境 |
| `VITE_API_URL` | `http://localhost:51888/api/v1` | API 地址 |

---

## 常用命令

### Makefile 命令

```bash
# 环境管理
make check-env      # 检查环境配置
make setup          # 初始化项目

# 构建与部署
make build          # 构建 Docker 镜像
make start          # 启动生产环境服务
make stop           # 停止服务
make restart        # 重启服务
make logs           # 查看服务日志

# 开发环境
make dev            # 启动开发环境（前后端）
make dev-backend    # 仅启动后端
make dev-frontend   # 仅启动前端

# 测试
make test           # 运行所有测试
make test-backend   # 运行后端测试
make test-frontend  # 运行前端测试
make coverage       # 生成覆盖率报告

# 维护
make clean          # 清理容器和镜像
make clean-ports    # 清理端口占用
make health         # 检查服务健康状态

# 工具
make lint           # 代码检查
make format         # 代码格式化
make shell          # 进入容器 Shell
make stats          # 查看资源占用
```

### Docker Compose 命令

```bash
# 生产环境
docker compose up -d                    # 后台启动
docker compose down                     # 停止并删除容器
docker compose logs -f                  # 查看日志
docker compose ps                       # 查看服务状态
docker compose config                   # 验证配置

# 开发环境
docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

---

## 故障排查

### 1. 端口占用

**问题**: 端口 51888 或 51173 已被占用

**解决方案**:

```bash
# 使用 Makefile 清理端口
make clean-ports

# 或手动清理（macOS/Linux）
lsof -ti:51888 | xargs kill -9
lsof -ti:51173 | xargs kill -9
```

---

### 2. 健康检查失败

**问题**: 容器启动但健康检查失败

**排查步骤**:

```bash
# 1. 查看容器日志
docker logs claude-monitor

# 2. 进入容器检查
docker exec -it claude-monitor sh

# 3. 手动测试健康检查端点
curl http://localhost:51888/api/v1/health

# 4. 检查进程
ps aux | grep python
```

---

### 3. 构建失败

**问题**: Docker 镜像构建失败

**解决方案**:

```bash
# 1. 清理构建缓存
docker builder prune

# 2. 强制重新构建
docker compose build --no-cache

# 3. 检查依赖文件是否存在
ls -la backend/requirements.txt
ls -la frontend/package.json
```

---

### 4. 卷挂载问题

**问题**: `~/.claude` 目录不存在或无法访问

**解决方案**:

```bash
# 1. 检查目录是否存在
ls -la ~/.claude

# 2. 修改 .env 文件中的 CLAUDE_DIR 路径
vim .env

# 3. 确保目录有读取权限
chmod 755 ~/.claude
```

---

## 性能优化

### 1. 镜像优化

```bash
# 查看镜像大小
docker images | grep claude-token-monitor

# 清理悬空镜像
docker image prune -f

# 使用 dive 分析镜像层
dive claude-token-monitor:latest
```

### 2. 开发环境性能

**node_modules 使用命名卷**:

开发环境配置中，前端 `node_modules` 使用 Docker 命名卷而非绑定挂载，显著提高 I/O 性能：

```yaml
volumes:
  - ./frontend:/app
  - frontend-node-modules:/app/node_modules  # 命名卷
```

---

## 安全建议

### 1. 生产环境

- ✅ 使用非 root 用户运行
- ✅ 只读挂载敏感目录（`~/.claude:ro`）
- ✅ 设置资源限制
- ✅ 定期更新基础镜像

### 2. 网络安全

```bash
# 生产环境应该限制 CORS
# 修改 backend/app/main.py 中的 allow_origins

# 示例
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # 仅允许特定域名
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

---

## 备份与恢复

### 数据备份

```bash
# 使用 Makefile
make db-backup

# 手动备份
cp data/monitor.db backups/monitor-$(date +%Y%m%d-%H%M%S).db
```

### 数据恢复

```bash
# 查看可用备份
make db-restore

# 手动恢复
cp backups/monitor-20260107-123456.db data/monitor.db
```

---

## 下一步

完成 Docker 配置后，继续以下任务：

1. **P0-3**: 完善后端应用代码
   - 实现完整的 API 接口
   - 添加数据库模型
   - 完善业务逻辑

2. **P0-4**: 完善前端应用代码
   - 实现完整的 UI 组件
   - 添加路由和状态管理
   - 对接后端 API

3. **P0-5**: 测试与 CI/CD
   - 编写完整的单元测试
   - 配置持续集成
   - 准备生产部署

---

## 参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Vite 文档](https://vitejs.dev/)
- [Alpine Linux](https://alpinelinux.org/)

---

**最后更新**: 2026-01-07  
**维护者**: Atlas.oi
