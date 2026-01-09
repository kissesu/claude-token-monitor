//! @file pricing.rs
//! @description 模型价格计算服务
//! @author Atlas.oi
//! @date 2026-01-08
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ModelPricing {
    pub input_per_million: f64,
    pub output_per_million: f64,
    pub cache_read_per_million: f64,
    pub cache_creation_per_million: f64,
}

#[derive(Debug, Clone)]
pub struct PricingService {
    pricing: HashMap<String, ModelPricing>,
}

impl PricingService {
    pub fn new() -> Self {
        let mut pricing = HashMap::new();

        // 价格为示例值，可在后续版本中由配置或远程获取
        pricing.insert(
            "claude-3-opus".to_string(),
            ModelPricing {
                input_per_million: 15.0,
                output_per_million: 75.0,
                cache_read_per_million: 1.5,
                cache_creation_per_million: 0.0,
            },
        );

        pricing.insert(
            "claude-3-sonnet".to_string(),
            ModelPricing {
                input_per_million: 3.0,
                output_per_million: 15.0,
                cache_read_per_million: 0.3,
                cache_creation_per_million: 0.0,
            },
        );

        pricing.insert(
            "claude-3-haiku".to_string(),
            ModelPricing {
                input_per_million: 0.25,
                output_per_million: 1.25,
                cache_read_per_million: 0.025,
                cache_creation_per_million: 0.0,
            },
        );

        Self { pricing }
    }

    pub fn calculate_cost(
        &self,
        model: &str,
        input_tokens: i64,
        output_tokens: i64,
        cache_read_tokens: i64,
        cache_creation_tokens: i64,
    ) -> f64 {
        let Some(pricing) = self.pricing.get(model) else {
            return 0.0;
        };

        let input_cost = input_tokens as f64 / 1_000_000.0 * pricing.input_per_million;
        let output_cost = output_tokens as f64 / 1_000_000.0 * pricing.output_per_million;
        let cache_read_cost =
            cache_read_tokens as f64 / 1_000_000.0 * pricing.cache_read_per_million;
        let cache_creation_cost =
            cache_creation_tokens as f64 / 1_000_000.0 * pricing.cache_creation_per_million;

        input_cost + output_cost + cache_read_cost + cache_creation_cost
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_cost() {
        let service = PricingService::new();
        let cost = service.calculate_cost("claude-3-opus", 1_000_000, 0, 0, 0);

        assert_eq!(cost, 15.0);
    }
}
