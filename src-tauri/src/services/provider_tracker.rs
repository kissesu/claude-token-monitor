/**
 * @file provider_tracker.rs
 * @description 供应商识别与切换追踪服务
 * @author Atlas.oi
 * @date 2026-01-08
 */
use crate::db::{Repository, RepositoryError};
use crate::models::Provider;
use crate::services::parser::Settings;

pub struct ProviderTracker {
    repository: Repository,
}

impl ProviderTracker {
    pub fn new(repository: Repository) -> Self {
        Self { repository }
    }

    /// 根据 settings.json 内容更新供应商记录
    pub fn track_from_settings(&self, settings: &Settings) -> Result<Provider, RepositoryError> {
        self.repository
            .upsert_provider(&settings.api_key, settings.base_url.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Repository;
    use crate::services::parser::Settings;

    #[test]
    fn test_track_from_settings() {
        let repository = Repository::new_in_memory().expect("repo");
        let tracker = ProviderTracker::new(repository);
        let settings = Settings {
            api_key: "sk-test".to_string(),
            base_url: None,
        };

        let provider = tracker.track_from_settings(&settings).expect("track");
        assert_eq!(provider.api_key_prefix, "sk-test");
    }
}
