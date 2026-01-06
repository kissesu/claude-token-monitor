"""
@file: models.py
@description: 数据库模型定义，提供 ORM 风格的数据访问层
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 定义数据库表的 Python 类表示
2. 提供便捷的数据查询和操作方法
3. 实现数据验证和转换
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


# ============================================
# 统计快照模型
# ============================================
@dataclass
class StatsSnapshot:
    """
    统计快照模型

    对应 stats_snapshots 表
    """

    id: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.now)
    total_sessions: int = 0
    total_tokens: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """
        转换为字典

        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp,
            "total_sessions": self.total_sessions,
            "total_tokens": self.total_tokens,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StatsSnapshot":
        """
        从字典创建实例

        Args:
            data: 字典数据

        Returns:
            StatsSnapshot: 模型实例
        """
        return cls(
            id=data.get("id"),
            timestamp=data.get("timestamp", datetime.now()),
            total_sessions=data.get("total_sessions", 0),
            total_tokens=data.get("total_tokens", 0),
            created_at=data.get("created_at", datetime.now()),
        )


# ============================================
# 模型使用模型
# ============================================
@dataclass
class ModelUsageRecord:
    """
    模型使用记录模型

    对应 model_usage 表
    """

    id: Optional[int] = None
    snapshot_id: int = 0
    model_name: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_creation_tokens: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def total_tokens(self) -> int:
        """
        计算总 Token 数量

        Returns:
            int: 所有 Token 类型之和
        """
        return (
            self.input_tokens +
            self.output_tokens +
            self.cache_read_tokens +
            self.cache_creation_tokens
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        转换为字典

        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "snapshot_id": self.snapshot_id,
            "model_name": self.model_name,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cache_read_tokens": self.cache_read_tokens,
            "cache_creation_tokens": self.cache_creation_tokens,
            "total_tokens": self.total_tokens,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ModelUsageRecord":
        """
        从字典创建实例

        Args:
            data: 字典数据

        Returns:
            ModelUsageRecord: 模型实例
        """
        return cls(
            id=data.get("id"),
            snapshot_id=data.get("snapshot_id", 0),
            model_name=data.get("model_name", ""),
            input_tokens=data.get("input_tokens", 0),
            output_tokens=data.get("output_tokens", 0),
            cache_read_tokens=data.get("cache_read_tokens", 0),
            cache_creation_tokens=data.get("cache_creation_tokens", 0),
            created_at=data.get("created_at", datetime.now()),
        )


# ============================================
# 每日活动模型
# ============================================
@dataclass
class DailyActivityRecord:
    """
    每日活动记录模型

    对应 daily_activities 表
    """

    id: Optional[int] = None
    snapshot_id: int = 0
    date: str = ""
    session_count: int = 0
    total_tokens: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """
        转换为字典

        Returns:
            Dict[str, Any]: 字典表示
        """
        return {
            "id": self.id,
            "snapshot_id": self.snapshot_id,
            "date": self.date,
            "session_count": self.session_count,
            "total_tokens": self.total_tokens,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DailyActivityRecord":
        """
        从字典创建实例

        Args:
            data: 字典数据

        Returns:
            DailyActivityRecord: 模型实例
        """
        return cls(
            id=data.get("id"),
            snapshot_id=data.get("snapshot_id", 0),
            date=data.get("date", ""),
            session_count=data.get("session_count", 0),
            total_tokens=data.get("total_tokens", 0),
            created_at=data.get("created_at", datetime.now()),
        )
