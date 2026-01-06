"""
@file: test_file_watcher.py
@description: 文件监听器集成测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试文件监听器初始化
2. 测试文件变化检测
3. 测试防抖机制
4. 测试优雅停止
"""

import asyncio
import time
from pathlib import Path
from typing import List
import tempfile
import json

import pytest

from app.core.file_watcher import FileWatcher, DebouncedFileHandler


class TestDebouncedFileHandler:
    """
    防抖文件事件处理器测试
    """

    def test_init(self):
        """
        测试处理器初始化
        """
        # 定义回调函数
        callback_called = []

        def callback(file_path: str):
            callback_called.append(file_path)

        # 创建处理器
        handler = DebouncedFileHandler(
            callback=callback,
            debounce_seconds=0.5,
            watched_patterns={'.json'},
        )

        assert handler.debounce_seconds == 0.5
        assert '.json' in handler.watched_patterns

    def test_debounce_mechanism(self):
        """
        测试防抖机制

        短时间内多次修改同一文件，应该只触发一次回调
        """
        callback_called = []

        def callback(file_path: str):
            callback_called.append(file_path)

        handler = DebouncedFileHandler(
            callback=callback,
            debounce_seconds=0.1,
            watched_patterns={'.json'},
        )

        # 创建临时文件
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
            temp_path = f.name

        try:
            # 模拟文件修改事件（快速连续多次）
            class MockEvent:
                def __init__(self, path):
                    self.src_path = path
                    self.is_directory = False

            for _ in range(5):
                handler.on_modified(MockEvent(temp_path))
                time.sleep(0.02)  # 20ms 间隔

            # 等待防抖时间
            time.sleep(0.3)

            # 应该只触发一次回调
            assert len(callback_called) == 1
            assert callback_called[0] == temp_path

        finally:
            # 清理临时文件
            Path(temp_path).unlink(missing_ok=True)


class TestFileWatcher:
    """
    文件监听器测试
    """

    @pytest.fixture
    def temp_dir(self):
        """
        创建临时目录用于测试

        Yields:
            Path: 临时目录路径
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir)

    @pytest.fixture
    def mock_claude_dir(self, temp_dir, monkeypatch):
        """
        模拟 Claude 目录

        Args:
            temp_dir: 临时目录
            monkeypatch: pytest 的 monkeypatch fixture

        Returns:
            Path: 模拟的 Claude 目录路径
        """
        # 创建模拟目录结构
        claude_dir = temp_dir / "claude"
        claude_dir.mkdir()

        # 创建 statsCache.json 文件
        stats_cache = claude_dir / "statsCache.json"
        stats_cache.write_text(json.dumps({
            "total_sessions": 0,
            "total_tokens": 0,
        }))

        # 修改配置中的 claude_dir
        from app.core.config import get_settings
        settings = get_settings()
        monkeypatch.setattr(settings, "claude_dir", str(claude_dir))

        return claude_dir

    def test_init(self, mock_claude_dir):
        """
        测试文件监听器初始化
        """
        callback_called = []

        async def callback(file_path: str):
            callback_called.append(file_path)

        watcher = FileWatcher(
            callback=callback,
            debounce_seconds=0.5,
        )

        assert watcher.claude_dir == mock_claude_dir
        assert watcher.callback == callback
        assert watcher.debounce_seconds == 0.5
        assert not watcher.is_running()

    @pytest.mark.asyncio
    async def test_start_stop_watching(self, mock_claude_dir):
        """
        测试启动和停止监听
        """
        watcher = FileWatcher(debounce_seconds=0.5)

        # 启动监听
        loop = asyncio.get_event_loop()
        watcher.start_watching(loop=loop)

        assert watcher.is_running()

        # 停止监听
        watcher.stop_watching()

        assert not watcher.is_running()

    @pytest.mark.asyncio
    async def test_file_change_detection(self, mock_claude_dir):
        """
        测试文件变化检测

        修改文件后应该触发回调
        """
        callback_called = []

        async def callback(file_path: str):
            callback_called.append(file_path)

        watcher = FileWatcher(
            callback=callback,
            debounce_seconds=0.1,
        )

        # 启动监听
        loop = asyncio.get_event_loop()
        watcher.start_watching(loop=loop)

        try:
            # 等待监听器启动
            await asyncio.sleep(0.2)

            # 修改 statsCache.json 文件
            stats_cache = mock_claude_dir / "statsCache.json"
            stats_cache.write_text(json.dumps({
                "total_sessions": 10,
                "total_tokens": 5000,
            }))

            # 等待文件变化被检测（防抖时间 + 额外等待）
            await asyncio.sleep(0.5)

            # 验证回调被触发
            assert len(callback_called) >= 1
            assert any(str(stats_cache) in path for path in callback_called)

        finally:
            # 停止监听
            watcher.stop_watching()

    @pytest.mark.asyncio
    async def test_multiple_file_changes(self, mock_claude_dir):
        """
        测试多个文件变化

        连续修改多个文件，应该都能被检测到
        """
        callback_called = []

        async def callback(file_path: str):
            callback_called.append(file_path)

        watcher = FileWatcher(
            callback=callback,
            debounce_seconds=0.1,
        )

        # 启动监听
        loop = asyncio.get_event_loop()
        watcher.start_watching(loop=loop)

        try:
            # 等待监听器启动
            await asyncio.sleep(0.2)

            # 创建并修改多个 JSON 文件
            for i in range(3):
                file_path = mock_claude_dir / f"test_{i}.json"
                file_path.write_text(json.dumps({"id": i}))
                await asyncio.sleep(0.15)  # 等待防抖

            # 等待所有文件变化被处理
            await asyncio.sleep(0.5)

            # 验证所有文件变化都被检测到
            assert len(callback_called) >= 3

        finally:
            # 停止监听
            watcher.stop_watching()

    def test_directory_not_exist(self):
        """
        测试目录不存在时的错误处理
        """
        # 创建一个不存在的目录路径
        non_existent_dir = Path("/tmp/non_existent_claude_dir_test_12345")

        # 修改配置
        from app.core.config import get_settings
        settings = get_settings()
        original_dir = settings.claude_dir
        settings.claude_dir = str(non_existent_dir)

        try:
            watcher = FileWatcher(debounce_seconds=0.5)

            # 启动监听应该抛出异常
            loop = asyncio.new_event_loop()
            with pytest.raises(FileNotFoundError):
                watcher.start_watching(loop=loop)

        finally:
            # 恢复原配置
            settings.claude_dir = original_dir
            loop.close()

    @pytest.mark.asyncio
    async def test_graceful_shutdown(self, mock_claude_dir):
        """
        测试优雅停止

        停止监听器后不应该有资源泄漏
        """
        callback_called = []

        async def callback(file_path: str):
            callback_called.append(file_path)

        watcher = FileWatcher(
            callback=callback,
            debounce_seconds=0.1,
        )

        # 启动监听
        loop = asyncio.get_event_loop()
        watcher.start_watching(loop=loop)

        # 等待监听器启动
        await asyncio.sleep(0.2)

        # 修改文件
        stats_cache = mock_claude_dir / "statsCache.json"
        stats_cache.write_text(json.dumps({"test": "data"}))

        # 立即停止（不等待回调完成）
        watcher.stop_watching()

        # 验证监听器已停止
        assert not watcher.is_running()

        # 再次修改文件，不应该触发回调
        old_count = len(callback_called)
        stats_cache.write_text(json.dumps({"test": "data2"}))
        await asyncio.sleep(0.5)

        # 回调次数不应该增加（或增加量不超过 1，因为可能有残留的防抖任务）
        assert len(callback_called) - old_count <= 1
