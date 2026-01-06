/**
 * @file frontend-architecture.md
 * @description Claude Token Monitor Web UI 前端架构设计文档
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 前端架构设计文档

## 目录

1. [技术栈选型](#一技术栈选型)
2. [项目结构](#二项目结构)
3. [页面结构与路由](#三页面结构与路由)
4. [仪表板布局设计](#四仪表板布局设计)
5. [核心组件设计](#五核心组件设计)
6. [状态管理](#六状态管理)
7. [主题系统](#七主题系统)
8. [响应式设计](#八响应式设计)
9. [实时通信](#九实时通信)
10. [性能优化](#十性能优化)

---

## 一、技术栈选型

### 1.1 核心技术

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| **Svelte** | 4.x | 前端框架 | 编译时优化,零运行时开销,打包体积最小 |
| **Vite** | 5.x | 构建工具 | 快速热更新,ESM 原生支持 |
| **TypeScript** | 5.x | 类型系统 | 类型安全,代码提示 |
| **Layerchart** | 0.x | 图表库 | Svelte 原生,基于 D3,性能优秀 |
| **Skeleton UI** | 2.x | UI 框架 | Tailwind CSS 集成,组件丰富 |

### 1.2 为什么选择 Svelte

**对比其他框架**:

```
打包体积对比 (gzip后):
├─ Svelte:    ~5KB  ✅ 最小
├─ Vue 3:     ~30KB
├─ React:     ~45KB
└─ Next.js:   ~80KB

运行时性能:
├─ Svelte:    编译时转换,无虚拟 DOM ✅ 最快
├─ Vue 3:     Proxy 响应式,虚拟 DOM
└─ React:     Fiber 架构,虚拟 DOM
```

**核心优势**:
1. **编译时优化**: 在构建时就完成响应式转换
2. **真实 DOM**: 直接操作 DOM,性能最优
3. **简洁语法**: 学习曲线低,代码量少 30-40%
4. **内置动画**: `svelte/transition` 开箱即用

### 1.3 依赖清单

```json
{
  "dependencies": {
    "svelte": "^4.2.0",
    "@sveltejs/kit": "^2.0.0",
    "layerchart": "^0.40.0",
    "@skeletonlabs/skeleton": "^2.10.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@tsconfig/svelte": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

---

## 二、项目结构

### 2.1 目录结构

```
frontend/
├── src/
│   ├── lib/                    # 核心库
│   │   ├── components/         # 可复用组件
│   │   │   ├── charts/         # 图表组件
│   │   │   │   ├── TrendChart.svelte
│   │   │   │   ├── ModelPieChart.svelte
│   │   │   │   ├── ActivityHeatmap.svelte
│   │   │   │   └── CostChart.svelte
│   │   │   ├── stats/          # 统计卡片
│   │   │   │   ├── StatCard.svelte
│   │   │   │   ├── MetricCard.svelte
│   │   │   │   └── ComparisonCard.svelte
│   │   │   ├── common/         # 通用组件
│   │   │   │   ├── ThemeToggle.svelte
│   │   │   │   ├── ExportButton.svelte
│   │   │   │   ├── DateRangePicker.svelte
│   │   │   │   ├── LoadingSpinner.svelte
│   │   │   │   └── ErrorAlert.svelte
│   │   │   └── layout/         # 布局组件
│   │   │       ├── Header.svelte
│   │   │       ├── Sidebar.svelte
│   │   │       └── Footer.svelte
│   │   ├── stores/             # 状态管理
│   │   │   ├── stats.ts        # 统计数据
│   │   │   ├── theme.ts        # 主题状态
│   │   │   ├── websocket.ts    # WebSocket 连接
│   │   │   └── settings.ts     # 用户设置
│   │   ├── utils/              # 工具函数
│   │   │   ├── api.ts          # API 请求
│   │   │   ├── format.ts       # 数据格式化
│   │   │   ├── calculate.ts    # 计算函数
│   │   │   ├── export.ts       # 导出功能
│   │   │   └── date.ts         # 日期处理
│   │   ├── types/              # TypeScript 类型定义
│   │   │   ├── stats.ts
│   │   │   ├── chart.ts
│   │   │   └── api.ts
│   │   └── styles/             # 全局样式
│   │       ├── theme.css       # 主题变量
│   │       ├── animations.css  # 动画效果
│   │       └── global.css      # 全局样式
│   ├── routes/                 # SvelteKit 路由
│   │   ├── +layout.svelte      # 根布局
│   │   ├── +page.svelte        # 首页(仪表板)
│   │   ├── history/            # 历史数据页
│   │   │   └── +page.svelte
│   │   └── settings/           # 设置页
│   │       └── +page.svelte
│   └── app.html               # HTML 模板
├── static/                     # 静态资源
│   ├── favicon.ico
│   └── fonts/
├── tailwind.config.js         # Tailwind 配置
├── vite.config.ts             # Vite 配置
├── svelte.config.js           # Svelte 配置
├── tsconfig.json              # TypeScript 配置
└── package.json
```

### 2.2 文件命名规范

- **组件**: PascalCase (例如 `StatCard.svelte`)
- **工具函数**: camelCase (例如 `formatCurrency.ts`)
- **类型定义**: PascalCase (例如 `StatsData.ts`)
- **常量**: UPPER_SNAKE_CASE (例如 `API_ENDPOINTS`)

---

## 三、页面结构与路由

### 3.1 路由配置

```typescript
/**
 * @file src/routes/+layout.svelte
 * @description 根布局,包含全局导航和主题系统
 */

<script lang="ts">
  import { page } from '$app/stores';
  import Header from '$lib/components/layout/Header.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import { themeStore } from '$lib/stores/theme';

  // 路由配置
  const routes = [
    { path: '/', label: '仪表板', icon: 'dashboard' },
    { path: '/history', label: '历史数据', icon: 'history' },
    { path: '/settings', label: '设置', icon: 'settings' }
  ];
</script>

<div class="app" data-theme={$themeStore.current}>
  <Header />

  <div class="main-container">
    <Sidebar {routes} currentPath={$page.url.pathname} />

    <main class="content">
      <slot />
    </main>
  </div>
</div>

<style>
  .app {
    min-height: 100vh;
    background: var(--color-surface-50);
    color: var(--color-surface-900);
    transition: background-color 0.3s, color 0.3s;
  }

  .main-container {
    display: flex;
    height: calc(100vh - 64px); /* 减去 header 高度 */
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }
</style>
```

### 3.2 页面说明

| 路由 | 功能 | 核心组件 |
|------|------|----------|
| `/` | 仪表板首页 | StatCard, TrendChart, ModelPieChart |
| `/history` | 历史数据查看 | DateRangePicker, DataTable, FilterPanel |
| `/settings` | 设置页面 | ThemeToggle, CurrencySelector, ExportSettings |

---

## 四、仪表板布局设计

### 4.1 布局结构

```
┌─────────────────────────────────────────────────────────┐
│                      Header (64px)                       │
│  Logo  |  导航  |  日期选择  |  主题切换  |  导出按钮    │
├──────┬──────────────────────────────────────────────────┤
│      │                                                   │
│  S   │  ┌─────────┬─────────┬─────────┬─────────┐      │
│  i   │  │ Token   │ 费用    │ 缓存率  │ 会话数  │  概览卡片
│  d   │  │ 总量    │ 估算    │ 98.3%   │ 155     │  (4列)
│  e   │  └─────────┴─────────┴─────────┴─────────┘      │
│  b   │                                                   │
│  a   │  ┌────────────────────────────────────────┐      │
│  r   │  │      Token 使用趋势图 (折线图)         │  主图表
│      │  │      Last 30 Days                      │  (大)
│ (200)│  └────────────────────────────────────────┘      │
│      │                                                   │
│  px) │  ┌──────────────────┬───────────────────┐       │
│      │  │  模型使用分布    │  每日活动热力图   │  辅图表
│      │  │  (饼图/柱状图)   │  (Heatmap)        │  (2列)
│      │  └──────────────────┴───────────────────┘       │
│      │                                                   │
│      │  ┌────────────────────────────────────────┐      │
│      │  │      最近会话列表 (表格)               │  数据表
│      │  │      Session ID | Duration | Tokens   │  (全宽)
│      │  └────────────────────────────────────────┘      │
└──────┴──────────────────────────────────────────────────┘
```

### 4.2 仪表板页面代码

```svelte
/**
 * @file src/routes/+page.svelte
 * @description 仪表板首页
 *
 * 业务逻辑:
 * 1. 加载统计数据并实时更新
 * 2. 展示四个关键指标卡片
 * 3. 渲染 Token 趋势图和模型分布图
 * 4. 显示活动热力图和最近会话
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { onMount } from 'svelte';
  import StatCard from '$lib/components/stats/StatCard.svelte';
  import TrendChart from '$lib/components/charts/TrendChart.svelte';
  import ModelPieChart from '$lib/components/charts/ModelPieChart.svelte';
  import ActivityHeatmap from '$lib/components/charts/ActivityHeatmap.svelte';
  import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';
  import ExportButton from '$lib/components/common/ExportButton.svelte';
  import { statsStore } from '$lib/stores/stats';
  import { wsStore } from '$lib/stores/websocket';
  import { formatNumber, formatCurrency } from '$lib/utils/format';
  import { calculateCacheHitRate } from '$lib/utils/calculate';

  // ============================================
  // 响应式数据
  // ============================================
  $: totalTokens = $statsStore.totalTokens || 0;
  $: estimatedCost = $statsStore.estimatedCost || 0;
  $: cacheHitRate = calculateCacheHitRate($statsStore.modelUsage);
  $: sessionCount = $statsStore.totalSessions || 0;

  // ============================================
  // 生命周期钩子
  // ============================================
  onMount(() => {
    // 连接 WebSocket 实时更新
    wsStore.connect();

    // 清理函数
    return () => {
      wsStore.disconnect();
    };
  });

  // ============================================
  // 日期范围选择处理
  // ============================================
  function handleDateRangeChange(event: CustomEvent) {
    const { startDate, endDate } = event.detail;
    statsStore.fetchByDateRange(startDate, endDate);
  }
</script>

<!-- ========================================== -->
<!-- 顶部工具栏 -->
<!-- ========================================== -->
<div class="toolbar">
  <h1 class="page-title">Claude Token 监控仪表板</h1>

  <div class="toolbar-actions">
    <DateRangePicker on:change={handleDateRangeChange} />
    <ExportButton data={$statsStore} />
  </div>
</div>

<!-- ========================================== -->
<!-- 概览卡片区域 (4列网格) -->
<!-- ========================================== -->
<section class="overview-cards">
  <StatCard
    title="Token 总量"
    value={formatNumber(totalTokens)}
    icon="token"
    trend={$statsStore.tokenTrend}
    color="primary"
  />

  <StatCard
    title="费用估算"
    value={formatCurrency(estimatedCost)}
    icon="dollar"
    trend={$statsStore.costTrend}
    color="success"
  />

  <StatCard
    title="缓存命中率"
    value={`${cacheHitRate.toFixed(1)}%`}
    icon="cache"
    trend={$statsStore.cacheRateTrend}
    color="info"
  />

  <StatCard
    title="会话总数"
    value={formatNumber(sessionCount)}
    icon="session"
    trend={$statsStore.sessionTrend}
    color="warning"
  />
</section>

<!-- ========================================== -->
<!-- Token 趋势图 (全宽) -->
<!-- ========================================== -->
<section class="chart-section">
  <div class="chart-header">
    <h2>Token 使用趋势</h2>
    <p class="chart-subtitle">最近 30 天的 Token 消耗情况</p>
  </div>

  <TrendChart
    data={$statsStore.dailyTokens}
    height={400}
  />
</section>

<!-- ========================================== -->
<!-- 双列图表区域 -->
<!-- ========================================== -->
<div class="dual-charts">
  <!-- 模型使用分布 (饼图) -->
  <section class="chart-section">
    <div class="chart-header">
      <h2>模型使用分布</h2>
    </div>
    <ModelPieChart data={$statsStore.modelUsage} />
  </section>

  <!-- 每日活动热力图 -->
  <section class="chart-section">
    <div class="chart-header">
      <h2>活动热力图</h2>
    </div>
    <ActivityHeatmap data={$statsStore.hourCounts} />
  </section>
</div>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-surface-200);
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--color-surface-900);
  }

  .toolbar-actions {
    display: flex;
    gap: 1rem;
  }

  /* ========================================== */
  /* 概览卡片 Grid 布局 */
  /* ========================================== */
  .overview-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  /* ========================================== */
  /* 图表区域样式 */
  /* ========================================== */
  .chart-section {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .chart-header {
    margin-bottom: 1.5rem;
  }

  .chart-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-surface-900);
  }

  .chart-subtitle {
    font-size: 0.875rem;
    color: var(--color-surface-500);
    margin-top: 0.25rem;
  }

  /* ========================================== */
  /* 双列图表布局 */
  /* ========================================== */
  .dual-charts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  /* ========================================== */
  /* 响应式适配 */
  /* ========================================== */
  @media (max-width: 1280px) {
    .overview-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .overview-cards {
      grid-template-columns: 1fr;
    }

    .dual-charts {
      grid-template-columns: 1fr;
    }
  }
</style>
```

---

## 五、核心组件设计

### 5.1 StatCard 统计卡片

```svelte
/**
 * @file src/lib/components/stats/StatCard.svelte
 * @description 统计数据卡片组件
 *
 * 功能:
 * - 展示单个指标的数值
 * - 显示趋势变化(上升/下降百分比)
 * - 支持不同颜色主题
 * - 图标展示
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { fade } from 'svelte/transition';
  import Icon from './Icon.svelte';

  // ============================================
  // 组件属性定义
  // ============================================
  export let title: string;           // 卡片标题
  export let value: string | number;  // 主要数值
  export let icon: string;            // 图标名称
  export let trend: number | null = null;  // 趋势百分比
  export let color: 'primary' | 'success' | 'info' | 'warning' = 'primary';

  // ============================================
  // 计算趋势方向
  // ============================================
  $: trendDirection = trend !== null && trend > 0 ? 'up' : 'down';
  $: trendColor = trend !== null && trend > 0 ? 'text-green-600' : 'text-red-600';
</script>

<div class="stat-card card-{color}" transition:fade>
  <!-- 图标区域 -->
  <div class="icon-wrapper">
    <Icon name={icon} size={32} />
  </div>

  <!-- 内容区域 -->
  <div class="content">
    <h3 class="title">{title}</h3>
    <p class="value">{value}</p>

    {#if trend !== null}
      <div class="trend {trendColor}">
        <Icon name={trendDirection === 'up' ? 'arrow-up' : 'arrow-down'} size={16} />
        <span>{Math.abs(trend).toFixed(1)}%</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ========================================== */
  /* 卡片基础样式 */
  /* ========================================== */
  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* ========================================== */
  /* 图标样式 */
  /* ========================================== */
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 0.5rem;
  }

  .card-primary .icon-wrapper {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .card-success .icon-wrapper {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .card-info .icon-wrapper {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .card-warning .icon-wrapper {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  /* ========================================== */
  /* 内容区域 */
  /* ========================================== */
  .content {
    flex: 1;
  }

  .title {
    font-size: 0.875rem;
    color: var(--color-surface-500);
    margin: 0 0 0.5rem 0;
  }

  .value {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0 0 0.25rem 0;
  }

  /* ========================================== */
  /* 趋势指示器 */
  /* ========================================== */
  .trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .text-green-600 {
    color: #059669;
  }

  .text-red-600 {
    color: #dc2626;
  }
</style>
```

### 5.2 TrendChart 趋势图表

```svelte
/**
 * @file src/lib/components/charts/TrendChart.svelte
 * @description Token 使用趋势折线图
 *
 * 使用 Layerchart (D3 封装) 渲染高性能图表
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { Chart, Svg, Axis, Spline, Tooltip, TooltipItem } from 'layerchart';
  import { scaleBand, scaleLinear, scaleTime } from 'd3-scale';
  import { format } from 'date-fns';
  import type { DailyTokens } from '$lib/types/stats';

  // ============================================
  // 组件属性
  // ============================================
  export let data: DailyTokens[];
  export let height: number = 400;

  // ============================================
  // 数据转换: 将日期字符串转为 Date 对象
  // ============================================
  $: chartData = data.map(d => ({
    date: new Date(d.date),
    tokens: d.totalTokens
  }));

  // ============================================
  // D3 比例尺配置
  // ============================================
  $: xScale = scaleTime()
    .domain([
      new Date(Math.min(...chartData.map(d => d.date.getTime()))),
      new Date(Math.max(...chartData.map(d => d.date.getTime())))
    ]);

  $: yScale = scaleLinear()
    .domain([0, Math.max(...chartData.map(d => d.tokens)) * 1.1]);
</script>

<div class="chart-container" style="height: {height}px">
  <Chart
    data={chartData}
    x="date"
    y="tokens"
    xScale={xScale}
    yScale={yScale}
    padding={{ top: 20, right: 30, bottom: 40, left: 60 }}
  >
    <Svg>
      <!-- X 轴 (日期) -->
      <Axis
        placement="bottom"
        format={(d) => format(d, 'MM/dd')}
        ticks={10}
      />

      <!-- Y 轴 (Token 数量) -->
      <Axis
        placement="left"
        format={(d) => `${(d / 1000).toFixed(0)}K`}
        grid
      />

      <!-- 平滑曲线 -->
      <Spline
        stroke="url(#gradient)"
        strokeWidth={2}
        fill="url(#gradientFill)"
        fillOpacity={0.1}
      />

      <!-- 渐变定义 -->
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#667eea" />
          <stop offset="100%" stop-color="#764ba2" />
        </linearGradient>

        <linearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#667eea" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#667eea" stop-opacity="0" />
        </linearGradient>
      </defs>
    </Svg>

    <!-- 交互式 Tooltip -->
    <Tooltip let:data>
      <TooltipItem label="日期" value={format(data.date, 'yyyy-MM-dd')} />
      <TooltipItem label="Token" value={data.tokens.toLocaleString()} />
    </Tooltip>
  </Chart>
</div>

<style>
  .chart-container {
    width: 100%;
    position: relative;
  }
</style>
```

### 5.3 ModelPieChart 模型分布饼图

```svelte
/**
 * @file src/lib/components/charts/ModelPieChart.svelte
 * @description 模型使用分布饼图
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { Chart, Svg, Arc, Tooltip } from 'layerchart';
  import { scaleOrdinal } from 'd3-scale';
  import { pie, arc as d3Arc } from 'd3-shape';
  import type { ModelUsage } from '$lib/types/stats';

  export let data: Record<string, ModelUsage>;

  // ============================================
  // 数据转换: 转为饼图所需格式
  // ============================================
  $: pieData = Object.entries(data).map(([model, usage]) => ({
    model: model.replace('claude-', ''),  // 简化模型名
    value: usage.inputTokens + usage.outputTokens,
    percentage: 0  // 将在下一步计算
  }));

  // 计算百分比
  $: {
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    pieData.forEach(d => {
      d.percentage = (d.value / total) * 100;
    });
  }

  // ============================================
  // 颜色比例尺
  // ============================================
  const colorScale = scaleOrdinal()
    .domain(['opus', 'sonnet', 'haiku'])
    .range(['#667eea', '#10b981', '#f59e0b']);
</script>

<div class="pie-chart">
  <Chart
    data={pieData}
    padding={{ top: 20, right: 20, bottom: 20, left: 20 }}
  >
    <Svg>
      {#each pie().value(d => d.value)(pieData) as slice, i}
        <Arc
          data={slice}
          innerRadius={60}
          outerRadius={120}
          fill={colorScale(pieData[i].model)}
          stroke="white"
          strokeWidth={2}
        />
      {/each}
    </Svg>

    <Tooltip let:data>
      <div class="pie-tooltip">
        <div class="model-name">{data.model}</div>
        <div class="model-stats">
          <div>Token: {data.value.toLocaleString()}</div>
          <div>占比: {data.percentage.toFixed(1)}%</div>
        </div>
      </div>
    </Tooltip>
  </Chart>

  <!-- 图例 -->
  <div class="legend">
    {#each pieData as item}
      <div class="legend-item">
        <span
          class="legend-color"
          style="background: {colorScale(item.model)}"
        ></span>
        <span class="legend-label">{item.model}</span>
        <span class="legend-value">{item.percentage.toFixed(1)}%</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .pie-chart {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }

  .legend-label {
    flex: 1;
    font-size: 0.875rem;
  }

  .legend-value {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .pie-tooltip {
    background: white;
    padding: 0.75rem;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .model-name {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .model-stats {
    font-size: 0.875rem;
    color: var(--color-surface-600);
  }
</style>
```

### 5.4 DateRangePicker 日期选择器

```svelte
/**
 * @file src/lib/components/common/DateRangePicker.svelte
 * @description 日期范围选择器
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { format, subDays, startOfDay, endOfDay } from 'date-fns';

  const dispatch = createEventDispatcher();

  // ============================================
  // 快捷日期选项
  // ============================================
  const presets = [
    { label: '今天', value: 0 },
    { label: '最近 7 天', value: 7 },
    { label: '最近 30 天', value: 30 },
    { label: '最近 90 天', value: 90 }
  ];

  // ============================================
  // 响应式状态
  // ============================================
  let startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  let endDate = format(new Date(), 'yyyy-MM-dd');
  let selectedPreset = 30;

  // ============================================
  // 预设选择处理
  // ============================================
  function selectPreset(days: number) {
    selectedPreset = days;
    startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    endDate = format(new Date(), 'yyyy-MM-dd');
    emitChange();
  }

  // ============================================
  // 触发变更事件
  // ============================================
  function emitChange() {
    dispatch('change', {
      startDate: startOfDay(new Date(startDate)),
      endDate: endOfDay(new Date(endDate))
    });
  }
</script>

<div class="date-range-picker">
  <!-- 预设按钮组 -->
  <div class="presets">
    {#each presets as preset}
      <button
        class="preset-btn"
        class:active={selectedPreset === preset.value}
        on:click={() => selectPreset(preset.value)}
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <!-- 自定义日期输入 -->
  <div class="custom-range">
    <input
      type="date"
      bind:value={startDate}
      on:change={emitChange}
      max={endDate}
    />
    <span class="separator">至</span>
    <input
      type="date"
      bind:value={endDate}
      on:change={emitChange}
      min={startDate}
    />
  </div>
</div>

<style>
  .date-range-picker {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .presets {
    display: flex;
    gap: 0.5rem;
  }

  .preset-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-surface-300);
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .preset-btn:hover {
    border-color: var(--color-primary-500);
  }

  .preset-btn.active {
    background: var(--color-primary-500);
    color: white;
    border-color: var(--color-primary-500);
  }

  .custom-range {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .custom-range input {
    padding: 0.5rem;
    border: 1px solid var(--color-surface-300);
    border-radius: 0.375rem;
  }

  .separator {
    color: var(--color-surface-500);
  }
</style>
```

### 5.5 ExportButton 导出按钮

```svelte
/**
 * @file src/lib/components/common/ExportButton.svelte
 * @description 数据导出按钮 (支持 CSV/JSON)
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { exportToCSV, exportToJSON } from '$lib/utils/export';

  export let data: any;

  let isOpen = false;

  // ============================================
  // 导出处理函数
  // ============================================
  function handleExport(format: 'csv' | 'json') {
    const filename = `claude-stats-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToJSON(data, filename);
    }

    isOpen = false;
  }
</script>

<div class="export-button">
  <button class="btn-export" on:click={() => isOpen = !isOpen}>
    <span class="icon">⬇️</span>
    导出数据
  </button>

  {#if isOpen}
    <div class="dropdown">
      <button on:click={() => handleExport('csv')}>
        导出为 CSV
      </button>
      <button on:click={() => handleExport('json')}>
        导出为 JSON
      </button>
    </div>
  {/if}
</div>

<style>
  .export-button {
    position: relative;
  }

  .btn-export {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary-500);
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-weight: 500;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: white;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 10;
  }

  .dropdown button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s;
  }

  .dropdown button:hover {
    background: var(--color-surface-100);
  }
</style>
```

### 5.6 ThemeToggle 主题切换

```svelte
/**
 * @file src/lib/components/common/ThemeToggle.svelte
 * @description 深色/浅色主题切换组件
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

<script lang="ts">
  import { themeStore } from '$lib/stores/theme';

  // ============================================
  // 主题切换逻辑
  // ============================================
  function toggleTheme() {
    themeStore.toggle();
  }

  $: isDark = $themeStore.current === 'dark';
</script>

<button class="theme-toggle" on:click={toggleTheme} title="切换主题">
  {#if isDark}
    <!-- 月亮图标 (深色模式) -->
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  {:else}
    <!-- 太阳图标 (浅色模式) -->
    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: var(--color-surface-100);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-toggle:hover {
    background: var(--color-surface-200);
  }

  .icon {
    width: 20px;
    height: 20px;
    color: var(--color-surface-700);
  }
</style>
```

---

## 六、状态管理

### 6.1 Stats Store (统计数据)

```typescript
/**
 * @file src/lib/stores/stats.ts
 * @description 统计数据状态管理
 *
 * 职责:
 * 1. 管理全局统计数据
 * 2. 提供数据获取方法
 * 3. 处理数据更新
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { writable, derived } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import type { StatsData, ModelUsage } from '$lib/types/stats';

// ============================================
// 创建可写 store
// ============================================
function createStatsStore() {
  const { subscribe, set, update } = writable<StatsData>({
    version: 1,
    lastComputedDate: '',
    totalSessions: 0,
    totalMessages: 0,
    firstSessionDate: '',
    dailyActivity: [],
    dailyModelTokens: [],
    modelUsage: {},
    hourCounts: {},
    longestSession: null
  });

  return {
    subscribe,

    // ============================================
    // 获取最新统计数据
    // ============================================
    async fetch() {
      try {
        const data = await apiClient.get<StatsData>('/api/stats');
        set(data);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    },

    // ============================================
    // 按日期范围获取数据
    // ============================================
    async fetchByDateRange(startDate: Date, endDate: Date) {
      try {
        const data = await apiClient.get<StatsData>('/api/stats/range', {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        });
        set(data);
      } catch (error) {
        console.error('获取日期范围数据失败:', error);
      }
    },

    // ============================================
    // 更新数据(用于 WebSocket 推送)
    // ============================================
    updateFromWS(newData: Partial<StatsData>) {
      update(current => ({ ...current, ...newData }));
    },

    // ============================================
    // 重置数据
    // ============================================
    reset() {
      set({
        version: 1,
        lastComputedDate: '',
        totalSessions: 0,
        totalMessages: 0,
        firstSessionDate: '',
        dailyActivity: [],
        dailyModelTokens: [],
        modelUsage: {},
        hourCounts: {},
        longestSession: null
      });
    }
  };
}

export const statsStore = createStatsStore();

// ============================================
// 派生 store: 计算总 Token 数
// ============================================
export const totalTokens = derived(statsStore, $stats => {
  return Object.values($stats.modelUsage).reduce((sum, model) => {
    return sum + model.inputTokens + model.outputTokens;
  }, 0);
});

// ============================================
// 派生 store: 计算总费用
// ============================================
export const estimatedCost = derived(statsStore, $stats => {
  return Object.entries($stats.modelUsage).reduce((sum, [modelId, usage]) => {
    // 这里需要根据模型定价计算
    const pricing = getPricing(modelId);
    const cost = (
      usage.inputTokens * pricing.input +
      usage.outputTokens * pricing.output +
      usage.cacheReadInputTokens * pricing.cacheRead +
      usage.cacheCreationInputTokens * pricing.cacheWrite
    ) / 1_000_000;

    return sum + cost;
  }, 0);
});

// ============================================
// 辅助函数: 获取模型定价
// ============================================
function getPricing(modelId: string) {
  const pricingMap: Record<string, any> = {
    'claude-opus-4-5-20251101': {
      input: 15,
      output: 75,
      cacheRead: 1.5,
      cacheWrite: 18.75
    },
    'claude-sonnet-4-5-20250929': {
      input: 3,
      output: 15,
      cacheRead: 0.3,
      cacheWrite: 3.75
    },
    'claude-haiku-4-5': {
      input: 0.8,
      output: 4,
      cacheRead: 0.08,
      cacheWrite: 1
    }
  };

  return pricingMap[modelId] || pricingMap['claude-sonnet-4-5-20250929'];
}
```

### 6.2 Theme Store (主题)

```typescript
/**
 * @file src/lib/stores/theme.ts
 * @description 主题状态管理
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'auto';

// ============================================
// 从 localStorage 读取初始主题
// ============================================
function getInitialTheme(): Theme {
  if (!browser) return 'light';

  const stored = localStorage.getItem('theme') as Theme;
  if (stored) return stored;

  // 检测系统主题偏好
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ============================================
// 创建主题 store
// ============================================
function createThemeStore() {
  const { subscribe, set, update } = writable<{ current: Theme }>({
    current: getInitialTheme()
  });

  return {
    subscribe,

    // ============================================
    // 设置主题
    // ============================================
    set(theme: Theme) {
      if (browser) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
      set({ current: theme });
    },

    // ============================================
    // 切换主题
    // ============================================
    toggle() {
      update(state => {
        const newTheme = state.current === 'light' ? 'dark' : 'light';
        if (browser) {
          localStorage.setItem('theme', newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
        }
        return { current: newTheme };
      });
    }
  };
}

export const themeStore = createThemeStore();
```

### 6.3 WebSocket Store

```typescript
/**
 * @file src/lib/stores/websocket.ts
 * @description WebSocket 连接管理
 *
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { writable } from 'svelte/store';
import { statsStore } from './stats';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// ============================================
// 创建 WebSocket store
// ============================================
function createWebSocketStore() {
  const { subscribe, set } = writable<{
    state: ConnectionState;
    error: string | null;
  }>({
    state: 'disconnected',
    error: null
  });

  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  const RECONNECT_DELAY = 5000; // 5秒后重连

  return {
    subscribe,

    // ============================================
    // 连接 WebSocket
    // ============================================
    connect() {
      if (ws?.readyState === WebSocket.OPEN) {
        console.log('WebSocket 已连接,跳过重复连接');
        return;
      }

      set({ state: 'connecting', error: null });

      // 根据协议自动选择 ws:// 或 wss://
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      // ============================================
      // 连接成功
      // ============================================
      ws.onopen = () => {
        console.log('WebSocket 连接成功');
        set({ state: 'connected', error: null });

        // 清除重连定时器
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      // ============================================
      // 接收消息
      // ============================================
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // 根据消息类型处理
          switch (message.type) {
            case 'stats_update':
              statsStore.updateFromWS(message.data);
              break;
            case 'ping':
              // 心跳响应
              ws?.send(JSON.stringify({ type: 'pong' }));
              break;
            default:
              console.warn('未知消息类型:', message.type);
          }
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error);
        }
      };

      // ============================================
      // 连接关闭
      // ============================================
      ws.onclose = () => {
        console.log('WebSocket 连接关闭');
        set({ state: 'disconnected', error: null });

        // 5秒后自动重连
        reconnectTimer = setTimeout(() => {
          this.connect();
        }, RECONNECT_DELAY) as unknown as number;
      };

      // ============================================
      // 连接错误
      // ============================================
      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        set({ state: 'error', error: '连接失败' });
      };
    },

    // ============================================
    // 断开连接
    // ============================================
    disconnect() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (ws) {
        ws.close();
        ws = null;
      }

      set({ state: 'disconnected', error: null });
    },

    // ============================================
    // 发送消息
    // ============================================
    send(data: any) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      } else {
        console.warn('WebSocket 未连接,无法发送消息');
      }
    }
  };
}

export const wsStore = createWebSocketStore();
```

---

## 七、主题系统

### 7.1 CSS 变量定义

```css
/**
 * @file src/lib/styles/theme.css
 * @description 主题系统 CSS 变量定义
 * @author Atlas.oi
 * @date 2026-01-06
 */

/* ============================================ */
/* 浅色主题 (默认) */
/* ============================================ */
:root,
[data-theme='light'] {
  /* 主色调 (紫色渐变) */
  --color-primary-50: #f5f3ff;
  --color-primary-100: #ede9fe;
  --color-primary-500: #667eea;
  --color-primary-600: #764ba2;
  --color-primary-700: #5b21b6;

  /* 表面色 (灰度) */
  --color-surface-50: #fafafa;
  --color-surface-100: #f4f4f5;
  --color-surface-200: #e4e4e7;
  --color-surface-300: #d4d4d8;
  --color-surface-400: #a1a1aa;
  --color-surface-500: #71717a;
  --color-surface-600: #52525b;
  --color-surface-700: #3f3f46;
  --color-surface-800: #27272a;
  --color-surface-900: #18181b;

  /* 成功色 (绿色) */
  --color-success-500: #10b981;
  --color-success-600: #059669;

  /* 警告色 (黄色) */
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;

  /* 信息色 (蓝色) */
  --color-info-500: #3b82f6;
  --color-info-600: #2563eb;

  /* 错误色 (红色) */
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* ============================================ */
/* 深色主题 */
/* ============================================ */
[data-theme='dark'] {
  /* 主色调 (调整饱和度) */
  --color-primary-50: #1e1b4b;
  --color-primary-100: #312e81;
  --color-primary-500: #818cf8;
  --color-primary-600: #a78bfa;
  --color-primary-700: #c4b5fd;

  /* 表面色 (反转) */
  --color-surface-50: #18181b;
  --color-surface-100: #27272a;
  --color-surface-200: #3f3f46;
  --color-surface-300: #52525b;
  --color-surface-400: #71717a;
  --color-surface-500: #a1a1aa;
  --color-surface-600: #d4d4d8;
  --color-surface-700: #e4e4e7;
  --color-surface-800: #f4f4f5;
  --color-surface-900: #fafafa;

  /* 成功色 (深色友好) */
  --color-success-500: #34d399;
  --color-success-600: #10b981;

  /* 警告色 */
  --color-warning-500: #fbbf24;
  --color-warning-600: #f59e0b;

  /* 信息色 */
  --color-info-500: #60a5fa;
  --color-info-600: #3b82f6;

  /* 错误色 */
  --color-error-500: #f87171;
  --color-error-600: #ef4444;

  /* 阴影 (深色更明显) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}

/* ============================================ */
/* 全局样式 */
/* ============================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
  background-color: var(--color-surface-50);
  color: var(--color-surface-900);
  transition: background-color 0.3s, color 0.3s;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-surface-100);
}

::-webkit-scrollbar-thumb {
  background: var(--color-surface-400);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-surface-500);
}
```

### 7.2 主题切换逻辑

已在 [5.6 ThemeToggle](#56-themetoggle-主题切换) 和 [6.2 Theme Store](#62-theme-store-主题) 中实现。

---

## 八、响应式设计

### 8.1 断点系统

```css
/**
 * @file tailwind.config.js
 * @description Tailwind CSS 配置 (包含断点定义)
 * @author Atlas.oi
 * @date 2026-01-06
 */

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    screens: {
      'sm': '640px',   // 手机横屏
      'md': '768px',   // 平板
      'lg': '1024px',  // 桌面
      'xl': '1280px',  // 大屏
      '2xl': '1536px'  // 超大屏
    },
    extend: {
      colors: {
        // 使用 CSS 变量
        primary: 'var(--color-primary-500)',
        surface: {
          50: 'var(--color-surface-50)',
          100: 'var(--color-surface-100)',
          // ... 其他层级
        }
      }
    }
  },
  plugins: []
};
```

### 8.2 响应式布局示例

```svelte
<!-- 移动端适配示例 -->
<style>
  /* 桌面端: 4列网格 */
  .overview-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }

  /* 平板端: 2列网格 */
  @media (max-width: 1024px) {
    .overview-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* 手机端: 单列 */
  @media (max-width: 640px) {
    .overview-cards {
      grid-template-columns: 1fr;
    }

    /* 隐藏侧边栏 */
    .sidebar {
      display: none;
    }

    /* 调整 padding */
    .content {
      padding: 1rem;
    }
  }
</style>
```

---

## 九、实时通信

### 9.1 WebSocket 连接

已在 [6.3 WebSocket Store](#63-websocket-store) 中实现。

### 9.2 后端 WebSocket 端点 (参考)

```python
# backend/websocket.py
from aiohttp import web
import asyncio
import json

async def websocket_handler(request):
    """WebSocket 连接处理"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    # 添加到活跃连接池
    request.app['websockets'].add(ws)

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                data = json.loads(msg.data)

                # 处理 pong 响应
                if data['type'] == 'pong':
                    continue

            elif msg.type == web.WSMsgType.ERROR:
                print(f'WebSocket 错误: {ws.exception()}')

    finally:
        # 从连接池移除
        request.app['websockets'].discard(ws)

    return ws

async def broadcast_stats_update(app, stats_data):
    """广播统计数据更新"""
    message = json.dumps({
        'type': 'stats_update',
        'data': stats_data
    })

    # 向所有客户端发送
    for ws in app['websockets']:
        await ws.send_str(message)
```

---

## 十、性能优化

### 10.1 优化策略

| 优化项 | 实现方式 | 预期效果 |
|--------|----------|----------|
| **代码分割** | Vite 动态 import | 首屏加载 < 2s |
| **懒加载图表** | IntersectionObserver | 减少初始渲染时间 |
| **虚拟滚动** | svelte-virtual-list | 支持大数据列表 |
| **数据缓存** | localStorage + TTL | 减少 API 请求 |
| **防抖节流** | debounce/throttle | 优化搜索和滚动 |
| **图片优化** | WebP + lazy loading | 减少带宽 |

### 10.2 代码分割示例

```typescript
// src/routes/history/+page.ts
export const load = async () => {
  // 懒加载大型图表库
  const { HeavyChart } = await import('$lib/components/charts/HeavyChart.svelte');
  return { HeavyChart };
};
```

### 10.3 性能监控

```typescript
/**
 * @file src/lib/utils/performance.ts
 * @description 性能监控工具
 * @author Atlas.oi
 * @date 2026-01-06
 */

export function measureRenderTime(componentName: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (duration > 16) {  // 超过 1 帧(16ms)则记录
      console.warn(`[性能警告] ${componentName} 渲染耗时: ${duration.toFixed(2)}ms`);
    }
  };
}

// 使用示例
// const endMeasure = measureRenderTime('TrendChart');
// ... 渲染逻辑
// endMeasure();
```

---

## 附录

### A. 类型定义示例

```typescript
/**
 * @file src/lib/types/stats.ts
 * @description 统计数据类型定义
 * @author Atlas.oi
 * @date 2026-01-06
 */

export interface StatsData {
  version: number;
  lastComputedDate: string;
  totalSessions: number;
  totalMessages: number;
  firstSessionDate: string;
  dailyActivity: DailyActivity[];
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsage>;
  hourCounts: Record<string, number>;
  longestSession: LongestSession | null;
}

export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

export interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
}

export interface LongestSession {
  sessionId: string;
  duration: number;
  messageCount: number;
}
```

### B. 工具函数示例

```typescript
/**
 * @file src/lib/utils/format.ts
 * @description 数据格式化工具函数
 * @author Atlas.oi
 * @date 2026-01-06
 */

/**
 * 格式化数字 (带千分位)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化货币 (美元)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * 格式化文件大小
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(2)} ${units[i]}`;
}

/**
 * 格式化时长 (毫秒转可读格式)
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
```

### C. 开发环境配置

```typescript
/**
 * @file vite.config.ts
 * @description Vite 配置文件
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  server: {
    port: 51173,  // 不常用的 5 位数端口
    proxy: {
      // 代理 API 请求到后端
      '/api': {
        target: 'http://localhost:51888',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:51888',
        ws: true
      }
    }
  },

  build: {
    // 代码分割阈值
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          'vendor': ['svelte', '@sveltejs/kit'],
          'charts': ['layerchart', 'd3-scale', 'd3-shape']
        }
      }
    }
  },

  optimizeDeps: {
    include: ['layerchart', 'date-fns']
  }
});
```

---

## 总结

### 核心特性

1. **轻量高效**: Svelte 编译时优化,打包体积仅 ~5KB
2. **实时更新**: WebSocket 推送,延迟 < 100ms
3. **响应式设计**: 支持桌面/平板/手机全平台
4. **主题系统**: 深色/浅色无缝切换
5. **数据可视化**: Layerchart 高性能图表
6. **类型安全**: TypeScript 全栈类型检查

### 技术优势

- **编译时优化**: 无虚拟 DOM,性能最优
- **开发效率**: 代码量减少 30-40%
- **包体积小**: gzip 后仅 5KB (vs Vue 30KB)
- **易于维护**: 组件化设计,职责清晰

### 下一步行动

1. ✅ 完成前端架构设计文档
2. ⏭️ 初始化 Svelte + Vite 项目
3. ⏭️ 实现核心组件 (StatCard, TrendChart)
4. ⏭️ 集成后端 API
5. ⏭️ 实现 WebSocket 实时更新
6. ⏭️ Docker 容器化部署

---

*文档版本: 1.0.0*
*最后更新: 2026-01-06*
*作者: Atlas.oi*
