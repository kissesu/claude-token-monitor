/**
 * @file Token 使用趋势图表组件
 * @description 使用 Layerchart 实现多系列折线图，展示 Token 使用趋势
 *              支持多数据系列、缩放、平移、Tooltip 交互和响应式适配
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { Chart, Svg, Axis, Spline, Tooltip, Group, Text } from 'layerchart';
  import type { MultiSeriesChartData, TimeSeriesChartOptions } from '$lib/types';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 图表数据系列
   * 支持多条曲线的展示
   */
  export let data: MultiSeriesChartData[] = [];

  /**
   * 图表配置选项
   * 控制图表的显示行为
   */
  export let options: Partial<TimeSeriesChartOptions> = {};

  /**
   * 图表高度（像素）
   * 默认 400px
   */
  export let height: number = options.height || 400;

  /**
   * 是否正在加载
   * 用于显示加载状态
   */
  export let loading: boolean = false;

  /**
   * 自定义 CSS 类名
   * 用于外部样式覆盖
   */
  let className: string = '';
  export { className as class };

  // ============================================
  // 默认配置
  // ============================================
  const defaultOptions: TimeSeriesChartOptions = {
    title: 'Token 使用趋势',
    xAxisLabel: '日期',
    yAxisLabel: 'Token 数量',
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    responsive: true,
    animationDuration: 300,
    timeFormat: '%Y-%m-%d',
    timeGranularity: 'day',
    showDataPoints: false,
    curveType: 'smooth',
  };

  // ============================================
  // 响应式数据处理
  // 合并用户配置和默认配置
  // ============================================
  $: mergedOptions = { ...defaultOptions, ...options };

  // ============================================
  // 颜色配置
  // 用于区分不同的数据系列
  // ============================================
  const defaultColors = [
    '#3b82f6', // 蓝色
    '#10b981', // 绿色
    '#f59e0b', // 橙色
    '#ef4444', // 红色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
  ];

  // ============================================
  // 数据系列处理
  // 为每个系列添加颜色（如果未指定）
  // ============================================
  $: seriesData = data.map((series, index) => ({
    ...series,
    color: series.color || defaultColors[index % defaultColors.length],
    visible: series.visible !== false,
  }));

  // ============================================
  // 可见系列过滤
  // 只展示 visible=true 的系列
  // ============================================
  $: visibleSeries = seriesData.filter((s) => s.visible);

  // ============================================
  // Tooltip 格式化函数
  // 将数据点格式化为可读的 Tooltip 内容
  // ============================================
  function formatTooltip(point: any) {
    const date = new Date(point.x);
    const formattedDate = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <div class="p-2">
        <div class="font-semibold text-sm mb-1">${formattedDate}</div>
        <div class="text-sm">
          <span class="font-medium">${point.label || '值'}:</span>
          <span class="ml-1">${point.y.toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  // ============================================
  // 图例切换处理
  // 点击图例时切换对应系列的显示/隐藏状态
  // ============================================
  function toggleSeries(index: number) {
    seriesData[index].visible = !seriesData[index].visible;
    // 触发 Svelte 响应式更新
    seriesData = seriesData;
  }

  // ============================================
  // 数据转换函数
  // 将 MultiSeriesChartData 转换为 Layerchart 需要的格式
  // ============================================
  $: chartData = visibleSeries.flatMap((series) =>
    series.data.map((point) => ({
      ...point,
      series: series.name,
      color: series.color,
    }))
  );

  // ============================================
  // Y 轴范围计算
  // 自动计算 Y 轴的最小值和最大值
  // ============================================
  $: yExtent = (() => {
    if (chartData.length === 0) return [0, 100];
    const values = chartData.map((d) => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10;
    return [Math.max(0, min - padding), max + padding];
  })();
</script>

<!-- ============================================
  图表容器
  使用 Tailwind 类名进行样式控制
============================================ -->
<div class="trend-chart-container {className}" style="height: {height}px;">
  <!-- 标题 -->
  {#if mergedOptions.title}
    <div class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
      {mergedOptions.title}
    </div>
  {/if}

  <!-- 加载状态 -->
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else if chartData.length === 0}
    <!-- 空数据状态 -->
    <div class="flex items-center justify-center h-full">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <svg
          class="mx-auto h-12 w-12 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p class="text-sm">暂无数据</p>
      </div>
    </div>
  {:else}
    <!-- 图表主体 -->
    <div class="chart-wrapper" style="height: calc(100% - 3rem);">
      <Chart
        data={chartData}
        x="x"
        y="y"
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
                format={(d) => d.toLocaleString()}
              />
            </Group>
          {/if}

          <!-- 数据曲线 -->
          {#each visibleSeries as series}
            <Spline
              data={chartData.filter((d) => d.series === series.name)}
              class="stroke-2 fill-none transition-all duration-300"
              style="stroke: {series.color};"
            />
          {/each}

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
    </div>

    <!-- 图例 -->
    {#if mergedOptions.showLegend && seriesData.length > 0}
      <div class="legend-container flex flex-wrap gap-4 mt-4 justify-center">
        {#each seriesData as series, index}
          <button
            type="button"
            class="legend-item flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            class:opacity-40={!series.visible}
            on:click={() => toggleSeries(index)}
          >
            <span
              class="legend-color w-4 h-4 rounded-full"
              style="background-color: {series.color};"
            ></span>
            <span class="legend-label text-sm text-gray-700 dark:text-gray-300">
              {series.name}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style lang="postcss">
  .trend-chart-container {
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
</style>
