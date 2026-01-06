# Claude Token Monitor - Backend

Claude Token 使用监控系统后端服务

## 技术栈

- **Python**: 3.11+
- **Web 框架**: FastAPI + Uvicorn
- **异步 HTTP**: aiohttp
- **数据库**: SQLite (aiosqlite)
- **数据验证**: Pydantic v2
- **测试框架**: pytest + pytest-cov + pytest-asyncio

## 项目结构

```
backend/
├── app/                          # 应用主目录
│   ├── core/                     # 核心模块
│   │   ├── __init__.py          # 模块导出
│   │   ├── config.py            # 配置管理（基于 Pydantic Settings）
│   │   ├── logger.py            # 日志配置（支持请求追踪）
│   │   └── schemas.py           # 数据模型定义（Pydantic v2）
│   ├── api/                      # API 路由
│   ├── db/                       # 数据库相关
│   └── main.py                   # 应用入口
├── tests/                        # 测试目录
│   ├── conftest.py              # pytest 配置
│   ├── test_config.py           # 配置测试
│   └── test_schemas.py          # 模型测试
├── pyproject.toml               # 项目配置（现代 Python 项目）
├── requirements.txt             # 生产依赖
└── requirements-dev.txt         # 开发依赖

```

## 核心模块

### 配置管理 (config.py)

- 基于 Pydantic Settings 实现
- 支持环境变量和 .env 文件
- 自动路径展开（`~/.claude` → 完整路径）
- 配置验证和类型检查
- 单例模式

**配置项：**
- `claude_dir`: Claude CLI 配置目录（默认 `~/.claude`）
- `database_path`: 数据库路径（默认 `data/monitor.db`）
- `backend_port`: 后端端口（默认 `51888`）
- `log_level`: 日志级别（默认 `INFO`）
- `debug`: 调试模式（默认 `False`）
- `api_prefix`: API 前缀（默认 `/api/v1`）

### 日志模块 (logger.py)

- 支持控制台和文件双输出
- 开发环境：带颜色的格式化输出
- 生产环境：JSON 格式（便于日志分析）
- 请求 ID 追踪功能
- 自动创建日志目录

### 数据模型 (schemas.py)

**核心模型：**
- `ModelUsage`: 模型使用数据
- `DailyModelTokens`: 每日模型 Token 统计
- `DailyActivity`: 每日活动数据
- `StatsCache`: 统计缓存数据
- `SessionInfo`: 会话信息
- `ExportRequest/ExportResponse`: 导出相关
- `ApiResponse`: API 统一响应格式

所有模型基于 Pydantic v2，支持：
- 自动数据验证
- 序列化/反序列化
- JSON Schema 生成
- 类型注解

## 安装

### 开发环境

```bash
# 安装依赖
pip install -e .
pip install -r requirements-dev.txt

# 或使用 pip 直接安装
pip install -r requirements.txt -r requirements-dev.txt
```

### 配置环境变量

创建 `.env` 文件：

```bash
# 服务配置
BACKEND_PORT=51888
DEBUG=false
LOG_LEVEL=INFO

# Claude 配置
CLAUDE_DIR=~/.claude

# 数据库配置
DATABASE_PATH=data/monitor.db

# CORS 配置（可选）
CORS_ORIGINS=["*"]
```

## 运行

### 开发模式

```bash
# 使用 uvicorn 直接运行
uvicorn app.main:app --reload --port 51888

# 或使用 Python 模块方式
python -m app.main
```

### 生产模式

```bash
# 禁用自动重载
uvicorn app.main:app --host 0.0.0.0 --port 51888
```

## 测试

### 运行所有测试

```bash
pytest
```

### 运行特定测试文件

```bash
# 配置测试
pytest tests/test_config.py -v

# 模型测试
pytest tests/test_schemas.py -v
```

### 生成覆盖率报告

```bash
# 生成控制台报告
pytest --cov=app --cov-report=term-missing

# 生成 HTML 报告
pytest --cov=app --cov-report=html

# 查看 HTML 报告
open htmlcov/index.html
```

### 测试覆盖率要求

- **配置模块**: 100% 覆盖率 ✅
- **数据模型**: 95%+ 覆盖率 ✅
- **总体要求**: 90%+ 覆盖率

## 代码质量

### 代码格式化

```bash
# 使用 Black 格式化代码
black app tests

# 检查格式
black --check app tests
```

### 代码检查

```bash
# 使用 Ruff 进行代码检查
ruff check app tests

# 自动修复
ruff check --fix app tests
```

### 类型检查

```bash
# 使用 MyPy 进行类型检查
mypy app
```

## 开发规范

### 代码风格

- 遵循 PEP 8 规范
- 使用 Black 进行格式化（行长度 100）
- 使用 Ruff 进行代码检查
- 使用类型注解（Type Hints）

### 注释规范

所有文件必须包含：
```python
"""
@file: filename.py
@description: 文件功能描述
@author: Atlas.oi
@date: 2026-01-07
"""
```

### 测试规范

- 每个模块都需要对应的测试文件
- 测试覆盖率不低于 90%
- 使用 pytest fixtures 进行测试数据管理
- 异步代码使用 pytest-asyncio

## 性能优化

- 使用异步 IO（aiohttp, aiosqlite）
- 配置缓存（避免重复计算）
- 数据库连接池
- 请求批处理

## 安全性

- 环境变量隔离敏感配置
- 输入数据验证（Pydantic）
- CORS 配置（生产环境应限制源）
- SQL 注入防护（使用 ORM/参数化查询）

## 监控和日志

- 结构化日志（JSON 格式）
- 请求 ID 追踪
- 错误堆栈记录
- 性能指标收集

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t claude-token-monitor-backend .

# 运行容器
docker run -p 51888:51888 -v $(pwd)/data:/app/data claude-token-monitor-backend
```

### 环境变量配置

生产环境必须设置：
- `DEBUG=false`
- `LOG_LEVEL=INFO` 或 `WARNING`
- `CORS_ORIGINS=["https://your-domain.com"]`

## 许可证

MIT License

## 作者

Atlas.oi

## 更新日志

### 2026-01-07
- ✅ BE-1.1: 项目初始化完成
- ✅ BE-1.2: 配置管理模块（100% 测试覆盖率）
- ✅ BE-1.3: 日志配置模块
- ✅ BE-1.4: 数据模型定义（96%+ 测试覆盖率）
- ✅ 所有测试通过（54/54）
