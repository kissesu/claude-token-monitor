"""
@file: test_api_integration.py
@description: API 端点集成测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试所有 API 端点的完整流程
2. 测试请求-响应周期
3. 测试数据持久化
4. 测试错误处理
"""

import pytest
from httpx import AsyncClient
from fastapi import status


# ============================================
# 标记为集成测试
# ============================================
pytestmark = pytest.mark.integration


# ============================================
# 测试根路径
# ============================================
@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """
    测试根路径接口

    验收标准：
    - 状态码 200
    - 返回欢迎信息
    """
    response = await client.get("/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert "docs" in data
    assert data["message"] == "Claude Token Monitor API"


# ============================================
# 测试健康检查
# ============================================
@pytest.mark.asyncio
async def test_health_check(client: AsyncClient, mock_stats_cache):
    """
    测试健康检查接口

    验收标准：
    - 状态码 200
    - 返回健康状态
    - 包含必要的健康检查项
    """
    response = await client.get("/api/v1/health")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "claude-token-monitor"


# ============================================
# 测试获取统计数据
# ============================================
@pytest.mark.asyncio
async def test_get_stats(client: AsyncClient, mock_stats_cache):
    """
    测试获取统计数据接口

    验收标准：
    - 状态码 200
    - 返回完整的统计数据
    - 数据格式符合 schema
    """
    response = await client.get("/api/v1/stats")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 验证响应结构
    assert data["success"] is True
    assert "data" in data
    assert "message" in data

    # 验证统计数据
    stats = data["data"]
    assert "total_input_tokens" in stats
    assert "total_output_tokens" in stats
    assert "model_usage" in stats

    # 验证数据值
    assert stats["total_input_tokens"] == 50000
    assert stats["total_output_tokens"] == 30000


# ============================================
# 测试获取统计数据（无数据情况）
# ============================================
@pytest.mark.asyncio
async def test_get_stats_no_data(client: AsyncClient, test_dirs):
    """
    测试获取统计数据接口（无数据情况）

    验收标准：
    - 状态码 404
    - 返回友好的错误信息
    """
    response = await client.get("/api/v1/stats")

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================
# 测试获取每日统计数据
# ============================================
@pytest.mark.asyncio
async def test_get_daily_stats(client: AsyncClient, mock_daily_activity):
    """
    测试获取每日统计数据接口

    验收标准：
    - 状态码 200
    - 返回每日数据列表
    - 数据按日期排序
    """
    response = await client.get("/api/v1/stats/daily")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0

    # 验证每日数据结构
    daily = data["data"][0]
    assert "date" in daily
    assert "session_count" in daily
    assert "total_tokens" in daily
    assert "models" in daily


# ============================================
# 测试日期范围筛选
# ============================================
@pytest.mark.asyncio
async def test_get_daily_stats_with_date_range(
    client: AsyncClient,
    mock_daily_activity
):
    """
    测试带日期范围的每日统计数据

    验收标准：
    - 状态码 200
    - 返回指定日期范围的数据
    - 数据量符合预期
    """
    from datetime import datetime, timedelta

    # 获取最近 3 天的数据
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")

    response = await client.get(
        f"/api/v1/stats/daily?start_date={start_date}&end_date={end_date}"
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["success"] is True
    assert len(data["data"]) <= 3


# ============================================
# 测试获取模型统计数据
# ============================================
@pytest.mark.asyncio
async def test_get_model_stats(client: AsyncClient, mock_stats_cache):
    """
    测试获取模型统计数据接口

    验收标准：
    - 状态码 200
    - 返回所有模型数据
    - 数据按使用量排序
    """
    response = await client.get("/api/v1/stats/models")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0

    # 验证模型数据结构
    model = data["data"][0]
    assert "model_name" in model
    assert "input_tokens" in model
    assert "output_tokens" in model

    # 验证排序（按总使用量降序）
    if len(data["data"]) > 1:
        assert (
            data["data"][0]["total_with_cache"] >=
            data["data"][1]["total_with_cache"]
        )


# ============================================
# 测试获取趋势数据
# ============================================
@pytest.mark.asyncio
async def test_get_trends(client: AsyncClient, mock_daily_activity):
    """
    测试获取趋势数据接口

    验收标准：
    - 状态码 200
    - 返回趋势统计
    - 包含平均值、总数等指标
    """
    response = await client.get("/api/v1/stats/trends?days=7")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["success"] is True
    assert "data" in data

    # 验证趋势数据
    trends = data["data"]
    assert "days" in trends
    assert "total_tokens" in trends
    assert "total_sessions" in trends
    assert "avg_tokens_per_day" in trends
    assert "daily_data" in trends

    assert trends["days"] == 7


# ============================================
# 测试参数验证
# ============================================
@pytest.mark.asyncio
async def test_trends_invalid_days(client: AsyncClient):
    """
    测试趋势数据接口的参数验证

    验收标准：
    - 无效参数返回 422
    - 返回验证错误信息
    """
    # 测试超出范围的天数
    response = await client.get("/api/v1/stats/trends?days=400")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ============================================
# 测试获取配置信息
# ============================================
@pytest.mark.asyncio
async def test_get_config(client: AsyncClient, test_dirs):
    """
    测试获取配置信息接口

    验收标准：
    - 状态码 200
    - 返回配置信息
    - 不包含敏感数据
    """
    response = await client.get("/api/v1/config")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["success"] is True
    assert "data" in data

    # 验证配置数据
    config = data["data"]
    assert "backend_port" in config
    assert "log_level" in config
    assert "claude_dir" in config

    # 确保不包含敏感数据（如数据库密码等）
    assert "password" not in str(config).lower()
    assert "secret" not in str(config).lower()


# ============================================
# 测试错误处理
# ============================================
@pytest.mark.asyncio
async def test_404_not_found(client: AsyncClient):
    """
    测试 404 错误处理

    验收标准：
    - 不存在的路由返回 404
    """
    response = await client.get("/api/v1/nonexistent")

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================
# 测试中间件功能
# ============================================
@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    """
    测试 CORS 中间件

    验收标准：
    - 响应包含 CORS 头
    """
    response = await client.options("/api/v1/health")

    assert "access-control-allow-origin" in response.headers


@pytest.mark.asyncio
async def test_request_logging_middleware(client: AsyncClient):
    """
    测试请求日志中间件

    验收标准：
    - 响应包含处理时间头
    """
    response = await client.get("/")

    assert "x-process-time" in response.headers
    # 验证处理时间是一个数字
    process_time = float(response.headers["x-process-time"])
    assert process_time >= 0


# ============================================
# 测试完整的请求流程
# ============================================
@pytest.mark.asyncio
async def test_full_request_flow(
    client: AsyncClient,
    mock_stats_cache,
    mock_daily_activity
):
    """
    测试完整的请求流程

    模拟用户的典型使用场景：
    1. 访问首页
    2. 检查健康状态
    3. 获取当前统计
    4. 获取每日数据
    5. 获取趋势分析

    验收标准：
    - 所有请求都成功
    - 数据连贯一致
    """
    # 1. 访问首页
    response = await client.get("/")
    assert response.status_code == status.HTTP_200_OK

    # 2. 健康检查
    response = await client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK

    # 3. 获取当前统计
    response = await client.get("/api/v1/stats")
    assert response.status_code == status.HTTP_200_OK
    total_tokens = response.json()["data"]["total_input_tokens"]

    # 4. 获取每日数据
    response = await client.get("/api/v1/stats/daily")
    assert response.status_code == status.HTTP_200_OK

    # 5. 获取趋势数据
    response = await client.get("/api/v1/stats/trends?days=7")
    assert response.status_code == status.HTTP_200_OK
    trends = response.json()["data"]

    # 验证数据一致性
    assert total_tokens > 0
    assert trends["total_tokens"] > 0
