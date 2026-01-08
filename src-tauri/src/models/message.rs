/**
 * @file message.rs
 * @description 消息与 Token 使用记录数据模型
 * @author Atlas.oi
 * @date 2026-01-08
 */

use serde::{Deserialize, Serialize};

/// 单条消息的 Token 使用记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageUsage {
    /// 输入 Token
    pub input_tokens: i64,

    /// 输出 Token
    pub output_tokens: i64,

    /// 缓存读取 Token
    pub cache_read_tokens: i64,

    /// 缓存创建 Token
    pub cache_creation_tokens: i64,

    /// 费用（美元）
    pub cost_usd: f64,
}

impl Default for MessageUsage {
    fn default() -> Self {
        Self {
            input_tokens: 0,
            output_tokens: 0,
            cache_read_tokens: 0,
            cache_creation_tokens: 0,
            cost_usd: 0.0,
        }
    }
}

/// 单条消息记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageRecord {
    /// 会话 ID
    pub session_id: String,

    /// 消息 ID
    pub message_id: String,

    /// 使用模型名称
    pub model: String,

    /// 创建时间（ISO 8601）
    pub created_at: String,

    /// Token 使用统计
    pub usage: MessageUsage,
}

impl MessageRecord {
    /// 创建新的消息记录
    pub fn new(
        session_id: String,
        message_id: String,
        model: String,
        created_at: String,
        usage: MessageUsage,
    ) -> Self {
        Self {
            session_id,
            message_id,
            model,
            created_at,
            usage,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_usage_default() {
        let usage = MessageUsage::default();

        assert_eq!(usage.input_tokens, 0);
        assert_eq!(usage.output_tokens, 0);
        assert_eq!(usage.cost_usd, 0.0);
    }
}
