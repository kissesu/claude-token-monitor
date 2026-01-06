"""
@file: pricing.py
@description: 定价计算模块，根据 Claude API 定价计算 Token 使用成本
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 定义各模型的定价配置（2025 年 1 月定价）
2. 计算 Token 使用成本
3. 支持模型名称标准化
4. 支持多模型聚合计算
5. 支持时间范围筛选
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime

from .logger import get_logger
from .schemas import ModelUsage, DailyActivity


logger = get_logger(__name__)


@dataclass
class ModelPricing:
    """
    模型定价数据类

    记录单个模型的各类 Token 价格（美元/百万 Token）
    """

    model_name: str
    input_price: float  # 输入 Token 价格（$/M）
    output_price: float  # 输出 Token 价格（$/M）
    cache_read_price: float  # 缓存读取价格（$/M）
    cache_write_price: float  # 缓存写入价格（$/M）

    def __post_init__(self):
        """
        验证价格参数是否合法
        """
        if self.input_price < 0:
            raise ValueError(f"输入 Token 价格不能为负数: {self.input_price}")
        if self.output_price < 0:
            raise ValueError(f"输出 Token 价格不能为负数: {self.output_price}")
        if self.cache_read_price < 0:
            raise ValueError(f"缓存读取价格不能为负数: {self.cache_read_price}")
        if self.cache_write_price < 0:
            raise ValueError(f"缓存写入价格不能为负数: {self.cache_write_price}")


# ============================================
# 定价配置（2025 年 1 月定价）
# 价格单位：美元/百万 Token
# ============================================
PRICING_CONFIG: Dict[str, ModelPricing] = {
    # Claude Opus 4.5 (最强模型)
    "claude-opus-4.5": ModelPricing(
        model_name="claude-opus-4.5",
        input_price=15.0,
        output_price=75.0,
        cache_read_price=1.5,
        cache_write_price=18.75,
    ),
    # Claude Opus 4.5 (完整版本号)
    "claude-opus-4-5-20251101": ModelPricing(
        model_name="claude-opus-4-5-20251101",
        input_price=15.0,
        output_price=75.0,
        cache_read_price=1.5,
        cache_write_price=18.75,
    ),
    # Claude Opus 4.5 Thinking (思考模式)
    "claude-opus-4-5-thinking": ModelPricing(
        model_name="claude-opus-4-5-thinking",
        input_price=15.0,
        output_price=75.0,
        cache_read_price=1.5,
        cache_write_price=18.75,
    ),
    # Claude Sonnet 4.5 (平衡模型)
    "claude-sonnet-4.5": ModelPricing(
        model_name="claude-sonnet-4.5",
        input_price=3.0,
        output_price=15.0,
        cache_read_price=0.3,
        cache_write_price=3.75,
    ),
    # Claude Sonnet 4.5 (完整版本号)
    "claude-sonnet-4-5-20250929": ModelPricing(
        model_name="claude-sonnet-4-5-20250929",
        input_price=3.0,
        output_price=15.0,
        cache_read_price=0.3,
        cache_write_price=3.75,
    ),
    # Claude Haiku 4.5 (最快模型)
    "claude-haiku-4.5": ModelPricing(
        model_name="claude-haiku-4.5",
        input_price=0.8,
        output_price=4.0,
        cache_read_price=0.08,
        cache_write_price=1.0,
    ),
    # Claude Haiku 4.5 (完整版本号)
    "claude-haiku-4-5-20251001": ModelPricing(
        model_name="claude-haiku-4-5-20251001",
        input_price=0.8,
        output_price=4.0,
        cache_read_price=0.08,
        cache_write_price=1.0,
    ),
}


def normalize_model_name(model_name: str) -> str:
    """
    标准化模型名称

    将各种格式的模型名称转换为标准格式，便于匹配定价配置

    Args:
        model_name: 原始模型名称

    Returns:
        str: 标准化后的模型名称

    Examples:
        >>> normalize_model_name("claude-3-5-sonnet-20241022")
        "claude-sonnet-4-5-20250929"
        >>> normalize_model_name("Claude Opus 4.5")
        "claude-opus-4.5"
    """
    # 转换为小写
    normalized = model_name.lower().strip()

    # 移除空格和特殊字符
    normalized = normalized.replace(" ", "-")
    normalized = normalized.replace("_", "-")

    # 处理版本号格式
    # claude-3-5-sonnet-20241022 -> claude-sonnet-4-5-20250929
    if "3-5" in normalized or "3.5" in normalized:
        # 旧版本名称，尝试映射到新版本
        if "opus" in normalized:
            return "claude-opus-4.5"
        elif "sonnet" in normalized:
            return "claude-sonnet-4.5"
        elif "haiku" in normalized:
            return "claude-haiku-4.5"

    # 处理简化版本名称
    # claude-opus-4.5 -> claude-opus-4-5
    normalized = normalized.replace(".", "-")

    logger.debug(f"标准化模型名称: {model_name} -> {normalized}")
    return normalized


def get_model_pricing(model_name: str) -> Optional[ModelPricing]:
    """
    获取模型定价配置

    Args:
        model_name: 模型名称

    Returns:
        Optional[ModelPricing]: 模型定价对象，未找到返回 None
    """
    normalized = normalize_model_name(model_name)

    # 直接查找
    if normalized in PRICING_CONFIG:
        return PRICING_CONFIG[normalized]

    # 模糊匹配（包含关系）
    for key, pricing in PRICING_CONFIG.items():
        if normalized in key or key in normalized:
            logger.debug(f"模糊匹配模型定价: {model_name} -> {key}")
            return pricing

    logger.warning(f"未找到模型 {model_name} 的定价配置")
    return None


def calculate_cost(
    input_tokens: int = 0,
    output_tokens: int = 0,
    cache_read_tokens: int = 0,
    cache_creation_tokens: int = 0,
    model_name: str = "claude-sonnet-4.5",
) -> float:
    """
    计算 Token 使用成本

    根据模型定价和 Token 使用量计算总成本（美元）

    Args:
        input_tokens: 输入 Token 数量
        output_tokens: 输出 Token 数量
        cache_read_tokens: 缓存读取 Token 数量
        cache_creation_tokens: 缓存创建 Token 数量
        model_name: 模型名称

    Returns:
        float: 总成本（美元）

    Examples:
        >>> calculate_cost(
        ...     input_tokens=1000,
        ...     output_tokens=500,
        ...     model_name="claude-sonnet-4.5"
        ... )
        0.0105
    """
    # 获取定价配置
    pricing = get_model_pricing(model_name)
    if pricing is None:
        logger.error(f"无法计算成本：模型 {model_name} 无定价配置")
        return 0.0

    # 计算各类 Token 成本
    # 价格单位是 $/M（百万 Token），所以需要除以 1,000,000
    input_cost = (input_tokens / 1_000_000) * pricing.input_price
    output_cost = (output_tokens / 1_000_000) * pricing.output_price
    cache_read_cost = (cache_read_tokens / 1_000_000) * pricing.cache_read_price
    cache_write_cost = (cache_creation_tokens / 1_000_000) * pricing.cache_write_price

    # 总成本
    total_cost = input_cost + output_cost + cache_read_cost + cache_write_cost

    logger.debug(
        f"计算成本: {model_name} | "
        f"输入={input_cost:.6f} 输出={output_cost:.6f} "
        f"缓存读={cache_read_cost:.6f} 缓存写={cache_write_cost:.6f} "
        f"总计={total_cost:.6f}"
    )

    return total_cost


def calculate_model_usage_cost(usage: ModelUsage) -> float:
    """
    计算模型使用对象的成本

    Args:
        usage: ModelUsage 对象

    Returns:
        float: 总成本（美元）
    """
    return calculate_cost(
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cache_read_tokens=usage.cache_read_tokens,
        cache_creation_tokens=usage.cache_creation_tokens,
        model_name=usage.model_name,
    )


def calculate_total_cost(
    model_usages: Dict[str, ModelUsage]
) -> Dict[str, float]:
    """
    计算多个模型的总成本

    Args:
        model_usages: 模型名称 -> ModelUsage 的映射

    Returns:
        Dict[str, float]: 模型名称 -> 成本（美元）的映射
    """
    costs = {}

    for model_name, usage in model_usages.items():
        cost = calculate_model_usage_cost(usage)
        costs[model_name] = cost

    logger.info(f"计算总成本: {sum(costs.values()):.6f} USD，涉及 {len(costs)} 个模型")
    return costs


def calculate_daily_cost(
    daily_activities: List[DailyActivity],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, float]:
    """
    计算每日成本

    Args:
        daily_activities: 每日活动数据列表
        start_date: 开始日期 YYYY-MM-DD
        end_date: 结束日期 YYYY-MM-DD

    Returns:
        Dict[str, float]: 日期 -> 成本（美元）的映射
    """
    daily_costs = {}

    for activity in daily_activities:
        # 日期范围过滤
        if start_date and activity.date < start_date:
            continue
        if end_date and activity.date > end_date:
            continue

        # 计算该日的成本
        day_cost = 0.0
        for model_tokens in activity.models:
            cost = calculate_cost(
                input_tokens=model_tokens.input_tokens,
                output_tokens=model_tokens.output_tokens,
                cache_read_tokens=model_tokens.cache_read_tokens,
                cache_creation_tokens=model_tokens.cache_creation_tokens,
                model_name=model_tokens.model_name,
            )
            day_cost += cost

        daily_costs[activity.date] = day_cost

    logger.info(
        f"计算每日成本: {len(daily_costs)} 天，"
        f"总计 {sum(daily_costs.values()):.6f} USD"
    )
    return daily_costs


def get_cost_summary(
    model_usages: Dict[str, ModelUsage]
) -> Dict[str, any]:
    """
    获取成本摘要

    Args:
        model_usages: 模型使用数据

    Returns:
        Dict[str, any]: 成本摘要，包含总成本、各模型成本等
    """
    # 计算各模型成本
    model_costs = calculate_total_cost(model_usages)

    # 总成本
    total_cost = sum(model_costs.values())

    # 总 Token 数
    total_tokens = sum(usage.total_with_cache for usage in model_usages.values())

    # 平均成本（每百万 Token）
    avg_cost_per_million = (total_cost / total_tokens * 1_000_000) if total_tokens > 0 else 0

    summary = {
        "total_cost_usd": round(total_cost, 6),
        "total_tokens": total_tokens,
        "avg_cost_per_million_tokens": round(avg_cost_per_million, 6),
        "model_costs": {
            model: round(cost, 6) for model, cost in model_costs.items()
        },
        "model_percentages": {
            model: round((cost / total_cost * 100), 2) if total_cost > 0 else 0
            for model, cost in model_costs.items()
        },
    }

    logger.info(f"生成成本摘要: 总成本 {summary['total_cost_usd']} USD")
    return summary
