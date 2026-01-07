/**
 * @file 活动热力图组件
 * @description 实现日历热力图，展示每日消息数量或 Token 使用量
 *              支持颜色强度映射、悬浮详情、时间范围选择
 * @author Atlas.oi
 * @date 2026-01-07
 */
<script lang="ts">
  import type { DailyActivity } from '$lib/types';

  // ============================================
  // Props 定义
  // ============================================

  /**
   * 每日活动数据
   * 包含日期、Token 使用、费用、会话数等信息
   */
  export let data: DailyActivity[] = [];

  /**
   * 图表标题
   */
  export let title: string = '活动热力图';

  /**
   * 热力图指标类型
   * sessions: 会话数
   * tokens: Token 总数
   * cost: 费用
   */
  export let metric: 'sessions' | 'tokens' | 'cost' = 'sessions';

  /**
   * 是否正在加载
   */
  export let loading: boolean = false;

  /**
   * 自定义 CSS 类名
   */
  let className: string = '';
  export { className as class };

  // ============================================
  // 常量定义
  // ============================================
  const CELL_SIZE = 14; // 单元格大小
  const CELL_GAP = 3; // 单元格间距
  const DAYS_IN_WEEK = 7;
  const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
  const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // ============================================
  // 颜色配置
  // 定义不同强度级别的颜色
  // ============================================
  const colorSchemes = {
    sessions: [
      '#ebedf0', // 0 级：灰色（无数据）
      '#9be9a8', // 1 级：浅绿
      '#40c463', // 2 级：中绿
      '#30a14e', // 3 级：深绿
      '#216e39', // 4 级：最深绿
    ],
    tokens: [
      '#ebedf0',
      '#c6e48b',
      '#7bc96f',
      '#239a3b',
      '#196127',
    ],
    cost: [
      '#ebedf0',
      '#ffdf5d',
      '#ffc107',
      '#ff9800',
      '#ff5722',
    ],
  };

  // ============================================
  // 响应式数据处理
  // ============================================

  /**
   * 获取指标值
   */
  function getMetricValue(activity: DailyActivity): number {
    switch (metric) {
      case 'sessions':
        return activity.sessions;
      case 'tokens':
        return activity.tokens.input_tokens + activity.tokens.output_tokens;
      case 'cost':
        return activity.cost;
      default:
        return 0;
    }
  }

  /**
   * 构建日期到数据的映射
   */
  $: dataMap = new Map(
    data.map((item) => [item.date, item])
  );

  /**
   * 获取数据的日期范围
   */
  $: dateRange = (() => {
    if (data.length === 0) {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 364); // 显示一年
      return { start, end };
    }

    const dates = data.map((d) => new Date(d.date));
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    // 确保至少显示一周
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 7) {
      end.setDate(start.getDate() + 6);
    }

    return { start, end };
  })();

  /**
   * 生成日历网格数据
   */
  $: calendarData = (() => {
    const { start, end } = dateRange;
    const weeks: Array<Array<{ date: Date; value: number; activity?: DailyActivity }>> = [];

    // 从开始日期的周日开始
    const currentDate = new Date(start);
    const dayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);

    let week: Array<{ date: Date; value: number; activity?: DailyActivity }> = [];

    while (currentDate <= end || week.length > 0) {
      if (week.length === DAYS_IN_WEEK) {
        weeks.push(week);
        week = [];
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      const activity = dataMap.get(dateStr);
      const value = activity ? getMetricValue(activity) : 0;

      week.push({
        date: new Date(currentDate),
        value,
        activity,
      });

      currentDate.setDate(currentDate.getDate() + 1);

      // 超过结束日期后，填充当前周剩余天数
      if (currentDate > end && week.length < DAYS_IN_WEEK) {
        while (week.length < DAYS_IN_WEEK) {
          week.push({
            date: new Date(currentDate),
            value: 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    if (week.length > 0) {
      weeks.push(week);
    }

    return weeks;
  })();

  /**
   * 计算数值范围和强度级别
   */
  $: valueRange = (() => {
    const values = data.map(getMetricValue).filter((v) => v > 0);
    if (values.length === 0) return { min: 0, max: 100, levels: [0, 25, 50, 75, 100] };

    const min = 0;
    const max = Math.max(...values);
    const step = max / 4;

    return {
      min,
      max,
      levels: [0, step, step * 2, step * 3, max],
    };
  })();

  /**
   * 根据数值获取颜色
   */
  function getColor(value: number): string {
    if (value === 0) return colorSchemes[metric][0];

    const { levels } = valueRange;
    const colors = colorSchemes[metric];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (value >= levels[i]) {
        return colors[i];
      }
    }

    return colors[0];
  }

  /**
   * 格式化 Tooltip 内容
   */
  function formatTooltip(item: { date: Date; value: number; activity?: DailyActivity }) {
    const dateStr = item.date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    if (!item.activity || item.value === 0) {
      return `${dateStr}\n暂无数据`;
    }

    let content = `${dateStr}\n`;

    switch (metric) {
      case 'sessions':
        content += `${item.activity.sessions} 个会话`;
        break;
      case 'tokens':
        const totalTokens = item.activity.tokens.input_tokens + item.activity.tokens.output_tokens;
        content += `${totalTokens.toLocaleString()} tokens`;
        break;
      case 'cost':
        content += `$${item.activity.cost.toFixed(4)}`;
        break;
    }

    return content;
  }

  /**
   * 当前悬浮的单元格
   */
  let hoveredCell: { date: Date; value: number; activity?: DailyActivity } | null = null;
  let tooltipPosition = { x: 0, y: 0 };

  function handleCellHover(
    event: MouseEvent | FocusEvent,
    cell: { date: Date; value: number; activity?: DailyActivity }
  ) {
    hoveredCell = cell;
    if (event instanceof MouseEvent) {
      tooltipPosition = {
        x: event.clientX,
        y: event.clientY,
      };
    } else {
      // FocusEvent - 使用元素位置
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      tooltipPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top,
      };
    }
  }

  function handleCellLeave() {
    hoveredCell = null;
  }

  /**
   * 获取月份标签位置
   */
  $: monthPositions = (() => {
    const positions: Array<{ month: string; x: number }> = [];
    let lastMonth = -1;

    calendarData.forEach((week, weekIndex) => {
      const firstDay = week[0];
      const month = firstDay.date.getMonth();

      if (month !== lastMonth) {
        positions.push({
          month: MONTH_LABELS[month],
          x: weekIndex * (CELL_SIZE + CELL_GAP),
        });
        lastMonth = month;
      }
    });

    return positions;
  })();
</script>

<!-- ============================================
  热力图容器
============================================ -->
<div
  class="heatmap-container {className}"
  role="figure"
  aria-label="{title}: 展示{metric === 'sessions' ? '会话数量' : metric === 'tokens' ? 'Token 使用量' : '费用'}的日历热力图，共 {data.length} 天数据。"
>
  <!-- 标题 -->
  {#if title}
    <div class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
      {title}
    </div>
  {/if}

  <!-- 加载状态 -->
  {#if loading}
    <div class="flex items-center justify-center h-48" role="status" aria-busy="true">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
      <span class="sr-only">正在加载活动热力图...</span>
    </div>
  {:else if data.length === 0}
    <!-- 空数据状态 -->
    <div class="flex items-center justify-center h-48">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <svg
          class="mx-auto h-12 w-12 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="text-sm">暂无数据</p>
      </div>
    </div>
  {:else}
    <!-- 热力图主体 -->
    <div class="heatmap-wrapper overflow-x-auto">
      <div class="heatmap-content inline-block">
        <!-- 月份标签 -->
        <div class="month-labels flex gap-[3px] mb-2 ml-8" style="height: 16px;">
          {#each monthPositions as { month, x }}
            <div
              class="text-xs text-gray-600 dark:text-gray-400"
              style="position: absolute; left: {x + 32}px;"
            >
              {month}
            </div>
          {/each}
        </div>

        <!-- 主网格 -->
        <div class="grid-container flex gap-[3px]">
          <!-- 星期标签 -->
          <div class="week-labels flex flex-col gap-[3px]" style="width: 24px;">
            {#each WEEK_LABELS as label, i}
              {#if i % 2 === 1}
                <div
                  class="text-xs text-gray-600 dark:text-gray-400 text-right"
                  style="height: {CELL_SIZE}px; line-height: {CELL_SIZE}px;"
                >
                  {label}
                </div>
              {:else}
                <div style="height: {CELL_SIZE}px;"></div>
              {/if}
            {/each}
          </div>

          <!-- 日历网格 -->
          <div class="calendar-grid flex gap-[3px]">
            {#each calendarData as week}
              <div class="week flex flex-col gap-[3px]">
                {#each week as cell}
                  <div
                    class="cell rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-600"
                    style="
                      width: {CELL_SIZE}px;
                      height: {CELL_SIZE}px;
                      background-color: {getColor(cell.value)};
                    "
                    role="button"
                    tabindex="0"
                    aria-label="{cell.date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}：{cell.value === 0 ? '无数据' : metric === 'sessions' ? `${cell.value} 个会话` : metric === 'tokens' ? `${cell.value.toLocaleString()} tokens` : `$${cell.value.toFixed(4)}`}"
                    on:mouseenter={(e) => handleCellHover(e, cell)}
                    on:mouseleave={handleCellLeave}
                    on:focus={(e) => handleCellHover(e, cell)}
                    on:blur={handleCellLeave}
                  ></div>
                {/each}
              </div>
            {/each}
          </div>
        </div>

        <!-- 图例 -->
        <div class="legend mt-4 flex items-center justify-end gap-2 text-xs text-gray-600 dark:text-gray-400" role="group" aria-label="颜色强度图例">
          <span>少</span>
          <div class="flex gap-1" aria-hidden="true">
            {#each colorSchemes[metric] as color}
              <div
                class="legend-cell rounded-sm"
                style="width: {CELL_SIZE}px; height: {CELL_SIZE}px; background-color: {color};"
              ></div>
            {/each}
          </div>
          <span>多</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Tooltip -->
  {#if hoveredCell}
    <div
      class="tooltip fixed z-50 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md px-3 py-2 pointer-events-none shadow-lg whitespace-pre-line"
      style="
        left: {tooltipPosition.x + 10}px;
        top: {tooltipPosition.y + 10}px;
      "
      role="tooltip"
      aria-live="polite"
    >
      {formatTooltip(hoveredCell)}
    </div>
  {/if}
</div>

<style lang="postcss">
  .heatmap-container {
    @apply w-full p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800;
  }

  .heatmap-wrapper {
    @apply pb-2;
  }

  .heatmap-content {
    @apply min-w-full;
  }

  .month-labels {
    @apply relative;
  }

  .cell {
    @apply outline-none;
  }

  .cell:focus-visible {
    @apply ring-2 ring-blue-500;
  }

  .legend-cell {
    @apply border border-gray-300 dark:border-gray-700;
  }
</style>
