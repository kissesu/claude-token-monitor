<!--
  @file LoadingSpinner 加载指示器组件
  @description 旋转加载动画组件，支持多种尺寸和自定义颜色
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  /**
   * 组件属性定义
   */
  /** 加载器尺寸 */
  export let size: 'sm' | 'md' | 'lg' = 'md';
  /** 自定义颜色（可选，默认使用主题色） */
  export let color: string | undefined = undefined;
  /** 加载文本（可选） */
  export let text: string | undefined = undefined;

  /**
   * 根据尺寸映射 CSS 类
   */
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  /**
   * 文本尺寸类
   */
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  /**
   * 获取当前尺寸的 CSS 类
   */
  $: spinnerSizeClass = sizeClasses[size];
  $: textSizeClass = textSizeClasses[size];

  /**
   * 默认颜色类（如果未提供自定义颜色）
   */
  const defaultColorClass = 'border-primary-500';

  /**
   * 自定义颜色样式
   */
  $: customColorStyle = color
    ? `border-top-color: ${color}; border-right-color: ${color};`
    : '';
</script>

<!-- 加载器容器 -->
<div class="loading-spinner-container flex flex-col items-center justify-center gap-3">
  <!-- 旋转加载器 -->
  <div
    class="spinner {spinnerSizeClass} border-4 border-surface-200 dark:border-surface-700
           {color ? '' : defaultColorClass} rounded-full animate-spin"
    style={customColorStyle}
    role="status"
    aria-label="加载中"
  ></div>

  <!-- 加载文本 -->
  {#if text}
    <p class="loading-text {textSizeClass} text-surface-600 dark:text-surface-400 font-medium">
      {text}
    </p>
  {/if}
</div>

<style>
  /**
   * 加载器容器样式
   */
  .loading-spinner-container {
    padding: 1rem;
  }

  /**
   * 旋转动画定义
   * 使用 CSS 自定义动画以支持自定义颜色
   */
  .spinner {
    border-top-color: transparent;
    border-right-color: transparent;
  }

  /**
   * 如果浏览器不支持 Tailwind 的 animate-spin，使用自定义动画
   */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  /**
   * 加载文本淡入动画
   */
  .loading-text {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /**
   * 无障碍支持
   * 为屏幕阅读器提供加载状态提示
   */
  .spinner::before {
    content: '';
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
