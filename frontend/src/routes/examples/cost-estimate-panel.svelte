<!--
  @file CostEstimatePanel 组件使用示例
  @description 演示如何使用 CostEstimatePanel 费用估算面板组件
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { CostEstimatePanel } from '$lib/components/dashboard';
  import { TimeRange } from '$lib/types';

  /**
   * 使用示例
   *
   * 1. 基础用法：
   *    <CostEstimatePanel />
   *
   * 2. 指定时间范围：
   *    <CostEstimatePanel timeRange={TimeRange.MONTH} />
   *
   * 3. 自定义样式：
   *    <CostEstimatePanel class="my-custom-class" />
   */

  // 示例：默认时间范围为最近 7 天
  let selectedTimeRange = TimeRange.WEEK;
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">
    费用估算面板示例
  </h1>

  <!-- 示例 1: 基础用法 -->
  <section class="mb-12">
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
      基础用法
    </h2>
    <CostEstimatePanel />
  </section>

  <!-- 示例 2: 指定时间范围 -->
  <section class="mb-12">
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
      指定时间范围（30天）
    </h2>
    <CostEstimatePanel timeRange={TimeRange.MONTH} />
  </section>

  <!-- 示例 3: 响应式时间范围切换 -->
  <section class="mb-12">
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
      响应式时间范围
    </h2>
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        选择时间范围:
      </label>
      <select
        bind:value={selectedTimeRange}
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
               focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value={TimeRange.WEEK}>最近 7 天</option>
        <option value={TimeRange.MONTH}>最近 30 天</option>
        <option value={TimeRange.QUARTER}>最近 90 天</option>
        <option value={TimeRange.ALL}>全部</option>
      </select>
    </div>
    <CostEstimatePanel timeRange={selectedTimeRange} />
  </section>
</div>

<style>
  .container {
    max-width: 1280px;
  }
</style>
