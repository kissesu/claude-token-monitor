"""
@file: test_data_processor.py
@description: 测试数据处理器模块
@author: Atlas.oi
@date: 2026-01-07
"""

import pytest
from app.core.data_processor import (
    aggregate_daily_stats,
    aggregate_model_stats,
    calculate_trends,
    filter_by_date_range,
    get_top_models,
    calculate_date_range_stats,
    group_by_model,
    calculate_model_daily_average,
    fill_missing_dates,
)
from app.core.schemas import ModelUsage, DailyActivity, DailyModelTokens


# ============================================
# 测试数据 Fixtures
# ============================================
@pytest.fixture
def sample_daily_activities():
    """创建示例每日活动数据"""
    return [
        DailyActivity(
            date="2026-01-01",
            session_count=5,
            total_tokens=10000,
            models=[
                DailyModelTokens(
                    date="2026-01-01",
                    model_name="claude-sonnet-4.5",
                    input_tokens=6000,
                    output_tokens=4000,
                )
            ]
        ),
        DailyActivity(
            date="2026-01-02",
            session_count=8,
            total_tokens=15000,
            models=[
                DailyModelTokens(
                    date="2026-01-02",
                    model_name="claude-sonnet-4.5",
                    input_tokens=9000,
                    output_tokens=6000,
                )
            ]
        ),
        DailyActivity(
            date="2026-01-03",
            session_count=3,
            total_tokens=8000,
            models=[
                DailyModelTokens(
                    date="2026-01-03",
                    model_name="claude-opus-4.5",
                    input_tokens=5000,
                    output_tokens=3000,
                )
            ]
        ),
    ]


@pytest.fixture
def sample_model_usages():
    """创建示例模型使用数据"""
    return {
        "claude-sonnet-4.5": ModelUsage(
            model_name="claude-sonnet-4.5",
            input_tokens=10000,
            output_tokens=5000,
            cache_read_tokens=2000,
            cache_creation_tokens=1000,
        ),
        "claude-opus-4.5": ModelUsage(
            model_name="claude-opus-4.5",
            input_tokens=3000,
            output_tokens=2000,
            cache_read_tokens=500,
            cache_creation_tokens=300,
        ),
        "claude-haiku-4.5": ModelUsage(
            model_name="claude-haiku-4.5",
            input_tokens=8000,
            output_tokens=4000,
            cache_read_tokens=1500,
            cache_creation_tokens=800,
        ),
    }


# ============================================
# aggregate_daily_stats 测试
# ============================================
def test_aggregate_daily_stats_all(sample_daily_activities):
    """测试聚合所有每日统计"""
    result = aggregate_daily_stats(sample_daily_activities)

    assert len(result) == 3
    assert "2026-01-01" in result
    assert "2026-01-02" in result
    assert "2026-01-03" in result


def test_aggregate_daily_stats_date_filter(sample_daily_activities):
    """测试按日期范围过滤聚合"""
    result = aggregate_daily_stats(
        sample_daily_activities,
        start_date="2026-01-02",
        end_date="2026-01-02"
    )

    assert len(result) == 1
    assert "2026-01-02" in result
    assert result["2026-01-02"].session_count == 8


def test_aggregate_daily_stats_empty():
    """测试空数据聚合"""
    result = aggregate_daily_stats([])
    assert len(result) == 0


# ============================================
# aggregate_model_stats 测试
# ============================================
def test_aggregate_model_stats(sample_model_usages):
    """测试聚合模型统计"""
    result = aggregate_model_stats(sample_model_usages)

    assert len(result) == 3
    assert "claude-sonnet-4.5" in result
    assert "claude-opus-4.5" in result
    assert "claude-haiku-4.5" in result


def test_aggregate_model_stats_duplicates():
    """测试重复模型数据聚合"""
    duplicates = {
        "claude-sonnet-4.5": ModelUsage(
            model_name="claude-sonnet-4.5",
            input_tokens=1000,
            output_tokens=500,
        ),
        "claude-sonnet-4.5": ModelUsage(
            model_name="claude-sonnet-4.5",
            input_tokens=2000,
            output_tokens=1000,
        ),
    }

    result = aggregate_model_stats(duplicates)

    # 最后一个会覆盖前面的
    assert len(result) == 1
    assert result["claude-sonnet-4.5"].input_tokens == 2000


# ============================================
# calculate_trends 测试
# ============================================
def test_calculate_trends_basic(sample_daily_activities):
    """测试基本趋势计算"""
    trends = calculate_trends(sample_daily_activities, period_days=1)

    assert len(trends) == 3
    assert "2026-01-01" in trends
    assert "2026-01-02" in trends
    assert "2026-01-03" in trends

    # 第一天没有前置数据
    day1 = trends["2026-01-01"]
    assert day1["total_tokens"] == 10000
    assert day1["prev_period_avg"] == 0.0

    # 第二天
    day2 = trends["2026-01-02"]
    assert day2["total_tokens"] == 15000
    assert day2["prev_period_avg"] == 10000.0
    assert day2["growth_rate"] == 50.0  # (15000-10000)/10000 * 100


def test_calculate_trends_week_period(sample_daily_activities):
    """测试 7 天周期趋势"""
    trends = calculate_trends(sample_daily_activities, period_days=7)

    assert len(trends) == 3


def test_calculate_trends_empty():
    """测试空数据趋势计算"""
    trends = calculate_trends([])
    assert len(trends) == 0


# ============================================
# filter_by_date_range 测试
# ============================================
def test_filter_by_date_range_all(sample_daily_activities):
    """测试不过滤"""
    result = filter_by_date_range(sample_daily_activities)
    assert len(result) == 3


def test_filter_by_date_range_start_only(sample_daily_activities):
    """测试只指定开始日期"""
    result = filter_by_date_range(
        sample_daily_activities,
        start_date="2026-01-02"
    )

    assert len(result) == 2
    assert result[0].date == "2026-01-02"
    assert result[1].date == "2026-01-03"


def test_filter_by_date_range_end_only(sample_daily_activities):
    """测试只指定结束日期"""
    result = filter_by_date_range(
        sample_daily_activities,
        end_date="2026-01-02"
    )

    assert len(result) == 2
    assert result[0].date == "2026-01-01"
    assert result[1].date == "2026-01-02"


def test_filter_by_date_range_both(sample_daily_activities):
    """测试指定开始和结束日期"""
    result = filter_by_date_range(
        sample_daily_activities,
        start_date="2026-01-02",
        end_date="2026-01-02"
    )

    assert len(result) == 1
    assert result[0].date == "2026-01-02"


# ============================================
# get_top_models 测试
# ============================================
def test_get_top_models_by_total(sample_model_usages):
    """测试按总 Token 排序"""
    top = get_top_models(sample_model_usages, top_n=2, sort_by="total_tokens")

    assert len(top) == 2
    # Sonnet: 10000 + 5000 + 2000 + 1000 = 18000
    # Haiku: 8000 + 4000 + 1500 + 800 = 14300
    assert top[0][0] == "claude-sonnet-4.5"
    assert top[1][0] == "claude-haiku-4.5"


def test_get_top_models_by_input(sample_model_usages):
    """测试按输入 Token 排序"""
    top = get_top_models(sample_model_usages, top_n=3, sort_by="input_tokens")

    assert len(top) == 3
    assert top[0][0] == "claude-sonnet-4.5"  # 10000
    assert top[1][0] == "claude-haiku-4.5"   # 8000
    assert top[2][0] == "claude-opus-4.5"    # 3000


def test_get_top_models_by_output(sample_model_usages):
    """测试按输出 Token 排序"""
    top = get_top_models(sample_model_usages, top_n=2, sort_by="output_tokens")

    assert len(top) == 2
    assert top[0][0] == "claude-sonnet-4.5"  # 5000
    assert top[1][0] == "claude-haiku-4.5"   # 4000


# ============================================
# calculate_date_range_stats 测试
# ============================================
def test_calculate_date_range_stats_all(sample_daily_activities):
    """测试完整日期范围统计"""
    stats = calculate_date_range_stats(sample_daily_activities)

    assert stats["total_days"] == 3
    assert stats["total_sessions"] == 16  # 5 + 8 + 3
    assert stats["total_tokens"] == 33000  # 10000 + 15000 + 8000
    assert stats["avg_daily_sessions"] == 5.33  # 16/3
    assert stats["avg_daily_tokens"] == 11000.0  # 33000/3
    assert stats["max_daily_tokens"] == 15000
    assert stats["min_daily_tokens"] == 8000


def test_calculate_date_range_stats_filtered(sample_daily_activities):
    """测试过滤后的日期范围统计"""
    stats = calculate_date_range_stats(
        sample_daily_activities,
        start_date="2026-01-02",
        end_date="2026-01-03"
    )

    assert stats["total_days"] == 2
    assert stats["total_sessions"] == 11  # 8 + 3
    assert stats["total_tokens"] == 23000  # 15000 + 8000


def test_calculate_date_range_stats_empty():
    """测试空数据统计"""
    stats = calculate_date_range_stats([])

    assert stats["total_days"] == 0
    assert stats["total_sessions"] == 0
    assert stats["total_tokens"] == 0


# ============================================
# group_by_model 测试
# ============================================
def test_group_by_model(sample_daily_activities):
    """测试按模型分组"""
    grouped = group_by_model(sample_daily_activities)

    assert len(grouped) == 2
    assert "claude-sonnet-4.5" in grouped
    assert "claude-opus-4.5" in grouped

    # Sonnet 出现在 2 天
    assert len(grouped["claude-sonnet-4.5"]) == 2

    # Opus 出现在 1 天
    assert len(grouped["claude-opus-4.5"]) == 1


def test_group_by_model_empty():
    """测试空数据分组"""
    grouped = group_by_model([])
    assert len(grouped) == 0


# ============================================
# calculate_model_daily_average 测试
# ============================================
def test_calculate_model_daily_average(sample_daily_activities):
    """测试模型每日平均使用量"""
    averages = calculate_model_daily_average(sample_daily_activities)

    assert len(averages) == 2

    # Sonnet 平均（2天）
    sonnet_avg = averages["claude-sonnet-4.5"]
    assert sonnet_avg["avg_input_tokens"] == 7500.0  # (6000 + 9000) / 2
    assert sonnet_avg["avg_output_tokens"] == 5000.0  # (4000 + 6000) / 2
    assert sonnet_avg["total_days"] == 2

    # Opus 平均（1天）
    opus_avg = averages["claude-opus-4.5"]
    assert opus_avg["avg_input_tokens"] == 5000.0
    assert opus_avg["avg_output_tokens"] == 3000.0
    assert opus_avg["total_days"] == 1


def test_calculate_model_daily_average_empty():
    """测试空数据平均值"""
    averages = calculate_model_daily_average([])
    assert len(averages) == 0


# ============================================
# fill_missing_dates 测试
# ============================================
def test_fill_missing_dates_complete():
    """测试填充缺失日期（有缺失）"""
    activities = [
        DailyActivity(
            date="2026-01-01",
            session_count=5,
            total_tokens=10000,
            models=[]
        ),
        DailyActivity(
            date="2026-01-03",
            session_count=3,
            total_tokens=8000,
            models=[]
        ),
    ]

    filled = fill_missing_dates(activities, "2026-01-01", "2026-01-03")

    assert len(filled) == 3
    assert filled[0].date == "2026-01-01"
    assert filled[1].date == "2026-01-02"
    assert filled[2].date == "2026-01-03"

    # 缺失的日期应该是空数据
    assert filled[1].session_count == 0
    assert filled[1].total_tokens == 0


def test_fill_missing_dates_no_gaps():
    """测试填充无缺失日期"""
    activities = [
        DailyActivity(
            date="2026-01-01",
            session_count=5,
            total_tokens=10000,
            models=[]
        ),
        DailyActivity(
            date="2026-01-02",
            session_count=8,
            total_tokens=15000,
            models=[]
        ),
    ]

    filled = fill_missing_dates(activities, "2026-01-01", "2026-01-02")

    assert len(filled) == 2
    assert filled[0].date == "2026-01-01"
    assert filled[1].date == "2026-01-02"


def test_fill_missing_dates_all_missing():
    """测试所有日期都缺失"""
    filled = fill_missing_dates([], "2026-01-01", "2026-01-03")

    assert len(filled) == 3
    for activity in filled:
        assert activity.session_count == 0
        assert activity.total_tokens == 0


# ============================================
# 集成测试
# ============================================
def test_full_workflow(sample_daily_activities, sample_model_usages):
    """测试完整工作流程"""
    # 1. 按日期聚合
    daily_stats = aggregate_daily_stats(sample_daily_activities)
    assert len(daily_stats) == 3

    # 2. 按模型聚合
    model_stats = aggregate_model_stats(sample_model_usages)
    assert len(model_stats) == 3

    # 3. 计算趋势
    trends = calculate_trends(sample_daily_activities, period_days=1)
    assert len(trends) == 3

    # 4. 获取 Top 模型
    top_models = get_top_models(sample_model_usages, top_n=2)
    assert len(top_models) == 2

    # 5. 计算日期范围统计
    stats = calculate_date_range_stats(sample_daily_activities)
    assert stats["total_days"] == 3


# ============================================
# 边界条件测试
# ============================================
def test_filter_invalid_date_range(sample_daily_activities):
    """测试无效的日期范围"""
    result = filter_by_date_range(
        sample_daily_activities,
        start_date="2026-01-10",  # 开始日期大于所有数据
        end_date="2026-01-20"
    )

    assert len(result) == 0


def test_calculate_trends_single_day():
    """测试单天数据的趋势计算"""
    activities = [
        DailyActivity(
            date="2026-01-01",
            session_count=5,
            total_tokens=10000,
            models=[]
        ),
    ]

    trends = calculate_trends(activities)

    assert len(trends) == 1
    assert trends["2026-01-01"]["prev_period_avg"] == 0.0


def test_get_top_models_more_than_available(sample_model_usages):
    """测试请求超过可用数量的 Top 模型"""
    top = get_top_models(sample_model_usages, top_n=10)

    # 应该只返回 3 个（实际数量）
    assert len(top) == 3
