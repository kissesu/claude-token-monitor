<!--
  @file CostEstimatePanel 费用估算面板组件
  @description 仪表板费用估算面板，显示各模型费用、费用趋势图表和明细表格
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { derived } from 'svelte/store';
  import CostChart from '$lib/components/charts/CostChart.svelte';
  import StatCard from '$lib/components/common/StatCard.svelte';
  import {
    statsStore,
    totalCost,
    getModelUsageList,
    sortedDailyActivities,
  } from '$lib/stores';
  import type { ModelUsage, CostTrendData } from '$lib/types';
  import { TimeRange } from '$lib/types';

  /**
   * 组件属性定义
   */

  /**
   * 时间范围选择（日/周/月）
   * 默认显示最近 7 天
   */
  export let timeRange: TimeRange = TimeRange.WEEK;

  /**
   * 自定义 CSS 类名
   */
  let className: string = '';
  export { className as class };

  // ============================================
  // 时间范围处理
  // ============================================

  /**
   * 时间范围选项
   */
  const TIME_RANGE_OPTIONS = [
    { label: '7 天', value: TimeRange.WEEK, days: 7 },
    { label: '30 天', value: TimeRange.MONTH, days: 30 },
    { label: '90 天', value: TimeRange.QUARTER, days: 90 },
    { label: '全部', value: TimeRange.ALL, days: 0 },
  ];

  /**
   * 获取时间范围对应的天数
   */
  function getDaysFromTimeRange(range: TimeRange): number {
    const option = TIME_RANGE_OPTIONS.find((opt) => opt.value === range);
    return option?.days ?? 7;
  }

  /**
   * 处理时间范围变更
   */
  function handleTimeRangeChange(range: TimeRange) {
    timeRange = range;
    statsStore.setTimeRange(range);
  }

  // ============================================
  // 数据计算和派生
  // ============================================

  /**
   * 按费用排序的模型使用列表
   */
  const modelUsageList = getModelUsageList('cost');

  /**
   * 筛选后的每日活动数据（根据时间范围）
   */
  const filteredDailyActivities = derived(
    [sortedDailyActivities, statsStore],
    ([$activities, $statsStore]) => {
      if ($statsStore.timeRange === TimeRange.ALL) {
        return $activities;
      }

      const days = getDaysFromTimeRange($statsStore.timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return $activities.filter((activity) => {
        const activityDate = new Date(activity.date);
        return activityDate >= cutoffDate;
      });
    }
  );

  /**
   * 费用趋势数据（用于图表）
   */
  const costTrendData = derived(filteredDailyActivities, ($activities) => {
    let cumulativeCost = 0;

    return $activities.map((activity) => {
      cumulativeCost += activity.cost;
      return {
        date: activity.date,
        cost: activity.cost,
        cumulative_cost: cumulativeCost,
      } as CostTrendData;
    });
  });

  /**
   * 按模型分组的费用数据（用于堆叠图）
   */
  const modelCostData = derived(
    [filteredDailyActivities, statsStore],
    ([$activities, $statsStore]) => {
      const result: Array<{ date: string; model: string; cost: number }> = [];

      // 如果没有按模型的细分数据，返回空数组
      if (!$statsStore.current?.models) return result;

      $activities.forEach((activity) => {
        // 这里需要从后端获取每日的模型费用细分
        // 目前暂时使用模型总费用按比例分配
        const totalDailyCost = activity.cost;
        if (totalDailyCost === 0) return;

        Object.values($statsStore.current!.models).forEach((model: ModelUsage) => {
          const modelCost = (model.cost / $statsStore.current!.total_cost) * totalDailyCost;
          if (modelCost > 0) {
            result.push({
              date: activity.date,
              model: model.name,
              cost: modelCost,
            });
          }
        });
      });

      return result;
    }
  );

  /**
   * 平均每日费用
   */
  const avgDailyCost = derived(filteredDailyActivities, ($activities) => {
    if ($activities.length === 0) return 0;
    const totalCost = $activities.reduce((sum, a) => sum + a.cost, 0);
    return totalCost / $activities.length;
  });

  /**
   * 预估月费用（基于平均每日费用）
   */
  const estimatedMonthlyCost = derived(avgDailyCost, ($avg) => $avg * 30);

  /**
   * 费用趋势（相比前一时段）
   */
  const costTrend = derived(filteredDailyActivities, ($activities) => {
    if ($activities.length < 2) {
      return { direction: undefined, percentage: 0 };
    }

    const midPoint = Math.floor($activities.length / 2);
    const firstHalf = $activities.slice(0, midPoint);
    const secondHalf = $activities.slice(midPoint);

    const firstHalfTotal = firstHalf.reduce((sum, a) => sum + a.cost, 0);
    const secondHalfTotal = secondHalf.reduce((sum, a) => sum + a.cost, 0);

    if (firstHalfTotal === 0) {
      return { direction: 'up' as const, percentage: 100 };
    }

    const change = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
    return {
      direction: change >= 0 ? ('up' as const) : ('down' as const),
      percentage: Math.abs(change),
    };
  });

  // ============================================
  // 费用明细表格排序
  // ============================================

  /**
   * 表格排序字段
   */
  type SortField = 'name' | 'tokens' | 'cost' | 'percentage';

  let sortField: SortField = 'cost';
  let sortAscending = false;

  /**
   * 排序后的模型列表
   */
  const sortedModelList = derived(
    [modelUsageList, statsStore],
    ([$models]) => {
      if ($models.length === 0) return [];

      return [...$models].sort((a, b) => {
        let compareValue = 0;

        switch (sortField) {
          case 'name':
            compareValue = a.name.localeCompare(b.name);
            break;
          case 'tokens': {
            const aTotal =
              a.tokens.input_tokens +
              a.tokens.output_tokens +
              a.tokens.cache_read_tokens +
              a.tokens.cache_creation_tokens;
            const bTotal =
              b.tokens.input_tokens +
              b.tokens.output_tokens +
              b.tokens.cache_read_tokens +
              b.tokens.cache_creation_tokens;
            compareValue = bTotal - aTotal;
            break;
          }
          case 'cost':
            compareValue = b.cost - a.cost;
            break;
          case 'percentage':
            compareValue = b.percentage - a.percentage;
            break;
        }

        return sortAscending ? -compareValue : compareValue;
      });
    }
  );

  /**
   * 处理表头点击排序
   */
  function handleSort(field: SortField) {
    if (sortField === field) {
      sortAscending = !sortAscending;
    } else {
      sortField = field;
      sortAscending = false;
    }
  }

  /**
   * 格式化数字
   */
  function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  /**
   * 格式化费用
   */
  function formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  /**
   * 格式化百分比
   */
  function formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`;
  }
</script>

<!-- ============================================
  费用估算面板容器
============================================ -->
<div class="cost-estimate-panel {className}">
  <!-- 面板标题 -->
  <div class="panel-header mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-50">
      费用估算
    </h2>

    <!-- 时间范围选择器 -->
    <div class="time-range-selector flex gap-2">
      {#each TIME_RANGE_OPTIONS as option}
        <button
          type="button"
          class="time-range-btn px-4 py-2 text-sm font-medium rounded-md transition-colors
                 {$statsStore.timeRange === option.value
                   ? 'bg-primary-500 text-white shadow-md'
                   : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
          on:click={() => handleTimeRangeChange(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- 统计卡片网格 -->
  <div class="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- 总费用 -->
    <StatCard
      title="总费用"
      value={$totalCost}
      unit="美元"
      icon="fa-dollar-sign"
      trend={$costTrend.direction}
      trendValue={$costTrend.percentage > 0 ? `${$costTrend.percentage.toFixed(1)}%` : undefined}
    />

    <!-- 平均每日费用 -->
    <StatCard
      title="日均费用"
      value={$avgDailyCost}
      unit="美元"
      icon="fa-calendar-day"
    />

    <!-- 预估月费用 -->
    <StatCard
      title="预估月费用"
      value={$estimatedMonthlyCost}
      unit="美元"
      icon="fa-chart-line"
    />

    <!-- 模型数量 -->
    <StatCard
      title="使用模型"
      value={$modelUsageList.length}
      unit="个"
      icon="fa-server"
    />
  </div>

  <!-- 费用图表 -->
  <div class="cost-chart-section mb-6">
    <CostChart
      data={$costTrendData}
      modelCostData={$modelCostData}
      options={{
        title: '费用趋势',
        xAxisLabel: '日期',
        yAxisLabel: '费用 ($)',
        showLegend: true,
        showGrid: true,
        showTooltip: true,
      }}
      height={400}
      chartType="stacked"
      showCumulative={true}
    />
  </div>

  <!-- 费用明细表格 -->
  <div class="cost-detail-table bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="table-header p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50">
        费用明细（按模型）
      </h3>
    </div>

    <!-- 表格容器 -->
    <div class="table-container overflow-x-auto">
      {#if $modelUsageList.length === 0}
        <!-- 空状态 -->
        <div class="empty-state p-8 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="text-gray-600 dark:text-gray-400">暂无费用数据</p>
        </div>
      {:else}
        <!-- 数据表格 -->
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                class="table-header-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                on:click={() => handleSort('name')}
              >
                <div class="flex items-center gap-2">
                  <span>模型名称</span>
                  {#if sortField === 'name'}
                    <svg
                      class="w-4 h-4 transform transition-transform {sortAscending ? 'rotate-180' : ''}"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </div>
              </th>
              <th
                class="table-header-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                on:click={() => handleSort('tokens')}
              >
                <div class="flex items-center gap-2 justify-end">
                  <span>总 Tokens</span>
                  {#if sortField === 'tokens'}
                    <svg
                      class="w-4 h-4 transform transition-transform {sortAscending ? 'rotate-180' : ''}"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </div>
              </th>
              <th
                class="table-header-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                on:click={() => handleSort('cost')}
              >
                <div class="flex items-center gap-2 justify-end">
                  <span>费用</span>
                  {#if sortField === 'cost'}
                    <svg
                      class="w-4 h-4 transform transition-transform {sortAscending ? 'rotate-180' : ''}"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </div>
              </th>
              <th
                class="table-header-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                on:click={() => handleSort('percentage')}
              >
                <div class="flex items-center gap-2 justify-end">
                  <span>占比</span>
                  {#if sortField === 'percentage'}
                    <svg
                      class="w-4 h-4 transform transition-transform {sortAscending ? 'rotate-180' : ''}"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each $sortedModelList as model}
              {@const totalTokens =
                model.tokens.input_tokens +
                model.tokens.output_tokens +
                model.tokens.cache_read_tokens +
                model.tokens.cache_creation_tokens}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td class="table-cell">
                  <div class="font-medium text-gray-900 dark:text-gray-100">
                    {model.name}
                  </div>
                  <!-- Token 类型细分 -->
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                    {#if model.tokens.input_tokens > 0}
                      <div>输入: {formatNumber(model.tokens.input_tokens)}</div>
                    {/if}
                    {#if model.tokens.output_tokens > 0}
                      <div>输出: {formatNumber(model.tokens.output_tokens)}</div>
                    {/if}
                    {#if model.tokens.cache_read_tokens > 0}
                      <div>缓存读取: {formatNumber(model.tokens.cache_read_tokens)}</div>
                    {/if}
                    {#if model.tokens.cache_creation_tokens > 0}
                      <div>缓存创建: {formatNumber(model.tokens.cache_creation_tokens)}</div>
                    {/if}
                  </div>
                </td>
                <td class="table-cell text-right font-mono">
                  {formatNumber(totalTokens)}
                </td>
                <td class="table-cell text-right font-mono font-semibold text-primary-600 dark:text-primary-400">
                  {formatCost(model.cost)}
                </td>
                <td class="table-cell text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="percentage-bar-container w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="percentage-bar h-full bg-primary-500 transition-all duration-300"
                        style="width: {model.percentage}%"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[3rem] text-right">
                      {formatPercentage(model.percentage)}
                    </span>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  /**
   * 面板容器样式
   */
  .cost-estimate-panel {
    @apply w-full;
  }

  /**
   * 时间范围按钮样式
   */
  .time-range-btn {
    @apply border border-transparent;
  }

  .time-range-btn:focus {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2;
  }

  .time-range-btn:active {
    @apply scale-95;
  }

  /**
   * 表格样式
   */
  .table-header-cell {
    @apply px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider select-none transition-colors;
  }

  .table-cell {
    @apply px-6 py-4 text-sm text-gray-900 dark:text-gray-100;
  }

  /**
   * 百分比条样式
   */
  .percentage-bar {
    box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
  }

  /**
   * 响应式设计
   */
  @media (max-width: 640px) {
    .stats-grid {
      @apply grid-cols-1;
    }

    .panel-header {
      @apply flex-col items-start;
    }

    .time-range-selector {
      @apply w-full overflow-x-auto;
    }

    .time-range-btn {
      @apply flex-shrink-0;
    }

    .table-header-cell,
    .table-cell {
      @apply px-3 py-2;
    }

    .table-header-cell {
      @apply text-xs;
    }

    .table-cell {
      @apply text-xs;
    }
  }

  /**
   * 空状态动画
   */
  .empty-state svg {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
</style>
