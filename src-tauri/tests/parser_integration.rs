use claude_token_monitor_lib::services::parser::{parse_jsonl_line, parse_settings};

#[test]
fn test_parse_settings_and_jsonl() {
    let settings_content = r#"{"ANTHROPIC_AUTH_TOKEN":"sk-integration"}"#;
    let settings = parse_settings(settings_content).expect("settings");
    assert_eq!(settings.api_key, "sk-integration");

    let line = r#"{"id":"msg_int","session_id":"sess_int","model":"claude-3","usage":{"input_tokens":1,"output_tokens":2}}"#;
    let record = parse_jsonl_line(line).expect("line").expect("record");
    assert_eq!(record.model, "claude-3");
}
