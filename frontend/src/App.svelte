<!--
  @file 主应用组件
  @description Claude Token Monitor 的主应用组件
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  /**
   * 主题状态管理
   * 初始化为暗色主题
   */
  let isDarkMode = true;

  /**
   * 切换主题
   * 同时更新 HTML 元素的 class 以应用对应主题样式
   */
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /**
   * 组件挂载时初始化主题
   * 默认应用暗色主题
   */
  import { onMount } from 'svelte';
  onMount(() => {
    document.documentElement.classList.add('dark');
  });
</script>

<div class="app min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50">
  <!-- 顶部导航栏 -->
  <header class="border-b border-surface-200 dark:border-surface-700">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Claude Token Monitor</h1>

      <!-- 主题切换按钮 -->
      <button
        on:click={toggleTheme}
        class="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors"
        aria-label="切换主题"
      >
        {isDarkMode ? '浅色' : '暗色'}
      </button>
    </div>
  </header>

  <!-- 主内容区域 -->
  <main class="container mx-auto px-4 py-8">
    <div class="card p-6 bg-white dark:bg-surface-800 rounded-lg shadow-lg">
      <h2 class="text-xl font-semibold mb-4">欢迎使用 Claude Token Monitor</h2>
      <p class="text-surface-600 dark:text-surface-400">
        前端项目已成功初始化，使用 Svelte + TypeScript + Skeleton UI
      </p>
    </div>
  </main>
</div>

<style>
  /**
   * 组件特定样式
   * 全局样式在 app.css 中定义
   */
  .app {
    min-height: 100vh;
  }

  .card {
    transition: transform 0.2s ease-in-out;
  }

  .card:hover {
    transform: translateY(-2px);
  }
</style>
