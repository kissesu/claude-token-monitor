/**
 * @file frontend-development-plan.md
 * @description Claude Token Monitor 前端开发计划与任务分解
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 前端开发计划

## 一、项目概述

### 1.1 技术栈

| 组件 | 技术选型 | 版本要求 |
|------|----------|----------|
| 框架 | Svelte | >= 4.2 |
| 构建工具 | Vite | >= 5.0 |
| 语言 | TypeScript | >= 5.3 |
| UI 框架 | Skeleton UI | >= 2.5 |
| 图表库 | Layerchart | >= 0.40 |
| 状态管理 | Svelte Stores | 内置 |
| 测试 | Vitest + Testing Library | >= 1.0 |
| E2E 测试 | Playwright | >= 1.40 |

### 1.2 设计原则

- **编译时优化**: Svelte 编译时框架，零运行时开销
- **响应式设计**: 移动端优先，适配各种屏幕尺寸
- **主题切换**: 支持 Dark/Light 模式
- **实时更新**: WebSocket 实时数据推送
- **性能优先**: 首屏加载 < 1s，交互响应 < 100ms

---

## 二、目录结构

```
frontend/
├── src/
│   ├── app.html              # HTML 模板
│   ├── app.css               # 全局样式
│   ├── App.svelte            # 根组件
│   ├── main.ts               # 入口文件
│   ├── lib/
│   │   ├── components/       # 组件目录
│   │   │   ├── common/       # 通用组件
│   │   │   │   ├── StatCard.svelte
│   │   │   │   ├── LoadingSpinner.svelte
│   │   │   │   ├── ErrorMessage.svelte
│   │   │   │   └── DateRangePicker.svelte
│   │   │   ├── charts/       # 图表组件
│   │   │   │   ├── TrendChart.svelte
│   │   │   │   ├── ModelPieChart.svelte
│   │   │   │   ├── ActivityHeatmap.svelte
│   │   │   │   └── CostChart.svelte
│   │   │   ├── dashboard/    # 仪表板组件
│   │   │   │   ├── StatsOverview.svelte
│   │   │   │   ├── ModelUsagePanel.svelte
│   │   │   │   ├── DailyActivityPanel.svelte
│   │   │   │   └── CostEstimatePanel.svelte
│   │   │   └── layout/       # 布局组件
│   │   │       ├── Header.svelte
│   │   │       ├── Sidebar.svelte
│   │   │       ├── Footer.svelte
│   │   │       └── ThemeToggle.svelte
│   │   ├── stores/           # 状态管理
│   │   │   ├── statsStore.ts
│   │   │   ├── themeStore.ts
│   │   │   ├── wsStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── services/         # API 服务
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── export.ts
│   │   ├── types/            # 类型定义
│   │   │   ├── stats.ts
│   │   │   ├── api.ts
│   │   │   └── chart.ts
│   │   └── utils/            # 工具函数
│   │       ├── formatters.ts
│   │       ├── calculations.ts
│   │       └── constants.ts
│   └── routes/               # 页面路由（可选 SvelteKit）
│       ├── +page.svelte
│       └── +layout.svelte
├── static/                   # 静态资源
│   ├── favicon.ico
│   └── fonts/
├── tests/
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── e2e/                  # E2E 测试
├── package.json
├── tsconfig.json
├── vite.config.ts
├── svelte.config.js
└── playwright.config.ts
```

---

## 三、开发阶段与任务分解

### Phase 1: 项目初始化 (Day 1-2)

#### 任务 1.1: 项目搭建
- [ ] 使用 Vite 创建 Svelte + TypeScript 项目
- [ ] 安装并配置 Skeleton UI
- [ ] 安装并配置 Layerchart
- [ ] 配置 ESLint + Prettier
- [ ] 配置路径别名 `$lib`

**验收标准**: `pnpm dev` 能正常启动开发服务器

#### 任务 1.2: 类型定义
```typescript
// src/lib/types/stats.ts
interface StatsCache {
  version: number;
  lastComputedDate: string;
  totalSessions: number;
  totalMessages: number;
  firstSessionDate: string;
  dailyActivity: DailyActivity[];
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsage>;
  hourCounts: Record<string, number>;
  longestSession: SessionInfo;
}

interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
}
```
- [ ] 定义所有数据类型接口
- [ ] 定义 API 响应类型
- [ ] 定义图表数据类型
- [ ] 添加类型导出

**验收标准**: TypeScript 编译无类型错误

#### 任务 1.3: 全局样式配置
- [ ] 配置 Skeleton UI 主题
- [ ] 定义 CSS 变量（颜色、间距、圆角）
- [ ] 配置 Dark/Light 主题色板
- [ ] 添加全局响应式断点

**验收标准**: 主题切换正常工作

---

### Phase 2: 基础组件开发 (Day 3-5)

#### 任务 2.1: 通用组件

**StatCard.svelte** - 统计卡片
```svelte
<script lang="ts">
  export let title: string;
  export let value: string | number;
  export let subtitle: string = '';
  export let trend: number | null = null;
  export let icon: string = '';
</script>
```
- [ ] 实现基础布局
- [ ] 支持趋势指示器（上升/下降）
- [ ] 支持图标显示
- [ ] 添加动画效果
- [ ] 编写单元测试

**LoadingSpinner.svelte** - 加载动画
- [ ] 实现多种尺寸（sm/md/lg）
- [ ] 支持自定义颜色
- [ ] 添加加载文本选项

**ErrorMessage.svelte** - 错误提示
- [ ] 支持多种错误类型
- [ ] 支持重试按钮
- [ ] 支持关闭功能

**DateRangePicker.svelte** - 日期范围选择器
- [ ] 实现日期范围选择
- [ ] 支持快捷选项（今日/本周/本月）
- [ ] 支持自定义范围
- [ ] 编写单元测试

**验收标准**: 所有通用组件可复用，测试覆盖率 > 80%

#### 任务 2.2: 布局组件

**Header.svelte** - 顶部导航
- [ ] 显示应用标题
- [ ] 集成主题切换
- [ ] 显示连接状态
- [ ] 响应式适配

**ThemeToggle.svelte** - 主题切换
- [ ] 实现 Dark/Light 切换
- [ ] 保存用户偏好到 localStorage
- [ ] 添加过渡动画

**Footer.svelte** - 底部信息
- [ ] 显示版本信息
- [ ] 显示最后更新时间
- [ ] 显示数据源状态

**验收标准**: 布局组件在各种屏幕尺寸下正常显示

---

### Phase 3: 图表组件开发 (Day 6-9)

#### 任务 3.1: TrendChart.svelte - 趋势图表
```svelte
<script lang="ts">
  import { Chart, Line, Axis, Tooltip } from 'layerchart';

  export let data: TrendDataPoint[];
  export let xKey: string = 'date';
  export let yKey: string = 'value';
  export let color: string = 'primary';
</script>
```
- [ ] 实现折线图基础功能
- [ ] 支持多数据系列
- [ ] 支持缩放和平移
- [ ] 添加 Tooltip 交互
- [ ] 响应式适配
- [ ] 编写单元测试

**验收标准**: 图表渲染流畅，交互响应 < 50ms

#### 任务 3.2: ModelPieChart.svelte - 模型分布饼图
- [ ] 实现饼图/环形图
- [ ] 显示各模型 token 占比
- [ ] 支持图例交互
- [ ] 添加悬浮详情
- [ ] 编写单元测试

#### 任务 3.3: ActivityHeatmap.svelte - 活动热力图
- [ ] 实现日历热力图
- [ ] 显示每日消息数量
- [ ] 支持颜色强度映射
- [ ] 添加悬浮详情
- [ ] 编写单元测试

#### 任务 3.4: CostChart.svelte - 费用图表
- [ ] 实现堆叠柱状图
- [ ] 显示各模型费用
- [ ] 支持时间范围切换
- [ ] 添加费用汇总
- [ ] 编写单元测试

**验收标准**: 所有图表组件渲染正确，交互流畅

---

### Phase 4: 状态管理与服务 (Day 10-12)

#### 任务 4.1: statsStore.ts - 统计数据 Store
```typescript
import { writable, derived } from 'svelte/store';
import type { StatsCache } from '$lib/types/stats';

// 原始统计数据
export const stats = writable<StatsCache | null>(null);

// 派生数据：缓存命中率
export const cacheHitRate = derived(stats, ($stats) => {
  if (!$stats) return 0;
  // 计算逻辑
});

// 派生数据：总费用
export const totalCost = derived(stats, ($stats) => {
  if (!$stats) return 0;
  // 计算逻辑
});
```
- [ ] 实现原始数据 Store
- [ ] 实现派生数据计算
- [ ] 添加数据加载状态
- [ ] 添加错误状态
- [ ] 编写单元测试

#### 任务 4.2: wsStore.ts - WebSocket Store
```typescript
import { writable } from 'svelte/store';

export const wsStatus = writable<'connecting' | 'connected' | 'disconnected'>('disconnected');
export const wsError = writable<string | null>(null);
```
- [ ] 实现连接状态管理
- [ ] 实现自动重连逻辑
- [ ] 实现消息处理
- [ ] 编写单元测试

#### 任务 4.3: themeStore.ts - 主题 Store
- [ ] 实现主题状态
- [ ] 实现 localStorage 持久化
- [ ] 实现系统主题检测
- [ ] 编写单元测试

#### 任务 4.4: API 服务 (api.ts)
```typescript
const API_BASE = '/api/v1';

export async function fetchStats(): Promise<StatsCache> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function fetchDailyStats(startDate: string, endDate: string) {
  // ...
}

export async function exportData(format: 'csv' | 'json') {
  // ...
}
```
- [ ] 实现所有 API 调用函数
- [ ] 添加错误处理
- [ ] 添加请求超时
- [ ] 添加请求重试
- [ ] 编写单元测试

#### 任务 4.5: WebSocket 服务 (websocket.ts)
```typescript
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() { /* ... */ }
  disconnect() { /* ... */ }
  private handleMessage(event: MessageEvent) { /* ... */ }
  private handleReconnect() { /* ... */ }
}
```
- [ ] 实现 WebSocket 连接管理
- [ ] 实现自动重连（指数退避）
- [ ] 实现心跳检测
- [ ] 实现消息解析
- [ ] 编写单元测试

**验收标准**: 状态管理正确，WebSocket 连接稳定

---

### Phase 5: 仪表板页面开发 (Day 13-16)

#### 任务 5.1: StatsOverview.svelte - 统计概览
- [ ] 显示总 Token 数
- [ ] 显示缓存命中率
- [ ] 显示总费用估算
- [ ] 显示会话数量
- [ ] 集成 StatCard 组件
- [ ] 添加实时更新指示

#### 任务 5.2: ModelUsagePanel.svelte - 模型用量面板
- [ ] 显示各模型 Token 用量
- [ ] 集成饼图组件
- [ ] 支持模型筛选
- [ ] 添加详细数据表格

#### 任务 5.3: DailyActivityPanel.svelte - 每日活动面板
- [ ] 显示每日消息趋势
- [ ] 集成热力图组件
- [ ] 支持日期范围选择
- [ ] 显示高峰时段

#### 任务 5.4: CostEstimatePanel.svelte - 费用估算面板
- [ ] 显示各模型费用
- [ ] 集成费用图表
- [ ] 显示费用趋势
- [ ] 添加费用明细

#### 任务 5.5: 主页面集成 (App.svelte)
- [ ] 集成所有面板组件
- [ ] 实现响应式布局（Grid）
- [ ] 添加加载状态
- [ ] 添加错误处理
- [ ] 实现数据刷新

**验收标准**: 仪表板显示完整，数据实时更新

---

### Phase 6: 导出功能与设置 (Day 17-18)

#### 任务 6.1: 导出功能
- [ ] 实现 CSV 导出
- [ ] 实现 JSON 导出
- [ ] 添加导出进度指示
- [ ] 支持时间范围选择
- [ ] 支持字段选择

#### 任务 6.2: 设置面板
- [ ] 主题设置
- [ ] 刷新频率设置
- [ ] 通知设置
- [ ] 关于信息

**验收标准**: 导出功能正常，设置能持久化

---

### Phase 7: 测试与优化 (Day 19-20)

#### 任务 7.1: 单元测试
- [ ] 组件单元测试（Vitest + Testing Library）
- [ ] Store 单元测试
- [ ] 工具函数单元测试
- [ ] 测试覆盖率 > 70%

#### 任务 7.2: E2E 测试
- [ ] 页面加载测试
- [ ] 数据显示测试
- [ ] 交互功能测试
- [ ] 主题切换测试
- [ ] 导出功能测试

#### 任务 7.3: 性能优化
- [ ] 代码分割（lazy loading）
- [ ] 图片优化
- [ ] 构建产物优化
- [ ] Lighthouse 评分 > 90

#### 任务 7.4: 可访问性
- [ ] ARIA 标签
- [ ] 键盘导航
- [ ] 颜色对比度
- [ ] 屏幕阅读器支持

**验收标准**: 测试通过，性能指标达标

---

## 四、关键代码示例

### 4.1 StatCard 组件

```svelte
<!-- src/lib/components/common/StatCard.svelte -->
<script lang="ts">
  /**
   * @component StatCard
   * @description 统计数据卡片组件
   * @author Atlas.oi
   * @date 2026-01-06
   */

  export let title: string;
  export let value: string | number;
  export let subtitle: string = '';
  export let trend: number | null = null;
  export let icon: string = '';
  export let loading: boolean = false;

  // 计算趋势方向
  $: trendDirection = trend !== null ? (trend >= 0 ? 'up' : 'down') : null;
  $: trendClass = trendDirection === 'up' ? 'text-success-500' : 'text-error-500';
</script>

<div class="card p-4 variant-glass-surface">
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <p class="text-sm text-surface-600-300-token">{title}</p>

      {#if loading}
        <div class="h-8 w-24 bg-surface-300 dark:bg-surface-600 animate-pulse rounded mt-1" />
      {:else}
        <p class="text-2xl font-bold mt-1">{value}</p>
      {/if}

      {#if subtitle}
        <p class="text-xs text-surface-500 mt-1">{subtitle}</p>
      {/if}
    </div>

    {#if icon}
      <span class="text-2xl opacity-50">{icon}</span>
    {/if}
  </div>

  {#if trend !== null}
    <div class="mt-2 flex items-center gap-1 {trendClass}">
      <span class="text-sm">
        {trendDirection === 'up' ? '+' : ''}{trend.toFixed(1)}%
      </span>
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        {#if trendDirection === 'up'}
          <path d="M7 14l5-5 5 5H7z" />
        {:else}
          <path d="M7 10l5 5 5-5H7z" />
        {/if}
      </svg>
    </div>
  {/if}
</div>
```

### 4.2 Stats Store

```typescript
// src/lib/stores/statsStore.ts
/**
 * @file statsStore.ts
 * @description 统计数据状态管理
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { writable, derived } from 'svelte/store';
import type { StatsCache, ModelUsage } from '$lib/types/stats';

// ============================================
// 原始数据 Store
// ============================================
export const stats = writable<StatsCache | null>(null);
export const loading = writable<boolean>(false);
export const error = writable<string | null>(null);

// ============================================
// 派生数据：缓存命中率
// ============================================
export const cacheHitRate = derived(stats, ($stats) => {
  if (!$stats?.modelUsage) return 0;

  let totalInput = 0;
  let totalCacheRead = 0;

  Object.values($stats.modelUsage).forEach((usage: ModelUsage) => {
    totalInput += usage.inputTokens + usage.cacheReadInputTokens + usage.cacheCreationInputTokens;
    totalCacheRead += usage.cacheReadInputTokens;
  });

  if (totalInput === 0) return 0;
  return (totalCacheRead / totalInput) * 100;
});

// ============================================
// 派生数据：总费用估算
// ============================================
export const totalCost = derived(stats, ($stats) => {
  if (!$stats?.modelUsage) return 0;

  // 费用计算逻辑
  return Object.values($stats.modelUsage).reduce((sum, usage) => {
    return sum + (usage.costUSD || 0);
  }, 0);
});

// ============================================
// 派生数据：总 Token 数
// ============================================
export const totalTokens = derived(stats, ($stats) => {
  if (!$stats?.modelUsage) return 0;

  return Object.values($stats.modelUsage).reduce((sum, usage) => {
    return sum + usage.inputTokens + usage.outputTokens +
           usage.cacheReadInputTokens + usage.cacheCreationInputTokens;
  }, 0);
});

// ============================================
// 数据加载函数
// ============================================
export async function loadStats() {
  loading.set(true);
  error.set(null);

  try {
    const response = await fetch('/api/v1/stats');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    stats.set(data);
  } catch (e) {
    error.set(e instanceof Error ? e.message : 'Unknown error');
  } finally {
    loading.set(false);
  }
}
```

### 4.3 WebSocket 服务

```typescript
// src/lib/services/websocket.ts
/**
 * @file websocket.ts
 * @description WebSocket 连接管理服务
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { wsStatus, wsError } from '$lib/stores/wsStore';
import { stats } from '$lib/stores/statsStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * 建立 WebSocket 连接
   */
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;

    wsStatus.set('connecting');
    wsError.set(null);

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (e) {
      wsError.set('Failed to create WebSocket connection');
      this.handleReconnect();
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      wsStatus.set('connected');
      wsError.set(null);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onclose = () => {
      wsStatus.set('disconnected');
      this.stopHeartbeat();
      this.handleReconnect();
    };

    this.ws.onerror = () => {
      wsError.set('WebSocket connection error');
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'stats_update') {
        stats.set(data.payload);
      } else if (data.type === 'pong') {
        // 心跳响应
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }

  /**
   * 自动重连（指数退避）
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      wsError.set('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    wsStatus.set('disconnected');
  }
}

export const websocketService = new WebSocketService();
```

---

## 五、测试要求

### 5.1 单元测试 (Vitest)

| 测试范围 | 测试文件 | 最低覆盖率 |
|----------|----------|------------|
| StatCard 组件 | StatCard.test.ts | 90% |
| TrendChart 组件 | TrendChart.test.ts | 80% |
| statsStore | statsStore.test.ts | 95% |
| wsStore | wsStore.test.ts | 90% |
| API 服务 | api.test.ts | 85% |
| 工具函数 | formatters.test.ts | 95% |

### 5.2 E2E 测试 (Playwright)

| 测试场景 | 测试文件 | 说明 |
|----------|----------|------|
| 页面加载 | dashboard.spec.ts | 首页正常加载 |
| 数据显示 | stats.spec.ts | 统计数据正确显示 |
| 主题切换 | theme.spec.ts | Dark/Light 切换 |
| 导出功能 | export.spec.ts | CSV/JSON 导出 |
| 响应式 | responsive.spec.ts | 各种屏幕尺寸 |

### 5.3 测试命令

```bash
# 运行单元测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# 运行 E2E 测试（带 UI）
pnpm test:e2e:ui
```

---

## 六、依赖清单

### package.json

```json
{
  "name": "claude-token-monitor-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint src --ext .ts,.svelte",
    "format": "prettier --write src"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@testing-library/svelte": "^4.0.0",
    "@types/node": "^20.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-plugin-svelte": "^2.35.0",
    "playwright": "^1.40.0",
    "postcss": "^8.4.0",
    "prettier": "^3.1.0",
    "prettier-plugin-svelte": "^3.1.0",
    "svelte": "^4.2.0",
    "svelte-check": "^3.6.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "dependencies": {
    "@skeletonlabs/skeleton": "^2.5.0",
    "layerchart": "^0.40.0"
  }
}
```

---

## 七、性能指标

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| 首屏加载时间 | < 1s | Lighthouse |
| 首次内容绘制 (FCP) | < 1.2s | Lighthouse |
| 最大内容绘制 (LCP) | < 2.5s | Lighthouse |
| 交互响应时间 | < 100ms | Performance API |
| 图表渲染时间 | < 200ms | Performance API |
| 打包体积 (gzip) | < 100KB | Build output |
| Lighthouse 评分 | > 90 | Lighthouse |

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
