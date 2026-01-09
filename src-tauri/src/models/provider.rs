use chrono::Utc;
/**
 * @file provider.rs
 * @description 供应商相关数据模型，包含供应商信息和统计数据
 * @author Atlas.oi
 * @date 2026-01-08
 */
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// 供应商信息
///
/// 存储 Claude API 供应商的基本信息，用于多 API Key 管理和统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provider {
    /// 数据库主键 ID
    pub id: i64,

    /// API Key 的 SHA256 哈希值，用于唯一标识
    pub api_key_hash: String,

    /// API Key 前 8 个字符，便于用户识别（如 "sk-ant-a"）
    pub api_key_prefix: String,

    /// 用户自定义的显示名称，方便区分不同的 API Key
    pub display_name: Option<String>,

    /// API 基础 URL，支持自定义代理或镜像地址
    pub base_url: Option<String>,

    /// 是否处于活跃状态，用于停用不再使用的 API Key
    pub is_active: bool,

    /// 首次检测到该 API Key 的时间（ISO 8601 格式）
    pub first_seen_at: String,

    /// 最后一次使用该 API Key 的时间（ISO 8601 格式）
    pub last_seen_at: String,
}

impl Provider {
    /// 创建新的供应商记录
    ///
    /// # 参数
    /// * `api_key` - Claude API Key 原始值
    /// * `display_name` - 可选的自定义显示名称
    /// * `base_url` - 可选的自定义 API 基础 URL
    ///
    /// # 返回
    /// 返回初始化的 Provider 实例（id 为 0，需要在插入数据库后更新）
    ///
    /// # 示例
    /// ```rust
    /// use claude_token_monitor_lib::models::Provider;
    ///
    /// let provider = Provider::new("sk-ant-api-key-123", Some("主账号".to_string()), None);
    /// ```
    pub fn new(api_key: &str, display_name: Option<String>, base_url: Option<String>) -> Self {
        let now = Utc::now().to_rfc3339();

        // 计算 API Key 的 SHA256 哈希值
        let mut hasher = Sha256::new();
        hasher.update(api_key.as_bytes());
        let api_key_hash = format!("{:x}", hasher.finalize());

        // 提取前 8 个字符作为前缀
        let api_key_prefix = api_key.chars().take(8).collect::<String>();

        Self {
            id: 0, // 数据库插入后会更新
            api_key_hash,
            api_key_prefix,
            display_name,
            base_url,
            is_active: true,
            first_seen_at: now.clone(),
            last_seen_at: now,
        }
    }

    /// 更新最后使用时间
    ///
    /// 业务逻辑说明：
    /// 1. 获取当前 UTC 时间
    /// 2. 转换为 ISO 8601 格式
    /// 3. 更新 last_seen_at 字段
    pub fn update_last_seen(&mut self) {
        self.last_seen_at = Utc::now().to_rfc3339();
    }
}

/// 供应商统计信息
///
/// 聚合单个供应商的使用统计数据，用于多账号管理和成本分析
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStats {
    /// 供应商基本信息
    pub provider: Provider,

    /// 今日输入 Token 数量（Prompt）
    pub today_input_tokens: i64,

    /// 今日输出 Token 数量（Completion）
    pub today_output_tokens: i64,

    /// 今日缓存读取 Token 数量（Cache Read）
    pub today_cache_read_tokens: i64,

    /// 今日缓存创建 Token 数量（Cache Creation）
    pub today_cache_creation_tokens: i64,

    /// 今日费用（美元）
    pub today_cost_usd: f64,

    /// 缓存命中率（0.0 - 1.0，表示百分比）
    /// 计算公式：cache_read_tokens / (cache_read_tokens + input_tokens)
    pub cache_hit_rate: f64,
}

impl ProviderStats {
    /// 创建默认的供应商统计
    ///
    /// # 参数
    /// * `provider` - 供应商信息
    ///
    /// # 返回
    /// 返回初始化的 ProviderStats 实例（所有统计数据为 0）
    pub fn new(provider: Provider) -> Self {
        Self {
            provider,
            today_input_tokens: 0,
            today_output_tokens: 0,
            today_cache_read_tokens: 0,
            today_cache_creation_tokens: 0,
            today_cost_usd: 0.0,
            cache_hit_rate: 0.0,
        }
    }

    /// 计算并更新缓存命中率
    ///
    /// 业务逻辑说明：
    /// 1. 检查是否有缓存读取或输入 Token
    /// 2. 计算命中率：缓存读取 / (缓存读取 + 输入)
    /// 3. 更新 cache_hit_rate 字段
    pub fn update_cache_hit_rate(&mut self) {
        let total_tokens = self.today_cache_read_tokens + self.today_input_tokens;
        if total_tokens > 0 {
            self.cache_hit_rate = self.today_cache_read_tokens as f64 / total_tokens as f64;
        } else {
            self.cache_hit_rate = 0.0;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_new() {
        let provider = Provider::new("sk-ant-api-test-key", Some("测试账号".to_string()), None);

        assert_eq!(provider.api_key_prefix, "sk-ant-a");
        assert_eq!(provider.display_name, Some("测试账号".to_string()));
        assert!(provider.is_active);
    }

    #[test]
    fn test_cache_hit_rate_calculation() {
        let provider = Provider::new("sk-ant-test", None, None);
        let mut stats = ProviderStats::new(provider);

        stats.today_cache_read_tokens = 300;
        stats.today_input_tokens = 700;
        stats.update_cache_hit_rate();

        assert_eq!(stats.cache_hit_rate, 0.3);
    }
}
