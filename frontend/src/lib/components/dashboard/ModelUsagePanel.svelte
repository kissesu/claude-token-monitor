/**
 * @file 模型使用面板组件
 * @description 显示各模型 Token 用量统计，集成饼图和详细数据表格
 *              支持模型筛选、排序和深色模式
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { onMount } from 'svelte';
  import { getModelUsageList, type ModelSortBy } from '$lib/stores';
  import type { ModelDistributionData } from '$lib/types';
  import ModelPieChart from '$lib/components/charts/ModelPieChart.svelte';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 自定义 CSS 类名
   * 用于外部样式覆盖
   */
  let className: string = '';
  export { className as class };

  /**
   * 面板高度（像素）
   * 默认 auto
   */
  export let height: string = 'auto';

  /**
   * 是否显示图表
   * 默认显示
   */
  export let showChart: boolean = true;

  /**
   * 是否显示表格
   * 默认显示
   */
  export let showTable: boolean = true;

  // ============================================
  // 状态变量
  // ============================================

  /**
   * 当前选择的模型筛选
   * null 表示显示所有模型
   */
  let selectedModel: string | null = null;

  /**
   * 排序字段
   * 默认按 tokens 降序
   */
  let sortBy: ModelSortBy = 'tokens';

  /**
   * 是否正在加载
   */
  let loading: boolean = false;

  // ============================================
  // 响应式数据
  // ============================================

  /**
   * 模型使用列表（根据排序字段获取）
   */
  $: modelUsageList = getModelUsageList(sortBy);

  /**
   * 过滤后的模型列表
   * 如果选择了特定模型，只显示该模型
   */
  $: filteredModels = selectedModel
    ? $modelUsageList.filter((m) => m.name === selectedModel)
    : $modelUsageList;

  /**
   * 饼图数据
   * 将 ModelUsage 转换为 ModelDistributionData
   */
  $: pieChartData = $modelUsageList.map((model): ModelDistributionData => {
    const totalTokens =
      model.tokens.input_tokens +
      model.tokens.output_tokens +
      model.tokens.cache_read_tokens +
      model.tokens.cache_creation_tokens;

    return {
      model: model.name,
      tokens: totalTokens,
      cost: model.cost,
      percentage: model.percentage,
    };
  });

  /**
   * 模型名称列表（用于下拉筛选）
   */
  $: modelNames = $modelUsageList.map((m) => m.name);

  /**
   * 总计统计
   */
  $: totalStats = filteredModels.reduce(
    (acc, model) => {
      acc.input_tokens += model.tokens.input_tokens;
      acc.output_tokens += model.tokens.output_tokens;
      acc.cache_read_tokens += model.tokens.cache_read_tokens;
      acc.cache_creation_tokens += model.tokens.cache_creation_tokens;
      acc.total_tokens +=
        model.tokens.input_tokens +
        model.tokens.output_tokens +
        model.tokens.cache_read_tokens +
        model.tokens.cache_creation_tokens;
      acc.total_cost += model.cost;
      return acc;
    },
    {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      total_tokens: 0,
      total_cost: 0,
    }
  );

  // ============================================
  // 事件处理函数
  // ============================================

  /**
   * 排序字段变更处理
   *
   * @param event - 选择事件
   */
  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    sortBy = target.value as ModelSortBy;
  }

  /**
   * 模型筛选变更处理
   *
   * @param event - 选择事件
   */
  function handleModelFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedModel = target.value === '' ? null : target.value;
  }

  /**
   * 重置筛选
   */
  function resetFilter() {
    selectedModel = null;
    sortBy = 'tokens';
  }

  /**
   * 格式化数字
   * 添加千位分隔符
   *
   * @param num - 数字
   * @returns 格式化后的字符串
   */
  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * 格式化费用
   * 显示为美元格式
   *
   * @param cost - 费用
   * @returns 格式化后的字符串
   */
  function formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  // ============================================
  // 生命周期
  // ============================================

  onMount(() => {
    // 组件挂载时可以进行初始化操作
    loading = false;
  });
</script>

<!-- ============================================
  面板容器
  使用 Tailwind CSS 卡片式布局
============================================ -->
<div
  class="model-usage-panel {className} bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-6"
  style="height: {height};"
  role="region"
  aria-label="模型用量统计面板：显示各 Claude 模型的 Token 使用详情和费用分析"
>
  <!-- 面板标题和操作栏 -->
  <div class="panel-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div class="header-title">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
        模型用量统计
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        各模型 Token 使用详情和费用分析
      </p>
    </div>

    <!-- 筛选和排序控制 -->
    <div class="header-controls flex flex-col sm:flex-row gap-3">
      <!-- 模型筛选下拉框 -->
      <div class="filter-control">
        <label
          for="model-filter"
          class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          id="model-filter-label"
        >
          筛选模型
        </label>
        <select
          id="model-filter"
          class="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          on:change={handleModelFilterChange}
          value={selectedModel || ''}
          aria-labelledby="model-filter-label"
          aria-describedby="model-filter-desc"
        >
        <span id="model-filter-desc" class="sr-only">选择要查看的特定模型，或选择全部模型</span>
          <option value="">全部模型</option>
          {#each modelNames as modelName}
            <option value={modelName}>{modelName}</option>
          {/each}
        </select>
      </div>

      <!-- 排序控制 -->
      <div class="sort-control">
        <label
          for="sort-by"
          class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          id="sort-by-label"
        >
          排序方式
        </label>
        <select
          id="sort-by"
          class="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          on:change={handleSortChange}
          value={sortBy}
          aria-labelledby="sort-by-label"
        >
          <option value="tokens">按 Token 数</option>
          <option value="cost">按费用</option>
          <option value="percentage">按占比</option>
          <option value="name">按名称</option>
        </select>
      </div>

      <!-- 重置按钮 -->
      {#if selectedModel || sortBy !== 'tokens'}
        <button
          type="button"
          class="self-end px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          on:click={resetFilter}
          aria-label="重置筛选条件：清除模型筛选并恢复默认排序"
        >
          重置
        </button>
      {/if}
    </div>
  </div>

  <!-- 面板内容 -->
  <div class="panel-content">
    <!-- 饼图部分 -->
    {#if showChart && pieChartData.length > 0}
      <div class="chart-section mb-8">
        <ModelPieChart
          data={pieChartData}
          height={400}
          loading={loading}
          options={{
            title: '',
            showLegend: true,
            showTooltip: true,
            showPercentage: true,
            innerRadius: 60,
            outerRadius: 140,
          }}
        />
      </div>
    {/if}

    <!-- 详细数据表格 -->
    {#if showTable}
      <div class="table-section">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          详细统计
        </h3>

        <!-- 响应式表格容器 -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800" role="region" aria-label="模型使用详细数据表格">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800" aria-describedby="table-description">
            <caption id="table-description" class="sr-only">
              各模型 Token 使用详细统计表格，包含输入、输出、缓存读取、缓存创建的 Token 数量、费用和占比
            </caption>
            <!-- 表头 -->
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  模型名称
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  输入 Token
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  输出 Token
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  缓存读取
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  缓存创建
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  总计
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  费用
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  占比
                </th>
              </tr>
            </thead>

            <!-- 表体 -->
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {#if filteredModels.length === 0}
                <!-- 空数据状态 -->
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    暂无数据
                  </td>
                </tr>
              {:else}
                {#each filteredModels as model}
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <!-- 模型名称 -->
                    <td class="px-4 py-3 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {model.name}
                      </div>
                    </td>

                    <!-- 输入 Token -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm text-gray-700 dark:text-gray-300">
                        {formatNumber(model.tokens.input_tokens)}
                      </div>
                    </td>

                    <!-- 输出 Token -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm text-gray-700 dark:text-gray-300">
                        {formatNumber(model.tokens.output_tokens)}
                      </div>
                    </td>

                    <!-- 缓存读取 -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm text-gray-700 dark:text-gray-300">
                        {formatNumber(model.tokens.cache_read_tokens)}
                      </div>
                    </td>

                    <!-- 缓存创建 -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm text-gray-700 dark:text-gray-300">
                        {formatNumber(model.tokens.cache_creation_tokens)}
                      </div>
                    </td>

                    <!-- 总计 -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatNumber(
                          model.tokens.input_tokens +
                            model.tokens.output_tokens +
                            model.tokens.cache_read_tokens +
                            model.tokens.cache_creation_tokens
                        )}
                      </div>
                    </td>

                    <!-- 费用 -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formatCost(model.cost)}
                      </div>
                    </td>

                    <!-- 占比 -->
                    <td class="px-4 py-3 whitespace-nowrap text-right">
                      <div class="text-sm text-gray-700 dark:text-gray-300">
                        {model.percentage.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                {/each}

                <!-- 合计行 -->
                {#if filteredModels.length > 1}
                  <tr class="bg-gray-100 dark:bg-gray-800 font-semibold">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      合计
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatNumber(totalStats.input_tokens)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatNumber(totalStats.output_tokens)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatNumber(totalStats.cache_read_tokens)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatNumber(totalStats.cache_creation_tokens)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      {formatNumber(totalStats.total_tokens)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-600 dark:text-blue-400">
                      {formatCost(totalStats.total_cost)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                      100%
                    </td>
                  </tr>
                {/if}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- 空数据提示 -->
    {#if pieChartData.length === 0}
      <div class="empty-state flex flex-col items-center justify-center py-16" role="status" aria-label="暂无模型使用数据">
        <svg
          class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          暂无模型使用数据
        </p>
        <p class="text-gray-400 dark:text-gray-500 text-xs mt-2">
          开始使用 Claude API 后将显示统计信息
        </p>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .model-usage-panel {
    @apply transition-all duration-200;
  }

  /* 表格样式优化 */
  table {
    @apply border-collapse;
  }

  thead th {
    @apply sticky top-0 z-10;
  }

  /* 响应式优化 */
  @media (max-width: 640px) {
    .table-section {
      @apply overflow-x-auto;
    }

    table {
      @apply text-xs;
    }
  }
</style>
