"""
@file: test_pricing.py
@description: 测试定价计算模块
@author: Atlas.oi
@date: 2026-01-07
"""

import pytest
from app.core.pricing import (
    ModelPricing,
    PRICING_CONFIG,
    normalize_model_name,
    get_model_pricing,
    calculate_cost,
    calculate_model_usage_cost,
    calculate_total_cost,
    calculate_daily_cost,
    get_cost_summary,
)
from app.core.schemas import ModelUsage, DailyActivity, DailyModelTokens


# ============================================
# ModelPricing 测试
# ============================================
def test_model_pricing_init():
    """测试 ModelPricing 初始化"""
    pricing = ModelPricing(
        model_name="test-model",
        input_price=1.0,
        output_price=2.0,
        cache_read_price=0.1,
        cache_write_price=0.2,
    )

    assert pricing.model_name == "test-model"
    assert pricing.input_price == 1.0
    assert pricing.output_price == 2.0
    assert pricing.cache_read_price == 0.1
    assert pricing.cache_write_price == 0.2


def test_model_pricing_negative_price():
    """测试 ModelPricing 负价格验证"""
    with pytest.raises(ValueError, match="输入 Token 价格不能为负数"):
        ModelPricing(
            model_name="test",
            input_price=-1.0,
            output_price=1.0,
            cache_read_price=0.1,
            cache_write_price=0.1,
        )


# ============================================
# 定价配置测试
# ============================================
def test_pricing_config_exists():
    """测试定价配置是否存在"""
    assert len(PRICING_CONFIG) > 0
    assert "claude-opus-4.5" in PRICING_CONFIG
    assert "claude-sonnet-4.5" in PRICING_CONFIG
    assert "claude-haiku-4.5" in PRICING_CONFIG


def test_pricing_config_values():
    """测试定价配置值是否正确"""
    # Opus 4.5
    opus = PRICING_CONFIG["claude-opus-4.5"]
    assert opus.input_price == 15.0
    assert opus.output_price == 75.0
    assert opus.cache_read_price == 1.5
    assert opus.cache_write_price == 18.75

    # Sonnet 4.5
    sonnet = PRICING_CONFIG["claude-sonnet-4.5"]
    assert sonnet.input_price == 3.0
    assert sonnet.output_price == 15.0
    assert sonnet.cache_read_price == 0.3
    assert sonnet.cache_write_price == 3.75

    # Haiku 4.5
    haiku = PRICING_CONFIG["claude-haiku-4.5"]
    assert haiku.input_price == 0.8
    assert haiku.output_price == 4.0
    assert haiku.cache_read_price == 0.08
    assert haiku.cache_write_price == 1.0


# ============================================
# normalize_model_name 测试
# ============================================
def test_normalize_model_name_basic():
    """测试基本的模型名称标准化"""
    assert normalize_model_name("Claude-Opus-4.5") == "claude-opus-4-5"
    assert normalize_model_name("claude-sonnet-4.5") == "claude-sonnet-4-5"
    assert normalize_model_name("CLAUDE-HAIKU-4.5") == "claude-haiku-4-5"


def test_normalize_model_name_with_spaces():
    """测试包含空格的模型名称"""
    assert normalize_model_name("Claude Opus 4.5") == "claude-opus-4-5"
    assert normalize_model_name("Claude Sonnet 4 5") == "claude-sonnet-4-5"


def test_normalize_model_name_with_version():
    """测试包含完整版本号的模型名称"""
    assert normalize_model_name("claude-opus-4-5-20251101") == "claude-opus-4-5-20251101"
    assert normalize_model_name("claude-sonnet-4-5-20250929") == "claude-sonnet-4-5-20250929"


def test_normalize_model_name_old_version():
    """测试旧版本模型名称映射"""
    assert normalize_model_name("claude-3-5-sonnet-20241022") == "claude-sonnet-4.5"
    assert normalize_model_name("claude-3.5-opus") == "claude-opus-4.5"
    assert normalize_model_name("claude-3.5-haiku") == "claude-haiku-4.5"


# ============================================
# get_model_pricing 测试
# ============================================
def test_get_model_pricing_exact_match():
    """测试精确匹配模型定价"""
    pricing = get_model_pricing("claude-opus-4.5")
    assert pricing is not None
    assert pricing.model_name == "claude-opus-4.5"


def test_get_model_pricing_fuzzy_match():
    """测试模糊匹配模型定价"""
    pricing = get_model_pricing("claude-opus-4-5-20251101")
    assert pricing is not None
    assert "opus" in pricing.model_name.lower()


def test_get_model_pricing_not_found():
    """测试找不到模型定价"""
    pricing = get_model_pricing("unknown-model")
    assert pricing is None


# ============================================
# calculate_cost 测试
# ============================================
def test_calculate_cost_basic():
    """测试基本成本计算"""
    cost = calculate_cost(
        input_tokens=1_000_000,
        output_tokens=500_000,
        cache_read_tokens=0,
        cache_creation_tokens=0,
        model_name="claude-sonnet-4.5"
    )

    # 输入: 1M * $3 = $3
    # 输出: 0.5M * $15 = $7.5
    # 总计: $10.5
    assert abs(cost - 10.5) < 0.0001


def test_calculate_cost_with_cache():
    """测试包含缓存的成本计算"""
    cost = calculate_cost(
        input_tokens=1_000_000,
        output_tokens=500_000,
        cache_read_tokens=1_000_000,
        cache_creation_tokens=500_000,
        model_name="claude-sonnet-4.5"
    )

    # 输入: 1M * $3 = $3
    # 输出: 0.5M * $15 = $7.5
    # 缓存读: 1M * $0.3 = $0.3
    # 缓存写: 0.5M * $3.75 = $1.875
    # 总计: $12.675
    assert abs(cost - 12.675) < 0.0001


def test_calculate_cost_zero_tokens():
    """测试零 Token 成本计算"""
    cost = calculate_cost(
        input_tokens=0,
        output_tokens=0,
        model_name="claude-sonnet-4.5"
    )

    assert cost == 0.0


def test_calculate_cost_opus_model():
    """测试 Opus 模型成本计算"""
    cost = calculate_cost(
        input_tokens=1_000_000,
        output_tokens=500_000,
        model_name="claude-opus-4.5"
    )

    # 输入: 1M * $15 = $15
    # 输出: 0.5M * $75 = $37.5
    # 总计: $52.5
    assert abs(cost - 52.5) < 0.0001


def test_calculate_cost_haiku_model():
    """测试 Haiku 模型成本计算"""
    cost = calculate_cost(
        input_tokens=1_000_000,
        output_tokens=500_000,
        model_name="claude-haiku-4.5"
    )

    # 输入: 1M * $0.8 = $0.8
    # 输出: 0.5M * $4 = $2.0
    # 总计: $2.8
    assert abs(cost - 2.8) < 0.0001


def test_calculate_cost_unknown_model():
    """测试未知模型成本计算"""
    cost = calculate_cost(
        input_tokens=1_000_000,
        output_tokens=500_000,
        model_name="unknown-model"
    )

    # 未知模型返回 0
    assert cost == 0.0


# ============================================
# calculate_model_usage_cost 测试
# ============================================
def test_calculate_model_usage_cost():
    """测试 ModelUsage 对象成本计算"""
    usage = ModelUsage(
        model_name="claude-sonnet-4.5",
        input_tokens=1_000_000,
        output_tokens=500_000,
        cache_read_tokens=200_000,
        cache_creation_tokens=100_000,
    )

    cost = calculate_model_usage_cost(usage)

    # 输入: 1M * $3 = $3
    # 输出: 0.5M * $15 = $7.5
    # 缓存读: 0.2M * $0.3 = $0.06
    # 缓存写: 0.1M * $3.75 = $0.375
    # 总计: $10.935
    assert abs(cost - 10.935) < 0.0001


# ============================================
# calculate_total_cost 测试
# ============================================
def test_calculate_total_cost():
    """测试多模型总成本计算"""
    model_usages = {
        "claude-sonnet-4.5": ModelUsage(
            model_name="claude-sonnet-4.5",
            input_tokens=1_000_000,
            output_tokens=500_000,
        ),
        "claude-opus-4.5": ModelUsage(
            model_name="claude-opus-4.5",
            input_tokens=500_000,
            output_tokens=250_000,
        ),
    }

    costs = calculate_total_cost(model_usages)

    assert len(costs) == 2
    assert abs(costs["claude-sonnet-4.5"] - 10.5) < 0.0001  # $3 + $7.5
    assert abs(costs["claude-opus-4.5"] - 26.25) < 0.0001  # $7.5 + $18.75


def test_calculate_total_cost_empty():
    """测试空模型列表总成本"""
    costs = calculate_total_cost({})
    assert len(costs) == 0


# ============================================
# calculate_daily_cost 测试
# ============================================
def test_calculate_daily_cost():
    """测试每日成本计算"""
    daily_activities = [
        DailyActivity(
            date="2026-01-01",
            session_count=5,
            total_tokens=1_500_000,
            models=[
                DailyModelTokens(
                    date="2026-01-01",
                    model_name="claude-sonnet-4.5",
                    input_tokens=1_000_000,
                    output_tokens=500_000,
                )
            ]
        ),
        DailyActivity(
            date="2026-01-02",
            session_count=3,
            total_tokens=750_000,
            models=[
                DailyModelTokens(
                    date="2026-01-02",
                    model_name="claude-haiku-4.5",
                    input_tokens=500_000,
                    output_tokens=250_000,
                )
            ]
        ),
    ]

    costs = calculate_daily_cost(daily_activities)

    assert len(costs) == 2
    assert abs(costs["2026-01-01"] - 10.5) < 0.0001
    assert abs(costs["2026-01-02"] - 1.4) < 0.0001  # $0.4 + $1.0


def test_calculate_daily_cost_date_filter():
    """测试按日期范围过滤每日成本"""
    daily_activities = [
        DailyActivity(
            date="2026-01-01",
            session_count=5,
            total_tokens=1_500_000,
            models=[]
        ),
        DailyActivity(
            date="2026-01-02",
            session_count=3,
            total_tokens=750_000,
            models=[]
        ),
    ]

    costs = calculate_daily_cost(
        daily_activities,
        start_date="2026-01-02",
        end_date="2026-01-02"
    )

    assert len(costs) == 1
    assert "2026-01-02" in costs


# ============================================
# get_cost_summary 测试
# ============================================
def test_get_cost_summary():
    """测试成本摘要生成"""
    model_usages = {
        "claude-sonnet-4.5": ModelUsage(
            model_name="claude-sonnet-4.5",
            input_tokens=1_000_000,
            output_tokens=500_000,
        ),
        "claude-opus-4.5": ModelUsage(
            model_name="claude-opus-4.5",
            input_tokens=500_000,
            output_tokens=250_000,
        ),
    }

    summary = get_cost_summary(model_usages)

    assert "total_cost_usd" in summary
    assert "total_tokens" in summary
    assert "avg_cost_per_million_tokens" in summary
    assert "model_costs" in summary
    assert "model_percentages" in summary

    # 总成本
    total_cost = summary["total_cost_usd"]
    assert abs(total_cost - 36.75) < 0.01  # $10.5 + $26.25

    # 总 Token
    assert summary["total_tokens"] == 2_250_000

    # 模型占比
    percentages = summary["model_percentages"]
    assert abs(percentages["claude-sonnet-4.5"] - 28.57) < 0.1  # 10.5/36.75
    assert abs(percentages["claude-opus-4.5"] - 71.43) < 0.1  # 26.25/36.75


def test_get_cost_summary_empty():
    """测试空模型成本摘要"""
    summary = get_cost_summary({})

    assert summary["total_cost_usd"] == 0
    assert summary["total_tokens"] == 0
    assert summary["avg_cost_per_million_tokens"] == 0


# ============================================
# 边界条件测试
# ============================================
def test_calculate_cost_large_numbers():
    """测试大数值成本计算"""
    cost = calculate_cost(
        input_tokens=1_000_000_000,  # 1B tokens
        output_tokens=500_000_000,
        model_name="claude-sonnet-4.5"
    )

    # 输入: 1000M * $3 = $3000
    # 输出: 500M * $15 = $7500
    # 总计: $10500
    assert abs(cost - 10500.0) < 0.01


def test_calculate_cost_precision():
    """测试成本计算精度"""
    cost = calculate_cost(
        input_tokens=1,
        output_tokens=1,
        model_name="claude-sonnet-4.5"
    )

    # 输入: 0.000001M * $3 = $0.000003
    # 输出: 0.000001M * $15 = $0.000015
    # 总计: $0.000018
    assert cost > 0
    assert cost < 0.001


# ============================================
# 实际使用场景测试
# ============================================
def test_real_world_scenario():
    """测试实际使用场景"""
    # 模拟一天的使用情况
    daily_usage = {
        "claude-sonnet-4-5-20250929": ModelUsage(
            model_name="claude-sonnet-4-5-20250929",
            input_tokens=10_000,
            output_tokens=5_000,
            cache_read_tokens=2_000,
            cache_creation_tokens=1_000,
        ),
        "claude-opus-4-5-20251101": ModelUsage(
            model_name="claude-opus-4-5-20251101",
            input_tokens=3_000,
            output_tokens=2_000,
            cache_read_tokens=500,
            cache_creation_tokens=300,
        ),
    }

    costs = calculate_total_cost(daily_usage)
    total = sum(costs.values())

    # Sonnet: (10000*3 + 5000*15 + 2000*0.3 + 1000*3.75) / 1000000 = 0.108
    # Opus: (3000*15 + 2000*75 + 500*1.5 + 300*18.75) / 1000000 = 0.201
    # 总计: 0.309
    assert abs(total - 0.309) < 0.001
