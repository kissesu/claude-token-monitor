"""
@file: stats_reader.py
@description: 统计数据读取器，从 Claude CLI 本地目录读取和解析统计数据
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 读取 ~/.claude/stats-cache.json 缓存统计数据
2. 解析 ~/.claude/history.jsonl 对话日志文件
3. 获取模型使用统计和每日活动数据
4. 计算缓存命中率
5. 支持增量解析 JSONL
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio

from .config import get_settings
from .logger import get_logger
from .schemas import (
    StatsCache,
    ModelUsage,
    DailyActivity,
    DailyModelTokens,
    SessionInfo,
)


logger = get_logger(__name__)


class StatsReader:
    """
    统计数据读取器

    从 Claude CLI 本地目录读取统计数据，包括缓存文件和 JSONL 日志
    """

    def __init__(self, claude_dir: Optional[Path] = None):
        """
        初始化统计数据读取器

        Args:
            claude_dir: Claude CLI 目录路径，为 None 时从配置读取
        """
        if claude_dir is None:
            settings = get_settings()
            claude_dir = settings.get_claude_dir_path()

        self.claude_dir = claude_dir
        self.stats_cache_file = claude_dir / "stats-cache.json"
        self.history_file = claude_dir / "history.jsonl"

        logger.info(f"初始化统计数据读取器: {self.claude_dir}")

    async def read_stats_cache(self) -> Optional[Dict[str, Any]]:
        """
        读取统计缓存文件

        读取 ~/.claude/stats-cache.json 文件并解析为字典

        Returns:
            Optional[Dict[str, Any]]: 统计缓存数据字典，读取失败返回 None
        """
        try:
            if not self.stats_cache_file.exists():
                logger.warning(f"统计缓存文件不存在: {self.stats_cache_file}")
                return None

            # 异步读取文件内容
            loop = asyncio.get_event_loop()
            content = await loop.run_in_executor(
                None,
                self.stats_cache_file.read_text,
                "utf-8"
            )

            # 解析 JSON
            data = json.loads(content)
            logger.info(f"成功读取统计缓存文件，版本: {data.get('version', 'unknown')}")

            return data

        except json.JSONDecodeError as e:
            logger.error(f"统计缓存文件 JSON 解析失败: {e}")
            return None

        except Exception as e:
            logger.error(f"读取统计缓存文件失败: {e}")
            return None

    async def parse_jsonl_files(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        解析 JSONL 格式的对话日志文件

        支持增量解析，按日期范围过滤，限制返回条数

        Args:
            start_date: 开始日期 YYYY-MM-DD，为 None 时不限制
            end_date: 结束日期 YYYY-MM-DD，为 None 时不限制
            limit: 最大返回条数，为 None 时返回所有

        Returns:
            List[Dict[str, Any]]: 解析后的 JSON 对象列表
        """
        try:
            if not self.history_file.exists():
                logger.warning(f"历史记录文件不存在: {self.history_file}")
                return []

            # 转换日期过滤条件
            start_timestamp = None
            end_timestamp = None

            if start_date:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                start_timestamp = int(start_dt.timestamp() * 1000)

            if end_date:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                end_timestamp = int(end_dt.timestamp() * 1000)

            # 异步读取文件内容
            loop = asyncio.get_event_loop()
            content = await loop.run_in_executor(
                None,
                self.history_file.read_text,
                "utf-8"
            )

            # 解析 JSONL
            results = []
            for line_no, line in enumerate(content.strip().split('\n'), 1):
                if not line.strip():
                    continue

                try:
                    obj = json.loads(line)

                    # 日期范围过滤
                    if start_timestamp or end_timestamp:
                        timestamp = obj.get("timestamp", 0)

                        if start_timestamp and timestamp < start_timestamp:
                            continue

                        if end_timestamp and timestamp >= end_timestamp:
                            continue

                    results.append(obj)

                    # 限制条数
                    if limit and len(results) >= limit:
                        break

                except json.JSONDecodeError as e:
                    logger.warning(f"JSONL 第 {line_no} 行解析失败: {e}")
                    continue

            logger.info(f"成功解析 JSONL 文件，共 {len(results)} 条记录")
            return results

        except Exception as e:
            logger.error(f"解析 JSONL 文件失败: {e}")
            return []

    async def get_model_usage(self) -> Dict[str, ModelUsage]:
        """
        获取模型使用统计

        从统计缓存中提取各模型的 Token 使用情况

        Returns:
            Dict[str, ModelUsage]: 模型名称 -> ModelUsage 的映射
        """
        cache = await self.read_stats_cache()
        if not cache:
            logger.warning("无法读取统计缓存，返回空模型使用数据")
            return {}

        model_usage = cache.get("modelUsage", {})
        results = {}

        for model_name, usage_data in model_usage.items():
            try:
                # 将 camelCase 字段名转换为 snake_case
                results[model_name] = ModelUsage(
                    model_name=model_name,
                    input_tokens=usage_data.get("inputTokens", 0),
                    output_tokens=usage_data.get("outputTokens", 0),
                    cache_read_tokens=usage_data.get("cacheReadInputTokens", 0),
                    cache_creation_tokens=usage_data.get("cacheCreationInputTokens", 0),
                )
            except Exception as e:
                logger.error(f"解析模型 {model_name} 使用数据失败: {e}")
                continue

        logger.info(f"获取模型使用统计，共 {len(results)} 个模型")
        return results

    async def get_daily_activity(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[DailyActivity]:
        """
        获取每日活动统计

        从统计缓存中提取每日活动数据，支持日期范围过滤

        Args:
            start_date: 开始日期 YYYY-MM-DD
            end_date: 结束日期 YYYY-MM-DD

        Returns:
            List[DailyActivity]: 每日活动数据列表
        """
        cache = await self.read_stats_cache()
        if not cache:
            logger.warning("无法读取统计缓存，返回空每日活动数据")
            return []

        # 读取每日活动和每日模型 Token 数据
        daily_activities = cache.get("dailyActivity", [])
        daily_model_tokens = cache.get("dailyModelTokens", [])

        # 构建日期 -> 模型 Token 的映射
        date_to_tokens: Dict[str, Dict[str, int]] = {}
        for item in daily_model_tokens:
            date = item.get("date")
            tokens_by_model = item.get("tokensByModel", {})
            date_to_tokens[date] = tokens_by_model

        results = []

        for activity in daily_activities:
            date = activity.get("date")

            # 日期范围过滤
            if start_date and date < start_date:
                continue
            if end_date and date > end_date:
                continue

            # 获取该日期的模型 Token 详情
            models = []
            tokens_by_model = date_to_tokens.get(date, {})

            for model_name, total_tokens in tokens_by_model.items():
                # 注意：这里只有总 Token 数，没有详细拆分
                # 实际项目中可能需要从其他数据源补充详细信息
                models.append(DailyModelTokens(
                    date=date,
                    model_name=model_name,
                    input_tokens=0,  # 缓存文件中没有详细拆分
                    output_tokens=0,
                    cache_read_tokens=0,
                    cache_creation_tokens=0,
                ))

            try:
                results.append(DailyActivity(
                    date=date,
                    session_count=activity.get("sessionCount", 0),
                    total_tokens=sum(tokens_by_model.values()),
                    models=models,
                ))
            except Exception as e:
                logger.error(f"解析日期 {date} 的每日活动数据失败: {e}")
                continue

        logger.info(f"获取每日活动统计，共 {len(results)} 天")
        return results

    async def calculate_cache_hit_rate(self) -> float:
        """
        计算缓存命中率

        缓存命中率 = 缓存读取 Token / (缓存读取 Token + 输入 Token)

        Returns:
            float: 缓存命中率（0.0 ~ 1.0），计算失败返回 0.0
        """
        try:
            model_usage = await self.get_model_usage()

            total_cache_read = 0
            total_input = 0

            for usage in model_usage.values():
                total_cache_read += usage.cache_read_tokens
                total_input += usage.input_tokens

            # 避免除零错误
            total_requests = total_cache_read + total_input
            if total_requests == 0:
                logger.warning("总输入 Token 为 0，无法计算缓存命中率")
                return 0.0

            cache_hit_rate = total_cache_read / total_requests
            logger.info(f"计算缓存命中率: {cache_hit_rate:.2%}")

            return cache_hit_rate

        except Exception as e:
            logger.error(f"计算缓存命中率失败: {e}")
            return 0.0

    async def get_total_stats(self) -> Optional[StatsCache]:
        """
        获取完整的统计缓存对象

        Returns:
            Optional[StatsCache]: 统计缓存对象，读取失败返回 None
        """
        try:
            cache = await self.read_stats_cache()
            if not cache:
                return None

            # 获取模型使用统计和每日活动
            models = await self.get_model_usage()
            daily_activities = await self.get_daily_activity()

            # 计算总会话数和总 Token 数
            total_sessions = sum(
                activity.session_count for activity in daily_activities
            )
            total_tokens = sum(
                usage.total_with_cache for usage in models.values()
            )

            return StatsCache(
                total_sessions=total_sessions,
                total_tokens=total_tokens,
                models=models,
                daily_activities=daily_activities,
                last_updated=datetime.now(),
            )

        except Exception as e:
            logger.error(f"获取完整统计缓存失败: {e}")
            return None
