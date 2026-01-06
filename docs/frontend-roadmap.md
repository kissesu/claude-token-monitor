/**
 * @file frontend-roadmap.md
 * @description Claude Token Monitor 前端开发路线图
 * @author Atlas.oi
 * @date 2026-01-06
 */

# 前端开发路线图

## 总览

总预计时间: **17-24 天**

```
第 1 周: 项目初始化 + 核心组件
第 2 周: 图表集成 + API 对接
第 3 周: 实时通信 + Docker 集成
第 4 周: 测试优化 + 文档完善
```

---

## 第 1 周: 基础建设 (5-7 天)

### Day 1-2: 项目初始化

**目标**: 搭建开发环境

- [x] 创建 Svelte + Vite 项目
- [x] 配置 TypeScript + Tailwind CSS
- [x] 集成 Skeleton UI
- [x] 配置 ESLint + Prettier
- [x] 设置 Git hooks (husky)

**交付物**:
```bash
frontend/
├── src/
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

**验收标准**:
- `pnpm dev` 可正常启动
- TypeScript 无报错
- Tailwind CSS 样式生效

---

### Day 3-4: 布局组件

**目标**: 完成页面框架

- [x] 实现 Header 组件
- [x] 实现 Sidebar 组件
- [x] 实现 Footer 组件
- [x] 配置路由 (SvelteKit)
- [x] 实现主题系统

**交付物**:
```
src/lib/components/layout/
├── Header.svelte
├── Sidebar.svelte
└── Footer.svelte

src/lib/stores/
└── theme.ts
```

**验收标准**:
- 页面布局响应式
- 主题切换正常
- 路由导航无误

---

### Day 5-7: 核心组件

**目标**: 完成统计卡片和通用组件

**组件清单**:

| 优先级 | 组件 | 预计时间 |
|--------|------|----------|
| P0 | StatCard | 2h |
| P0 | DateRangePicker | 3h |
| P0 | LoadingSpinner | 1h |
| P1 | ExportButton | 2h |
| P1 | ErrorAlert | 1h |
| P2 | MetricCard | 2h |

**交付物**:
```
src/lib/components/
├── stats/StatCard.svelte
└── common/
    ├── DateRangePicker.svelte
    ├── LoadingSpinner.svelte
    ├── ExportButton.svelte
    └── ErrorAlert.svelte
```

**验收标准**:
- 组件可独立使用
- Props 类型定义完整
- 样式响应式

---

## 第 2 周: 数据可视化 (5-7 天)

### Day 8-10: 图表集成

**目标**: 集成 Layerchart 并实现核心图表

**图表清单**:

| 图表 | 类型 | 复杂度 | 预计时间 |
|------|------|--------|----------|
| TrendChart | 折线图 | 中 | 4h |
| ModelPieChart | 饼图 | 低 | 3h |
| ActivityHeatmap | 热力图 | 高 | 6h |
| CostChart | 柱状图 | 中 | 3h |

**交付物**:
```
src/lib/components/charts/
├── TrendChart.svelte
├── ModelPieChart.svelte
├── ActivityHeatmap.svelte
└── CostChart.svelte
```

**验收标准**:
- 图表数据正确渲染
- 交互 Tooltip 正常
- 响应式适配

---

### Day 11-12: 仪表板页面

**目标**: 组装仪表板首页

**页面布局**:
```
┌─────────────────────────────────────┐
│  4 个统计卡片 (网格布局)           │
├─────────────────────────────────────┤
│  Token 趋势图 (全宽)                │
├──────────────────┬──────────────────┤
│  模型分布饼图    │  活动热力图      │
└──────────────────┴──────────────────┘
```

**交付物**:
```
src/routes/
└── +page.svelte
```

**验收标准**:
- 布局符合设计稿
- 数据展示完整
- 加载状态处理

---

### Day 13-14: API 对接

**目标**: 连接后端 API

**任务列表**:
- [x] 实现 API 客户端 (`utils/api.ts`)
- [x] 创建 statsStore
- [x] 实现数据获取逻辑
- [x] 处理错误和加载状态
- [x] 添加数据缓存

**交付物**:
```
src/lib/stores/
└── stats.ts

src/lib/utils/
└── api.ts
```

**验收标准**:
- API 请求成功
- 错误处理完善
- 加载状态展示

---

## 第 3 周: 实时通信 + 功能完善 (5-7 天)

### Day 15-16: WebSocket 实时更新

**目标**: 实现 WebSocket 连接

**任务列表**:
- [x] 创建 wsStore
- [x] 实现连接/断开逻辑
- [x] 处理消息推送
- [x] 实现自动重连
- [x] 添加心跳检测

**交付物**:
```
src/lib/stores/
└── websocket.ts
```

**验收标准**:
- 连接稳定
- 数据实时更新 (< 1s 延迟)
- 断线自动重连

---

### Day 17-18: 历史数据页面

**目标**: 实现历史数据查询页面

**功能列表**:
- [x] 日期范围筛选
- [x] 模型筛选
- [x] 数据表格展示
- [x] 数据导出 (CSV/JSON)

**交付物**:
```
src/routes/history/
└── +page.svelte
```

**验收标准**:
- 筛选功能正常
- 分页加载
- 导出文件正确

---

### Day 19-20: 设置页面

**目标**: 实现用户设置

**设置项**:
- [x] 主题切换 (深色/浅色/自动)
- [x] 货币单位选择 (USD/CNY)
- [x] 时区设置
- [x] 刷新频率配置
- [x] 通知偏好

**交付物**:
```
src/routes/settings/
└── +page.svelte

src/lib/stores/
└── settings.ts
```

**验收标准**:
- 设置持久化 (localStorage)
- 实时生效
- 重置功能正常

---

### Day 21: Docker 集成

**目标**: 容器化前端应用

**任务列表**:
- [x] 创建 Dockerfile
- [x] 配置 Nginx (静态文件服务)
- [x] 配置反向代理 (API/WebSocket)
- [x] 优化构建体积

**交付物**:
```
frontend/
├── Dockerfile
├── nginx.conf
└── docker-compose.yml
```

**验收标准**:
- `docker build` 成功
- 镜像大小 < 100MB
- 容器启动正常

---

## 第 4 周: 优化与测试 (3-5 天)

### Day 22-23: 性能优化

**优化清单**:

| 优化项 | 预期效果 | 验证方式 |
|--------|----------|----------|
| 代码分割 | 首屏加载 < 2s | Lighthouse |
| 懒加载图表 | 减少初始加载 50% | Network 面板 |
| 图片优化 | 减少带宽 70% | Chrome DevTools |
| 缓存策略 | 减少 API 请求 80% | Network 面板 |

**交付物**:
- 优化后的构建配置
- 性能测试报告

**验收标准**:
- Lighthouse 分数 > 90
- 首屏加载 < 2s
- 打包体积 < 500KB

---

### Day 23-24: 测试与文档

**测试清单**:
- [x] 单元测试 (Vitest)
- [x] 组件测试 (Testing Library)
- [x] 端到端测试 (Playwright)
- [x] 兼容性测试 (多浏览器)

**文档清单**:
- [x] 开发文档 (README.md)
- [x] 组件文档 (Storybook)
- [x] API 文档
- [x] 部署文档

**交付物**:
```
docs/
├── development.md
├── components.md
└── deployment.md

tests/
├── unit/
├── component/
└── e2e/
```

**验收标准**:
- 测试覆盖率 > 80%
- 文档完整清晰
- 所有测试通过

---

## 里程碑检查点

### Milestone 1: 基础框架 (第 1 周末)

**检查项**:
- [ ] 项目可正常运行
- [ ] 布局组件完成
- [ ] 主题系统正常
- [ ] 核心组件可用

**产出**:
- 可运行的基础框架
- 组件库雏形

---

### Milestone 2: 数据展示 (第 2 周末)

**检查项**:
- [ ] 图表正确渲染
- [ ] 仪表板页面完成
- [ ] API 对接成功
- [ ] 数据流畅通

**产出**:
- 功能完整的仪表板
- API 集成完成

---

### Milestone 3: 功能完善 (第 3 周末)

**检查项**:
- [ ] WebSocket 实时更新
- [ ] 历史数据页面
- [ ] 设置页面
- [ ] Docker 部署成功

**产出**:
- 功能完整的应用
- 可部署的 Docker 镜像

---

### Milestone 4: 发布就绪 (第 4 周末)

**检查项**:
- [ ] 性能优化完成
- [ ] 测试覆盖率 > 80%
- [ ] 文档完整
- [ ] 生产环境验证

**产出**:
- 生产就绪的应用
- 完整的文档体系

---

## 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:------:|:----:|----------|
| Layerchart 学习曲线陡峭 | 中 | 高 | 提前做技术预研,准备降级到 ECharts |
| WebSocket 连接不稳定 | 中 | 中 | 实现完善的重连和心跳机制 |
| 性能不达标 | 低 | 中 | 持续性能监控,及时优化 |
| Docker 构建失败 | 低 | 低 | 使用成熟的基础镜像 |

---

## 下一步行动

### 本周 (Week 1)

**Monday**:
1. 初始化 Svelte + Vite 项目
2. 配置 TypeScript + Tailwind CSS
3. 集成 Skeleton UI

**Tuesday**:
1. 配置开发工具链
2. 设置 Git hooks
3. 创建项目基础结构

**Wednesday**:
1. 实现 Header 组件
2. 实现 Sidebar 组件
3. 配置路由

**Thursday**:
1. 实现主题系统
2. 实现 Footer 组件
3. 测试响应式布局

**Friday**:
1. 实现 StatCard 组件
2. 实现 DateRangePicker
3. 实现 LoadingSpinner

---

## 成功标准

### 技术指标
- [x] 首屏加载 < 2s
- [x] Lighthouse 分数 > 90
- [x] 打包体积 < 500KB
- [x] WebSocket 延迟 < 100ms
- [x] 测试覆盖率 > 80%

### 功能指标
- [x] 支持所有核心功能
- [x] 实时数据更新
- [x] 历史数据查询
- [x] 数据导出 (CSV/JSON)
- [x] 响应式设计 (桌面/平板/手机)

### 用户体验指标
- [x] 界面美观现代
- [x] 交互流畅自然
- [x] 加载状态清晰
- [x] 错误提示友好
- [x] 文档完整易懂

---

*最后更新: 2026-01-06*
*作者: Atlas.oi*
