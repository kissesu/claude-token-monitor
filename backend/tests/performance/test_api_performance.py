"""
@file: test_api_performance.py
@description: API 响应性能测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试 API 响应时间
2. 测试并发请求处理能力
3. 测试资源使用情况
4. 验证性能指标达标
"""

import pytest
import asyncio
from httpx import AsyncClient

from .conftest import (
    async_timer,
    run_concurrent_tasks,
    PerformanceReport,
    MemoryMonitor,
)


# ============================================
# 标记为性能测试
# ============================================
pytestmark = [pytest.mark.asyncio, pytest.mark.slow]


# ============================================
# 测试单个 API 请求响应时间
# ============================================
async def test_api_response_time_single(
    client: AsyncClient,
    mock_stats_cache,
    performance_report: PerformanceReport,
    performance_thresholds: dict,
):
    """
    测试单个 API 请求的响应时间

    验收标准：
    - 平均响应时间 < 100ms
    - P99 响应时间 < 200ms
    """
    # 预热请求
    await client.get("/api/v1/health")

    # 执行 100 次请求并记录时间
    durations = []

    for _ in range(100):
        async with async_timer() as timer_result:
            response = await client.get("/api/v1/stats")
            assert response.status_code == 200

        durations.append(timer_result["duration"])

    # 计算统计
    from .conftest import PerformanceStats
    stats = PerformanceStats(durations)

    # 添加到报告
    performance_report.add_stats("response_time", stats, "s")

    # 验证性能指标
    assert stats.average() < performance_thresholds["api_response_avg"], \
        f"平均响应时间 {stats.average():.3f}s 超过阈值 {performance_thresholds['api_response_avg']}s"

    assert stats.percentile(99) < performance_thresholds["api_response_p99"], \
        f"P99 响应时间 {stats.percentile(99):.3f}s 超过阈值 {performance_thresholds['api_response_p99']}s"


# ============================================
# 测试并发请求性能
# ============================================
async def test_api_concurrent_requests(
    client: AsyncClient,
    mock_stats_cache,
    performance_report: PerformanceReport,
    performance_thresholds: dict,
):
    """
    测试 API 并发请求处理能力

    验收标准：
    - 支持 50 个并发请求
    - P95 响应时间 < 150ms
    - 无请求失败
    """
    # 定义请求任务
    async def make_request():
        response = await client.get("/api/v1/stats")
        return response.status_code

    # 执行并发请求
    num_concurrent = 50
    results, stats = await run_concurrent_tasks(
        make_request,
        num_concurrent
    )

    # 添加到报告
    performance_report.add_stats("concurrent_response", stats, "s")
    performance_report.add_metric("concurrent_requests", num_concurrent, "个")

    # 验证所有请求都成功
    success_count = sum(1 for r in results if r == 200)
    success_rate = success_count / num_concurrent * 100

    performance_report.add_metric("success_rate", success_rate, "%")

    assert success_rate >= 99, f"成功率 {success_rate}% 低于 99%"

    # 验证 P95 响应时间
    assert stats.percentile(95) < performance_thresholds["api_response_p95"], \
        f"并发 P95 响应时间 {stats.percentile(95):.3f}s 超过阈值"


# ============================================
# 测试不同端点的响应时间
# ============================================
async def test_all_endpoints_response_time(
    client: AsyncClient,
    mock_stats_cache,
    mock_daily_activity,
    performance_report: PerformanceReport,
):
    """
    测试所有主要端点的响应时间

    验收标准：
    - 所有端点响应时间 < 200ms
    """
    endpoints = [
        "/",
        "/api/v1/health",
        "/api/v1/stats",
        "/api/v1/stats/daily",
        "/api/v1/stats/models",
        "/api/v1/stats/trends?days=7",
        "/api/v1/config",
    ]

    for endpoint in endpoints:
        durations = []

        # 每个端点测试 20 次
        for _ in range(20):
            async with async_timer() as timer_result:
                response = await client.get(endpoint)
                assert response.status_code in [200, 404]  # 有些端点可能返回 404

            durations.append(timer_result["duration"])

        # 计算统计
        from .conftest import PerformanceStats
        stats = PerformanceStats(durations)

        # 添加到报告
        endpoint_name = endpoint.replace("/", "_").replace("?", "_")
        performance_report.add_metric(
            f"endpoint{endpoint_name}_avg",
            stats.average(),
            "s"
        )

        # 验证响应时间
        assert stats.average() < 0.2, \
            f"端点 {endpoint} 平均响应时间 {stats.average():.3f}s 超过 200ms"


# ============================================
# 测试内存使用
# ============================================
async def test_memory_usage(
    client: AsyncClient,
    mock_stats_cache,
    memory_monitor: MemoryMonitor,
    performance_report: PerformanceReport,
    performance_thresholds: dict,
):
    """
    测试 API 请求的内存使用

    验收标准：
    - 内存使用 < 100MB
    - 无明显内存泄漏
    """
    # 记录初始内存
    initial_memory = memory_monitor.get_current_usage()

    # 执行大量请求
    for _ in range(200):
        await client.get("/api/v1/stats")

    # 等待 GC
    await asyncio.sleep(0.5)

    # 记录最终内存
    final_memory = memory_monitor.get_current_usage()
    peak_memory = memory_monitor.get_peak_usage()
    memory_delta = memory_monitor.get_delta()

    # 添加到报告
    performance_report.add_metric("initial_memory", initial_memory, "MB")
    performance_report.add_metric("final_memory", final_memory, "MB")
    performance_report.add_metric("peak_memory", peak_memory, "MB")
    performance_report.add_metric("memory_delta", memory_delta, "MB")

    # 验证内存使用
    assert peak_memory < performance_thresholds["memory_usage_mb"], \
        f"峰值内存 {peak_memory:.2f}MB 超过阈值 {performance_thresholds['memory_usage_mb']}MB"

    # 验证无明显内存泄漏（增量不超过 20MB）
    assert memory_delta < 20, \
        f"内存增量 {memory_delta:.2f}MB 可能存在内存泄漏"


# ============================================
# 测试大数据量响应
# ============================================
async def test_large_dataset_response(
    client: AsyncClient,
    mock_daily_activity,
    performance_report: PerformanceReport,
):
    """
    测试大数据量响应性能

    验收标准：
    - 返回大量数据时响应时间仍可接受
    - 数据序列化效率高
    """
    # 请求较大的数据集（30 天数据）
    async with async_timer() as timer_result:
        response = await client.get("/api/v1/stats/trends?days=30")
        assert response.status_code == 200
        data = response.json()

    duration = timer_result["duration"]

    # 添加到报告
    performance_report.add_metric("large_dataset_time", duration, "s")
    performance_report.add_metric(
        "response_size",
        len(str(data)),
        "bytes"
    )

    # 验证响应时间（大数据集允许更长时间，但不超过 300ms）
    assert duration < 0.3, \
        f"大数据集响应时间 {duration:.3f}s 超过 300ms"


# ============================================
# 测试持续负载
# ============================================
async def test_sustained_load(
    client: AsyncClient,
    mock_stats_cache,
    performance_report: PerformanceReport,
):
    """
    测试持续负载下的性能

    验收标准：
    - 持续负载下性能不降级
    - 响应时间保持稳定
    """
    # 持续 10 秒的请求负载
    duration_seconds = 10
    start_time = asyncio.get_event_loop().time()
    request_count = 0
    durations = []

    while asyncio.get_event_loop().time() - start_time < duration_seconds:
        async with async_timer() as timer_result:
            await client.get("/api/v1/stats")

        durations.append(timer_result["duration"])
        request_count += 1

        # 控制请求频率（每秒约 10 个请求）
        await asyncio.sleep(0.1)

    # 计算统计
    from .conftest import PerformanceStats
    stats = PerformanceStats(durations)

    # 添加到报告
    performance_report.add_metric("sustained_requests", request_count, "个")
    performance_report.add_metric("requests_per_second", request_count / duration_seconds, "req/s")
    performance_report.add_stats("sustained_load", stats, "s")

    # 验证性能稳定（P99 不超过平均值的 2 倍）
    assert stats.percentile(99) < stats.average() * 2, \
        "持续负载下性能不稳定"


# ============================================
# 测试冷启动性能
# ============================================
async def test_cold_start_performance(
    client: AsyncClient,
    mock_stats_cache,
    performance_report: PerformanceReport,
):
    """
    测试冷启动（首次请求）性能

    验收标准：
    - 首次请求响应时间 < 500ms
    - 后续请求响应时间更快
    """
    # 首次请求（冷启动）
    async with async_timer() as cold_start_timer:
        response = await client.get("/api/v1/stats")
        assert response.status_code == 200

    cold_start_time = cold_start_timer["duration"]

    # 预热后的请求
    warm_durations = []
    for _ in range(10):
        async with async_timer() as warm_timer:
            await client.get("/api/v1/stats")
        warm_durations.append(warm_timer["duration"])

    from .conftest import PerformanceStats
    warm_stats = PerformanceStats(warm_durations)

    # 添加到报告
    performance_report.add_metric("cold_start_time", cold_start_time, "s")
    performance_report.add_metric("warm_avg_time", warm_stats.average(), "s")

    # 验证冷启动时间
    assert cold_start_time < 0.5, \
        f"冷启动时间 {cold_start_time:.3f}s 超过 500ms"

    # 验证预热后性能更好
    assert warm_stats.average() < cold_start_time, \
        "预热后性能未提升"
