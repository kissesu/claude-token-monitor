/**
 * @file parser.rs
 * @description Claude CLI 配置与 JSONL 消息解析服务
 * @author Atlas.oi
 * @date 2026-01-08
 */
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;

use crate::models::{MessageRecord, MessageUsage};

#[derive(Error, Debug)]
pub enum ParserError {
    #[error("Invalid JSON: {0}")]
    InvalidJson(#[from] serde_json::Error),
    #[error("Missing API key in settings.json")]
    MissingApiKey,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub api_key: String,
    pub base_url: Option<String>,
}

/// 解析 settings.json 内容
pub fn parse_settings(content: &str) -> Result<Settings, ParserError> {
    let value: Value = serde_json::from_str(content)?;

    let env_value = value.get("env").cloned().unwrap_or(Value::Null);

    let api_key = value
        .get("ANTHROPIC_AUTH_TOKEN")
        .and_then(|v| v.as_str())
        .or_else(|| value.get("anthropic_auth_token").and_then(|v| v.as_str()))
        .or_else(|| {
            env_value
                .get("ANTHROPIC_AUTH_TOKEN")
                .and_then(|v| v.as_str())
        })
        .or_else(|| {
            env_value
                .get("anthropic_auth_token")
                .and_then(|v| v.as_str())
        })
        .ok_or(ParserError::MissingApiKey)?
        .to_string();

    let base_url = value
        .get("ANTHROPIC_BASE_URL")
        .and_then(|v| v.as_str())
        .or_else(|| value.get("anthropic_base_url").and_then(|v| v.as_str()))
        .or_else(|| env_value.get("ANTHROPIC_BASE_URL").and_then(|v| v.as_str()))
        .or_else(|| env_value.get("anthropic_base_url").and_then(|v| v.as_str()))
        .map(|v| v.to_string());

    Ok(Settings { api_key, base_url })
}

/// 解析单行 JSONL 消息记录
pub fn parse_jsonl_line(line: &str) -> Result<Option<MessageRecord>, ParserError> {
    let value: Value = serde_json::from_str(line)?;

    let model = extract_string(&value, &["model", "message.model"]);
    let message_id = extract_string(&value, &["id", "message.id"]);

    if model.is_none() || message_id.is_none() {
        return Ok(None);
    }

    let session_id = extract_string(
        &value,
        &["session_id", "sessionId", "conversation_id", "chat_id"],
    )
    .unwrap_or_else(|| "unknown".to_string());

    let created_at = extract_string(&value, &["created_at", "timestamp", "message.created_at"])
        .unwrap_or_else(|| Utc::now().to_rfc3339());

    let usage_value = value
        .get("usage")
        .cloned()
        .or_else(|| {
            value
                .get("message")
                .and_then(|msg| msg.get("usage"))
                .cloned()
        })
        .unwrap_or(Value::Null);
    let usage = MessageUsage {
        input_tokens: extract_i64(&usage_value, &["input_tokens", "prompt_tokens"]),
        output_tokens: extract_i64(&usage_value, &["output_tokens", "completion_tokens"]),
        cache_read_tokens: extract_i64(
            &usage_value,
            &["cache_read_tokens", "cache_read_input_tokens"],
        ),
        cache_creation_tokens: extract_i64(
            &usage_value,
            &["cache_creation_tokens", "cache_creation_input_tokens"],
        ),
        cost_usd: extract_f64(&usage_value, &["cost_usd", "total_cost_usd"]),
    };

    Ok(Some(MessageRecord::new(
        session_id,
        message_id.unwrap_or_else(|| "unknown".to_string()),
        model.unwrap_or_else(|| "unknown".to_string()),
        created_at,
        usage,
    )))
}

fn extract_string(value: &Value, paths: &[&str]) -> Option<String> {
    for path in paths {
        if let Some(v) = get_by_path(value, path) {
            if let Some(s) = v.as_str() {
                return Some(s.to_string());
            }
        }
    }
    None
}

fn extract_i64(value: &Value, paths: &[&str]) -> i64 {
    for path in paths {
        if let Some(v) = get_by_path(value, path) {
            if let Some(n) = v.as_i64() {
                return n;
            }
            if let Some(n) = v.as_u64() {
                return n as i64;
            }
        }
    }
    0
}

fn extract_f64(value: &Value, paths: &[&str]) -> f64 {
    for path in paths {
        if let Some(v) = get_by_path(value, path) {
            if let Some(n) = v.as_f64() {
                return n;
            }
            if let Some(n) = v.as_i64() {
                return n as f64;
            }
        }
    }
    0.0
}

fn get_by_path<'a>(value: &'a Value, path: &str) -> Option<&'a Value> {
    let mut current = value;
    for part in path.split('.') {
        current = current.get(part)?;
    }
    Some(current)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_settings() {
        let content = r#"{"ANTHROPIC_AUTH_TOKEN":"sk-test","ANTHROPIC_BASE_URL":"https://api"}"#;
        let settings = parse_settings(content).expect("parse settings");

        assert_eq!(settings.api_key, "sk-test");
        assert_eq!(settings.base_url, Some("https://api".to_string()));
    }

    #[test]
    fn test_parse_jsonl_line() {
        let line = r#"{"id":"msg_1","session_id":"sess_1","model":"claude-3","created_at":"2026-01-08T00:00:00Z","usage":{"input_tokens":10,"output_tokens":5,"cost_usd":0.01}}"#;
        let record = parse_jsonl_line(line).expect("parse line").expect("record");

        assert_eq!(record.session_id, "sess_1");
        assert_eq!(record.message_id, "msg_1");
        assert_eq!(record.model, "claude-3");
        assert_eq!(record.usage.input_tokens, 10);
    }
}
