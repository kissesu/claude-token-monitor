"""
@file: test_stats_reader.py
@description: 测试统计数据读取器模块
@author: Atlas.oi
@date: 2026-01-07
"""

import pytest
import json
from pathlib import Path
import asyncio

from app.core.stats_reader import StatsReader
from app.core.schemas import ModelUsage, DailyActivity


# ============================================
# 测试数据 Fixtures
# ============================================
@pytest.fixture
def mock_claude_dir(temp_dir):
    """
    创建模拟的 Claude 目录结构
    """
    claude_dir = temp_dir / ".claude"
    claude_dir.mkdir(parents=True, exist_ok=True)
    return claude_dir


@pytest.fixture
def mock_stats_cache(mock_claude_dir):
    """
    创建模拟的 stats-cache.json 文件
    """
    stats_data = {
        "version": 1,
        "lastComputedDate": "2026-01-07",
        "dailyActivity": [
            {
                "date": "2026-01-05",
                "messageCount": 100,
                "sessionCount": 5,
                "toolCallCount": 20
            },
            {
                "date": "2026-01-06",
                "messageCount": 150,
                "sessionCount": 8,
                "toolCallCount": 30
            }
        ],
        "dailyModelTokens": [
            {
                "date": "2026-01-05",
                "tokensByModel": {
                    "claude-sonnet-4-5-20250929": 10000,
                    "claude-opus-4-5-20251101": 5000
                }
            },
            {
                "date": "2026-01-06",
                "tokensByModel": {
                    "claude-sonnet-4-5-20250929": 15000,
                    "claude-haiku-4-5-20251001": 3000
                }
            }
        ],
        "modelUsage": {
            "claude-sonnet-4-5-20250929": {
                "inputTokens": 10000,
                "outputTokens": 5000,
                "cacheReadInputTokens": 2000,
                "cacheCreationInputTokens": 1000,
                "webSearchRequests": 0,
                "costUSD": 0,
                "contextWindow": 0
            },
            "claude-opus-4-5-20251101": {
                "inputTokens": 3000,
                "outputTokens": 2000,
                "cacheReadInputTokens": 500,
                "cacheCreationInputTokens": 300,
                "webSearchRequests": 0,
                "costUSD": 0,
                "contextWindow": 0
            }
        }
    }

    cache_file = mock_claude_dir / "stats-cache.json"
    cache_file.write_text(json.dumps(stats_data, indent=2), encoding="utf-8")

    return cache_file


@pytest.fixture
def mock_history_jsonl(mock_claude_dir):
    """
    创建模拟的 history.jsonl 文件
    """
    history_data = [
        {
            "display": "test message 1",
            "timestamp": 1704614400000,  # 2024-01-07 00:00:00
            "project": "/Users/test",
            "sessionId": "session-1"
        },
        {
            "display": "test message 2",
            "timestamp": 1704700800000,  # 2024-01-08 00:00:00
            "project": "/Users/test",
            "sessionId": "session-2"
        },
        {
            "display": "test message 3",
            "timestamp": 1704787200000,  # 2024-01-09 00:00:00
            "project": "/Users/test",
            "sessionId": "session-3"
        }
    ]

    history_file = mock_claude_dir / "history.jsonl"
    with history_file.open("w", encoding="utf-8") as f:
        for item in history_data:
            f.write(json.dumps(item) + "\n")

    return history_file


# ============================================
# StatsReader 初始化测试
# ============================================
def test_stats_reader_init(mock_claude_dir):
    """测试 StatsReader 初始化"""
    reader = StatsReader(claude_dir=mock_claude_dir)

    assert reader.claude_dir == mock_claude_dir
    assert reader.stats_cache_file == mock_claude_dir / "stats-cache.json"
    assert reader.history_file == mock_claude_dir / "history.jsonl"


def test_stats_reader_init_default():
    """测试 StatsReader 使用默认配置初始化"""
    reader = StatsReader()

    assert reader.claude_dir is not None
    assert reader.stats_cache_file.name == "stats-cache.json"
    assert reader.history_file.name == "history.jsonl"


# ============================================
# read_stats_cache 测试
# ============================================
@pytest.mark.asyncio
async def test_read_stats_cache_success(mock_claude_dir, mock_stats_cache):
    """测试成功读取统计缓存文件"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.read_stats_cache()

    assert data is not None
    assert data["version"] == 1
    assert data["lastComputedDate"] == "2026-01-07"
    assert len(data["dailyActivity"]) == 2
    assert len(data["modelUsage"]) == 2


@pytest.mark.asyncio
async def test_read_stats_cache_not_found(mock_claude_dir):
    """测试统计缓存文件不存在"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.read_stats_cache()

    assert data is None


@pytest.mark.asyncio
async def test_read_stats_cache_invalid_json(mock_claude_dir):
    """测试统计缓存文件 JSON 格式错误"""
    cache_file = mock_claude_dir / "stats-cache.json"
    cache_file.write_text("{ invalid json }", encoding="utf-8")

    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.read_stats_cache()

    assert data is None


# ============================================
# parse_jsonl_files 测试
# ============================================
@pytest.mark.asyncio
async def test_parse_jsonl_files_all(mock_claude_dir, mock_history_jsonl):
    """测试解析所有 JSONL 记录"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.parse_jsonl_files()

    assert len(data) == 3
    assert data[0]["display"] == "test message 1"
    assert data[1]["display"] == "test message 2"
    assert data[2]["display"] == "test message 3"


@pytest.mark.asyncio
async def test_parse_jsonl_files_date_filter(mock_claude_dir, mock_history_jsonl):
    """测试按日期范围过滤 JSONL 记录"""
    reader = StatsReader(claude_dir=mock_claude_dir)

    # 只获取 2024-01-08 的记录
    data = await reader.parse_jsonl_files(
        start_date="2024-01-08",
        end_date="2024-01-08"
    )

    assert len(data) == 1
    assert data[0]["display"] == "test message 2"


@pytest.mark.asyncio
async def test_parse_jsonl_files_limit(mock_claude_dir, mock_history_jsonl):
    """测试限制返回条数"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.parse_jsonl_files(limit=2)

    assert len(data) == 2


@pytest.mark.asyncio
async def test_parse_jsonl_files_not_found(mock_claude_dir):
    """测试 JSONL 文件不存在"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.parse_jsonl_files()

    assert len(data) == 0


# ============================================
# get_model_usage 测试
# ============================================
@pytest.mark.asyncio
async def test_get_model_usage_success(mock_claude_dir, mock_stats_cache):
    """测试获取模型使用统计"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    model_usage = await reader.get_model_usage()

    assert len(model_usage) == 2
    assert "claude-sonnet-4-5-20250929" in model_usage
    assert "claude-opus-4-5-20251101" in model_usage

    # 验证 Sonnet 数据
    sonnet = model_usage["claude-sonnet-4-5-20250929"]
    assert isinstance(sonnet, ModelUsage)
    assert sonnet.input_tokens == 10000
    assert sonnet.output_tokens == 5000
    assert sonnet.cache_read_tokens == 2000
    assert sonnet.cache_creation_tokens == 1000

    # 验证 Opus 数据
    opus = model_usage["claude-opus-4-5-20251101"]
    assert opus.input_tokens == 3000
    assert opus.output_tokens == 2000


@pytest.mark.asyncio
async def test_get_model_usage_empty(mock_claude_dir):
    """测试获取模型使用统计（空数据）"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    model_usage = await reader.get_model_usage()

    assert len(model_usage) == 0


# ============================================
# get_daily_activity 测试
# ============================================
@pytest.mark.asyncio
async def test_get_daily_activity_success(mock_claude_dir, mock_stats_cache):
    """测试获取每日活动统计"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    daily_activity = await reader.get_daily_activity()

    assert len(daily_activity) == 2

    # 验证第一天数据
    day1 = daily_activity[0]
    assert isinstance(day1, DailyActivity)
    assert day1.date == "2026-01-05"
    assert day1.session_count == 5
    assert day1.total_tokens == 15000  # 10000 + 5000

    # 验证第二天数据
    day2 = daily_activity[1]
    assert day2.date == "2026-01-06"
    assert day2.session_count == 8
    assert day2.total_tokens == 18000  # 15000 + 3000


@pytest.mark.asyncio
async def test_get_daily_activity_date_filter(mock_claude_dir, mock_stats_cache):
    """测试按日期范围过滤每日活动"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    daily_activity = await reader.get_daily_activity(
        start_date="2026-01-06",
        end_date="2026-01-06"
    )

    assert len(daily_activity) == 1
    assert daily_activity[0].date == "2026-01-06"


# ============================================
# calculate_cache_hit_rate 测试
# ============================================
@pytest.mark.asyncio
async def test_calculate_cache_hit_rate(mock_claude_dir, mock_stats_cache):
    """测试计算缓存命中率"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    hit_rate = await reader.calculate_cache_hit_rate()

    # 总缓存读取: 2000 + 500 = 2500
    # 总输入: 10000 + 3000 = 13000
    # 命中率: 2500 / (2500 + 13000) = 0.161...
    assert hit_rate > 0
    assert hit_rate < 1
    assert abs(hit_rate - 0.1612903) < 0.0001


@pytest.mark.asyncio
async def test_calculate_cache_hit_rate_zero(mock_claude_dir):
    """测试缓存命中率为 0 的情况"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    hit_rate = await reader.calculate_cache_hit_rate()

    assert hit_rate == 0.0


# ============================================
# get_total_stats 测试
# ============================================
@pytest.mark.asyncio
async def test_get_total_stats(mock_claude_dir, mock_stats_cache):
    """测试获取完整统计缓存"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    stats = await reader.get_total_stats()

    assert stats is not None
    assert stats.total_sessions == 13  # 5 + 8
    assert len(stats.models) == 2
    assert len(stats.daily_activities) == 2
    assert stats.last_updated is not None


# ============================================
# 性能测试
# ============================================
@pytest.mark.asyncio
async def test_performance_large_jsonl(mock_claude_dir):
    """测试大文件解析性能"""
    # 创建大文件（1000 条记录）
    history_file = mock_claude_dir / "history.jsonl"
    with history_file.open("w", encoding="utf-8") as f:
        for i in range(1000):
            item = {
                "display": f"message {i}",
                "timestamp": 1704614400000 + i * 1000,
                "sessionId": f"session-{i}"
            }
            f.write(json.dumps(item) + "\n")

    reader = StatsReader(claude_dir=mock_claude_dir)

    import time
    start = time.time()
    data = await reader.parse_jsonl_files()
    elapsed = time.time() - start

    assert len(data) == 1000
    assert elapsed < 1.0  # 应该在 1 秒内完成


# ============================================
# 异常处理测试
# ============================================
@pytest.mark.asyncio
async def test_read_stats_cache_permission_error(mock_claude_dir):
    """测试文件权限错误"""
    import os

    cache_file = mock_claude_dir / "stats-cache.json"
    cache_file.write_text("{}", encoding="utf-8")

    # 修改权限为不可读（仅在 Unix 系统上有效）
    if os.name != "nt":  # 非 Windows 系统
        os.chmod(cache_file, 0o000)

        reader = StatsReader(claude_dir=mock_claude_dir)
        data = await reader.read_stats_cache()

        assert data is None

        # 恢复权限
        os.chmod(cache_file, 0o644)


@pytest.mark.asyncio
async def test_parse_jsonl_with_invalid_lines(mock_claude_dir):
    """测试包含无效行的 JSONL 文件"""
    history_file = mock_claude_dir / "history.jsonl"
    content = """{"valid": "line1"}
invalid json line
{"valid": "line2"}

{"valid": "line3"}
"""
    history_file.write_text(content, encoding="utf-8")

    reader = StatsReader(claude_dir=mock_claude_dir)
    data = await reader.parse_jsonl_files()

    # 应该只解析成功的行
    assert len(data) == 3


@pytest.mark.asyncio
async def test_get_total_stats_no_cache(mock_claude_dir):
    """测试无缓存文件时的总统计"""
    reader = StatsReader(claude_dir=mock_claude_dir)
    stats = await reader.get_total_stats()

    assert stats is None
