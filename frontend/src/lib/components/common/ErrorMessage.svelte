<!--
  @file ErrorMessage 错误消息组件
  @description 用于显示错误、警告和提示消息的组件，支持重试和关闭功能
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /**
   * 组件属性定义
   */
  /** 消息内容 */
  export let message: string;
  /** 消息类型 */
  export let type: 'error' | 'warning' | 'info' = 'error';
  /** 重试回调函数（可选） */
  export let onRetry: (() => void) | undefined = undefined;
  /** 关闭回调函数（可选） */
  export let onClose: (() => void) | undefined = undefined;

  /**
   * 事件派发器
   * 用于向父组件发送事件
   */
  const dispatch = createEventDispatcher();

  /**
   * 组件可见性状态
   * 用于控制动画显示/隐藏
   */
  let isVisible = true;

  /**
   * 根据消息类型配置样式和图标
   */
  const typeConfig = {
    error: {
      bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textClass: 'text-red-800 dark:text-red-200',
      iconClass: 'text-red-500 dark:text-red-400',
      icon: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />`
    },
    warning: {
      bgClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textClass: 'text-yellow-800 dark:text-yellow-200',
      iconClass: 'text-yellow-500 dark:text-yellow-400',
      icon: `<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />`
    },
    info: {
      bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-800 dark:text-blue-200',
      iconClass: 'text-blue-500 dark:text-blue-400',
      icon: `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />`
    }
  };

  /**
   * 当前类型的配置
   */
  $: config = typeConfig[type];

  /**
   * 获取 ARIA role 和 live 属性
   * error 类型使用 alert role，其他类型使用 status
   */
  $: ariaRole = type === 'error' ? 'alert' : 'status';
  $: ariaLive = (type === 'error' ? 'assertive' : 'polite') as 'polite' | 'assertive';

  /**
   * 处理重试按钮点击
   */
  function handleRetry() {
    if (onRetry) {
      onRetry();
    }
    dispatch('retry');
  }

  /**
   * 处理关闭按钮点击
   */
  function handleClose() {
    isVisible = false;
    // 等待动画结束后执行回调
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      dispatch('close');
    }, 300);
  }
</script>

<!-- 错误消息容器 -->
{#if isVisible}
  <div
    class="error-message {config.bgClass} border rounded-lg p-4 shadow-md
           transition-all duration-300 ease-in-out"
    role={ariaRole}
    aria-live={ariaLive}
    aria-atomic="true"
  >
    <div class="flex items-start gap-3">
      <!-- 图标 -->
      <div class="flex-shrink-0">
        <svg
          class="w-6 h-6 {config.iconClass}"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {@html config.icon}
        </svg>
      </div>

      <!-- 消息内容 -->
      <div class="flex-1 min-w-0">
        <p class="{config.textClass} text-sm font-medium break-words">
          {message}
        </p>

        <!-- 操作按钮区域 -->
        {#if onRetry || onClose}
          <div class="mt-3 flex gap-2">
            <!-- 重试按钮 -->
            {#if onRetry}
              <button
                type="button"
                class="text-sm font-medium {config.textClass} hover:underline
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-{type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500
                       px-3 py-1 rounded transition-colors"
                on:click={handleRetry}
              >
                重试
              </button>
            {/if}

            <!-- 关闭按钮 -->
            {#if onClose}
              <button
                type="button"
                class="text-sm font-medium {config.textClass} hover:underline
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-{type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500
                       px-3 py-1 rounded transition-colors"
                on:click={handleClose}
              >
                关闭
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- 右上角关闭按钮 -->
      {#if onClose}
        <button
          type="button"
          class="flex-shrink-0 {config.textClass} hover:opacity-75 transition-opacity
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-{type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500
                 rounded"
          on:click={handleClose}
          aria-label="关闭消息"
        >
          <svg
            class="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  /**
   * 错误消息动画
   * 进入时从上方滑入并淡入
   */
  .error-message {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /**
   * 响应式设计
   * 在小屏幕上调整间距和字体
   */
  @media (max-width: 640px) {
    .error-message {
      padding: 0.75rem;
    }

    .error-message p {
      font-size: 0.875rem;
    }

    .error-message button {
      font-size: 0.8125rem;
      padding: 0.375rem 0.625rem;
    }
  }
</style>
