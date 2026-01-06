<!--
  @file StatCard 统计卡片组件
  @description 用于展示统计数据的卡片组件，支持图标、趋势指示器和数值动画
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { onMount } from 'svelte';

  /**
   * 组件属性定义
   */
  /** 卡片标题 */
  export let title: string;
  /** 统计数值 */
  export let value: number | string;
  /** 图标（可选，使用 Font Awesome 类名或 SVG） */
  export let icon: string | undefined = undefined;
  /** 趋势方向（可选，'up' 表示上升，'down' 表示下降） */
  export let trend: 'up' | 'down' | undefined = undefined;
  /** 趋势数值（可选，显示变化百分比或绝对值） */
  export let trendValue: string | undefined = undefined;
  /** 数值单位（可选） */
  export let unit: string | undefined = undefined;

  /**
   * 动画显示的当前数值
   * 用于实现数字滚动效果
   */
  let displayValue = 0;

  /**
   * 数值是否为数字类型
   */
  $: isNumeric = typeof value === 'number';

  /**
   * 格式化数值显示
   * 如果是数字类型，显示动画值；否则直接显示原值
   */
  $: formattedValue = isNumeric ? Math.round(displayValue).toLocaleString() : value;

  /**
   * 趋势指示器颜色类
   */
  $: trendColorClass =
    trend === 'up'
      ? 'text-green-500 dark:text-green-400'
      : trend === 'down'
        ? 'text-red-500 dark:text-red-400'
        : '';

  /**
   * 组件挂载时执行数值动画
   * 如果值是数字，则从 0 动画到目标值
   */
  onMount(() => {
    if (isNumeric) {
      const target = value as number;
      const duration = 1000; // 动画持续时间 1 秒
      const steps = 60; // 动画帧数
      const stepValue = target / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        displayValue = Math.min(currentStep * stepValue, target);

        if (currentStep >= steps) {
          clearInterval(timer);
          displayValue = target;
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  });
</script>

<!-- 卡片容器 -->
<div
  class="stat-card bg-white dark:bg-surface-800 rounded-lg shadow-md hover:shadow-lg
         transition-all duration-300 p-6 border border-surface-200 dark:border-surface-700"
>
  <!-- 卡片头部：标题和图标 -->
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-medium text-surface-600 dark:text-surface-400">
      {title}
    </h3>
    {#if icon}
      <div
        class="icon-wrapper text-primary-500 dark:text-primary-400 text-2xl"
        aria-hidden="true"
      >
        <!-- 如果是 Font Awesome 图标类名 -->
        {#if icon.startsWith('fa-')}
          <i class="fas {icon}"></i>
        {:else}
          <!-- 如果是自定义 SVG 或其他内容 -->
          {@html icon}
        {/if}
      </div>
    {/if}
  </div>

  <!-- 数值显示区域 -->
  <div class="value-container">
    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-bold text-surface-900 dark:text-surface-50">
        {formattedValue}
      </span>
      {#if unit}
        <span class="text-lg text-surface-600 dark:text-surface-400">
          {unit}
        </span>
      {/if}
    </div>

    <!-- 趋势指示器 -->
    {#if trend && trendValue}
      <div class="trend-indicator mt-2 flex items-center gap-1 {trendColorClass}">
        <!-- 趋势箭头图标 -->
        <svg
          class="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {#if trend === 'up'}
            <!-- 上升箭头 -->
            <path
              fill-rule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          {:else}
            <!-- 下降箭头 -->
            <path
              fill-rule="evenodd"
              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          {/if}
        </svg>
        <span class="text-sm font-medium">{trendValue}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /**
   * 卡片组件样式
   */
  .stat-card {
    /* 添加悬停时的轻微上移效果 */
    position: relative;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }

  /**
   * 图标容器样式
   */
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /**
   * 数值容器样式
   */
  .value-container {
    min-height: 4rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /**
   * 趋势指示器动画
   */
  .trend-indicator {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /**
   * 响应式设计
   * 在小屏幕上调整字体大小
   */
  @media (max-width: 640px) {
    .value-container span:first-child {
      font-size: 1.875rem; /* 从 3xl 降到 2xl */
    }

    .stat-card {
      padding: 1rem; /* 减少内边距 */
    }
  }
</style>
