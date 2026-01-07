<!--
  @file 根布局组件
  @description SvelteKit 应用的根布局，包含 Header、Footer 和全局状态初始化
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import { appliedTheme } from '$lib/stores';
  import { getWebSocketService, destroyWebSocketService } from '$lib/services';
  import '../app.css';

  /**
   * WebSocket 服务实例
   */
  let wsService: ReturnType<typeof getWebSocketService> | null = null;

  /**
   * 组件挂载时初始化
   *
   * 业务逻辑：
   * 1. 应用保存的主题设置
   * 2. 建立 WebSocket 连接
   */
  onMount(() => {
    // 主题设置会在 themeStore 初始化时自动从 localStorage 加载

    // 初始化 WebSocket 连接
    wsService = getWebSocketService();
    wsService.connect();
  });

  /**
   * 组件卸载时清理资源
   */
  onDestroy(() => {
    // 断开 WebSocket 连接
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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- 根容器，应用主题类 -->
<div class="app-container {themeClass}">
  <!-- 页面头部 -->
  <Header />

  <!-- 主内容区域 -->
  <main class="main-content">
    <slot />
  </main>

  <!-- 页面底部 -->
  <Footer />
</div>

<style>
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
   * 页面过渡动画
   */
  :global(.page-transition-enter) {
    opacity: 0;
    transform: translateY(10px);
  }

  :global(.page-transition-enter-active) {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
</style>
