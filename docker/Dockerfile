/**
 * @file Dockerfile
 * @description Claude Token Monitor 生产环境多阶段构建文件
 * @author Atlas.oi
 * @date 2026-01-07
 */

# ============================================
# 第一阶段：前端构建
# 基于 Node.js 20 Alpine 进行前端资源构建
# ============================================
FROM node:20-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app/frontend

# 安装 pnpm
RUN npm install -g pnpm

# 复制前端依赖配置文件
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# 安装前端依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY frontend/ ./

# 构建前端静态资源
RUN pnpm run build

# ============================================
# 第二阶段：Python 依赖构建
# 构建 Python 依赖包，分离依赖安装和运行时环境
# ============================================
FROM python:3.11-alpine AS python-builder

# 设置工作目录
WORKDIR /app

# 安装编译依赖（某些 Python 包需要）
RUN apk add --no-cache \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev

# 复制后端依赖配置
COPY backend/requirements.txt ./

# 安装 Python 依赖到指定目录
RUN pip install --no-cache-dir --user -r requirements.txt

# ============================================
# 第三阶段：最终运行时镜像
# 基于 Python 3.11 Alpine 的最小化运行时环境
# ============================================
FROM python:3.11-alpine

# 设置元数据标签
LABEL maintainer="Atlas.oi" \
      version="1.0.0" \
      description="Claude Token Monitor - Token 使用监控系统"

# 设置工作目录
WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache \
    curl \
    sqlite \
    ca-certificates \
    tzdata

# 设置时区为上海
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# 从构建阶段复制 Python 依赖
COPY --from=python-builder /root/.local /home/appuser/.local

# 复制后端代码
COPY backend/ ./backend/

# 从前端构建阶段复制静态资源
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# 创建必要的目录
RUN mkdir -p /app/data /app/logs /app/exports && \
    chown -R appuser:appuser /app

# 切换到非 root 用户
USER appuser

# 设置 Python 路径
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 51888

# 健康检查
# 每30秒检查一次，超时3秒，重试3次后认为不健康
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:51888/api/v1/health || exit 1

# 设置启动命令
CMD ["python", "-m", "backend.app.main"]
