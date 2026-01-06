# ============================================
# Claude Token Monitor - Makefile
# @author Atlas.oi
# @date 2026-01-07
# ============================================

# 变量定义
DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_DEV := $(DOCKER_COMPOSE) -f docker-compose.dev.yml
IMAGE_NAME := claude-token-monitor
BACKEND_PORT := 51888
FRONTEND_PORT := 51173

# 平台检测
ifeq ($(OS),Windows_NT)
	DETECTED_OS := Windows
	RM := del /Q
	MKDIR := mkdir
else
	DETECTED_OS := $(shell uname -s)
	RM := rm -rf
	MKDIR := mkdir -p
endif

# 颜色定义（终端输出）
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help build start stop restart logs dev test clean clean-ports migrate health check-env setup

# ============================================
# 默认目标：显示帮助
# ============================================
help:
	@echo "$(GREEN)Claude Token Monitor - 可用命令$(NC)"
	@echo ""
	@echo "$(YELLOW)构建与部署$(NC)"
	@echo "  make build        - 构建 Docker 镜像"
	@echo "  make start        - 启动生产环境服务"
	@echo "  make stop         - 停止服务"
	@echo "  make restart      - 重启服务"
	@echo "  make logs         - 查看服务日志"
	@echo ""
	@echo "$(YELLOW)开发环境$(NC)"
	@echo "  make dev          - 启动开发环境（热重载）"
	@echo "  make dev-backend  - 仅启动后端开发环境"
	@echo "  make dev-frontend - 仅启动前端开发环境"
	@echo ""
	@echo "$(YELLOW)测试$(NC)"
	@echo "  make test         - 运行所有测试"
	@echo "  make test-backend - 运行后端测试"
	@echo "  make test-frontend- 运行前端测试"
	@echo "  make test-e2e     - 运行端到端测试"
	@echo "  make coverage     - 生成测试覆盖率报告"
	@echo ""
	@echo "$(YELLOW)数据库$(NC)"
	@echo "  make migrate      - 执行数据库迁移"
	@echo "  make db-shell     - 进入 SQLite 命令行"
	@echo "  make db-backup    - 备份数据库"
	@echo "  make db-restore   - 恢复数据库"
	@echo ""
	@echo "$(YELLOW)维护$(NC)"
	@echo "  make clean        - 清理容器和镜像"
	@echo "  make clean-ports  - 清理端口占用"
	@echo "  make clean-data   - 清理数据文件"
	@echo "  make health       - 检查服务健康状态"
	@echo ""
	@echo "$(YELLOW)工具$(NC)"
	@echo "  make check-env    - 检查环境配置"
	@echo "  make setup        - 初始化项目"
	@echo "  make lint         - 代码检查"
	@echo "  make format       - 代码格式化"
	@echo ""

# ============================================
# 环境检查
# ============================================
check-env:
	@echo "$(GREEN)检查环境配置...$(NC)"
	@echo "操作系统：$(DETECTED_OS)"
	@echo "Docker 版本："
	@docker --version || (echo "$(RED)错误：未安装 Docker$(NC)" && exit 1)
	@echo "Docker Compose 版本："
	@docker compose version || (echo "$(RED)错误：未安装 Docker Compose$(NC)" && exit 1)
	@echo ""
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)警告：未找到 .env 文件$(NC)"; \
		echo "正在从 .env.example 创建 .env..."; \
		cp .env.example .env; \
		echo "$(GREEN)✓ .env 文件已创建，请编辑配置$(NC)"; \
	else \
		echo "$(GREEN)✓ .env 文件存在$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✓ 环境检查完成$(NC)"

# ============================================
# 项目初始化
# ============================================
setup: check-env
	@echo "$(GREEN)初始化项目...$(NC)"
	@$(MKDIR) data
	@$(MKDIR) logs
	@$(MKDIR) exports
	@echo "$(GREEN)✓ 项目目录已创建$(NC)"
	@echo ""
	@echo "$(YELLOW)请执行以下步骤：$(NC)"
	@echo "  1. 编辑 .env 文件，设置 CLAUDE_DIR 路径"
	@echo "  2. 运行 'make build' 构建镜像"
	@echo "  3. 运行 'make start' 启动服务"

# ============================================
# 构建镜像
# ============================================
build: check-env
	@echo "$(GREEN)正在构建 Docker 镜像...$(NC)"
	docker build -t $(IMAGE_NAME):latest -f docker/Dockerfile .
	@echo "$(GREEN)✓ 镜像构建完成$(NC)"

# ============================================
# 启动服务（生产环境）
# ============================================
start: check-env
	@echo "$(GREEN)正在启动服务...$(NC)"
	@echo "平台：$(DETECTED_OS)"
	$(DOCKER_COMPOSE) up -d
	@sleep 2
	@echo ""
	@echo "$(GREEN)✓ 服务已启动$(NC)"
	@echo "访问地址：http://localhost:$(BACKEND_PORT)"
	@echo ""
	@make health

# ============================================
# 停止服务
# ============================================
stop:
	@echo "$(YELLOW)正在停止服务...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ 服务已停止$(NC)"

# ============================================
# 重启服务
# ============================================
restart: stop start

# ============================================
# 查看日志
# ============================================
logs:
	@echo "$(GREEN)查看服务日志（Ctrl+C 退出）$(NC)"
	$(DOCKER_COMPOSE) logs -f

# ============================================
# 启动开发环境
# ============================================
dev: check-env clean-ports
	@echo "$(GREEN)正在启动开发环境...$(NC)"
	$(DOCKER_COMPOSE_DEV) up
	@echo ""
	@echo "$(GREEN)✓ 开发环境已启动$(NC)"
	@echo "前端开发服务器：http://localhost:$(FRONTEND_PORT)"
	@echo "后端 API：http://localhost:$(BACKEND_PORT)"

# ============================================
# 仅启动后端开发环境
# ============================================
dev-backend: clean-ports
	@echo "$(GREEN)正在启动后端开发环境...$(NC)"
	cd backend && python -m app.main --reload

# ============================================
# 仅启动前端开发环境
# ============================================
dev-frontend: clean-ports
	@echo "$(GREEN)正在启动前端开发环境...$(NC)"
	cd frontend && pnpm install && pnpm run dev

# ============================================
# 运行所有测试
# ============================================
test: test-backend test-frontend
	@echo "$(GREEN)✓ 所有测试完成$(NC)"

# ============================================
# 运行后端测试
# ============================================
test-backend:
	@echo "$(GREEN)正在运行后端测试...$(NC)"
	cd backend && pytest -v --cov=app tests/
	@echo "$(GREEN)✓ 后端测试完成$(NC)"

# ============================================
# 运行前端测试
# ============================================
test-frontend:
	@echo "$(GREEN)正在运行前端测试...$(NC)"
	cd frontend && pnpm test
	@echo "$(GREEN)✓ 前端测试完成$(NC)"

# ============================================
# 运行端到端测试
# ============================================
test-e2e:
	@echo "$(GREEN)正在运行端到端测试...$(NC)"
	cd frontend && pnpm test:e2e
	@echo "$(GREEN)✓ 端到端测试完成$(NC)"

# ============================================
# 生成测试覆盖率报告
# ============================================
coverage:
	@echo "$(GREEN)生成测试覆盖率报告...$(NC)"
	cd backend && pytest --cov=app --cov-report=html tests/
	@echo "$(GREEN)✓ 覆盖率报告已生成：backend/htmlcov/index.html$(NC)"

# ============================================
# 代码检查
# ============================================
lint:
	@echo "$(GREEN)正在进行代码检查...$(NC)"
	@echo "后端代码检查..."
	cd backend && ruff check app/
	@echo "前端代码检查..."
	cd frontend && pnpm run lint
	@echo "$(GREEN)✓ 代码检查完成$(NC)"

# ============================================
# 代码格式化
# ============================================
format:
	@echo "$(GREEN)正在格式化代码...$(NC)"
	@echo "后端代码格式化..."
	cd backend && black app/
	@echo "前端代码格式化..."
	cd frontend && pnpm run format
	@echo "$(GREEN)✓ 代码格式化完成$(NC)"

# ============================================
# 数据库迁移
# ============================================
migrate:
	@echo "$(GREEN)正在执行数据库迁移...$(NC)"
	docker exec claude-monitor python scripts/migrate.py
	@echo "$(GREEN)✓ 迁移完成$(NC)"

# ============================================
# 进入 SQLite 命令行
# ============================================
db-shell:
	@echo "$(GREEN)进入 SQLite 命令行...$(NC)"
	sqlite3 data/monitor.db

# ============================================
# 备份数据库
# ============================================
db-backup:
	@echo "$(GREEN)备份数据库...$(NC)"
	@$(MKDIR) backups
	cp data/monitor.db backups/monitor-$(shell date +%Y%m%d-%H%M%S).db
	@echo "$(GREEN)✓ 数据库已备份到 backups/ 目录$(NC)"

# ============================================
# 恢复数据库
# ============================================
db-restore:
	@echo "$(YELLOW)可用的备份文件：$(NC)"
	@ls -lh backups/*.db
	@echo ""
	@echo "$(YELLOW)请手动复制备份文件到 data/monitor.db$(NC)"

# ============================================
# 健康检查
# ============================================
health:
	@echo "$(GREEN)检查服务健康状态...$(NC)"
	@curl -f http://localhost:$(BACKEND_PORT)/api/v1/health 2>/dev/null && \
		echo "$(GREEN)✓ 服务运行正常$(NC)" || \
		echo "$(RED)✗ 服务未响应$(NC)"

# ============================================
# 清理容器和镜像
# ============================================
clean:
	@echo "$(YELLOW)正在清理容器和镜像...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	@echo "$(GREEN)✓ 清理完成$(NC)"

# ============================================
# 清理端口占用（跨平台）
# ============================================
clean-ports:
	@echo "$(GREEN)清理端口占用...$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(BACKEND_PORT)') do taskkill /F /PID %%a 2>nul || exit 0
	@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(FRONTEND_PORT)') do taskkill /F /PID %%a 2>nul || exit 0
else
	@lsof -ti:$(BACKEND_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:$(FRONTEND_PORT) | xargs kill -9 2>/dev/null || true
endif
	@echo "$(GREEN)✓ 端口清理完成$(NC)"

# ============================================
# 清理数据文件
# ============================================
clean-data:
	@echo "$(RED)警告：此操作将删除所有数据文件$(NC)"
	@echo "按 Ctrl+C 取消，按 Enter 继续..."
	@read confirm
	$(RM) data/*.db
	$(RM) logs/*.log
	$(RM) exports/*
	@echo "$(GREEN)✓ 数据文件已清理$(NC)"

# ============================================
# Docker 镜像优化
# ============================================
optimize:
	@echo "$(GREEN)优化 Docker 镜像...$(NC)"
	docker image prune -f
	@echo "$(GREEN)✓ 镜像优化完成$(NC)"

# ============================================
# 查看资源占用
# ============================================
stats:
	@echo "$(GREEN)服务资源占用情况：$(NC)"
	docker stats claude-monitor --no-stream

# ============================================
# 进入容器 Shell
# ============================================
shell:
	@echo "$(GREEN)进入容器 Shell...$(NC)"
	docker exec -it claude-monitor sh

# ============================================
# 查看服务状态
# ============================================
status:
	@echo "$(GREEN)服务状态：$(NC)"
	$(DOCKER_COMPOSE) ps

# ============================================
# 导出配置
# ============================================
export-config:
	@echo "$(GREEN)导出当前配置...$(NC)"
	$(DOCKER_COMPOSE) config > docker-compose.generated.yml
	@echo "$(GREEN)✓ 配置已导出到 docker-compose.generated.yml$(NC)"

# ============================================
# 版本信息
# ============================================
version:
	@echo "$(GREEN)Claude Token Monitor$(NC)"
	@echo "版本：1.0.0"
	@echo "作者：Atlas.oi"
	@echo "许可证：MIT"
