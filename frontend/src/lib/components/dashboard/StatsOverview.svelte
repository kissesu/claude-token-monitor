<!--
  @file StatsOverview 仪表板统计面板组件
  @description 显示 Token 使用、缓存命中率、总费用和会话数量的概览面板
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import StatCard from '$lib/components/common/StatCard.svelte';
  import { statsStore, totalTokens, totalCost, wsIsConnected } from '$lib/stores';
  import type { TokenUsage } from '$lib/types';

  /**
   * 计算所有模型的输入 Token 总和
   */
  $: totalInputTokens = $statsStore.current
    ? Object.values($statsStore.current.models).reduce(
        (sum, model) => sum + model.tokens.input_tokens,
        0
      )
    : 0;

  /**
   * 计算所有模型的输出 Token 总和
   */
  $: totalOutputTokens = $statsStore.current
    ? Object.values($statsStore.current.models).reduce(
        (sum, model) => sum + model.tokens.output_tokens,
        0
      )
    : 0;

  /**
   * 计算所有模型的缓存命中 Token 总和
   */
  $: totalCacheReadTokens = $statsStore.current
    ? Object.values($statsStore.current.models).reduce(
        (sum, model) => sum + model.tokens.cache_read_tokens,
        0
      )
    : 0;

  /**
   * 计算所有模型的缓存写入 Token 总和
   */
  $: totalCacheCreationTokens = $statsStore.current
    ? Object.values($statsStore.current.models).reduce(
        (sum, model) => sum + model.tokens.cache_creation_tokens,
        0
      )
    : 0;

  /**
   * 计算缓存命中率百分比
   * 缓存命中率 = 缓存读取 tokens / 总 tokens * 100
   */
  $: cacheHitRate =
    $totalTokens > 0 ? ((totalCacheReadTokens / $totalTokens) * 100).toFixed(2) : '0.00';

  /**
   * 格式化费用显示（保留 4 位小数）
   */
  $: formattedCost = $totalCost.toFixed(4);

  /**
   * 计算会话数量
   * 从统计汇总数据中获取，如果不存在则显示 0
   */
  $: sessionCount = $statsStore.summary?.total_sessions ?? 0;

  /**
   * WebSocket 连接状态指示器类
   * 已连接时显示绿色闪烁动画
   */
  $: connectionIndicatorClass = $wsIsConnected
    ? 'bg-green-500 animate-pulse'
    : 'bg-gray-400 dark:bg-gray-600';
</script>

<!-- 统计概览面板容器 -->
<div class="stats-overview">
  <!-- 面板标题区域 -->
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-50">统计概览</h2>

    <!-- 实时连接状态指示器 -->
    <div class="flex items-center gap-2">
      <div class="relative">
        <!-- 连接状态点（已连接时闪烁） -->
        <div class="w-3 h-3 rounded-full {connectionIndicatorClass}"></div>
      </div>
      <span class="text-sm text-surface-600 dark:text-surface-400">
        {$wsIsConnected ? '实时更新' : '离线'}
      </span>
    </div>
  </div>

  <!-- 统计卡片网格布局 -->
  <div
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    role="region"
    aria-label="统计数据概览"
  >
    <!-- 总 Token 数卡片 -->
    <StatCard
      title="总 Token 数"
      value={$totalTokens}
      icon="fa-chart-bar"
      unit="tokens"
      trend="up"
      trendValue="+12.5%"
    />

    <!-- 输入 Tokens 卡片 -->
    <StatCard
      title="输入 Tokens"
      value={totalInputTokens}
      icon="fa-sign-in-alt"
      unit="tokens"
    />

    <!-- 输出 Tokens 卡片 -->
    <StatCard
      title="输出 Tokens"
      value={totalOutputTokens}
      icon="fa-sign-out-alt"
      unit="tokens"
    />

    <!-- 缓存命中 Tokens 卡片 -->
    <StatCard
      title="缓存命中"
      value={totalCacheReadTokens}
      icon="fa-bolt"
      unit="tokens"
    />

    <!-- 缓存写入 Tokens 卡片 -->
    <StatCard
      title="缓存写入"
      value={totalCacheCreationTokens}
      icon="fa-database"
      unit="tokens"
    />

    <!-- 缓存命中率卡片 -->
    <StatCard
      title="缓存命中率"
      value={cacheHitRate}
      icon="fa-percentage"
      unit="%"
      trend="up"
      trendValue="+5.2%"
    />

    <!-- 总费用卡片 -->
    <StatCard
      title="总费用"
      value={formattedCost}
      icon="fa-dollar-sign"
      unit="USD"
      trend="up"
      trendValue="+$0.15"
    />

    <!-- 会话数量卡片 -->
    <StatCard
      title="会话数量"
      value={sessionCount}
      icon="fa-comments"
      unit="sessions"
    />
  </div>
</div>

<style>
  /**
   * 统计概览面板样式
   */
  .stats-overview {
    width: 100%;
    padding: 0;
  }

  /**
   * 连接状态指示器脉冲动画
   * 覆盖默认的 Tailwind animate-pulse，使其更平滑
   */
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }

  /**
   * 响应式设计
   * 在移动设备上调整间距和布局
   */
  @media (max-width: 768px) {
    .stats-overview {
      padding: 0;
    }

    .stats-overview h2 {
      font-size: 1.5rem; /* 从 2xl 降到 xl */
    }

    .grid {
      gap: 0.75rem; /* 减少卡片间距 */
    }
  }

  /**
   * 平板设备优化
   */
  @media (min-width: 768px) and (max-width: 1024px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /**
   * 桌面设备优化
   */
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
