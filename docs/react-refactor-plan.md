# React 重构前端项目计划 - 结构化任务分解

> **文档版本**: v1.0  
> **创建日期**: 2026-01-08  
> **作者**: Atlas.oi  
> **项目**: Claude Token Monitor 前端重构

---

## 一、重构概述

### 1.1 重构目标

将 Claude Token Monitor 前端从 **Svelte 4** 迁移到 **React 18+**，保持现有功能完整性的同时提升可维护性和团队协作效率。

### 1.2 重构范围

| 模块 | 当前技术 | 目标技术 |
|------|----------|----------|
| 框架 | Svelte 4.2.8 | React 18.x + TypeScript |
| 构建工具 | Vite 5.0 | Vite 5.0（保持） |
| 状态管理 | Svelte Store (writable/derived) | Zustand |
| 样式方案 | TailwindCSS 3.4 | TailwindCSS 3.4（保持） |
| 图表库 | Layerchart 1.0 | Recharts 2.x |
| UI 组件 | Skeleton UI | Radix UI + Shadcn/ui |
| 路由 | 无（单页） | React Router 6 |
| 测试 | Vitest + Testing Library | Vitest + Testing Library（保持） |
| E2E 测试 | Playwright | Playwright（保持） |

### 1.3 重构原则

1. **渐进式迁移**: 按模块逐步重构，确保每个阶段都可独立验证
2. **功能等价**: 100% 保持现有功能，不增删业务逻辑
3. **类型安全**: 完整保留 TypeScript 类型定义
4. **样式复用**: 最大化复用现有 TailwindCSS 样式类
5. **测试先行**: 为关键组件编写测试用例后再重构

---

## 二、现有项目分析

### 2.1 目录结构（当前 Svelte）

```
frontend/src/
├── main.ts                     # 应用入口
├── app.css                     # 全局样式
├── App.svelte                  # 主应用组件
├── lib/
│   ├── types/                  # TypeScript 类型定义（可复用）
│   │   ├── stats.ts            # 统计数据类型
│   │   ├── api.ts              # API 类型
│   │   ├── chart.ts            # 图表类型
│   │   └── index.ts            # 统一导出
│   ├── stores/                 # Svelte Store（需重写）
│   │   ├── statsStore.ts       # 统计数据 Store
│   │   ├── wsStore.ts          # WebSocket Store
│   │   ├── themeStore.ts       # 主题 Store
│   │   └── index.ts            # 统一导出
│   ├── services/               # API 服务层（可复用）
│   │   ├── api.ts              # HTTP API 客户端
│   │   ├── websocket.ts        # WebSocket 服务
│   │   ├── export.ts           # 导出服务
│   │   └── index.ts            # 统一导出
│   ├── utils/                  # 工具函数（可复用）
│   │   ├── pricing.ts          # 价格计算
│   │   └── accessibility.ts    # 无障碍工具
│   └── components/             # UI 组件（需重写）
│       ├── layout/             # 布局组件
│       │   ├── Header.svelte
│       │   ├── Footer.svelte
│       │   └── ThemeToggle.svelte
│       ├── common/             # 通用组件
│       │   ├── StatCard.svelte
│       │   ├── LoadingSpinner.svelte
│       │   ├── ErrorMessage.svelte
│       │   ├── DateRangePicker.svelte
│       │   └── LazyLoad.svelte
│       ├── charts/             # 图表组件
│       │   ├── TrendChart.svelte
│       │   ├── CostChart.svelte
│       │   ├── ModelPieChart.svelte
│       │   └── ActivityHeatmap.svelte
│       └── dashboard/          # 仪表板面板
│           ├── StatsOverview.svelte
│           ├── ModelUsagePanel.svelte
│           ├── DailyActivityPanel.svelte
│           └── CostEstimatePanel.svelte
└── routes/                     # 路由页面
    ├── +page.svelte
    └── +layout.svelte
```

### 2.2 组件复杂度评估

| 组件 | 复杂度 | 重构工作量 | 说明 |
|------|--------|------------|------|
| **布局组件** |
| Header | 低 | 1h | 响应式导航、主题切换 |
| Footer | 低 | 0.5h | 静态内容 |
| ThemeToggle | 低 | 0.5h | 主题切换按钮 |
| **通用组件** |
| StatCard | 中 | 1h | 数值动画、趋势显示 |
| LoadingSpinner | 低 | 0.5h | 加载动画 |
| ErrorMessage | 低 | 0.5h | 错误提示 |
| DateRangePicker | 中 | 2h | 日期选择、快捷选项 |
| LazyLoad | 中 | 1.5h | 懒加载 + Intersection Observer |
| **图表组件** |
| TrendChart | 高 | 4h | 折线图、多系列、图例交互 |
| CostChart | 高 | 4h | 柱状图、堆叠模式、模式切换 |
| ModelPieChart | 中 | 3h | 饼图/环形图、图例交互 |
| ActivityHeatmap | 高 | 5h | GitHub 风格热力图、日历布局 |
| **仪表板面板** |
| StatsOverview | 中 | 2h | 8 个 StatCard 组合 |
| ModelUsagePanel | 中 | 3h | 饼图 + 数据表格 |
| DailyActivityPanel | 高 | 4h | 热力图 + 趋势图 + 日期选择 |
| CostEstimatePanel | 中 | 3h | 费用图表 + 明细表格 |

### 2.3 状态管理映射

| Svelte Store | 功能 | React 等价方案 |
|--------------|------|----------------|
| `statsStore` | 统计数据、派生状态（totalTokens、totalCost 等） | Zustand store + computed selectors |
| `wsStore` | WebSocket 连接状态 | Zustand store + 自定义 hook |
| `themeStore` | 主题切换 + localStorage 持久化 | Zustand store + persist 中间件 |

---

## 三、目标项目结构

### 3.1 React 项目目录结构

```
frontend/src/
├── main.tsx                    # React 应用入口
├── App.tsx                     # 主应用组件
├── App.css                     # 全局样式
├── index.css                   # TailwindCSS 入口
├── vite-env.d.ts              # Vite 类型声明
│
├── types/                      # TypeScript 类型定义（从 lib/types 迁移）
│   ├── stats.ts
│   ├── api.ts
│   ├── chart.ts
│   └── index.ts
│
├── stores/                     # Zustand 状态管理
│   ├── useStatsStore.ts        # 统计数据 Store
│   ├── useWsStore.ts           # WebSocket Store
│   ├── useThemeStore.ts        # 主题 Store
│   └── index.ts
│
├── services/                   # API 服务层（可直接迁移）
│   ├── api.ts
│   ├── websocket.ts
│   ├── export.ts
│   └── index.ts
│
├── utils/                      # 工具函数（可直接迁移）
│   ├── pricing.ts
│   └── accessibility.ts
│
├── hooks/                      # 自定义 React Hooks
│   ├── useWebSocket.ts         # WebSocket 连接管理
│   ├── useTheme.ts             # 主题切换
│   ├── useLazyLoad.ts          # 懒加载
│   ├── useAnimatedNumber.ts    # 数值动画
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
│   │   ├── DateRangePicker.tsx
│   │   ├── LazyLoad.tsx
│   │   └── index.ts
│   ├── charts/
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
├── pages/                      # 页面组件
│   └── Dashboard.tsx
│
└── __tests__/                  # 测试文件
    ├── components/
    └── hooks/
```

---

## 四、分阶段任务分解

### Phase 0: 环境准备与配置 [预计: 2h]

#### P0-1: 项目初始化
- [ ] 创建新的 React 项目分支 `feat/react-refactor`
- [ ] 更新 `package.json` 依赖
  ```json
  {
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "zustand": "^5.0.0",
      "recharts": "^2.14.0",
      "@radix-ui/react-dropdown-menu": "^2.1.0",
      "@radix-ui/react-toggle": "^1.1.0",
      "clsx": "^2.1.0",
      "tailwind-merge": "^2.2.0"
    },
    "devDependencies": {
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.0",
      "@testing-library/react": "^16.0.0"
    }
  }
  ```

#### P0-2: Vite 配置迁移
- [ ] 更新 `vite.config.ts`，从 Svelte 插件切换到 React 插件
- [ ] 配置路径别名 `@/` 指向 `src/`
- [ ] 保留现有的构建优化配置

#### P0-3: TailwindCSS 配置
- [ ] 更新 `tailwind.config.js` 的 `content` 路径匹配 `.tsx` 文件
- [ ] 验证 CSS 变量和暗色模式配置

#### P0-4: TypeScript 配置
- [ ] 更新 `tsconfig.json` 配置 React JSX
- [ ] 配置严格模式和路径映射

**验证标准**: 
- `pnpm dev` 可启动空白 React 应用
- TailwindCSS 样式正常生效
- TypeScript 编译无错误

---

### Phase 1: 类型定义与工具迁移 [预计: 1h]

#### P1-1: 类型定义迁移
- [ ] 复制 `lib/types/` 到 `types/`
- [ ] 移除 Svelte 特定类型引用
- [ ] 验证所有类型定义无错误

#### P1-2: 工具函数迁移
- [ ] 复制 `lib/utils/` 到 `utils/`
- [ ] 验证 `pricing.ts` 计算逻辑
- [ ] 验证 `accessibility.ts` 工具函数

#### P1-3: API 服务迁移
- [ ] 复制 `lib/services/api.ts` 到 `services/api.ts`
- [ ] 移除 Svelte 特定的 `browser` 环境检测
- [ ] 使用 `typeof window !== 'undefined'` 替代

**验证标准**:
- 所有类型定义可正常导入
- 工具函数单元测试通过
- API 服务可正常调用

---

### Phase 2: 状态管理重构 [预计: 4h]

#### P2-1: Zustand Store 设计
- [ ] 创建 `stores/useStatsStore.ts`
  - 迁移 `initialState` 状态结构
  - 实现 `setCurrent`、`setDailyActivities` 等 actions
  - 使用 Zustand 选择器实现派生状态
- [ ] 创建 `stores/useWsStore.ts`
  - 实现 `isConnected`、`reconnectAttempts` 状态
  - 实现连接状态管理 actions
- [ ] 创建 `stores/useThemeStore.ts`
  - 实现主题状态管理
  - 使用 `persist` 中间件实现 localStorage 持久化

#### P2-2: 派生状态实现
```typescript
// 使用 Zustand 选择器实现派生状态示例
export const useTotalTokens = () => useStatsStore(state => {
  const models = state.current?.models ?? {};
  return Object.values(models).reduce((sum, model) => (
    sum + model.input_tokens + model.output_tokens + 
    model.cache_read_tokens + model.cache_creation_tokens
  ), 0);
});
```

#### P2-3: WebSocket 集成
- [ ] 迁移 `lib/services/websocket.ts`
- [ ] 创建 `hooks/useWebSocket.ts` 自定义 Hook
- [ ] 实现自动重连和心跳检测

**验证标准**:
- Store 状态更新正常
- 派生状态计算正确
- WebSocket 连接/断开正常
- 主题切换 + localStorage 持久化正常

---

### Phase 3: 通用组件重构 [预计: 6h]

#### P3-1: 布局组件
- [ ] `Header.tsx` - 响应式导航栏
  - 移植 Logo、导航链接、主题切换
  - 实现移动端汉堡菜单
- [ ] `Footer.tsx` - 页面底部
- [ ] `ThemeToggle.tsx` - 主题切换按钮
  - 集成 `useThemeStore`

#### P3-2: 基础组件
- [ ] `LoadingSpinner.tsx` - 加载动画
  - 支持 `size` 和 `text` props
- [ ] `ErrorMessage.tsx` - 错误提示
  - 支持重试回调
- [ ] `StatCard.tsx` - 统计卡片
  - 实现数值动画（useAnimatedNumber hook）
  - 支持趋势指示器

#### P3-3: 交互组件
- [ ] `DateRangePicker.tsx` - 日期范围选择
  - 快捷选项（今日、本周、本月）
  - 自定义日期输入
- [ ] `LazyLoad.tsx` - 懒加载包装器
  - 使用 Intersection Observer
  - 支持 `minHeight` 占位

**验证标准**:
- 所有组件独立渲染正常
- Props 类型检查通过
- 响应式布局正常
- 暗色模式样式正确

---

### Phase 4: 图表组件重构 [预计: 16h]

#### P4-1: Recharts 基础配置
- [ ] 创建图表主题配置（颜色、字体、间距）
- [ ] 创建通用图表容器组件
- [ ] 实现响应式图表容器

#### P4-2: TrendChart 重构
```tsx
// 目标 API
<TrendChart
  data={dailyData}
  series={[
    { key: 'input_tokens', name: '输入', color: '#3B82F6' },
    { key: 'output_tokens', name: '输出', color: '#10B981' },
  ]}
  xAxisKey="date"
  title="Token 使用趋势"
/>
```
- [ ] 实现多系列折线图
- [ ] 图例点击切换显示/隐藏
- [ ] 自定义 Tooltip

#### P4-3: CostChart 重构
- [ ] 实现柱状图基础模式
- [ ] 实现堆叠柱状图模式
- [ ] 模式切换交互
- [ ] 累计费用曲线叠加

#### P4-4: ModelPieChart 重构
- [ ] 实现饼图/环形图切换
- [ ] 图例交互（点击选中/取消）
- [ ] 中心显示总计数据

#### P4-5: ActivityHeatmap 重构
- [ ] 实现 GitHub 风格日历热力图
- [ ] 颜色强度映射
- [ ] 日期单元格悬浮提示
- [ ] 支持指标切换（会话数/Token数/费用）

**验证标准**:
- 图表渲染性能达标（< 100ms）
- 交互响应流畅
- 响应式适配正常
- 数据更新时平滑过渡

---

### Phase 5: 仪表板面板重构 [预计: 8h]

#### P5-1: StatsOverview 面板
- [ ] 8 个 StatCard 网格布局
- [ ] 集成 `useStatsStore` 获取数据
- [ ] 实时连接状态指示器

#### P5-2: ModelUsagePanel 面板
- [ ] 集成 ModelPieChart
- [ ] 模型筛选下拉框
- [ ] 数据明细表格

#### P5-3: DailyActivityPanel 面板
- [ ] 集成 ActivityHeatmap
- [ ] 集成 TrendChart
- [ ] 集成 DateRangePicker
- [ ] 高峰时段统计

#### P5-4: CostEstimatePanel 面板
- [ ] 集成 CostChart
- [ ] 时间维度切换（日/周/月）
- [ ] 费用明细表格

**验证标准**:
- 各面板数据展示正确
- Store 数据响应式更新
- 组件间通信正常

---

### Phase 6: 主应用集成 [预计: 4h]

#### P6-1: App.tsx 重构
- [ ] 实现主布局（Header + Main + Footer）
- [ ] 集成主题切换逻辑
- [ ] 实现 WebSocket 生命周期管理

#### P6-2: 数据加载流程
- [ ] 实现初始数据加载
- [ ] 加载状态和错误状态处理
- [ ] 重试机制

#### P6-3: 懒加载优化
- [ ] Dashboard 面板懒加载（生产模式）
- [ ] 开发模式静态导入（避免 HMR 问题）

**验证标准**:
- 应用完整启动流程正常
- 数据加载→展示流程正常
- 错误边界正常工作

---

### Phase 7: 测试与优化 [预计: 6h]

#### P7-1: 单元测试
- [ ] Store 测试（状态更新、派生状态）
- [ ] Hook 测试（useWebSocket、useTheme）
- [ ] 工具函数测试

#### P7-2: 组件测试
- [ ] 通用组件测试（StatCard、DateRangePicker）
- [ ] 仪表板面板集成测试

#### P7-3: E2E 测试
- [ ] 迁移现有 Playwright 测试
- [ ] 验证核心用户流程

#### P7-4: 性能优化
- [ ] React.memo 优化高频更新组件
- [ ] useMemo/useCallback 优化计算和回调
- [ ] 代码分割和预加载策略

**验证标准**:
- 单元测试覆盖率 > 80%
- E2E 测试全部通过
- Lighthouse 性能分数 > 90

---

### Phase 8: 文档与清理 [预计: 2h]

#### P8-1: 代码清理
- [ ] 删除 Svelte 相关文件和依赖
- [ ] 清理未使用的导入
- [ ] 统一代码风格

#### P8-2: 文档更新
- [ ] 更新 README.md
- [ ] 更新组件 CLAUDE.md 文档
- [ ] 更新 API 文档

#### P8-3: PR 提交
- [ ] 创建 Pull Request
- [ ] 代码审查
- [ ] 合并主分支

---

## 五、风险评估与缓解

### 5.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 图表库迁移数据格式不兼容 | 高 | 中 | 创建数据适配层 |
| 状态管理逻辑复杂度增加 | 中 | 中 | 保持 Store 结构一致 |
| 样式差异导致 UI 不一致 | 中 | 低 | 复用 TailwindCSS 类 |
| 性能回退 | 高 | 低 | 性能基准测试 |

### 5.2 进度风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 图表组件工作量超预期 | 高 | 中 | 预留 buffer 时间 |
| 测试覆盖不足 | 中 | 中 | 测试先行策略 |

---

## 六、验收标准

### 6.1 功能验收
- [ ] 所有仪表板面板功能完整
- [ ] 实时 WebSocket 数据更新正常
- [ ] 主题切换 + 持久化正常
- [ ] 响应式布局（移动端/平板/桌面）正常
- [ ] 无障碍键盘导航正常

### 6.2 性能验收
- [ ] 首屏加载时间 < 2s
- [ ] 图表渲染时间 < 100ms
- [ ] 内存占用无明显增加
- [ ] Lighthouse 性能分数 > 90

### 6.3 质量验收
- [ ] TypeScript 编译无错误
- [ ] ESLint 检查通过
- [ ] 单元测试覆盖率 > 80%
- [ ] E2E 测试全部通过

---

## 七、时间估算汇总

| 阶段 | 预计工时 | 累计工时 |
|------|----------|----------|
| Phase 0: 环境准备 | 2h | 2h |
| Phase 1: 类型与工具迁移 | 1h | 3h |
| Phase 2: 状态管理重构 | 4h | 7h |
| Phase 3: 通用组件重构 | 6h | 13h |
| Phase 4: 图表组件重构 | 16h | 29h |
| Phase 5: 仪表板面板重构 | 8h | 37h |
| Phase 6: 主应用集成 | 4h | 41h |
| Phase 7: 测试与优化 | 6h | 47h |
| Phase 8: 文档与清理 | 2h | 49h |
| **总计** | **49h** | - |

> **备注**: 预估基于单人开发，实际可根据团队情况并行开发部分阶段。

---

## 八、附录

### A. 依赖版本锁定

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

### B. 关键决策记录

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 状态管理 | Zustand | 轻量、TypeScript 友好、API 简洁 |
| 图表库 | Recharts | React 原生、社区活跃、文档完善 |
| UI 组件 | Radix UI | 无样式、可访问性好、与 TailwindCSS 配合 |
| 构建工具 | Vite | 保持一致，迁移成本低 |

### C. 参考资源

- [Zustand 官方文档](https://docs.pmnd.rs/zustand)
- [Recharts 官方文档](https://recharts.org)
- [Radix UI 文档](https://www.radix-ui.com)
- [React 18 迁移指南](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
