"""
@file: test_websocket.py
@description: WebSocket 处理器集成测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试 WebSocket 连接管理
2. 测试消息发送和广播
3. 测试心跳机制
4. 测试连接断开清理
"""

import asyncio
import json
from datetime import datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect

from app.api.websocket import (
    ConnectionManager,
    get_connection_manager,
    router as websocket_router,
)


class TestConnectionManager:
    """
    连接管理器测试
    """

    @pytest.fixture
    def manager(self):
        """
        创建连接管理器实例

        Returns:
            ConnectionManager: 连接管理器对象
        """
        return ConnectionManager()

    def test_init(self, manager):
        """
        测试管理器初始化
        """
        assert manager.active_connections == []
        assert manager.connection_metadata == {}

    @pytest.mark.asyncio
    async def test_broadcast_no_connections(self, manager):
        """
        测试没有连接时的广播

        不应该抛出异常
        """
        message = {
            "type": "test",
            "data": {"message": "test"},
        }

        # 应该正常执行，不抛出异常
        await manager.broadcast(message)

    @pytest.mark.asyncio
    async def test_send_stats_update(self, manager):
        """
        测试发送统计更新消息

        即使没有连接，也应该正常执行
        """
        # 创建临时统计文件
        import tempfile
        from pathlib import Path

        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.json',
            delete=False,
            encoding='utf-8'
        ) as f:
            json.dump({
                "total_sessions": 10,
                "total_tokens": 5000,
            }, f)
            temp_path = f.name

        try:
            # 发送统计更新
            await manager.send_stats_update(temp_path)

            # 应该正常执行，不抛出异常

        finally:
            # 清理临时文件
            Path(temp_path).unlink(missing_ok=True)

    @pytest.mark.asyncio
    async def test_cleanup(self, manager):
        """
        测试清理资源

        应该正常执行，不抛出异常
        """
        await manager.cleanup()

        assert len(manager.active_connections) == 0
        assert len(manager.connection_metadata) == 0


class TestWebSocketEndpoint:
    """
    WebSocket 端点测试
    """

    @pytest.fixture
    def app(self):
        """
        创建测试应用

        Returns:
            FastAPI: FastAPI 应用实例
        """
        app = FastAPI()
        app.include_router(websocket_router)
        return app

    @pytest.fixture
    def client(self, app):
        """
        创建测试客户端

        Args:
            app: FastAPI 应用

        Returns:
            TestClient: 测试客户端实例
        """
        return TestClient(app)

    def test_websocket_connect_disconnect(self, client):
        """
        测试 WebSocket 连接和断开
        """
        with client.websocket_connect("/ws") as websocket:
            # 接收欢迎消息
            data = websocket.receive_json()

            assert data["type"] == "connected"
            assert "client_id" in data["data"]
            assert data["data"]["message"] == "WebSocket 连接成功"

        # 连接关闭后，管理器中应该没有活跃连接
        manager = get_connection_manager()
        assert len(manager.active_connections) == 0

    def test_websocket_ping_pong(self, client):
        """
        测试 Ping-Pong 消息
        """
        with client.websocket_connect("/ws") as websocket:
            # 接收欢迎消息
            welcome = websocket.receive_json()
            assert welcome["type"] == "connected"

            # 发送 ping 消息
            websocket.send_json({
                "type": "ping",
                "data": {"message": "test ping"},
            })

            # 应该收到多个消息（心跳 + pong）
            # 我们需要找到 pong 消息
            pong_received = False
            for _ in range(5):  # 最多尝试 5 次
                data = websocket.receive_json()
                if data["type"] == "pong":
                    pong_received = True
                    assert data["data"]["message"] == "test ping"
                    break

            assert pong_received, "未收到 pong 响应"

    def test_websocket_heartbeat(self, client):
        """
        测试心跳消息
        """
        with client.websocket_connect("/ws") as websocket:
            # 接收欢迎消息
            welcome = websocket.receive_json()
            assert welcome["type"] == "connected"

            # 发送心跳消息
            websocket.send_json({
                "type": "heartbeat",
            })

            # 应该收到心跳响应
            heartbeat_received = False
            for _ in range(5):
                data = websocket.receive_json()
                if data["type"] == "heartbeat" and data["data"].get("status") == "ok":
                    heartbeat_received = True
                    break

            assert heartbeat_received, "未收到心跳响应"

    def test_websocket_unknown_message_type(self, client):
        """
        测试未知消息类型的处理
        """
        with client.websocket_connect("/ws") as websocket:
            # 接收欢迎消息
            welcome = websocket.receive_json()
            assert welcome["type"] == "connected"

            # 发送未知类型的消息
            websocket.send_json({
                "type": "unknown_type",
                "data": {},
            })

            # 应该收到错误消息
            error_received = False
            for _ in range(5):
                data = websocket.receive_json()
                if data["type"] == "error":
                    error_received = True
                    assert "未知消息类型" in data["data"]["message"]
                    break

            assert error_received, "未收到错误消息"

    def test_multiple_websocket_connections(self, client):
        """
        测试多个 WebSocket 连接
        """
        # 打开多个连接
        connections = []
        for i in range(3):
            ws = client.websocket_connect(f"/ws?client_id=client_{i}")
            ws.__enter__()
            connections.append(ws)

            # 接收欢迎消息
            welcome = ws.receive_json()
            assert welcome["type"] == "connected"
            assert welcome["data"]["client_id"] == f"client_{i}"

        # 验证管理器中有 3 个活跃连接
        manager = get_connection_manager()
        assert len(manager.active_connections) == 3

        # 关闭所有连接
        for ws in connections:
            ws.__exit__(None, None, None)

        # 验证所有连接都已清理
        assert len(manager.active_connections) == 0

    @pytest.mark.asyncio
    async def test_broadcast_to_multiple_clients(self, app):
        """
        测试向多个客户端广播消息
        """
        manager = get_connection_manager()

        # 模拟两个 WebSocket 连接
        class MockWebSocket:
            def __init__(self, client_id):
                self.client_id = client_id
                self.messages = []
                self.client_state = "CONNECTED"

            async def send_json(self, message):
                self.messages.append(message)

        ws1 = MockWebSocket("client_1")
        ws2 = MockWebSocket("client_2")

        # 手动添加到管理器
        manager.active_connections.append(ws1)
        manager.active_connections.append(ws2)
        manager.connection_metadata[ws1] = {
            "client_id": "client_1",
            "connected_at": datetime.now().isoformat(),
        }
        manager.connection_metadata[ws2] = {
            "client_id": "client_2",
            "connected_at": datetime.now().isoformat(),
        }

        # 广播消息
        broadcast_msg = {
            "type": "test_broadcast",
            "data": {"message": "Hello everyone!"},
        }

        await manager.broadcast(broadcast_msg)

        # 验证两个客户端都收到了消息
        assert len(ws1.messages) == 1
        assert len(ws2.messages) == 1

        assert ws1.messages[0]["type"] == "test_broadcast"
        assert ws2.messages[0]["type"] == "test_broadcast"
        assert ws1.messages[0]["data"]["message"] == "Hello everyone!"

        # 清理
        manager.active_connections.clear()
        manager.connection_metadata.clear()

    def test_websocket_client_id_parameter(self, client):
        """
        测试客户端 ID 参数
        """
        custom_id = "my_custom_client_123"

        with client.websocket_connect(f"/ws?client_id={custom_id}") as websocket:
            # 接收欢迎消息
            welcome = websocket.receive_json()

            assert welcome["type"] == "connected"
            assert welcome["data"]["client_id"] == custom_id

    @pytest.mark.asyncio
    async def test_connection_cleanup_on_error(self):
        """
        测试发生错误时的连接清理
        """
        manager = ConnectionManager()

        # 模拟一个会抛出异常的 WebSocket
        class BrokenWebSocket:
            def __init__(self):
                self.client_state = "CONNECTED"

            async def send_json(self, message):
                raise Exception("Connection broken")

        broken_ws = BrokenWebSocket()

        # 添加到管理器
        manager.active_connections.append(broken_ws)
        manager.connection_metadata[broken_ws] = {
            "client_id": "broken_client",
            "connected_at": datetime.now().isoformat(),
        }

        # 尝试发送消息
        await manager.send_message(broken_ws, {"type": "test"})

        # 连接应该仍在列表中（因为 send_message 不会自动移除）
        # 但 broadcast 会检测到错误并清理

        # 广播消息
        await manager.broadcast({"type": "test_broadcast"})

        # 失败的连接应该被清理
        assert broken_ws not in manager.active_connections
        assert broken_ws not in manager.connection_metadata


@pytest.mark.asyncio
async def test_manager_singleton():
    """
    测试连接管理器单例模式
    """
    manager1 = get_connection_manager()
    manager2 = get_connection_manager()

    # 应该返回同一个实例
    assert manager1 is manager2
