/**
 * @file tech-stack.md
 * @description Claude Token Monitor 技术栈总结
 * @author Atlas.oi
 * @date 2026-01-06
 */

# Claude Token Monitor - 技术栈总结

## 前端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| **Svelte** | 4.x | 前端框架 | 编译时优化,零运行时开销,打包体积仅 ~5KB |
| **Vite** | 5.x | 构建工具 | 快速热更新,ESM 原生支持 |
| **TypeScript** | 5.x | 类型系统 | 类型安全,代码提示 |
| **Layerchart** | 0.x | 图表库 | Svelte 原生,基于 D3,性能优秀 |
| **Skeleton UI** | 2.x | UI 框架 | Tailwind CSS 集成,组件丰富 |
| **Tailwind CSS** | 3.x | CSS 框架 | 实用优先,响应式设计 |

## 后端技术栈

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|----------|
| **Python** | 3.11+ | 后端语言 | 生态丰富,异步支持良好 |
| **aiohttp** | 3.x | Web 框架 | 异步高性能,WebSocket 支持 |
| **SQLite** | 3.x | 数据库 | 轻量级,无需额外服务 |
| **watchdog** | 3.x | 文件监听 | 跨平台文件变化监听 |

## 部署技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Docker** | 24.x | 容器化 |
| **Docker Compose** | 2.x | 容器编排 |

## 核心依赖

### 前端 package.json

```json
{
  "name": "claude-token-monitor-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": {
    "svelte": "^4.2.0",
    "@sveltejs/kit": "^2.0.0",
    "layerchart": "^0.40.0",
    "@skeletonlabs/skeleton": "^2.10.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@tsconfig/svelte": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "svelte-check": "^3.6.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 后端 requirements.txt

```
aiohttp==3.9.1
aiohttp-cors==0.7.0
watchdog==3.0.0
python-dateutil==2.8.2
```

## 框架对比

### 为什么选择 Svelte

| 对比项 | Svelte | Vue 3 | React | Next.js |
|--------|--------|-------|-------|---------|
| **打包体积** (gzip) | ~5KB | ~30KB | ~45KB | ~80KB |
| **运行时开销** | 无 | 有 | 有 | 有 |
| **响应式实现** | 编译时 | Proxy | useState | useState |
| **学习曲线** | 低 | 中 | 中 | 高 |
| **首屏渲染** | 最快 | 快 | 中 | 快 |
| **适合仪表板** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

### 为什么选择 Layerchart

| 对比项 | Layerchart | ECharts | Chart.js | Recharts |
|--------|-----------|---------|----------|----------|
| **Svelte 集成** | 原生 | 需封装 | 需封装 | 不支持 |
| **性能** | 优秀 (D3) | 良好 | 中等 | 中等 |
| **打包体积** | 小 | 大 (~1MB) | 中 | 中 |
| **可定制性** | 高 | 高 | 中 | 中 |
| **TypeScript** | 完整 | 完整 | 部分 | 完整 |

### 为什么选择 aiohttp

| 对比项 | aiohttp | FastAPI | Flask | Django |
|--------|---------|---------|-------|--------|
| **异步支持** | 原生 | 原生 | 有限 | 有限 |
| **WebSocket** | 内置 | 需 uvicorn | 需扩展 | 需扩展 |
| **性能** | 优秀 | 优秀 | 中等 | 中等 |
| **学习曲线** | 中 | 低 | 低 | 高 |
| **适合本项目** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## 架构图

```
┌─────────────────────────────────────────────────────┐
│              Docker Container                        │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │   Svelte 前端    │◄──►│  aiohttp 后端    │      │
│  │   (静态文件)     │    │  (API Server)    │      │
│  │   Port: 8080     │    │  + WebSocket     │      │
│  └──────────────────┘    └────────┬─────────┘      │
│                                    │                 │
│                          ┌────────▼─────────┐       │
│                          │   文件监听器      │       │
│                          │   (watchdog)      │       │
│                          └────────┬─────────┘       │
│                                    │                 │
└────────────────────────────────────│─────────────────┘
                                     │ Volume Mount (readonly)
                                     ▼
                              ~/.claude/
                              ├── stats-cache.json
                              └── projects/
                                  └── *.jsonl
```

## 性能指标

| 指标 | 目标值 | 实际测试 |
|------|--------|----------|
| **首屏加载时间** | < 2s | TBD |
| **打包体积** (gzip) | < 100KB | TBD |
| **WebSocket 延迟** | < 100ms | TBD |
| **图表渲染时间** | < 200ms | TBD |
| **内存占用** | < 200MB | TBD |
| **Docker 镜像大小** | < 500MB | TBD |

## 开发环境

- Node.js: 18.x+
- Python: 3.11+
- Docker: 24.x+
- pnpm: 8.x+

## 生产环境

- Alpine Linux (Docker 基础镜像)
- Nginx (可选,用于反向代理)

---

*文档版本: 1.0.0*
*最后更新: 2026-01-06*
*作者: Atlas.oi*
