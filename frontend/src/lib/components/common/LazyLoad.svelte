/**
 * @file 懒加载包装器组件
 * @description 用于延迟加载大型组件（如图表），优化首屏加载性能
 *              支持 IntersectionObserver 视口检测，只在组件进入视口时才加载
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 要懒加载的组件 Promise
   * 使用 import() 动态导入
   */
  export let loader: () => Promise<{ default: any }>;

  /**
   * 传递给加载组件的 props
   */
  export let componentProps: Record<string, any> = {};

  /**
   * 占位区域最小高度（像素）
   * 用于防止布局跳动
   */
  export let minHeight: number = 200;

  /**
   * 是否在视口内才加载（Intersection Observer）
   * 默认 true，组件进入视口时才开始加载
   */
  export let lazyOnVisible: boolean = true;

  /**
   * 视口检测的 root margin
   * 提前加载距离视口多远的组件
   */
  export let rootMargin: string = '100px';

  /**
   * 加载延迟（毫秒）
   * 用于防止快速滚动时的过多加载
   */
  export let loadDelay: number = 0;

  /**
   * 自定义 CSS 类名
   */
  let className: string = '';
  export { className as class };

  // ============================================
  // 状态管理
  // ============================================

  /**
   * 加载的组件
   */
  let LoadedComponent: any = null;

  /**
   * 加载状态
   */
  let loading: boolean = false;

  /**
   * 错误信息
   */
  let error: string = '';

  /**
   * 是否已在视口内
   */
  let isVisible: boolean = false;

  /**
   * 容器元素引用
   */
  let containerRef: HTMLElement;

  /**
   * IntersectionObserver 实例
   */
  let observer: IntersectionObserver | null = null;

  /**
   * 加载延迟定时器
   */
  let loadTimer: ReturnType<typeof setTimeout> | null = null;

  // ============================================
  // 事件分发
  // ============================================
  const dispatch = createEventDispatcher<{
    load: void;
    error: Error;
  }>();

  // ============================================
  // 加载逻辑
  // ============================================

  /**
   * 执行组件加载
   *
   * 业务逻辑：
   * 1. 设置加载状态
   * 2. 动态导入组件
   * 3. 更新状态并分发事件
   */
  async function loadComponent() {
    if (LoadedComponent || loading) return;

    loading = true;
    error = '';

    try {
      // 添加可选的加载延迟
      if (loadDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, loadDelay));
      }

      const module = await loader();
      LoadedComponent = module.default;
      dispatch('load');
    } catch (e) {
      const err = e instanceof Error ? e : new Error('组件加载失败');
      error = err.message;
      dispatch('error', err);
    } finally {
      loading = false;
    }
  }

  /**
   * 设置 Intersection Observer
   * 监听组件是否进入视口
   */
  function setupObserver() {
    if (!lazyOnVisible || typeof IntersectionObserver === 'undefined') {
      // 不使用懒加载或浏览器不支持，直接加载
      loadComponent();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            isVisible = true;
            // 使用 requestIdleCallback 优化加载时机
            if ('requestIdleCallback' in window) {
              (window as any).requestIdleCallback(() => loadComponent());
            } else {
              loadComponent();
            }
            // 加载后停止观察
            observer?.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01, // 只要 1% 可见就触发
      }
    );

    if (containerRef) {
      observer.observe(containerRef);
    }
  }

  // ============================================
  // 生命周期
  // ============================================

  onMount(() => {
    setupObserver();
  });

  onDestroy(() => {
    observer?.disconnect();
    if (loadTimer) {
      clearTimeout(loadTimer);
    }
  });

  /**
   * 重试加载
   */
  function handleRetry() {
    LoadedComponent = null;
    error = '';
    loadComponent();
  }
</script>

<!-- ============================================
  懒加载容器
============================================ -->
<div
  bind:this={containerRef}
  class="lazy-load-wrapper {className}"
  style="min-height: {minHeight}px;"
>
  {#if LoadedComponent}
    <!-- 组件已加载，渲染实际组件 -->
    <svelte:component this={LoadedComponent} {...componentProps} />
  {:else if loading}
    <!-- 加载中状态 -->
    <div class="loading-state flex items-center justify-center" style="min-height: {minHeight}px;">
      <LoadingSpinner size="md" text="正在加载组件..." />
    </div>
  {:else if error}
    <!-- 错误状态 -->
    <div class="error-state flex flex-col items-center justify-center gap-4" style="min-height: {minHeight}px;">
      <svg
        class="w-12 h-12 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p class="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        on:click={handleRetry}
      >
        重试
      </button>
    </div>
  {:else}
    <!-- 等待进入视口 -->
    <div class="placeholder-state flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg" style="min-height: {minHeight}px;">
      <span class="text-sm text-gray-400 dark:text-gray-500">组件将在进入视口时加载</span>
    </div>
  {/if}
</div>

<style lang="postcss">
  .lazy-load-wrapper {
    @apply w-full;
  }

  .loading-state,
  .error-state,
  .placeholder-state {
    @apply w-full;
  }
</style>
