"""
@file: conftest.py
@description: Pytest 配置文件，提供测试夹具和配置
@author: Atlas.oi
@date: 2026-01-07
"""

import os
import json
import pytest
from pathlib import Path
import tempfile
from typing import Dict, Any, AsyncGenerator
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.main import create_app


@pytest.fixture(scope="session")
def test_data_dir():
    """
    创建测试数据目录

    Returns:
        Path: 测试数据目录路径
    """
    test_dir = Path(__file__).parent / "test_data"
    test_dir.mkdir(exist_ok=True)
    return test_dir


@pytest.fixture(scope="function")
def temp_dir():
    """
    创建临时目录（测试结束后自动清理）

    Returns:
        Path: 临时目录路径
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture(scope="function")
def clean_env():
    """
    清理环境变量（在测试前后）
    """
    # 保存当前环境变量
    original_env = os.environ.copy()

    # 清理可能影响测试的环境变量
    env_vars_to_clear = [
        "CLAUDE_DIR",
        "DATABASE_PATH",
        "BACKEND_PORT",
        "LOG_LEVEL",
        "DEBUG",
        "API_PREFIX",
    ]

    for var in env_vars_to_clear:
        os.environ.pop(var, None)

    yield

    # 恢复原始环境变量
    os.environ.clear()
    os.environ.update(original_env)


@pytest.fixture(scope="function")
def mock_settings_env(temp_dir):
    """
    模拟配置环境

    Args:
        temp_dir: 临时目录

    Returns:
        dict: 环境变量字典
    """
    env = {
        "CLAUDE_DIR": str(temp_dir / ".claude"),
        "DATABASE_PATH": str(temp_dir / "test.db"),
        "BACKEND_PORT": "51999",
        "LOG_LEVEL": "DEBUG",
        "DEBUG": "true",
        "API_PREFIX": "/api/test",
    }

    # 设置环境变量
    for key, value in env.items():
        os.environ[key] = value

    return env


# ============================================
# 测试应用实例（集成测试和性能测试共用）
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
# 测试客户端（集成测试和性能测试共用）
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
# 测试目录结构（集成测试和性能测试共用）
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
# 模拟 Claude 统计数据（集成测试和性能测试共用）
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
# 模拟每日活动数据（集成测试和性能测试共用）
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
