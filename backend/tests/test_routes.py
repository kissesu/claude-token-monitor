"""
@file: test_routes.py
@description: API 路由测试
@author: Atlas.oi
@date: 2026-01-07
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from app.api.routes import router
from app.core.schemas import StatsCache, ModelUsage, DailyActivity, DailyModelTokens
from fastapi import FastAPI


# 创建测试应用
app = FastAPI()
app.include_router(router, prefix="/api/v1")

client = TestClient(app)


@pytest.fixture
def mock_stats_cache():
    """
    模拟统计缓存数据
    """
    return StatsCache(
        total_sessions=100,
        total_tokens=50000,
        models={
            "claude-3-5-sonnet-20241022": ModelUsage(
                model_name="claude-3-5-sonnet-20241022",
                input_tokens=30000,
                output_tokens=15000,
                cache_read_tokens=3000,
                cache_creation_tokens=2000,
            )
        },
        daily_activities=[
            DailyActivity(
                date="2026-01-07",
                session_count=5,
                total_tokens=10000,
                models=[
                    DailyModelTokens(
                        date="2026-01-07",
                        model_name="claude-3-5-sonnet-20241022",
                        input_tokens=6000,
                        output_tokens=3000,
                        cache_read_tokens=600,
                        cache_creation_tokens=400,
                    )
                ],
            )
        ],
        last_updated=datetime.now(),
    )


def test_health_check():
    """
    测试健康检查接口
    """
    response = client.get("/api/v1/health")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "status" in data["data"]


@patch("app.api.routes.get_stats_reader")
def test_get_stats(mock_get_reader, mock_stats_cache):
    """
    测试获取当前统计数据接口
    """
    # 模拟 StatsReader
    mock_reader = AsyncMock()
    mock_reader.get_total_stats.return_value = mock_stats_cache
    mock_get_reader.return_value = mock_reader

    response = client.get("/api/v1/stats")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_sessions"] == 100
    assert data["data"]["total_tokens"] == 50000


@patch("app.api.routes.get_stats_reader")
def test_get_stats_not_found(mock_get_reader):
    """
    测试统计数据不存在的情况
    """
    # 模拟 StatsReader 返回 None
    mock_reader = AsyncMock()
    mock_reader.get_total_stats.return_value = None
    mock_get_reader.return_value = mock_reader

    response = client.get("/api/v1/stats")

    assert response.status_code == 404


@patch("app.api.routes.get_stats_reader")
def test_get_daily_stats(mock_get_reader, mock_stats_cache):
    """
    测试获取每日统计数据接口
    """
    # 模拟 StatsReader
    mock_reader = AsyncMock()
    mock_reader.get_daily_activity.return_value = mock_stats_cache.daily_activities
    mock_get_reader.return_value = mock_reader

    response = client.get("/api/v1/stats/daily")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 1
    assert data["data"][0]["date"] == "2026-01-07"


@patch("app.api.routes.get_stats_reader")
def test_get_daily_stats_with_date_range(mock_get_reader, mock_stats_cache):
    """
    测试带日期范围的每日统计数据接口
    """
    mock_reader = AsyncMock()
    mock_reader.get_daily_activity.return_value = mock_stats_cache.daily_activities
    mock_get_reader.return_value = mock_reader

    response = client.get(
        "/api/v1/stats/daily",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        }
    )

    assert response.status_code == 200

    # 验证调用参数
    mock_reader.get_daily_activity.assert_called_once_with(
        start_date="2026-01-01",
        end_date="2026-01-31",
    )


@patch("app.api.routes.get_stats_reader")
def test_get_model_stats(mock_get_reader, mock_stats_cache):
    """
    测试获取模型统计数据接口
    """
    mock_reader = AsyncMock()
    mock_reader.get_model_usage.return_value = mock_stats_cache.models
    mock_get_reader.return_value = mock_reader

    response = client.get("/api/v1/stats/models")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 1
    assert data["data"][0]["model_name"] == "claude-3-5-sonnet-20241022"


@patch("app.api.routes.get_stats_reader")
@patch("app.api.routes.get_data_processor")
def test_get_trends(mock_get_processor, mock_get_reader, mock_stats_cache):
    """
    测试获取趋势数据接口
    """
    mock_reader = AsyncMock()
    mock_reader.get_daily_activity.return_value = mock_stats_cache.daily_activities
    mock_get_reader.return_value = mock_reader

    mock_processor = AsyncMock()
    mock_get_processor.return_value = mock_processor

    response = client.get("/api/v1/stats/trends?days=30")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["days"] == 30
    assert "total_tokens" in data["data"]
    assert "total_sessions" in data["data"]
    assert "avg_tokens_per_day" in data["data"]


@patch("app.api.routes.get_stats_reader")
@patch("app.api.routes.get_data_processor")
def test_get_trends_invalid_days(mock_get_processor, mock_get_reader):
    """
    测试无效的天数参数
    """
    response = client.get("/api/v1/stats/trends?days=500")

    # FastAPI 会自动验证参数范围
    assert response.status_code == 422


@patch("app.api.routes.get_database")
def test_get_history(mock_get_db):
    """
    测试获取历史数据接口
    """
    # 模拟数据库
    mock_db = AsyncMock()
    mock_db.get_historical_stats.return_value = [
        {
            "id": 1,
            "timestamp": "2026-01-07T12:00:00",
            "total_sessions": 100,
            "total_tokens": 50000,
            "created_at": "2026-01-07T12:00:00",
        }
    ]
    mock_get_db.return_value = mock_db

    response = client.get("/api/v1/stats/history")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 1


@patch("app.api.routes.get_database")
def test_get_history_with_filters(mock_get_db):
    """
    测试带过滤条件的历史数据接口
    """
    mock_db = AsyncMock()
    mock_db.get_historical_stats.return_value = []
    mock_get_db.return_value = mock_db

    response = client.get(
        "/api/v1/stats/history",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
            "limit": 50,
        }
    )

    assert response.status_code == 200

    # 验证调用参数
    mock_db.get_historical_stats.assert_called_once_with(
        start_date="2026-01-01",
        end_date="2026-01-31",
        limit=50,
    )


@patch("app.api.routes.get_stats_reader")
@patch("app.api.routes.get_export_service")
def test_export_data_json(mock_get_export, mock_get_reader, mock_stats_cache):
    """
    测试导出 JSON 格式数据
    """
    mock_reader = AsyncMock()
    mock_reader.get_daily_activity.return_value = mock_stats_cache.daily_activities
    mock_get_reader.return_value = mock_reader

    mock_export = AsyncMock()
    mock_export.export_data.return_value = {
        "success": True,
        "message": "导出成功",
        "file_path": "/path/to/file.json",
    }
    mock_get_export.return_value = mock_export

    response = client.post(
        "/api/v1/export",
        json={
            "format": "json",
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        }
    )

    assert response.status_code == 200


@patch("app.api.routes.get_stats_reader")
@patch("app.api.routes.get_export_service")
def test_export_data_csv(mock_get_export, mock_get_reader, mock_stats_cache):
    """
    测试导出 CSV 格式数据
    """
    mock_reader = AsyncMock()
    mock_reader.get_daily_activity.return_value = mock_stats_cache.daily_activities
    mock_get_reader.return_value = mock_reader

    mock_export = AsyncMock()
    mock_export.export_data.return_value = {
        "success": True,
        "message": "导出成功",
        "file_path": "/path/to/file.csv",
    }
    mock_get_export.return_value = mock_export

    response = client.post(
        "/api/v1/export",
        json={
            "format": "csv",
        }
    )

    assert response.status_code == 200


@patch("app.api.routes.get_stats_reader")
@patch("app.api.routes.get_export_service")
def test_export_data_with_model_filter(mock_get_export, mock_get_reader, mock_stats_cache):
    """
    测试带模型过滤的导出
    """
    mock_reader = AsyncMock()
    mock_reader.get_daily_activity.return_value = mock_stats_cache.daily_activities
    mock_get_reader.return_value = mock_reader

    mock_export = AsyncMock()
    mock_export.export_data.return_value = {
        "success": True,
        "message": "导出成功",
    }
    mock_get_export.return_value = mock_export

    response = client.post(
        "/api/v1/export",
        json={
            "format": "json",
            "models": ["claude-3-5-sonnet-20241022"],
        }
    )

    assert response.status_code == 200


def test_get_config():
    """
    测试获取配置信息接口
    """
    response = client.get("/api/v1/config")

    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "backend_port" in data["data"]
    assert "log_level" in data["data"]
