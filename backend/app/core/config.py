"""
@file: config.py
@description: 应用配置管理模块，基于 Pydantic Settings 实现配置加载和验证
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 从环境变量和 .env 文件加载配置
2. 配置项类型验证和默认值设置
3. 路径自动展开（~/.claude → 完整路径）
4. 支持配置项动态覆盖
"""

import os
from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    应用配置类

    所有配置项都可以通过环境变量覆盖，环境变量名为配置项名的大写形式
    例如：claude_dir 可以通过环境变量 CLAUDE_DIR 覆盖
    """

    # ============================================
    # Claude CLI 相关配置
    # ============================================
    claude_dir: str = Field(
        default="~/.claude",
        description="Claude CLI 配置目录路径，自动展开 ~ 为用户主目录"
    )

    # ============================================
    # 数据库配置
    # ============================================
    database_path: str = Field(
        default="data/monitor.db",
        description="SQLite 数据库文件路径，相对于项目根目录"
    )

    # ============================================
    # 服务端口配置
    # ============================================
    backend_port: int = Field(
        default=51888,
        ge=1024,
        le=65535,
        description="后端服务监听端口，范围 1024-65535"
    )

    # ============================================
    # 日志配置
    # ============================================
    log_level: str = Field(
        default="INFO",
        description="日志级别：DEBUG, INFO, WARNING, ERROR, CRITICAL"
    )

    log_file: Optional[str] = Field(
        default=None,
        description="日志文件路径，为 None 时只输出到控制台"
    )

    # ============================================
    # 应用配置
    # ============================================
    debug: bool = Field(
        default=False,
        description="调试模式开关，开启后会输出详细日志和自动重载"
    )

    api_prefix: str = Field(
        default="/api/v1",
        description="API 路由前缀"
    )

    # ============================================
    # CORS 配置
    # ============================================
    cors_origins: list[str] = Field(
        default=["*"],
        description="允许的 CORS 源，生产环境应设置具体域名"
    )

    # ============================================
    # 项目根目录（自动计算）
    # ============================================
    project_root: Path = Field(
        default_factory=lambda: Path(__file__).parent.parent.parent.parent,
        description="项目根目录的绝对路径"
    )

    # ============================================
    # Pydantic Settings 配置
    # ============================================
    model_config = SettingsConfigDict(
        # 从 .env 文件加载配置
        env_file=".env",
        # .env 文件编码
        env_file_encoding="utf-8",
        # 环境变量不区分大小写
        case_sensitive=False,
        # 允许额外字段（用于未来扩展）
        extra="ignore",
    )

    @field_validator("claude_dir", mode="before")
    @classmethod
    def expand_claude_dir(cls, v: str) -> str:
        """
        展开 Claude 目录路径中的 ~ 符号

        Args:
            v: 原始路径字符串

        Returns:
            str: 展开后的绝对路径
        """
        return os.path.expanduser(v)

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """
        验证日志级别是否合法

        Args:
            v: 日志级别字符串

        Returns:
            str: 转换为大写的日志级别

        Raises:
            ValueError: 当日志级别不在允许列表中时
        """
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in allowed_levels:
            raise ValueError(
                f"日志级别必须是以下之一: {', '.join(allowed_levels)}"
            )
        return v_upper

    def get_claude_dir_path(self) -> Path:
        """
        获取 Claude 目录的 Path 对象

        Returns:
            Path: Claude 目录的路径对象
        """
        return Path(self.claude_dir)

    def get_database_path(self) -> Path:
        """
        获取数据库文件的绝对路径

        Returns:
            Path: 数据库文件的绝对路径对象
        """
        db_path = Path(self.database_path)
        if db_path.is_absolute():
            return db_path
        # 相对路径则相对于项目根目录
        return self.project_root / db_path

    def get_log_file_path(self) -> Optional[Path]:
        """
        获取日志文件的绝对路径

        Returns:
            Optional[Path]: 日志文件的绝对路径对象，如果未配置则返回 None
        """
        if self.log_file is None:
            return None

        log_path = Path(self.log_file)
        if log_path.is_absolute():
            return log_path
        # 相对路径则相对于项目根目录
        return self.project_root / log_path


# ============================================
# 全局配置实例（单例模式）
# ============================================
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """
    获取全局配置实例（单例模式）

    首次调用时会创建配置实例并缓存，后续调用直接返回缓存的实例

    Returns:
        Settings: 全局配置对象
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reload_settings() -> Settings:
    """
    重新加载配置（用于配置更新场景）

    Returns:
        Settings: 新的配置对象
    """
    global _settings
    _settings = Settings()
    return _settings
