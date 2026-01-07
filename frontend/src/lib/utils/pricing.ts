/**
 * @file 定价计算工具
 * @description Claude API 定价规则和费用计算函数（2025年1月定价）
 * @author Atlas.oi
 * @date 2026-01-07
 */

/**
 * Claude API 模型定价配置（单位：USD / 1M tokens）
 * 数据来源：Anthropic 官方定价，2025年1月
 */
export const MODEL_PRICING = {
  // Opus 4.5 系列
  'claude-opus-4-5-20251101': {
    input: 15.0,
    output: 75.0,
    cache_write: 18.75,
    cache_read: 1.5,
  },
  'claude-opus-4.5': {
    input: 15.0,
    output: 75.0,
    cache_write: 18.75,
    cache_read: 1.5,
  },
  'claude-opus-4-5-thinking': {
    input: 15.0,
    output: 75.0,
    cache_write: 18.75,
    cache_read: 1.5,
  },

  // Sonnet 4.5 系列
  'claude-sonnet-4-5-20250929': {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.3,
  },
  'claude-sonnet-4.5': {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.3,
  },
  'claude-sonnet-4-5': {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.3,
  },

  // Haiku 4.5 系列
  'claude-haiku-4-5-20251001': {
    input: 0.8,
    output: 4.0,
    cache_write: 1.0,
    cache_read: 0.08,
  },
  'claude-haiku-4.5': {
    input: 0.8,
    output: 4.0,
    cache_write: 1.0,
    cache_read: 0.08,
  },
};

/**
 * 默认定价（用于未知模型）
 */
const DEFAULT_PRICING = {
  input: 3.0,
  output: 15.0,
  cache_write: 3.75,
  cache_read: 0.3,
};

/**
 * 计算单个模型的使用费用
 *
 * @param modelName - 模型名称
 * @param inputTokens - 输入 token 数量
 * @param outputTokens - 输出 token 数量
 * @param cacheReadTokens - 缓存读取 token 数量
 * @param cacheCreationTokens - 缓存创建 token 数量
 * @returns 总费用（USD）
 */
export function calculateModelCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheCreationTokens: number
): number {
  // 获取模型定价，如果模型未知则使用默认定价
  const pricing = MODEL_PRICING[modelName as keyof typeof MODEL_PRICING] || DEFAULT_PRICING;

  // 计算各部分费用（tokens / 1,000,000 * 单价）
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.cache_read;
  const cacheWriteCost = (cacheCreationTokens / 1_000_000) * pricing.cache_write;

  // 返回总费用
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

/**
 * 格式化费用显示
 *
 * @param cost - 费用（USD）
 * @param decimals - 小数位数，默认 4 位
 * @returns 格式化后的费用字符串
 */
export function formatCost(cost: number, decimals: number = 4): string {
  return cost.toFixed(decimals);
}

/**
 * 检查模型是否有定价信息
 *
 * @param modelName - 模型名称
 * @returns 是否有定价信息
 */
export function hasModelPricing(modelName: string): boolean {
  return modelName in MODEL_PRICING;
}
