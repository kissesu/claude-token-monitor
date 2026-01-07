"""
@file: conftest.py
@description: 集成测试共享配置和 Fixture
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 提供测试客户端
2. 提供测试数据库
3. 提供模拟的 Claude 目录
4. 提供测试数据生成器
"""

import os
import json
import pytest
import tempfile
from pathlib import Path
from typing import Dict, Any, AsyncGenerator
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.main import create_app
from app.core.config import get_settings, Settings
from app.db.database import get_database, Database


# ============================================
# 测试应用实例
# ============================================
@pytest.fixture(scope="function")
async def app() -> FastAPI:
    """
    创建测试应用实例

    每个测试函数独立的应用实例

    Returns:
        FastAPI: 测试应用实例
    """
    test_app = create_app()
    return test_app


# ============================================
# 测试客户端
# ============================================
@pytest.fixture(scope="function")
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """
    创建测试客户端

    使用 HTTPX AsyncClient 进行 API 测试

    Args:
        app: FastAPI 应用实例

    Yields:
        AsyncClient: 异步测试客户端
    """
    # 创建 ASGI 传输
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test"
    ) as test_client:
        yield test_client


# ============================================
# 测试目录结构
# ============================================
@pytest.fixture(scope="function")
def test_dirs(tmp_path: Path) -> Dict[str, Path]:
    """
    创建测试目录结构

    Args:
        tmp_path: pytest 提供的临时目录

    Returns:
        Dict[str, Path]: 测试目录字典
    """
    # ============================================
    # 创建目录结构
    # ============================================
    claude_dir = tmp_path / ".claude"
    data_dir = tmp_path / "data"

    claude_dir.mkdir(parents=True)
    data_dir.mkdir(parents=True)

    # ============================================
    # 设置环境变量
    # ============================================
    os.environ["CLAUDE_DIR"] = str(claude_dir)
    os.environ["DATABASE_PATH"] = str(data_dir / "test.db")

    return {
        "root": tmp_path,
        "claude": claude_dir,
        "data": data_dir,
    }


# ============================================
# 模拟 Claude 统计数据
# ============================================
@pytest.fixture(scope="function")
def mock_stats_cache(test_dirs: Dict[str, Path]) -> Path:
    """
    创建模拟的 stats-cache.json 文件

    Args:
        test_dirs: 测试目录字典

    Returns:
        Path: stats-cache.json 文件路径
    """
    # ============================================
    # 构造测试数据
    # ============================================
    mock_data = {
        "total_input_tokens": 50000,
        "total_output_tokens": 30000,
        "total_cache_read_tokens": 10000,
        "total_cache_creation_tokens": 5000,
        "model_usage": {
            "claude-sonnet-4-5": {
                "input_tokens": 30000,
                "output_tokens": 20000,
                "cache_read_tokens": 8000,
                "cache_creation_tokens": 3000
            },
            "claude-opus-4": {
                "input_tokens": 20000,
                "output_tokens": 10000,
                "cache_read_tokens": 2000,
                "cache_creation_tokens": 2000
            }
        },
        "updated_at": "2026-01-07T02:00:00Z"
    }

    # ============================================
    # 写入文件
    # ============================================
    stats_file = test_dirs["claude"] / "stats-cache.json"
    with open(stats_file, "w", encoding="utf-8") as f:
        json.dump(mock_data, f, indent=2)

    return stats_file


# ============================================
# 模拟每日活动数据
# ============================================
@pytest.fixture(scope="function")
def mock_daily_activity(test_dirs: Dict[str, Path]) -> Path:
    """
    创建模拟的 daily-activity.json 文件

    Args:
        test_dirs: 测试目录字典

    Returns:
        Path: daily-activity.json 文件路径
    """
    # ============================================
    # 构造测试数据（最近 7 天）
    # ============================================
    from datetime import datetime, timedelta

    mock_data = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        mock_data.append({
            "date": date,
            "session_count": 5 + i,
            "total_tokens": 10000 + i * 1000,
            "models": [
                {
                    "model_name": "claude-sonnet-4-5",
                    "input_tokens": 6000 + i * 500,
                    "output_tokens": 3000 + i * 300,
                    "cache_read_tokens": 800 + i * 100,
                    "cache_creation_tokens": 200 + i * 50
                }
            ]
        })

    # ============================================
    # 写入文件
    # ============================================
    activity_file = test_dirs["claude"] / "daily-activity.json"
    with open(activity_file, "w", encoding="utf-8") as f:
        json.dump(mock_data, f, indent=2)

    return activity_file


# ============================================
# 测试数据库
# ============================================
@pytest.fixture(scope="function")
async def test_db(test_dirs: Dict[str, Path]) -> AsyncGenerator[Database, None]:
    """
    创建测试数据库实例

    Args:
        test_dirs: 测试目录字典

    Yields:
        Database: 测试数据库实例
    """
    # 使用独立的测试数据库实例，而不是全局单例
    db_path = test_dirs["data"] / "test.db"
    db = Database(db_path=db_path)

    # 初始化数据库表（方法名是 init_db 不是 initialize）
    await db.init_db()

    yield db

    # 清理：关闭连接并删除测试数据库文件
    await db.close()
    if db_path.exists():
        db_path.unlink()


# ============================================
# WebSocket 测试客户端
# ============================================
@pytest.fixture(scope="function")
async def ws_client(app: FastAPI):
    """
    创建 WebSocket 测试客户端

    Args:
        app: FastAPI 应用实例

    Returns:
        TestClient: Starlette 测试客户端
    """
    from starlette.testclient import TestClient

    with TestClient(app) as test_client:
        yield test_client
