"""
@file: main.py
@description: FastAPI 应用主入口文件
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 初始化 FastAPI 应用
2. 配置路由和中间件
3. 提供健康检查接口
4. 集成文件监听器和 WebSocket 实时推送
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from .core.config import get_settings
from .core.logger import get_logger
from .core.file_watcher import get_file_watcher
from .api.websocket import router as websocket_router, get_connection_manager

logger = get_logger()


# ============================================
# 应用生命周期管理
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理

    在应用启动时初始化资源，在应用关闭时清理资源
    """
    logger.info("应用启动中...")

    # ============================================
    # 启动时：初始化文件监听器
    # ============================================
    connection_manager = get_connection_manager()

    # 定义文件变化回调函数
    async def on_file_changed(file_path: str):
        """
        文件变化回调函数

        Args:
            file_path: 变化的文件路径
        """
        logger.info(f"检测到文件变化: {file_path}")

        # 通过 WebSocket 广播更新
        await connection_manager.send_stats_update(file_path)

    # 获取文件监听器并启动
    file_watcher = get_file_watcher(
        callback=on_file_changed,
        debounce_seconds=0.5,
    )

    try:
        # 获取事件循环
        loop = asyncio.get_event_loop()

        # 启动文件监听
        file_watcher.start_watching(loop=loop)

        logger.info("文件监听器启动成功")

    except Exception as e:
        logger.error(f"启动文件监听器失败: {e}", exc_info=True)

    logger.info("应用启动完成")

    # ============================================
    # yield 后的代码在应用关闭时执行
    # ============================================
    yield

    # ============================================
    # 关闭时：清理资源
    # ============================================
    logger.info("应用关闭中...")

    # 停止文件监听器
    try:
        file_watcher.stop_watching()
        logger.info("文件监听器已停止")
    except Exception as e:
        logger.error(f"停止文件监听器失败: {e}", exc_info=True)

    # 清理 WebSocket 连接
    try:
        await connection_manager.cleanup()
        logger.info("WebSocket 连接已清理")
    except Exception as e:
        logger.error(f"清理 WebSocket 连接失败: {e}", exc_info=True)

    logger.info("应用关闭完成")


# 创建 FastAPI 应用实例
app = FastAPI(
    title="Claude Token Monitor API",
    description="Claude Token 使用监控系统 API",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置 CORS 中间件
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# 注册路由
# ============================================
# WebSocket 路由
app.include_router(websocket_router, tags=["WebSocket"])


@app.get("/api/v1/health")
async def health_check():
    """
    健康检查接口

    返回服务运行状态信息

    Returns:
        dict: 包含状态和版本信息的字典
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "claude-token-monitor"
    }


@app.get("/")
async def root():
    """
    根路径接口

    Returns:
        dict: 欢迎信息
    """
    return {
        "message": "Claude Token Monitor API",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


def main():
    """
    主函数：启动 Uvicorn 服务器
    """
    port = int(os.getenv("BACKEND_PORT", "51888"))

    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )


if __name__ == "__main__":
    main()
