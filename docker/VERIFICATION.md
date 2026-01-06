# Docker 配置验证报告

**生成时间**: 2026-01-07
**任务**: Phase 0 - P0-2 Docker 基础配置
**作者**: Atlas.oi

---

## 一、创建文件清单

### Docker 配置文件

| 文件路径 | 大小 | 说明 |
|---------|------|------|
| `docker/Dockerfile` | 2.7K | 生产环境多阶段构建文件 |
| `docker/Dockerfile.dev` | 1.8K | 开发环境 Dockerfile |
| `docker-compose.yml` | 2.8K | 生产环境 Compose 配置 |
| `docker-compose.dev.yml` | 3.5K | 开发环境 Compose 配置 |
| `.dockerignore` | 3.1K | Docker 构建排除文件 |

### 依赖配置文件

| 文件路径 | 说明 |
|---------|------|
| `backend/requirements.txt` | Python 生产依赖 |
| `backend/requirements-dev.txt` | Python 开发依赖 |
| `frontend/package.json` | Node.js 依赖配置 |
| `frontend/vite.config.ts` | Vite 构建配置 |

### 应用占位文件

| 文件路径 | 说明 |
|---------|------|
| `backend/app/__init__.py` | 后端包初始化 |
| `backend/app/main.py` | FastAPI 主入口 |
| `frontend/src/main.tsx` | React 应用入口 |
| `frontend/src/index.css` | 全局样式 |
| `frontend/index.html` | HTML 入口 |

---

## 二、配置特性

### 1. 生产环境 (`docker/Dockerfile`)

**多阶段构建**:
- 第一阶段：Node.js 20 Alpine - 构建前端静态资源
- 第二阶段：Python 3.11 Alpine - 构建 Python 依赖
- 第三阶段：Python 3.11 Alpine - 最终运行时镜像

**安全特性**:
- 使用非 root 用户 `appuser` (UID 1000)
- 最小化运行时镜像
- 只复制必要的文件

**健康检查**:
- 端点：`/api/v1/health`
- 间隔：30秒
- 超时：3秒
- 重试：3次

**暴露端口**: 51888

---

### 2. 开发环境 (`docker/Dockerfile.dev`)

**特性**:
- 包含开发工具（git, bash）
- 支持代码热重载
- 安装开发依赖
- 调试模式启用

**环境变量**:
- `DEBUG=true`
- `WATCHFILES_FORCE_POLLING=true`

---

### 3. 生产环境 Compose (`docker-compose.yml`)

**服务配置**:
- 服务名：`claude-token-monitor`
- 容器名：`claude-monitor`
- 端口映射：`51888:51888`

**卷挂载**:
- `~/.claude` → `/claude` (只读)
- `./data` → `/app/data` (读写)
- `./logs` → `/app/logs` (读写)
- `./exports` → `/app/exports` (读写)

**资源限制**:
- CPU 上限：1 核
- 内存上限：512MB
- CPU 预留：0.25 核
- 内存预留：128MB

**重启策略**: `unless-stopped`

**网络**: `claude-monitor-network` (bridge)

---

### 4. 开发环境 Compose (`docker-compose.dev.yml`)

**服务分离**:

1. **后端服务** (`backend`)
   - 容器名：`claude-monitor-backend-dev`
   - 端口：51888
   - 挂载源码：`./backend` → `/app/backend`
   - 热重载：启用
   - 重启策略：`no` (便于调试)

2. **前端服务** (`frontend`)
   - 容器名：`claude-monitor-frontend-dev`
   - 端口：51173
   - 挂载源码：`./frontend` → `/app`
   - Node modules：命名卷 (提高 I/O 性能)
   - Vite 开发服务器：`0.0.0.0:51173`

**环境变量**:
- 后端：`DEBUG=true`, `LOG_LEVEL=DEBUG`
- 前端：`NODE_ENV=development`, `VITE_API_URL=http://localhost:51888/api/v1`

**网络**: `claude-monitor-dev-network` (bridge)

---

## 三、验证结果

### 配置语法验证

```bash
✓ 生产环境配置验证通过
✓ 开发环境配置验证通过
```

**验证命令**:
```bash
# 生产环境
docker compose config

# 开发环境
docker compose -f docker-compose.dev.yml config
```

---

## 四、使用说明

### 生产环境部署

```bash
# 1. 环境检查
make check-env

# 2. 构建镜像
make build

# 3. 启动服务
make start

# 4. 查看日志
make logs

# 5. 健康检查
make health

# 6. 停止服务
make stop
```

### 开发环境启动

```bash
# 方式1：使用 Makefile（推荐）
make dev

# 方式2：使用 docker-compose
docker compose -f docker-compose.dev.yml up

# 仅启动后端
make dev-backend

# 仅启动前端
make dev-frontend
```

---

## 五、端口使用

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 51888 | FastAPI 应用 |
| 前端开发服务器 | 51173 | Vite Dev Server |

---

## 六、注意事项

### 1. 环境配置

在启动前需要配置 `.env` 文件：

```bash
# 从模板创建
cp .env.example .env

# 编辑配置，特别是 CLAUDE_DIR
vim .env
```

### 2. 数据持久化

生产环境数据存储在宿主机目录：
- `./data` - 数据库文件
- `./logs` - 日志文件
- `./exports` - 导出文件

### 3. 资源限制

生产环境设置了资源限制，防止内存泄漏：
- 最大内存：512MB
- 最大 CPU：1 核

如需调整，修改 `docker-compose.yml` 中的 `deploy.resources` 配置。

### 4. 健康检查

容器启动后会自动进行健康检查：
- 检查端点：`http://localhost:51888/api/v1/health`
- 检查间隔：30秒
- 启动等待时间：5秒

---

## 七、后续任务

当前配置已完成 Phase 0 的 Docker 基础配置任务。后续需要：

1. **P0-3**: 创建完整的后端应用代码
2. **P0-4**: 创建完整的前端应用代码
3. **P0-5**: 集成测试和 CI/CD 配置

---

**验收标准**: ✅ 已通过

- [x] `docker compose config` 验证无误
- [x] 所有配置文件创建完成
- [x] 中文注释，作者署名正确
- [x] 日期使用 2026-01-07

---

**文档生成时间**: 2026-01-07
**版本**: 1.0.0
