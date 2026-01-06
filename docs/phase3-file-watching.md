# Phase 3: 文件监听与实时更新功能

## 功能概述

完成了后端的文件监听和 WebSocket 实时推送功能，实现了以下核心能力：

### BE-3.1: 文件监听器 (`file_watcher.py`)

**核心功能**：
- 使用 `watchdog` 库监听 `~/.claude/` 目录下的文件变化
- 支持监听 `.json` 和 `.jsonl` 文件
- 防抖机制（500ms）避免频繁触发
- 异步回调通知
- 优雅停止和资源清理

**主要类**：
1. `DebouncedFileHandler` - 防抖文件事件处理器
   - 避免短时间内重复触发
   - 支持自定义防抖时间
   - 支持文件类型过滤

2. `FileWatcher` - 文件监听器主类
   - `start_watching()` - 启动监听
   - `stop_watching()` - 停止监听
   - `is_running()` - 检查运行状态
   - 支持异步回调函数

**验收标准**：
- ✅ 文件变化能在 1 秒内检测到
- ✅ 防抖机制正常工作
- ✅ 优雅停止无资源泄漏

### BE-3.2: WebSocket 处理器 (`websocket.py`)

**核心功能**：
- 管理 WebSocket 连接（连接、断开、广播）
- 发送统计数据更新消息
- 心跳机制保持连接活跃（30 秒间隔）
- 自动清理断开的连接
- 支持多客户端并发连接

**主要类**：
1. `ConnectionManager` - 连接管理器
   - `connect()` - 接受新连接
   - `disconnect()` - 断开连接
   - `broadcast()` - 向所有客户端广播消息
   - `send_stats_update()` - 发送统计更新
   - `handle_heartbeat()` - 处理心跳
   - `cleanup()` - 清理所有连接

**WebSocket 消息格式**：
```json
{
  "type": "stats_update" | "heartbeat" | "error" | "connected" | "pong",
  "data": { ... },
  "timestamp": "2026-01-07T12:00:00Z"
}
```

**支持的消息类型**：
- `connected` - 连接成功
- `heartbeat` - 心跳消息
- `stats_update` - 统计数据更新
- `ping/pong` - 连接测试
- `error` - 错误消息

**验收标准**：
- ✅ WebSocket 连接稳定
- ✅ 支持多客户端
- ✅ 心跳机制正常工作
- ✅ 消息实时推送

## 集成到 main.py

应用生命周期管理：
- **启动时**：
  1. 初始化连接管理器
  2. 启动文件监听器
  3. 注册文件变化回调（自动通过 WebSocket 广播）

- **关闭时**：
  1. 停止文件监听器
  2. 清理所有 WebSocket 连接

## 测试

### 单元测试和集成测试

```bash
# 运行文件监听器测试
pytest backend/tests/test_file_watcher.py -v

# 运行 WebSocket 测试
pytest backend/tests/test_websocket.py -v

# 运行所有测试
pytest backend/tests/ -v
```

**测试覆盖**：
- ✅ 文件监听器初始化
- ✅ 文件变化检测
- ✅ 防抖机制
- ✅ 多文件变化
- ✅ 优雅停止
- ✅ WebSocket 连接管理
- ✅ 消息发送和广播
- ✅ 心跳机制
- ✅ 多客户端支持
- ✅ 错误处理和清理

**测试结果**：
- 21 个测试全部通过
- 代码覆盖率：
  - `file_watcher.py`: 76.70%
  - `websocket.py`: 85.21%

### 集成测试

```bash
# 1. 启动后端服务
cd backend
python -m app.main

# 2. 在另一个终端运行集成测试
python test_integration.py
```

## 使用示例

### 启动后端服务

```bash
cd backend
python -m app.main
```

服务将在 `http://localhost:51888` 启动，WebSocket 端点为 `/ws`

### 客户端连接示例

```python
import asyncio
import websockets
import json

async def connect_to_monitor():
    uri = "ws://localhost:51888/ws?client_id=my_client"

    async with websockets.connect(uri) as websocket:
        # 接收欢迎消息
        welcome = await websocket.recv()
        print(f"欢迎: {json.loads(welcome)}")

        # 持续接收消息
        while True:
            message = await websocket.recv()
            data = json.loads(message)

            if data['type'] == 'stats_update':
                print(f"统计更新: {data['data']}")
            elif data['type'] == 'heartbeat':
                print("心跳")

asyncio.run(connect_to_monitor())
```

## 文件结构

```
backend/
├── app/
│   ├── core/
│   │   ├── file_watcher.py    # 文件监听器
│   │   ├── config.py          # 配置管理
│   │   ├── logger.py          # 日志系统
│   │   └── schemas.py         # 数据模型
│   ├── api/
│   │   └── websocket.py       # WebSocket 处理器
│   └── main.py                # 应用入口（已集成）
├── tests/
│   ├── test_file_watcher.py   # 文件监听器测试
│   └── test_websocket.py      # WebSocket 测试
└── test_integration.py        # 集成测试脚本
```

## 技术栈

- **Python 3.11+**
- **FastAPI** - Web 框架
- **WebSocket** - 实时通信
- **watchdog** - 文件监听
- **Pydantic v2** - 数据验证
- **pytest** - 测试框架

## 性能指标

- **文件变化检测延迟**: < 1 秒
- **防抖时间**: 500ms
- **心跳间隔**: 30 秒
- **支持并发连接**: 理论无限制（实际受系统资源限制）
- **消息广播延迟**: < 100ms

## 注意事项

1. **文件监听范围**：
   - 监听整个 `~/.claude/` 目录及其子目录
   - 仅处理 `.json` 和 `.jsonl` 文件
   - 忽略目录修改事件

2. **WebSocket 连接**：
   - 客户端应实现重连机制
   - 心跳超时建议设置为 60 秒
   - 连接断开会自动清理

3. **资源清理**：
   - 应用关闭时会优雅停止文件监听
   - 所有 WebSocket 连接会被正确关闭
   - 防抖定时器会被取消

## 后续优化建议

1. **性能优化**：
   - 实现连接池管理
   - 添加消息队列缓冲
   - 实现消息压缩

2. **功能增强**：
   - 支持客户端订阅特定文件
   - 添加消息过滤和路由
   - 实现消息持久化

3. **监控和日志**：
   - 添加性能指标监控
   - 实现详细的错误追踪
   - 添加连接状态监控面板

## 变更日志

- **2026-01-07**: Phase 3 完成
  - 实现文件监听器 (BE-3.1)
  - 实现 WebSocket 处理器 (BE-3.2)
  - 集成到 main.py
  - 编写完整测试套件
  - 所有测试通过
