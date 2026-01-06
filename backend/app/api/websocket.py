"""
@file: websocket.py
@description: WebSocket 处理器模块，实现实时消息推送功能
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 管理 WebSocket 连接（连接、断开、广播）
2. 发送统计数据更新消息
3. 心跳机制保持连接活跃
4. 自动清理断开的连接
5. 支持消息类型化和时间戳
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Set
from pathlib import Path

from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from fastapi.websockets import WebSocketState

from ..core.logger import get_logger
from ..core.config import get_settings

logger = get_logger()
router = APIRouter()


class ConnectionManager:
    """
    WebSocket 连接管理器

    管理所有活跃的 WebSocket 连接，提供消息广播和连接维护功能
    """

    def __init__(self):
        """
        初始化连接管理器
        """
        # 活跃的 WebSocket 连接集合
        self.active_connections: List[WebSocket] = []

        # 连接元数据（连接 ID、连接时间等）
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}

        # 心跳任务
        self._heartbeat_tasks: Set[asyncio.Task] = set()

        logger.info("WebSocket 连接管理器已初始化")

    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None) -> None:
        """
        接受新的 WebSocket 连接

        Args:
            websocket: WebSocket 连接对象
            client_id: 客户端 ID（可选）
        """
        await websocket.accept()

        self.active_connections.append(websocket)

        # 保存连接元数据
        self.connection_metadata[websocket] = {
            "client_id": client_id or f"client_{id(websocket)}",
            "connected_at": datetime.now().isoformat(),
            "last_heartbeat": datetime.now().isoformat(),
        }

        logger.info(
            f"WebSocket 连接已建立: "
            f"client_id={self.connection_metadata[websocket]['client_id']}, "
            f"总连接数={len(self.active_connections)}"
        )

        # 发送欢迎消息
        await self.send_message(
            websocket,
            {
                "type": "connected",
                "data": {
                    "client_id": self.connection_metadata[websocket]["client_id"],
                    "message": "WebSocket 连接成功",
                },
                "timestamp": datetime.now().isoformat(),
            }
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """
        断开 WebSocket 连接

        Args:
            websocket: WebSocket 连接对象
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        metadata = self.connection_metadata.pop(websocket, {})
        client_id = metadata.get("client_id", "unknown")

        logger.info(
            f"WebSocket 连接已断开: "
            f"client_id={client_id}, "
            f"剩余连接数={len(self.active_connections)}"
        )

    async def send_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """
        向单个 WebSocket 连接发送消息

        Args:
            websocket: WebSocket 连接对象
            message: 要发送的消息字典
        """
        try:
            # 确保消息包含时间戳
            if "timestamp" not in message:
                message["timestamp"] = datetime.now().isoformat()

            await websocket.send_json(message)

            logger.debug(
                f"消息已发送: "
                f"client_id={self.connection_metadata.get(websocket, {}).get('client_id')}, "
                f"type={message.get('type')}"
            )

        except Exception as e:
            logger.error(f"发送消息失败: {e}", exc_info=True)

            # 如果发送失败，可能连接已断开，尝试清理
            if websocket.client_state == WebSocketState.DISCONNECTED:
                self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """
        向所有连接广播消息

        Args:
            message: 要广播的消息字典
        """
        if not self.active_connections:
            logger.debug("没有活跃连接，跳过广播")
            return

        # 确保消息包含时间戳
        if "timestamp" not in message:
            message["timestamp"] = datetime.now().isoformat()

        logger.info(
            f"开始广播消息: type={message.get('type')}, "
            f"连接数={len(self.active_connections)}"
        )

        # 记录发送失败的连接
        failed_connections: List[WebSocket] = []

        # 并发发送消息
        tasks = []
        for connection in self.active_connections:
            task = asyncio.create_task(self._safe_send(connection, message, failed_connections))
            tasks.append(task)

        await asyncio.gather(*tasks, return_exceptions=True)

        # 清理失败的连接
        for connection in failed_connections:
            self.disconnect(connection)

        if failed_connections:
            logger.warning(f"广播时清理了 {len(failed_connections)} 个失败的连接")

    async def _safe_send(
        self,
        connection: WebSocket,
        message: Dict[str, Any],
        failed_connections: List[WebSocket]
    ) -> None:
        """
        安全地发送消息，捕获异常

        Args:
            connection: WebSocket 连接对象
            message: 要发送的消息
            failed_connections: 失败连接的列表（用于收集）
        """
        try:
            await connection.send_json(message)
        except Exception as e:
            logger.error(f"广播消息发送失败: {e}")
            failed_connections.append(connection)

    async def send_stats_update(self, file_path: str) -> None:
        """
        发送统计数据更新消息

        当 statsCache.json 文件变化时调用此方法

        Args:
            file_path: 变化的文件路径
        """
        logger.info(f"准备发送统计更新: file={file_path}")

        settings = get_settings()
        stats_cache_path = settings.get_claude_dir_path() / "statsCache.json"

        # 读取统计缓存文件
        stats_data = None
        if Path(file_path) == stats_cache_path and stats_cache_path.exists():
            try:
                with open(stats_cache_path, 'r', encoding='utf-8') as f:
                    stats_data = json.load(f)
            except Exception as e:
                logger.error(f"读取统计缓存失败: {e}", exc_info=True)

        # 构建更新消息
        message = {
            "type": "stats_update",
            "data": {
                "file_path": file_path,
                "stats": stats_data,
            },
            "timestamp": datetime.now().isoformat(),
        }

        # 广播消息
        await self.broadcast(message)

    async def handle_heartbeat(self, websocket: WebSocket) -> None:
        """
        处理心跳消息

        更新连接的最后心跳时间

        Args:
            websocket: WebSocket 连接对象
        """
        if websocket in self.connection_metadata:
            self.connection_metadata[websocket]["last_heartbeat"] = datetime.now().isoformat()

            logger.debug(
                f"收到心跳: "
                f"client_id={self.connection_metadata[websocket]['client_id']}"
            )

        # 返回心跳响应
        await self.send_message(
            websocket,
            {
                "type": "heartbeat",
                "data": {"status": "ok"},
                "timestamp": datetime.now().isoformat(),
            }
        )

    async def start_heartbeat_task(self, websocket: WebSocket, interval: int = 30) -> None:
        """
        启动心跳任务

        定期向客户端发送心跳消息，保持连接活跃

        Args:
            websocket: WebSocket 连接对象
            interval: 心跳间隔（秒），默认 30 秒
        """
        async def heartbeat_loop():
            while websocket in self.active_connections:
                try:
                    await self.send_message(
                        websocket,
                        {
                            "type": "heartbeat",
                            "data": {"status": "ok"},
                            "timestamp": datetime.now().isoformat(),
                        }
                    )
                    await asyncio.sleep(interval)
                except Exception as e:
                    logger.error(f"心跳任务异常: {e}", exc_info=True)
                    break

        task = asyncio.create_task(heartbeat_loop())
        self._heartbeat_tasks.add(task)

        # 任务完成后自动清理
        task.add_done_callback(self._heartbeat_tasks.discard)

        logger.debug(
            f"心跳任务已启动: "
            f"client_id={self.connection_metadata.get(websocket, {}).get('client_id')}, "
            f"interval={interval}s"
        )

    async def cleanup(self) -> None:
        """
        清理所有连接和资源

        在应用关闭时调用
        """
        logger.info("开始清理 WebSocket 连接...")

        # 取消所有心跳任务
        for task in self._heartbeat_tasks:
            task.cancel()

        await asyncio.gather(*self._heartbeat_tasks, return_exceptions=True)
        self._heartbeat_tasks.clear()

        # 关闭所有连接
        for connection in list(self.active_connections):
            try:
                await connection.close()
            except Exception as e:
                logger.error(f"关闭连接失败: {e}")

        self.active_connections.clear()
        self.connection_metadata.clear()

        logger.info("WebSocket 连接清理完成")


# ============================================
# 全局连接管理器实例（单例模式）
# ============================================
_connection_manager: Optional[ConnectionManager] = None


def get_connection_manager() -> ConnectionManager:
    """
    获取全局连接管理器实例（单例模式）

    Returns:
        ConnectionManager: 全局连接管理器对象
    """
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = ConnectionManager()
    return _connection_manager


# ============================================
# WebSocket 端点
# ============================================
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 端点处理器

    处理客户端的 WebSocket 连接请求

    Args:
        websocket: WebSocket 连接对象
    """
    manager = get_connection_manager()

    # 获取客户端 ID（从查询参数）
    client_id = websocket.query_params.get("client_id")

    try:
        # 接受连接
        await manager.connect(websocket, client_id)

        # 启动心跳任务
        await manager.start_heartbeat_task(websocket, interval=30)

        # 持续接收消息
        while True:
            try:
                # 接收客户端消息
                message = await websocket.receive_json()

                logger.debug(f"收到客户端消息: {message}")

                # 处理不同类型的消息
                message_type = message.get("type")

                if message_type == "heartbeat":
                    # 心跳消息
                    await manager.handle_heartbeat(websocket)

                elif message_type == "ping":
                    # Ping-Pong 测试
                    await manager.send_message(
                        websocket,
                        {
                            "type": "pong",
                            "data": message.get("data", {}),
                            "timestamp": datetime.now().isoformat(),
                        }
                    )

                else:
                    # 未知消息类型
                    logger.warning(f"未知消息类型: {message_type}")
                    await manager.send_message(
                        websocket,
                        {
                            "type": "error",
                            "data": {"message": f"未知消息类型: {message_type}"},
                            "timestamp": datetime.now().isoformat(),
                        }
                    )

            except WebSocketDisconnect:
                logger.info("客户端主动断开连接")
                break

            except Exception as e:
                logger.error(f"处理消息时发生错误: {e}", exc_info=True)

                # 发送错误消息
                try:
                    await manager.send_message(
                        websocket,
                        {
                            "type": "error",
                            "data": {"message": str(e)},
                            "timestamp": datetime.now().isoformat(),
                        }
                    )
                except:
                    break

    except Exception as e:
        logger.error(f"WebSocket 连接异常: {e}", exc_info=True)

    finally:
        # 断开连接
        manager.disconnect(websocket)
