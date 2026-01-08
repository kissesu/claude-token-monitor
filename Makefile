# ============================================
# Claude Token Monitor - Tauri Desktop Makefile
# @author Atlas.oi
# @date 2026-01-08
# ============================================

# 变量定义
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

.PHONY: help dev build clean test lint format clean-port

# ============================================
# 默认目标：显示帮助
# ============================================
help:
	@echo "$(GREEN)Claude Token Monitor (Tauri Desktop) - 可用命令$(NC)"
	@echo ""
	@echo "$(YELLOW)开发$(NC)"
	@echo "  make dev          - 启动开发环境 (pnpm tauri dev)"
	@echo "  make frontend     - 仅启动前端开发服务器"
	@echo ""
	@echo "$(YELLOW)构建$(NC)"
	@echo "  make build        - 构建生产版本"
	@echo "  make build-debug  - 构建调试版本"
	@echo ""
	@echo "$(YELLOW)测试$(NC)"
	@echo "  make test         - 运行所有测试"
	@echo "  make test-rust    - 运行 Rust 测试"
	@echo "  make test-react   - 运行 React 测试"
	@echo ""
	@echo "$(YELLOW)维护$(NC)"
	@echo "  make clean        - 清理构建产物"
	@echo "  make clean-port   - 清理端口占用"
	@echo "  make lint         - 代码检查"
	@echo "  make format       - 代码格式化"
	@echo ""

# ============================================
# 开发环境
# ============================================
dev: clean-port
	@echo "$(GREEN)启动 Tauri 开发环境...$(NC)"
	pnpm tauri dev

frontend: clean-port
	@echo "$(GREEN)启动前端开发服务器...$(NC)"
	pnpm dev

# ============================================
# 构建
# ============================================
build:
	@echo "$(GREEN)构建生产版本...$(NC)"
	pnpm tauri build

build-debug:
	@echo "$(GREEN)构建调试版本...$(NC)"
	pnpm tauri build --debug

# ============================================
# 测试
# ============================================
test: test-rust test-react
	@echo "$(GREEN)✓ 所有测试完成$(NC)"

test-rust:
	@echo "$(GREEN)运行 Rust 测试...$(NC)"
	cd src-tauri && cargo test

test-react:
	@echo "$(GREEN)运行 React 测试...$(NC)"
	pnpm test

# ============================================
# 代码检查与格式化
# ============================================
lint:
	@echo "$(GREEN)代码检查...$(NC)"
	pnpm lint
	cd src-tauri && cargo clippy

format:
	@echo "$(GREEN)代码格式化...$(NC)"
	pnpm format
	cd src-tauri && cargo fmt

# ============================================
# 清理
# ============================================
clean:
	@echo "$(YELLOW)清理构建产物...$(NC)"
	$(RM) dist
	$(RM) src-tauri/target
	$(RM) node_modules/.vite
	@echo "$(GREEN)✓ 清理完成$(NC)"

clean-port:
	@echo "$(GREEN)清理端口占用...$(NC)"
ifeq ($(DETECTED_OS),Windows)
	@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(FRONTEND_PORT)') do taskkill /F /PID %%a 2>nul || exit 0
else
	@lsof -ti:$(FRONTEND_PORT) | xargs kill -9 2>/dev/null || true
endif
	@echo "$(GREEN)✓ 端口清理完成$(NC)"

# ============================================
# Tauri 信息
# ============================================
info:
	@echo "$(GREEN)Tauri 环境信息：$(NC)"
	pnpm tauri info
