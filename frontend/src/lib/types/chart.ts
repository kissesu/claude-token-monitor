/**
 * @file 图表相关类型定义
 * @description 定义用于 Layerchart 图表的数据结构和配置类型
 * @author Atlas.oi
 * @date 2026-01-07
 */

/**
 * 图表数据点
 * 用于时间序列图表的基础数据结构
 */
export interface ChartDataPoint {
  /** X 轴值（通常是日期） */
  x: string | number | Date;

  /** Y 轴值 */
  y: number;

  /** 数据点标签（可选） */
  label?: string;

  /** 额外数据（可选） */
  metadata?: Record<string, unknown>;
}

/**
 * 多系列图表数据
 * 用于展示多条曲线的图表
 */
export interface MultiSeriesChartData {
  /** 系列名称 */
  name: string;

  /** 数据点数组 */
  data: ChartDataPoint[];

  /** 系列颜色（可选） */
  color?: string;

  /** 是否可见（可选） */
  visible?: boolean;
}

/**
 * Token 使用趋势图表数据
 * 用于展示 Token 使用量随时间变化
 */
export interface TokenTrendData {
  /** 日期 */
  date: string;

  /** 输入 Token */
  input_tokens: number;

  /** 输出 Token */
  output_tokens: number;

  /** 缓存读取 Token */
  cache_read_tokens: number;

  /** 缓存创建 Token */
  cache_creation_tokens: number;

  /** 总计 */
  total_tokens: number;
}

/**
 * 费用趋势图表数据
 * 用于展示费用随时间变化
 */
export interface CostTrendData {
  /** 日期 */
  date: string;

  /** 费用（美元） */
  cost: number;

  /** 累计费用（可选） */
  cumulative_cost?: number;
}

/**
 * 模型分布图表数据
 * 用于饼图或柱状图展示模型使用分布
 */
export interface ModelDistributionData {
  /** 模型名称 */
  model: string;

  /** Token 数量 */
  tokens: number;

  /** 费用 */
  cost: number;

  /** 占比（百分比） */
  percentage: number;

  /** 颜色（用于饼图） */
  color?: string;
}

/**
 * 图表配置选项
 * 通用图表配置
 */
export interface ChartOptions {
  /** 图表标题 */
  title?: string;

  /** X 轴标签 */
  xAxisLabel?: string;

  /** Y 轴标签 */
  yAxisLabel?: string;

  /** 是否显示图例 */
  showLegend?: boolean;

  /** 是否显示网格线 */
  showGrid?: boolean;

  /** 是否显示工具提示 */
  showTooltip?: boolean;

  /** 图表高度（像素） */
  height?: number;

  /** 图表宽度（像素） */
  width?: number;

  /** 响应式 */
  responsive?: boolean;

  /** 动画持续时间（毫秒） */
  animationDuration?: number;
}

/**
 * 时间序列图表配置
 * 继承通用配置，添加时间相关选项
 */
export interface TimeSeriesChartOptions extends ChartOptions {
  /** 时间格式化函数 */
  timeFormat?: string;

  /** 时间粒度 */
  timeGranularity?: 'hour' | 'day' | 'week' | 'month';

  /** 是否显示数据点 */
  showDataPoints?: boolean;

  /** 曲线类型 */
  curveType?: 'linear' | 'smooth' | 'step';
}

/**
 * 饼图配置
 * 用于模型分布等场景
 */
export interface PieChartOptions extends ChartOptions {
  /** 是否显示百分比 */
  showPercentage?: boolean;

  /** 是否显示标签 */
  showLabels?: boolean;

  /** 内半径（用于环形图） */
  innerRadius?: number;

  /** 外半径 */
  outerRadius?: number;
}

/**
 * 图表主题
 * 支持浅色和暗色主题
 */
export interface ChartTheme {
  /** 背景色 */
  backgroundColor: string;

  /** 文字颜色 */
  textColor: string;

  /** 网格线颜色 */
  gridColor: string;

  /** 工具提示背景色 */
  tooltipBackground: string;

  /** 工具提示文字颜色 */
  tooltipTextColor: string;

  /** 主题色板 */
  colors: string[];
}
