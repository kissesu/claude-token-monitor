use claude_token_monitor_lib::db::Repository;
use claude_token_monitor_lib::models::{MessageRecord, MessageUsage};
use chrono::Utc;

#[test]
fn test_repository_end_to_end_flow() {
    let repo = Repository::new_in_memory().expect("repo");
    let provider = repo
        .upsert_provider("sk-integration", None)
        .expect("provider");

    let record = MessageRecord::new(
        "session-int".to_string(),
        "message-int".to_string(),
        "claude-3-opus".to_string(),
        Utc::now().to_rfc3339(),
        MessageUsage {
            input_tokens: 20,
            output_tokens: 10,
            cache_read_tokens: 0,
            cache_creation_tokens: 0,
            cost_usd: 0.2,
        },
    );

    repo.insert_message_usage(provider.id, &record)
        .expect("insert");

    let stats = repo.get_current_stats().expect("stats");
    assert_eq!(stats.total_messages, 1);
}
