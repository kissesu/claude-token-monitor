/**
 * @file repository.rs
 * @description 数据仓库层，封装 SQLite 操作
 * @author Atlas.oi
 * @date 2026-01-08
 */

use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard};

use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use thiserror::Error;

use crate::db::migrations::apply_migrations;
use crate::models::{DailyActivity, ModelUsage, Provider, ProviderStats, StatsCache};

#[derive(Error, Debug)]
pub enum RepositoryError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Database lock poisoned")]
    LockPoisoned,
}

pub struct Repository {
    conn: Mutex<Connection>,
    _path: PathBuf,
}

impl Repository {
    pub fn new(db_path: &Path) -> Result<Self, RepositoryError> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)?;
        apply_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
            _path: db_path.to_path_buf(),
        })
    }

    pub fn new_in_memory() -> Result<Self, RepositoryError> {
        let conn = Connection::open_in_memory()?;
        apply_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
            _path: PathBuf::from(":memory:"),
        })
    }

    fn connection(&self) -> Result<MutexGuard<'_, Connection>, RepositoryError> {
        self.conn.lock().map_err(|_| RepositoryError::LockPoisoned)
    }

    pub fn upsert_provider(
        &self,
        api_key: &str,
        base_url: Option<String>,
    ) -> Result<Provider, RepositoryError> {
        let now = Utc::now().to_rfc3339();
        let conn = self.connection()?;

        let mut provider = self.get_provider_by_hash(&conn, api_key)?;

        conn.execute("UPDATE providers SET is_active = 0", [])?;

        if let Some(existing) = provider.as_mut() {
            conn.execute(
                "UPDATE providers SET last_seen_at = ?1, base_url = COALESCE(?2, base_url), is_active = 1 WHERE id = ?3",
                params![now, base_url.clone(), existing.id],
            )?;

            existing.last_seen_at = now;
            existing.is_active = true;
            if let Some(url) = base_url {
                existing.base_url = Some(url);
            }

            return Ok(existing.clone());
        }

        let mut new_provider = Provider::new(api_key, None, base_url.clone());
        new_provider.first_seen_at = now.clone();
        new_provider.last_seen_at = now;

        conn.execute(
            "INSERT INTO providers (api_key_hash, api_key_prefix, display_name, base_url, is_active, first_seen_at, last_seen_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                new_provider.api_key_hash,
                new_provider.api_key_prefix,
                new_provider.display_name,
                new_provider.base_url,
                1,
                new_provider.first_seen_at,
                new_provider.last_seen_at
            ],
        )?;

        new_provider.id = conn.last_insert_rowid();
        Ok(new_provider)
    }

    pub fn get_all_providers(&self, active_only: bool) -> Result<Vec<Provider>, RepositoryError> {
        let conn = self.connection()?;
        let mut providers = Vec::new();

        let mut stmt = if active_only {
            conn.prepare(
                "SELECT id, api_key_hash, api_key_prefix, display_name, base_url, is_active, first_seen_at, last_seen_at
                 FROM providers WHERE is_active = 1 ORDER BY last_seen_at DESC",
            )?
        } else {
            conn.prepare(
                "SELECT id, api_key_hash, api_key_prefix, display_name, base_url, is_active, first_seen_at, last_seen_at
                 FROM providers ORDER BY last_seen_at DESC",
            )?
        };

        let rows = stmt.query_map([], |row| {
            Ok(Provider {
                id: row.get(0)?,
                api_key_hash: row.get(1)?,
                api_key_prefix: row.get(2)?,
                display_name: row.get(3)?,
                base_url: row.get(4)?,
                is_active: row.get::<_, i64>(5)? == 1,
                first_seen_at: row.get(6)?,
                last_seen_at: row.get(7)?,
            })
        })?;

        for row in rows {
            providers.push(row?);
        }

        Ok(providers)
    }

    pub fn update_provider_display_name(
        &self,
        provider_id: i64,
        display_name: &str,
    ) -> Result<(), RepositoryError> {
        let conn = self.connection()?;
        conn.execute(
            "UPDATE providers SET display_name = ?1 WHERE id = ?2",
            params![display_name, provider_id],
        )?;
        Ok(())
    }

    pub fn insert_message_usage(
        &self,
        provider_id: i64,
        record: &crate::models::MessageRecord,
    ) -> Result<(), RepositoryError> {
        let conn = self.connection()?;

        conn.execute(
            "INSERT INTO message_usage (provider_id, session_id, message_id, model, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                provider_id,
                record.session_id,
                record.message_id,
                record.model,
                record.usage.input_tokens,
                record.usage.output_tokens,
                record.usage.cache_read_tokens,
                record.usage.cache_creation_tokens,
                record.usage.cost_usd,
                record.created_at
            ],
        )?;

        let date = extract_date(&record.created_at);

        let session_exists: Option<i64> = conn
            .query_row(
                "SELECT 1 FROM message_usage WHERE provider_id = ?1 AND session_id = ?2 AND date(created_at) = ?3 LIMIT 1",
                params![provider_id, record.session_id, date],
                |row| row.get(0),
            )
            .optional()?;

        let session_increment = if session_exists.is_some() { 0 } else { 1 };

        conn.execute(
            "INSERT INTO daily_stats (provider_id, date, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, total_cost_usd, session_count, message_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(provider_id, date) DO UPDATE SET
                total_input_tokens = total_input_tokens + excluded.total_input_tokens,
                total_output_tokens = total_output_tokens + excluded.total_output_tokens,
                total_cache_read_tokens = total_cache_read_tokens + excluded.total_cache_read_tokens,
                total_cache_creation_tokens = total_cache_creation_tokens + excluded.total_cache_creation_tokens,
                total_cost_usd = total_cost_usd + excluded.total_cost_usd,
                session_count = session_count + excluded.session_count,
                message_count = message_count + excluded.message_count",
            params![
                provider_id,
                date,
                record.usage.input_tokens,
                record.usage.output_tokens,
                record.usage.cache_read_tokens,
                record.usage.cache_creation_tokens,
                record.usage.cost_usd,
                session_increment,
                1,
            ],
        )?;

        Ok(())
    }

    pub fn get_current_stats(&self) -> Result<StatsCache, RepositoryError> {
        let conn = self.connection()?;

        let mut cache = StatsCache::default();

        let mut stmt = conn.prepare(
            "SELECT
                COALESCE(SUM(input_tokens), 0),
                COALESCE(SUM(output_tokens), 0),
                COALESCE(SUM(cache_read_tokens), 0),
                COALESCE(SUM(cache_creation_tokens), 0),
                COALESCE(SUM(cost_usd), 0),
                COALESCE(COUNT(DISTINCT session_id), 0),
                COALESCE(COUNT(*), 0)
             FROM message_usage",
        )?;

        let totals: (i64, i64, i64, i64, f64, i64, i64) = stmt.query_row([], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
            ))
        })?;

        cache.total_input_tokens = totals.0;
        cache.total_output_tokens = totals.1;
        cache.total_cache_read_tokens = totals.2;
        cache.total_cache_creation_tokens = totals.3;
        cache.total_cost_usd = totals.4;
        cache.total_sessions = totals.5;
        cache.total_messages = totals.6;

        let mut stmt = conn.prepare(
            "SELECT model, SUM(input_tokens), SUM(output_tokens), SUM(cache_read_tokens), SUM(cache_creation_tokens), SUM(cost_usd), COUNT(*)
             FROM message_usage GROUP BY model",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(ModelUsage {
                model: row.get(0)?,
                input_tokens: row.get(1)?,
                output_tokens: row.get(2)?,
                cache_read_tokens: row.get(3)?,
                cache_creation_tokens: row.get(4)?,
                cost_usd: row.get(5)?,
                message_count: row.get(6)?,
            })
        })?;

        for row in rows {
            cache.models.push(row?);
        }

        cache.update_cache_hit_rate();
        cache.sort_models_by_cost();
        Ok(cache)
    }

    pub fn get_today_provider_stats(&self) -> Result<Vec<ProviderStats>, RepositoryError> {
        let conn = self.connection()?;
        let today = Utc::now().date_naive().to_string();

        let mut stmt = conn.prepare(
            "SELECT
                p.id, p.api_key_hash, p.api_key_prefix, p.display_name, p.base_url, p.is_active, p.first_seen_at, p.last_seen_at,
                COALESCE(d.total_input_tokens, 0),
                COALESCE(d.total_output_tokens, 0),
                COALESCE(d.total_cache_read_tokens, 0),
                COALESCE(d.total_cost_usd, 0)
             FROM providers p
             LEFT JOIN daily_stats d ON p.id = d.provider_id AND d.date = ?1
             ORDER BY p.last_seen_at DESC",
        )?;

        let rows = stmt.query_map(params![today], |row| {
            let provider = Provider {
                id: row.get(0)?,
                api_key_hash: row.get(1)?,
                api_key_prefix: row.get(2)?,
                display_name: row.get(3)?,
                base_url: row.get(4)?,
                is_active: row.get::<_, i64>(5)? == 1,
                first_seen_at: row.get(6)?,
                last_seen_at: row.get(7)?,
            };

            let mut stats = ProviderStats::new(provider);
            stats.today_input_tokens = row.get(8)?;
            stats.today_output_tokens = row.get(9)?;
            stats.today_cache_read_tokens = row.get(10)?;
            stats.today_cost_usd = row.get(11)?;
            stats.update_cache_hit_rate();

            Ok(stats)
        })?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }

        Ok(result)
    }

    pub fn get_daily_activities(
        &self,
        start_date: &str,
        end_date: &str,
    ) -> Result<Vec<DailyActivity>, RepositoryError> {
        let conn = self.connection()?;

        let mut stmt = conn.prepare(
            "SELECT
                date,
                COALESCE(SUM(total_input_tokens), 0),
                COALESCE(SUM(total_output_tokens), 0),
                COALESCE(SUM(total_cost_usd), 0),
                COALESCE(SUM(session_count), 0),
                COALESCE(SUM(message_count), 0)
             FROM daily_stats
             WHERE date BETWEEN ?1 AND ?2
             GROUP BY date
             ORDER BY date ASC",
        )?;

        let rows = stmt.query_map(params![start_date, end_date], |row| {
            Ok(DailyActivity {
                date: row.get(0)?,
                input_tokens: row.get(1)?,
                output_tokens: row.get(2)?,
                cost_usd: row.get(3)?,
                session_count: row.get(4)?,
                message_count: row.get(5)?,
            })
        })?;

        let mut activities = Vec::new();
        for row in rows {
            activities.push(row?);
        }

        Ok(activities)
    }

    fn get_provider_by_hash(
        &self,
        conn: &Connection,
        api_key: &str,
    ) -> Result<Option<Provider>, RepositoryError> {
        let temp_provider = Provider::new(api_key, None, None);

        conn.query_row(
            "SELECT id, api_key_hash, api_key_prefix, display_name, base_url, is_active, first_seen_at, last_seen_at
             FROM providers WHERE api_key_hash = ?1",
            params![temp_provider.api_key_hash],
            |row| {
                Ok(Provider {
                    id: row.get(0)?,
                    api_key_hash: row.get(1)?,
                    api_key_prefix: row.get(2)?,
                    display_name: row.get(3)?,
                    base_url: row.get(4)?,
                    is_active: row.get::<_, i64>(5)? == 1,
                    first_seen_at: row.get(6)?,
                    last_seen_at: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(RepositoryError::from)
    }
}

fn extract_date(iso: &str) -> String {
    if let Ok(parsed) = chrono::DateTime::parse_from_rfc3339(iso) {
        return parsed.date_naive().to_string();
    }
    Utc::now().date_naive().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{MessageRecord, MessageUsage};

    #[test]
    fn test_repository_insert_and_stats() {
        let repo = Repository::new_in_memory().expect("repo");
        let provider = repo
            .upsert_provider("sk-test", None)
            .expect("provider");

        let record = MessageRecord::new(
            "session-1".to_string(),
            "message-1".to_string(),
            "claude-3-opus".to_string(),
            Utc::now().to_rfc3339(),
            MessageUsage {
                input_tokens: 100,
                output_tokens: 50,
                cache_read_tokens: 0,
                cache_creation_tokens: 0,
                cost_usd: 1.0,
            },
        );

        repo.insert_message_usage(provider.id, &record)
            .expect("insert");

        let stats = repo.get_current_stats().expect("stats");
        assert_eq!(stats.total_input_tokens, 100);
        assert_eq!(stats.total_messages, 1);
    }

    #[test]
    fn test_get_daily_activities() {
        let repo = Repository::new_in_memory().expect("repo");
        let provider = repo
            .upsert_provider("sk-test", None)
            .expect("provider");

        let record = MessageRecord::new(
            "session-1".to_string(),
            "message-1".to_string(),
            "claude-3-opus".to_string(),
            Utc::now().to_rfc3339(),
            MessageUsage {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_tokens: 0,
                cache_creation_tokens: 0,
                cost_usd: 0.1,
            },
        );

        repo.insert_message_usage(provider.id, &record)
            .expect("insert");

        let today = Utc::now().date_naive().to_string();
        let activities = repo
            .get_daily_activities(&today, &today)
            .expect("activities");

        assert_eq!(activities.len(), 1);
        assert_eq!(activities[0].message_count, 1);
    }
}
