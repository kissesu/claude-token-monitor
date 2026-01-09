pub mod migrations;
pub mod repository;
/**
 * @file mod.rs
 * @description 数据库模块入口，包含 Schema、迁移与仓储层
 * @author Atlas.oi
 * @date 2026-01-08
 */
pub mod schema;

pub use repository::{Repository, RepositoryError};
