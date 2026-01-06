"""
@file: main.py
@description: FastAPI 应用主入口文件
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 初始化 FastAPI 应用
2. 配置路由和中间件
3. 提供健康检查接口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# 创建 FastAPI 应用实例
app = FastAPI(
    title="Claude Token Monitor API",
    description="Claude Token 使用监控系统 API",
    version="1.0.0",
)

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
