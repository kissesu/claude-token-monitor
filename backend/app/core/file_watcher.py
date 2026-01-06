"""
@file: file_watcher.py
@description: 文件监听器模块，使用 watchdog 监听 Claude 目录下的文件变化
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 监听 statsCache.json 文件变化
2. 监听 JSONL 对话日志文件变化
3. 防抖处理避免频繁触发
4. 支持异步回调通知
5. 优雅停止和资源清理
"""

import asyncio
import time
from pathlib import Path
from typing import Callable, Optional, Set
from threading import Timer

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileModifiedEvent

from .config import get_settings
from .logger import get_logger

logger = get_logger()


class DebouncedFileHandler(FileSystemEventHandler):
    """
    防抖文件事件处理器

    避免文件频繁修改时触发过多回调，使用防抖机制合并短时间内的多次事件
    """

    def __init__(
        self,
        callback: Callable[[str], None],
        debounce_seconds: float = 0.5,
        watched_patterns: Optional[Set[str]] = None,
    ):
        """
        初始化防抖处理器

        Args:
            callback: 文件修改时的回调函数，接收文件路径参数
            debounce_seconds: 防抖时间（秒），默认 0.5 秒
            watched_patterns: 监听的文件模式集合，如 {'.json', '.jsonl'}
        """
        super().__init__()
        self.callback = callback
        self.debounce_seconds = debounce_seconds
        self.watched_patterns = watched_patterns or {'.json', '.jsonl'}

        # 存储待处理的文件和对应的定时器
        self._timers: dict[str, Timer] = {}

        logger.debug(
            f"初始化防抖处理器: debounce={debounce_seconds}s, "
            f"patterns={self.watched_patterns}"
        )

    def on_modified(self, event: FileSystemEvent) -> None:
        """
        文件修改事件处理

        当文件被修改时触发，通过防抖机制避免频繁回调

        Args:
            event: 文件系统事件对象
        """
        # 忽略目录修改事件
        if event.is_directory:
            return

        file_path = event.src_path
        file_ext = Path(file_path).suffix.lower()

        # 检查文件扩展名是否在监听范围内
        if file_ext not in self.watched_patterns:
            return

        logger.debug(f"检测到文件修改: {file_path}")

        # 如果该文件已有待处理的定时器，先取消
        if file_path in self._timers:
            self._timers[file_path].cancel()

        # 创建新的防抖定时器
        timer = Timer(
            self.debounce_seconds,
            self._trigger_callback,
            args=[file_path]
        )
        self._timers[file_path] = timer
        timer.start()

    def _trigger_callback(self, file_path: str) -> None:
        """
        触发回调函数

        在防抖时间结束后调用，执行实际的文件修改处理逻辑

        Args:
            file_path: 修改的文件路径
        """
        # 移除已触发的定时器
        self._timers.pop(file_path, None)

        logger.info(f"文件修改触发回调: {file_path}")

        try:
            self.callback(file_path)
        except Exception as e:
            logger.error(f"文件监听回调执行失败: {file_path}, 错误: {e}", exc_info=True)

    def cancel_all_timers(self) -> None:
        """
        取消所有待处理的定时器

        在停止监听时调用，清理所有未触发的防抖定时器
        """
        for timer in self._timers.values():
            timer.cancel()
        self._timers.clear()
        logger.debug("已取消所有防抖定时器")


class FileWatcher:
    """
    文件监听器

    监听 Claude 目录下的文件变化，支持异步回调通知
    """

    def __init__(
        self,
        callback: Optional[Callable[[str], asyncio.Future]] = None,
        debounce_seconds: float = 0.5,
    ):
        """
        初始化文件监听器

        Args:
            callback: 异步回调函数，接收文件路径参数
            debounce_seconds: 防抖时间（秒），默认 0.5 秒
        """
        self.settings = get_settings()
        self.claude_dir = self.settings.get_claude_dir_path()
        self.callback = callback
        self.debounce_seconds = debounce_seconds

        # watchdog 观察者
        self._observer: Optional[Observer] = None

        # 事件循环（用于异步回调）
        self._loop: Optional[asyncio.AbstractEventLoop] = None

        # 运行状态
        self._is_running = False

        logger.info(f"文件监听器初始化: claude_dir={self.claude_dir}")

    def _sync_callback(self, file_path: str) -> None:
        """
        同步回调包装器

        将同步的文件修改事件转换为异步回调

        Args:
            file_path: 修改的文件路径
        """
        if self.callback is None:
            logger.warning("未设置回调函数，跳过文件变化通知")
            return

        # 如果有事件循环，在事件循环中调用异步回调
        if self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self._async_callback(file_path),
                self._loop
            )
        else:
            logger.warning("事件循环未运行，无法调用异步回调")

    async def _async_callback(self, file_path: str) -> None:
        """
        异步回调执行器

        Args:
            file_path: 修改的文件路径
        """
        try:
            if asyncio.iscoroutinefunction(self.callback):
                await self.callback(file_path)
            else:
                self.callback(file_path)
        except Exception as e:
            logger.error(f"异步回调执行失败: {file_path}, 错误: {e}", exc_info=True)

    def start_watching(
        self,
        loop: Optional[asyncio.AbstractEventLoop] = None
    ) -> None:
        """
        启动文件监听

        Args:
            loop: 事件循环对象，用于异步回调

        Raises:
            RuntimeError: 当监听器已经在运行时
            FileNotFoundError: 当 Claude 目录不存在时
        """
        if self._is_running:
            raise RuntimeError("文件监听器已在运行中")

        # 检查 Claude 目录是否存在
        if not self.claude_dir.exists():
            raise FileNotFoundError(f"Claude 目录不存在: {self.claude_dir}")

        # 设置事件循环
        self._loop = loop or asyncio.get_event_loop()

        # 创建事件处理器
        event_handler = DebouncedFileHandler(
            callback=self._sync_callback,
            debounce_seconds=self.debounce_seconds,
            watched_patterns={'.json', '.jsonl'},
        )

        # 创建观察者
        self._observer = Observer()
        self._observer.schedule(
            event_handler,
            str(self.claude_dir),
            recursive=True,  # 递归监听子目录
        )

        # 启动观察者
        self._observer.start()
        self._is_running = True

        logger.info(
            f"文件监听器已启动: 目录={self.claude_dir}, "
            f"防抖={self.debounce_seconds}s"
        )

    def stop_watching(self) -> None:
        """
        停止文件监听

        优雅地停止监听器并清理资源
        """
        if not self._is_running:
            logger.warning("文件监听器未在运行")
            return

        if self._observer:
            # 停止观察者
            self._observer.stop()

            # 等待观察者线程结束（最多等待 5 秒）
            self._observer.join(timeout=5.0)

            # 清理观察者
            self._observer = None

        self._is_running = False
        logger.info("文件监听器已停止")

    def is_running(self) -> bool:
        """
        检查监听器是否在运行

        Returns:
            bool: 如果监听器正在运行返回 True，否则返回 False
        """
        return self._is_running

    def watch_stats_cache(self) -> None:
        """
        监听 statsCache.json 文件变化

        专门监听统计缓存文件的便捷方法
        """
        stats_cache_path = self.claude_dir / "statsCache.json"

        if not stats_cache_path.exists():
            logger.warning(f"统计缓存文件不存在: {stats_cache_path}")
        else:
            logger.info(f"开始监听统计缓存文件: {stats_cache_path}")

    def watch_jsonl_files(self) -> None:
        """
        监听 JSONL 对话日志文件变化

        专门监听对话日志文件的便捷方法
        """
        logger.info(f"开始监听 JSONL 对话日志文件: {self.claude_dir}")


# ============================================
# 全局文件监听器实例（单例模式）
# ============================================
_file_watcher: Optional[FileWatcher] = None


def get_file_watcher(
    callback: Optional[Callable[[str], asyncio.Future]] = None,
    debounce_seconds: float = 0.5,
) -> FileWatcher:
    """
    获取全局文件监听器实例（单例模式）

    首次调用时会创建监听器实例并缓存，后续调用直接返回缓存的实例

    Args:
        callback: 异步回调函数，仅在首次创建时有效
        debounce_seconds: 防抖时间（秒），仅在首次创建时有效

    Returns:
        FileWatcher: 全局文件监听器对象
    """
    global _file_watcher
    if _file_watcher is None:
        _file_watcher = FileWatcher(
            callback=callback,
            debounce_seconds=debounce_seconds,
        )
    return _file_watcher
