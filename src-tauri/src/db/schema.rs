/// @file schema.rs
/// @description 数据库表结构定义
/// @author Atlas.oi
/// @date 2026-01-08
pub const CREATE_SCHEMA_MIGRATIONS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TEXT NOT NULL
);
"#;

pub const CREATE_PROVIDERS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_hash TEXT NOT NULL UNIQUE,
    api_key_prefix TEXT NOT NULL,
    display_name TEXT,
    base_url TEXT,
    is_active INTEGER DEFAULT 0,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
);
"#;

pub const CREATE_MESSAGE_USAGE_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS message_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
"#;

pub const CREATE_DAILY_STATS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cache_read_tokens INTEGER DEFAULT 0,
    total_cache_creation_tokens INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    UNIQUE(provider_id, date),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
"#;

pub const CREATE_PROVIDER_SWITCH_LOGS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS provider_switch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    switched_at TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
"#;

pub const CREATE_INDEXES: &[&str] = &[
    "CREATE INDEX IF NOT EXISTS idx_message_usage_provider ON message_usage(provider_id);",
    "CREATE INDEX IF NOT EXISTS idx_message_usage_created ON message_usage(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);",
    "CREATE INDEX IF NOT EXISTS idx_daily_stats_provider ON daily_stats(provider_id);",
];
