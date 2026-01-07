<!--
  @file DateRangePicker 日期范围选择器组件
  @description 用于选择日期范围的组件，支持快捷选项和自定义日期输入
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /**
   * 组件属性定义
   */
  /** 开始日期 */
  export let startDate = '';
  /** 结束日期 */
  export let endDate = '';

  /**
   * 事件派发器
   * 用于向父组件发送日期变更事件
   */
  const dispatch = createEventDispatcher<{
    change: { startDate: string; endDate: string };
  }>();

  /**
   * 本地日期状态
   */
  let localStartDate = startDate;
  let localEndDate = endDate;

  /**
   * 当前选中的快捷选项
   */
  let selectedPreset = '';

  /**
   * 快捷日期选项配置
   */
  const presets = [
    { label: '今日', value: 'today' },
    { label: '过去 7 天', value: 'last7days' },
    { label: '过去 30 天', value: 'last30days' },
    { label: '本月', value: 'thisMonth' },
    { label: '自定义', value: 'custom' }
  ];

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   */
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取今天的日期
   */
  function getToday(): Date {
    return new Date();
  }

  /**
   * 获取 N 天前的日期
   */
  function getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * 获取本月第一天
   */
  function getFirstDayOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * 处理快捷选项点击
   */
  function handlePresetClick(presetValue: string) {
    selectedPreset = presetValue;

    switch (presetValue) {
      case 'today': {
        const today = formatDate(getToday());
        localStartDate = today;
        localEndDate = today;
        break;
      }
      case 'last7days':
        localStartDate = formatDate(getDaysAgo(7));
        localEndDate = formatDate(getToday());
        break;
      case 'last30days':
        localStartDate = formatDate(getDaysAgo(30));
        localEndDate = formatDate(getToday());
        break;
      case 'thisMonth':
        localStartDate = formatDate(getFirstDayOfMonth());
        localEndDate = formatDate(getToday());
        break;
      case 'custom':
        // 自定义模式，不修改日期
        return;
    }

    // 派发变更事件
    emitChange();
  }

  /**
   * 处理开始日期变更
   */
  function handleStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    localStartDate = target.value;
    selectedPreset = 'custom';
    emitChange();
  }

  /**
   * 处理结束日期变更
   */
  function handleEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    localEndDate = target.value;
    selectedPreset = 'custom';
    emitChange();
  }

  /**
   * 派发日期变更事件
   */
  function emitChange() {
    dispatch('change', {
      startDate: localStartDate,
      endDate: localEndDate
    });
  }

  /**
   * 验证日期范围是否有效
   */
  $: isValidRange = (() => {
    if (!localStartDate || !localEndDate) return false;
    return new Date(localStartDate) <= new Date(localEndDate);
  })();
</script>

<!-- 日期范围选择器容器 -->
<div
  class="date-range-picker bg-white dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700"
  role="group"
  aria-labelledby="date-range-picker-title"
>
  <!-- 快捷选项按钮组 -->
  <div class="preset-buttons mb-4" role="group" aria-labelledby="date-range-picker-title">
    <h3
      id="date-range-picker-title"
      class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
    >
      快捷选择
    </h3>
    <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="日期范围预设选项">
      {#each presets as preset}
        <button
          type="button"
          class="preset-button px-4 py-2 text-sm font-medium rounded-md transition-colors
                 {selectedPreset === preset.value
                   ? 'bg-primary-500 text-white'
                   : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'}"
          on:click={() => handlePresetClick(preset.value)}
          role="radio"
          tabindex={selectedPreset === preset.value ? 0 : -1}
          aria-checked={selectedPreset === preset.value}
          aria-label="选择{preset.label}"
        >
          {preset.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- 自定义日期输入 -->
  <div class="custom-date-inputs grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- 开始日期 -->
    <div class="form-group">
      <label
        for="start-date"
        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
      >
        开始日期
      </label>
      <input
        id="start-date"
        type="date"
        value={localStartDate}
        on:input={handleStartDateChange}
        class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600
               rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500
               focus:border-primary-500 bg-white dark:bg-surface-700
               text-surface-900 dark:text-surface-100 transition-colors"
        aria-describedby={!isValidRange && localStartDate && localEndDate ? 'date-range-error' : undefined}
        aria-invalid={!isValidRange && localStartDate && localEndDate ? 'true' : undefined}
        aria-required="false"
      />
    </div>

    <!-- 结束日期 -->
    <div class="form-group">
      <label
        for="end-date"
        class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
      >
        结束日期
      </label>
      <input
        id="end-date"
        type="date"
        value={localEndDate}
        on:input={handleEndDateChange}
        class="w-full px-3 py-2 border border-surface-300 dark:border-surface-600
               rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500
               focus:border-primary-500 bg-white dark:bg-surface-700
               text-surface-900 dark:text-surface-100 transition-colors"
        aria-describedby={!isValidRange && localStartDate && localEndDate ? 'date-range-error' : undefined}
        aria-invalid={!isValidRange && localStartDate && localEndDate ? 'true' : undefined}
        aria-required="false"
      />
    </div>
  </div>

  <!-- 日期范围验证提示 -->
  {#if localStartDate && localEndDate && !isValidRange}
    <div
      id="date-range-error"
      class="validation-message mt-3 text-sm text-red-600 dark:text-red-400"
      role="alert"
      aria-live="polite"
    >
      <svg
        class="inline-block w-4 h-4 mr-1"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      结束日期不能早于开始日期
    </div>
  {/if}
</div>

<style>
  /**
   * 日期选择器容器样式
   */
  .date-range-picker {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  }

  /**
   * 快捷按钮样式
   */
  .preset-button {
    border: 1px solid transparent;
  }

  .preset-button:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  /**
   * 输入框样式增强
   */
  input[type='date'] {
    cursor: pointer;
  }

  input[type='date']::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.5);
  }

  .dark input[type='date']::-webkit-calendar-picker-indicator {
    filter: invert(0.8);
  }

  /**
   * 验证消息动画
   */
  .validation-message {
    animation: shake 0.3s ease-in-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-4px);
    }
    75% {
      transform: translateX(4px);
    }
  }

  /**
   * 响应式设计
   * 在小屏幕上调整布局
   */
  @media (max-width: 640px) {
    .preset-buttons button {
      flex: 1 1 calc(50% - 0.5rem);
      min-width: 0;
    }

    .date-range-picker {
      padding: 0.75rem;
    }
  }
</style>
