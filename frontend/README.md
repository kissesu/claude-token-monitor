# Claude Token Monitor - 前端

基于 Svelte + TypeScript + Skeleton UI 的现代化前端应用。

## 技术栈

- **Svelte 4.2** - 响应式前端框架
- **TypeScript 5.3** - 类型安全
- **Vite 5.0** - 极速构建工具
- **Skeleton UI 2.10** - UI 组件库
- **Layerchart 1.0** - 数据可视化
- **Tailwind CSS 3.4** - 样式框架

## 项目结构

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte 组件
│   │   ├── stores/         # Svelte stores（状态管理）
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型定义
│   │   └── utils/          # 工具函数
│   ├── App.svelte          # 主应用组件
│   ├── main.ts             # 应用入口
│   └── app.css             # 全局样式
├── tests/                  # 测试文件
├── index.html              # HTML 模板
├── vite.config.ts          # Vite 配置
├── svelte.config.js        # Svelte 配置
├── tsconfig.json           # TypeScript 配置
├── tailwind.config.js      # Tailwind 配置
└── package.json            # 项目配置
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 51173）
pnpm dev

# 类型检查
pnpm check

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 运行测试
pnpm test
```

## 开发规范

- 所有代码使用中文注释
- 文件头包含作者署名（Atlas.oi）和日期
- 遵循 TypeScript 严格模式
- 使用 ESLint + Prettier 保证代码质量
- 组件采用 Svelte 单文件组件（.svelte）格式

## 主题支持

项目默认使用暗色主题，支持浅色/暗色主题切换：
- 主题切换通过 HTML `class="dark"` 实现
- Tailwind CSS `dark:` 前缀自动应用暗色样式
- 主题色定义在 `app.css` 中的 CSS 变量

## 类型定义

所有 TypeScript 类型定义位于 `src/lib/types/` 目录：
- `stats.ts` - Token 统计数据类型
- `api.ts` - API 请求/响应类型
- `chart.ts` - 图表相关类型
- `index.ts` - 统一导出入口

## 开发服务器

开发服务器运行在 **端口 51173**：
- Local: http://localhost:51173/
- Network: http://[IP]:51173/

## 注意事项

- 仅使用 **pnpm** 作为包管理器，禁止使用 npm
- Node.js 版本要求 >= 18.0.0
- 开发时建议使用 Volta 管理 Node.js 版本
