"""
@file: routes.py
@description: API 路由定义，提供 RESTful API 接口
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 定义所有 API 路由和处理函数
2. 实现请求验证和错误处理
3. 提供统计数据查询接口
4. 提供数据导出接口
5. 提供配置查询接口
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ..core.config import get_settings, Settings
from ..core.logger import get_logger
from ..core.schemas import (
    ApiResponse,
    ExportRequest,
    ExportResponse,
    StatsCache,
    DailyActivity,
)
from ..core.stats_reader import StatsReader
from ..db.database import get_database, Database
from ..core.export_service import ExportService


logger = get_logger(__name__)


# ============================================
# 创建 API 路由器
# ============================================
router = APIRouter()


# ============================================
# 依赖注入函数
# ============================================
async def get_stats_reader() -> StatsReader:
    """
    获取统计数据读取器实例

    Returns:
        StatsReader: 统计数据读取器
    """
    return StatsReader()


async def get_export_service() -> ExportService:
    """
    获取导出服务实例

    Returns:
        ExportService: 导出服务
    """
    return ExportService()


# ============================================
# 健康检查接口
# ============================================
@router.get("/health", response_model=ApiResponse, tags=["系统"])
async def health_check():
    """
    健康检查

    检查服务运行状态和依赖组件是否正常

    Returns:
        ApiResponse: 健康状态响应
    """
    try:
        settings = get_settings()

        # ============================================
        # 检查 Claude 目录是否存在
        # ============================================
        claude_dir = settings.get_claude_dir_path()
        claude_dir_exists = claude_dir.exists()

        # ============================================
        # 检查数据库连接
        # ============================================
        try:
            db = await get_database()
            conn = await db.connect()
            await conn.execute("SELECT 1")
            db_connected = True
        except Exception as e:
            logger.error(f"数据库连接检查失败: {e}")
            db_connected = False

        # ============================================
        # 构建响应
        # ============================================
        health_status = {
            "status": "healthy" if claude_dir_exists and db_connected else "degraded",
            "claude_dir_exists": claude_dir_exists,
            "database_connected": db_connected,
            "timestamp": datetime.now().isoformat(),
        }

        return ApiResponse(
            success=True,
            message="服务运行正常",
            data=health_status,
        )

    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 获取当前统计数据
# ============================================
@router.get("/stats", response_model=ApiResponse, tags=["统计"])
async def get_stats(
    reader: StatsReader = Depends(get_stats_reader),
):
    """
    获取当前统计数据

    从 stats-cache.json 读取最新的统计数据

    Returns:
        ApiResponse: 包含统计数据的响应
    """
    try:
        # ============================================
        # 读取统计缓存
        # ============================================
        stats = await reader.get_total_stats()

        if stats is None:
            raise HTTPException(
                status_code=404,
                detail="统计数据不存在，请检查 Claude CLI 是否已安装和使用"
            )

        # ============================================
        # 返回响应
        # ============================================
        return ApiResponse(
            success=True,
            message="获取统计数据成功",
            data=stats.model_dump(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 获取每日统计数据
# ============================================
@router.get("/stats/daily", response_model=ApiResponse, tags=["统计"])
async def get_daily_stats(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    reader: StatsReader = Depends(get_stats_reader),
):
    """
    获取每日统计数据

    返回指定日期范围内的每日活动数据

    Args:
        start_date: 开始日期，格式 YYYY-MM-DD
        end_date: 结束日期，格式 YYYY-MM-DD

    Returns:
        ApiResponse: 包含每日统计数据的响应
    """
    try:
        # ============================================
        # 查询每日活动数据
        # ============================================
        daily_activities = await reader.get_daily_activity(
            start_date=start_date,
            end_date=end_date,
        )

        # ============================================
        # 返回响应
        # ============================================
        return ApiResponse(
            success=True,
            message=f"获取每日统计数据成功，共 {len(daily_activities)} 天",
            data=[activity.model_dump() for activity in daily_activities],
        )

    except Exception as e:
        logger.error(f"获取每日统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 获取模型统计数据
# ============================================
@router.get("/stats/models", response_model=ApiResponse, tags=["统计"])
async def get_model_stats(
    reader: StatsReader = Depends(get_stats_reader),
):
    """
    获取模型统计数据

    返回所有模型的 Token 使用情况

    Returns:
        ApiResponse: 包含模型统计数据的响应
    """
    try:
        # ============================================
        # 查询模型使用数据
        # ============================================
        model_usage = await reader.get_model_usage()

        # ============================================
        # 转换为列表格式（按使用量排序）
        # ============================================
        models = [
            {
                "model_name": model_name,
                **usage.model_dump(),
            }
            for model_name, usage in sorted(
                model_usage.items(),
                key=lambda x: x[1].total_with_cache,
                reverse=True,
            )
        ]

        # ============================================
        # 返回响应
        # ============================================
        return ApiResponse(
            success=True,
            message=f"获取模型统计数据成功，共 {len(models)} 个模型",
            data=models,
        )

    except Exception as e:
        logger.error(f"获取模型统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 获取趋势数据
# ============================================
@router.get("/stats/trends", response_model=ApiResponse, tags=["统计"])
async def get_trends(
    days: int = Query(30, ge=1, le=365, description="统计天数，范围 1-365"),
    reader: StatsReader = Depends(get_stats_reader),
):
    """
    获取趋势数据

    计算指定天数内的 Token 使用趋势

    Args:
        days: 统计天数，默认 30 天

    Returns:
        ApiResponse: 包含趋势数据的响应
    """
    try:
        # ============================================
        # 计算日期范围
        # ============================================
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)

        # ============================================
        # 查询每日活动数据
        # ============================================
        daily_activities = await reader.get_daily_activity(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
        )

        # ============================================
        # 计算趋势统计
        # ============================================
        total_tokens = sum(activity.total_tokens for activity in daily_activities)
        total_sessions = sum(activity.session_count for activity in daily_activities)
        avg_tokens_per_day = total_tokens / days if days > 0 else 0
        avg_tokens_per_session = total_tokens / total_sessions if total_sessions > 0 else 0

        # ============================================
        # 返回响应
        # ============================================
        return ApiResponse(
            success=True,
            message=f"获取 {days} 天趋势数据成功",
            data={
                "days": days,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "total_tokens": total_tokens,
                "total_sessions": total_sessions,
                "avg_tokens_per_day": round(avg_tokens_per_day, 2),
                "avg_tokens_per_session": round(avg_tokens_per_session, 2),
                "daily_data": [activity.model_dump() for activity in daily_activities],
            },
        )

    except Exception as e:
        logger.error(f"获取趋势数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 获取历史数据
# ============================================
@router.get("/stats/history", response_model=ApiResponse, tags=["统计"])
async def get_history(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    limit: int = Query(100, ge=1, le=1000, description="最大返回条数"),
    db: Database = Depends(get_database),
):
    """
    获取历史数据

    从数据库查询历史统计快照

    Args:
        start_date: 开始日期
        end_date: 结束日期
        limit: 最大返回条数

    Returns:
        ApiResponse: 包含历史数据的响应
    """
    try:
        # ============================================
        # 查询历史数据
        # ============================================
        history = await db.get_historical_stats(
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )

        # ============================================
        # 返回响应
        # ============================================
        return ApiResponse(
            success=True,
            message=f"获取历史数据成功，共 {len(history)} 条记录",
            data=history,
        )

    except Exception as e:
        logger.error(f"获取历史数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 导出数据
# ============================================
@router.post("/export", response_model=ExportResponse, tags=["数据"])
async def export_data(
    request: ExportRequest,
    reader: StatsReader = Depends(get_stats_reader),
    export_service: ExportService = Depends(get_export_service),
):
    """
    导出数据

    根据请求参数导出统计数据到指定格式

    Args:
        request: 导出请求参数

    Returns:
        ExportResponse: 导出结果响应
    """
    try:
        # ============================================
        # 查询数据
        # ============================================
        daily_activities = await reader.get_daily_activity(
            start_date=request.start_date,
            end_date=request.end_date,
        )

        # ============================================
        # 模型过滤
        # ============================================
        if request.models:
            filtered_activities = []
            for activity in daily_activities:
                filtered_models = [
                    model for model in activity.models
                    if model.model_name in request.models
                ]
                if filtered_models:
                    activity.models = filtered_models
                    filtered_activities.append(activity)
            daily_activities = filtered_activities

        # ============================================
        # 执行导出
        # ============================================
        result = await export_service.export_data(
            data=daily_activities,
            format=request.format,
            filename=f"claude_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        )

        # ============================================
        # 返回响应
        # ============================================
        return result

    except Exception as e:
        logger.error(f"导出数据失败: {e}")
        return ExportResponse(
            success=False,
            message=f"导出失败: {str(e)}",
        )


# ============================================
# 获取配置信息
# ============================================
@router.get("/config", response_model=ApiResponse, tags=["系统"])
async def get_config():
    """
    获取配置信息

    返回当前应用的配置信息（不含敏感数据）

    Returns:
        ApiResponse: 包含配置信息的响应
    """
    try:
        settings = get_settings()

        # ============================================
        # 构建配置信息（排除敏感数据）
        # ============================================
        config_data = {
            "backend_port": settings.backend_port,
            "log_level": settings.log_level,
            "debug": settings.debug,
            "api_prefix": settings.api_prefix,
            "claude_dir": str(settings.get_claude_dir_path()),
            "database_path": str(settings.get_database_path()),
        }

        # ============================================
        # 返回响应
        # ============================================
        return ApiResponse(
            success=True,
            message="获取配置信息成功",
            data=config_data,
        )

    except Exception as e:
        logger.error(f"获取配置信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
