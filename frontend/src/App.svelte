<!--
  @file 主应用组件
  @description Claude Token Monitor 主应用，集成布局和仪表板组件
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import { LazyLoad } from '$lib/components/common';
  import StatsOverview from '$lib/components/dashboard/StatsOverview.svelte';
  import { appliedTheme } from '$lib/stores/themeStore';
  import {
    statsStore,
    wsIsConnected,
  } from '$lib/stores';
  import { getCurrentStats, getDailyStats, getWebSocketService, destroyWebSocketService } from '$lib/services';
  import './app.css';

  // ============================================
  // 懒加载组件定义
  // 使用动态 import 延迟加载图表相关组件
  // ============================================

  /**
   * 模型用量面板懒加载器
   * 包含饼图组件，体积较大
   */
  const modelUsagePanelLoader = () => import('$lib/components/dashboard/ModelUsagePanel.svelte');

  /**
   * 每日活动面板懒加载器
   * 包含热力图和趋势图组件，体积较大
   */
  const dailyActivityPanelLoader = () => import('$lib/components/dashboard/DailyActivityPanel.svelte');

  /**
   * 费用估算面板懒加载器
   */
  const costEstimatePanelLoader = () => import('$lib/components/dashboard/CostEstimatePanel.svelte');

  /**
   * WebSocket 服务实例
   */
  let wsService: ReturnType<typeof getWebSocketService> | null = null;

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
   * 组件挂载时初始化
   *
   * 业务逻辑：
   * 1. 从 localStorage 加载主题设置
   * 2. 建立 WebSocket 连接
   * 3. 加载初始数据
   */
  onMount(() => {
    // 主题设置会在 themeStore 初始化时自动从 localStorage 加载

    // 初始化 WebSocket 连接
    wsService = getWebSocketService();
    wsService.connect();

    // 加载统计数据
    loadData();
  });

  /**
   * 组件卸载时清理资源
   */
  onDestroy(() => {
    if (wsService) {
      wsService.disconnect();
    }
    destroyWebSocketService();
  });

  /**
   * 响应式应用主题类名
   */
  $: themeClass = $appliedTheme === 'dark' ? 'dark' : '';
</script>

<svelte:head>
  <title>Claude Token Monitor - 本地 Token 使用监控</title>
  <meta name="description" content="监控 Claude Code CLI 本地 Token 使用情况的实时仪表板" />
</svelte:head>

<!-- 根容器，应用主题类 -->
<div class="app-container {themeClass}">
  <!-- 跳过链接 - 无障碍键盘导航 -->
  <a href="#main-content" class="skip-link">
    跳到主要内容
  </a>

  <!-- 页面头部 -->
  <Header />

  <!-- 主内容区域 -->
  <main class="main-content" id="main-content" role="main" aria-label="主要内容区域">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="title-section">
        <h1 class="page-title">Token 使用监控</h1>
        <p class="page-subtitle">
          实时追踪 Claude Code CLI 的 Token 消耗和费用
        </p>
      </div>

      <!-- 连接状态指示 -->
      <div class="connection-status" role="status" aria-live="polite">
        {#if $wsIsConnected}
          <span class="status-indicator connected" aria-label="WebSocket 实时连接已建立">
            <span class="status-dot" aria-hidden="true"></span>
            实时连接
          </span>
        {:else}
          <span class="status-indicator disconnected" aria-label="WebSocket 连接已断开">
            <span class="status-dot" aria-hidden="true"></span>
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
        <!-- 统计概览区域（首屏关键内容，不懒加载） -->
        <section class="dashboard-section">
          <StatsOverview />
        </section>

        <!-- 双栏布局：模型用量 + 费用估算（懒加载） -->
        <div class="two-column-grid">
          <section class="dashboard-section">
            <LazyLoad
              loader={modelUsagePanelLoader}
              minHeight={500}
              lazyOnVisible={true}
              rootMargin="200px"
            />
          </section>

          <section class="dashboard-section">
            <LazyLoad
              loader={costEstimatePanelLoader}
              minHeight={400}
              lazyOnVisible={true}
              rootMargin="200px"
            />
          </section>
        </div>

        <!-- 每日活动区域（懒加载，包含大量图表） -->
        <section class="dashboard-section">
          <LazyLoad
            loader={dailyActivityPanelLoader}
            minHeight={600}
            lazyOnVisible={true}
            rootMargin="300px"
          />
        </section>
      </div>
    {/if}
  </main>

  <!-- 页面底部 -->
  <Footer />
</div>

<style>
  /**
   * 跳过链接 - 无障碍键盘导航
   * 默认隐藏，获得焦点时显示
   */
  .skip-link {
    position: absolute;
    top: -100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-primary-600);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0 0 0.5rem 0.5rem;
    font-weight: 600;
    text-decoration: none;
    z-index: 9999;
    transition: top 0.2s ease;
  }

  .skip-link:focus {
    top: 0;
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  /**
   * 应用容器 - 全屏布局
   */
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-50);
    transition: background-color 0.3s ease;
  }

  .app-container.dark {
    background-color: var(--color-surface-900);
  }

  /**
   * 主内容区域
   * 使用 flex-grow 填充剩余空间
   */
  .main-content {
    flex: 1;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  @media (min-width: 640px) {
    .main-content {
      padding: 2rem 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .main-content {
      padding: 2.5rem 2rem;
    }
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
