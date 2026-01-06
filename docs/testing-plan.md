/**
 * @file testing-plan.md
 * @description Claude Token Monitor 测试策略与质量保证计划
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 测试策略与质量保证计划

## 一、测试策略概述

### 1.1 测试金字塔

```
                    ┌─────────┐
                    │   E2E   │  10%
                    │  Tests  │
                   ┌┴─────────┴┐
                   │Integration │  30%
                   │   Tests    │
                  ┌┴───────────┴┐
                  │    Unit      │  60%
                  │    Tests     │
                  └──────────────┘
```

### 1.2 测试覆盖率目标

| 组件 | 目标覆盖率 | 最低覆盖率 |
|------|------------|------------|
| 后端核心逻辑 | 90% | 80% |
| 后端 API | 85% | 75% |
| 前端组件 | 80% | 70% |
| 前端 Store | 90% | 80% |
| 工具函数 | 95% | 90% |

### 1.3 测试工具栈

| 类型 | 后端工具 | 前端工具 |
|------|----------|----------|
| 单元测试 | pytest | Vitest |
| 异步测试 | pytest-asyncio | - |
| 覆盖率 | pytest-cov | @vitest/coverage-v8 |
| Mock | unittest.mock | vi.mock |
| 组件测试 | - | @testing-library/svelte |
| E2E 测试 | - | Playwright |
| 性能测试 | locust | Lighthouse |

---

## 二、后端测试计划

### 2.1 单元测试

#### 2.1.1 配置模块测试 (test_config.py)

```python
"""
@file: test_config.py
@description: 配置模块测试
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
from pathlib import Path
from unittest.mock import patch
from app.config import Settings

class TestSettings:
    """配置类测试"""

    def test_default_claude_dir(self):
        """测试默认 Claude 目录"""
        settings = Settings()
        assert settings.claude_dir == Path.home() / ".claude"

    def test_env_override(self):
        """测试环境变量覆盖"""
        with patch.dict('os.environ', {'CTM_CLAUDE_DIR': '/custom/path'}):
            settings = Settings()
            assert settings.claude_dir == Path('/custom/path')

    def test_default_port(self):
        """测试默认端口"""
        settings = Settings()
        assert settings.port == 8080

    def test_invalid_log_level(self):
        """测试无效日志级别"""
        with patch.dict('os.environ', {'CTM_LOG_LEVEL': 'INVALID'}):
            # 应该回退到默认值或抛出错误
            pass
```

#### 2.1.2 统计读取器测试 (test_stats_reader.py)

```python
"""
@file: test_stats_reader.py
@description: 统计读取器测试
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
import json
from pathlib import Path
from unittest.mock import patch, mock_open
from app.core.stats_reader import StatsReader

# 测试数据
MOCK_STATS_DATA = {
    "version": 1,
    "lastComputedDate": "2026-01-05",
    "totalSessions": 100,
    "totalMessages": 5000,
    "modelUsage": {
        "claude-opus-4-5-20251101": {
            "inputTokens": 10000,
            "outputTokens": 50000,
            "cacheReadInputTokens": 100000,
            "cacheCreationInputTokens": 20000,
            "webSearchRequests": 0,
            "costUSD": 0,
            "contextWindow": 0
        }
    }
}

class TestStatsReader:
    """统计读取器测试"""

    @pytest.fixture
    def reader(self, tmp_path):
        """创建测试读取器"""
        return StatsReader(claude_dir=tmp_path)

    @pytest.fixture
    def stats_file(self, tmp_path):
        """创建测试统计文件"""
        stats_file = tmp_path / "stats-cache.json"
        stats_file.write_text(json.dumps(MOCK_STATS_DATA))
        return stats_file

    @pytest.mark.asyncio
    async def test_read_stats_cache_success(self, reader, stats_file):
        """测试成功读取统计缓存"""
        result = await reader.read_stats_cache()

        assert result is not None
        assert result.version == 1
        assert result.total_sessions == 100
        assert result.total_messages == 5000

    @pytest.mark.asyncio
    async def test_read_stats_cache_file_not_found(self, reader):
        """测试文件不存在的情况"""
        result = await reader.read_stats_cache()
        assert result is None

    @pytest.mark.asyncio
    async def test_read_stats_cache_invalid_json(self, reader, tmp_path):
        """测试无效 JSON 的情况"""
        stats_file = tmp_path / "stats-cache.json"
        stats_file.write_text("invalid json")

        with pytest.raises(json.JSONDecodeError):
            await reader.read_stats_cache()

    def test_calculate_cache_hit_rate(self, reader):
        """测试缓存命中率计算"""
        from app.schemas import ModelUsage

        usage = ModelUsage(
            input_tokens=10000,
            output_tokens=50000,
            cache_read_input_tokens=100000,
            cache_creation_input_tokens=20000,
            web_search_requests=0,
            cost_usd=0,
            context_window=0
        )

        # 缓存命中率 = 100000 / (10000 + 100000 + 20000) = 0.769...
        rate = reader.calculate_cache_hit_rate(usage)
        assert abs(rate - 0.769) < 0.01

    def test_calculate_cache_hit_rate_zero_input(self, reader):
        """测试零输入的缓存命中率"""
        from app.schemas import ModelUsage

        usage = ModelUsage(
            input_tokens=0,
            output_tokens=0,
            cache_read_input_tokens=0,
            cache_creation_input_tokens=0,
            web_search_requests=0,
            cost_usd=0,
            context_window=0
        )

        rate = reader.calculate_cache_hit_rate(usage)
        assert rate == 0.0
```

#### 2.1.3 定价计算测试 (test_pricing.py)

```python
"""
@file: test_pricing.py
@description: 定价计算测试
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
from app.pricing import calculate_cost, normalize_model_name, PRICING_CONFIG
from app.schemas import ModelUsage

class TestPricing:
    """定价计算测试"""

    @pytest.fixture
    def opus_usage(self):
        """Opus 模型用量数据"""
        return ModelUsage(
            input_tokens=1_000_000,     # 1M tokens
            output_tokens=500_000,       # 0.5M tokens
            cache_read_input_tokens=10_000_000,  # 10M tokens
            cache_creation_input_tokens=2_000_000,  # 2M tokens
            web_search_requests=0,
            cost_usd=0,
            context_window=0
        )

    def test_calculate_cost_opus(self, opus_usage):
        """测试 Opus 模型费用计算"""
        # 费用 = (1M * 15 + 0.5M * 75 + 10M * 1.5 + 2M * 18.75) / 1M
        # = (15 + 37.5 + 15 + 37.5) = 105.0
        cost = calculate_cost(opus_usage, "claude-opus-4-5-20251101")
        assert abs(cost - 105.0) < 0.01

    def test_calculate_cost_sonnet(self):
        """测试 Sonnet 模型费用计算"""
        usage = ModelUsage(
            input_tokens=1_000_000,
            output_tokens=500_000,
            cache_read_input_tokens=10_000_000,
            cache_creation_input_tokens=2_000_000,
            web_search_requests=0,
            cost_usd=0,
            context_window=0
        )

        # 费用 = (1M * 3 + 0.5M * 15 + 10M * 0.3 + 2M * 3.75) / 1M
        # = (3 + 7.5 + 3 + 7.5) = 21.0
        cost = calculate_cost(usage, "claude-sonnet-4-5-20250929")
        assert abs(cost - 21.0) < 0.01

    def test_calculate_cost_unknown_model(self):
        """测试未知模型返回 0"""
        usage = ModelUsage(
            input_tokens=1_000_000,
            output_tokens=500_000,
            cache_read_input_tokens=0,
            cache_creation_input_tokens=0,
            web_search_requests=0,
            cost_usd=0,
            context_window=0
        )

        cost = calculate_cost(usage, "unknown-model")
        assert cost == 0.0

    def test_normalize_model_name_opus(self):
        """测试 Opus 模型名称标准化"""
        variants = [
            "claude-opus-4-5-20251101",
            "claude-opus-4-5-thinking",
            "CLAUDE-OPUS-4-5",
        ]

        for name in variants:
            assert normalize_model_name(name) == "claude-opus-4-5"

    def test_normalize_model_name_sonnet(self):
        """测试 Sonnet 模型名称标准化"""
        variants = [
            "claude-sonnet-4-5-20250929",
            "claude-sonnet-4-5",
        ]

        for name in variants:
            assert normalize_model_name(name) == "claude-sonnet-4-5"
```

### 2.2 集成测试

#### 2.2.1 API 集成测试 (test_api_integration.py)

```python
"""
@file: test_api_integration.py
@description: API 集成测试
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
from aiohttp import web
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from app.main import create_app

class TestAPIIntegration(AioHTTPTestCase):
    """API 集成测试"""

    async def get_application(self):
        """创建测试应用"""
        return await create_app()

    @unittest_run_loop
    async def test_health_endpoint(self):
        """测试健康检查端点"""
        resp = await self.client.request("GET", "/api/v1/health")
        assert resp.status == 200

        data = await resp.json()
        assert data["status"] == "healthy"
        assert "version" in data

    @unittest_run_loop
    async def test_stats_endpoint(self):
        """测试统计数据端点"""
        resp = await self.client.request("GET", "/api/v1/stats")
        assert resp.status == 200

        data = await resp.json()
        assert "modelUsage" in data or data.get("error") is not None

    @unittest_run_loop
    async def test_stats_daily_endpoint(self):
        """测试每日统计端点"""
        resp = await self.client.request("GET", "/api/v1/stats/daily")
        assert resp.status == 200

    @unittest_run_loop
    async def test_export_csv_endpoint(self):
        """测试 CSV 导出端点"""
        resp = await self.client.request(
            "POST",
            "/api/v1/export",
            json={"format": "csv"}
        )
        assert resp.status == 200
        assert resp.content_type == "text/csv"

    @unittest_run_loop
    async def test_export_json_endpoint(self):
        """测试 JSON 导出端点"""
        resp = await self.client.request(
            "POST",
            "/api/v1/export",
            json={"format": "json"}
        )
        assert resp.status == 200
        assert resp.content_type == "application/json"
```

#### 2.2.2 WebSocket 集成测试 (test_ws_integration.py)

```python
"""
@file: test_ws_integration.py
@description: WebSocket 集成测试
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
import asyncio
import json
from aiohttp import web, WSMsgType
from aiohttp.test_utils import AioHTTPTestCase, unittest_run_loop
from app.main import create_app

class TestWebSocketIntegration(AioHTTPTestCase):
    """WebSocket 集成测试"""

    async def get_application(self):
        return await create_app()

    @unittest_run_loop
    async def test_websocket_connection(self):
        """测试 WebSocket 连接"""
        async with self.client.ws_connect("/api/v1/ws") as ws:
            assert not ws.closed
            await ws.close()

    @unittest_run_loop
    async def test_websocket_ping_pong(self):
        """测试 WebSocket 心跳"""
        async with self.client.ws_connect("/api/v1/ws") as ws:
            # 发送 ping
            await ws.send_json({"type": "ping"})

            # 接收 pong
            msg = await ws.receive()
            assert msg.type == WSMsgType.TEXT

            data = json.loads(msg.data)
            assert data["type"] == "pong"

    @unittest_run_loop
    async def test_websocket_stats_broadcast(self):
        """测试统计数据广播"""
        async with self.client.ws_connect("/api/v1/ws") as ws:
            # 等待初始数据
            msg = await asyncio.wait_for(ws.receive(), timeout=5.0)

            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)
                assert "type" in data
```

### 2.3 测试配置 (conftest.py)

```python
"""
@file: conftest.py
@description: pytest 配置和 fixtures
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
import asyncio
import tempfile
import json
from pathlib import Path

@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def temp_claude_dir(tmp_path):
    """创建临时 Claude 目录"""
    claude_dir = tmp_path / ".claude"
    claude_dir.mkdir()

    # 创建测试数据文件
    stats_file = claude_dir / "stats-cache.json"
    stats_file.write_text(json.dumps({
        "version": 1,
        "lastComputedDate": "2026-01-05",
        "totalSessions": 100,
        "totalMessages": 5000,
        "modelUsage": {}
    }))

    return claude_dir

@pytest.fixture
def mock_settings(temp_claude_dir):
    """模拟配置"""
    from unittest.mock import patch
    from app.config import Settings

    mock = Settings(claude_dir=temp_claude_dir)
    with patch('app.config.settings', mock):
        yield mock
```

---

## 三、前端测试计划

### 3.1 组件单元测试

#### 3.1.1 StatCard 组件测试

```typescript
// tests/unit/components/StatCard.test.ts
/**
 * @file StatCard.test.ts
 * @description StatCard 组件测试
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import StatCard from '$lib/components/common/StatCard.svelte';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(StatCard, {
      props: {
        title: 'Total Tokens',
        value: '1,234,567'
      }
    });

    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(StatCard, {
      props: {
        title: 'Total Tokens',
        value: '1,234,567',
        subtitle: 'Last 7 days'
      }
    });

    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
  });

  it('shows positive trend indicator', () => {
    render(StatCard, {
      props: {
        title: 'Total Tokens',
        value: '1,234,567',
        trend: 15.5
      }
    });

    expect(screen.getByText('+15.5%')).toBeInTheDocument();
  });

  it('shows negative trend indicator', () => {
    render(StatCard, {
      props: {
        title: 'Total Tokens',
        value: '1,234,567',
        trend: -10.2
      }
    });

    expect(screen.getByText('-10.2%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(StatCard, {
      props: {
        title: 'Total Tokens',
        value: '',
        loading: true
      }
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

#### 3.1.2 TrendChart 组件测试

```typescript
// tests/unit/components/TrendChart.test.ts
/**
 * @file TrendChart.test.ts
 * @description TrendChart 组件测试
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import TrendChart from '$lib/components/charts/TrendChart.svelte';

describe('TrendChart', () => {
  const mockData = [
    { date: '2026-01-01', value: 100 },
    { date: '2026-01-02', value: 150 },
    { date: '2026-01-03', value: 120 }
  ];

  it('renders chart container', () => {
    render(TrendChart, {
      props: {
        data: mockData,
        xKey: 'date',
        yKey: 'value'
      }
    });

    expect(screen.getByRole('img', { name: /chart/i })).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(TrendChart, {
      props: {
        data: [],
        xKey: 'date',
        yKey: 'value'
      }
    });

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('applies custom color', () => {
    const { container } = render(TrendChart, {
      props: {
        data: mockData,
        xKey: 'date',
        yKey: 'value',
        color: 'primary'
      }
    });

    // 检查颜色类名
    expect(container.querySelector('.chart-primary')).toBeInTheDocument();
  });
});
```

### 3.2 Store 测试

#### 3.2.1 statsStore 测试

```typescript
// tests/unit/stores/statsStore.test.ts
/**
 * @file statsStore.test.ts
 * @description statsStore 测试
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { stats, cacheHitRate, totalCost, totalTokens, loadStats } from '$lib/stores/statsStore';

describe('statsStore', () => {
  beforeEach(() => {
    stats.set(null);
  });

  describe('cacheHitRate derived store', () => {
    it('returns 0 when stats is null', () => {
      expect(get(cacheHitRate)).toBe(0);
    });

    it('calculates correct cache hit rate', () => {
      stats.set({
        modelUsage: {
          'claude-opus-4-5': {
            inputTokens: 10000,
            outputTokens: 50000,
            cacheReadInputTokens: 100000,
            cacheCreationInputTokens: 20000,
            webSearchRequests: 0,
            costUSD: 0,
            contextWindow: 0
          }
        }
      });

      // 100000 / (10000 + 100000 + 20000) * 100 = 76.92%
      const rate = get(cacheHitRate);
      expect(rate).toBeCloseTo(76.92, 1);
    });
  });

  describe('loadStats function', () => {
    it('fetches and sets stats data', async () => {
      const mockData = {
        version: 1,
        totalSessions: 100,
        modelUsage: {}
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      await loadStats();

      expect(get(stats)).toEqual(mockData);
    });

    it('handles fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await loadStats();

      expect(get(stats)).toBeNull();
    });
  });
});
```

### 3.3 E2E 测试

#### 3.3.1 仪表板测试 (dashboard.spec.ts)

```typescript
// tests/e2e/dashboard.spec.ts
/**
 * @file dashboard.spec.ts
 * @description 仪表板 E2E 测试
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads dashboard page', async ({ page }) => {
    await expect(page).toHaveTitle(/Claude Token Monitor/);
    await expect(page.locator('h1')).toContainText('Token Monitor');
  });

  test('displays stat cards', async ({ page }) => {
    // 等待数据加载
    await page.waitForSelector('[data-testid="stat-card"]');

    // 验证至少有 4 个统计卡片
    const cards = page.locator('[data-testid="stat-card"]');
    await expect(cards).toHaveCount(4);
  });

  test('displays charts after data loads', async ({ page }) => {
    // 等待图表渲染
    await page.waitForSelector('[data-testid="trend-chart"]');

    const chart = page.locator('[data-testid="trend-chart"]');
    await expect(chart).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    // 获取初始主题
    const initialTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // 点击切换
    await themeToggle.click();

    // 验证主题已切换
    const newTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    expect(newTheme).not.toBe(initialTheme);
  });

  test('export functionality', async ({ page }) => {
    // 打开导出对话框
    await page.click('[data-testid="export-button"]');

    // 选择 CSV 格式
    await page.click('[data-testid="export-csv"]');

    // 等待下载
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
```

#### 3.3.2 响应式测试 (responsive.spec.ts)

```typescript
// tests/e2e/responsive.spec.ts
/**
 * @file responsive.spec.ts
 * @description 响应式布局 E2E 测试
 * @author Atlas.oi
 * @date 2026-01-06
 */

import { test, expect, devices } from '@playwright/test';

const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

for (const viewport of viewports) {
  test.describe(`Responsive - ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('page renders correctly', async ({ page }) => {
      await page.goto('/');

      // 截图对比
      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`);
    });

    test('navigation is accessible', async ({ page }) => {
      await page.goto('/');

      if (viewport.width < 768) {
        // 移动端：检查汉堡菜单
        const menuButton = page.locator('[data-testid="mobile-menu"]');
        await expect(menuButton).toBeVisible();
      } else {
        // 桌面端：检查导航栏
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
      }
    });
  });
}
```

### 3.4 测试配置

#### 3.4.1 Vitest 配置 (vitest.config.ts)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '$lib': '/src/lib'
    }
  }
});
```

#### 3.4.2 Playwright 配置 (playwright.config.ts)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

---

## 四、性能测试

### 4.1 后端性能基准

```python
# tests/performance/test_api_performance.py
"""
@file: test_api_performance.py
@description: API 性能测试
@author: Atlas.oi
@date: 2026-01-06
"""

import pytest
import time
import statistics
from aiohttp.test_utils import AioHTTPTestCase

class TestAPIPerformance(AioHTTPTestCase):
    """API 性能测试"""

    async def get_application(self):
        from app.main import create_app
        return await create_app()

    @pytest.mark.performance
    async def test_stats_endpoint_latency(self):
        """测试统计端点延迟"""
        latencies = []

        for _ in range(100):
            start = time.perf_counter()
            await self.client.request("GET", "/api/v1/stats")
            latencies.append((time.perf_counter() - start) * 1000)

        p50 = statistics.median(latencies)
        p99 = statistics.quantiles(latencies, n=100)[98]

        assert p50 < 50, f"P50 延迟 {p50}ms 超过 50ms 阈值"
        assert p99 < 200, f"P99 延迟 {p99}ms 超过 200ms 阈值"

    @pytest.mark.performance
    async def test_concurrent_connections(self):
        """测试并发连接"""
        import asyncio

        async def make_request():
            return await self.client.request("GET", "/api/v1/stats")

        # 并发 100 个请求
        tasks = [make_request() for _ in range(100)]
        responses = await asyncio.gather(*tasks)

        success_count = sum(1 for r in responses if r.status == 200)
        assert success_count >= 95, f"成功率 {success_count}% 低于 95%"
```

### 4.2 性能指标要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| API P50 延迟 | < 50ms | 后端性能测试 |
| API P99 延迟 | < 200ms | 后端性能测试 |
| WebSocket 延迟 | < 100ms | WebSocket 测试 |
| 内存占用 | < 256MB | Docker stats |
| CPU 占用 | < 50% (idle) | Docker stats |
| 首屏加载 | < 1s | Lighthouse |
| Lighthouse 评分 | > 90 | Lighthouse |

---

## 五、CI/CD 测试集成

### 5.1 测试工作流

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        run: |
          cd backend
          pytest -v --cov=app --cov-report=xml --cov-fail-under=80 tests/

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage.xml
          flags: backend

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install

      - name: Run tests
        run: |
          cd frontend
          pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: frontend/coverage/lcov.info
          flags: frontend

  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Start services
        run: docker compose up -d

      - name: Wait for services
        run: sleep 10

      - name: Install Playwright
        run: |
          cd frontend
          pnpm install
          pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd frontend
          pnpm test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 六、测试命令汇总

### 6.1 后端测试命令

```bash
# 运行所有测试
cd backend && pytest -v tests/

# 运行带覆盖率的测试
cd backend && pytest -v --cov=app --cov-report=html tests/

# 运行特定测试文件
cd backend && pytest -v tests/test_pricing.py

# 运行性能测试
cd backend && pytest -v -m performance tests/

# 运行集成测试
cd backend && pytest -v tests/integration/
```

### 6.2 前端测试命令

```bash
# 运行单元测试
cd frontend && pnpm test

# 运行带覆盖率的测试
cd frontend && pnpm test:coverage

# 运行 E2E 测试
cd frontend && pnpm test:e2e

# 运行 E2E 测试（带 UI）
cd frontend && pnpm test:e2e:ui

# 更新快照
cd frontend && pnpm test:e2e -- --update-snapshots
```

### 6.3 Makefile 测试目标

```makefile
# 运行所有测试
test: test-backend test-frontend
	@echo "$(GREEN)所有测试完成$(NC)"

# 运行后端测试
test-backend:
	@echo "$(GREEN)正在运行后端测试...$(NC)"
	cd backend && pytest -v --cov=app tests/
	@echo "$(GREEN)后端测试完成$(NC)"

# 运行前端测试
test-frontend:
	@echo "$(GREEN)正在运行前端测试...$(NC)"
	cd frontend && pnpm test
	@echo "$(GREEN)前端测试完成$(NC)"

# 运行 E2E 测试
test-e2e:
	@echo "$(GREEN)正在运行 E2E 测试...$(NC)"
	cd frontend && pnpm test:e2e
	@echo "$(GREEN)E2E 测试完成$(NC)"

# 生成测试覆盖率报告
coverage:
	@echo "$(GREEN)生成测试覆盖率报告...$(NC)"
	cd backend && pytest --cov=app --cov-report=html tests/
	cd frontend && pnpm test:coverage
	@echo "$(GREEN)覆盖率报告已生成$(NC)"
```

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
