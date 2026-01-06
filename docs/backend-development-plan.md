/**
 * @file backend-development-plan.md
 * @description Claude Token Monitor 后端开发计划与任务分解
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 后端开发计划

## 一、项目概述

### 1.1 核心原则

**所有数据均来自 Claude Code 本地存储目录 `~/.claude/`，无网络请求或第三方服务依赖。**

### 1.2 技术栈

| 组件 | 技术选型 | 版本要求 |
|------|----------|----------|
| 运行时 | Python | >= 3.11 |
| Web 框架 | aiohttp | >= 3.9 |
| WebSocket | aiohttp.web | 内置 |
| 文件监听 | watchdog | >= 3.0 |
| 数据库 | SQLite | 内置 |
| ORM | aiosqlite | >= 0.19 |
| 数据验证 | Pydantic | >= 2.5 |
| 测试 | pytest + pytest-asyncio | >= 7.4 |

---

## 二、模块架构

### 2.1 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # 应用入口
│   ├── config.py            # 配置管理
│   ├── logger.py            # 日志配置
│   ├── schemas.py           # Pydantic 数据模型
│   ├── pricing.py           # 定价计算模块
│   ├── core/
│   │   ├── __init__.py
│   │   ├── stats_reader.py  # 统计数据读取
│   │   ├── file_watcher.py  # 文件监听器
│   │   ├── data_processor.py # 数据处理
│   │   └── export_service.py # 导出服务
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py      # 数据库连接
│   │   └── models.py        # 数据库模型
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py        # API 路由
│   │   └── websocket.py     # WebSocket 处理
│   └── utils/
│       ├── __init__.py
│       └── helpers.py       # 工具函数
├── scripts/
│   └── migrate.py           # 数据库迁移
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # pytest 配置
│   ├── test_stats_reader.py
│   ├── test_pricing.py
│   ├── test_routes.py
│   └── test_websocket.py
├── requirements.txt
└── pyproject.toml
```

### 2.2 模块代码量估算

| 模块 | 文件 | 预估行数 | 复杂度 |
|------|------|----------|--------|
| 配置管理 | config.py | 80-100 | 低 |
| 日志配置 | logger.py | 50-60 | 低 |
| 数据模型 | schemas.py | 150-180 | 中 |
| 定价计算 | pricing.py | 120-150 | 中 |
| 统计读取 | stats_reader.py | 200-250 | 高 |
| 文件监听 | file_watcher.py | 150-180 | 高 |
| 数据处理 | data_processor.py | 180-220 | 高 |
| 导出服务 | export_service.py | 100-120 | 中 |
| 数据库 | database.py | 150-180 | 中 |
| API 路由 | routes.py | 200-250 | 高 |
| WebSocket | websocket.py | 150-180 | 高 |
| 应用入口 | main.py | 80-100 | 低 |
| 数据库迁移 | migrate.py | 60-80 | 低 |
| **总计** | **13 文件** | **1,620-2,010** | - |

---

## 三、开发阶段与任务分解

### Phase 1: 基础设施 (Day 1-2)

#### 任务 1.1: 项目初始化
- [ ] 创建 `pyproject.toml` 配置
- [ ] 创建 `requirements.txt` 依赖列表
- [ ] 设置项目目录结构
- [ ] 配置 ruff/black 代码格式化

**验收标准**: `pip install -e .` 成功执行

#### 任务 1.2: 配置管理模块 (config.py)
```python
"""
核心配置项：
- CLAUDE_DIR: Claude 数据目录路径
- DATABASE_PATH: SQLite 数据库路径
- LOG_LEVEL: 日志级别
- POLL_INTERVAL: 文件轮询间隔（秒）
- WS_HEARTBEAT: WebSocket 心跳间隔
"""
```
- [ ] 实现 `Settings` 类（Pydantic BaseSettings）
- [ ] 支持环境变量覆盖
- [ ] 支持 `.env` 文件加载
- [ ] 路径自动检测（macOS/Linux/Windows）

**验收标准**: 配置能正确读取和验证

#### 任务 1.3: 日志配置模块 (logger.py)
- [ ] 配置结构化日志格式
- [ ] 支持日志级别动态调整
- [ ] 支持文件和控制台双输出
- [ ] 添加请求 ID 追踪

**验收标准**: 日志正确输出到控制台和文件

#### 任务 1.4: 数据模型定义 (schemas.py)
```python
"""
核心数据模型：
- StatsCache: 完整统计缓存
- ModelUsage: 单个模型用量
- DailyActivity: 每日活动
- DailyModelTokens: 每日模型 token
- SessionInfo: 会话信息
- ExportRequest: 导出请求
- ExportResponse: 导出响应
"""
```
- [ ] 定义所有 Pydantic 模型
- [ ] 添加数据验证规则
- [ ] 添加 JSON 序列化配置
- [ ] 编写模型单元测试

**验收标准**: 所有模型能正确序列化/反序列化

---

### Phase 2: 核心读取逻辑 (Day 3-4)

#### 任务 2.1: 统计数据读取器 (stats_reader.py)
```python
"""
核心功能：
- read_stats_cache(): 读取 stats-cache.json
- parse_jsonl_files(): 解析 JSONL 会话日志
- get_model_usage(): 获取模型用量统计
- get_daily_activity(): 获取每日活动
- calculate_cache_hit_rate(): 计算缓存命中率
"""
```
- [ ] 实现 `StatsReader` 类
- [ ] 安全的文件读取（异常处理）
- [ ] 支持增量解析 JSONL
- [ ] 缓存命中率计算
- [ ] 编写单元测试（覆盖率 > 90%）

**验收标准**: 能正确读取和解析本地数据文件

#### 任务 2.2: 定价计算模块 (pricing.py)
```python
"""
定价配置（2025年1月）：
- Claude Opus 4.5: $15/M 输入, $75/M 输出, $1.5/M 缓存读取, $18.75/M 缓存写入
- Claude Sonnet 4.5: $3/M 输入, $15/M 输出, $0.3/M 缓存读取, $3.75/M 缓存写入
- Claude Haiku 4.5: $0.8/M 输入, $4/M 输出, $0.08/M 缓存读取, $1/M 缓存写入
"""
```
- [ ] 定义模型定价配置
- [ ] 实现 `calculate_cost()` 函数
- [ ] 支持多模型聚合计算
- [ ] 支持时间范围筛选
- [ ] 编写单元测试

**验收标准**: 费用计算结果与手动计算一致

#### 任务 2.3: 数据处理器 (data_processor.py)
```python
"""
核心功能：
- aggregate_daily_stats(): 聚合每日统计
- aggregate_model_stats(): 聚合模型统计
- calculate_trends(): 计算趋势数据
- filter_by_date_range(): 按日期范围筛选
"""
```
- [ ] 实现数据聚合逻辑
- [ ] 实现趋势计算
- [ ] 实现日期范围筛选
- [ ] 编写单元测试

**验收标准**: 聚合数据正确，性能满足要求

---

### Phase 3: 文件监听与实时更新 (Day 5-6)

#### 任务 3.1: 文件监听器 (file_watcher.py)
```python
"""
核心功能：
- watch_stats_cache(): 监听 stats-cache.json 变化
- watch_jsonl_files(): 监听 JSONL 文件变化
- on_file_modified(): 文件修改回调
- start_watching(): 启动监听
- stop_watching(): 停止监听
"""
```
- [ ] 实现 `FileWatcher` 类
- [ ] 使用 watchdog 监听文件变化
- [ ] 防抖处理（避免频繁触发）
- [ ] 支持优雅停止
- [ ] 编写集成测试

**验收标准**: 文件变化能在 1 秒内检测到

#### 任务 3.2: WebSocket 处理器 (websocket.py)
```python
"""
核心功能：
- handle_websocket(): WebSocket 连接处理
- broadcast(): 广播消息到所有客户端
- send_stats_update(): 发送统计更新
- handle_heartbeat(): 心跳处理
"""
```
- [ ] 实现 WebSocket 连接管理
- [ ] 实现消息广播机制
- [ ] 实现心跳检测
- [ ] 连接断开自动清理
- [ ] 编写集成测试

**验收标准**: WebSocket 连接稳定，消息实时推送

---

### Phase 4: API 与数据库 (Day 7-8)

#### 任务 4.1: 数据库模块 (database.py)
```python
"""
核心功能：
- init_db(): 初始化数据库
- save_stats_snapshot(): 保存统计快照
- get_historical_stats(): 获取历史统计
- cleanup_old_data(): 清理旧数据
"""
```
- [ ] 实现数据库连接池
- [ ] 定义数据库表结构
- [ ] 实现 CRUD 操作
- [ ] 实现数据清理策略
- [ ] 编写数据库迁移脚本

**验收标准**: 数据库操作正确，迁移脚本可执行

#### 任务 4.2: API 路由 (routes.py)
```python
"""
API 端点：
GET  /api/v1/health          - 健康检查
GET  /api/v1/stats           - 获取当前统计
GET  /api/v1/stats/daily     - 获取每日统计
GET  /api/v1/stats/models    - 获取模型统计
GET  /api/v1/stats/trends    - 获取趋势数据
GET  /api/v1/stats/history   - 获取历史数据
POST /api/v1/export          - 导出数据
GET  /api/v1/config          - 获取配置
"""
```
- [ ] 实现所有 API 端点
- [ ] 添加请求验证
- [ ] 添加错误处理中间件
- [ ] 添加 CORS 配置
- [ ] 编写 API 测试

**验收标准**: 所有 API 端点正常工作

#### 任务 4.3: 导出服务 (export_service.py)
```python
"""
导出格式：
- CSV: 表格数据导出
- JSON: 完整数据导出
"""
```
- [ ] 实现 CSV 导出
- [ ] 实现 JSON 导出
- [ ] 支持时间范围筛选
- [ ] 支持字段选择
- [ ] 编写单元测试

**验收标准**: 导出文件格式正确，数据完整

---

### Phase 5: 集成与测试 (Day 9)

#### 任务 5.1: 应用入口 (main.py)
```python
"""
核心功能：
- create_app(): 创建 aiohttp 应用
- setup_routes(): 配置路由
- setup_middlewares(): 配置中间件
- start_background_tasks(): 启动后台任务
- cleanup(): 清理资源
"""
```
- [ ] 实现应用工厂函数
- [ ] 配置静态文件服务
- [ ] 集成所有模块
- [ ] 实现优雅关闭
- [ ] 编写启动脚本

**验收标准**: 应用能正常启动和关闭

#### 任务 5.2: 集成测试
- [ ] API 端点集成测试
- [ ] WebSocket 集成测试
- [ ] 文件监听集成测试
- [ ] 数据库集成测试
- [ ] 端到端流程测试

**验收标准**: 测试覆盖率 > 80%

#### 任务 5.3: 性能测试
- [ ] API 响应时间测试（P99 < 200ms）
- [ ] WebSocket 延迟测试（< 100ms）
- [ ] 内存占用测试（< 100MB）
- [ ] 并发连接测试（> 100 连接）

**验收标准**: 性能指标满足要求

---

## 四、关键代码示例

### 4.1 配置管理 (config.py)

```python
"""
@file: config.py
@description: 应用配置管理
@author: Atlas.oi
@date: 2026-01-06
"""

from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
import platform

class Settings(BaseSettings):
    """应用配置"""

    # Claude 数据目录
    claude_dir: Path = Field(
        default_factory=lambda: Path.home() / ".claude",
        description="Claude Code 数据目录路径"
    )

    # 数据库配置
    database_path: Path = Field(
        default=Path("data/monitor.db"),
        description="SQLite 数据库路径"
    )

    # 服务配置
    host: str = Field(default="0.0.0.0", description="监听地址")
    port: int = Field(default=8080, description="监听端口")

    # 轮询配置
    poll_interval: int = Field(default=30, description="文件轮询间隔（秒）")

    # WebSocket 配置
    ws_heartbeat: int = Field(default=30, description="WebSocket 心跳间隔（秒）")

    # 日志配置
    log_level: str = Field(default="INFO", description="日志级别")

    class Config:
        env_prefix = "CTM_"
        env_file = ".env"

settings = Settings()
```

### 4.2 统计读取器 (stats_reader.py)

```python
"""
@file: stats_reader.py
@description: Claude 统计数据读取器
@author: Atlas.oi
@date: 2026-01-06
"""

import json
from pathlib import Path
from typing import Optional
from app.config import settings
from app.schemas import StatsCache, ModelUsage

class StatsReader:
    """统计数据读取器"""

    def __init__(self, claude_dir: Optional[Path] = None):
        self.claude_dir = claude_dir or settings.claude_dir
        self.stats_file = self.claude_dir / "stats-cache.json"

    async def read_stats_cache(self) -> Optional[StatsCache]:
        """
        读取 stats-cache.json 文件

        Returns:
            StatsCache: 统计缓存数据，文件不存在返回 None
        """
        if not self.stats_file.exists():
            return None

        with open(self.stats_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        return StatsCache.model_validate(data)

    def calculate_cache_hit_rate(self, usage: ModelUsage) -> float:
        """
        计算缓存命中率

        公式: cacheReadTokens / (inputTokens + cacheReadTokens + cacheCreationTokens)

        Args:
            usage: 模型用量数据

        Returns:
            float: 缓存命中率 (0-1)
        """
        total_input = (
            usage.input_tokens +
            usage.cache_read_input_tokens +
            usage.cache_creation_input_tokens
        )

        if total_input == 0:
            return 0.0

        return usage.cache_read_input_tokens / total_input
```

### 4.3 定价计算 (pricing.py)

```python
"""
@file: pricing.py
@description: Claude API 定价计算
@author: Atlas.oi
@date: 2026-01-06
"""

from dataclasses import dataclass
from typing import Dict
from app.schemas import ModelUsage

@dataclass
class ModelPricing:
    """模型定价配置"""
    input_price: float      # 每百万 token 输入价格（美元）
    output_price: float     # 每百万 token 输出价格（美元）
    cache_read_price: float # 每百万 token 缓存读取价格（美元）
    cache_write_price: float # 每百万 token 缓存写入价格（美元）

# Anthropic 官方定价（2025年1月）
PRICING_CONFIG: Dict[str, ModelPricing] = {
    "claude-opus-4-5": ModelPricing(
        input_price=15.0,
        output_price=75.0,
        cache_read_price=1.5,
        cache_write_price=18.75
    ),
    "claude-sonnet-4-5": ModelPricing(
        input_price=3.0,
        output_price=15.0,
        cache_read_price=0.3,
        cache_write_price=3.75
    ),
    "claude-haiku-4-5": ModelPricing(
        input_price=0.8,
        output_price=4.0,
        cache_read_price=0.08,
        cache_write_price=1.0
    ),
}

def calculate_cost(usage: ModelUsage, model_name: str) -> float:
    """
    计算模型使用费用

    Args:
        usage: 模型用量数据
        model_name: 模型名称

    Returns:
        float: 费用（美元）
    """
    # 标准化模型名称
    normalized_name = normalize_model_name(model_name)
    pricing = PRICING_CONFIG.get(normalized_name)

    if not pricing:
        return 0.0

    cost = (
        usage.input_tokens * pricing.input_price +
        usage.output_tokens * pricing.output_price +
        usage.cache_read_input_tokens * pricing.cache_read_price +
        usage.cache_creation_input_tokens * pricing.cache_write_price
    ) / 1_000_000

    return round(cost, 4)

def normalize_model_name(model_name: str) -> str:
    """标准化模型名称"""
    name_lower = model_name.lower()

    if "opus" in name_lower:
        return "claude-opus-4-5"
    elif "sonnet" in name_lower:
        return "claude-sonnet-4-5"
    elif "haiku" in name_lower:
        return "claude-haiku-4-5"

    return model_name
```

---

## 五、测试要求

### 5.1 单元测试

| 模块 | 测试文件 | 最低覆盖率 |
|------|----------|------------|
| config.py | test_config.py | 90% |
| schemas.py | test_schemas.py | 95% |
| pricing.py | test_pricing.py | 95% |
| stats_reader.py | test_stats_reader.py | 90% |
| data_processor.py | test_data_processor.py | 85% |
| export_service.py | test_export_service.py | 85% |

### 5.2 集成测试

| 测试场景 | 测试文件 | 说明 |
|----------|----------|------|
| API 端点 | test_api_integration.py | 所有 API 端点 |
| WebSocket | test_ws_integration.py | 连接、消息、心跳 |
| 文件监听 | test_watcher_integration.py | 文件变化检测 |
| 数据库 | test_db_integration.py | CRUD 操作 |

### 5.3 测试命令

```bash
# 运行所有测试
pytest -v --cov=app tests/

# 运行单元测试
pytest -v tests/unit/

# 运行集成测试
pytest -v tests/integration/

# 生成覆盖率报告
pytest --cov=app --cov-report=html tests/
```

---

## 六、依赖清单

### requirements.txt

```
# Web 框架
aiohttp>=3.9.0
aiohttp-cors>=0.7.0

# 数据验证
pydantic>=2.5.0
pydantic-settings>=2.1.0

# 数据库
aiosqlite>=0.19.0

# 文件监听
watchdog>=3.0.0

# 工具
python-dotenv>=1.0.0
orjson>=3.9.0

# 测试
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
aiohttp-pytest-plugin>=0.1.0

# 代码质量
ruff>=0.1.0
black>=23.0.0
mypy>=1.7.0
```

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
