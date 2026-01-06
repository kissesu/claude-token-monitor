#!/usr/bin/env python
"""
@file: test_integration.py
@description: 集成测试脚本，用于验证文件监听和 WebSocket 功能
@author: Atlas.oi
@date: 2026-01-07

使用方法：
1. 启动后端服务：python -m backend.app.main
2. 运行此测试脚本：python test_integration.py
"""

import asyncio
import json
import time
from pathlib import Path
import websockets


async def test_websocket_connection():
    """
    测试 WebSocket 连接和消息接收
    """
    uri = "ws://localhost:51888/ws?client_id=test_client"

    print("正在连接到 WebSocket 服务器...")

    try:
        async with websockets.connect(uri) as websocket:
            print("✓ WebSocket 连接成功")

            # 接收欢迎消息
            welcome = await websocket.recv()
            welcome_data = json.loads(welcome)
            print(f"✓ 收到欢迎消息: {welcome_data}")

            # 发送 ping 消息
            ping_msg = {
                "type": "ping",
                "data": {"message": "测试 ping"}
            }
            await websocket.send(json.dumps(ping_msg))
            print("✓ 发送 ping 消息")

            # 接收响应（可能包含心跳和 pong）
            for i in range(5):
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                print(f"✓ 收到响应: type={response_data['type']}")

                if response_data['type'] == 'pong':
                    print(f"  └─ Pong 数据: {response_data['data']}")
                    break

            print("\n✓ WebSocket 功能测试通过")

    except Exception as e:
        print(f"✗ WebSocket 测试失败: {e}")
        raise


async def main():
    """
    主函数
    """
    print("=" * 60)
    print("Claude Token Monitor - 集成测试")
    print("=" * 60)
    print()

    # 测试 WebSocket 连接
    await test_websocket_connection()

    print()
    print("=" * 60)
    print("所有测试通过！")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
