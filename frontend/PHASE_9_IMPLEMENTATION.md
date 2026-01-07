# Phase 9 实现说明

## 完成的功能模块

### FE-4.1: statsStore (统计数据存储)
**文件**: `/frontend/src/lib/stores/statsStore.ts`

**功能**:
- 管理 Token 使用统计数据（当前数据、每日活动、汇总数据）
- 支持时间范围选择（week/month/quarter/all）
- 提供加载状态和错误处理
- 包含 11 个派生 stores：
  - `isLoading` - 是否正在加载
  - `hasError` - 是否有错误
  - `hasData` - 是否有数据
  - `totalTokens` - 总 Token 数
  - `totalCost` - 总费用
  - `topModel` - 最常用的模型
  - `sortedDailyActivities` - 排序后的每日活动
  - `cacheEfficiency` - 缓存效率百分比
  - `dataFreshness` - 数据新鲜度（分钟）
  - `needsRefresh` - 是否需要刷新（超过 5 分钟）
  - `getModelUsageList(sortBy)` - 获取排序的模型使用列表
  - `getRecentActivities(days)` - 获取最近 N 天的活动

**使用示例**:
```typescript
import { statsStore, totalTokens, isLoading } from '$lib/stores';

// 设置统计数据
statsStore.setCurrent(data);

// 订阅状态
$: tokens = $totalTokens;
$: loading = $isLoading;
```

---

### FE-4.2: wsStore (WebSocket 状态存储)
**文件**: `/frontend/src/lib/stores/wsStore.ts`

**功能**:
- 管理 WebSocket 连接状态（connecting/connected/disconnected/error/reconnecting）
- 存储实时推送的数据（统计数据、每日活动、通知）
- 支持重连逻辑状态追踪（指数退避算法）
- 提供 10 个派生 stores：
  - `isConnected` - 是否已连接
  - `isConnecting` - 是否正在连接
  - `isDisconnected` - 是否断开
  - `hasError` - 是否有错误
  - `canReconnect` - 是否可以重连
  - `connectionDuration` - 连接时长（秒）
  - `timeSinceLastMessage` - 距上次消息时间（秒）
  - `needsHeartbeat` - 是否需要心跳（超过 30 秒）
  - `reconnectStatus` - 重连状态描述
  - `connectionStatusText` - 连接状态文本

**连接状态枚举**:
- `CONNECTING` - 连接中
- `CONNECTED` - 已连接
- `DISCONNECTED` - 已断开
- `ERROR` - 连接错误
- `RECONNECTING` - 重连中

**消息类型枚举**:
- `STATS_UPDATE` - 统计数据更新
- `DAILY_ACTIVITY_UPDATE` - 每日活动更新
- `NOTIFICATION` - 系统通知
- `PONG` - 心跳响应
- `ERROR` - 错误消息

**使用示例**:
```typescript
import { wsStore, isConnected } from '$lib/stores';

// 设置连接状态
wsStore.setConnectionState(WsConnectionState.CONNECTED);

// 订阅连接状态
$: connected = $isConnected;
```

---

### FE-4.3: themeStore (主题存储)
**文件**: `/frontend/src/lib/stores/themeStore.ts`

**功能**:
- 支持三种主题模式：light/dark/system
- 自动持久化到 localStorage（键名: `claude-token-monitor-theme`）
- 自动监听系统主题变化（prefers-color-scheme）
- 自动应用主题到 DOM（更新 html class 和 data-theme 属性）
- 提供 8 个派生 stores：
  - `currentMode` - 当前主题模式
  - `appliedTheme` - 实际应用的主题（不含 system）
  - `isLight` - 是否为浅色主题
  - `isDark` - 是否为暗色主题
  - `isSystemMode` - 是否跟随系统
  - `systemPrefersDark` - 系统是否偏好暗色
  - `themeName` - 主题显示名称（浅色/暗色/跟随系统）
  - `themeIcon` - 主题图标 Font Awesome 类名

**API 方法**:
- `setMode(mode)` - 设置主题模式
- `setLight()` - 切换到浅色
- `setDark()` - 切换到暗色
- `setSystem()` - 切换到跟随系统
- `toggle()` - 在三种模式间循环切换
- `reapply()` - 重新应用主题（用于页面恢复）

**使用示例**:
```typescript
import { themeStore, isDark, themeName } from '$lib/stores';

// 切换主题
themeStore.toggle();

// 订阅主题状态
$: dark = $isDark;
$: name = $themeName;
```

---

### FE-4.4: API Service
**文件**: `/frontend/src/lib/services/api.ts`

**功能**:
- 封装所有后端 HTTP 请求
- 统一错误处理和类型安全
- 请求/响应拦截器
- 自动重试机制（最多 3 次，指数退避）
- 请求超时控制（默认 30 秒）
- 支持文件下载（导出功能）

**API 端点**:
```typescript
// 获取当前统计数据
getCurrentStats(): Promise<StatsCache>

// 获取每日活动数据
getDailyStats(startDate?, endDate?): Promise<DailyActivity[]>

// 获取历史统计数据
getHistoryStats(timeRange: TimeRange): Promise<StatsSummary>

// 导出统计数据
exportStats(params: ExportParams): Promise<Blob>

// 下载文件
downloadBlob(blob: Blob, filename: string): void

// 健康检查
healthCheck(): Promise<{ status: string; version: string }>
```

**配置**:
- 基础 URL: `http://localhost:51888` (可通过环境变量 `VITE_API_BASE_URL` 配置)
- API 版本: `v1`
- 请求超时: 30 秒
- 重试次数: 3 次
- 重试延迟: 1 秒（指数增长）
- 可重试状态码: [408, 429, 500, 502, 503, 504]

**使用示例**:
```typescript
import { apiClient, getCurrentStats } from '$lib/services';

// 方式 1: 直接调用函数
const stats = await getCurrentStats();

// 方式 2: 使用 apiClient 对象
const stats = await apiClient.stats.getCurrent();

// 导出数据
const blob = await apiClient.stats.export({
  format: ExportFormat.JSON,
  start_date: '2024-01-01',
  end_date: '2024-01-31',
});
apiClient.utils.downloadBlob(blob, 'stats.json');
```

**错误处理**:
```typescript
try {
  const stats = await getCurrentStats();
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message);
  console.error(apiError.code);
  console.error(apiError.status);
}
```

---

### FE-4.5: WebSocket Service
**文件**: `/frontend/src/lib/services/websocket.ts`

**功能**:
- WebSocket 连接管理（单例模式）
- 自动重连机制（指数退避，最多 10 次）
- 心跳检测（30 秒间隔，5 秒超时）
- 连接超时控制（10 秒）
- 消息解析和自动分发
- 与 wsStore 和 statsStore 自动集成

**API 方法**:
```typescript
const ws = getWebSocketService(options);

// 连接
ws.connect();

// 断开连接
ws.disconnect(manual = true);

// 重新连接
ws.reconnect();

// 发送消息
ws.send(type, data);

// 获取连接状态
ws.getReadyState();
ws.isConnected();

// 销毁实例
ws.destroy();
```

**配置选项**:
```typescript
interface WebSocketOptions {
  autoReconnect?: boolean;        // 自动重连，默认 true
  enableHeartbeat?: boolean;      // 启用心跳，默认 true
  connectionTimeout?: number;     // 连接超时（毫秒），默认 10000
  messageHandlers?: Partial<Record<WsMessageType, (data: unknown) => void>>;
}
```

**重连配置**:
- 最大重试次数: 10 次
- 初始延迟: 1 秒
- 最大延迟: 30 秒
- 延迟增长因子: 1.5 倍

**消息处理**:
服务会自动处理以下消息类型：
- `STATS_UPDATE` - 更新 statsStore 和 wsStore
- `DAILY_ACTIVITY_UPDATE` - 更新每日活动数据
- `NOTIFICATION` - 显示系统通知（支持浏览器通知）
- `PONG` - 心跳响应
- `ERROR` - 错误消息

**使用示例**:
```typescript
import { getWebSocketService } from '$lib/services';

// 在页面加载时连接
onMount(() => {
  const ws = getWebSocketService({
    autoReconnect: true,
    enableHeartbeat: true,
  });
  ws.connect();

  return () => {
    ws.disconnect();
  };
});
```

**自定义消息处理**:
```typescript
const ws = getWebSocketService({
  messageHandlers: {
    [WsMessageType.NOTIFICATION]: (data) => {
      console.log('自定义通知处理:', data);
    },
  },
});
```

---

## 文件结构

```
frontend/src/lib/
├── stores/
│   ├── index.ts              # 统一导出
│   ├── statsStore.ts         # 统计数据存储
│   ├── wsStore.ts            # WebSocket 状态存储
│   └── themeStore.ts         # 主题存储
├── services/
│   ├── index.ts              # 统一导出
│   ├── api.ts                # HTTP API 服务
│   └── websocket.ts          # WebSocket 服务
└── types/
    ├── index.ts              # 类型统一导出
    ├── stats.ts              # 统计数据类型
    ├── api.ts                # API 类型
    └── chart.ts              # 图表类型
```

---

## 完整使用示例

### 1. 在组件中使用 Stores

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    statsStore,
    totalTokens,
    totalCost,
    isLoading,
    wsStore,
    isConnected,
    themeStore,
    isDark
  } from '$lib/stores';
  import { apiClient, getWebSocketService } from '$lib/services';

  // 订阅状态
  $: tokens = $totalTokens;
  $: cost = $totalCost;
  $: loading = $isLoading;
  $: connected = $isConnected;
  $: darkMode = $isDark;

  // 初始化
  onMount(async () => {
    // 获取初始数据
    try {
      statsStore.setStatus(ApiStatus.LOADING);
      const stats = await apiClient.stats.getCurrent();
      statsStore.setCurrent(stats);
    } catch (error) {
      statsStore.setError(error.message);
    }

    // 连接 WebSocket
    const ws = getWebSocketService();
    ws.connect();

    return () => {
      ws.disconnect();
    };
  });

  // 切换主题
  function handleThemeToggle() {
    themeStore.toggle();
  }
</script>

<div>
  <h1>Token 使用统计</h1>

  <div>
    <p>总 Tokens: {tokens.toLocaleString()}</p>
    <p>总费用: ${cost.toFixed(2)}</p>
  </div>

  {#if loading}
    <p>加载中...</p>
  {/if}

  <div>
    WebSocket: {connected ? '已连接' : '未连接'}
  </div>

  <button on:click={handleThemeToggle}>
    切换主题 ({darkMode ? '暗色' : '浅色'})
  </button>
</div>
```

### 2. 导出数据示例

```typescript
import { apiClient, ExportFormat } from '$lib/services';

async function exportToExcel() {
  try {
    const blob = await apiClient.stats.export({
      format: ExportFormat.EXCEL,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      include_details: true,
    });

    const filename = `stats_${new Date().toISOString().split('T')[0]}.xlsx`;
    apiClient.utils.downloadBlob(blob, filename);
  } catch (error) {
    console.error('导出失败:', error);
  }
}
```

---

## TypeScript 类型检查

运行类型检查:
```bash
cd frontend
pnpm run check
```

所有代码已通过 TypeScript 类型检查，无错误。

---

## 注意事项

1. **Svelte 4 语法**:
   - 使用 `export let` 声明 props
   - 使用 `$:` 进行响应式声明
   - 使用 `writable/readable/derived` stores
   - 使用 `on:click` 事件处理

2. **环境变量配置**:
   在 `.env` 文件中配置:
   ```env
   VITE_API_BASE_URL=http://localhost:51888
   VITE_WS_URL=ws://localhost:51888/ws
   ```

3. **浏览器通知权限**:
   WebSocket 服务支持浏览器通知，需要用户授权:
   ```typescript
   if ('Notification' in window) {
     Notification.requestPermission();
   }
   ```

4. **localStorage 持久化**:
   - themeStore 使用键名 `claude-token-monitor-theme`
   - 存储的值为 `'light' | 'dark' | 'system'`

5. **WebSocket 重连策略**:
   - 手动断开连接后不会自动重连
   - 自动断开会触发重连（最多 10 次）
   - 延迟时间指数增长（1s → 1.5s → 2.25s ... 最多 30s）

---

## 下一步

所有状态管理和服务层已完成，可以开始集成到页面组件中使用。建议的集成顺序：

1. 在 `+layout.svelte` 中初始化 themeStore
2. 在主页面中初始化 statsStore 和 WebSocket 连接
3. 在各个组件中使用派生 stores 展示数据
4. 添加错误处理和加载状态展示
