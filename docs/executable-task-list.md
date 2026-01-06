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

## Phase 0: 项目初始化 (Day 0)

### P0-1: 项目结构创建
- [ ] 创建项目根目录结构
- [ ] 创建 `.env.example` 环境配置模板
- [ ] 创建 `.gitignore` 文件
- [ ] 创建 `README.md` 项目说明

**验收标准**: 项目目录结构完整，git 初始化成功

### P0-2: Docker 基础配置
- [ ] 创建 `docker/Dockerfile` 多阶段构建文件
- [ ] 创建 `docker/Dockerfile.dev` 开发环境文件
- [ ] 创建 `docker-compose.yml` 生产配置
- [ ] 创建 `docker-compose.dev.yml` 开发配置
- [ ] 创建 `.dockerignore` 文件

**验收标准**: `docker compose config` 验证配置无误

### P0-3: Makefile 配置
- [ ] 完善 `Makefile` 所有命令
- [ ] 添加端口清理逻辑
- [ ] 添加健康检查命令
- [ ] 测试所有 make 命令

**验收标准**: `make help` 显示所有可用命令

---

## Phase 1: 后端基础设施 (Day 1-2)

### BE-1.1: 项目初始化
- [ ] 创建 `backend/pyproject.toml`
- [ ] 创建 `backend/requirements.txt`
- [ ] 设置后端目录结构
- [ ] 配置 ruff/black 代码格式化

**验收标准**: `pip install -e .` 成功执行

### BE-1.2: 配置管理模块
- [ ] 创建 `backend/app/config.py`
- [ ] 实现 `Settings` 类（Pydantic BaseSettings）
- [ ] 支持环境变量覆盖
- [ ] 支持 `.env` 文件加载
- [ ] 路径自动检测（macOS/Linux/Windows）
- [ ] 编写 `test_config.py` 测试

**验收标准**: 配置能正确读取和验证，测试覆盖率 >90%

### BE-1.3: 日志配置模块
- [ ] 创建 `backend/app/logger.py`
- [ ] 配置结构化日志格式
- [ ] 支持日志级别动态调整
- [ ] 支持文件和控制台双输出
- [ ] 添加请求 ID 追踪

**验收标准**: 日志正确输出到控制台和文件

### BE-1.4: 数据模型定义
- [ ] 创建 `backend/app/schemas.py`
- [ ] 定义 `StatsCache` 模型
- [ ] 定义 `ModelUsage` 模型
- [ ] 定义 `DailyActivity` 模型
- [ ] 定义 `DailyModelTokens` 模型
- [ ] 定义 `SessionInfo` 模型
- [ ] 定义 `ExportRequest/ExportResponse` 模型
- [ ] 添加数据验证规则
- [ ] 编写 `test_schemas.py` 测试

**验收标准**: 所有模型能正确序列化/反序列化，测试覆盖率 >95%

---

## Phase 2: 后端核心读取逻辑 (Day 3-4)

### BE-2.1: 统计数据读取器
- [ ] 创建 `backend/app/core/stats_reader.py`
- [ ] 实现 `StatsReader` 类
- [ ] 实现 `read_stats_cache()` 方法
- [ ] 实现 `parse_jsonl_files()` 方法
- [ ] 实现 `get_model_usage()` 方法
- [ ] 实现 `get_daily_activity()` 方法
- [ ] 实现 `calculate_cache_hit_rate()` 方法
- [ ] 安全的文件读取（异常处理）
- [ ] 支持增量解析 JSONL
- [ ] 编写 `test_stats_reader.py` 测试

**验收标准**: 能正确读取和解析本地数据文件，测试覆盖率 >90%

### BE-2.2: 定价计算模块
- [ ] 创建 `backend/app/pricing.py`
- [ ] 定义 `ModelPricing` 数据类
- [ ] 定义 `PRICING_CONFIG` 配置
- [ ] 实现 `calculate_cost()` 函数
- [ ] 实现 `normalize_model_name()` 函数
- [ ] 支持多模型聚合计算
- [ ] 支持时间范围筛选
- [ ] 编写 `test_pricing.py` 测试

**定价配置 (2025年1月)**:
| 模型 | 输入 | 输出 | 缓存读取 | 缓存写入 |
|------|------|------|----------|----------|
| Opus 4.5 | $15/M | $75/M | $1.5/M | $18.75/M |
| Sonnet 4.5 | $3/M | $15/M | $0.3/M | $3.75/M |
| Haiku 4.5 | $0.8/M | $4/M | $0.08/M | $1/M |

**验收标准**: 费用计算结果与手动计算一致，测试覆盖率 >95%

### BE-2.3: 数据处理器
- [ ] 创建 `backend/app/core/data_processor.py`
- [ ] 实现 `aggregate_daily_stats()` 函数
- [ ] 实现 `aggregate_model_stats()` 函数
- [ ] 实现 `calculate_trends()` 函数
- [ ] 实现 `filter_by_date_range()` 函数
- [ ] 编写 `test_data_processor.py` 测试

**验收标准**: 聚合数据正确，性能满足要求，测试覆盖率 >85%

---

## Phase 3: 后端文件监听与实时更新 (Day 5-6)

### BE-3.1: 文件监听器
- [ ] 创建 `backend/app/core/file_watcher.py`
- [ ] 实现 `FileWatcher` 类
- [ ] 实现 `watch_stats_cache()` 方法
- [ ] 实现 `watch_jsonl_files()` 方法
- [ ] 实现 `on_file_modified()` 回调
- [ ] 实现 `start_watching()` 方法
- [ ] 实现 `stop_watching()` 方法
- [ ] 使用 watchdog 监听文件变化
- [ ] 防抖处理（避免频繁触发）
- [ ] 支持优雅停止
- [ ] 编写 `test_file_watcher.py` 集成测试

**验收标准**: 文件变化能在 1 秒内检测到

### BE-3.2: WebSocket 处理器
- [ ] 创建 `backend/app/api/websocket.py`
- [ ] 实现 WebSocket 连接管理
- [ ] 实现 `handle_websocket()` 处理器
- [ ] 实现 `broadcast()` 广播方法
- [ ] 实现 `send_stats_update()` 方法
- [ ] 实现 `handle_heartbeat()` 心跳处理
- [ ] 连接断开自动清理
- [ ] 编写 `test_websocket.py` 集成测试

**验收标准**: WebSocket 连接稳定，消息实时推送

---

## Phase 4: 后端 API 与数据库 (Day 7-8)

### BE-4.1: 数据库模块
- [ ] 创建 `backend/app/db/database.py`
- [ ] 创建 `backend/app/db/models.py`
- [ ] 实现数据库连接池
- [ ] 定义数据库表结构
- [ ] 实现 `init_db()` 初始化
- [ ] 实现 `save_stats_snapshot()` 保存快照
- [ ] 实现 `get_historical_stats()` 获取历史
- [ ] 实现 `cleanup_old_data()` 数据清理
- [ ] 创建 `backend/scripts/migrate.py` 迁移脚本
- [ ] 编写 `test_database.py` 测试

**验收标准**: 数据库操作正确，迁移脚本可执行

### BE-4.2: API 路由
- [ ] 创建 `backend/app/api/routes.py`
- [ ] 实现 `GET /api/v1/health` 健康检查
- [ ] 实现 `GET /api/v1/stats` 获取当前统计
- [ ] 实现 `GET /api/v1/stats/daily` 获取每日统计
- [ ] 实现 `GET /api/v1/stats/models` 获取模型统计
- [ ] 实现 `GET /api/v1/stats/trends` 获取趋势数据
- [ ] 实现 `GET /api/v1/stats/history` 获取历史数据
- [ ] 实现 `POST /api/v1/export` 导出数据
- [ ] 实现 `GET /api/v1/config` 获取配置
- [ ] 添加请求验证
- [ ] 添加错误处理中间件
- [ ] 添加 CORS 配置
- [ ] 编写 `test_routes.py` API 测试

**验收标准**: 所有 API 端点正常工作

### BE-4.3: 导出服务
- [ ] 创建 `backend/app/core/export_service.py`
- [ ] 实现 CSV 导出
- [ ] 实现 JSON 导出
- [ ] 支持时间范围筛选
- [ ] 支持字段选择
- [ ] 编写 `test_export_service.py` 测试

**验收标准**: 导出文件格式正确，数据完整

---

## Phase 5: 后端集成与测试 (Day 9)

### BE-5.1: 应用入口
- [ ] 创建 `backend/app/main.py`
- [ ] 实现 `create_app()` 应用工厂
- [ ] 实现 `setup_routes()` 路由配置
- [ ] 实现 `setup_middlewares()` 中间件配置
- [ ] 实现 `start_background_tasks()` 后台任务
- [ ] 实现 `cleanup()` 资源清理
- [ ] 配置静态文件服务
- [ ] 实现优雅关闭
- [ ] 编写启动脚本

**验收标准**: 应用能正常启动和关闭

### BE-5.2: 后端集成测试
- [ ] 创建 `backend/tests/conftest.py` pytest 配置
- [ ] API 端点集成测试
- [ ] WebSocket 集成测试
- [ ] 文件监听集成测试
- [ ] 数据库集成测试
- [ ] 端到端流程测试

**验收标准**: 测试覆盖率 >80%

### BE-5.3: 后端性能测试
- [ ] API 响应时间测试（P99 < 200ms）
- [ ] WebSocket 延迟测试（< 100ms）
- [ ] 内存占用测试（< 100MB）
- [ ] 并发连接测试（> 100 连接）

**验收标准**: 性能指标满足要求

---

## Phase 6: 前端项目初始化 (Day 10-11)

### FE-1.1: 项目搭建
- [ ] 使用 Vite 创建 Svelte + TypeScript 项目
- [ ] 安装并配置 Skeleton UI
- [ ] 安装并配置 Layerchart
- [ ] 配置 ESLint + Prettier
- [ ] 配置路径别名 `$lib`
- [ ] 设置前端目录结构

**验收标准**: `pnpm dev` 能正常启动开发服务器

### FE-1.2: 类型定义
- [ ] 创建 `frontend/src/lib/types/stats.ts`
- [ ] 定义 `StatsCache` 接口
- [ ] 定义 `ModelUsage` 接口
- [ ] 定义 `DailyActivity` 接口
- [ ] 创建 `frontend/src/lib/types/api.ts`
- [ ] 创建 `frontend/src/lib/types/chart.ts`
- [ ] 添加类型导出

**验收标准**: TypeScript 编译无类型错误

### FE-1.3: 全局样式配置
- [ ] 配置 Skeleton UI 主题
- [ ] 定义 CSS 变量（颜色、间距、圆角）
- [ ] 配置 Dark/Light 主题色板
- [ ] 添加全局响应式断点

**验收标准**: 主题切换正常工作

---

## Phase 7: 前端基础组件 (Day 12-14)

### FE-2.1: StatCard 组件
- [ ] 创建 `frontend/src/lib/components/common/StatCard.svelte`
- [ ] 实现基础布局
- [ ] 支持趋势指示器（上升/下降）
- [ ] 支持图标显示
- [ ] 添加动画效果
- [ ] 编写 `StatCard.test.ts` 测试

**验收标准**: 组件可复用，测试覆盖率 >90%

### FE-2.2: LoadingSpinner 组件
- [ ] 创建 `frontend/src/lib/components/common/LoadingSpinner.svelte`
- [ ] 实现多种尺寸（sm/md/lg）
- [ ] 支持自定义颜色
- [ ] 添加加载文本选项

### FE-2.3: ErrorMessage 组件
- [ ] 创建 `frontend/src/lib/components/common/ErrorMessage.svelte`
- [ ] 支持多种错误类型
- [ ] 支持重试按钮
- [ ] 支持关闭功能

### FE-2.4: DateRangePicker 组件
- [ ] 创建 `frontend/src/lib/components/common/DateRangePicker.svelte`
- [ ] 实现日期范围选择
- [ ] 支持快捷选项（今日/本周/本月）
- [ ] 支持自定义范围
- [ ] 编写 `DateRangePicker.test.ts` 测试

**验收标准**: 所有通用组件可复用，测试覆盖率 >80%

### FE-2.5: 布局组件
- [ ] 创建 `frontend/src/lib/components/layout/Header.svelte`
- [ ] 创建 `frontend/src/lib/components/layout/ThemeToggle.svelte`
- [ ] 创建 `frontend/src/lib/components/layout/Footer.svelte`
- [ ] 实现响应式适配
- [ ] 保存用户主题偏好到 localStorage

**验收标准**: 布局组件在各种屏幕尺寸下正常显示

---

## Phase 8: 前端图表组件 (Day 15-18)

### FE-3.1: TrendChart 组件
- [ ] 创建 `frontend/src/lib/components/charts/TrendChart.svelte`
- [ ] 实现折线图基础功能
- [ ] 支持多数据系列
- [ ] 支持缩放和平移
- [ ] 添加 Tooltip 交互
- [ ] 响应式适配
- [ ] 编写 `TrendChart.test.ts` 测试

**验收标准**: 图表渲染流畅，交互响应 <50ms

### FE-3.2: ModelPieChart 组件
- [ ] 创建 `frontend/src/lib/components/charts/ModelPieChart.svelte`
- [ ] 实现饼图/环形图
- [ ] 显示各模型 token 占比
- [ ] 支持图例交互
- [ ] 添加悬浮详情
- [ ] 编写 `ModelPieChart.test.ts` 测试

### FE-3.3: ActivityHeatmap 组件
- [ ] 创建 `frontend/src/lib/components/charts/ActivityHeatmap.svelte`
- [ ] 实现日历热力图
- [ ] 显示每日消息数量
- [ ] 支持颜色强度映射
- [ ] 添加悬浮详情
- [ ] 编写 `ActivityHeatmap.test.ts` 测试

### FE-3.4: CostChart 组件
- [ ] 创建 `frontend/src/lib/components/charts/CostChart.svelte`
- [ ] 实现堆叠柱状图
- [ ] 显示各模型费用
- [ ] 支持时间范围切换
- [ ] 添加费用汇总
- [ ] 编写 `CostChart.test.ts` 测试

**验收标准**: 所有图表组件渲染正确，交互流畅

---

## Phase 9: 前端状态管理与服务 (Day 19-21)

### FE-4.1: statsStore
- [ ] 创建 `frontend/src/lib/stores/statsStore.ts`
- [ ] 实现 `stats` 原始数据 Store
- [ ] 实现 `loading` 状态 Store
- [ ] 实现 `error` 错误 Store
- [ ] 实现 `cacheHitRate` 派生 Store
- [ ] 实现 `totalCost` 派生 Store
- [ ] 实现 `totalTokens` 派生 Store
- [ ] 实现 `loadStats()` 函数
- [ ] 编写 `statsStore.test.ts` 测试

**验收标准**: 状态管理正确，测试覆盖率 >95%

### FE-4.2: wsStore
- [ ] 创建 `frontend/src/lib/stores/wsStore.ts`
- [ ] 实现 `wsStatus` 连接状态 Store
- [ ] 实现 `wsError` 错误 Store
- [ ] 编写 `wsStore.test.ts` 测试

### FE-4.3: themeStore
- [ ] 创建 `frontend/src/lib/stores/themeStore.ts`
- [ ] 实现主题状态
- [ ] 实现 localStorage 持久化
- [ ] 实现系统主题检测
- [ ] 编写 `themeStore.test.ts` 测试

### FE-4.4: API 服务
- [ ] 创建 `frontend/src/lib/services/api.ts`
- [ ] 实现 `fetchStats()` 函数
- [ ] 实现 `fetchDailyStats()` 函数
- [ ] 实现 `exportData()` 函数
- [ ] 添加错误处理
- [ ] 添加请求超时
- [ ] 添加请求重试
- [ ] 编写 `api.test.ts` 测试

### FE-4.5: WebSocket 服务
- [ ] 创建 `frontend/src/lib/services/websocket.ts`
- [ ] 实现 `WebSocketService` 类
- [ ] 实现 `connect()` 方法
- [ ] 实现 `disconnect()` 方法
- [ ] 实现自动重连（指数退避）
- [ ] 实现心跳检测
- [ ] 实现消息解析
- [ ] 编写 `websocket.test.ts` 测试

**验收标准**: WebSocket 连接稳定

---

## Phase 10: 前端仪表板页面 (Day 22-25)

### FE-5.1: StatsOverview 面板
- [ ] 创建 `frontend/src/lib/components/dashboard/StatsOverview.svelte`
- [ ] 显示总 Token 数
- [ ] 显示缓存命中率
- [ ] 显示总费用估算
- [ ] 显示会话数量
- [ ] 集成 StatCard 组件
- [ ] 添加实时更新指示

### FE-5.2: ModelUsagePanel 面板
- [ ] 创建 `frontend/src/lib/components/dashboard/ModelUsagePanel.svelte`
- [ ] 显示各模型 Token 用量
- [ ] 集成饼图组件
- [ ] 支持模型筛选
- [ ] 添加详细数据表格

### FE-5.3: DailyActivityPanel 面板
- [ ] 创建 `frontend/src/lib/components/dashboard/DailyActivityPanel.svelte`
- [ ] 显示每日消息趋势
- [ ] 集成热力图组件
- [ ] 支持日期范围选择
- [ ] 显示高峰时段

### FE-5.4: CostEstimatePanel 面板
- [ ] 创建 `frontend/src/lib/components/dashboard/CostEstimatePanel.svelte`
- [ ] 显示各模型费用
- [ ] 集成费用图表
- [ ] 显示费用趋势
- [ ] 添加费用明细

### FE-5.5: 主页面集成
- [ ] 更新 `frontend/src/App.svelte`
- [ ] 集成所有面板组件
- [ ] 实现响应式布局（Grid）
- [ ] 添加加载状态
- [ ] 添加错误处理
- [ ] 实现数据刷新

**验收标准**: 仪表板显示完整，数据实时更新

---

## Phase 11: 前端导出与设置 (Day 26-27)

### FE-6.1: 导出功能
- [ ] 创建 `frontend/src/lib/services/export.ts`
- [ ] 实现 CSV 导出
- [ ] 实现 JSON 导出
- [ ] 添加导出进度指示
- [ ] 支持时间范围选择
- [ ] 支持字段选择

### FE-6.2: 设置面板
- [ ] 创建 `frontend/src/lib/components/Settings.svelte`
- [ ] 主题设置
- [ ] 刷新频率设置
- [ ] 通知设置
- [ ] 关于信息

**验收标准**: 导出功能正常，设置能持久化

---

## Phase 12: 前端测试与优化 (Day 28-29)

### FE-7.1: 单元测试
- [ ] 配置 `frontend/vitest.config.ts`
- [ ] 创建 `frontend/tests/setup.ts`
- [ ] 组件单元测试（Vitest + Testing Library）
- [ ] Store 单元测试
- [ ] 工具函数单元测试
- [ ] 测试覆盖率 >70%

### FE-7.2: E2E 测试
- [ ] 配置 `frontend/playwright.config.ts`
- [ ] 创建 `frontend/tests/e2e/dashboard.spec.ts`
- [ ] 创建 `frontend/tests/e2e/responsive.spec.ts`
- [ ] 页面加载测试
- [ ] 数据显示测试
- [ ] 交互功能测试
- [ ] 主题切换测试
- [ ] 导出功能测试

### FE-7.3: 性能优化
- [ ] 代码分割（lazy loading）
- [ ] 图片优化
- [ ] 构建产物优化
- [ ] Lighthouse 评分 >90

### FE-7.4: 可访问性
- [ ] ARIA 标签
- [ ] 键盘导航
- [ ] 颜色对比度
- [ ] 屏幕阅读器支持

**验收标准**: 测试通过，性能指标达标

---

## Phase 13: CI/CD 配置

### CD-1: GitHub Actions
- [ ] 创建 `.github/workflows/ci.yml`
- [ ] 配置代码检查任务
- [ ] 配置后端测试任务
- [ ] 配置前端测试任务
- [ ] 配置 Docker 镜像构建任务
- [ ] 配置 E2E 测试任务

### CD-2: 发布工作流
- [ ] 创建 `.github/workflows/release.yml`
- [ ] 配置多平台构建（linux/amd64, linux/arm64）
- [ ] 配置 GitHub Release 自动创建
- [ ] 配置 Docker 镜像推送到 GHCR

**验收标准**: CI/CD 流水线正常运行

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

*文档版本：1.0.0*
*最后更新：2026-01-06*
