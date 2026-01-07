/**
 * @file 每日活动面板组件
 * @description 展示每日消息趋势、活动热力图、趋势图和高峰时段统计的仪表板面板
 *              集成热力图和趋势图组件，支持日期范围选择和响应式布局
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { onMount } from 'svelte';
  import ActivityHeatmap from '$lib/components/charts/ActivityHeatmap.svelte';
  import TrendChart from '$lib/components/charts/TrendChart.svelte';
  import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';
  import {
    sortedDailyActivities,
    statsIsLoading
  } from '$lib/stores';
  import type { DailyActivity, MultiSeriesChartData } from '$lib/types';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 自定义 CSS 类名
   * 用于外部样式覆盖
   */
  let className: string = '';
  export { className as class };

  // ============================================
  // 组件状态
  // ============================================

  /**
   * 当前选择的日期范围快捷选项
   * today: 今日
   * last7days: 最近 7 天
   * last30days: 最近 30 天
   * thisMonth: 本月
   * custom: 自定义
   */
  let selectedRange: 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom' = 'last7days';

  /**
   * 自定义日期范围
   */
  let customStartDate = '';
  let customEndDate = '';

  /**
   * 热力图指标类型
   */
  let heatmapMetric: 'sessions' | 'tokens' | 'cost' = 'sessions';

  /**
   * 当前显示的活动数据
   * 根据选择的日期范围筛选
   */
  let filteredActivities: DailyActivity[] = [];

  /**
   * 高峰时段统计数据
   */
  let peakHourStats = {
    hour: 0,
    count: 0,
    date: '',
  };

  // ============================================
  // 辅助函数
  // ============================================

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   */
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 根据选择的范围获取过滤的活动数据
   */
  function getFilteredActivities(
    activities: DailyActivity[],
    range: string,
    startDate: string,
    endDate: string
  ): DailyActivity[] {
    const today = new Date();
    let filterStartDate: Date;
    let filterEndDate = today;

    switch (range) {
      case 'today':
        filterStartDate = today;
        break;
      case 'last7days':
        filterStartDate = new Date(today);
        filterStartDate.setDate(filterStartDate.getDate() - 7);
        break;
      case 'last30days':
        filterStartDate = new Date(today);
        filterStartDate.setDate(filterStartDate.getDate() - 30);
        break;
      case 'thisMonth':
        filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'custom':
        if (!startDate || !endDate) return activities;
        filterStartDate = new Date(startDate);
        filterEndDate = new Date(endDate);
        break;
      default:
        return activities;
    }

    const startStr = formatDate(filterStartDate);
    const endStr = formatDate(filterEndDate);

    return activities.filter((activity) => {
      return activity.date >= startStr && activity.date <= endStr;
    });
  }

  /**
   * 计算高峰时段
   * 注意：当前 DailyActivity 数据中没有小时级别的数据
   * 此函数返回会话数最多的那一天
   */
  function calculatePeakHour(activities: DailyActivity[]) {
    if (activities.length === 0) {
      return { hour: 0, count: 0, date: '' };
    }

    // 找到会话数最多的那天
    const peakDay = activities.reduce((max, activity) => {
      return activity.sessions > max.sessions ? activity : max;
    }, activities[0]);

    return {
      hour: 12, // 由于没有小时数据，默认显示中午 12 点
      count: peakDay.sessions,
      date: peakDay.date,
    };
  }

  /**
   * 计算总会话数
   */
  function calculateTotalSessions(activities: DailyActivity[]): number {
    return activities.reduce((sum, activity) => sum + activity.sessions, 0);
  }

  /**
   * 计算总 Token 数
   */
  function calculateTotalTokens(activities: DailyActivity[]): number {
    return activities.reduce((sum, activity) => {
      return sum + activity.tokens.input_tokens + activity.tokens.output_tokens;
    }, 0);
  }

  /**
   * 计算总费用
   */
  function calculateTotalCost(activities: DailyActivity[]): number {
    return activities.reduce((sum, activity) => sum + activity.cost, 0);
  }

  /**
   * 将 DailyActivity 数据转换为 TrendChart 需要的格式
   */
  function prepareChartData(activities: DailyActivity[]): MultiSeriesChartData[] {
    return [
      {
        name: '会话数',
        data: activities.map((activity) => ({
          x: new Date(activity.date).getTime(),
          y: activity.sessions,
          label: '会话数',
        })),
        color: '#3b82f6',
        visible: true,
      },
      {
        name: 'Token 总数',
        data: activities.map((activity) => ({
          x: new Date(activity.date).getTime(),
          y: activity.tokens.input_tokens + activity.tokens.output_tokens,
          label: 'Token 总数',
        })),
        color: '#10b981',
        visible: true,
      },
      {
        name: '费用 (美分)',
        data: activities.map((activity) => ({
          x: new Date(activity.date).getTime(),
          y: activity.cost * 100, // 转换为美分以便显示
          label: '费用',
        })),
        color: '#f59e0b',
        visible: false, // 默认隐藏费用曲线
      },
    ];
  }

  // ============================================
  // 响应式数据处理
  // ============================================

  /**
   * 监听 sortedDailyActivities 变化，更新过滤后的数据
   */
  $: filteredActivities = getFilteredActivities(
    $sortedDailyActivities,
    selectedRange,
    customStartDate,
    customEndDate
  );

  /**
   * 监听 filteredActivities 变化，更新统计数据
   */
  $: peakHourStats = calculatePeakHour(filteredActivities);

  /**
   * 准备趋势图数据
   */
  $: trendChartData = prepareChartData(filteredActivities);

  /**
   * 计算汇总统计
   */
  $: totalSessions = calculateTotalSessions(filteredActivities);
  $: totalTokens = calculateTotalTokens(filteredActivities);
  $: totalCost = calculateTotalCost(filteredActivities);

  // ============================================
  // 事件处理
  // ============================================

  /**
   * 处理快捷日期范围选择
   */
  function handleRangeSelect(range: typeof selectedRange) {
    selectedRange = range;

    // 如果不是自定义范围，清空自定义日期
    if (range !== 'custom') {
      customStartDate = '';
      customEndDate = '';
    }
  }

  /**
   * 处理热力图指标切换
   */
  function handleMetricToggle(metric: typeof heatmapMetric) {
    heatmapMetric = metric;
  }

  /**
   * 处理自定义日期范围变更
   */
  function handleDateRangeChange(event: CustomEvent<{ startDate: string; endDate: string }>) {
    customStartDate = event.detail.startDate;
    customEndDate = event.detail.endDate;
    selectedRange = 'custom';
  }

  // ============================================
  // 生命周期
  // ============================================

  onMount(() => {
    // 组件挂载时，设置默认日期范围
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    customStartDate = formatDate(weekAgo);
    customEndDate = formatDate(today);
  });
</script>

<!-- ============================================
  面板容器
============================================ -->
<div class="daily-activity-panel {className}">
  <!-- 面板标题和控制栏 -->
  <div class="panel-header mb-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
      每日活动趋势
    </h2>

    <!-- 快捷日期范围选择 -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        type="button"
        class="range-button px-4 py-2 text-sm font-medium rounded-md transition-colors"
        class:active={selectedRange === 'today'}
        on:click={() => handleRangeSelect('today')}
      >
        今日
      </button>
      <button
        type="button"
        class="range-button px-4 py-2 text-sm font-medium rounded-md transition-colors"
        class:active={selectedRange === 'last7days'}
        on:click={() => handleRangeSelect('last7days')}
      >
        最近 7 天
      </button>
      <button
        type="button"
        class="range-button px-4 py-2 text-sm font-medium rounded-md transition-colors"
        class:active={selectedRange === 'last30days'}
        on:click={() => handleRangeSelect('last30days')}
      >
        最近 30 天
      </button>
      <button
        type="button"
        class="range-button px-4 py-2 text-sm font-medium rounded-md transition-colors"
        class:active={selectedRange === 'thisMonth'}
        on:click={() => handleRangeSelect('thisMonth')}
      >
        本月
      </button>
      <button
        type="button"
        class="range-button px-4 py-2 text-sm font-medium rounded-md transition-colors"
        class:active={selectedRange === 'custom'}
        on:click={() => handleRangeSelect('custom')}
      >
        自定义
      </button>
    </div>

    <!-- 自定义日期范围选择器 -->
    {#if selectedRange === 'custom'}
      <div class="custom-date-picker mb-4">
        <DateRangePicker
          startDate={customStartDate}
          endDate={customEndDate}
          on:change={handleDateRangeChange}
        />
      </div>
    {/if}
  </div>

  <!-- 汇总统计卡片 -->
  <div class="summary-cards grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <!-- 总会话数 -->
    <div class="stat-card bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">总会话数</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalSessions.toLocaleString()}
          </p>
        </div>
        <div class="icon-wrapper bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 总 Token 数 -->
    <div class="stat-card bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">总 Token 数</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalTokens.toLocaleString()}
          </p>
        </div>
        <div class="icon-wrapper bg-green-100 dark:bg-green-900 p-3 rounded-full">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 总费用 -->
    <div class="stat-card bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">总费用</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${totalCost.toFixed(4)}
          </p>
        </div>
        <div class="icon-wrapper bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
          <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- 趋势图 -->
  <div class="trend-chart-section mb-6">
    <TrendChart
      data={trendChartData}
      loading={$statsIsLoading}
      height={400}
      options={{
        title: '活动趋势',
        xAxisLabel: '日期',
        yAxisLabel: '数量',
        showLegend: true,
        showGrid: true,
        showTooltip: true,
      }}
    />
  </div>

  <!-- 活动热力图和高峰时段统计 -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- 活动热力图 -->
    <div class="heatmap-section lg:col-span-2">
      <!-- 热力图指标选择 -->
      <div class="metric-selector flex gap-2 mb-4">
        <button
          type="button"
          class="metric-button px-3 py-1 text-sm font-medium rounded-md transition-colors"
          class:active={heatmapMetric === 'sessions'}
          on:click={() => handleMetricToggle('sessions')}
        >
          会话数
        </button>
        <button
          type="button"
          class="metric-button px-3 py-1 text-sm font-medium rounded-md transition-colors"
          class:active={heatmapMetric === 'tokens'}
          on:click={() => handleMetricToggle('tokens')}
        >
          Token 数
        </button>
        <button
          type="button"
          class="metric-button px-3 py-1 text-sm font-medium rounded-md transition-colors"
          class:active={heatmapMetric === 'cost'}
          on:click={() => handleMetricToggle('cost')}
        >
          费用
        </button>
      </div>

      <ActivityHeatmap
        data={filteredActivities}
        metric={heatmapMetric}
        loading={$statsIsLoading}
        title="活动热力图"
      />
    </div>

    <!-- 高峰时段统计 -->
    <div class="peak-stats-section">
      <div class="peak-stats-card bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          高峰时段统计
        </h3>

        {#if filteredActivities.length > 0}
          <div class="space-y-4">
            <!-- 高峰日期 -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">高峰日期</p>
              <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
                {new Date(peakHourStats.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <!-- 会话数 -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">当日会话数</p>
              <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
                {peakHourStats.count} 个
              </p>
            </div>

            <!-- 平均每日会话数 -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">平均每日会话数</p>
              <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
                {(totalSessions / filteredActivities.length).toFixed(1)} 个
              </p>
            </div>

            <!-- 活动天数 -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">活动天数</p>
              <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
                {filteredActivities.length} 天
              </p>
            </div>

            <!-- 可视化指示器 -->
            <div class="mt-6">
              <div class="relative pt-1">
                <div class="flex mb-2 items-center justify-between">
                  <div>
                    <span class="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                      活跃度
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                      {((totalSessions / filteredActivities.length / peakHourStats.count) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div class="overflow-hidden h-2 text-xs flex rounded bg-blue-200 dark:bg-blue-900">
                  <div
                    style="width: {((totalSessions / filteredActivities.length / peakHourStats.count) * 100).toFixed(0)}%"
                    class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 dark:bg-blue-400 transition-all duration-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        {:else}
          <!-- 无数据状态 -->
          <div class="text-center py-8">
            <svg
              class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              选定范围内暂无数据
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  /**
   * 面板容器样式
   */
  .daily-activity-panel {
    @apply w-full;
  }

  /**
   * 快捷日期范围按钮样式
   */
  .range-button {
    @apply bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300;
    @apply hover:bg-gray-200 dark:hover:bg-gray-700;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  }

  .range-button.active {
    @apply bg-blue-600 dark:bg-blue-500 text-white;
    @apply hover:bg-blue-700 dark:hover:bg-blue-600;
  }

  /**
   * 热力图指标按钮样式
   */
  .metric-button {
    @apply bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300;
    @apply hover:bg-gray-200 dark:hover:bg-gray-700;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  }

  .metric-button.active {
    @apply bg-blue-600 dark:bg-blue-500 text-white;
    @apply hover:bg-blue-700 dark:hover:bg-blue-600;
  }

  /**
   * 统计卡片样式
   */
  .stat-card {
    @apply shadow-sm hover:shadow-md transition-shadow duration-200;
  }

  /**
   * 高峰统计卡片样式
   */
  .peak-stats-card {
    @apply shadow-sm;
  }

  /**
   * 响应式设计调整
   */
  @media (max-width: 768px) {
    .panel-header h2 {
      @apply text-xl;
    }

    .range-button,
    .metric-button {
      @apply px-3 py-1.5 text-xs;
    }

    .stat-card .text-2xl {
      @apply text-xl;
    }

    .peak-stats-card h3 {
      @apply text-base;
    }

    .peak-stats-card .text-xl {
      @apply text-lg;
    }
  }
</style>
