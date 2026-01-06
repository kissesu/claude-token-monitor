/**
 * @file database-design.md
 * @description Claude Token Monitor 数据库设计文档
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 数据库设计文档

## 一、设计概述

### 1.1 设计原则

1. **本地优先**: 所有数据来源于 `~/.claude/stats-cache.json`，数据库仅用于历史数据存储和查询优化
2. **轻量级**: 使用 SQLite，无需额外数据库服务
3. **高性能**: 合理索引设计，支持快速时间范围查询
4. **可扩展**: 预留扩展字段，支持未来功能增加

### 1.2 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 数据库 | SQLite 3 | 轻量、无服务、跨平台、单文件 |
| ORM | aiosqlite | 异步支持、与 aiohttp 配合 |
| 迁移工具 | 自定义脚本 | 项目简单，无需重型迁移框架 |

### 1.3 数据库文件位置

```
项目根目录/
├── data/
│   ├── monitor.db          # 主数据库文件
│   └── monitor.db-journal  # SQLite 日志文件（自动生成）
```

---

## 二、ER 图

```
┌─────────────────────┐       ┌─────────────────────┐
│   stats_snapshots   │       │   model_usage_logs  │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ captured_at         │──┐    │ snapshot_id (FK)    │──┐
│ total_input_tokens  │  │    │ model_name          │  │
│ total_output_tokens │  │    │ input_tokens        │  │
│ total_cache_read    │  │    │ output_tokens       │  │
│ total_cache_write   │  │    │ cache_read_tokens   │  │
│ total_cost_usd      │  │    │ cache_write_tokens  │  │
│ cache_hit_rate      │  │    │ cost_usd            │  │
│ raw_json            │  │    │ cache_hit_rate      │  │
└─────────────────────┘  │    └─────────────────────┘  │
                         │                              │
                         │    ┌─────────────────────┐  │
                         │    │  daily_aggregates   │  │
                         │    ├─────────────────────┤  │
                         │    │ id (PK)             │  │
                         └───>│ date (UNIQUE)       │<─┘
                              │ total_input_tokens  │
                              │ total_output_tokens │
                              │ total_cache_read    │
                              │ total_cache_write   │
                              │ total_cost_usd      │
                              │ avg_cache_hit_rate  │
                              │ session_count       │
                              │ model_breakdown     │
                              └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│   export_history    │       │   system_config     │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ key (PK)            │
│ exported_at         │       │ value               │
│ format              │       │ updated_at          │
│ date_range_start    │       └─────────────────────┘
│ date_range_end      │
│ file_path           │
│ record_count        │
└─────────────────────┘
```

---

## 三、表结构定义

### 3.1 stats_snapshots（统计快照表）

存储定期捕获的完整统计快照，用于历史趋势分析。

```sql
-- ============================================
-- 统计快照表
-- 存储每次轮询捕获的完整统计数据
-- ============================================
CREATE TABLE IF NOT EXISTS stats_snapshots (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 快照捕获时间（UTC）
    captured_at DATETIME NOT NULL DEFAULT (datetime('now')),

    -- 汇总统计
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_write_tokens INTEGER NOT NULL DEFAULT 0,

    -- 费用统计（美元，保留4位小数）
    total_cost_usd REAL NOT NULL DEFAULT 0.0,

    -- 缓存命中率（0-1）
    cache_hit_rate REAL NOT NULL DEFAULT 0.0,

    -- 原始 JSON 数据（压缩存储，用于数据恢复）
    raw_json TEXT,

    -- 数据来源文件修改时间
    source_mtime DATETIME,

    -- 创建时间
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- 时间范围查询索引
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at
    ON stats_snapshots(captured_at);

-- 按日期分组索引
CREATE INDEX IF NOT EXISTS idx_snapshots_date
    ON stats_snapshots(date(captured_at));
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增主键 |
| captured_at | DATETIME | 快照捕获时间（UTC） |
| total_input_tokens | INTEGER | 总输入 token 数 |
| total_output_tokens | INTEGER | 总输出 token 数 |
| total_cache_read_tokens | INTEGER | 缓存读取 token 数 |
| total_cache_write_tokens | INTEGER | 缓存写入 token 数 |
| total_cost_usd | REAL | 总费用（美元） |
| cache_hit_rate | REAL | 缓存命中率（0-1） |
| raw_json | TEXT | 原始 JSON 数据（可选） |
| source_mtime | DATETIME | 源文件修改时间 |
| created_at | DATETIME | 记录创建时间 |

---

### 3.2 model_usage_logs（模型用量日志表）

存储每个模型的详细用量记录。

```sql
-- ============================================
-- 模型用量日志表
-- 按模型分别记录用量，支持多模型分析
-- ============================================
CREATE TABLE IF NOT EXISTS model_usage_logs (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 关联快照
    snapshot_id INTEGER NOT NULL,

    -- 模型名称（标准化）
    model_name TEXT NOT NULL,

    -- 模型显示名称（原始）
    model_display_name TEXT,

    -- Token 用量
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    cache_write_tokens INTEGER NOT NULL DEFAULT 0,

    -- 费用（美元）
    cost_usd REAL NOT NULL DEFAULT 0.0,

    -- 缓存命中率
    cache_hit_rate REAL NOT NULL DEFAULT 0.0,

    -- 记录时间
    recorded_at DATETIME NOT NULL DEFAULT (datetime('now')),

    -- 外键约束
    FOREIGN KEY (snapshot_id) REFERENCES stats_snapshots(id) ON DELETE CASCADE
);

-- 快照关联索引
CREATE INDEX IF NOT EXISTS idx_model_usage_snapshot
    ON model_usage_logs(snapshot_id);

-- 模型名称索引
CREATE INDEX IF NOT EXISTS idx_model_usage_model
    ON model_usage_logs(model_name);

-- 时间+模型复合索引
CREATE INDEX IF NOT EXISTS idx_model_usage_time_model
    ON model_usage_logs(recorded_at, model_name);
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增主键 |
| snapshot_id | INTEGER | 关联的快照 ID |
| model_name | TEXT | 标准化模型名（如 claude-opus-4-5） |
| model_display_name | TEXT | 原始模型名（如 claude-opus-4-5-20251101） |
| input_tokens | INTEGER | 输入 token 数 |
| output_tokens | INTEGER | 输出 token 数 |
| cache_read_tokens | INTEGER | 缓存读取 token 数 |
| cache_write_tokens | INTEGER | 缓存写入 token 数 |
| cost_usd | REAL | 费用（美元） |
| cache_hit_rate | REAL | 缓存命中率 |
| recorded_at | DATETIME | 记录时间 |

---

### 3.3 daily_aggregates（每日聚合表）

存储按天聚合的统计数据，用于日报表和趋势图。

```sql
-- ============================================
-- 每日聚合表
-- 按天汇总统计数据，优化日报查询性能
-- ============================================
CREATE TABLE IF NOT EXISTS daily_aggregates (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 日期（唯一，格式：YYYY-MM-DD）
    date TEXT NOT NULL UNIQUE,

    -- Token 汇总
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_write_tokens INTEGER NOT NULL DEFAULT 0,

    -- 费用汇总
    total_cost_usd REAL NOT NULL DEFAULT 0.0,

    -- 平均缓存命中率
    avg_cache_hit_rate REAL NOT NULL DEFAULT 0.0,

    -- 会话数量
    session_count INTEGER NOT NULL DEFAULT 0,

    -- 模型用量分解（JSON 格式）
    -- 示例: {"claude-opus-4-5": {"tokens": 1000, "cost": 0.5}, ...}
    model_breakdown TEXT,

    -- 小时分布（JSON 格式，24小时活动热力图数据）
    -- 示例: {"0": 10, "1": 5, ..., "23": 20}
    hourly_distribution TEXT,

    -- 更新时间
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- 日期索引（已有 UNIQUE 约束，自动创建）

-- 日期范围查询索引
CREATE INDEX IF NOT EXISTS idx_daily_date_range
    ON daily_aggregates(date);
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 自增主键 |
| date | TEXT | 日期（YYYY-MM-DD 格式） |
| total_input_tokens | INTEGER | 当日总输入 token |
| total_output_tokens | INTEGER | 当日总输出 token |
| total_cache_read_tokens | INTEGER | 当日缓存读取 token |
| total_cache_write_tokens | INTEGER | 当日缓存写入 token |
| total_cost_usd | REAL | 当日总费用 |
| avg_cache_hit_rate | REAL | 当日平均缓存命中率 |
| session_count | INTEGER | 当日会话数 |
| model_breakdown | TEXT | 模型用量分解（JSON） |
| hourly_distribution | TEXT | 小时分布（JSON） |
| updated_at | DATETIME | 更新时间 |

---

### 3.4 export_history（导出历史表）

记录数据导出操作历史。

```sql
-- ============================================
-- 导出历史表
-- 记录所有导出操作，便于追溯和重新导出
-- ============================================
CREATE TABLE IF NOT EXISTS export_history (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 导出时间
    exported_at DATETIME NOT NULL DEFAULT (datetime('now')),

    -- 导出格式（csv/json）
    format TEXT NOT NULL CHECK(format IN ('csv', 'json')),

    -- 日期范围
    date_range_start TEXT,
    date_range_end TEXT,

    -- 导出文件路径
    file_path TEXT,

    -- 导出记录数
    record_count INTEGER NOT NULL DEFAULT 0,

    -- 文件大小（字节）
    file_size INTEGER,

    -- 导出状态
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed')),

    -- 错误信息（失败时）
    error_message TEXT
);

-- 导出时间索引
CREATE INDEX IF NOT EXISTS idx_export_time
    ON export_history(exported_at);
```

---

### 3.5 system_config（系统配置表）

存储系统运行时配置。

```sql
-- ============================================
-- 系统配置表
-- 存储运行时配置和元数据
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
    -- 配置键（主键）
    key TEXT PRIMARY KEY,

    -- 配置值（JSON 格式支持复杂类型）
    value TEXT NOT NULL,

    -- 值类型（string/number/boolean/json）
    value_type TEXT NOT NULL DEFAULT 'string',

    -- 描述
    description TEXT,

    -- 更新时间
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- 预置配置项
INSERT OR IGNORE INTO system_config (key, value, value_type, description) VALUES
    ('schema_version', '1', 'number', '数据库 schema 版本'),
    ('last_sync_time', '', 'string', '最后同步时间'),
    ('data_retention_days', '90', 'number', '数据保留天数'),
    ('snapshot_interval_minutes', '30', 'number', '快照间隔（分钟）');
```

---

## 四、数据库初始化脚本

### 4.1 完整初始化 SQL

```sql
-- ============================================
-- Claude Token Monitor 数据库初始化脚本
-- @author: Atlas.oi
-- @date: 2026-01-06
-- ============================================

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 设置 WAL 模式（提升并发性能）
PRAGMA journal_mode = WAL;

-- 设置同步模式（平衡性能和安全）
PRAGMA synchronous = NORMAL;

-- 创建统计快照表
CREATE TABLE IF NOT EXISTS stats_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captured_at DATETIME NOT NULL DEFAULT (datetime('now')),
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_write_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost_usd REAL NOT NULL DEFAULT 0.0,
    cache_hit_rate REAL NOT NULL DEFAULT 0.0,
    raw_json TEXT,
    source_mtime DATETIME,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON stats_snapshots(captured_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON stats_snapshots(date(captured_at));

-- 创建模型用量日志表
CREATE TABLE IF NOT EXISTS model_usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    model_display_name TEXT,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0.0,
    cache_hit_rate REAL NOT NULL DEFAULT 0.0,
    recorded_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (snapshot_id) REFERENCES stats_snapshots(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_model_usage_snapshot ON model_usage_logs(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_model_usage_time_model ON model_usage_logs(recorded_at, model_name);

-- 创建每日聚合表
CREATE TABLE IF NOT EXISTS daily_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    total_cache_write_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost_usd REAL NOT NULL DEFAULT 0.0,
    avg_cache_hit_rate REAL NOT NULL DEFAULT 0.0,
    session_count INTEGER NOT NULL DEFAULT 0,
    model_breakdown TEXT,
    hourly_distribution TEXT,
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_date_range ON daily_aggregates(date);

-- 创建导出历史表
CREATE TABLE IF NOT EXISTS export_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exported_at DATETIME NOT NULL DEFAULT (datetime('now')),
    format TEXT NOT NULL CHECK(format IN ('csv', 'json')),
    date_range_start TEXT,
    date_range_end TEXT,
    file_path TEXT,
    record_count INTEGER NOT NULL DEFAULT 0,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed')),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_export_time ON export_history(exported_at);

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    value_type TEXT NOT NULL DEFAULT 'string',
    description TEXT,
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- 预置配置
INSERT OR IGNORE INTO system_config (key, value, value_type, description) VALUES
    ('schema_version', '1', 'number', '数据库 schema 版本'),
    ('last_sync_time', '', 'string', '最后同步时间'),
    ('data_retention_days', '90', 'number', '数据保留天数'),
    ('snapshot_interval_minutes', '30', 'number', '快照间隔（分钟）');
```

---

## 五、Python ORM 模型

### 5.1 数据库模型定义 (models.py)

```python
"""
@file: models.py
@description: 数据库模型定义
@author: Atlas.oi
@date: 2026-01-06
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any
import json


@dataclass
class StatsSnapshot:
    """统计快照模型"""
    id: Optional[int] = None
    captured_at: datetime = field(default_factory=datetime.utcnow)
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cache_read_tokens: int = 0
    total_cache_write_tokens: int = 0
    total_cost_usd: float = 0.0
    cache_hit_rate: float = 0.0
    raw_json: Optional[str] = None
    source_mtime: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "captured_at": self.captured_at.isoformat(),
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cache_read_tokens": self.total_cache_read_tokens,
            "total_cache_write_tokens": self.total_cache_write_tokens,
            "total_cost_usd": self.total_cost_usd,
            "cache_hit_rate": self.cache_hit_rate,
        }


@dataclass
class ModelUsageLog:
    """模型用量日志模型"""
    id: Optional[int] = None
    snapshot_id: int = 0
    model_name: str = ""
    model_display_name: Optional[str] = None
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
    cost_usd: float = 0.0
    cache_hit_rate: float = 0.0
    recorded_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "model_name": self.model_name,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cache_read_tokens": self.cache_read_tokens,
            "cache_write_tokens": self.cache_write_tokens,
            "cost_usd": self.cost_usd,
            "cache_hit_rate": self.cache_hit_rate,
        }


@dataclass
class DailyAggregate:
    """每日聚合模型"""
    id: Optional[int] = None
    date: str = ""
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cache_read_tokens: int = 0
    total_cache_write_tokens: int = 0
    total_cost_usd: float = 0.0
    avg_cache_hit_rate: float = 0.0
    session_count: int = 0
    model_breakdown: Optional[Dict] = None
    hourly_distribution: Optional[Dict] = None
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "date": self.date,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_cache_read_tokens": self.total_cache_read_tokens,
            "total_cache_write_tokens": self.total_cache_write_tokens,
            "total_cost_usd": self.total_cost_usd,
            "avg_cache_hit_rate": self.avg_cache_hit_rate,
            "session_count": self.session_count,
            "model_breakdown": self.model_breakdown,
            "hourly_distribution": self.hourly_distribution,
        }
```

### 5.2 数据库操作类 (database.py)

```python
"""
@file: database.py
@description: 数据库操作封装
@author: Atlas.oi
@date: 2026-01-06
"""

import aiosqlite
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
from app.config import settings
from app.db.models import StatsSnapshot, ModelUsageLog, DailyAggregate


class Database:
    """数据库操作类"""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.database_path
        self._connection: Optional[aiosqlite.Connection] = None

    async def connect(self) -> None:
        """建立数据库连接"""
        # 确保目录存在
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        self._connection = await aiosqlite.connect(self.db_path)
        self._connection.row_factory = aiosqlite.Row

        # 启用外键约束
        await self._connection.execute("PRAGMA foreign_keys = ON")
        await self._connection.execute("PRAGMA journal_mode = WAL")

    async def close(self) -> None:
        """关闭数据库连接"""
        if self._connection:
            await self._connection.close()
            self._connection = None

    async def init_schema(self) -> None:
        """初始化数据库 schema"""
        schema_sql = Path(__file__).parent / "schema.sql"
        if schema_sql.exists():
            async with self._connection.executescript(schema_sql.read_text()) as cursor:
                await self._connection.commit()

    # ============================================
    # 快照操作
    # ============================================

    async def save_snapshot(self, snapshot: StatsSnapshot) -> int:
        """
        保存统计快照

        Args:
            snapshot: 快照对象

        Returns:
            int: 新插入的快照 ID
        """
        sql = """
            INSERT INTO stats_snapshots (
                captured_at, total_input_tokens, total_output_tokens,
                total_cache_read_tokens, total_cache_write_tokens,
                total_cost_usd, cache_hit_rate, raw_json, source_mtime
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        cursor = await self._connection.execute(sql, (
            snapshot.captured_at,
            snapshot.total_input_tokens,
            snapshot.total_output_tokens,
            snapshot.total_cache_read_tokens,
            snapshot.total_cache_write_tokens,
            snapshot.total_cost_usd,
            snapshot.cache_hit_rate,
            snapshot.raw_json,
            snapshot.source_mtime,
        ))
        await self._connection.commit()
        return cursor.lastrowid

    async def get_snapshots(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[StatsSnapshot]:
        """
        获取快照列表

        Args:
            start_date: 开始时间
            end_date: 结束时间
            limit: 返回数量限制

        Returns:
            List[StatsSnapshot]: 快照列表
        """
        conditions = []
        params = []

        if start_date:
            conditions.append("captured_at >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("captured_at <= ?")
            params.append(end_date)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        sql = f"""
            SELECT * FROM stats_snapshots
            WHERE {where_clause}
            ORDER BY captured_at DESC
            LIMIT ?
        """
        params.append(limit)

        cursor = await self._connection.execute(sql, params)
        rows = await cursor.fetchall()

        return [self._row_to_snapshot(row) for row in rows]

    # ============================================
    # 每日聚合操作
    # ============================================

    async def upsert_daily_aggregate(self, aggregate: DailyAggregate) -> None:
        """
        更新或插入每日聚合数据

        Args:
            aggregate: 聚合对象
        """
        sql = """
            INSERT INTO daily_aggregates (
                date, total_input_tokens, total_output_tokens,
                total_cache_read_tokens, total_cache_write_tokens,
                total_cost_usd, avg_cache_hit_rate, session_count,
                model_breakdown, hourly_distribution, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(date) DO UPDATE SET
                total_input_tokens = excluded.total_input_tokens,
                total_output_tokens = excluded.total_output_tokens,
                total_cache_read_tokens = excluded.total_cache_read_tokens,
                total_cache_write_tokens = excluded.total_cache_write_tokens,
                total_cost_usd = excluded.total_cost_usd,
                avg_cache_hit_rate = excluded.avg_cache_hit_rate,
                session_count = excluded.session_count,
                model_breakdown = excluded.model_breakdown,
                hourly_distribution = excluded.hourly_distribution,
                updated_at = datetime('now')
        """
        import json
        await self._connection.execute(sql, (
            aggregate.date,
            aggregate.total_input_tokens,
            aggregate.total_output_tokens,
            aggregate.total_cache_read_tokens,
            aggregate.total_cache_write_tokens,
            aggregate.total_cost_usd,
            aggregate.avg_cache_hit_rate,
            aggregate.session_count,
            json.dumps(aggregate.model_breakdown) if aggregate.model_breakdown else None,
            json.dumps(aggregate.hourly_distribution) if aggregate.hourly_distribution else None,
        ))
        await self._connection.commit()

    async def get_daily_aggregates(
        self,
        start_date: str,
        end_date: str
    ) -> List[DailyAggregate]:
        """
        获取日期范围内的每日聚合数据

        Args:
            start_date: 开始日期（YYYY-MM-DD）
            end_date: 结束日期（YYYY-MM-DD）

        Returns:
            List[DailyAggregate]: 聚合数据列表
        """
        sql = """
            SELECT * FROM daily_aggregates
            WHERE date >= ? AND date <= ?
            ORDER BY date ASC
        """
        cursor = await self._connection.execute(sql, (start_date, end_date))
        rows = await cursor.fetchall()

        return [self._row_to_daily_aggregate(row) for row in rows]

    # ============================================
    # 数据清理
    # ============================================

    async def cleanup_old_data(self, retention_days: int = 90) -> int:
        """
        清理旧数据

        Args:
            retention_days: 保留天数

        Returns:
            int: 删除的记录数
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

        # 删除旧快照（会级联删除关联的 model_usage_logs）
        cursor = await self._connection.execute(
            "DELETE FROM stats_snapshots WHERE captured_at < ?",
            (cutoff_date,)
        )
        deleted_count = cursor.rowcount

        await self._connection.commit()
        return deleted_count

    # ============================================
    # 辅助方法
    # ============================================

    def _row_to_snapshot(self, row: aiosqlite.Row) -> StatsSnapshot:
        """将数据库行转换为 StatsSnapshot 对象"""
        return StatsSnapshot(
            id=row["id"],
            captured_at=datetime.fromisoformat(row["captured_at"]),
            total_input_tokens=row["total_input_tokens"],
            total_output_tokens=row["total_output_tokens"],
            total_cache_read_tokens=row["total_cache_read_tokens"],
            total_cache_write_tokens=row["total_cache_write_tokens"],
            total_cost_usd=row["total_cost_usd"],
            cache_hit_rate=row["cache_hit_rate"],
            raw_json=row["raw_json"],
        )

    def _row_to_daily_aggregate(self, row: aiosqlite.Row) -> DailyAggregate:
        """将数据库行转换为 DailyAggregate 对象"""
        import json
        return DailyAggregate(
            id=row["id"],
            date=row["date"],
            total_input_tokens=row["total_input_tokens"],
            total_output_tokens=row["total_output_tokens"],
            total_cache_read_tokens=row["total_cache_read_tokens"],
            total_cache_write_tokens=row["total_cache_write_tokens"],
            total_cost_usd=row["total_cost_usd"],
            avg_cache_hit_rate=row["avg_cache_hit_rate"],
            session_count=row["session_count"],
            model_breakdown=json.loads(row["model_breakdown"]) if row["model_breakdown"] else None,
            hourly_distribution=json.loads(row["hourly_distribution"]) if row["hourly_distribution"] else None,
        )
```

---

## 六、常用查询语句

### 6.1 获取最近7天趋势

```sql
SELECT
    date,
    total_input_tokens + total_output_tokens as total_tokens,
    total_cost_usd,
    avg_cache_hit_rate
FROM daily_aggregates
WHERE date >= date('now', '-7 days')
ORDER BY date ASC;
```

### 6.2 获取模型用量占比

```sql
SELECT
    model_name,
    SUM(input_tokens + output_tokens) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(cache_hit_rate) as avg_cache_hit
FROM model_usage_logs
WHERE recorded_at >= datetime('now', '-30 days')
GROUP BY model_name
ORDER BY total_cost DESC;
```

### 6.3 获取小时活动分布

```sql
SELECT
    strftime('%H', captured_at) as hour,
    COUNT(*) as activity_count,
    SUM(total_input_tokens + total_output_tokens) as total_tokens
FROM stats_snapshots
WHERE captured_at >= datetime('now', '-7 days')
GROUP BY strftime('%H', captured_at)
ORDER BY hour;
```

### 6.4 获取费用最高的日期

```sql
SELECT
    date,
    total_cost_usd,
    total_input_tokens,
    total_output_tokens
FROM daily_aggregates
ORDER BY total_cost_usd DESC
LIMIT 10;
```

---

## 七、数据迁移脚本

### 7.1 迁移脚本结构 (scripts/migrate.py)

```python
"""
@file: migrate.py
@description: 数据库迁移脚本
@author: Atlas.oi
@date: 2026-01-06
"""

import sqlite3
from pathlib import Path

MIGRATIONS = [
    # v1: 初始 schema
    """
    -- 初始表结构已在 schema.sql 中定义
    UPDATE system_config SET value = '1' WHERE key = 'schema_version';
    """,

    # v2: 添加索引优化（示例）
    """
    CREATE INDEX IF NOT EXISTS idx_snapshots_cost ON stats_snapshots(total_cost_usd);
    UPDATE system_config SET value = '2' WHERE key = 'schema_version';
    """,
]


def get_current_version(conn: sqlite3.Connection) -> int:
    """获取当前 schema 版本"""
    try:
        cursor = conn.execute(
            "SELECT value FROM system_config WHERE key = 'schema_version'"
        )
        row = cursor.fetchone()
        return int(row[0]) if row else 0
    except sqlite3.OperationalError:
        return 0


def migrate(db_path: Path) -> None:
    """执行数据库迁移"""
    conn = sqlite3.connect(db_path)
    current_version = get_current_version(conn)

    print(f"当前 schema 版本: {current_version}")

    for i, migration in enumerate(MIGRATIONS[current_version:], start=current_version + 1):
        print(f"执行迁移 v{i}...")
        conn.executescript(migration)
        conn.commit()
        print(f"迁移 v{i} 完成")

    conn.close()
    print("所有迁移完成")


if __name__ == "__main__":
    db_path = Path("data/monitor.db")
    migrate(db_path)
```

---

## 八、性能优化建议

### 8.1 索引策略

| 查询场景 | 推荐索引 |
|----------|----------|
| 时间范围查询 | `idx_snapshots_captured_at` |
| 按日期分组 | `idx_snapshots_date` |
| 模型分析 | `idx_model_usage_model` |
| 复合查询 | `idx_model_usage_time_model` |

### 8.2 数据保留策略

- **快照数据**: 保留 90 天，每 30 分钟一个快照
- **每日聚合**: 永久保留（数据量小）
- **导出历史**: 保留 30 天

### 8.3 WAL 模式

SQLite WAL 模式可显著提升并发读写性能：

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

### 8.4 查询优化

1. 优先使用 `daily_aggregates` 表进行日报表查询
2. 避免在 `raw_json` 字段上进行查询
3. 使用 LIMIT 限制返回结果数量

---

## 九、备份与恢复

### 9.1 备份命令

```bash
# 使用 SQLite 备份 API
sqlite3 data/monitor.db ".backup data/backup_$(date +%Y%m%d).db"

# 或直接复制文件（需确保无写入）
cp data/monitor.db data/backup_$(date +%Y%m%d).db
```

### 9.2 恢复命令

```bash
# 从备份恢复
cp data/backup_20260106.db data/monitor.db
```

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
