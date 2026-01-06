"""
@file: data_processor.py
@description: 数据处理器，聚合和转换统计数据
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 按日聚合统计数据
2. 按模型聚合统计数据
3. 计算趋势数据（环比、同比等）
4. 日期范围筛选
5. 数据排序和分组
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict

from .logger import get_logger
from .schemas import (
    ModelUsage,
    DailyActivity,
    DailyModelTokens,
)


logger = get_logger(__name__)


def aggregate_daily_stats(
    daily_activities: List[DailyActivity],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, DailyActivity]:
    """
    按日聚合统计数据

    将每日活动数据聚合为日期 -> DailyActivity 的映射，支持日期范围过滤

    Args:
        daily_activities: 每日活动数据列表
        start_date: 开始日期 YYYY-MM-DD
        end_date: 结束日期 YYYY-MM-DD

    Returns:
        Dict[str, DailyActivity]: 日期 -> DailyActivity 的映射
    """
    aggregated = {}

    for activity in daily_activities:
        # 日期范围过滤
        if start_date and activity.date < start_date:
            continue
        if end_date and activity.date > end_date:
            continue

        aggregated[activity.date] = activity

    logger.info(f"按日聚合统计数据: {len(aggregated)} 天")
    return aggregated


def aggregate_model_stats(
    model_usages: Dict[str, ModelUsage]
) -> Dict[str, ModelUsage]:
    """
    按模型聚合统计数据

    将模型使用数据按模型名称分组聚合

    Args:
        model_usages: 模型使用数据

    Returns:
        Dict[str, ModelUsage]: 模型名称 -> ModelUsage 的映射
    """
    # 这个函数主要用于数据清洗和去重
    aggregated = {}

    for model_name, usage in model_usages.items():
        if model_name in aggregated:
            # 如果已存在，累加 Token 数
            existing = aggregated[model_name]
            aggregated[model_name] = ModelUsage(
                model_name=model_name,
                input_tokens=existing.input_tokens + usage.input_tokens,
                output_tokens=existing.output_tokens + usage.output_tokens,
                cache_read_tokens=existing.cache_read_tokens + usage.cache_read_tokens,
                cache_creation_tokens=existing.cache_creation_tokens + usage.cache_creation_tokens,
            )
        else:
            aggregated[model_name] = usage

    logger.info(f"按模型聚合统计数据: {len(aggregated)} 个模型")
    return aggregated


def calculate_trends(
    daily_activities: List[DailyActivity],
    period_days: int = 7,
) -> Dict[str, Dict[str, float]]:
    """
    计算趋势数据

    计算指定周期的环比增长率、平均值等趋势指标

    Args:
        daily_activities: 每日活动数据列表
        period_days: 对比周期天数（默认 7 天）

    Returns:
        Dict[str, Dict[str, float]]: 日期 -> 趋势指标的映射
            包含字段：
            - total_tokens: 当日总 Token
            - prev_period_avg: 前一周期平均值
            - growth_rate: 环比增长率（%）
            - session_count: 会话数
    """
    if not daily_activities:
        logger.warning("每日活动数据为空，无法计算趋势")
        return {}

    # 按日期排序
    sorted_activities = sorted(daily_activities, key=lambda x: x.date)

    # 构建日期 -> Activity 的映射
    date_to_activity = {activity.date: activity for activity in sorted_activities}

    trends = {}

    for i, activity in enumerate(sorted_activities):
        current_date = activity.date
        current_tokens = activity.total_tokens

        # 计算前一周期的平均值
        period_start_idx = max(0, i - period_days)
        period_activities = sorted_activities[period_start_idx:i]

        if period_activities:
            prev_period_avg = sum(
                a.total_tokens for a in period_activities
            ) / len(period_activities)
        else:
            prev_period_avg = 0.0

        # 计算环比增长率
        if prev_period_avg > 0:
            growth_rate = ((current_tokens - prev_period_avg) / prev_period_avg) * 100
        else:
            growth_rate = 0.0

        trends[current_date] = {
            "total_tokens": current_tokens,
            "prev_period_avg": round(prev_period_avg, 2),
            "growth_rate": round(growth_rate, 2),
            "session_count": activity.session_count,
        }

    logger.info(f"计算趋势数据: {len(trends)} 天，周期 {period_days} 天")
    return trends


def filter_by_date_range(
    daily_activities: List[DailyActivity],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[DailyActivity]:
    """
    按日期范围筛选每日活动数据

    Args:
        daily_activities: 每日活动数据列表
        start_date: 开始日期 YYYY-MM-DD
        end_date: 结束日期 YYYY-MM-DD

    Returns:
        List[DailyActivity]: 筛选后的每日活动数据列表
    """
    filtered = []

    for activity in daily_activities:
        # 日期范围过滤
        if start_date and activity.date < start_date:
            continue
        if end_date and activity.date > end_date:
            continue

        filtered.append(activity)

    logger.info(
        f"按日期范围筛选: {start_date or '开始'} ~ {end_date or '结束'}，"
        f"共 {len(filtered)} 条记录"
    )
    return filtered


def get_top_models(
    model_usages: Dict[str, ModelUsage],
    top_n: int = 5,
    sort_by: str = "total_tokens",
) -> List[Tuple[str, ModelUsage]]:
    """
    获取使用量最高的 N 个模型

    Args:
        model_usages: 模型使用数据
        top_n: 返回前 N 个模型
        sort_by: 排序字段（total_tokens, input_tokens, output_tokens）

    Returns:
        List[Tuple[str, ModelUsage]]: (模型名称, ModelUsage) 的列表
    """
    # 定义排序键函数
    def get_sort_key(item: Tuple[str, ModelUsage]) -> int:
        _, usage = item
        if sort_by == "input_tokens":
            return usage.input_tokens
        elif sort_by == "output_tokens":
            return usage.output_tokens
        else:  # total_tokens
            return usage.total_with_cache

    # 排序并取前 N 个
    sorted_models = sorted(
        model_usages.items(),
        key=get_sort_key,
        reverse=True
    )[:top_n]

    logger.info(f"获取 Top {top_n} 模型（按 {sort_by} 排序）")
    return sorted_models


def calculate_date_range_stats(
    daily_activities: List[DailyActivity],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, any]:
    """
    计算指定日期范围的统计摘要

    Args:
        daily_activities: 每日活动数据列表
        start_date: 开始日期 YYYY-MM-DD
        end_date: 结束日期 YYYY-MM-DD

    Returns:
        Dict[str, any]: 统计摘要，包含：
            - total_days: 总天数
            - total_sessions: 总会话数
            - total_tokens: 总 Token 数
            - avg_daily_sessions: 平均每日会话数
            - avg_daily_tokens: 平均每日 Token 数
            - max_daily_tokens: 单日最大 Token 数
            - min_daily_tokens: 单日最小 Token 数
    """
    # 筛选日期范围
    filtered = filter_by_date_range(daily_activities, start_date, end_date)

    if not filtered:
        logger.warning("筛选后的每日活动数据为空")
        return {
            "total_days": 0,
            "total_sessions": 0,
            "total_tokens": 0,
            "avg_daily_sessions": 0.0,
            "avg_daily_tokens": 0.0,
            "max_daily_tokens": 0,
            "min_daily_tokens": 0,
        }

    # 计算统计指标
    total_days = len(filtered)
    total_sessions = sum(a.session_count for a in filtered)
    total_tokens = sum(a.total_tokens for a in filtered)

    avg_daily_sessions = total_sessions / total_days if total_days > 0 else 0.0
    avg_daily_tokens = total_tokens / total_days if total_days > 0 else 0.0

    max_daily_tokens = max(a.total_tokens for a in filtered)
    min_daily_tokens = min(a.total_tokens for a in filtered)

    summary = {
        "total_days": total_days,
        "total_sessions": total_sessions,
        "total_tokens": total_tokens,
        "avg_daily_sessions": round(avg_daily_sessions, 2),
        "avg_daily_tokens": round(avg_daily_tokens, 2),
        "max_daily_tokens": max_daily_tokens,
        "min_daily_tokens": min_daily_tokens,
        "start_date": start_date or filtered[0].date,
        "end_date": end_date or filtered[-1].date,
    }

    logger.info(
        f"计算日期范围统计: {summary['start_date']} ~ {summary['end_date']}, "
        f"{summary['total_days']} 天"
    )
    return summary


def group_by_model(
    daily_activities: List[DailyActivity]
) -> Dict[str, List[DailyModelTokens]]:
    """
    按模型分组每日 Token 使用数据

    Args:
        daily_activities: 每日活动数据列表

    Returns:
        Dict[str, List[DailyModelTokens]]: 模型名称 -> 每日 Token 列表
    """
    grouped = defaultdict(list)

    for activity in daily_activities:
        for model_tokens in activity.models:
            grouped[model_tokens.model_name].append(model_tokens)

    logger.info(f"按模型分组每日数据: {len(grouped)} 个模型")
    return dict(grouped)


def calculate_model_daily_average(
    daily_activities: List[DailyActivity]
) -> Dict[str, Dict[str, float]]:
    """
    计算各模型的每日平均使用量

    Args:
        daily_activities: 每日活动数据列表

    Returns:
        Dict[str, Dict[str, float]]: 模型名称 -> 平均使用量
            包含字段：
            - avg_input_tokens: 平均输入 Token
            - avg_output_tokens: 平均输出 Token
            - avg_cache_read_tokens: 平均缓存读取 Token
            - avg_cache_creation_tokens: 平均缓存创建 Token
            - total_days: 使用天数
    """
    # 按模型分组
    grouped = group_by_model(daily_activities)

    averages = {}

    for model_name, tokens_list in grouped.items():
        total_days = len(tokens_list)

        if total_days == 0:
            continue

        total_input = sum(t.input_tokens for t in tokens_list)
        total_output = sum(t.output_tokens for t in tokens_list)
        total_cache_read = sum(t.cache_read_tokens for t in tokens_list)
        total_cache_creation = sum(t.cache_creation_tokens for t in tokens_list)

        averages[model_name] = {
            "avg_input_tokens": round(total_input / total_days, 2),
            "avg_output_tokens": round(total_output / total_days, 2),
            "avg_cache_read_tokens": round(total_cache_read / total_days, 2),
            "avg_cache_creation_tokens": round(total_cache_creation / total_days, 2),
            "total_days": total_days,
        }

    logger.info(f"计算模型每日平均使用量: {len(averages)} 个模型")
    return averages


def fill_missing_dates(
    daily_activities: List[DailyActivity],
    start_date: str,
    end_date: str,
) -> List[DailyActivity]:
    """
    填充缺失的日期数据

    在指定日期范围内，为没有数据的日期创建空记录

    Args:
        daily_activities: 每日活动数据列表
        start_date: 开始日期 YYYY-MM-DD
        end_date: 结束日期 YYYY-MM-DD

    Returns:
        List[DailyActivity]: 填充后的每日活动数据列表
    """
    # 构建日期 -> Activity 的映射
    date_to_activity = {activity.date: activity for activity in daily_activities}

    # 生成日期范围
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d")

    filled_activities = []
    current_dt = start_dt

    while current_dt <= end_dt:
        date_str = current_dt.strftime("%Y-%m-%d")

        if date_str in date_to_activity:
            # 使用已有数据
            filled_activities.append(date_to_activity[date_str])
        else:
            # 创建空记录
            filled_activities.append(DailyActivity(
                date=date_str,
                session_count=0,
                total_tokens=0,
                models=[],
            ))

        current_dt += timedelta(days=1)

    logger.info(
        f"填充缺失日期: {start_date} ~ {end_date}, "
        f"原 {len(daily_activities)} 条 -> 填充后 {len(filled_activities)} 条"
    )
    return filled_activities
