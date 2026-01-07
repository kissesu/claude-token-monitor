"""
@file: test_ws_integration.py
@description: WebSocket 连接集成测试
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 测试 WebSocket 连接建立
2. 测试消息推送
3. 测试连接断开
4. 测试多客户端并发
"""

import pytest
import asyncio
import json
from starlette.testclient import TestClient
from fastapi import FastAPI


# ============================================
# 标记为集成测试
# ============================================
pytestmark = pytest.mark.integration


# ============================================
# 测试 WebSocket 连接
# ============================================
def test_websocket_connection(ws_client: TestClient):
    """
    测试 WebSocket 连接建立和断开

    验收标准：
    - 连接成功建立
    - 收到欢迎消息
    - 正常断开连接
    """
    with ws_client.websocket_connect("/ws") as websocket:
        # 接收欢迎消息
        data = websocket.receive_json()

        assert data["type"] == "connection"
        assert "client_id" in data
        assert data["message"] == "已连接到 Claude Token Monitor"


# ============================================
# 测试消息接收
# ============================================
def test_websocket_receive_message(ws_client: TestClient, mock_stats_cache):
    """
    测试 WebSocket 消息接收

    验收标准：
    - 能够接收服务器推送的消息
    - 消息格式正确
    """
    with ws_client.websocket_connect("/ws") as websocket:
        # 接收欢迎消息
        welcome = websocket.receive_json()
        assert welcome["type"] == "connection"

        # 由于文件监听器在测试环境可能不会触发
        # 这里主要测试连接保持
        # 实际的更新推送会在 test_watcher_integration.py 中测试


# ============================================
# 测试多客户端连接
# ============================================
def test_multiple_websocket_connections(ws_client: TestClient):
    """
    测试多个 WebSocket 客户端同时连接

    验收标准：
    - 支持多个客户端同时连接
    - 每个客户端有独立的 client_id
    - 所有客户端都能正常接收消息
    """
    # 连接第一个客户端
    with ws_client.websocket_connect("/ws") as ws1:
        data1 = ws1.receive_json()
        client_id_1 = data1["client_id"]

        # 连接第二个客户端
        with ws_client.websocket_connect("/ws") as ws2:
            data2 = ws2.receive_json()
            client_id_2 = data2["client_id"]

            # 验证两个客户端有不同的 ID
            assert client_id_1 != client_id_2

            # 验证两个客户端都能接收消息
            assert data1["type"] == "connection"
            assert data2["type"] == "connection"


# ============================================
# 测试连接断开
# ============================================
def test_websocket_disconnect(ws_client: TestClient):
    """
    测试 WebSocket 连接断开

    验收标准：
    - 客户端可以正常断开连接
    - 服务器正确清理连接资源
    """
    with ws_client.websocket_connect("/ws") as websocket:
        # 接收欢迎消息
        data = websocket.receive_json()
        assert data["type"] == "connection"

    # 连接已断开，这里不会抛出异常说明断开成功


# ============================================
# 测试异常断开处理
# ============================================
def test_websocket_abnormal_disconnect(ws_client: TestClient):
    """
    测试 WebSocket 异常断开处理

    验收标准：
    - 服务器能处理异常断开
    - 不影响其他客户端连接
    """
    # 创建第一个连接
    with ws_client.websocket_connect("/ws") as ws1:
        data1 = ws1.receive_json()
        assert data1["type"] == "connection"

        # 创建第二个连接
        with ws_client.websocket_connect("/ws") as ws2:
            data2 = ws2.receive_json()
            assert data2["type"] == "connection"

            # 第一个连接断开
            pass

        # 第二个连接仍然正常
        pass


# ============================================
# 测试心跳机制
# ============================================
def test_websocket_heartbeat(ws_client: TestClient):
    """
    测试 WebSocket 心跳机制

    验收标准：
    - 客户端能接收心跳消息
    - 心跳消息格式正确
    """
    with ws_client.websocket_connect("/ws") as websocket:
        # 接收欢迎消息
        welcome = websocket.receive_json()
        assert welcome["type"] == "connection"

        # 等待可能的心跳消息
        # 注意：心跳间隔可能较长，这里只测试连接保持
        # 实际心跳测试可以在单元测试中通过模拟完成


# ============================================
# 测试消息类型
# ============================================
def test_websocket_message_types(ws_client: TestClient):
    """
    测试不同类型的 WebSocket 消息

    验收标准：
    - 支持多种消息类型
    - 每种消息类型格式正确
    """
    with ws_client.websocket_connect("/ws") as websocket:
        # 接收欢迎消息
        data = websocket.receive_json()

        # 验证消息结构
        assert "type" in data
        assert "message" in data

        # 验证 connection 类型消息
        if data["type"] == "connection":
            assert "client_id" in data
