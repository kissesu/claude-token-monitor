/**
 * @file 模型分布饼图/环形图组件
 * @description 使用 Layerchart 实现饼图，展示各模型 Token 使用占比
 *              支持图例交互、悬浮详情、饼图/环形图切换
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { Chart, Svg, Arc, Group, Tooltip, Text } from 'layerchart';
  import type { ModelDistributionData, PieChartOptions } from '$lib/types';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 模型分布数据
   * 包含模型名称、Token 数量、费用等信息
   */
  export let data: ModelDistributionData[] = [];

  /**
   * 图表配置选项
   * 控制图表的显示行为
   */
  export let options: Partial<PieChartOptions> = {};

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
  const defaultOptions: PieChartOptions = {
    title: '模型 Token 分布',
    showLegend: true,
    showTooltip: true,
    responsive: true,
    showPercentage: true,
    showLabels: true,
    innerRadius: 0, // 0 为饼图，> 0 为环形图
    outerRadius: 140,
  };

  // ============================================
  // 响应式数据处理
  // 合并用户配置和默认配置
  // ============================================
  $: mergedOptions = { ...defaultOptions, ...options };

  // ============================================
  // 颜色配置
  // 用于区分不同的模型
  // ============================================
  const defaultColors = [
    '#3b82f6', // 蓝色
    '#10b981', // 绿色
    '#f59e0b', // 橙色
    '#ef4444', // 红色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
    '#14b8a6', // 青色
    '#f97316', // 深橙
  ];

  // ============================================
  // 数据处理
  // 为每个模型添加颜色（如果未指定）
  // ============================================
  $: chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
    id: `model-${index}`,
  }));

  // ============================================
  // 辅助函数：获取 Token 数量
  // 用于 Chart 组件的 x 属性
  // ============================================
  function getTokens(d: any) {
    return d.tokens;
  }

  // ============================================
  // 总计算
  // 计算总 Token 数和总费用
  // ============================================
  $: totalTokens = chartData.reduce((sum, item) => sum + item.tokens, 0);
  $: totalCost = chartData.reduce((sum, item) => sum + item.cost, 0);

  // ============================================
  // Tooltip 格式化函数
  // 将数据格式化为可读的 Tooltip 内容
  // ============================================
  function formatTooltip(item: ModelDistributionData) {
    return `
      <div class="p-3 min-w-[200px]">
        <div class="font-semibold text-sm mb-2 border-b pb-2 border-gray-200 dark:border-gray-700">
          ${item.model}
        </div>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Token 数量:</span>
            <span class="font-medium">${item.tokens.toLocaleString()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">费用:</span>
            <span class="font-medium">$${item.cost.toFixed(4)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">占比:</span>
            <span class="font-medium">${item.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // 图例项点击处理
  // 未来可以扩展为过滤功能
  // ============================================
  let selectedModel: string | null = null;

  function handleLegendClick(model: string) {
    selectedModel = selectedModel === model ? null : model;
  }

  // ============================================
  // 饼图/环形图切换
  // ============================================
  function toggleChartType() {
    mergedOptions.innerRadius = mergedOptions.innerRadius === 0 ? 60 : 0;
    mergedOptions = mergedOptions; // 触发更新
  }
</script>

<!-- ============================================
  图表容器
  使用 Tailwind 类名进行样式控制
============================================ -->
<div
  class="pie-chart-container {className}"
  style="height: {height}px;"
  role="figure"
  aria-label="{mergedOptions.title}: 展示各模型 Token 使用占比的{(mergedOptions.innerRadius || 0) > 0 ? '环形图' : '饼图'}，共 {chartData.length} 个模型，总计 {totalTokens.toLocaleString()} tokens。"
>
  <!-- 标题栏 -->
  <div class="flex justify-between items-center mb-4">
    {#if mergedOptions.title}
      <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {mergedOptions.title}
      </div>
    {/if}

    <!-- 图表类型切换按钮 -->
    <button
      type="button"
      class="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      on:click={toggleChartType}
      aria-pressed={(mergedOptions.innerRadius || 0) > 0}
      aria-label="切换图表类型：当前为{(mergedOptions.innerRadius || 0) > 0 ? '环形图' : '饼图'}，点击切换"
    >
      {mergedOptions.innerRadius === 0 ? '环形图' : '饼图'}
    </button>
  </div>

  <!-- 加载状态 -->
  {#if loading}
    <div class="flex items-center justify-center h-full" role="status" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
      <span class="sr-only">正在加载模型分布图表...</span>
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
          aria-hidden="true"
          focusable="false"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
          />
        </svg>
        <p class="text-sm">暂无数据</p>
      </div>
    </div>
  {:else}
    <!-- 图表主体 -->
    <div class="flex flex-col lg:flex-row gap-6 items-center justify-center" style="height: calc(100% - 3rem);">
      <!-- 饼图 -->
      <div class="pie-chart-wrapper flex-shrink-0" style="width: {(mergedOptions.outerRadius || 140) * 2 + 40}px; height: {(mergedOptions.outerRadius || 140) * 2 + 40}px;">
        <Chart
          data={chartData}
          x={getTokens}
          r={[mergedOptions.innerRadius || 0, mergedOptions.outerRadius || 140]}
        >
          <Svg>
            <Group center>
              {#each chartData as item}
                <Arc
                  value={item.tokens}
                  class="transition-all duration-300 hover:opacity-80 cursor-pointer {selectedModel && selectedModel !== item.model ? 'opacity-40' : ''}"
                  style="fill: {item.color}; stroke: white; stroke-width: 2;"
                />
              {/each}

              <!-- 中心文字（环形图模式） -->
              {#if (mergedOptions.innerRadius || 0) > 0}
                <Text
                  value="总计"
                  class="text-sm fill-gray-600 dark:fill-gray-400 text-anchor-middle"
                  y={-10}
                />
                <Text
                  value={totalTokens.toLocaleString()}
                  class="text-lg font-bold fill-gray-900 dark:fill-gray-100 text-anchor-middle"
                  y={10}
                />
                <Text
                  value={`$${totalCost.toFixed(2)}`}
                  class="text-xs fill-gray-500 dark:fill-gray-500 text-anchor-middle"
                  y={28}
                />
              {/if}
            </Group>
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

      <!-- 图例和统计 -->
      {#if mergedOptions.showLegend && chartData.length > 0}
        <div class="legend-stats-container flex-1 min-w-[250px]">
          <!-- 统计信息 -->
          <div class="stats-summary mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">总计</div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-500">Token</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {totalTokens.toLocaleString()}
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-500 dark:text-gray-500">费用</div>
                <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <!-- 图例列表 -->
          <div class="legend-list space-y-2" role="group" aria-label="模型图例：点击可选中特定模型">
            {#each chartData as item}
              <button
                type="button"
                class="legend-item w-full flex items-center gap-3 p-2 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                class:bg-gray-100={selectedModel === item.model}
                class:dark:bg-gray-800={selectedModel === item.model}
                class:opacity-50={selectedModel && selectedModel !== item.model}
                on:click={() => handleLegendClick(item.model)}
                aria-pressed={selectedModel === item.model}
                aria-label="{item.model}：{item.tokens.toLocaleString()} tokens，占比 {item.percentage.toFixed(1)}%。{selectedModel === item.model ? '已选中，点击取消' : '点击选中'}"
              >
                <span
                  class="legend-color w-4 h-4 rounded-full flex-shrink-0"
                  style="background-color: {item.color};"
                  aria-hidden="true"
                ></span>
                <div class="flex-1 text-left min-w-0">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {item.model}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-500">
                    {item.tokens.toLocaleString()} tokens
                  </div>
                </div>
                {#if mergedOptions.showPercentage}
                  <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.percentage.toFixed(1)}%
                  </div>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  .pie-chart-container {
    @apply w-full p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800;
  }

  .pie-chart-wrapper {
    @apply relative;
  }

  .legend-item {
    @apply cursor-pointer select-none;
  }

  .legend-item:active {
    @apply scale-95;
  }
</style>
