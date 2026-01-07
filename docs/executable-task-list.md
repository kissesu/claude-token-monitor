/**
 * @file executable-task-list.md
 * @description Claude Token Monitor 可执行任务清单 - 完整开发任务分解
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 可执行任务清单

## 项目概述

**核心原则**: 所有数据均来自 Claude Code 本地存储目录 `~/.claude/`，无网络请求或第三方服务依赖。

| 项目信息 | 值 |
|----------|-----|
| 预估总工时 | 17-29 天 |
| 后端代码量 | ~2,000 行 |
| 前端代码量 | ~3,000 行 |
| 测试覆盖率 | 后端 >80%，前端 >70% |

> **注**: 乐观估算 17-24 天（高效并行开发），保守估算 29 天（逐 Phase 串行开发）

---

## Phase 0: 项目初始化 (Day 0) ✅ 已完成

### P0-1: 项目结构创建 ✅
- [x] 创建项目根目录结构
- [x] 创建 `.env.example` 环境配置模板
- [x] 创建 `.gitignore` 文件
- [x] 创建 `README.md` 项目说明

**验收标准**: 项目目录结构完整，git 初始化成功 ✅

### P0-2: Docker 基础配置 ✅
- [x] 创建 `docker/Dockerfile` 多阶段构建文件
- [x] 创建 `docker/Dockerfile.dev` 开发环境文件
- [x] 创建 `docker-compose.yml` 生产配置
- [x] 创建 `docker-compose.dev.yml` 开发配置
- [x] 创建 `.dockerignore` 文件

**验收标准**: `docker compose config` 验证配置无误 ✅

### P0-3: Makefile 配置 ✅
- [x] 完善 `Makefile` 所有命令
- [x] 添加端口清理逻辑
- [x] 添加健康检查命令
- [x] 测试所有 make 命令

**验收标准**: `make help` 显示所有可用命令 ✅

---

## Phase 1: 后端基础设施 (Day 1-2) ✅ 已完成

### BE-1.1: 项目初始化 ✅
- [x] 创建 `backend/pyproject.toml`
- [x] 创建 `backend/requirements.txt`
- [x] 设置后端目录结构
- [x] 配置 ruff/black 代码格式化

**验收标准**: `pip install -e .` 成功执行 ✅

### BE-1.2: 配置管理模块 ✅
- [x] 创建 `backend/app/config.py`
- [x] 实现 `Settings` 类（Pydantic BaseSettings）
- [x] 支持环境变量覆盖
- [x] 支持 `.env` 文件加载
- [x] 路径自动检测（macOS/Linux/Windows）
- [x] 编写 `test_config.py` 测试

**验收标准**: 配置能正确读取和验证，测试覆盖率 >90% ✅

### BE-1.3: 日志配置模块 ✅
- [x] 创建 `backend/app/logger.py`
- [x] 配置结构化日志格式
- [x] 支持日志级别动态调整
- [x] 支持文件和控制台双输出
- [x] 添加请求 ID 追踪

**验收标准**: 日志正确输出到控制台和文件 ✅

### BE-1.4: 数据模型定义 ✅
- [x] 创建 `backend/app/schemas.py`
- [x] 定义 `StatsCache` 模型
- [x] 定义 `ModelUsage` 模型
- [x] 定义 `DailyActivity` 模型
- [x] 定义 `DailyModelTokens` 模型
- [x] 定义 `SessionInfo` 模型
- [x] 定义 `ExportRequest/ExportResponse` 模型
- [x] 添加数据验证规则
- [x] 编写 `test_schemas.py` 测试

**验收标准**: 所有模型能正确序列化/反序列化，测试覆盖率 >95% ✅

---

## Phase 2: 后端核心读取逻辑 (Day 3-4) ✅ 已完成

### BE-2.1: 统计数据读取器 ✅
- [x] 创建 `backend/app/core/stats_reader.py`
- [x] 实现 `StatsReader` 类
- [x] 实现 `read_stats_cache()` 方法
- [x] 实现 `parse_jsonl_files()` 方法
- [x] 实现 `get_model_usage()` 方法
- [x] 实现 `get_daily_activity()` 方法
- [x] 实现 `calculate_cache_hit_rate()` 方法
- [x] 安全的文件读取（异常处理）
- [x] 支持增量解析 JSONL
- [x] 编写 `test_stats_reader.py` 测试

**验收标准**: 能正确读取和解析本地数据文件，测试覆盖率 >90% ✅

### BE-2.2: 定价计算模块 ✅
- [x] 创建 `backend/app/pricing.py`
- [x] 定义 `ModelPricing` 数据类
- [x] 定义 `PRICING_CONFIG` 配置
- [x] 实现 `calculate_cost()` 函数
- [x] 实现 `normalize_model_name()` 函数
- [x] 支持多模型聚合计算
- [x] 支持时间范围筛选
- [x] 编写 `test_pricing.py` 测试

**定价配置 (2025年1月)**:
| 模型 | 输入 | 输出 | 缓存读取 | 缓存写入 |
|------|------|------|----------|----------|
| Opus 4.5 | $15/M | $75/M | $1.5/M | $18.75/M |
| Sonnet 4.5 | $3/M | $15/M | $0.3/M | $3.75/M |
| Haiku 4.5 | $0.8/M | $4/M | $0.08/M | $1/M |

**验收标准**: 费用计算结果与手动计算一致，测试覆盖率 >95% ✅

### BE-2.3: 数据处理器 ✅
- [x] 创建 `backend/app/core/data_processor.py`
- [x] 实现 `aggregate_daily_stats()` 函数
- [x] 实现 `aggregate_model_stats()` 函数
- [x] 实现 `calculate_trends()` 函数
- [x] 实现 `filter_by_date_range()` 函数
- [x] 编写 `test_data_processor.py` 测试

**验收标准**: 聚合数据正确，性能满足要求，测试覆盖率 >85% ✅

---

## Phase 3: 后端文件监听与实时更新 (Day 5-6) ✅ 已完成

### BE-3.1: 文件监听器 ✅
- [x] 创建 `backend/app/core/file_watcher.py`
- [x] 实现 `FileWatcher` 类
- [x] 实现 `watch_stats_cache()` 方法
- [x] 实现 `watch_jsonl_files()` 方法
- [x] 实现 `on_file_modified()` 回调
- [x] 实现 `start_watching()` 方法
- [x] 实现 `stop_watching()` 方法
- [x] 使用 watchdog 监听文件变化
- [x] 防抖处理（避免频繁触发）
- [x] 支持优雅停止
- [x] 编写 `test_file_watcher.py` 集成测试

**验收标准**: 文件变化能在 1 秒内检测到 ✅

### BE-3.2: WebSocket 处理器 ✅
- [x] 创建 `backend/app/api/websocket.py`
- [x] 实现 WebSocket 连接管理
- [x] 实现 `handle_websocket()` 处理器
- [x] 实现 `broadcast()` 广播方法
- [x] 实现 `send_stats_update()` 方法
- [x] 实现 `handle_heartbeat()` 心跳处理
- [x] 连接断开自动清理
- [x] 编写 `test_websocket.py` 集成测试

**验收标准**: WebSocket 连接稳定，消息实时推送 ✅

---

## Phase 4: 后端 API 与数据库 (Day 7-8) ✅ 已完成

### BE-4.1: 数据库模块 ✅
- [x] 创建 `backend/app/db/database.py`
- [x] 创建 `backend/app/db/models.py`
- [x] 实现数据库连接池
- [x] 定义数据库表结构
- [x] 实现 `init_db()` 初始化
- [x] 实现 `save_stats_snapshot()` 保存快照
- [x] 实现 `get_historical_stats()` 获取历史
- [x] 实现 `cleanup_old_data()` 数据清理
- [x] 创建 `backend/scripts/migrate.py` 迁移脚本
- [x] 编写 `test_database.py` 测试

**验收标准**: 数据库操作正确，迁移脚本可执行 ✅

### BE-4.2: API 路由 ✅
- [x] 创建 `backend/app/api/routes.py`
- [x] 实现 `GET /api/v1/health` 健康检查
- [x] 实现 `GET /api/v1/stats` 获取当前统计
- [x] 实现 `GET /api/v1/stats/daily` 获取每日统计
- [x] 实现 `GET /api/v1/stats/models` 获取模型统计
- [x] 实现 `GET /api/v1/stats/trends` 获取趋势数据
- [x] 实现 `GET /api/v1/stats/history` 获取历史数据
- [x] 实现 `POST /api/v1/export` 导出数据
- [x] 实现 `GET /api/v1/config` 获取配置
- [x] 添加请求验证
- [x] 添加错误处理中间件
- [x] 添加 CORS 配置
- [x] 编写 `test_routes.py` API 测试

**验收标准**: 所有 API 端点正常工作 ✅

### BE-4.3: 导出服务 ✅
- [x] 创建 `backend/app/core/export_service.py`
- [x] 实现 CSV 导出
- [x] 实现 JSON 导出
- [x] 支持时间范围筛选
- [x] 支持字段选择
- [x] 编写 `test_export_service.py` 测试

**验收标准**: 导出文件格式正确，数据完整 ✅

---

## Phase 5: 后端集成与测试 (Day 9) ✅ 已完成

### BE-5.1: 应用入口 ✅
- [x] 创建 `backend/app/main.py`
- [x] 实现 `create_app()` 应用工厂
- [x] 实现 `setup_routes()` 路由配置
- [x] 实现 `setup_middlewares()` 中间件配置
- [x] 实现 `start_background_tasks()` 后台任务
- [x] 实现 `cleanup()` 资源清理
- [x] 配置静态文件服务
- [x] 实现优雅关闭
- [x] 编写启动脚本

**验收标准**: 应用能正常启动和关闭 ✅

### BE-5.2: 后端集成测试 ✅
- [x] 创建 `backend/tests/conftest.py` pytest 配置
- [x] API 端点集成测试 (`test_api_integration.py`)
- [x] WebSocket 集成测试 (`test_ws_integration.py`)
- [x] 文件监听集成测试 (`test_watcher_integration.py`)
- [x] 数据库集成测试 (`test_db_integration.py`)
- [x] 端到端流程测试

**验收标准**: 测试覆盖率 >80% ✅

### BE-5.3: 后端性能测试 ✅
- [x] API 响应时间测试（P99 < 200ms）
- [x] WebSocket 延迟测试（< 100ms）
- [x] 内存占用测试（< 100MB）
- [x] 并发连接测试（> 100 连接）

**验收标准**: 性能指标满足要求 ✅

---

## Phase 6: 前端项目初始化 (Day 10-11) ✅ 已完成

### FE-1.1: 项目搭建 ✅
- [x] 使用 Vite 创建 Svelte + TypeScript 项目
- [x] 安装并配置 Skeleton UI
- [x] 安装并配置 Layerchart
- [x] 配置 ESLint + Prettier
- [x] 配置路径别名 `$lib`
- [x] 设置前端目录结构

**验收标准**: `pnpm dev` 能正常启动开发服务器 ✅

### FE-1.2: 类型定义 ✅
- [x] 创建 `frontend/src/lib/types/stats.ts`
- [x] 定义 `StatsCache` 接口
- [x] 定义 `ModelUsage` 接口
- [x] 定义 `DailyActivity` 接口
- [x] 创建 `frontend/src/lib/types/api.ts`
- [x] 创建 `frontend/src/lib/types/chart.ts`
- [x] 添加类型导出

**验收标准**: TypeScript 编译无类型错误 ✅

### FE-1.3: 全局样式配置 ✅
- [x] 配置 Skeleton UI 主题
- [x] 定义 CSS 变量（颜色、间距、圆角）
- [x] 配置 Dark/Light 主题色板
- [x] 添加全局响应式断点

**验收标准**: 主题切换正常工作 ✅

---

## Phase 7: 前端基础组件 (Day 12-14) ✅ 已完成

### FE-2.1: StatCard 组件 ✅
- [x] 创建 `frontend/src/lib/components/common/StatCard.svelte`
- [x] 实现基础布局
- [x] 支持趋势指示器（上升/下降）
- [x] 支持图标显示
- [x] 添加动画效果
- [x] 编写 `StatCard.test.ts` 测试

**验收标准**: 组件可复用，测试覆盖率 >90% ✅

### FE-2.2: LoadingSpinner 组件 ✅
- [x] 创建 `frontend/src/lib/components/common/LoadingSpinner.svelte`
- [x] 实现多种尺寸（sm/md/lg）
- [x] 支持自定义颜色
- [x] 添加加载文本选项

### FE-2.3: ErrorMessage 组件 ✅
- [x] 创建 `frontend/src/lib/components/common/ErrorMessage.svelte`
- [x] 支持多种错误类型
- [x] 支持重试按钮
- [x] 支持关闭功能

### FE-2.4: DateRangePicker 组件 ✅
- [x] 创建 `frontend/src/lib/components/common/DateRangePicker.svelte`
- [x] 实现日期范围选择
- [x] 支持快捷选项（今日/本周/本月）
- [x] 支持自定义范围
- [x] 编写 `DateRangePicker.test.ts` 测试

**验收标准**: 所有通用组件可复用，测试覆盖率 >80% ✅

### FE-2.5: 布局组件 ✅
- [x] 创建 `frontend/src/lib/components/layout/Header.svelte`
- [x] 创建 `frontend/src/lib/components/layout/ThemeToggle.svelte`
- [x] 创建 `frontend/src/lib/components/layout/Footer.svelte`
- [x] 实现响应式适配
- [x] 保存用户主题偏好到 localStorage

**验收标准**: 布局组件在各种屏幕尺寸下正常显示 ✅

---

## Phase 8: 前端图表组件 (Day 15-18) ✅ 已完成

### FE-3.1: TrendChart 组件 ✅
- [x] 创建 `frontend/src/lib/components/charts/TrendChart.svelte`
- [x] 实现折线图基础功能
- [x] 支持多数据系列
- [x] 支持缩放和平移
- [x] 添加 Tooltip 交互
- [x] 响应式适配
- [x] 编写 `TrendChart.test.ts` 测试

**验收标准**: 图表渲染流畅，交互响应 <50ms ✅

### FE-3.2: ModelPieChart 组件 ✅
- [x] 创建 `frontend/src/lib/components/charts/ModelPieChart.svelte`
- [x] 实现饼图/环形图
- [x] 显示各模型 token 占比
- [x] 支持图例交互
- [x] 添加悬浮详情
- [x] 编写 `ModelPieChart.test.ts` 测试

### FE-3.3: ActivityHeatmap 组件 ✅
- [x] 创建 `frontend/src/lib/components/charts/ActivityHeatmap.svelte`
- [x] 实现日历热力图
- [x] 显示每日消息数量
- [x] 支持颜色强度映射
- [x] 添加悬浮详情
- [x] 编写 `ActivityHeatmap.test.ts` 测试

### FE-3.4: CostChart 组件 ✅
- [x] 创建 `frontend/src/lib/components/charts/CostChart.svelte`
- [x] 实现堆叠柱状图
- [x] 显示各模型费用
- [x] 支持时间范围切换
- [x] 添加费用汇总
- [x] 编写 `CostChart.test.ts` 测试

**验收标准**: 所有图表组件渲染正确，交互流畅 ✅

---

## Phase 9: 前端状态管理与服务 (Day 19-21) ✅ 已完成

### FE-4.1: statsStore ✅
- [x] 创建 `frontend/src/lib/stores/statsStore.ts`
- [x] 实现 `stats` 原始数据 Store
- [x] 实现 `loading` 状态 Store
- [x] 实现 `error` 错误 Store
- [x] 实现 `cacheHitRate` 派生 Store
- [x] 实现 `totalCost` 派生 Store
- [x] 实现 `totalTokens` 派生 Store
- [x] 实现 `loadStats()` 函数
- [x] 编写 `statsStore.test.ts` 测试

**验收标准**: 状态管理正确，测试覆盖率 >95% ✅

### FE-4.2: wsStore ✅
- [x] 创建 `frontend/src/lib/stores/wsStore.ts`
- [x] 实现 `wsStatus` 连接状态 Store
- [x] 实现 `wsError` 错误 Store
- [x] 编写 `wsStore.test.ts` 测试

### FE-4.3: themeStore ✅
- [x] 创建 `frontend/src/lib/stores/themeStore.ts`
- [x] 实现主题状态
- [x] 实现 localStorage 持久化
- [x] 实现系统主题检测
- [x] 编写 `themeStore.test.ts` 测试

### FE-4.4: API 服务 ✅
- [x] 创建 `frontend/src/lib/services/api.ts`
- [x] 实现 `fetchStats()` 函数
- [x] 实现 `fetchDailyStats()` 函数
- [x] 实现 `exportData()` 函数
- [x] 添加错误处理
- [x] 添加请求超时
- [x] 添加请求重试
- [x] 编写 `api.test.ts` 测试

### FE-4.5: WebSocket 服务 ✅
- [x] 创建 `frontend/src/lib/services/websocket.ts`
- [x] 实现 `WebSocketService` 类
- [x] 实现 `connect()` 方法
- [x] 实现 `disconnect()` 方法
- [x] 实现自动重连（指数退避）
- [x] 实现心跳检测
- [x] 实现消息解析
- [x] 编写 `websocket.test.ts` 测试

**验收标准**: WebSocket 连接稳定 ✅

---

## Phase 10: 前端仪表板页面 (Day 22-25) ✅ 已完成

### FE-5.1: StatsOverview 面板 ✅
- [x] 创建 `frontend/src/lib/components/dashboard/StatsOverview.svelte`
- [x] 显示总 Token 数
- [x] 显示缓存命中率
- [x] 显示总费用估算
- [x] 显示会话数量
- [x] 集成 StatCard 组件
- [x] 添加实时更新指示

### FE-5.2: ModelUsagePanel 面板 ✅
- [x] 创建 `frontend/src/lib/components/dashboard/ModelUsagePanel.svelte`
- [x] 显示各模型 Token 用量
- [x] 集成饼图组件
- [x] 支持模型筛选
- [x] 添加详细数据表格

### FE-5.3: DailyActivityPanel 面板 ✅
- [x] 创建 `frontend/src/lib/components/dashboard/DailyActivityPanel.svelte`
- [x] 显示每日消息趋势
- [x] 集成热力图组件
- [x] 支持日期范围选择
- [x] 显示高峰时段

### FE-5.4: CostEstimatePanel 面板 ✅
- [x] 创建 `frontend/src/lib/components/dashboard/CostEstimatePanel.svelte`
- [x] 显示各模型费用
- [x] 集成费用图表
- [x] 显示费用趋势
- [x] 添加费用明细

### FE-5.5: 主页面集成 ✅
- [x] 更新 `frontend/src/App.svelte`
- [x] 集成所有面板组件
- [x] 实现响应式布局（Grid）
- [x] 添加加载状态
- [x] 添加错误处理
- [x] 实现数据刷新

**验收标准**: 仪表板显示完整，数据实时更新 ✅

---

## Phase 11: 前端导出与设置 (Day 26-27) ✅ 已完成

### FE-6.1: 导出功能 ✅
- [x] 创建 `frontend/src/lib/services/export.ts`
- [x] 实现 CSV 导出
- [x] 实现 JSON 导出
- [x] 添加导出进度指示
- [x] 支持时间范围选择
- [x] 支持字段选择

### FE-6.2: 设置面板 ✅
- [x] 创建 `frontend/src/lib/components/Settings.svelte`
- [x] 主题设置
- [x] 刷新频率设置
- [x] 通知设置
- [x] 关于信息

**验收标准**: 导出功能正常，设置能持久化 ✅

### FE-6.3: 前端构建验证 ✅
- [x] TypeScript 类型检查通过
- [x] `pnpm run build` 构建成功
- [x] 开发服务器正常启动
- [x] 页面正确渲染

**验收标准**: 前端应用能正常构建和运行 ✅

---

## Phase 12: 前端测试与优化 (Day 28-29)

### FE-7.1: 单元测试 ✅
- [x] 配置 `frontend/vitest.config.ts`
- [x] 创建 `frontend/tests/setup.ts`
- [x] 组件单元测试（Vitest + Testing Library）
- [x] Store 单元测试（statsStore, wsStore, themeStore）
- [x] 工具函数单元测试
- [x] 服务单元测试（API, WebSocket）
- [x] 测试覆盖率达标

### FE-7.2: E2E 测试 ✅
- [x] 配置 `frontend/playwright.config.ts`
- [x] 创建测试 fixtures（`tests/e2e/fixtures.ts`）
- [x] 创建 `frontend/tests/e2e/dashboard.spec.ts`
- [x] 创建 `frontend/tests/e2e/responsive.spec.ts`
- [x] 创建 `frontend/tests/e2e/interactions.spec.ts`
- [x] 页面加载测试
- [x] 数据显示测试
- [x] 交互功能测试
- [x] 主题切换测试
- [x] 响应式布局测试
- [x] 生成 `PHASE_12_FE-7.2_E2E_TESTS.md` 完成报告

### FE-7.3: 性能优化 ✅
- [x] 代码分割（lazy loading + manual chunks）
- [x] 资源优化（Gzip + Brotli 压缩）
- [x] 构建产物优化（Tree-shaking + minify）
- [x] 预加载策略（DNS prefetch + modulepreload）
- [x] Lighthouse 评分达 100 分（超过 >90 目标）
- [x] 生成 `PERFORMANCE_OPTIMIZATION_REPORT.md` 详细报告
- [x] 生成 `PERFORMANCE_GUIDE.md` 使用指南
- [x] 生成 `PERFORMANCE_SUMMARY.md` 摘要报告
- [x] 生成 Lighthouse 报告（HTML + JSON）

### FE-7.4: 可访问性 ✅
- [x] ARIA 标签
- [x] 键盘导航
- [x] 颜色对比度
- [x] 屏幕阅读器支持
- [x] 创建 `frontend/src/lib/utils/accessibility.ts` 工具库
- [x] 修复所有 TypeScript 类型错误（6 个）
- [x] 修复所有可访问性警告（11 个）
- [x] 生产构建验证通过
- [x] 生成 `ACCESSIBILITY_REPORT.md` 实施报告
- [x] 生成 `ACCESSIBILITY_VALIDATION_REPORT.md` 验证报告

**验收标准**: 测试通过，性能指标达标

---

## Phase 13: CI/CD 配置 ✅ 已完成

### CD-1: GitHub Actions ✅
- [x] 创建 `.github/workflows/ci.yml`
- [x] 配置代码检查任务
- [x] 配置后端测试任务
- [x] 配置前端测试任务
- [x] 配置 Docker 镜像构建任务
- [x] 配置 E2E 测试任务

### CD-2: 发布工作流 ✅
- [x] 创建 `.github/workflows/release.yml`
- [x] 配置多平台构建（linux/amd64, linux/arm64）
- [x] 配置 GitHub Release 自动创建
- [x] 配置 Docker 镜像推送到 GHCR

**验收标准**: CI/CD 流水线正常运行 ✅

---

## 性能指标要求

### 后端性能
| 指标 | 目标值 |
|------|--------|
| API P50 延迟 | < 50ms |
| API P99 延迟 | < 200ms |
| WebSocket 延迟 | < 100ms |
| 内存占用 | < 256MB |
| CPU 占用 (idle) | < 50% |

### 前端性能
| 指标 | 目标值 |
|------|--------|
| 首屏加载时间 | < 1s |
| 首次内容绘制 (FCP) | < 1.2s |
| 最大内容绘制 (LCP) | < 2.5s |
| 交互响应时间 | < 100ms |
| 图表渲染时间 | < 200ms |
| 打包体积 (gzip) | < 100KB |
| Lighthouse 评分 | > 90 |

### Docker 镜像
| 指标 | 目标值 |
|------|--------|
| 最终镜像大小 | ~150MB |

---

## 测试覆盖率要求

### 后端
| 模块 | 最低覆盖率 |
|------|------------|
| config.py | 90% |
| schemas.py | 95% |
| pricing.py | 95% |
| stats_reader.py | 90% |
| data_processor.py | 85% |
| export_service.py | 85% |
| routes.py | 75% |
| **整体** | **80%** |

### 前端
| 模块 | 最低覆盖率 |
|------|------------|
| StatCard 组件 | 90% |
| TrendChart 组件 | 80% |
| statsStore | 95% |
| wsStore | 90% |
| API 服务 | 85% |
| 工具函数 | 95% |
| **整体** | **70%** |

---

## 快速命令参考

```bash
# 项目初始化
make setup

# 开发环境
make dev                    # 启动完整开发环境
make dev-backend            # 仅启动后端
make dev-frontend           # 仅启动前端

# 测试
make test                   # 运行所有测试
make test-backend           # 运行后端测试
make test-frontend          # 运行前端测试
make test-e2e               # 运行 E2E 测试
make coverage               # 生成覆盖率报告

# 构建与部署
make build                  # 构建 Docker 镜像
make start                  # 启动生产环境
make stop                   # 停止服务
make restart                # 重启服务
make logs                   # 查看日志
make health                 # 健康检查

# 数据库
make migrate                # 执行迁移
make db-backup              # 备份数据库
make db-restore             # 恢复数据库

# 代码质量
make lint                   # 代码检查
make format                 # 代码格式化
```

---

*文档版本：1.1.0*
*最后更新：2026-01-07*

---

## 进度摘要

| Phase | 状态 | 完成日期 |
|-------|------|----------|
| Phase 0: 项目初始化 | ✅ 已完成 | 2026-01-07 |
| Phase 1: 后端基础设施 | ✅ 已完成 | 2026-01-07 |
| Phase 2: 后端核心读取逻辑 | ✅ 已完成 | 2026-01-07 |
| Phase 3: 后端文件监听与实时更新 | ✅ 已完成 | 2026-01-07 |
| Phase 4: 后端 API 与数据库 | ✅ 已完成 | 2026-01-07 |
| Phase 5: 后端集成与测试 | ✅ 已完成 | 2026-01-07 |
| Phase 6: 前端项目初始化 | ✅ 已完成 | 2026-01-07 |
| Phase 7: 前端基础组件 | ✅ 已完成 | 2026-01-07 |
| Phase 8: 前端图表组件 | ✅ 已完成 | 2026-01-07 |
| Phase 9: 前端状态管理与服务 | ✅ 已完成 | 2026-01-07 |
| Phase 10: 前端仪表板页面 | ✅ 已完成 | 2026-01-07 |
| Phase 11: 前端导出与设置 | ✅ 已完成 | 2026-01-07 |
| Phase 12: 前端测试与优化 | ✅ 已完成 | 2026-01-07 |
| Phase 13: CI/CD 配置 | ⏳ 待开始 | - |
