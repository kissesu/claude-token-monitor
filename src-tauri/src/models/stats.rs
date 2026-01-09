//! @file stats.rs
//! @description 统计相关数据模型，包含模型使用、缓存统计、每日活动等
//! @author Atlas.oi
//! @date 2026-01-08
use chrono::Utc;
use serde::{Deserialize, Serialize};

/// 模型使用统计
///
/// 单个模型（如 claude-3-opus）的累计使用数据和费用统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsage {
    /// 模型名称（如 "claude-3-5-sonnet-20241022"）
    pub model: String,

    /// 输入 Token 总数（Prompt）
    pub input_tokens: i64,

    /// 输出 Token 总数（Completion）
    pub output_tokens: i64,

    /// 缓存读取 Token 总数（Cache Read）
    pub cache_read_tokens: i64,

    /// 缓存创建 Token 总数（Cache Creation）
    pub cache_creation_tokens: i64,

    /// 累计费用（美元）
    pub cost_usd: f64,

    /// 消息调用次数
    pub message_count: i64,
}

impl ModelUsage {
    /// 创建新的模型使用统计
    ///
    /// # 参数
    /// * `model` - 模型名称
    ///
    /// # 返回
    /// 返回初始化的 ModelUsage 实例（所有统计数据为 0）
    pub fn new(model: String) -> Self {
        Self {
            model,
            input_tokens: 0,
            output_tokens: 0,
            cache_read_tokens: 0,
            cache_creation_tokens: 0,
            cost_usd: 0.0,
            message_count: 0,
        }
    }

    /// 计算缓存命中率
    ///
    /// 业务逻辑说明：
    /// 1. 计算总 Token 数（缓存读取 + 输入）
    /// 2. 如果总数为 0，返回 0.0
    /// 3. 否则返回缓存读取占比
    ///
    /// # 返回
    /// 缓存命中率（0.0 - 1.0）
    pub fn cache_hit_rate(&self) -> f64 {
        let total_tokens = self.cache_read_tokens + self.input_tokens;
        if total_tokens > 0 {
            self.cache_read_tokens as f64 / total_tokens as f64
        } else {
            0.0
        }
    }
}

/// 当前统计缓存
///
/// 与前端交互的主要数据结构，包含所有聚合统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsCache {
    /// 总输入 Token 数
    pub total_input_tokens: i64,

    /// 总输出 Token 数
    pub total_output_tokens: i64,

    /// 总缓存读取 Token 数
    pub total_cache_read_tokens: i64,

    /// 总缓存创建 Token 数
    pub total_cache_creation_tokens: i64,

    /// 总费用（美元）
    pub total_cost_usd: f64,

    /// 总会话数
    pub total_sessions: i64,

    /// 总消息数
    pub total_messages: i64,

    /// 全局缓存命中率（0.0 - 1.0）
    /// 计算公式：total_cache_read_tokens / (total_cache_read_tokens + total_input_tokens)
    pub cache_hit_rate: f64,

    /// 按模型分组的使用统计
    pub models: Vec<ModelUsage>,

    /// 最后更新时间（ISO 8601 格式）
    pub updated_at: String,
}

/// 今日统计汇总
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodayStats {
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cache_read_tokens: i64,
    pub cache_creation_tokens: i64,
    pub cost_usd: f64,
    pub session_count: i64,
    pub message_count: i64,
    pub cache_hit_rate: f64,
}

impl TodayStats {
    pub fn update_cache_hit_rate(&mut self) {
        let total_tokens = self.cache_read_tokens + self.input_tokens;
        if total_tokens > 0 {
            self.cache_hit_rate = self.cache_read_tokens as f64 / total_tokens as f64;
        } else {
            self.cache_hit_rate = 0.0;
        }
    }
}

impl Default for StatsCache {
    /// 创建默认的统计缓存
    ///
    /// 业务逻辑说明：
    /// 1. 初始化所有数值为 0
    /// 2. 初始化空的模型列表
    /// 3. 设置当前时间为更新时间
    ///
    /// # 返回
    /// 返回默认的 StatsCache 实例
    fn default() -> Self {
        Self {
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_cache_read_tokens: 0,
            total_cache_creation_tokens: 0,
            total_cost_usd: 0.0,
            total_sessions: 0,
            total_messages: 0,
            cache_hit_rate: 0.0,
            models: Vec::new(),
            updated_at: Utc::now().to_rfc3339(),
        }
    }
}

impl StatsCache {
    /// 更新全局缓存命中率
    ///
    /// 业务逻辑说明：
    /// 1. 计算总 Token 数（缓存读取 + 输入）
    /// 2. 如果总数为 0，设置命中率为 0
    /// 3. 否则计算缓存读取占比
    /// 4. 更新 updated_at 时间戳
    pub fn update_cache_hit_rate(&mut self) {
        let total_tokens = self.total_cache_read_tokens + self.total_input_tokens;
        if total_tokens > 0 {
            self.cache_hit_rate = self.total_cache_read_tokens as f64 / total_tokens as f64;
        } else {
            self.cache_hit_rate = 0.0;
        }
        self.updated_at = Utc::now().to_rfc3339();
    }

    /// 添加或更新模型使用统计
    ///
    /// 业务逻辑说明：
    /// 1. 查找是否已存在该模型的统计
    /// 2. 如果存在，更新现有记录
    /// 3. 如果不存在，添加新记录
    ///
    /// # 参数
    /// * `model_usage` - 模型使用统计数据
    pub fn add_or_update_model(&mut self, model_usage: ModelUsage) {
        if let Some(existing) = self
            .models
            .iter_mut()
            .find(|m| m.model == model_usage.model)
        {
            existing.input_tokens += model_usage.input_tokens;
            existing.output_tokens += model_usage.output_tokens;
            existing.cache_read_tokens += model_usage.cache_read_tokens;
            existing.cache_creation_tokens += model_usage.cache_creation_tokens;
            existing.cost_usd += model_usage.cost_usd;
            existing.message_count += model_usage.message_count;
        } else {
            self.models.push(model_usage);
        }
    }

    /// 按费用降序排序模型列表
    ///
    /// 业务逻辑说明：
    /// 1. 对 models 列表按 cost_usd 字段降序排序
    /// 2. 方便前端展示时优先显示费用最高的模型
    pub fn sort_models_by_cost(&mut self) {
        self.models
            .sort_by(|a, b| b.cost_usd.total_cmp(&a.cost_usd));
    }
}

/// 每日活动记录
///
/// 按天聚合的使用统计，用于生成趋势图和活动热力图
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyActivity {
    /// 日期（YYYY-MM-DD 格式）
    pub date: String,

    /// 当天输入 Token 总数
    pub input_tokens: i64,

    /// 当天输出 Token 总数
    pub output_tokens: i64,

    /// 当天费用（美元）
    pub cost_usd: f64,

    /// 当天会话数
    pub session_count: i64,

    /// 当天消息数
    pub message_count: i64,
}

impl DailyActivity {
    /// 创建新的每日活动记录
    ///
    /// # 参数
    /// * `date` - 日期字符串（YYYY-MM-DD 格式）
    ///
    /// # 返回
    /// 返回初始化的 DailyActivity 实例（所有统计数据为 0）
    pub fn new(date: String) -> Self {
        Self {
            date,
            input_tokens: 0,
            output_tokens: 0,
            cost_usd: 0.0,
            session_count: 0,
            message_count: 0,
        }
    }

    /// 计算总 Token 数
    ///
    /// # 返回
    /// 输入 + 输出 Token 总数
    pub fn total_tokens(&self) -> i64 {
        self.input_tokens + self.output_tokens
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_usage_cache_hit_rate() {
        let mut usage = ModelUsage::new("claude-3-opus".to_string());
        usage.cache_read_tokens = 400;
        usage.input_tokens = 600;

        assert_eq!(usage.cache_hit_rate(), 0.4);
    }

    #[test]
    fn test_stats_cache_default() {
        let cache = StatsCache::default();

        assert_eq!(cache.total_input_tokens, 0);
        assert_eq!(cache.total_cost_usd, 0.0);
        assert!(cache.models.is_empty());
    }

    #[test]
    fn test_add_or_update_model() {
        let mut cache = StatsCache::default();

        let usage1 = ModelUsage {
            model: "claude-3-opus".to_string(),
            input_tokens: 100,
            output_tokens: 50,
            cache_read_tokens: 0,
            cache_creation_tokens: 0,
            cost_usd: 0.5,
            message_count: 1,
        };

        cache.add_or_update_model(usage1);
        assert_eq!(cache.models.len(), 1);

        let usage2 = ModelUsage {
            model: "claude-3-opus".to_string(),
            input_tokens: 200,
            output_tokens: 100,
            cache_read_tokens: 0,
            cache_creation_tokens: 0,
            cost_usd: 1.0,
            message_count: 1,
        };

        cache.add_or_update_model(usage2);
        assert_eq!(cache.models.len(), 1);
        assert_eq!(cache.models[0].input_tokens, 300);
        assert_eq!(cache.models[0].cost_usd, 1.5);
    }

    #[test]
    fn test_daily_activity_total_tokens() {
        let activity = DailyActivity {
            date: "2026-01-08".to_string(),
            input_tokens: 1000,
            output_tokens: 500,
            cost_usd: 2.5,
            session_count: 5,
            message_count: 20,
        };

        assert_eq!(activity.total_tokens(), 1500);
    }
}
