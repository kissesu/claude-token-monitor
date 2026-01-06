"""
@file: schemas.py
@description: 数据模型定义，使用 Pydantic v2 进行数据验证和序列化
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 定义统计缓存数据模型
2. 定义模型使用数据模型
3. 定义每日活动数据模型
4. 定义会话信息模型
5. 定义导出请求响应模型
"""

from datetime import datetime
from typing import Optional, Dict, List, Any
from enum import Enum

from pydantic import BaseModel, Field, field_validator, ConfigDict


# ============================================
# 基础模型配置
# ============================================
class BaseSchema(BaseModel):
    """
    基础模型类

    所有数据模型的基类，提供统一的配置
    """

    model_config = ConfigDict(
        # 启用严格模式
        strict=False,
        # 允许从属性赋值
        from_attributes=True,
        # 使用枚举值而不是枚举对象
        use_enum_values=True,
        # JSON Schema 额外配置
        json_schema_extra={
            "example": {}
        }
    )


# ============================================
# 模型使用数据
# ============================================
class ModelUsage(BaseSchema):
    """
    模型使用数据

    记录单个模型的 Token 使用情况，包含输入、输出、缓存读取和缓存创建
    """

    model_name: str = Field(
        ...,
        description="模型名称，如 claude-3-5-sonnet-20241022",
        min_length=1
    )

    input_tokens: int = Field(
        default=0,
        ge=0,
        description="输入 Token 数量"
    )

    output_tokens: int = Field(
        default=0,
        ge=0,
        description="输出 Token 数量"
    )

    cache_read_tokens: int = Field(
        default=0,
        ge=0,
        description="缓存读取 Token 数量"
    )

    cache_creation_tokens: int = Field(
        default=0,
        ge=0,
        description="缓存创建 Token 数量"
    )

    @property
    def total_tokens(self) -> int:
        """
        计算总 Token 数量

        Returns:
            int: 输入和输出 Token 之和
        """
        return self.input_tokens + self.output_tokens

    @property
    def total_with_cache(self) -> int:
        """
        计算包含缓存的总 Token 数量

        Returns:
            int: 所有 Token 类型之和
        """
        return (
            self.input_tokens +
            self.output_tokens +
            self.cache_read_tokens +
            self.cache_creation_tokens
        )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "model_name": "claude-3-5-sonnet-20241022",
                "input_tokens": 1000,
                "output_tokens": 500,
                "cache_read_tokens": 200,
                "cache_creation_tokens": 100,
            }
        }
    )


# ============================================
# 每日模型 Token 统计
# ============================================
class DailyModelTokens(BaseSchema):
    """
    每日模型 Token 统计

    记录某个模型在某一天的 Token 使用情况
    """

    date: str = Field(
        ...,
        description="日期，格式 YYYY-MM-DD",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    )

    model_name: str = Field(
        ...,
        description="模型名称",
        min_length=1
    )

    input_tokens: int = Field(
        default=0,
        ge=0,
        description="输入 Token 数量"
    )

    output_tokens: int = Field(
        default=0,
        ge=0,
        description="输出 Token 数量"
    )

    cache_read_tokens: int = Field(
        default=0,
        ge=0,
        description="缓存读取 Token 数量"
    )

    cache_creation_tokens: int = Field(
        default=0,
        ge=0,
        description="缓存创建 Token 数量"
    )

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        """
        验证日期格式

        Args:
            v: 日期字符串

        Returns:
            str: 验证通过的日期字符串

        Raises:
            ValueError: 日期格式不正确时
        """
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("日期格式必须为 YYYY-MM-DD")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "date": "2026-01-07",
                "model_name": "claude-3-5-sonnet-20241022",
                "input_tokens": 5000,
                "output_tokens": 2000,
                "cache_read_tokens": 1000,
                "cache_creation_tokens": 500,
            }
        }
    )


# ============================================
# 每日活动数据
# ============================================
class DailyActivity(BaseSchema):
    """
    每日活动数据

    记录某一天的会话活动情况和总 Token 使用量
    """

    date: str = Field(
        ...,
        description="日期，格式 YYYY-MM-DD",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    )

    session_count: int = Field(
        default=0,
        ge=0,
        description="会话数量"
    )

    total_tokens: int = Field(
        default=0,
        ge=0,
        description="总 Token 数量（包含缓存）"
    )

    models: List[DailyModelTokens] = Field(
        default_factory=list,
        description="各模型的 Token 使用详情"
    )

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        """
        验证日期格式

        Args:
            v: 日期字符串

        Returns:
            str: 验证通过的日期字符串

        Raises:
            ValueError: 日期格式不正确时
        """
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("日期格式必须为 YYYY-MM-DD")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
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
        }
    )


# ============================================
# 统计缓存数据
# ============================================
class StatsCache(BaseSchema):
    """
    统计缓存数据

    缓存聚合后的统计数据，包含模型使用情况和每日活动
    """

    total_sessions: int = Field(
        default=0,
        ge=0,
        description="总会话数"
    )

    total_tokens: int = Field(
        default=0,
        ge=0,
        description="总 Token 数量"
    )

    models: Dict[str, ModelUsage] = Field(
        default_factory=dict,
        description="各模型使用情况，key 为模型名称"
    )

    daily_activities: List[DailyActivity] = Field(
        default_factory=list,
        description="每日活动数据列表"
    )

    last_updated: datetime = Field(
        default_factory=datetime.now,
        description="最后更新时间"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
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
                ],
                "last_updated": "2026-01-07T12:00:00"
            }
        }
    )


# ============================================
# 会话信息
# ============================================
class SessionInfo(BaseSchema):
    """
    会话信息

    记录单个会话的基本信息和 Token 使用情况
    """

    session_id: str = Field(
        ...,
        description="会话唯一标识符",
        min_length=1
    )

    model_name: str = Field(
        ...,
        description="使用的模型名称",
        min_length=1
    )

    created_at: datetime = Field(
        ...,
        description="会话创建时间"
    )

    input_tokens: int = Field(
        default=0,
        ge=0,
        description="输入 Token 数量"
    )

    output_tokens: int = Field(
        default=0,
        ge=0,
        description="输出 Token 数量"
    )

    cache_read_tokens: int = Field(
        default=0,
        ge=0,
        description="缓存读取 Token 数量"
    )

    cache_creation_tokens: int = Field(
        default=0,
        ge=0,
        description="缓存创建 Token 数量"
    )

    project_name: Optional[str] = Field(
        default=None,
        description="项目名称（如果有）"
    )

    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="额外的元数据"
    )

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

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "session_123456",
                "model_name": "claude-3-5-sonnet-20241022",
                "created_at": "2026-01-07T12:00:00",
                "input_tokens": 1000,
                "output_tokens": 500,
                "cache_read_tokens": 200,
                "cache_creation_tokens": 100,
                "project_name": "my-project",
                "metadata": {}
            }
        }
    )


# ============================================
# 导出格式枚举
# ============================================
class ExportFormat(str, Enum):
    """
    导出格式枚举
    """
    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"


# ============================================
# 导出请求
# ============================================
class ExportRequest(BaseSchema):
    """
    导出请求

    请求导出数据时的参数
    """

    format: ExportFormat = Field(
        default=ExportFormat.JSON,
        description="导出格式：json, csv, excel"
    )

    start_date: Optional[str] = Field(
        default=None,
        description="开始日期，格式 YYYY-MM-DD",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    )

    end_date: Optional[str] = Field(
        default=None,
        description="结束日期，格式 YYYY-MM-DD",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    )

    models: Optional[List[str]] = Field(
        default=None,
        description="要导出的模型列表，为空则导出所有模型"
    )

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        """
        验证日期格式

        Args:
            v: 日期字符串

        Returns:
            Optional[str]: 验证通过的日期字符串

        Raises:
            ValueError: 日期格式不正确时
        """
        if v is not None:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError("日期格式必须为 YYYY-MM-DD")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "format": "json",
                "start_date": "2026-01-01",
                "end_date": "2026-01-07",
                "models": ["claude-3-5-sonnet-20241022"]
            }
        }
    )


# ============================================
# 导出响应
# ============================================
class ExportResponse(BaseSchema):
    """
    导出响应

    返回导出的数据或文件路径
    """

    success: bool = Field(
        ...,
        description="是否成功"
    )

    message: str = Field(
        ...,
        description="响应消息"
    )

    file_path: Optional[str] = Field(
        default=None,
        description="导出文件路径（相对路径或绝对路径）"
    )

    data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="导出的数据（当格式为 JSON 时直接返回数据）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "导出成功",
                "file_path": "exports/data_2026-01-07.json",
                "data": None
            }
        }
    )


# ============================================
# API 响应包装器
# ============================================
class ApiResponse(BaseSchema):
    """
    API 响应包装器

    统一的 API 响应格式
    """

    success: bool = Field(
        ...,
        description="请求是否成功"
    )

    message: str = Field(
        default="",
        description="响应消息"
    )

    data: Optional[Any] = Field(
        default=None,
        description="响应数据"
    )

    error: Optional[str] = Field(
        default=None,
        description="错误信息（当 success=False 时）"
    )

    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="响应时间戳"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "操作成功",
                "data": {},
                "error": None,
                "timestamp": "2026-01-07T12:00:00"
            }
        }
    )
