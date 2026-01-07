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
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
import os

from .core.config import get_settings
from .core.logger import get_logger
from .core.file_watcher import get_file_watcher
from .api.websocket import router as websocket_router, get_connection_manager

logger = get_logger()


# ============================================
# 请求日志中间件
# ============================================
async def request_logging_middleware(request: Request, call_next):
    """
    请求日志中间件

    记录每个请求的方法、路径、耗时和状态码

    Args:
        request: FastAPI 请求对象
        call_next: 下一个中间件或路由处理函数

    Returns:
        Response: 响应对象
    """
    # 记录请求开始
    start_time = time.time()

    # 获取请求信息
    method = request.method
    url = request.url.path

    try:
        # 调用下一个处理器
        response = await call_next(request)

        # 记录请求结束
        process_time = time.time() - start_time
        status_code = response.status_code

        logger.info(
            f"{method} {url} - {status_code} - {process_time:.3f}s"
        )

        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)

        return response

    except Exception as e:
        # 记录错误
        process_time = time.time() - start_time
        logger.error(
            f"{method} {url} - ERROR - {process_time:.3f}s - {str(e)}",
            exc_info=True
        )
        raise


# ============================================
# 错误处理中间件
# ============================================
async def error_handling_middleware(request: Request, call_next):
    """
    错误处理中间件

    捕获所有未处理的异常并返回友好的错误信息

    Args:
        request: FastAPI 请求对象
        call_next: 下一个中间件或路由处理函数

    Returns:
        Response: 响应对象
    """
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"未处理的异常: {str(e)}", exc_info=True)

        # 返回 JSON 格式的错误信息
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "服务器内部错误",
                "error": str(e) if get_settings().debug else "服务器内部错误",
            }
        )


# ============================================
# 中间件配置函数
# ============================================
def setup_middlewares(app: FastAPI):
    """
    配置应用中间件

    按顺序添加各类中间件（注意：中间件执行顺序与添加顺序相反）

    Args:
        app: FastAPI 应用实例
    """
    settings = get_settings()

    # ============================================
    # 1. CORS 中间件（最外层，最先执行）
    # ============================================
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ============================================
    # 2. GZip 压缩中间件（压缩响应体）
    # ============================================
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ============================================
    # 3. 请求日志中间件
    # ============================================
    app.middleware("http")(request_logging_middleware)

    # ============================================
    # 4. 错误处理中间件（最内层，最后执行）
    # ============================================
    app.middleware("http")(error_handling_middleware)

    logger.info("中间件配置完成")


# ============================================
# 路由设置函数
# ============================================
def setup_routes(app: FastAPI):
    """
    配置应用路由

    将所有路由模块注册到 FastAPI 应用中

    Args:
        app: FastAPI 应用实例
    """
    # 导入 API 路由
    from .api.routes import router as api_router

    # 注册 WebSocket 路由
    app.include_router(websocket_router, tags=["WebSocket"])

    # 注册 API 路由（使用 API 前缀）
    settings = get_settings()
    app.include_router(
        api_router,
        prefix=settings.api_prefix,
        tags=["API"]
    )

    logger.info("路由注册完成")


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


# ============================================
# 应用工厂函数
# ============================================
def create_app() -> FastAPI:
    """
    创建并配置 FastAPI 应用实例（工厂模式）

    返回完全配置好的 FastAPI 应用，包括：
    - 生命周期管理
    - 中间件配置
    - 路由注册

    Returns:
        FastAPI: 配置完成的应用实例
    """
    # ============================================
    # 创建 FastAPI 应用实例
    # ============================================
    app = FastAPI(
        title="Claude Token Monitor API",
        description="Claude Token 使用监控系统 API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # ============================================
    # 配置中间件
    # ============================================
    setup_middlewares(app)

    # ============================================
    # 注册路由
    # ============================================
    setup_routes(app)

    # ============================================
    # 根路径和健康检查接口
    # ============================================
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

    logger.info("应用创建完成")

    return app


# ============================================
# 创建应用实例（用于 uvicorn 直接运行）
# ============================================
app = create_app()


# ============================================
# 主函数：启动 Uvicorn 服务器
# ============================================
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

