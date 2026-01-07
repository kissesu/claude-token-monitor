"""
@file: conftest.py
@description: 性能测试共享配置和工具
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 提供性能测量工具
2. 提供基准测试 fixture
3. 提供并发测试工具
"""

import pytest
import time
import asyncio
import psutil
import os
from typing import Callable, Any, Dict
from contextlib import asynccontextmanager


# ============================================
# 性能指标阈值配置
# ============================================
PERFORMANCE_THRESHOLDS = {
    "api_response_p99": 0.200,  # 200ms
    "api_response_p95": 0.150,  # 150ms
    "api_response_avg": 0.100,  # 100ms
    "memory_usage_mb": 100,     # 100MB
    "concurrent_connections": 50,  # 50 个并发连接
}


# ============================================
# 性能计时器
# ============================================
class PerformanceTimer:
    """
    性能计时器

    用于测量代码执行时间
    """

    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.duration = None

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.perf_counter()
        self.duration = self.end_time - self.start_time


@pytest.fixture
def timer():
    """
    提供性能计时器

    Returns:
        PerformanceTimer: 计时器实例
    """
    return PerformanceTimer()


# ============================================
# 异步性能计时器
# ============================================
@asynccontextmanager
async def async_timer():
    """
    异步性能计时器

    Yields:
        dict: 包含时间测量结果的字典
    """
    result = {"duration": 0}
    start = time.perf_counter()

    yield result

    end = time.perf_counter()
    result["duration"] = end - start


# ============================================
# 内存使用监控
# ============================================
class MemoryMonitor:
    """
    内存使用监控器

    监控进程的内存使用情况
    """

    def __init__(self):
        self.process = psutil.Process(os.getpid())
        self.start_memory = None
        self.peak_memory = None

    def start(self):
        """开始监控"""
        self.start_memory = self.process.memory_info().rss / 1024 / 1024  # MB

    def get_current_usage(self) -> float:
        """
        获取当前内存使用量

        Returns:
            float: 内存使用量（MB）
        """
        return self.process.memory_info().rss / 1024 / 1024

    def get_peak_usage(self) -> float:
        """
        获取峰值内存使用量

        Returns:
            float: 峰值内存使用量（MB）
        """
        current = self.get_current_usage()
        if self.peak_memory is None or current > self.peak_memory:
            self.peak_memory = current
        return self.peak_memory

    def get_delta(self) -> float:
        """
        获取内存增量

        Returns:
            float: 内存增量（MB）
        """
        if self.start_memory is None:
            return 0
        return self.get_current_usage() - self.start_memory


@pytest.fixture
def memory_monitor():
    """
    提供内存监控器

    Returns:
        MemoryMonitor: 内存监控器实例
    """
    monitor = MemoryMonitor()
    monitor.start()
    return monitor


# ============================================
# 性能统计计算
# ============================================
class PerformanceStats:
    """
    性能统计计算器

    计算 P50, P95, P99 等统计指标
    """

    def __init__(self, measurements: list):
        self.measurements = sorted(measurements)
        self.count = len(measurements)

    def percentile(self, p: int) -> float:
        """
        计算百分位数

        Args:
            p: 百分位（0-100）

        Returns:
            float: 百分位数值
        """
        if self.count == 0:
            return 0

        index = int(self.count * p / 100)
        if index >= self.count:
            index = self.count - 1

        return self.measurements[index]

    def average(self) -> float:
        """
        计算平均值

        Returns:
            float: 平均值
        """
        if self.count == 0:
            return 0
        return sum(self.measurements) / self.count

    def min(self) -> float:
        """最小值"""
        return min(self.measurements) if self.measurements else 0

    def max(self) -> float:
        """最大值"""
        return max(self.measurements) if self.measurements else 0

    def median(self) -> float:
        """中位数"""
        return self.percentile(50)


# ============================================
# 并发测试工具
# ============================================
async def run_concurrent_tasks(
    task_func: Callable,
    num_tasks: int,
    *args,
    **kwargs
) -> tuple[list, PerformanceStats]:
    """
    并发运行任务并收集性能统计

    Args:
        task_func: 要执行的异步函数
        num_tasks: 并发任务数量
        *args: 传递给任务函数的位置参数
        **kwargs: 传递给任务函数的关键字参数

    Returns:
        tuple: (结果列表, 性能统计)
    """
    # 记录每个任务的执行时间
    durations = []
    results = []

    async def timed_task():
        start = time.perf_counter()
        try:
            result = await task_func(*args, **kwargs)
            results.append(result)
        except Exception as e:
            results.append(e)
        finally:
            end = time.perf_counter()
            durations.append(end - start)

    # 创建并发任务
    tasks = [timed_task() for _ in range(num_tasks)]

    # 执行所有任务
    await asyncio.gather(*tasks)

    # 计算统计
    stats = PerformanceStats(durations)

    return results, stats


# ============================================
# 性能基准fixture
# ============================================
@pytest.fixture
def performance_thresholds():
    """
    提供性能阈值配置

    Returns:
        dict: 性能阈值字典
    """
    return PERFORMANCE_THRESHOLDS.copy()


# ============================================
# 性能报告生成器
# ============================================
class PerformanceReport:
    """
    性能测试报告生成器
    """

    def __init__(self, test_name: str):
        self.test_name = test_name
        self.metrics = {}

    def add_metric(self, name: str, value: float, unit: str = ""):
        """
        添加性能指标

        Args:
            name: 指标名称
            value: 指标值
            unit: 单位（可选）
        """
        self.metrics[name] = {
            "value": value,
            "unit": unit
        }

    def add_stats(self, name: str, stats: PerformanceStats, unit: str = "s"):
        """
        添加统计指标

        Args:
            name: 指标名称前缀
            stats: 性能统计对象
            unit: 单位
        """
        self.add_metric(f"{name}_avg", stats.average(), unit)
        self.add_metric(f"{name}_p50", stats.median(), unit)
        self.add_metric(f"{name}_p95", stats.percentile(95), unit)
        self.add_metric(f"{name}_p99", stats.percentile(99), unit)
        self.add_metric(f"{name}_min", stats.min(), unit)
        self.add_metric(f"{name}_max", stats.max(), unit)

    def print_report(self):
        """打印性能报告"""
        print(f"\n{'=' * 60}")
        print(f"性能测试报告: {self.test_name}")
        print(f"{'=' * 60}")

        for metric_name, metric_data in self.metrics.items():
            value = metric_data["value"]
            unit = metric_data["unit"]
            print(f"{metric_name:30s}: {value:10.4f} {unit}")

        print(f"{'=' * 60}\n")


@pytest.fixture
def performance_report(request):
    """
    提供性能报告生成器

    Args:
        request: pytest request 对象

    Returns:
        PerformanceReport: 性能报告生成器
    """
    test_name = request.node.name
    report = PerformanceReport(test_name)

    yield report

    # 测试结束后打印报告
    report.print_report()
