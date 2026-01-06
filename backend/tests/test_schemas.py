"""
@file: test_schemas.py
@description: 数据模型测试
@author: Atlas.oi
@date: 2026-01-07

测试覆盖：
1. 所有模型的序列化和反序列化
2. 数据验证规则
3. 字段默认值
4. 计算属性
5. 日期格式验证
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from app.core.schemas import (
    ModelUsage,
    DailyModelTokens,
    DailyActivity,
    StatsCache,
    SessionInfo,
    ExportRequest,
    ExportResponse,
    ExportFormat,
    ApiResponse,
)


class TestModelUsage:
    """ModelUsage 模型测试"""

    def test_valid_model_usage(self):
        """测试有效的模型使用数据"""
        data = {
            "model_name": "claude-3-5-sonnet-20241022",
            "input_tokens": 1000,
            "output_tokens": 500,
            "cache_read_tokens": 200,
            "cache_creation_tokens": 100,
        }

        usage = ModelUsage(**data)

        assert usage.model_name == "claude-3-5-sonnet-20241022"
        assert usage.input_tokens == 1000
        assert usage.output_tokens == 500
        assert usage.cache_read_tokens == 200
        assert usage.cache_creation_tokens == 100

    def test_default_values(self):
        """测试默认值"""
        usage = ModelUsage(model_name="test-model")

        assert usage.input_tokens == 0
        assert usage.output_tokens == 0
        assert usage.cache_read_tokens == 0
        assert usage.cache_creation_tokens == 0

    def test_total_tokens_property(self):
        """测试总 Token 计算属性"""
        usage = ModelUsage(
            model_name="test-model",
            input_tokens=1000,
            output_tokens=500,
        )

        assert usage.total_tokens == 1500

    def test_total_with_cache_property(self):
        """测试包含缓存的总 Token 计算"""
        usage = ModelUsage(
            model_name="test-model",
            input_tokens=1000,
            output_tokens=500,
            cache_read_tokens=200,
            cache_creation_tokens=100,
        )

        assert usage.total_with_cache == 1800

    def test_negative_tokens_validation(self):
        """测试负数 Token 验证"""
        with pytest.raises(ValidationError) as exc_info:
            ModelUsage(
                model_name="test-model",
                input_tokens=-100,
            )

        errors = exc_info.value.errors()
        assert any("greater than or equal to 0" in str(e) for e in errors)

    def test_empty_model_name_validation(self):
        """测试空模型名称验证"""
        with pytest.raises(ValidationError):
            ModelUsage(model_name="")

    def test_serialization(self):
        """测试序列化"""
        usage = ModelUsage(
            model_name="test-model",
            input_tokens=1000,
            output_tokens=500,
        )

        data = usage.model_dump()
        assert data["model_name"] == "test-model"
        assert data["input_tokens"] == 1000
        assert data["output_tokens"] == 500

    def test_json_serialization(self):
        """测试 JSON 序列化"""
        usage = ModelUsage(
            model_name="test-model",
            input_tokens=1000,
        )

        json_str = usage.model_dump_json()
        assert isinstance(json_str, str)
        assert "test-model" in json_str
        assert "1000" in json_str


class TestDailyModelTokens:
    """DailyModelTokens 模型测试"""

    def test_valid_daily_model_tokens(self):
        """测试有效的每日模型 Token 数据"""
        data = {
            "date": "2026-01-07",
            "model_name": "claude-3-5-sonnet-20241022",
            "input_tokens": 5000,
            "output_tokens": 2000,
            "cache_read_tokens": 1000,
            "cache_creation_tokens": 500,
        }

        tokens = DailyModelTokens(**data)

        assert tokens.date == "2026-01-07"
        assert tokens.model_name == "claude-3-5-sonnet-20241022"
        assert tokens.input_tokens == 5000

    def test_date_format_validation_valid(self):
        """测试有效的日期格式"""
        valid_dates = ["2026-01-07", "2025-12-31", "2024-02-29"]  # 闰年

        for date in valid_dates:
            tokens = DailyModelTokens(
                date=date,
                model_name="test-model",
            )
            assert tokens.date == date

    def test_date_format_validation_invalid(self):
        """测试无效的日期格式"""
        invalid_dates = [
            "2026/01/07",  # 错误的分隔符
            "07-01-2026",  # 错误的顺序
            "2026-1-7",    # 缺少前导零
            "2026-13-01",  # 无效的月份
            "2026-01-32",  # 无效的日期
            "invalid",     # 完全无效
        ]

        for date in invalid_dates:
            with pytest.raises(ValidationError):
                DailyModelTokens(
                    date=date,
                    model_name="test-model",
                )


class TestDailyActivity:
    """DailyActivity 模型测试"""

    def test_valid_daily_activity(self):
        """测试有效的每日活动数据"""
        data = {
            "date": "2026-01-07",
            "session_count": 5,
            "total_tokens": 10000,
            "models": [
                {
                    "date": "2026-01-07",
                    "model_name": "claude-3-5-sonnet-20241022",
                    "input_tokens": 5000,
                    "output_tokens": 2000,
                    "cache_read_tokens": 1000,
                    "cache_creation_tokens": 500,
                }
            ]
        }

        activity = DailyActivity(**data)

        assert activity.date == "2026-01-07"
        assert activity.session_count == 5
        assert activity.total_tokens == 10000
        assert len(activity.models) == 1
        assert activity.models[0].model_name == "claude-3-5-sonnet-20241022"

    def test_default_values(self):
        """测试默认值"""
        activity = DailyActivity(date="2026-01-07")

        assert activity.session_count == 0
        assert activity.total_tokens == 0
        assert activity.models == []

    def test_empty_models_list(self):
        """测试空模型列表"""
        activity = DailyActivity(
            date="2026-01-07",
            session_count=0,
            total_tokens=0,
            models=[]
        )

        assert isinstance(activity.models, list)
        assert len(activity.models) == 0


class TestStatsCache:
    """StatsCache 模型测试"""

    def test_valid_stats_cache(self):
        """测试有效的统计缓存数据"""
        data = {
            "total_sessions": 100,
            "total_tokens": 50000,
            "models": {
                "claude-3-5-sonnet-20241022": {
                    "model_name": "claude-3-5-sonnet-20241022",
                    "input_tokens": 30000,
                    "output_tokens": 15000,
                    "cache_read_tokens": 3000,
                    "cache_creation_tokens": 2000,
                }
            },
            "daily_activities": [
                {
                    "date": "2026-01-07",
                    "session_count": 5,
                    "total_tokens": 10000,
                    "models": []
                }
            ]
        }

        cache = StatsCache(**data)

        assert cache.total_sessions == 100
        assert cache.total_tokens == 50000
        assert "claude-3-5-sonnet-20241022" in cache.models
        assert len(cache.daily_activities) == 1

    def test_default_values(self):
        """测试默认值"""
        cache = StatsCache()

        assert cache.total_sessions == 0
        assert cache.total_tokens == 0
        assert cache.models == {}
        assert cache.daily_activities == []
        assert isinstance(cache.last_updated, datetime)

    def test_last_updated_auto_set(self):
        """测试最后更新时间自动设置"""
        cache = StatsCache()
        now = datetime.now()

        # 时间差应该很小（小于1秒）
        diff = (now - cache.last_updated).total_seconds()
        assert abs(diff) < 1


class TestSessionInfo:
    """SessionInfo 模型测试"""

    def test_valid_session_info(self):
        """测试有效的会话信息"""
        now = datetime.now()
        data = {
            "session_id": "session_123456",
            "model_name": "claude-3-5-sonnet-20241022",
            "created_at": now,
            "input_tokens": 1000,
            "output_tokens": 500,
            "cache_read_tokens": 200,
            "cache_creation_tokens": 100,
            "project_name": "my-project",
            "metadata": {"key": "value"}
        }

        session = SessionInfo(**data)

        assert session.session_id == "session_123456"
        assert session.model_name == "claude-3-5-sonnet-20241022"
        assert session.created_at == now
        assert session.project_name == "my-project"
        assert session.metadata == {"key": "value"}

    def test_total_tokens_property(self):
        """测试总 Token 计算"""
        session = SessionInfo(
            session_id="test",
            model_name="test-model",
            created_at=datetime.now(),
            input_tokens=1000,
            output_tokens=500,
            cache_read_tokens=200,
            cache_creation_tokens=100,
        )

        assert session.total_tokens == 1800

    def test_optional_fields(self):
        """测试可选字段"""
        session = SessionInfo(
            session_id="test",
            model_name="test-model",
            created_at=datetime.now(),
        )

        assert session.project_name is None
        assert session.metadata == {}


class TestExportRequest:
    """ExportRequest 模型测试"""

    def test_valid_export_request(self):
        """测试有效的导出请求"""
        data = {
            "format": "json",
            "start_date": "2026-01-01",
            "end_date": "2026-01-07",
            "models": ["claude-3-5-sonnet-20241022"]
        }

        request = ExportRequest(**data)

        assert request.format == ExportFormat.JSON
        assert request.start_date == "2026-01-01"
        assert request.end_date == "2026-01-07"
        assert request.models == ["claude-3-5-sonnet-20241022"]

    def test_default_format(self):
        """测试默认导出格式"""
        request = ExportRequest()

        assert request.format == ExportFormat.JSON
        assert request.start_date is None
        assert request.end_date is None
        assert request.models is None

    def test_export_format_enum(self):
        """测试导出格式枚举"""
        formats = ["json", "csv", "excel"]

        for fmt in formats:
            request = ExportRequest(format=fmt)
            assert request.format == fmt

    def test_invalid_export_format(self):
        """测试无效的导出格式"""
        with pytest.raises(ValidationError):
            ExportRequest(format="invalid")

    def test_date_validation(self):
        """测试日期验证"""
        # 有效日期
        request = ExportRequest(
            start_date="2026-01-01",
            end_date="2026-01-07"
        )
        assert request.start_date == "2026-01-01"

        # 无效日期格式
        with pytest.raises(ValidationError):
            ExportRequest(start_date="2026/01/01")


class TestExportResponse:
    """ExportResponse 模型测试"""

    def test_valid_export_response(self):
        """测试有效的导出响应"""
        data = {
            "success": True,
            "message": "导出成功",
            "file_path": "exports/data.json",
            "data": {"key": "value"}
        }

        response = ExportResponse(**data)

        assert response.success is True
        assert response.message == "导出成功"
        assert response.file_path == "exports/data.json"
        assert response.data == {"key": "value"}

    def test_optional_fields(self):
        """测试可选字段"""
        response = ExportResponse(
            success=True,
            message="导出成功"
        )

        assert response.file_path is None
        assert response.data is None


class TestApiResponse:
    """ApiResponse 模型测试"""

    def test_valid_api_response(self):
        """测试有效的 API 响应"""
        data = {
            "success": True,
            "message": "操作成功",
            "data": {"result": "ok"},
            "error": None
        }

        response = ApiResponse(**data)

        assert response.success is True
        assert response.message == "操作成功"
        assert response.data == {"result": "ok"}
        assert response.error is None
        assert isinstance(response.timestamp, datetime)

    def test_error_response(self):
        """测试错误响应"""
        response = ApiResponse(
            success=False,
            message="操作失败",
            error="错误详情"
        )

        assert response.success is False
        assert response.error == "错误详情"

    def test_timestamp_auto_set(self):
        """测试时间戳自动设置"""
        response = ApiResponse(success=True)
        now = datetime.now()

        diff = (now - response.timestamp).total_seconds()
        assert abs(diff) < 1


class TestModelSerialization:
    """模型序列化测试"""

    def test_model_dump(self):
        """测试 model_dump 方法"""
        usage = ModelUsage(
            model_name="test-model",
            input_tokens=1000,
        )

        data = usage.model_dump()
        assert isinstance(data, dict)
        assert data["model_name"] == "test-model"
        assert data["input_tokens"] == 1000

    def test_model_dump_json(self):
        """测试 model_dump_json 方法"""
        usage = ModelUsage(
            model_name="test-model",
            input_tokens=1000,
        )

        json_str = usage.model_dump_json()
        assert isinstance(json_str, str)

        # 应该能够解析回来
        import json
        data = json.loads(json_str)
        assert data["model_name"] == "test-model"

    def test_model_validate(self):
        """测试 model_validate 方法"""
        data = {
            "model_name": "test-model",
            "input_tokens": 1000,
        }

        usage = ModelUsage.model_validate(data)
        assert usage.model_name == "test-model"
        assert usage.input_tokens == 1000

    def test_nested_model_serialization(self):
        """测试嵌套模型序列化"""
        activity = DailyActivity(
            date="2026-01-07",
            session_count=5,
            models=[
                DailyModelTokens(
                    date="2026-01-07",
                    model_name="test-model",
                    input_tokens=1000,
                )
            ]
        )

        data = activity.model_dump()
        assert len(data["models"]) == 1
        assert data["models"][0]["model_name"] == "test-model"
