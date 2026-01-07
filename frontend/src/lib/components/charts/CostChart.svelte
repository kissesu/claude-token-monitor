/**
 * @file 费用图表组件
 * @description 使用 Layerchart 实现堆叠柱状图，展示各模型费用
 *              支持时间范围切换、费用汇总、按模型颜色区分
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { Chart, Svg, Axis, Bars, Group, Tooltip, Text } from 'layerchart';
  import type { CostTrendData, ChartOptions } from '$lib/types';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 费用趋势数据
   * 包含日期、费用、累计费用等信息
   */
  export let data: CostTrendData[] = [];

  /**
   * 按模型分组的费用数据（可选）
   * 用于堆叠柱状图展示各模型费用
   */
  export let modelCostData: Array<{
    date: string;
    model: string;
    cost: number;
  }> = [];

  /**
   * 图表配置选项
   */
  export let options: Partial<ChartOptions> = {};

  /**
   * 图表高度（像素）
   */
  export let height: number = options.height || 400;

  /**
   * 图表类型
   * bar: 柱状图
   * stacked: 堆叠柱状图（需要 modelCostData）
   */
  export let chartType: 'bar' | 'stacked' = 'bar';

  /**
   * 是否显示累计费用曲线
   */
  export let showCumulative: boolean = false;

  /**
   * 是否正在加载
   */
  export let loading: boolean = false;

  /**
   * 自定义 CSS 类名
   */
  let className: string = '';
  export { className as class };

  // ============================================
  // 默认配置
  // ============================================
  const defaultOptions: ChartOptions = {
    title: '费用统计',
    xAxisLabel: '日期',
    yAxisLabel: '费用 ($)',
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    responsive: true,
    animationDuration: 300,
  };

  // ============================================
  // 响应式数据处理
  // ============================================
  $: mergedOptions = { ...defaultOptions, ...options };

  // ============================================
  // 颜色配置
  // ============================================
  const modelColors: Record<string, string> = {
    'claude-opus-4': '#3b82f6',
    'claude-sonnet-4': '#10b981',
    'claude-haiku-4': '#f59e0b',
    'claude-3-opus': '#ef4444',
    'claude-3-sonnet': '#8b5cf6',
    'claude-3-haiku': '#ec4899',
  };

  const defaultColor = '#6b7280';

  /**
   * 获取模型颜色
   */
  function getModelColor(model: string): string {
    return modelColors[model] || defaultColor;
  }

  // ============================================
  // 数据处理
  // ============================================

  /**
   * 基础柱状图数据
   */
  $: barChartData = data.map((item) => ({
    date: item.date,
    cost: item.cost,
    cumulative_cost: item.cumulative_cost || 0,
  }));

  /**
   * 堆叠柱状图数据
   * 按日期和模型分组
   */
  $: stackedChartData = (() => {
    if (chartType !== 'stacked' || modelCostData.length === 0) {
      return [];
    }

    // 按日期分组
    const groupedByDate = new Map<string, Array<{ model: string; cost: number }>>();

    modelCostData.forEach((item) => {
      if (!groupedByDate.has(item.date)) {
        groupedByDate.set(item.date, []);
      }
      groupedByDate.get(item.date)!.push({
        model: item.model,
        cost: item.cost,
      });
    });

    // 转换为图表数据格式
    return Array.from(groupedByDate.entries()).map(([date, models]) => ({
      date,
      models: models.sort((a, b) => b.cost - a.cost), // 按费用降序排序
      total: models.reduce((sum, m) => sum + m.cost, 0),
    }));
  })();

  /**
   * 获取所有唯一模型列表
   */
  $: uniqueModels = (() => {
    if (chartType !== 'stacked' || modelCostData.length === 0) {
      return [];
    }

    const models = new Set(modelCostData.map((item) => item.model));
    return Array.from(models);
  })();

  /**
   * 计算总费用
   */
  $: totalCost = data.reduce((sum, item) => sum + item.cost, 0);

  /**
   * 计算平均每日费用
   */
  $: avgDailyCost = data.length > 0 ? totalCost / data.length : 0;

  /**
   * Y 轴范围
   */
  $: yExtent = (() => {
    const chartData = chartType === 'stacked' ? stackedChartData : barChartData;
    if (chartData.length === 0) return [0, 10];

    const values =
      chartType === 'stacked'
        ? stackedChartData.map((d) => d.total)
        : barChartData.map((d) => d.cost);

    const max = Math.max(...values);
    const padding = max * 0.1 || 1;

    return [0, max + padding];
  })();

  /**
   * Tooltip 格式化
   */
  function formatTooltip(point: any) {
    const date = new Date(point.date);
    const formattedDate = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (chartType === 'stacked' && point.models) {
      let html = `
        <div class="p-3 min-w-[200px]">
          <div class="font-semibold text-sm mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">
            ${formattedDate}
          </div>
          <div class="space-y-1 text-xs">
      `;

      point.models.forEach((m: { model: string; cost: number }) => {
        html += `
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${getModelColor(m.model)}"></span>
              <span class="text-gray-600 dark:text-gray-400">${m.model}</span>
            </div>
            <span class="font-medium">$${m.cost.toFixed(4)}</span>
          </div>
        `;
      });

      html += `
            <div class="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 font-semibold">
              <span>总计</span>
              <span>$${point.total.toFixed(4)}</span>
            </div>
          </div>
        </div>
      `;

      return html;
    } else {
      return `
        <div class="p-3">
          <div class="font-semibold text-sm mb-2">${formattedDate}</div>
          <div class="text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">费用:</span>
              <span class="font-medium">$${point.cost.toFixed(4)}</span>
            </div>
            ${
              showCumulative && point.cumulative_cost
                ? `
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">累计:</span>
                <span class="font-medium">$${point.cumulative_cost.toFixed(2)}</span>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;
    }
  }

  /**
   * 图例切换（用于堆叠图）
   */
  let hiddenModels = new Set<string>();

  function toggleModel(model: string) {
    if (hiddenModels.has(model)) {
      hiddenModels.delete(model);
    } else {
      hiddenModels.add(model);
    }
    hiddenModels = hiddenModels; // 触发更新
  }

  /**
   * 过滤可见模型
   */
  $: visibleStackedData = stackedChartData.map((item) => ({
    ...item,
    models: item.models.filter((m) => !hiddenModels.has(m.model)),
    total: item.models
      .filter((m) => !hiddenModels.has(m.model))
      .reduce((sum, m) => sum + m.cost, 0),
  }));
</script>

<!-- ============================================
  图表容器
============================================ -->
<div
  class="cost-chart-container {className}"
  style="height: {height}px;"
  role="figure"
  aria-label="{mergedOptions.title}: 展示费用统计数据的{chartType === 'stacked' ? '堆叠柱状图' : '柱状图'}。总计 ${totalCost.toFixed(2)}，日均 ${avgDailyCost.toFixed(4)}。"
>
  <!-- 标题栏 -->
  <div class="flex justify-between items-start mb-4">
    <div>
      {#if mergedOptions.title}
        <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {mergedOptions.title}
        </div>
      {/if}
      <!-- 统计摘要 -->
      <div class="flex gap-6 mt-2 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span>总计: </span>
          <span class="font-semibold text-gray-900 dark:text-gray-100">${totalCost.toFixed(2)}</span>
        </div>
        <div>
          <span>日均: </span>
          <span class="font-semibold text-gray-900 dark:text-gray-100">${avgDailyCost.toFixed(4)}</span>
        </div>
      </div>
    </div>

    <!-- 图表类型切换 -->
    {#if modelCostData.length > 0}
      <div class="flex gap-2" role="group" aria-label="图表类型选择">
        <button
          type="button"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
          class:bg-blue-600={chartType === 'bar'}
          class:text-white={chartType === 'bar'}
          class:bg-gray-100={chartType !== 'bar'}
          class:dark:bg-gray-800={chartType !== 'bar'}
          class:text-gray-700={chartType !== 'bar'}
          class:dark:text-gray-300={chartType !== 'bar'}
          on:click={() => (chartType = 'bar')}
          aria-pressed={chartType === 'bar'}
        >
          总费用
        </button>
        <button
          type="button"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
          class:bg-blue-600={chartType === 'stacked'}
          class:text-white={chartType === 'stacked'}
          class:bg-gray-100={chartType !== 'stacked'}
          class:dark:bg-gray-800={chartType !== 'stacked'}
          class:text-gray-700={chartType !== 'stacked'}
          class:dark:text-gray-300={chartType !== 'stacked'}
          on:click={() => (chartType = 'stacked')}
          aria-pressed={chartType === 'stacked'}
        >
          按模型
        </button>
      </div>
    {/if}
  </div>

  <!-- 加载状态 -->
  {#if loading}
    <div class="flex items-center justify-center h-full" role="status" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
      <span class="sr-only">正在加载费用图表...</span>
    </div>
  {:else if data.length === 0}
    <!-- 空数据状态 -->
    <div class="flex items-center justify-center h-full">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <svg
          class="mx-auto h-12 w-12 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-sm">暂无数据</p>
      </div>
    </div>
  {:else}
    <!-- 图表主体 -->
    <div class="chart-wrapper" style="height: calc(100% - 6rem);">
      {#if chartType === 'bar'}
        <!-- 基础柱状图 -->
        <Chart
          data={barChartData}
          x="date"
          y="cost"
          yDomain={yExtent}
          padding={{ top: 20, right: 20, bottom: 40, left: 60 }}
        >
          <Svg>
            <!-- 网格线 -->
            {#if mergedOptions.showGrid}
              <Group>
                <Axis
                  placement="bottom"
                  grid={{ style: 'stroke: rgb(229 231 235); stroke-width: 1;' }}
                  rule={false}
                  format={(d) => {
                    const date = new Date(d);
                    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                  }}
                />
                <Axis
                  placement="left"
                  grid={{ style: 'stroke: rgb(229 231 235); stroke-width: 1;' }}
                  rule={false}
                  format={(d) => `$${d.toFixed(2)}`}
                />
              </Group>
            {/if}

            <!-- 柱状图 -->
            <Bars
              radius={4}
              strokeWidth={1}
              class="fill-blue-500 stroke-blue-600 transition-all duration-200 hover:opacity-80"
            />

            <!-- 坐标轴 -->
            <Axis placement="bottom" rule />
            <Axis placement="left" rule />

            <!-- 坐标轴标签 -->
            {#if mergedOptions.xAxisLabel}
              <Text
                value={mergedOptions.xAxisLabel}
                x="50%"
                y="100%"
                dy={30}
                class="text-xs fill-gray-600 dark:fill-gray-400 text-anchor-middle"
              />
            {/if}
            {#if mergedOptions.yAxisLabel}
              <Text
                value={mergedOptions.yAxisLabel}
                x="0"
                y="50%"
                dx={-45}
                rotate={-90}
                class="text-xs fill-gray-600 dark:fill-gray-400 text-anchor-middle"
              />
            {/if}
          </Svg>

          <!-- Tooltip -->
          {#if mergedOptions.showTooltip}
            <Tooltip let:data>
              <div
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {@html formatTooltip(data)}
              </div>
            </Tooltip>
          {/if}
        </Chart>
      {:else}
        <!-- 堆叠柱状图（使用原生 SVG 实现） -->
        <div class="stacked-chart w-full h-full">
          <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
            <!-- 定义渐变和样式 -->
            <defs>
              {#each uniqueModels as model}
                <linearGradient id="gradient-{model}" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:{getModelColor(model)};stop-opacity:0.9" />
                  <stop offset="100%" style="stop-color:{getModelColor(model)};stop-opacity:0.7" />
                </linearGradient>
              {/each}
            </defs>

            <!-- 网格线和坐标轴（简化版） -->
            <g class="grid" stroke="#e5e7eb" stroke-width="1">
              {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                <line
                  x1="60"
                  y1={20 + (260 - 20) * tick}
                  x2="780"
                  y2={20 + (260 - 20) * tick}
                  stroke-dasharray="2,2"
                />
              {/each}
            </g>

            <!-- 堆叠柱状图 -->
            <g class="bars">
              {#each visibleStackedData as item, i}
                {@const barWidth = (720 - 60) / visibleStackedData.length - 8}
                {@const barX = 60 + i * ((720 - 60) / visibleStackedData.length) + 4}

                {#each item.models as modelData, j}
                  {@const prevHeight = item.models
                    .slice(0, j)
                    .reduce((sum, m) => sum + m.cost, 0)}
                  {@const barHeight = (modelData.cost / yExtent[1]) * 240}
                  {@const barY = 260 - ((prevHeight + modelData.cost) / yExtent[1]) * 240}

                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#gradient-{modelData.model})"
                    stroke="white"
                    stroke-width="1"
                    rx="2"
                    class="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                  />
                {/each}
              {/each}
            </g>

            <!-- X 轴标签 -->
            <g class="x-axis-labels" text-anchor="middle" font-size="10" fill="#6b7280">
              {#each visibleStackedData as item, i}
                {@const labelX = 60 + i * ((720 - 60) / visibleStackedData.length) + ((720 - 60) / visibleStackedData.length) / 2}
                <text x={labelX} y="285">
                  {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </text>
              {/each}
            </g>

            <!-- Y 轴标签 -->
            <g class="y-axis-labels" text-anchor="end" font-size="10" fill="#6b7280">
              {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                <text x="55" y={20 + (260 - 20) * tick + 4}>
                  ${(yExtent[1] * (1 - tick)).toFixed(2)}
                </text>
              {/each}
            </g>
          </svg>
        </div>
      {/if}
    </div>

    <!-- 图例（堆叠图模式） -->
    {#if chartType === 'stacked' && mergedOptions.showLegend && uniqueModels.length > 0}
      <div class="legend-container flex flex-wrap gap-3 mt-4 justify-center" role="group" aria-label="图例：点击可切换模型显示">
        {#each uniqueModels as model}
          <button
            type="button"
            class="legend-item flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            class:opacity-40={hiddenModels.has(model)}
            on:click={() => toggleModel(model)}
            aria-pressed={!hiddenModels.has(model)}
            aria-label="{model}：{hiddenModels.has(model) ? '已隐藏，点击显示' : '点击隐藏'}"
          >
            <span
              class="legend-color w-4 h-4 rounded-full"
              style="background-color: {getModelColor(model)};"
              aria-hidden="true"
            ></span>
            <span class="legend-label text-sm text-gray-700 dark:text-gray-300">
              {model}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style lang="postcss">
  .cost-chart-container {
    @apply w-full p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800;
  }

  .chart-wrapper {
    @apply w-full;
  }

  .legend-item {
    @apply cursor-pointer select-none;
  }

  .legend-item:active {
    @apply scale-95;
  }

  .stacked-chart {
    @apply overflow-hidden;
  }
</style>
