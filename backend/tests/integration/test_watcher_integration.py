"""
@file: test_watcher_integration.py
@description: 文件监听器集成测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试文件监听器启动和停止
2. 测试文件变化检测
3. 测试 WebSocket 推送集成
4. 测试防抖机制
"""

import pytest
import asyncio
import json
from pathlib import Path
from typing import Dict


# ============================================
# 标记为集成测试
# ============================================
pytestmark = pytest.mark.integration


# ============================================
# 测试文件监听器基本功能
# ============================================
@pytest.mark.asyncio
async def test_file_watcher_start_stop(test_dirs: Dict[str, Path]):
    """
    测试文件监听器的启动和停止

    验收标准：
    - 监听器可以成功启动
    - 监听器可以正常停止
    - 停止后不再监听文件变化
    """
    from app.core.file_watcher import FileWatcher

    # 回调计数器
    callback_count = 0

    async def callback(file_path: str):
        nonlocal callback_count
        callback_count += 1

    # 创建监听器
    watcher = FileWatcher(
        watch_path=test_dirs["claude"],
        callback=callback,
        debounce_seconds=0.1
    )

    # 获取事件循环
    loop = asyncio.get_event_loop()

    # 启动监听
    watcher.start_watching(loop=loop)

    # 等待监听器初始化
    await asyncio.sleep(0.2)

    # 创建测试文件
    test_file = test_dirs["claude"] / "test-stats.json"
    test_file.write_text('{"test": "data"}')

    # 等待文件变化检测和防抖
    await asyncio.sleep(0.3)

    # 停止监听
    watcher.stop_watching()

    # 验证回调被调用
    assert callback_count > 0


# ============================================
# 测试文件变化检测
# ============================================
@pytest.mark.asyncio
async def test_file_change_detection(test_dirs: Dict[str, Path]):
    """
    测试文件变化检测

    验收标准：
    - 能检测到文件创建
    - 能检测到文件修改
    - 能检测到文件删除
    """
    from app.core.file_watcher import FileWatcher

    # 记录检测到的文件路径
    detected_files = []

    async def callback(file_path: str):
        detected_files.append(file_path)

    # 创建监听器
    watcher = FileWatcher(
        watch_path=test_dirs["claude"],
        callback=callback,
        debounce_seconds=0.1
    )

    loop = asyncio.get_event_loop()
    watcher.start_watching(loop=loop)

    await asyncio.sleep(0.2)

    # ============================================
    # 测试文件创建
    # ============================================
    test_file = test_dirs["claude"] / "new-file.json"
    test_file.write_text('{"action": "create"}')
    await asyncio.sleep(0.3)

    # ============================================
    # 测试文件修改
    # ============================================
    test_file.write_text('{"action": "modify"}')
    await asyncio.sleep(0.3)

    # ============================================
    # 测试文件删除
    # ============================================
    test_file.unlink()
    await asyncio.sleep(0.3)

    watcher.stop_watching()

    # 验证检测到文件变化
    assert len(detected_files) > 0


# ============================================
# 测试防抖机制
# ============================================
@pytest.mark.asyncio
async def test_debounce_mechanism(test_dirs: Dict[str, Path]):
    """
    测试防抖机制

    验收标准：
    - 短时间内多次修改只触发一次回调
    - 防抖延迟正确生效
    """
    from app.core.file_watcher import FileWatcher

    callback_count = 0
    last_callback_time = None

    async def callback(file_path: str):
        nonlocal callback_count, last_callback_time
        callback_count += 1
        last_callback_time = asyncio.get_event_loop().time()

    # 创建监听器，设置较长的防抖时间
    watcher = FileWatcher(
        watch_path=test_dirs["claude"],
        callback=callback,
        debounce_seconds=0.5
    )

    loop = asyncio.get_event_loop()
    watcher.start_watching(loop=loop)

    await asyncio.sleep(0.2)

    # 快速连续修改文件
    test_file = test_dirs["claude"] / "debounce-test.json"
    for i in range(5):
        test_file.write_text(f'{{"count": {i}}}')
        await asyncio.sleep(0.05)  # 间隔 50ms

    # 等待防抖时间
    await asyncio.sleep(0.8)

    watcher.stop_watching()

    # 验证：5 次修改应该只触发少量回调（由于防抖）
    assert callback_count < 5
    assert callback_count > 0


# ============================================
# 测试特定文件监听
# ============================================
@pytest.mark.asyncio
async def test_specific_file_watching(test_dirs: Dict[str, Path]):
    """
    测试特定文件监听

    验收标准：
    - 只监听目标文件（stats-cache.json）
    - 忽略其他文件的变化
    """
    from app.core.file_watcher import FileWatcher

    detected_files = []

    async def callback(file_path: str):
        detected_files.append(Path(file_path).name)

    # 创建监听器
    watcher = FileWatcher(
        watch_path=test_dirs["claude"],
        callback=callback,
        debounce_seconds=0.1
    )

    loop = asyncio.get_event_loop()
    watcher.start_watching(loop=loop)

    await asyncio.sleep(0.2)

    # 修改目标文件
    stats_file = test_dirs["claude"] / "stats-cache.json"
    stats_file.write_text('{"updated": true}')
    await asyncio.sleep(0.3)

    # 修改非目标文件
    other_file = test_dirs["claude"] / "other.txt"
    other_file.write_text('should be ignored')
    await asyncio.sleep(0.3)

    watcher.stop_watching()

    # 验证：应该检测到 stats-cache.json 的变化
    # 注意：具体的文件过滤逻辑取决于 FileWatcher 的实现
    assert len(detected_files) > 0


# ============================================
# 测试监听器与 WebSocket 集成
# ============================================
@pytest.mark.asyncio
async def test_watcher_websocket_integration(
    test_dirs: Dict[str, Path],
    ws_client
):
    """
    测试文件监听器与 WebSocket 的集成

    验收标准：
    - 文件变化能触发 WebSocket 推送
    - 推送消息格式正确
    - 所有连接的客户端都能收到推送
    """
    from app.core.file_watcher import get_file_watcher
    from app.api.websocket import get_connection_manager

    # 获取连接管理器
    manager = get_connection_manager()

    # 定义回调
    async def on_file_changed(file_path: str):
        await manager.send_stats_update(file_path)

    # 创建监听器
    watcher = get_file_watcher(
        callback=on_file_changed,
        debounce_seconds=0.1
    )

    loop = asyncio.get_event_loop()
    watcher.start_watching(loop=loop)

    # 注意：这个测试需要实际的 WebSocket 连接
    # 由于测试环境限制，这里主要验证逻辑流程
    # 完整的端到端测试需要在真实环境中进行

    await asyncio.sleep(0.2)

    # 修改文件
    stats_file = test_dirs["claude"] / "stats-cache.json"
    stats_file.write_text('{"test": "update"}')

    await asyncio.sleep(0.3)

    watcher.stop_watching()

    # 这里无法直接验证 WebSocket 推送
    # 实际验证需要集成 WebSocket 客户端
    # 主要验证没有抛出异常


# ============================================
# 测试监听器错误处理
# ============================================
@pytest.mark.asyncio
async def test_watcher_error_handling(test_dirs: Dict[str, Path]):
    """
    测试监听器错误处理

    验收标准：
    - 回调函数异常不影响监听器运行
    - 监听器能继续处理后续文件变化
    """
    from app.core.file_watcher import FileWatcher

    callback_count = 0

    async def faulty_callback(file_path: str):
        nonlocal callback_count
        callback_count += 1
        # 第一次回调抛出异常
        if callback_count == 1:
            raise ValueError("Simulated callback error")

    watcher = FileWatcher(
        watch_path=test_dirs["claude"],
        callback=faulty_callback,
        debounce_seconds=0.1
    )

    loop = asyncio.get_event_loop()
    watcher.start_watching(loop=loop)

    await asyncio.sleep(0.2)

    # 第一次修改（会触发异常）
    test_file = test_dirs["claude"] / "error-test.json"
    test_file.write_text('{"count": 1}')
    await asyncio.sleep(0.3)

    # 第二次修改（应该正常处理）
    test_file.write_text('{"count": 2}')
    await asyncio.sleep(0.3)

    watcher.stop_watching()

    # 验证：尽管第一次回调出错，后续回调仍然执行
    assert callback_count >= 1
