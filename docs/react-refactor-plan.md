# React 重构前端项目计划 - 结构化任务分解

> **文档版本**: v2.0
> **创建日期**: 2026-01-08
> **作者**: Atlas.oi
> **项目**: Claude Token Monitor 前端重构

---

## 一、重构概述

### 1.1 重构目标

将 Claude Token Monitor 前端从 **Svelte 4** 迁移到 **React 18+**，保持现有功能完整性的同时提升可维护性和团队协作效率。

### 1.2 核心原则

```
┌─────────────────────────────────────────────────────────────────┐
│  每个 Phase 完成后，应用必须能够正常启动并展示数据              │
│  图表功能是锦上添花，优先保证核心数据的实时显示                 │
└─────────────────────────────────────────────────────────────────┘
```

1. **渐进式可运行**: 每个阶段结束后，应用必须能正常启动和使用
2. **数据优先**: 先实现数据获取和显示，图表等视觉增强延后
3. **功能等价**: 保持现有功能，不增删业务逻辑
4. **桌面端优先**: 以桌面端布局为主，不做移动端特殊适配
5. **类型安全**: 完整保留 TypeScript 类型定义

### 1.3 技术栈迁移

| 模块 | 当前技术 | 目标技术 |
|------|----------|----------|
| 框架 | Svelte 4.2.8 | React 18.x + TypeScript |
| 构建工具 | Vite 5.0 | Vite 5.0（保持） |
| 状态管理 | Svelte Store | Zustand |
| 样式方案 | TailwindCSS 3.4 | TailwindCSS 3.4（保持） |
| 图表库 | Layerchart 1.0 | Recharts 2.x |
| UI 组件 | Skeleton UI | Radix UI + Shadcn/ui |
| 测试 | Vitest + Playwright | Vitest + Playwright（保持） |

---

## 二、阶段总览

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Phase 0 │ 环境准备        │ 空白 React 应用可启动                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 1 │ 基础架构        │ 类型/工具/服务/Store 可用，能获取后端数据       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 2 │ 布局框架        │ 页面骨架完成，Header/Footer/主题切换可用        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 3 │ 核心数据展示    │ 实时数据显示，WebSocket 连接，StatCard 数值展示 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 4 │ 仪表板面板      │ 所有面板数据展示（无图表，用表格/列表代替）     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 5 │ 基础图表        │ TrendChart + CostChart + ModelPieChart 实现     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 6 │ 高级图表        │ ActivityHeatmap 热力图实现                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 7 │ 测试与优化      │ 单元测试 + E2E 测试 + 性能优化                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 8 │ 文档与清理      │ 删除 Svelte 代码，更新文档，合并主分支          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、目标项目结构

```
frontend/src/
├── main.tsx                    # React 应用入口
├── App.tsx                     # 主应用组件
├── App.css                     # 全局样式
├── index.css                   # TailwindCSS 入口
├── vite-env.d.ts              # Vite 类型声明
│
├── types/                      # TypeScript 类型定义
│   ├── stats.ts
│   ├── api.ts
│   ├── chart.ts
│   └── index.ts
│
├── stores/                     # Zustand 状态管理
│   ├── useStatsStore.ts
│   ├── useWsStore.ts
│   ├── useThemeStore.ts
│   └── index.ts
│
├── services/                   # API 服务层
│   ├── api.ts
│   ├── websocket.ts
│   └── index.ts
│
├── utils/                      # 工具函数
│   ├── pricing.ts
│   └── index.ts
│
├── hooks/                      # 自定义 React Hooks
│   ├── useWebSocket.ts
│   ├── useTheme.ts
│   ├── useAnimatedNumber.ts
│   └── index.ts
│
├── components/                 # React 组件
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── index.ts
│   ├── common/
│   │   ├── StatCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── DataTable.tsx       # 通用数据表格（图表替代方案）
│   │   └── index.ts
│   ├── charts/                 # 图表组件（Phase 5-6 实现）
│   │   ├── TrendChart.tsx
│   │   ├── CostChart.tsx
│   │   ├── ModelPieChart.tsx
│   │   ├── ActivityHeatmap.tsx
│   │   └── index.ts
│   └── dashboard/
│       ├── StatsOverview.tsx
│       ├── ModelUsagePanel.tsx
│       ├── DailyActivityPanel.tsx
│       ├── CostEstimatePanel.tsx
│       └── index.ts
│
└── __tests__/                  # 测试文件
    ├── components/
    └── hooks/
```

---

## 四、分阶段任务分解

---

### Phase 0: 环境准备与配置

**目标**: 空白 React 应用可正常启动

**阶段结束验证**:
- [x] `pnpm dev` 启动成功
- [x] 浏览器显示 "Hello React" 页面
- [x] TailwindCSS 样式生效
- [x] TypeScript 编译无错误

#### P0-1: 项目初始化
- [ ] 创建新的 React 项目分支 `feat/react-refactor`
- [ ] 更新 `package.json` 依赖
  ```json
  {
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "zustand": "^5.0.0",
      "clsx": "^2.1.0",
      "tailwind-merge": "^2.2.0"
    },
    "devDependencies": {
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.0"
    }
  }
  ```
- [ ] 删除 Svelte 相关依赖

#### P0-2: Vite 配置迁移
- [ ] 更新 `vite.config.ts`，切换到 React 插件
- [ ] 配置路径别名 `@/` 指向 `src/`
- [ ] 保留现有的代理和端口配置

#### P0-3: TailwindCSS 配置
- [ ] 更新 `tailwind.config.js` 的 `content` 路径匹配 `.tsx` 文件
- [ ] 验证暗色模式配置

#### P0-4: TypeScript 配置
- [ ] 更新 `tsconfig.json` 配置 React JSX
- [ ] 配置路径映射

#### P0-5: 创建入口文件
- [ ] 创建 `main.tsx` 入口
- [ ] 创建基础 `App.tsx`（显示 Hello React）
- [ ] 更新 `index.html` 引用

---

### Phase 1: 基础架构

**目标**: 类型/工具/服务/Store 可用，能获取后端数据

**阶段结束验证**:
- [ ] 类型定义导入正常
- [ ] API 服务可调用后端接口
- [ ] Zustand Store 状态更新正常
- [ ] 控制台可看到从后端获取的数据

#### P1-1: 类型定义迁移
- [ ] 创建 `types/stats.ts`（复制现有类型）
- [ ] 创建 `types/api.ts`
- [ ] 创建 `types/index.ts` 统一导出

#### P1-2: 工具函数迁移
- [ ] 创建 `utils/pricing.ts`（费用计算逻辑）
- [ ] 创建 `utils/index.ts`

#### P1-3: API 服务迁移
- [ ] 创建 `services/api.ts`
  - HTTP 客户端封装
  - `/api/stats/current` 接口
  - `/api/stats/daily` 接口
  - 错误处理
- [ ] 创建 `services/index.ts`

#### P1-4: Zustand Store 创建
- [ ] 创建 `stores/useStatsStore.ts`
  ```typescript
  interface StatsState {
    current: StatsCache | null;
    dailyActivities: DailyActivity[];
    isLoading: boolean;
    error: string | null;
    // Actions
    setCurrent: (data: StatsCache) => void;
    setDailyActivities: (data: DailyActivity[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    // 派生状态计算
    getTotalTokens: () => number;
    getTotalCost: () => number;
  }
  ```
- [ ] 创建 `stores/useThemeStore.ts`（含 localStorage 持久化）
- [ ] 创建 `stores/index.ts`

#### P1-5: 验证数据获取
- [ ] 在 App.tsx 中测试 API 调用
- [ ] 在 App.tsx 中测试 Store 状态更新
- [ ] 控制台打印获取到的数据

---

### Phase 2: 布局框架

**目标**: 页面骨架完成，Header/Footer/主题切换可用

**阶段结束验证**:
- [ ] 页面有完整的 Header 和 Footer
- [ ] 主题切换按钮可用
- [ ] 暗色/亮色模式切换正常
- [ ] 主题设置持久化到 localStorage

#### P2-1: 布局组件
- [ ] 创建 `components/layout/Header.tsx`
  - Logo + 应用标题
  - 主题切换按钮位置
  - 连接状态指示器位置（预留）
- [ ] 创建 `components/layout/Footer.tsx`
  - 版本信息
  - 版权信息
- [ ] 创建 `components/layout/ThemeToggle.tsx`
  - 太阳/月亮图标切换
  - 集成 useThemeStore

#### P2-2: 主题系统
- [ ] 创建 `hooks/useTheme.ts`
  - 初始化时读取 localStorage
  - 监听系统主题变化
  - 应用 dark class 到 html 元素

#### P2-3: App 布局集成
- [ ] 更新 `App.tsx` 使用 Header/Footer 布局
- [ ] 实现主内容区域占位
- [ ] 验证布局样式

---

### Phase 3: 核心数据展示

**目标**: 实时数据显示，WebSocket 连接，StatCard 数值展示

**阶段结束验证**:
- [ ] 页面显示实时统计数据（数字卡片形式）
- [ ] WebSocket 连接状态可见
- [ ] 数据实时更新（后端推送时）
- [ ] 加载状态和错误状态正常显示

#### P3-1: 通用组件
- [ ] 创建 `components/common/LoadingSpinner.tsx`
- [ ] 创建 `components/common/ErrorMessage.tsx`
  - 错误信息展示
  - 重试按钮

#### P3-2: StatCard 组件
- [ ] 创建 `components/common/StatCard.tsx`
  ```tsx
  interface StatCardProps {
    title: string;
    value: number | string;
    unit?: string;
    icon?: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
  }
  ```
- [ ] 创建 `hooks/useAnimatedNumber.ts`（数值动画）

#### P3-3: WebSocket 服务
- [ ] 创建 `services/websocket.ts`
  - 连接管理
  - 自动重连（指数退避）
  - 心跳检测
  - 消息处理
- [ ] 创建 `stores/useWsStore.ts`
  ```typescript
  interface WsState {
    isConnected: boolean;
    reconnectAttempts: number;
    lastMessageTime: number | null;
  }
  ```
- [ ] 创建 `hooks/useWebSocket.ts`
  - 组件挂载时连接
  - 组件卸载时断开
  - 接收消息更新 statsStore

#### P3-4: StatsOverview 面板
- [ ] 创建 `components/dashboard/StatsOverview.tsx`
  - 4 列 StatCard 网格布局（桌面端）
  - 卡片内容：
    1. 总 Token 数
    2. 总费用
    3. 会话数
    4. 缓存命中率
  - 连接状态指示器

#### P3-5: App 集成
- [ ] 初始化时加载数据
- [ ] 建立 WebSocket 连接
- [ ] 显示 StatsOverview 面板
- [ ] 处理加载/错误状态

---

### Phase 4: 仪表板面板（无图表版）

**目标**: 所有面板数据展示完整，使用表格/列表代替图表

**阶段结束验证**:
- [ ] ModelUsagePanel 显示各模型使用数据（表格形式）
- [ ] CostEstimatePanel 显示费用明细（表格形式）
- [ ] DailyActivityPanel 显示每日活动（列表形式）
- [ ] 所有数据正确显示，响应 Store 更新

#### P4-1: DataTable 通用组件
- [ ] 创建 `components/common/DataTable.tsx`
  ```tsx
  interface DataTableProps<T> {
    columns: { key: keyof T; header: string; render?: (value: any) => React.ReactNode }[];
    data: T[];
    emptyMessage?: string;
  }
  ```

#### P4-2: ModelUsagePanel
- [ ] 创建 `components/dashboard/ModelUsagePanel.tsx`
  - 模型使用数据表格
  - 列：模型名称、输入 Token、输出 Token、缓存 Token、费用、占比
  - 排序支持
  - **图表位置预留**（Phase 5 填充）

#### P4-3: CostEstimatePanel
- [ ] 创建 `components/dashboard/CostEstimatePanel.tsx`
  - 费用汇总卡片
  - 费用明细表格
  - 列：日期、模型、Token 数、费用
  - **图表位置预留**（Phase 5 填充）

#### P4-4: DailyActivityPanel
- [ ] 创建 `components/dashboard/DailyActivityPanel.tsx`
  - 日期范围选择（简单版：最近 7 天 / 30 天）
  - 每日活动列表
  - 显示：日期、会话数、Token 总数、费用
  - **图表位置预留**（Phase 5-6 填充）

#### P4-5: 仪表板布局
- [ ] 更新 App.tsx 集成所有面板
- [ ] 实现网格布局
  ```
  ┌─────────────────────────────────────────┐
  │            StatsOverview                │
  ├──────────────────┬──────────────────────┤
  │  ModelUsagePanel │  CostEstimatePanel   │
  ├──────────────────┴──────────────────────┤
  │          DailyActivityPanel             │
  └─────────────────────────────────────────┘
  ```

---

### Phase 5: 基础图表

**目标**: TrendChart + CostChart + ModelPieChart 实现

**阶段结束验证**:
- [ ] ModelPieChart 显示模型占比饼图
- [ ] CostChart 显示费用趋势柱状图
- [ ] TrendChart 显示 Token 趋势折线图
- [ ] 图表交互正常（图例点击、Tooltip）

#### P5-1: Recharts 配置
- [ ] 安装 recharts 依赖
  ```json
  { "recharts": "^2.14.0" }
  ```
- [ ] 创建图表主题配置（颜色、字体）

#### P5-2: ModelPieChart
- [ ] 创建 `components/charts/ModelPieChart.tsx`
  - 饼图/环形图
  - 图例交互
  - Tooltip 显示详情
- [ ] 集成到 ModelUsagePanel

#### P5-3: CostChart
- [ ] 创建 `components/charts/CostChart.tsx`
  - 柱状图（按日期）
  - 堆叠模式（按模型）
  - Tooltip 显示详情
- [ ] 集成到 CostEstimatePanel

#### P5-4: TrendChart
- [ ] 创建 `components/charts/TrendChart.tsx`
  - 多系列折线图
  - 图例点击切换显示/隐藏
  - Tooltip 显示详情
- [ ] 集成到 DailyActivityPanel

---

### Phase 6: 高级图表

**目标**: ActivityHeatmap 热力图实现

**阶段结束验证**:
- [ ] ActivityHeatmap 显示 GitHub 风格日历热力图
- [ ] 颜色强度正确映射数据
- [ ] 悬浮提示显示日期和数值
- [ ] 指标切换正常（会话数/Token数/费用）

#### P6-1: ActivityHeatmap
- [ ] 创建 `components/charts/ActivityHeatmap.tsx`
  - GitHub 风格日历布局
  - 颜色强度映射
  - 日期单元格悬浮提示
  - 指标切换（会话数/Token数/费用）
- [ ] 集成到 DailyActivityPanel

#### P6-2: DateRangePicker
- [ ] 创建 `components/common/DateRangePicker.tsx`
  - 快捷选项（今日、本周、本月）
  - 自定义日期范围
- [ ] 集成到 DailyActivityPanel

---

### Phase 7: 测试与优化

**目标**: 测试覆盖 + 性能优化

**阶段结束验证**:
- [ ] 单元测试覆盖率 > 70%
- [ ] E2E 核心流程测试通过
- [ ] Lighthouse 性能分数 > 85

#### P7-1: 单元测试
- [ ] Store 测试（状态更新、派生状态）
- [ ] Hook 测试（useWebSocket、useTheme）
- [ ] 工具函数测试

#### P7-2: 组件测试
- [ ] 安装 @testing-library/react
- [ ] StatCard 组件测试
- [ ] DataTable 组件测试

#### P7-3: E2E 测试
- [ ] 配置 Playwright
- [ ] 测试：应用启动
- [ ] 测试：数据加载
- [ ] 测试：主题切换

#### P7-4: 性能优化
- [ ] React.memo 优化高频更新组件
- [ ] useMemo/useCallback 优化计算和回调
- [ ] 图表组件懒加载

---

### Phase 8: 文档与清理

**目标**: 代码清理，文档更新，合并主分支

**阶段结束验证**:
- [ ] Svelte 相关代码完全删除
- [ ] README 更新
- [ ] PR 合并到主分支

#### P8-1: 代码清理
- [ ] 删除 Svelte 相关文件
- [ ] 删除未使用的依赖
- [ ] 清理未使用的导入

#### P8-2: 文档更新
- [ ] 更新 README.md
- [ ] 更新 frontend/CLAUDE.md

#### P8-3: PR 提交
- [ ] 创建 Pull Request
- [ ] 代码审查
- [ ] 合并主分支

---

## 五、风险评估与缓解

### 5.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| WebSocket 连接不稳定 | 高 | 中 | 完善重连机制和错误处理 |
| Recharts 数据格式不兼容 | 中 | 中 | Phase 4 用表格验证数据正确性 |
| 状态管理逻辑复杂 | 中 | 低 | 保持 Store 结构简单 |

### 5.2 进度风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 图表组件工作量超预期 | 中 | 中 | 图表延后，Phase 4 先用表格 |
| 样式还原不精确 | 低 | 中 | 复用 TailwindCSS 类 |

---

## 六、验收标准

### 6.1 各阶段验收

| Phase | 核心验收点 |
|-------|-----------|
| Phase 0 | React 应用启动，TailwindCSS 生效 |
| Phase 1 | API 调用成功，Store 状态更新 |
| Phase 2 | Header/Footer 显示，主题切换正常 |
| Phase 3 | **实时数据显示**，WebSocket 连接 |
| Phase 4 | 所有面板数据展示（表格形式） |
| Phase 5 | 基础图表可用 |
| Phase 6 | 热力图可用 |
| Phase 7 | 测试通过，性能达标 |
| Phase 8 | 代码清理完成，文档更新 |

### 6.2 最终验收

- [ ] 所有仪表板面板功能完整
- [ ] 实时 WebSocket 数据更新正常
- [ ] 主题切换 + 持久化正常
- [ ] 桌面端布局正常
- [ ] TypeScript 编译无错误
- [ ] Lighthouse 性能分数 > 85

---

## 七、依赖版本锁定

```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "zustand": "5.0.0",
  "recharts": "2.14.0",
  "@radix-ui/react-dropdown-menu": "2.1.0",
  "@radix-ui/react-toggle": "1.1.0",
  "clsx": "2.1.0",
  "tailwind-merge": "2.2.0",
  "@vitejs/plugin-react": "4.3.0",
  "@testing-library/react": "16.0.0",
  "vite": "5.0.11",
  "typescript": "5.3.3",
  "tailwindcss": "3.4.1"
}
```

---

## 八、关键决策记录

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 状态管理 | Zustand | 轻量、TypeScript 友好、API 简洁 |
| 图表库 | Recharts | React 原生、社区活跃、文档完善 |
| UI 组件 | Radix UI | 无样式、可访问性好、与 TailwindCSS 配合 |
| 构建工具 | Vite | 保持一致，迁移成本低 |
| 响应式策略 | 桌面端优先 | 目标用户为开发者，主要使用桌面设备 |
| 图表延后策略 | Phase 4 用表格 | 确保数据正确性优先，图表是增强 |
