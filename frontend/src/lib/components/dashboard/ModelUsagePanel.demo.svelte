/**
 * @file ModelUsagePanel 组件演示页面
 * @description 展示如何在实际页面中使用 ModelUsagePanel 组件
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { onMount } from 'svelte';
  import { statsStore } from '$lib/stores';
  import { ModelUsagePanel } from '$lib/components/dashboard';
  import type { StatsCache } from '$lib/types';

  // ============================================
  // 状态变量
  // ============================================
  let loading = true;
  let error: string | null = null;

  // ============================================
  // 配置选项（演示用）
  // ============================================
  let showChart = true;
  let showTable = true;
  let customHeight = 'auto';

  // ============================================
  // 数据获取
  // ============================================
  async function fetchStatsData() {
    loading = true;
    error = null;

    try {
      // 从 API 获取统计数据
      const response = await fetch('/api/stats');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StatsCache = await response.json();

      // 更新 store
      statsStore.setCurrent(data);
    } catch (err) {
      error = err instanceof Error ? err.message : '未知错误';
      console.error('获取统计数据失败:', err);
    } finally {
      loading = false;
    }
  }

  // ============================================
  // 生命周期
  // ============================================
  onMount(() => {
    // 页面加载时获取数据
    fetchStatsData();
  });

  // ============================================
  // 手动刷新
  // ============================================
  function handleRefresh() {
    fetchStatsData();
  }
</script>

<div class="demo-page min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
        模型用量统计演示
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        ModelUsagePanel 组件使用示例
      </p>
    </div>

    <!-- 控制面板（演示用） -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        组件配置
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 显示图表开关 -->
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={showChart}
            class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">显示图表</span>
        </label>

        <!-- 显示表格开关 -->
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={showTable}
            class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">显示表格</span>
        </label>

        <!-- 刷新按钮 -->
        <button
          type="button"
          on:click={handleRefresh}
          disabled={loading}
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '加载中...' : '刷新数据'}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    {#if loading}
      <div class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if error}
      <!-- 错误状态 -->
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div class="flex items-center">
          <svg
            class="h-5 w-5 text-red-600 dark:text-red-400 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-300">
              加载失败
            </h3>
            <p class="text-sm text-red-700 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    {:else}
      <!-- ModelUsagePanel 组件 -->
      <ModelUsagePanel
        {showChart}
        {showTable}
        height={customHeight}
        class="shadow-lg"
      />

      <!-- 使用说明 -->
      <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 class="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          使用说明
        </h3>
        <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>通过上方的开关可以控制图表和表格的显示</li>
          <li>使用面板中的筛选下拉框可以查看特定模型的数据</li>
          <li>使用排序下拉框可以按不同字段排序</li>
          <li>点击饼图图例可以高亮对应的数据</li>
          <li>点击"环形图"/"饼图"按钮可以切换图表类型</li>
        </ul>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .demo-page {
    @apply transition-colors duration-200;
  }
</style>
