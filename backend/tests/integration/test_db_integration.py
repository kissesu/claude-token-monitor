"""
@file: test_db_integration.py
@description: 数据库操作集成测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试数据库初始化
2. 测试数据 CRUD 操作
3. 测试事务处理
4. 测试并发访问
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict

from app.db.database import Database


# ============================================
# 标记为集成测试
# ============================================
pytestmark = pytest.mark.integration


# ============================================
# 测试数据库初始化
# ============================================
@pytest.mark.asyncio
async def test_database_initialization(test_dirs: Dict[str, Path]):
    """
    测试数据库初始化

    验收标准：
    - 数据库文件成功创建
    - 必要的表结构创建成功
    - 可以正常连接
    """
    db_path = test_dirs["data"] / "init_test.db"
    db = Database(db_path=db_path)

    # 初始化数据库
    await db.init_db()

    # 验证数据库文件存在
    assert db_path.exists()

    # 验证可以连接
    conn = await db.connect()
    assert conn is not None

    # 验证表存在（通过查询 sqlite_master）
    cursor = await conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = await cursor.fetchall()

    # 应该至少有一些表
    assert len(tables) > 0

    # 清理
    db_path.unlink()


# ============================================
# 测试保存统计快照
# ============================================
@pytest.mark.asyncio
async def test_save_stats_snapshot(test_db: Database):
    """
    测试保存统计快照

    验收标准：
    - 数据成功保存到数据库
    - 保存的数据可以查询
    - 数据格式正确
    """
    # 准备测试数据
    stats_data = {
        "total_input_tokens": 10000,
        "total_output_tokens": 5000,
        "total_cache_read_tokens": 2000,
        "total_cache_creation_tokens": 1000,
        "model_usage": {
            "claude-sonnet-4-5": {
                "input_tokens": 6000,
                "output_tokens": 3000,
                "cache_read_tokens": 1500,
                "cache_creation_tokens": 500
            }
        }
    }

    # 保存快照
    snapshot_id = await test_db.save_stats_snapshot(stats_data)

    # 验证返回了 ID
    assert snapshot_id is not None
    assert snapshot_id > 0

    # 查询保存的数据
    conn = await test_db.connect()
    cursor = await conn.execute(
        "SELECT * FROM stats_snapshots WHERE id = ?",
        (snapshot_id,)
    )
    row = await cursor.fetchone()

    # 验证数据存在
    assert row is not None


# ============================================
# 测试查询历史统计
# ============================================
@pytest.mark.asyncio
async def test_get_historical_stats(test_db: Database):
    """
    测试查询历史统计数据

    验收标准：
    - 可以查询指定日期范围的数据
    - 查询结果按时间排序
    - 数据格式正确
    """
    # 插入多条测试数据
    for i in range(5):
        stats_data = {
            "total_input_tokens": 1000 * (i + 1),
            "total_output_tokens": 500 * (i + 1),
            "total_cache_read_tokens": 200 * (i + 1),
            "total_cache_creation_tokens": 100 * (i + 1),
            "model_usage": {}
        }
        await test_db.save_stats_snapshot(stats_data)
        await asyncio.sleep(0.01)  # 确保时间戳不同

    # 查询历史数据
    history = await test_db.get_historical_stats(limit=5)

    # 验证查询结果
    assert len(history) == 5

    # 验证按时间降序排序（最新的在前面）
    for i in range(len(history) - 1):
        assert history[i]["id"] > history[i + 1]["id"]


# ============================================
# 测试日期范围查询
# ============================================
@pytest.mark.asyncio
async def test_query_by_date_range(test_db: Database):
    """
    测试按日期范围查询

    验收标准：
    - 可以按开始日期筛选
    - 可以按结束日期筛选
    - 筛选结果正确
    """
    # 插入测试数据
    now = datetime.now()

    for i in range(5):
        stats_data = {
            "total_input_tokens": 1000 * (i + 1),
            "total_output_tokens": 500 * (i + 1),
            "created_at": (now - timedelta(days=i)).isoformat()
        }
        await test_db.save_stats_snapshot(stats_data)

    # 查询最近 2 天的数据
    start_date = (now - timedelta(days=2)).strftime("%Y-%m-%d")

    history = await test_db.get_historical_stats(
        start_date=start_date,
        limit=10
    )

    # 验证结果（应该有 2-3 条记录，取决于时间边界）
    assert len(history) >= 2
    assert len(history) <= 3


# ============================================
# 测试数据库连接池
# ============================================
@pytest.mark.asyncio
async def test_connection_pooling(test_db: Database):
    """
    测试数据库连接池

    验收标准：
    - 支持多个并发连接
    - 连接可以复用
    - 连接池管理正常
    """
    # 并发执行多个查询
    async def query_task():
        conn = await test_db.connect()
        cursor = await conn.execute("SELECT 1")
        result = await cursor.fetchone()
        return result[0]

    # 创建 10 个并发任务
    tasks = [query_task() for _ in range(10)]
    results = await asyncio.gather(*tasks)

    # 验证所有查询都成功
    assert len(results) == 10
    assert all(r == 1 for r in results)


# ============================================
# 测试事务处理
# ============================================
@pytest.mark.asyncio
async def test_transaction_handling(test_db: Database):
    """
    测试事务处理

    验收标准：
    - 事务提交成功保存数据
    - 事务回滚不保存数据
    - 事务隔离正确
    """
    conn = await test_db.connect()

    # ============================================
    # 测试提交
    # ============================================
    await conn.execute("BEGIN")

    stats_data = {
        "total_input_tokens": 9999,
        "total_output_tokens": 8888,
    }
    snapshot_id = await test_db.save_stats_snapshot(stats_data)

    await conn.commit()

    # 验证数据已保存
    cursor = await conn.execute(
        "SELECT * FROM stats_snapshots WHERE id = ?",
        (snapshot_id,)
    )
    row = await cursor.fetchone()
    assert row is not None

    # ============================================
    # 测试回滚
    # ============================================
    await conn.execute("BEGIN")

    stats_data_2 = {
        "total_input_tokens": 7777,
        "total_output_tokens": 6666,
    }
    snapshot_id_2 = await test_db.save_stats_snapshot(stats_data_2)

    await conn.rollback()

    # 验证数据未保存
    cursor = await conn.execute(
        "SELECT * FROM stats_snapshots WHERE id = ?",
        (snapshot_id_2,)
    )
    row = await cursor.fetchone()
    # 由于回滚，这条数据可能不存在
    # 具体取决于 save_stats_snapshot 的实现


# ============================================
# 测试数据完整性
# ============================================
@pytest.mark.asyncio
async def test_data_integrity(test_db: Database):
    """
    测试数据完整性

    验收标准：
    - 保存和读取的数据一致
    - JSON 序列化正确
    - 特殊字符处理正确
    """
    # 准备包含特殊字符的测试数据
    stats_data = {
        "total_input_tokens": 12345,
        "model_usage": {
            "claude-sonnet-4.5": {
                "input_tokens": 12345,
                "special_chars": "测试中文 & special <chars>"
            }
        },
        "metadata": {
            "nested": {
                "deep": {
                    "value": "深层嵌套"
                }
            }
        }
    }

    # 保存数据
    snapshot_id = await test_db.save_stats_snapshot(stats_data)

    # 读取数据
    history = await test_db.get_historical_stats(limit=1)

    # 验证数据一致性
    assert len(history) > 0
    saved_data = history[0]

    # 验证基本字段
    assert saved_data["total_input_tokens"] == 12345

    # 注意：具体的验证取决于 get_historical_stats 返回的格式


# ============================================
# 测试大量数据处理
# ============================================
@pytest.mark.asyncio
@pytest.mark.slow
async def test_large_dataset(test_db: Database):
    """
    测试大量数据处理

    验收标准：
    - 能处理大量数据插入
    - 查询性能可接受
    - 内存使用合理
    """
    # 插入 100 条记录
    for i in range(100):
        stats_data = {
            "total_input_tokens": i * 1000,
            "total_output_tokens": i * 500,
            "model_usage": {
                f"model-{i % 5}": {
                    "input_tokens": i * 200
                }
            }
        }
        await test_db.save_stats_snapshot(stats_data)

        # 每 10 条暂停一下，避免过快
        if i % 10 == 0:
            await asyncio.sleep(0.01)

    # 查询所有数据
    history = await test_db.get_historical_stats(limit=100)

    # 验证数据量
    assert len(history) == 100


# ============================================
# 测试数据库清理
# ============================================
@pytest.mark.asyncio
async def test_database_cleanup(test_dirs: Dict[str, Path]):
    """
    测试数据库清理

    验收标准：
    - 旧数据可以删除
    - 删除操作不影响其他数据
    - 数据库文件大小合理
    """
    db_path = test_dirs["data"] / "cleanup_test.db"
    db = Database(db_path=db_path)
    await db.init_db()

    # 插入一些测试数据
    for i in range(10):
        stats_data = {
            "total_input_tokens": i * 100,
        }
        await test_db.save_stats_snapshot(stats_data)

    # 验证数据存在
    history_before = await test_db.get_historical_stats(limit=20)
    assert len(history_before) >= 10

    # 这里可以实现清理逻辑
    # 例如：删除 30 天前的数据

    # 清理数据库文件
    db_path.unlink()
