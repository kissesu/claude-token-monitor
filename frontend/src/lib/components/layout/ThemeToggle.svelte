<!--
  @file ThemeToggle 主题切换组件
  @description 暗色/亮色模式切换按钮，支持本地存储和系统主题检测
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { onMount } from 'svelte';

  /**
   * 主题类型定义
   */
  type Theme = 'light' | 'dark';

  /**
   * 当前主题状态
   */
  let currentTheme: Theme = 'dark';

  /**
   * 本地存储键名
   */
  const THEME_STORAGE_KEY = 'claude-token-monitor-theme';

  /**
   * 从本地存储获取主题偏好
   */
  function getStoredTheme(): Theme | null {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  /**
   * 保存主题偏好到本地存储
   */
  function saveTheme(theme: Theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  /**
   * 检测系统主题偏好
   */
  function getSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    currentTheme = theme;
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveTheme(newTheme);
  }

  /**
   * 组件挂载时初始化主题
   * 优先级：本地存储 > 系统偏好 > 默认暗色
   */
  onMount(() => {
    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || getSystemTheme();
    applyTheme(initialTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // 仅在没有本地存储偏好时响应系统主题变化
      if (!getStoredTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // 清理事件监听器
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });
</script>

<!-- 主题切换按钮 -->
<button
  type="button"
  on:click={toggleTheme}
  class="theme-toggle p-2 rounded-lg transition-all duration-200
         bg-surface-100 dark:bg-surface-700
         hover:bg-surface-200 dark:hover:bg-surface-600
         border border-surface-200 dark:border-surface-600
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
         dark:focus:ring-offset-surface-800"
  aria-label={currentTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
  title={currentTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
>
  <!-- 太阳图标（亮色模式） -->
  {#if currentTheme === 'dark'}
    <svg
      class="w-5 h-5 text-yellow-500 dark:text-yellow-400 transition-transform duration-200 hover:rotate-45"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clip-rule="evenodd"
      />
    </svg>
  {:else}
    <!-- 月亮图标（暗色模式） -->
    <svg
      class="w-5 h-5 text-indigo-600 dark:text-indigo-400 transition-transform duration-200"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  {/if}
</button>

<style>
  /**
   * 主题切换按钮样式
   */
  .theme-toggle {
    position: relative;
    overflow: hidden;
  }

  /**
   * 按钮点击动画
   */
  .theme-toggle:active {
    transform: scale(0.95);
  }

  /**
   * 图标旋转动画
   */
  .theme-toggle svg {
    transition: transform 0.3s ease-in-out;
  }

  .theme-toggle:hover svg {
    transform: scale(1.1);
  }

  /**
   * 涟漪效果
   */
  .theme-toggle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    transition: width 0.3s, height 0.3s;
  }

  .theme-toggle:active::after {
    width: 100%;
    height: 100%;
  }
</style>
