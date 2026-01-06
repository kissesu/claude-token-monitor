/**
 * @file api-design.md
 * @description Claude Token Monitor API 接口设计文档
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - API 接口设计文档

## 一、概述

### 1.1 设计原则

1. **RESTful 风格**: 遵循 REST 架构规范
2. **JSON 格式**: 请求和响应均使用 JSON
3. **版本控制**: URL 路径包含版本号 `/api/v1/`
4. **统一响应**: 标准化响应结构
5. **幂等性**: GET/PUT/DELETE 操作幂等

### 1.2 基础信息

| 项目 | 值 |
|------|------|
| Base URL | `http://localhost:{PORT}/api/v1` |
| 默认端口 | 51888 |
| Content-Type | `application/json` |
| 字符编码 | UTF-8 |

### 1.3 通用响应结构

#### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

### 1.4 错误码定义

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| `INVALID_PARAMS` | 400 | 请求参数无效 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `FILE_NOT_FOUND` | 404 | 数据文件不存在 |
| `PARSE_ERROR` | 500 | 数据解析错误 |
| `EXPORT_FAILED` | 500 | 导出失败 |

---

## 二、API 端点总览

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/stats` | 获取当前统计概览 |
| GET | `/stats/models` | 获取模型用量统计 |
| GET | `/stats/daily` | 获取每日统计 |
| GET | `/stats/trends` | 获取趋势数据 |
| GET | `/stats/history` | 获取历史快照 |
| GET | `/stats/activity` | 获取活动热力图数据 |
| POST | `/export` | 导出数据 |
| GET | `/config` | 获取配置信息 |
| WS | `/ws` | WebSocket 实时推送 |

---

## 三、API 详细设计

### 3.1 健康检查

检查服务运行状态。

#### 请求

```http
GET /api/v1/health
```

#### 响应

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 3600,
    "data_source": {
      "path": "/Users/xxx/.claude/stats-cache.json",
      "exists": true,
      "last_modified": "2026-01-06T10:00:00Z"
    },
    "database": {
      "status": "connected",
      "path": "data/monitor.db"
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| status | string | 服务状态：healthy / degraded / unhealthy |
| version | string | 服务版本号 |
| uptime | integer | 运行时间（秒） |
| data_source.path | string | 数据源文件路径 |
| data_source.exists | boolean | 数据源文件是否存在 |
| data_source.last_modified | string | 数据源最后修改时间 |
| database.status | string | 数据库连接状态 |
| database.path | string | 数据库文件路径 |

---

### 3.2 获取当前统计概览

获取最新的统计数据概览，包含 token 用量、费用、缓存命中率等核心指标。

#### 请求

```http
GET /api/v1/stats
```

#### 响应

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_input_tokens": 1250000,
      "total_output_tokens": 450000,
      "total_cache_read_tokens": 800000,
      "total_cache_write_tokens": 200000,
      "total_tokens": 2700000,
      "total_cost_usd": 45.67,
      "cache_hit_rate": 0.356,
      "last_updated": "2026-01-06T10:30:00Z"
    },
    "today": {
      "input_tokens": 50000,
      "output_tokens": 18000,
      "cache_read_tokens": 32000,
      "cache_write_tokens": 8000,
      "cost_usd": 1.85,
      "cache_hit_rate": 0.32,
      "session_count": 15
    },
    "comparison": {
      "vs_yesterday": {
        "tokens_change": 0.12,
        "cost_change": 0.08,
        "cache_hit_change": 0.05
      },
      "vs_last_week_avg": {
        "tokens_change": -0.05,
        "cost_change": -0.03,
        "cache_hit_change": 0.10
      }
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| summary.total_input_tokens | integer | 总输入 token 数 |
| summary.total_output_tokens | integer | 总输出 token 数 |
| summary.total_cache_read_tokens | integer | 总缓存读取 token 数 |
| summary.total_cache_write_tokens | integer | 总缓存写入 token 数 |
| summary.total_tokens | integer | 总 token 数 |
| summary.total_cost_usd | number | 总费用（美元） |
| summary.cache_hit_rate | number | 缓存命中率（0-1） |
| today.* | - | 今日统计数据 |
| comparison.vs_yesterday | object | 与昨日对比（变化率） |
| comparison.vs_last_week_avg | object | 与上周平均对比（变化率） |

---

### 3.3 获取模型用量统计

按模型分类获取 token 用量和费用统计。

#### 请求

```http
GET /api/v1/stats/models?period=30d
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| period | string | 否 | 30d | 统计周期：7d / 30d / 90d / all |

#### 响应

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "models": [
      {
        "model_name": "claude-opus-4-5",
        "display_name": "Claude Opus 4.5",
        "input_tokens": 500000,
        "output_tokens": 180000,
        "cache_read_tokens": 320000,
        "cache_write_tokens": 80000,
        "total_tokens": 1080000,
        "cost_usd": 28.50,
        "cache_hit_rate": 0.356,
        "usage_percentage": 0.40,
        "cost_percentage": 0.62
      },
      {
        "model_name": "claude-sonnet-4-5",
        "display_name": "Claude Sonnet 4.5",
        "input_tokens": 600000,
        "output_tokens": 220000,
        "cache_read_tokens": 400000,
        "cache_write_tokens": 100000,
        "total_tokens": 1320000,
        "cost_usd": 15.20,
        "cache_hit_rate": 0.364,
        "usage_percentage": 0.49,
        "cost_percentage": 0.33
      },
      {
        "model_name": "claude-haiku-4-5",
        "display_name": "Claude Haiku 4.5",
        "input_tokens": 150000,
        "output_tokens": 50000,
        "cache_read_tokens": 80000,
        "cache_write_tokens": 20000,
        "total_tokens": 300000,
        "cost_usd": 1.97,
        "cache_hit_rate": 0.32,
        "usage_percentage": 0.11,
        "cost_percentage": 0.05
      }
    ],
    "totals": {
      "total_tokens": 2700000,
      "total_cost_usd": 45.67
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| models[].model_name | string | 标准化模型名称 |
| models[].display_name | string | 显示名称 |
| models[].usage_percentage | number | 用量占比（0-1） |
| models[].cost_percentage | number | 费用占比（0-1） |

---

### 3.4 获取每日统计

获取指定日期范围内的每日统计数据。

#### 请求

```http
GET /api/v1/stats/daily?start_date=2026-01-01&end_date=2026-01-06
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| start_date | string | 否 | 7天前 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 今天 | 结束日期（YYYY-MM-DD） |

#### 响应

```json
{
  "success": true,
  "data": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-06",
    "days": [
      {
        "date": "2026-01-01",
        "input_tokens": 45000,
        "output_tokens": 16000,
        "cache_read_tokens": 28000,
        "cache_write_tokens": 7000,
        "total_tokens": 96000,
        "cost_usd": 1.65,
        "cache_hit_rate": 0.35,
        "session_count": 12
      },
      {
        "date": "2026-01-02",
        "input_tokens": 52000,
        "output_tokens": 19000,
        "cache_read_tokens": 35000,
        "cache_write_tokens": 9000,
        "total_tokens": 115000,
        "cost_usd": 1.92,
        "cache_hit_rate": 0.37,
        "session_count": 14
      }
      // ... 更多日期
    ],
    "summary": {
      "total_days": 6,
      "total_tokens": 580000,
      "total_cost_usd": 10.25,
      "avg_daily_tokens": 96667,
      "avg_daily_cost": 1.71,
      "avg_cache_hit_rate": 0.36
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

### 3.5 获取趋势数据

获取用于图表展示的趋势数据。

#### 请求

```http
GET /api/v1/stats/trends?period=7d&granularity=day
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| period | string | 否 | 7d | 时间范围：7d / 30d / 90d |
| granularity | string | 否 | day | 粒度：hour / day / week |
| metrics | string | 否 | all | 指标：tokens / cost / cache_hit / all |

#### 响应

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "granularity": "day",
    "series": {
      "labels": [
        "2025-12-31",
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        "2026-01-05",
        "2026-01-06"
      ],
      "tokens": {
        "input": [42000, 45000, 52000, 48000, 55000, 50000, 50000],
        "output": [15000, 16000, 19000, 17000, 20000, 18000, 18000],
        "cache_read": [26000, 28000, 35000, 30000, 38000, 32000, 32000],
        "cache_write": [6500, 7000, 9000, 7500, 9500, 8000, 8000],
        "total": [89500, 96000, 115000, 102500, 122500, 108000, 108000]
      },
      "cost": [1.55, 1.65, 1.92, 1.78, 2.05, 1.85, 1.85],
      "cache_hit_rate": [0.34, 0.35, 0.37, 0.36, 0.38, 0.36, 0.36]
    },
    "statistics": {
      "tokens": {
        "min": 89500,
        "max": 122500,
        "avg": 105929,
        "total": 741500
      },
      "cost": {
        "min": 1.55,
        "max": 2.05,
        "avg": 1.81,
        "total": 12.65
      },
      "cache_hit_rate": {
        "min": 0.34,
        "max": 0.38,
        "avg": 0.36
      }
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

### 3.6 获取历史快照

获取历史统计快照数据。

#### 请求

```http
GET /api/v1/stats/history?start_time=2026-01-06T00:00:00Z&end_time=2026-01-06T12:00:00Z&limit=50
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| start_time | string | 否 | 24小时前 | 开始时间（ISO 8601） |
| end_time | string | 否 | 现在 | 结束时间（ISO 8601） |
| limit | integer | 否 | 100 | 返回数量限制（最大 500） |
| offset | integer | 否 | 0 | 偏移量 |

#### 响应

```json
{
  "success": true,
  "data": {
    "snapshots": [
      {
        "id": 1001,
        "captured_at": "2026-01-06T10:00:00Z",
        "total_input_tokens": 1245000,
        "total_output_tokens": 448000,
        "total_cache_read_tokens": 798000,
        "total_cache_write_tokens": 199000,
        "total_cost_usd": 45.50,
        "cache_hit_rate": 0.356
      },
      {
        "id": 1002,
        "captured_at": "2026-01-06T10:30:00Z",
        "total_input_tokens": 1250000,
        "total_output_tokens": 450000,
        "total_cache_read_tokens": 800000,
        "total_cache_write_tokens": 200000,
        "total_cost_usd": 45.67,
        "cache_hit_rate": 0.356
      }
    ],
    "pagination": {
      "total": 48,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

### 3.7 获取活动热力图数据

获取按小时分布的活动数据，用于热力图展示。

#### 请求

```http
GET /api/v1/stats/activity?period=7d
```

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| period | string | 否 | 7d | 时间范围：7d / 30d |

#### 响应

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "heatmap": {
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "hours": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      "data": [
        [0, 0, 0, 0, 0, 0, 1, 3, 8, 12, 15, 10, 8, 14, 16, 12, 10, 8, 5, 3, 2, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 2, 4, 10, 14, 18, 12, 9, 16, 18, 14, 12, 9, 6, 4, 3, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 2, 5, 9, 13, 16, 11, 8, 15, 17, 13, 11, 8, 5, 3, 2, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 2, 4, 11, 15, 19, 13, 10, 17, 19, 15, 13, 10, 7, 4, 3, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 3, 8, 11, 14, 9, 7, 12, 14, 10, 8, 6, 4, 2, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 4, 3, 5, 6, 4, 3, 2, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 5, 3, 2, 4, 5, 3, 2, 1, 0, 0, 0, 0, 0, 0]
      ]
    },
    "peak_hours": [
      {"hour": 14, "avg_activity": 15.6},
      {"hour": 10, "avg_activity": 14.7},
      {"hour": 15, "avg_activity": 13.0}
    ],
    "summary": {
      "total_sessions": 425,
      "most_active_day": "Thu",
      "most_active_hour": 14
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

### 3.8 导出数据

导出指定范围的统计数据为 CSV 或 JSON 格式。

#### 请求

```http
POST /api/v1/export
Content-Type: application/json

{
  "format": "csv",
  "start_date": "2026-01-01",
  "end_date": "2026-01-06",
  "include_fields": ["date", "total_tokens", "cost_usd", "cache_hit_rate"],
  "granularity": "day"
}
```

#### 请求体参数

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| format | string | 是 | - | 导出格式：csv / json |
| start_date | string | 否 | 30天前 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 今天 | 结束日期（YYYY-MM-DD） |
| include_fields | array | 否 | 全部 | 包含字段列表 |
| granularity | string | 否 | day | 粒度：day / hour |
| include_models | boolean | 否 | true | 是否包含模型明细 |

#### 可选字段（include_fields）

- `date` - 日期
- `total_tokens` - 总 token 数
- `input_tokens` - 输入 token 数
- `output_tokens` - 输出 token 数
- `cache_read_tokens` - 缓存读取 token 数
- `cache_write_tokens` - 缓存写入 token 数
- `cost_usd` - 费用（美元）
- `cache_hit_rate` - 缓存命中率
- `session_count` - 会话数

#### 响应（CSV 格式）

```http
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="claude-token-stats-2026-01-01-to-2026-01-06.csv"

date,total_tokens,cost_usd,cache_hit_rate
2026-01-01,96000,1.65,0.35
2026-01-02,115000,1.92,0.37
2026-01-03,102500,1.78,0.36
2026-01-04,122500,2.05,0.38
2026-01-05,108000,1.85,0.36
2026-01-06,108000,1.85,0.36
```

#### 响应（JSON 格式）

```json
{
  "success": true,
  "data": {
    "format": "json",
    "generated_at": "2026-01-06T10:30:00Z",
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-01-06"
    },
    "records": [
      {
        "date": "2026-01-01",
        "total_tokens": 96000,
        "cost_usd": 1.65,
        "cache_hit_rate": 0.35
      }
      // ... 更多记录
    ],
    "summary": {
      "record_count": 6,
      "total_tokens": 652000,
      "total_cost_usd": 11.10
    }
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

### 3.9 获取配置信息

获取当前系统配置。

#### 请求

```http
GET /api/v1/config
```

#### 响应

```json
{
  "success": true,
  "data": {
    "data_source": {
      "claude_dir": "/Users/xxx/.claude",
      "stats_file": "stats-cache.json"
    },
    "polling": {
      "interval_seconds": 30
    },
    "pricing": {
      "claude-opus-4-5": {
        "input_per_million": 15.0,
        "output_per_million": 75.0,
        "cache_read_per_million": 1.5,
        "cache_write_per_million": 18.75
      },
      "claude-sonnet-4-5": {
        "input_per_million": 3.0,
        "output_per_million": 15.0,
        "cache_read_per_million": 0.3,
        "cache_write_per_million": 3.75
      },
      "claude-haiku-4-5": {
        "input_per_million": 0.8,
        "output_per_million": 4.0,
        "cache_read_per_million": 0.08,
        "cache_write_per_million": 1.0
      }
    },
    "database": {
      "retention_days": 90,
      "snapshot_interval_minutes": 30
    },
    "version": "1.0.0"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

## 四、WebSocket 接口

### 4.1 连接地址

```
ws://localhost:{PORT}/api/v1/ws
```

### 4.2 连接建立

```javascript
const ws = new WebSocket('ws://localhost:51888/api/v1/ws');

ws.onopen = () => {
  console.log('WebSocket 连接已建立');
};
```

### 4.3 消息格式

#### 服务端推送消息

```json
{
  "type": "stats_update",
  "data": {
    "total_input_tokens": 1250000,
    "total_output_tokens": 450000,
    "total_cache_read_tokens": 800000,
    "total_cache_write_tokens": 200000,
    "total_cost_usd": 45.67,
    "cache_hit_rate": 0.356,
    "updated_at": "2026-01-06T10:30:00Z"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 消息类型

| type | 描述 |
|------|------|
| `stats_update` | 统计数据更新 |
| `heartbeat` | 心跳消息 |
| `error` | 错误消息 |
| `connected` | 连接成功确认 |

#### 心跳消息

服务端每 30 秒发送一次心跳：

```json
{
  "type": "heartbeat",
  "timestamp": "2026-01-06T10:30:00Z"
}
```

客户端应在收到心跳后回复 pong：

```json
{
  "type": "pong"
}
```

#### 连接成功消息

```json
{
  "type": "connected",
  "data": {
    "client_id": "abc123",
    "server_time": "2026-01-06T10:30:00Z"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 错误消息

```json
{
  "type": "error",
  "data": {
    "code": "PARSE_ERROR",
    "message": "无法解析数据文件"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

### 4.4 客户端示例

```javascript
/**
 * WebSocket 客户端示例
 */
class TokenMonitorWS {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('连接成功');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('连接关闭');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('已连接, 客户端 ID:', message.data.client_id);
        break;
      case 'stats_update':
        this.onStatsUpdate(message.data);
        break;
      case 'heartbeat':
        this.ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'error':
        console.error('服务器错误:', message.data.message);
        break;
    }
  }

  onStatsUpdate(data) {
    // 更新 UI
    console.log('收到统计更新:', data);
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`${delay}ms 后尝试重连...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用示例
const monitor = new TokenMonitorWS('ws://localhost:51888/api/v1/ws');
monitor.connect();
```

---

## 五、TypeScript 类型定义

### 5.1 请求/响应类型

```typescript
/**
 * @file types.ts
 * @description API 类型定义
 * @author Atlas.oi
 * @date 2026-01-06
 */

// ============================================
// 基础类型
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

// ============================================
// 统计相关类型
// ============================================

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  total_tokens: number;
}

export interface StatsSummary extends TokenUsage {
  total_cost_usd: number;
  cache_hit_rate: number;
  last_updated: string;
}

export interface DailyStats extends TokenUsage {
  date: string;
  cost_usd: number;
  cache_hit_rate: number;
  session_count: number;
}

export interface ModelStats extends TokenUsage {
  model_name: string;
  display_name: string;
  cost_usd: number;
  cache_hit_rate: number;
  usage_percentage: number;
  cost_percentage: number;
}

export interface TrendData {
  period: string;
  granularity: string;
  series: {
    labels: string[];
    tokens: {
      input: number[];
      output: number[];
      cache_read: number[];
      cache_write: number[];
      total: number[];
    };
    cost: number[];
    cache_hit_rate: number[];
  };
  statistics: {
    tokens: { min: number; max: number; avg: number; total: number };
    cost: { min: number; max: number; avg: number; total: number };
    cache_hit_rate: { min: number; max: number; avg: number };
  };
}

export interface ActivityHeatmap {
  period: string;
  heatmap: {
    days: string[];
    hours: number[];
    data: number[][];
  };
  peak_hours: Array<{ hour: number; avg_activity: number }>;
  summary: {
    total_sessions: number;
    most_active_day: string;
    most_active_hour: number;
  };
}

// ============================================
// 导出相关类型
// ============================================

export interface ExportRequest {
  format: 'csv' | 'json';
  start_date?: string;
  end_date?: string;
  include_fields?: string[];
  granularity?: 'day' | 'hour';
  include_models?: boolean;
}

// ============================================
// WebSocket 消息类型
// ============================================

export type WSMessageType = 'connected' | 'stats_update' | 'heartbeat' | 'error';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  data?: T;
  timestamp: string;
}

export interface WSStatsUpdate extends TokenUsage {
  total_cost_usd: number;
  cache_hit_rate: number;
  updated_at: string;
}

// ============================================
// 配置类型
// ============================================

export interface ModelPricing {
  input_per_million: number;
  output_per_million: number;
  cache_read_per_million: number;
  cache_write_per_million: number;
}

export interface AppConfig {
  data_source: {
    claude_dir: string;
    stats_file: string;
  };
  polling: {
    interval_seconds: number;
  };
  pricing: Record<string, ModelPricing>;
  database: {
    retention_days: number;
    snapshot_interval_minutes: number;
  };
  version: string;
}
```

---

## 六、错误处理

### 6.1 HTTP 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 6.2 错误响应示例

#### 参数错误

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "start_date 格式无效，应为 YYYY-MM-DD"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

#### 数据文件不存在

```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "stats-cache.json 文件不存在"
  },
  "timestamp": "2026-01-06T10:30:00Z"
}
```

---

## 七、CORS 配置

### 7.1 允许的源

开发环境：
- `http://localhost:*`
- `http://127.0.0.1:*`

生产环境：
- 由 Docker 同域部署，无需额外 CORS 配置

### 7.2 响应头

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

---

## 八、性能指标

| 指标 | 目标值 |
|------|--------|
| API 响应时间 (P99) | < 200ms |
| WebSocket 消息延迟 | < 100ms |
| 并发连接数 | > 100 |
| 吞吐量 | > 1000 req/s |

---

## 九、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-01-06 | 初始版本 |

---

*文档版本：1.0.0*
*最后更新：2026-01-06*
