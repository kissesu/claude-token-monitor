"""
@file: test_database.py
@description: 数据库模块测试
@author: Atlas.oi
@date: 2026-01-07
"""

import pytest
import asyncio
from pathlib import Path
from datetime import datetime
import tempfile
import os

from app.db.database import Database, get_database
from app.core.schemas import StatsCache, ModelUsage, DailyActivity


@pytest.fixture
async def temp_db():
    """
    临时数据库 fixture

    创建临时数据库用于测试，测试结束后自动删除
    """
    # 创建临时文件
    fd, temp_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    db = Database(db_path=Path(temp_path))
    await db.init_db()

    yield db

    # 清理
    await db.close()
    try:
        os.unlink(temp_path)
    except:
        pass


@pytest.mark.asyncio
async def test_database_init(temp_db):
    """
    测试数据库初始化
    """
    conn = await temp_db.connect()

    # 验证表是否创建
    cursor = await conn.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
    """)
    tables = await cursor.fetchall()
    table_names = [table[0] for table in tables]

    assert "stats_snapshots" in table_names
    assert "model_usage" in table_names
    assert "daily_activities" in table_names


@pytest.mark.asyncio
async def test_save_stats_snapshot(temp_db):
    """
    测试保存统计快照
    """
    # 构造测试数据
    stats = StatsCache(
        total_sessions=10,
        total_tokens=5000,
        models={
            "claude-3-5-sonnet-20241022": ModelUsage(
                model_name="claude-3-5-sonnet-20241022",
                input_tokens=3000,
                output_tokens=1500,
                cache_read_tokens=300,
                cache_creation_tokens=200,
            )
        },
        daily_activities=[
            DailyActivity(
                date="2026-01-07",
                session_count=5,
                total_tokens=2500,
                models=[],
            )
        ],
        last_updated=datetime.now(),
    )

    # 保存快照
    snapshot_id = await temp_db.save_stats_snapshot(stats)

    assert snapshot_id > 0

    # 验证数据是否保存
    conn = await temp_db.connect()

    # 验证快照记录
    cursor = await conn.execute("""
        SELECT total_sessions, total_tokens FROM stats_snapshots WHERE id = ?
    """, (snapshot_id,))
    row = await cursor.fetchone()

    assert row is not None
    assert row[0] == 10
    assert row[1] == 5000

    # 验证模型使用记录
    cursor = await conn.execute("""
        SELECT model_name, input_tokens FROM model_usage WHERE snapshot_id = ?
    """, (snapshot_id,))
    row = await cursor.fetchone()

    assert row is not None
    assert row[0] == "claude-3-5-sonnet-20241022"
    assert row[1] == 3000

    # 验证每日活动记录
    cursor = await conn.execute("""
        SELECT date, session_count FROM daily_activities WHERE snapshot_id = ?
    """, (snapshot_id,))
    row = await cursor.fetchone()

    assert row is not None
    assert row[0] == "2026-01-07"
    assert row[1] == 5


@pytest.mark.asyncio
async def test_get_historical_stats(temp_db):
    """
    测试查询历史统计数据
    """
    # 保存多个快照
    for i in range(3):
        stats = StatsCache(
            total_sessions=10 + i,
            total_tokens=5000 + i * 1000,
            models={},
            daily_activities=[],
            last_updated=datetime.now(),
        )
        await temp_db.save_stats_snapshot(stats)

    # 查询历史数据
    history = await temp_db.get_historical_stats(limit=10)

    assert len(history) == 3
    assert history[0]["total_sessions"] == 12  # 最新的记录


@pytest.mark.asyncio
async def test_get_model_usage_by_snapshot(temp_db):
    """
    测试查询快照的模型使用数据
    """
    stats = StatsCache(
        total_sessions=10,
        total_tokens=5000,
        models={
            "model-1": ModelUsage(
                model_name="model-1",
                input_tokens=3000,
                output_tokens=1500,
            ),
            "model-2": ModelUsage(
                model_name="model-2",
                input_tokens=500,
                output_tokens=200,
            ),
        },
        daily_activities=[],
        last_updated=datetime.now(),
    )

    snapshot_id = await temp_db.save_stats_snapshot(stats)

    # 查询模型使用数据
    models = await temp_db.get_model_usage_by_snapshot(snapshot_id)

    assert len(models) == 2
    assert models[0]["model_name"] == "model-1"  # 按使用量降序


@pytest.mark.asyncio
async def test_get_daily_activities_by_snapshot(temp_db):
    """
    测试查询快照的每日活动数据
    """
    stats = StatsCache(
        total_sessions=10,
        total_tokens=5000,
        models={},
        daily_activities=[
            DailyActivity(
                date="2026-01-07",
                session_count=5,
                total_tokens=2500,
                models=[],
            ),
            DailyActivity(
                date="2026-01-06",
                session_count=3,
                total_tokens=1500,
                models=[],
            ),
        ],
        last_updated=datetime.now(),
    )

    snapshot_id = await temp_db.save_stats_snapshot(stats)

    # 查询每日活动数据
    activities = await temp_db.get_daily_activities_by_snapshot(snapshot_id)

    assert len(activities) == 2
    assert activities[0]["date"] == "2026-01-07"  # 按日期降序


@pytest.mark.asyncio
async def test_cleanup_old_data(temp_db):
    """
    测试清理旧数据
    """
    # 保存多个快照
    for i in range(5):
        stats = StatsCache(
            total_sessions=10 + i,
            total_tokens=5000 + i * 1000,
            models={},
            daily_activities=[],
            last_updated=datetime.now(),
        )
        await temp_db.save_stats_snapshot(stats)

    # 清理 0 天前的数据（应该删除所有数据）
    deleted_count = await temp_db.cleanup_old_data(days=0)

    assert deleted_count == 5

    # 验证数据已删除
    history = await temp_db.get_historical_stats()
    assert len(history) == 0


@pytest.mark.asyncio
async def test_transaction_rollback(temp_db):
    """
    测试事务回滚
    """
    try:
        async with temp_db.transaction() as conn:
            await conn.execute("""
                INSERT INTO stats_snapshots (timestamp, total_sessions, total_tokens)
                VALUES (?, ?, ?)
            """, (datetime.now().isoformat(), 10, 5000))

            # 故意触发错误
            await conn.execute("INVALID SQL")

    except Exception:
        pass

    # 验证事务已回滚
    conn = await temp_db.connect()
    cursor = await conn.execute("SELECT COUNT(*) FROM stats_snapshots")
    count = await cursor.fetchone()

    assert count[0] == 0
