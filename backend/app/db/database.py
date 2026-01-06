"""
@file: database.py
@description: 数据库连接池和操作模块，使用 aiosqlite 实现异步数据库操作
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 实现异步数据库连接池管理
2. 提供数据库初始化功能
3. 实现统计快照保存
4. 实现历史数据查询
5. 实现数据清理功能
"""

import aiosqlite
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from ..core.config import get_settings
from ..core.logger import get_logger
from ..core.schemas import StatsCache, ModelUsage, DailyActivity


logger = get_logger(__name__)


class Database:
    """
    数据库管理器

    使用 aiosqlite 实现异步数据库操作，提供连接池管理和 CRUD 操作
    """

    def __init__(self, db_path: Optional[Path] = None):
        """
        初始化数据库管理器

        Args:
            db_path: 数据库文件路径，为 None 时从配置读取
        """
        if db_path is None:
            settings = get_settings()
            db_path = settings.get_database_path()

        self.db_path = db_path
        self._connection: Optional[aiosqlite.Connection] = None

        # 确保数据库目录存在
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"初始化数据库管理器: {self.db_path}")

    async def connect(self) -> aiosqlite.Connection:
        """
        获取数据库连接

        如果连接不存在则创建新连接

        Returns:
            aiosqlite.Connection: 数据库连接对象
        """
        if self._connection is None:
            self._connection = await aiosqlite.connect(str(self.db_path))
            # 启用外键约束
            await self._connection.execute("PRAGMA foreign_keys = ON")
            logger.info("数据库连接已建立")

        return self._connection

    async def close(self):
        """
        关闭数据库连接
        """
        if self._connection:
            await self._connection.close()
            self._connection = None
            logger.info("数据库连接已关闭")

    @asynccontextmanager
    async def transaction(self):
        """
        数据库事务上下文管理器

        使用方式:
            async with db.transaction():
                await db.execute(...)
        """
        conn = await self.connect()
        try:
            await conn.execute("BEGIN")
            yield conn
            await conn.commit()
        except Exception as e:
            await conn.rollback()
            logger.error(f"事务回滚: {e}")
            raise

    async def init_db(self):
        """
        初始化数据库表结构

        创建统计快照表、模型使用表和每日活动表
        """
        conn = await self.connect()

        try:
            # ============================================
            # 创建统计快照表
            # 用于存储每次快照的完整统计数据
            # ============================================
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS stats_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    total_sessions INTEGER NOT NULL DEFAULT 0,
                    total_tokens INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(timestamp)
                )
            """)

            # ============================================
            # 创建模型使用表
            # 记录每次快照中各模型的 Token 使用情况
            # ============================================
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS model_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    snapshot_id INTEGER NOT NULL,
                    model_name TEXT NOT NULL,
                    input_tokens INTEGER NOT NULL DEFAULT 0,
                    output_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (snapshot_id) REFERENCES stats_snapshots(id) ON DELETE CASCADE,
                    UNIQUE(snapshot_id, model_name)
                )
            """)

            # ============================================
            # 创建每日活动表
            # 记录每日的会话数和 Token 使用量
            # ============================================
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS daily_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    snapshot_id INTEGER NOT NULL,
                    date DATE NOT NULL,
                    session_count INTEGER NOT NULL DEFAULT 0,
                    total_tokens INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (snapshot_id) REFERENCES stats_snapshots(id) ON DELETE CASCADE,
                    UNIQUE(snapshot_id, date)
                )
            """)

            # ============================================
            # 创建索引以提高查询性能
            # ============================================
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_stats_snapshots_timestamp
                ON stats_snapshots(timestamp)
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_model_usage_snapshot
                ON model_usage(snapshot_id)
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_model_usage_name
                ON model_usage(model_name)
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_daily_activities_date
                ON daily_activities(date)
            """)

            await conn.commit()
            logger.info("数据库表结构初始化完成")

        except Exception as e:
            logger.error(f"数据库初始化失败: {e}")
            raise

    async def save_stats_snapshot(self, stats: StatsCache) -> int:
        """
        保存统计快照

        将统计缓存数据保存到数据库，包括总体统计、模型使用和每日活动

        Args:
            stats: 统计缓存对象

        Returns:
            int: 快照 ID

        Raises:
            Exception: 保存失败时抛出异常
        """
        async with self.transaction() as conn:
            try:
                # ============================================
                # 第一步：插入统计快照主记录
                # ============================================
                cursor = await conn.execute("""
                    INSERT INTO stats_snapshots (timestamp, total_sessions, total_tokens)
                    VALUES (?, ?, ?)
                """, (
                    stats.last_updated.isoformat(),
                    stats.total_sessions,
                    stats.total_tokens,
                ))

                snapshot_id = cursor.lastrowid

                # ============================================
                # 第二步：批量插入模型使用数据
                # ============================================
                if stats.models:
                    model_data = [
                        (
                            snapshot_id,
                            model_name,
                            usage.input_tokens,
                            usage.output_tokens,
                            usage.cache_read_tokens,
                            usage.cache_creation_tokens,
                        )
                        for model_name, usage in stats.models.items()
                    ]

                    await conn.executemany("""
                        INSERT INTO model_usage
                        (snapshot_id, model_name, input_tokens, output_tokens,
                         cache_read_tokens, cache_creation_tokens)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, model_data)

                # ============================================
                # 第三步：批量插入每日活动数据
                # ============================================
                if stats.daily_activities:
                    activity_data = [
                        (
                            snapshot_id,
                            activity.date,
                            activity.session_count,
                            activity.total_tokens,
                        )
                        for activity in stats.daily_activities
                    ]

                    await conn.executemany("""
                        INSERT INTO daily_activities
                        (snapshot_id, date, session_count, total_tokens)
                        VALUES (?, ?, ?, ?)
                    """, activity_data)

                logger.info(f"成功保存统计快照 #{snapshot_id}, 包含 {len(stats.models)} 个模型, {len(stats.daily_activities)} 天活动")

                return snapshot_id

            except Exception as e:
                logger.error(f"保存统计快照失败: {e}")
                raise

    async def get_historical_stats(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        获取历史统计数据

        查询指定时间范围内的统计快照，支持分页

        Args:
            start_date: 开始日期 YYYY-MM-DD
            end_date: 结束日期 YYYY-MM-DD
            limit: 最大返回条数

        Returns:
            List[Dict[str, Any]]: 历史统计数据列表
        """
        conn = await self.connect()

        try:
            # ============================================
            # 构建 SQL 查询条件
            # ============================================
            query = """
                SELECT
                    id,
                    timestamp,
                    total_sessions,
                    total_tokens,
                    created_at
                FROM stats_snapshots
                WHERE 1=1
            """
            params = []

            if start_date:
                query += " AND DATE(timestamp) >= ?"
                params.append(start_date)

            if end_date:
                query += " AND DATE(timestamp) <= ?"
                params.append(end_date)

            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)

            # ============================================
            # 执行查询
            # ============================================
            cursor = await conn.execute(query, params)
            rows = await cursor.fetchall()

            results = []
            for row in rows:
                results.append({
                    "id": row[0],
                    "timestamp": row[1],
                    "total_sessions": row[2],
                    "total_tokens": row[3],
                    "created_at": row[4],
                })

            logger.info(f"查询历史统计数据，返回 {len(results)} 条记录")
            return results

        except Exception as e:
            logger.error(f"查询历史统计数据失败: {e}")
            return []

    async def get_model_usage_by_snapshot(self, snapshot_id: int) -> List[Dict[str, Any]]:
        """
        获取指定快照的模型使用数据

        Args:
            snapshot_id: 快照 ID

        Returns:
            List[Dict[str, Any]]: 模型使用数据列表
        """
        conn = await self.connect()

        try:
            cursor = await conn.execute("""
                SELECT
                    model_name,
                    input_tokens,
                    output_tokens,
                    cache_read_tokens,
                    cache_creation_tokens
                FROM model_usage
                WHERE snapshot_id = ?
                ORDER BY (input_tokens + output_tokens) DESC
            """, (snapshot_id,))

            rows = await cursor.fetchall()

            results = []
            for row in rows:
                results.append({
                    "model_name": row[0],
                    "input_tokens": row[1],
                    "output_tokens": row[2],
                    "cache_read_tokens": row[3],
                    "cache_creation_tokens": row[4],
                })

            return results

        except Exception as e:
            logger.error(f"查询模型使用数据失败: {e}")
            return []

    async def get_daily_activities_by_snapshot(self, snapshot_id: int) -> List[Dict[str, Any]]:
        """
        获取指定快照的每日活动数据

        Args:
            snapshot_id: 快照 ID

        Returns:
            List[Dict[str, Any]]: 每日活动数据列表
        """
        conn = await self.connect()

        try:
            cursor = await conn.execute("""
                SELECT
                    date,
                    session_count,
                    total_tokens
                FROM daily_activities
                WHERE snapshot_id = ?
                ORDER BY date DESC
            """, (snapshot_id,))

            rows = await cursor.fetchall()

            results = []
            for row in rows:
                results.append({
                    "date": row[0],
                    "session_count": row[1],
                    "total_tokens": row[2],
                })

            return results

        except Exception as e:
            logger.error(f"查询每日活动数据失败: {e}")
            return []

    async def cleanup_old_data(self, days: int = 90):
        """
        清理旧数据

        删除指定天数之前的统计快照及相关数据

        Args:
            days: 保留最近多少天的数据，默认 90 天

        Returns:
            int: 删除的记录数
        """
        conn = await self.connect()

        try:
            # ============================================
            # 计算删除截止日期
            # ============================================
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

            # ============================================
            # 删除旧的统计快照（级联删除相关数据）
            # ============================================
            cursor = await conn.execute("""
                DELETE FROM stats_snapshots
                WHERE timestamp < ?
            """, (cutoff_date,))

            deleted_count = cursor.rowcount

            await conn.commit()
            logger.info(f"清理旧数据完成，删除了 {deleted_count} 条 {days} 天前的记录")

            return deleted_count

        except Exception as e:
            logger.error(f"清理旧数据失败: {e}")
            return 0


# ============================================
# 全局数据库实例（单例模式）
# ============================================
_db_instance: Optional[Database] = None


async def get_database() -> Database:
    """
    获取全局数据库实例（单例模式）

    首次调用时创建实例并初始化数据库，后续调用直接返回实例

    Returns:
        Database: 全局数据库对象
    """
    global _db_instance

    if _db_instance is None:
        _db_instance = Database()
        await _db_instance.init_db()

    return _db_instance
