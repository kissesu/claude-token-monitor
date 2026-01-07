# ModelUsagePanel 组件使用文档

## 组件概述

`ModelUsagePanel` 是一个完整的模型使用统计面板组件，用于在仪表板中展示各模型的 Token 用量和费用统计。

## 功能特性

- 集成饼图/环形图可视化展示
- 支持模型筛选下拉框
- 支持多种排序方式（Token 数、费用、占比、名称）
- 详细数据表格显示输入/输出/缓存统计
- 响应式设计，适配移动端和桌面端
- 支持浅色/深色主题切换
- 合计行自动计算

## 基本用法

```svelte
<script lang="ts">
  import { ModelUsagePanel } from '$lib/components/dashboard';
</script>

<ModelUsagePanel />
```

## Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `class` | `string` | `''` | 自定义 CSS 类名 |
| `height` | `string` | `'auto'` | 面板高度 |
| `showChart` | `boolean` | `true` | 是否显示图表 |
| `showTable` | `boolean` | `true` | 是否显示表格 |

## 使用示例

### 基本示例

```svelte
<ModelUsagePanel />
```

### 仅显示图表

```svelte
<ModelUsagePanel showTable={false} />
```

### 仅显示表格

```svelte
<ModelUsagePanel showChart={false} />
```

### 自定义样式和高度

```svelte
<ModelUsagePanel
  class="my-custom-class"
  height="800px"
/>
```

### 完整配置示例

```svelte
<script lang="ts">
  import { ModelUsagePanel } from '$lib/components/dashboard';
</script>

<div class="dashboard-container">
  <ModelUsagePanel
    class="shadow-lg"
    height="auto"
    showChart={true}
    showTable={true}
  />
</div>

<style>
  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
```

## 数据来源

组件自动从 `$lib/stores/statsStore` 获取数据，无需手动传入。确保在使用组件前，statsStore 已经正确初始化并获取了数据。

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { statsStore } from '$lib/stores';
  import { ModelUsagePanel } from '$lib/components/dashboard';

  onMount(async () => {
    // 在组件挂载时获取数据
    await fetchStats();
  });

  async function fetchStats() {
    const response = await fetch('/api/stats');
    const data = await response.json();
    statsStore.setCurrent(data);
  }
</script>

<ModelUsagePanel />
```

## 交互功能

### 模型筛选

用户可以通过下拉框选择特定模型，面板会自动过滤显示该模型的数据。

### 排序

支持以下排序方式：
- **按 Token 数**：按总 Token 数量降序
- **按费用**：按费用降序
- **按占比**：按百分比降序
- **按名称**：按模型名称字母顺序

### 重置

当有筛选或排序操作时，会显示"重置"按钮，点击可恢复默认状态。

## 数据格式

组件期望的数据结构（来自 statsStore）：

```typescript
interface StatsCache {
  total_tokens: number;
  total_cost: number;
  updated_at: string;
  models: Record<string, ModelUsage>;
}

interface ModelUsage {
  name: string;
  tokens: {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_creation_tokens: number;
  };
  cost: number;
  percentage: number;
}
```

## 样式定制

组件使用 Tailwind CSS，支持深色模式。可以通过 `class` 属性传入自定义类名：

```svelte
<ModelUsagePanel class="custom-shadow custom-border" />
```

## 无障碍性

- 使用语义化 HTML 标签
- 表单控件都有正确的 label 关联
- 支持键盘导航
- 表格具有正确的 scope 属性

## 性能优化

- 使用 Svelte 的响应式语法，自动优化渲染
- 派生状态（derived stores）仅在依赖变化时重新计算
- 图表组件懒加载，仅在需要时渲染

## 注意事项

1. 确保 statsStore 已初始化并有数据
2. 组件依赖 `ModelPieChart` 图表组件
3. 需要正确配置 Tailwind CSS
4. 深色模式需要在全局配置中启用

## 版本历史

- **v1.0.0** (2026-01-07)
  - 初始版本
  - 支持图表和表格展示
  - 支持筛选和排序
  - 响应式设计
  - 深色模式支持
