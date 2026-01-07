<!--
  @file 仪表板主页面
  @description Claude Token Monitor 主页面，集成所有仪表板面板组件
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import StatsOverview from '$lib/components/dashboard/StatsOverview.svelte';
  import ModelUsagePanel from '$lib/components/dashboard/ModelUsagePanel.svelte';
  import DailyActivityPanel from '$lib/components/dashboard/DailyActivityPanel.svelte';
  import CostEstimatePanel from '$lib/components/dashboard/CostEstimatePanel.svelte';
  import {
    statsStore,
    wsIsConnected,
  } from '$lib/stores';
  import { getCurrentStats, getDailyStats } from '$lib/services';

  /**
   * 初始加载状态
   */
  let initialLoading = true;

  /**
   * 错误信息
   */
  let errorMessage = '';

  /**
   * 加载统计数据
   *
   * 业务逻辑：
   * 1. 调用 API 获取当前统计
   * 2. 获取每日活动数据
   * 3. 更新 store 状态
   */
  async function loadData() {
    try {
      statsStore.setStatus('loading' as any);
      errorMessage = '';

      // 并行获取数据
      const [statsResult, dailyResult] = await Promise.all([
        getCurrentStats(),
        getDailyStats(),
      ]);

      // 更新 store
      if (statsResult) {
        statsStore.setCurrent(statsResult);
      }
      if (dailyResult) {
        statsStore.setDailyActivities(dailyResult);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载数据失败';
      errorMessage = message;
      statsStore.setError(message);
    } finally {
      initialLoading = false;
    }
  }

  /**
   * 重试加载数据
   */
  function handleRetry() {
    errorMessage = '';
    loadData();
  }

  /**
   * 组件挂载时加载数据
   */
  onMount(() => {
    loadData();
  });
</script>

<!-- 页面容器 -->
<div class="dashboard-page">
  <!-- 页面标题区域 -->
  <div class="page-header">
    <div class="title-section">
      <h1 class="page-title">Token 使用监控</h1>
      <p class="page-subtitle">
        实时追踪 Claude Code CLI 的 Token 消耗和费用
      </p>
    </div>

    <!-- 连接状态指示 -->
    <div class="connection-status">
      {#if $wsIsConnected}
        <span class="status-indicator connected">
          <span class="status-dot"></span>
          实时连接
        </span>
      {:else}
        <span class="status-indicator disconnected">
          <span class="status-dot"></span>
          离线
        </span>
      {/if}
    </div>
  </div>

  <!-- 内容区域 -->
  {#if initialLoading}
    <!-- 初始加载状态 -->
    <div class="loading-container">
      <LoadingSpinner size="lg" text="正在加载统计数据..." />
    </div>
  {:else if errorMessage}
    <!-- 错误状态 -->
    <div class="error-container">
      <ErrorMessage
        message={errorMessage}
        type="error"
        onRetry={handleRetry}
      />
    </div>
  {:else}
    <!-- 仪表板内容 -->
    <div class="dashboard-content">
      <!-- 统计概览区域 -->
      <section class="dashboard-section">
        <StatsOverview />
      </section>

      <!-- 双栏布局：模型用量 + 费用估算 -->
      <div class="two-column-grid">
        <section class="dashboard-section">
          <ModelUsagePanel />
        </section>

        <section class="dashboard-section">
          <CostEstimatePanel />
        </section>
      </div>

      <!-- 每日活动区域 -->
      <section class="dashboard-section">
        <DailyActivityPanel />
      </section>
    </div>
  {/if}
</div>

<style>
  /**
   * 仪表板页面容器
   */
  .dashboard-page {
    width: 100%;
  }

  /**
   * 页面头部
   */
  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 640px) {
    .page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  /**
   * 标题区域
   */
  .title-section {
    flex: 1;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  :global(.dark) .page-title {
    color: var(--color-surface-50);
  }

  .page-subtitle {
    font-size: 1rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  :global(.dark) .page-subtitle {
    color: var(--color-surface-400);
  }

  /**
   * 连接状态指示器
   */
  .connection-status {
    flex-shrink: 0;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status-indicator.connected {
    background-color: rgba(34, 197, 94, 0.1);
    color: rgb(34, 197, 94);
  }

  .status-indicator.disconnected {
    background-color: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }

  .status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: currentColor;
  }

  .status-indicator.connected .status-dot {
    animation: pulse-green 2s ease-in-out infinite;
  }

  @keyframes pulse-green {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    }
    50% {
      opacity: 0.8;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
    }
  }

  /**
   * 加载容器
   */
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  /**
   * 错误容器
   */
  .error-container {
    max-width: 500px;
    margin: 4rem auto;
  }

  /**
   * 仪表板内容布局
   */
  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .dashboard-content {
      gap: 2rem;
    }
  }

  /**
   * 仪表板区域
   */
  .dashboard-section {
    width: 100%;
  }

  /**
   * 双栏网格布局
   */
  .two-column-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    .two-column-grid {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
  }

  /**
   * 卡片悬浮效果（全局）
   */
  :global(.dashboard-card) {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease;
  }

  :global(.dark .dashboard-card) {
    background-color: var(--color-surface-800);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  :global(.dashboard-card:hover) {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  :global(.dark .dashboard-card:hover) {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
  }
</style>
