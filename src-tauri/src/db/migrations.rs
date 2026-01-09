/**
 * @file migrations.rs
 * @description 数据库迁移管理
 * @author Atlas.oi
 * @date 2026-01-08
 */
use chrono::Utc;
use rusqlite::{params, Connection};

use crate::db::schema::{
    CREATE_DAILY_STATS_TABLE, CREATE_INDEXES, CREATE_MESSAGE_USAGE_TABLE, CREATE_PROVIDERS_TABLE,
    CREATE_PROVIDER_SWITCH_LOGS_TABLE, CREATE_SCHEMA_MIGRATIONS_TABLE,
};

#[derive(Debug, Clone)]
pub struct Migration {
    pub version: i64,
    pub description: &'static str,
    pub sql: &'static str,
}

pub fn all_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "init core tables",
        sql: r#"
                -- 核心表
                "#,
    }]
}

pub fn apply_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(CREATE_SCHEMA_MIGRATIONS_TABLE)?;

    let mut stmt = conn.prepare("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")?;
    let current_version: i64 = stmt.query_row([], |row| row.get(0))?;

    for migration in all_migrations() {
        if migration.version <= current_version {
            continue;
        }

        conn.execute_batch(migration.sql)?;
        conn.execute_batch(CREATE_PROVIDERS_TABLE)?;
        conn.execute_batch(CREATE_MESSAGE_USAGE_TABLE)?;
        conn.execute_batch(CREATE_DAILY_STATS_TABLE)?;
        conn.execute_batch(CREATE_PROVIDER_SWITCH_LOGS_TABLE)?;

        for index_sql in CREATE_INDEXES {
            conn.execute_batch(index_sql)?;
        }

        conn.execute(
            "INSERT INTO schema_migrations (version, description, applied_at) VALUES (?1, ?2, ?3)",
            params![
                migration.version,
                migration.description,
                Utc::now().to_rfc3339()
            ],
        )?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_apply_migrations() {
        let conn = Connection::open_in_memory().expect("in-memory db");
        apply_migrations(&conn).expect("migrations should succeed");

        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM schema_migrations")
            .expect("prepare");
        let count: i64 = stmt.query_row([], |row| row.get(0)).expect("count");

        assert_eq!(count, 1);
    }
}
