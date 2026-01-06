"""
@file: conftest.py
@description: Pytest 配置文件，提供测试夹具和配置
@author: Atlas.oi
@date: 2026-01-07
"""

import os
import pytest
from pathlib import Path
import tempfile


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
