"""
@file: logger.py
@description: 日志配置模块，提供统一的日志记录功能
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 配置结构化日志格式（支持 JSON 格式）
2. 支持日志级别动态调整
3. 支持文件和控制台双输出
4. 添加请求 ID 追踪功能
5. 自动创建日志目录
"""

import logging
import sys
from pathlib import Path
from typing import Optional
import json
from datetime import datetime
from contextvars import ContextVar

from .config import get_settings


# ============================================
# 请求上下文变量（用于追踪请求 ID）
# ============================================
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    """
    请求 ID 过滤器

    在日志记录中自动添加请求 ID，方便追踪同一请求的所有日志
    """

    def filter(self, record: logging.LogRecord) -> bool:
        """
        添加请求 ID 到日志记录

        Args:
            record: 日志记录对象

        Returns:
            bool: 始终返回 True，表示允许记录
        """
        record.request_id = request_id_var.get() or "-"
        return True


class JsonFormatter(logging.Formatter):
    """
    JSON 格式化器

    将日志记录格式化为 JSON 格式，便于日志收集和分析系统处理
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        格式化日志记录为 JSON 字符串

        Args:
            record: 日志记录对象

        Returns:
            str: JSON 格式的日志字符串
        """
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # 添加请求 ID
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # 添加异常信息
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # 添加额外字段
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        return json.dumps(log_data, ensure_ascii=False)


class ColoredFormatter(logging.Formatter):
    """
    带颜色的控制台格式化器

    在控制台输出时为不同级别的日志添加颜色，提高可读性
    """

    # ANSI 颜色代码
    COLORS = {
        "DEBUG": "\033[36m",      # 青色
        "INFO": "\033[32m",       # 绿色
        "WARNING": "\033[33m",    # 黄色
        "ERROR": "\033[31m",      # 红色
        "CRITICAL": "\033[35m",   # 紫色
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        """
        格式化日志记录并添加颜色

        Args:
            record: 日志记录对象

        Returns:
            str: 带颜色的格式化日志字符串
        """
        # 获取颜色代码
        color = self.COLORS.get(record.levelname, self.RESET)

        # 格式化时间
        record.asctime = self.formatTime(record, self.datefmt)

        # 构建日志消息
        log_parts = [
            f"{record.asctime}",
            f"{color}{record.levelname:8s}{self.RESET}",
            f"[{record.name}]",
        ]

        # 添加请求 ID
        if hasattr(record, "request_id") and record.request_id != "-":
            log_parts.append(f"[{record.request_id}]")

        log_parts.append(record.getMessage())

        # 添加异常信息
        if record.exc_info:
            log_parts.append("\n" + self.formatException(record.exc_info))

        return " ".join(log_parts)


def setup_logger(
    name: str = "claude-token-monitor",
    log_level: Optional[str] = None,
    log_file: Optional[Path] = None,
    use_json: bool = False,
) -> logging.Logger:
    """
    配置并返回日志记录器

    Args:
        name: 日志记录器名称
        log_level: 日志级别（DEBUG, INFO, WARNING, ERROR, CRITICAL）
        log_file: 日志文件路径，为 None 时只输出到控制台
        use_json: 是否使用 JSON 格式（用于生产环境）

    Returns:
        logging.Logger: 配置好的日志记录器
    """
    settings = get_settings()

    # 获取日志级别
    if log_level is None:
        log_level = settings.log_level

    # 创建日志记录器
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level))

    # 清空现有的处理器（避免重复配置）
    logger.handlers.clear()

    # 添加请求 ID 过滤器
    request_filter = RequestIdFilter()

    # ============================================
    # 控制台处理器配置
    # ============================================
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level))

    if use_json:
        # 生产环境使用 JSON 格式
        console_formatter = JsonFormatter()
    else:
        # 开发环境使用带颜色的格式
        console_formatter = ColoredFormatter(
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    console_handler.setFormatter(console_formatter)
    console_handler.addFilter(request_filter)
    logger.addHandler(console_handler)

    # ============================================
    # 文件处理器配置（如果指定了日志文件）
    # ============================================
    if log_file:
        # 确保日志目录存在
        log_file.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(
            log_file,
            encoding="utf-8",
            mode="a",
        )
        file_handler.setLevel(getattr(logging, log_level))

        # 文件日志使用 JSON 格式（便于日志分析）
        file_formatter = JsonFormatter()
        file_handler.setFormatter(file_formatter)
        file_handler.addFilter(request_filter)
        logger.addHandler(file_handler)

    # 不向上级日志记录器传播
    logger.propagate = False

    return logger


def get_logger(name: str = "claude-token-monitor") -> logging.Logger:
    """
    获取日志记录器

    如果日志记录器已经存在，直接返回；否则创建新的日志记录器

    Args:
        name: 日志记录器名称

    Returns:
        logging.Logger: 日志记录器对象
    """
    logger = logging.getLogger(name)

    # 如果还没有配置过，则进行配置
    if not logger.handlers:
        settings = get_settings()
        log_file = settings.get_log_file_path()
        use_json = not settings.debug  # 非调试模式使用 JSON 格式

        logger = setup_logger(
            name=name,
            log_level=settings.log_level,
            log_file=log_file,
            use_json=use_json,
        )

    return logger


def set_request_id(request_id: str) -> None:
    """
    设置当前请求的 ID

    在请求处理开始时调用，将请求 ID 存储到上下文变量中

    Args:
        request_id: 请求唯一标识符
    """
    request_id_var.set(request_id)


def get_request_id() -> Optional[str]:
    """
    获取当前请求的 ID

    Returns:
        Optional[str]: 当前请求的 ID，如果没有设置则返回 None
    """
    return request_id_var.get()


def clear_request_id() -> None:
    """
    清除当前请求的 ID

    在请求处理结束时调用，清理上下文变量
    """
    request_id_var.set(None)


# ============================================
# 默认日志记录器实例
# ============================================
logger = get_logger()
