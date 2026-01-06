#!/usr/bin/env python3
"""
@file: migrate.py
@description: 数据库迁移脚本，用于初始化或升级数据库结构
@author: Atlas.oi
@date: 2026-01-07

功能说明：
1. 初始化数据库表结构
2. 执行数据迁移
3. 提供版本管理
"""

import sys
import asyncio
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import get_database
from app.core.logger import get_logger
from app.core.config import get_settings


logger = get_logger(__name__)


async def run_migration():
    """
    执行数据库迁移

    创建或更新数据库表结构
    """
    try:
        logger.info("=" * 60)
        logger.info("开始数据库迁移")
        logger.info("=" * 60)

        # ============================================
        # 第一步：获取配置信息
        # ============================================
        settings = get_settings()
        db_path = settings.get_database_path()

        logger.info(f"数据库路径: {db_path}")

        # ============================================
        # 第二步：初始化数据库
        # ============================================
        db = await get_database()
        logger.info("数据库初始化完成")

        # ============================================
        # 第三步：验证表结构
        # ============================================
        conn = await db.connect()
        cursor = await conn.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table'
            ORDER BY name
        """)
        tables = await cursor.fetchall()

        logger.info("数据库表列表:")
        for table in tables:
            logger.info(f"  - {table[0]}")

        # ============================================
        # 第四步：关闭连接
        # ============================================
        await db.close()

        logger.info("=" * 60)
        logger.info("数据库迁移完成")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"数据库迁移失败: {e}")
        raise


def main():
    """
    主函数
    """
    try:
        asyncio.run(run_migration())
        sys.exit(0)

    except Exception as e:
        logger.error(f"执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
