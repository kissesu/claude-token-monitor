/**
 * @file component-reference.md
 * @description Claude Token Monitor 组件速查表
 * @author Atlas.oi
 * @date 2026-01-06
 */

# 组件速查表

## 核心组件清单

### 统计卡片组件

| 组件名 | 路径 | 用途 | Props |
|--------|------|------|-------|
| **StatCard** | `components/stats/StatCard.svelte` | 展示单个指标 | title, value, icon, trend, color |
| **MetricCard** | `components/stats/MetricCard.svelte` | 带对比的指标卡片 | title, current, previous, unit |
| **ComparisonCard** | `components/stats/ComparisonCard.svelte` | 多指标对比 | metrics[], title |

### 图表组件

| 组件名 | 路径 | 用途 | Props |
|--------|------|------|-------|
| **TrendChart** | `components/charts/TrendChart.svelte` | Token 趋势折线图 | data, height |
| **ModelPieChart** | `components/charts/ModelPieChart.svelte` | 模型使用饼图 | data |
| **ActivityHeatmap** | `components/charts/ActivityHeatmap.svelte` | 活动热力图 | data |
| **CostChart** | `components/charts/CostChart.svelte` | 费用趋势图 | data, currency |

### 通用组件

| 组件名 | 路径 | 用途 | Props |
|--------|------|------|-------|
| **ThemeToggle** | `components/common/ThemeToggle.svelte` | 主题切换 | - |
| **ExportButton** | `components/common/ExportButton.svelte` | 数据导出 | data |
| **DateRangePicker** | `components/common/DateRangePicker.svelte` | 日期选择 | on:change |
| **LoadingSpinner** | `components/common/LoadingSpinner.svelte` | 加载动画 | size |
| **ErrorAlert** | `components/common/ErrorAlert.svelte` | 错误提示 | message, type |

### 布局组件

| 组件名 | 路径 | 用途 | Props |
|--------|------|------|-------|
| **Header** | `components/layout/Header.svelte` | 顶部导航 | - |
| **Sidebar** | `components/layout/Sidebar.svelte` | 侧边栏 | routes, currentPath |
| **Footer** | `components/layout/Footer.svelte` | 页脚 | - |

---

## 快速代码片段

### 1. 创建新的统计卡片

```svelte
<script lang="ts">
  import StatCard from '$lib/components/stats/StatCard.svelte';
</script>

<StatCard
  title="新指标"
  value="123,456"
  icon="chart"
  trend={12.5}
  color="primary"
/>
```

### 2. 添加新图表

```svelte
<script lang="ts">
  import { Chart, Svg, Line, Axis } from 'layerchart';

  export let data;
</script>

<div class="chart-container">
  <Chart {data} x="date" y="value">
    <Svg>
      <Axis placement="bottom" />
      <Axis placement="left" grid />
      <Line stroke="#667eea" strokeWidth={2} />
    </Svg>
  </Chart>
</div>
```

### 3. 使用日期选择器

```svelte
<script lang="ts">
  import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';

  function handleDateChange(event) {
    const { startDate, endDate } = event.detail;
    // 处理日期变更
  }
</script>

<DateRangePicker on:change={handleDateChange} />
```

### 4. WebSocket 实时更新

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { wsStore } from '$lib/stores/websocket';
  import { statsStore } from '$lib/stores/stats';

  onMount(() => {
    wsStore.connect();
    return () => wsStore.disconnect();
  });
</script>

<div>
  实时数据: {$statsStore.totalTokens}
</div>
```

### 5. 响应式网格布局

```svelte
<style>
  .grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .grid-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
```

---

## Store 使用指南

### statsStore

```typescript
import { statsStore } from '$lib/stores/stats';

// 获取数据
await statsStore.fetch();

// 按日期范围查询
await statsStore.fetchByDateRange(startDate, endDate);

// 订阅更新
$: totalTokens = $statsStore.totalTokens;
```

### themeStore

```typescript
import { themeStore } from '$lib/stores/theme';

// 切换主题
themeStore.toggle();

// 设置特定主题
themeStore.set('dark');

// 读取当前主题
$: currentTheme = $themeStore.current;
```

### wsStore

```typescript
import { wsStore } from '$lib/stores/websocket';

// 连接
wsStore.connect();

// 发送消息
wsStore.send({ type: 'ping' });

// 断开
wsStore.disconnect();

// 监听连接状态
$: isConnected = $wsStore.state === 'connected';
```

---

## 工具函数速查

### 格式化函数

```typescript
import {
  formatNumber,
  formatCurrency,
  formatBytes,
  formatDuration
} from '$lib/utils/format';

formatNumber(123456);      // "123,456"
formatCurrency(12.34);     // "$12.34"
formatBytes(1024);         // "1.00 KB"
formatDuration(3661000);   // "1h 1m"
```

### 计算函数

```typescript
import { calculateCacheHitRate } from '$lib/utils/calculate';

const hitRate = calculateCacheHitRate(modelUsage);
```

### 导出函数

```typescript
import { exportToCSV, exportToJSON } from '$lib/utils/export';

exportToCSV(data, 'filename');
exportToJSON(data, 'filename');
```

---

## 常用样式类

### Tailwind 常用类

```css
/* 布局 */
.flex .items-center .justify-between
.grid .grid-cols-4 .gap-4

/* 间距 */
.p-4 .px-6 .py-2 .m-4 .mx-auto

/* 颜色 */
.bg-primary-500 .text-white .border-surface-200

/* 响应式 */
.md:grid-cols-2 .lg:grid-cols-4
```

### 自定义 CSS 变量

```css
/* 使用主题颜色 */
background: var(--color-primary-500);
color: var(--color-surface-900);

/* 使用阴影 */
box-shadow: var(--shadow-md);
```

---

## 文件结构速查

```
src/lib/
├── components/
│   ├── charts/          # 图表组件
│   ├── stats/           # 统计卡片
│   ├── common/          # 通用组件
│   └── layout/          # 布局组件
├── stores/              # 状态管理
│   ├── stats.ts
│   ├── theme.ts
│   └── websocket.ts
├── utils/               # 工具函数
│   ├── api.ts
│   ├── format.ts
│   ├── calculate.ts
│   └── export.ts
├── types/               # 类型定义
│   ├── stats.ts
│   ├── chart.ts
│   └── api.ts
└── styles/              # 样式文件
    ├── theme.css
    └── global.css
```

---

## API 端点速查

| 端点 | 方法 | 参数 | 返回 |
|------|------|------|------|
| `/api/stats` | GET | - | 完整统计数据 |
| `/api/stats/range` | GET | start, end | 日期范围数据 |
| `/api/stats/model/:id` | GET | - | 单个模型数据 |
| `/api/export/csv` | GET | - | CSV 文件 |
| `/api/export/json` | GET | - | JSON 文件 |
| `/ws` | WebSocket | - | 实时更新 |

---

## TypeScript 类型速查

### StatsData

```typescript
interface StatsData {
  version: number;
  lastComputedDate: string;
  totalSessions: number;
  totalMessages: number;
  modelUsage: Record<string, ModelUsage>;
  dailyActivity: DailyActivity[];
  hourCounts: Record<string, number>;
}
```

### ModelUsage

```typescript
interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  costUSD: number;
}
```

### DailyActivity

```typescript
interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}
```

---

## 性能优化 Checklist

- [ ] 使用 `{#key}` 强制组件重新渲染
- [ ] 大列表使用虚拟滚动 (`svelte-virtual-list`)
- [ ] 懒加载路由 (`import()` 动态导入)
- [ ] 图片使用 `loading="lazy"`
- [ ] 防抖搜索输入 (`debounce`)
- [ ] 使用 `IntersectionObserver` 懒加载图表
- [ ] 启用 Vite 代码分割
- [ ] 压缩图片资源 (WebP)
- [ ] 使用 CSS `contain` 优化渲染
- [ ] 避免在循环中创建函数

---

## 调试技巧

### 1. 开启 Svelte DevTools

```bash
pnpm add -D @sveltejs/devtools
```

### 2. 性能分析

```typescript
// 在组件中
import { onMount } from 'svelte';

onMount(() => {
  const start = performance.now();
  return () => {
    console.log('Component lifetime:', performance.now() - start);
  };
});
```

### 3. 查看 Store 变化

```typescript
import { statsStore } from '$lib/stores/stats';

statsStore.subscribe(value => {
  console.log('Stats updated:', value);
});
```

---

*最后更新: 2026-01-06*
