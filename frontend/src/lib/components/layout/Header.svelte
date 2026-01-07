<!--
  @file Header 页面头部组件
  @description 应用顶部导航栏，包含标题和主题切换功能
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import { onMount } from 'svelte';

  /**
   * 移动端菜单展开状态
   */
  let isMobileMenuOpen = false;

  /**
   * 菜单按钮引用
   */
  let menuButtonRef: HTMLButtonElement;

  /**
   * 切换移动端菜单
   */
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  /**
   * 关闭移动端菜单
   */
  function closeMobileMenu() {
    if (isMobileMenuOpen) {
      isMobileMenuOpen = false;
      // 焦点返回到菜单按钮
      menuButtonRef?.focus();
    }
  }

  /**
   * 处理键盘事件
   * 支持 Escape 键关闭菜单
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeMobileMenu();
    }
  }

  /**
   * 组件挂载时添加键盘监听
   */
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<!-- 页面头部容器 -->
<header
  class="header bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-50 shadow-sm"
>
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo 和标题 -->
      <div class="flex items-center gap-3">
        <!-- Logo 图标 -->
        <div class="logo-icon" aria-hidden="true">
          <svg
            class="w-8 h-8 text-primary-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            focusable="false"
          >
            <path
              fill-rule="evenodd"
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- 应用标题 -->
        <h1 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50">
          Claude Token Monitor
        </h1>
      </div>

      <!-- 桌面端操作区 -->
      <div class="hidden md:flex items-center gap-4">
        <!-- 导航链接（预留，可根据需要添加） -->
        <nav
          class="flex items-center gap-4"
          aria-label="主导航"
        >
          <!-- 未来可以在这里添加导航链接 -->
        </nav>

        <!-- 主题切换按钮 -->
        <ThemeToggle />
      </div>

      <!-- 移动端菜单按钮 -->
      <div class="md:hidden">
        <button
          bind:this={menuButtonRef}
          type="button"
          on:click={toggleMobileMenu}
          class="mobile-menu-button p-2 rounded-lg transition-colors
                 bg-surface-100 dark:bg-surface-700
                 hover:bg-surface-200 dark:hover:bg-surface-600
                 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-haspopup="true"
        >
          {#if isMobileMenuOpen}
            <!-- 关闭图标 -->
            <svg
              class="w-6 h-6 text-surface-700 dark:text-surface-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          {:else}
            <!-- 菜单图标 -->
            <svg
              class="w-6 h-6 text-surface-700 dark:text-surface-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <!-- 移动端菜单面板 -->
    {#if isMobileMenuOpen}
      <div
        class="mobile-menu md:hidden py-4 border-t border-surface-200 dark:border-surface-700"
        id="mobile-menu"
        role="region"
        aria-label="移动端菜单"
      >
        <!-- 导航链接（预留） -->
        <nav
          class="flex flex-col gap-2 mb-4"
          aria-label="移动端导航"
        >
          <!-- 未来可以在这里添加移动端导航链接 -->
        </nav>

        <!-- 主题切换 -->
        <div class="flex items-center justify-between p-2">
          <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
            主题切换
          </span>
          <ThemeToggle />
        </div>
      </div>
    {/if}
  </div>
</header>

<style>
  /**
   * 头部固定定位样式
   * 注意：使用 :global() 包裹以支持 Tailwind 动态添加的 .dark 类
   */
  :global(.header) {
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.95);
  }

  :global(.dark .header) {
    background-color: rgba(38, 38, 38, 0.95);
  }

  /**
   * Logo 图标动画
   */
  .logo-icon {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  /**
   * 移动端菜单滑入动画
   */
  .mobile-menu {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /**
   * 移动端菜单按钮点击效果
   */
  .mobile-menu-button:active {
    transform: scale(0.95);
  }

  /**
   * 标题文字响应式
   */
  @media (max-width: 640px) {
    h1 {
      font-size: 1.125rem; /* 从 xl 降到 lg */
    }
  }


</style>
