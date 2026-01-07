# 前端性能优化使用指南

本文档说明如何使用和维护前端性能优化配置。

---

## 📦 构建命令

### 标准生产构建
```bash
pnpm build
```
- 输出目录: `dist/`
- 包含 gzip 和 brotli 压缩文件
- 生成 `stats.html` bundle 分析报告

### 构建并查看分析报告
```bash
pnpm build:analyze
```
- 构建完成后自动打开 bundle 可视化分析

### 预览生产构建
```bash
pnpm preview
```
- 在 http://localhost:4173 启动预览服务器
- 用于本地测试生产构建结果

---

## 🔍 性能测试

### Lighthouse 测试
```bash
# 自动构建 + 预览 + Lighthouse 测试
pnpm lighthouse
```

### 手动 Lighthouse 测试
```bash
# 1. 构建应用
pnpm build

# 2. 启动预览服务器
pnpm preview --port 51174 &

# 3. 运行 Lighthouse
lighthouse http://localhost:51174 \
  --output=html \
  --output-path=./lighthouse-report.html \
  --only-categories=performance \
  --view
```

---

## 📊 Bundle 分析

### 查看 Bundle 组成
构建后打开 `dist/stats.html` 查看:
- 各模块的实际大小
- gzip/brotli 压缩后大小
- 依赖关系树状图

### 分析要点
1. **识别大体积依赖**: 查找 > 100KB 的模块
2. **检查重复依赖**: 相同库被多次打包
3. **评估懒加载效果**: 检查 chunk 分割是否合理

---

## ⚙️ 配置说明

### vite.config.ts 关键配置

#### 1. 代码分割策略
```typescript
manualChunks: (id) => {
  // Svelte 核心 - 首屏必需
  if (id.includes('node_modules/svelte')) {
    return 'svelte-runtime';
  }

  // 图表库 - 懒加载
  if (id.includes('layerchart') || id.includes('d3')) {
    return 'charts';
  }

  // 其他第三方库
  if (id.includes('node_modules')) {
    return 'vendor';
  }
}
```

**修改建议**:
- 添加新的大型依赖时，考虑单独拆分 chunk
- 保持首屏 chunk < 50KB (gzip)

#### 2. 静态资源内联阈值
```typescript
assetsInlineLimit: 4096  // 4KB
```

**修改建议**:
- 小图标建议内联 (< 4KB)
- 大图片使用外部文件

#### 3. Tree-shaking 配置
```typescript
treeshake: {
  moduleSideEffects: 'no-external',
  annotations: true,
}
```

**注意**: 修改此配置可能影响某些第三方库的行为

---

## 🎯 性能目标

维护以下性能标准:

| 指标 | 目标值 | 当前值 |
|------|-------|--------|
| Performance Score | > 90 | 100 ✅ |
| FCP | < 1.2s | 1.1s ✅ |
| LCP | < 2.5s | 1.7s ✅ |
| 首屏体积 (gzip) | < 100KB | 27.54KB ✅ |

---

## 🔧 优化建议

### 添加新依赖时
1. 检查依赖体积: `npm info <package-name> dist.unpackedSize`
2. 寻找轻量级替代方案
3. 评估是否需要懒加载
4. 构建后运行 `pnpm build:analyze` 检查影响

### 添加新组件时
1. 大型组件使用动态 import
2. 使用 `LazyLoad` 包装器延迟加载
3. 避免在首屏加载非关键组件

### 图片优化
1. 使用现代格式 (WebP/AVIF)
2. 提供多种尺寸 (响应式图片)
3. 懒加载非首屏图片
4. 小图标考虑 SVG 或内联

---

## 📈 监控与维护

### 定期检查 (每月)
```bash
# 1. 运行性能测试
pnpm lighthouse

# 2. 检查 bundle 体积
pnpm build:analyze

# 3. 验证目标达成
# - Performance Score > 90
# - FCP < 1.2s
# - LCP < 2.5s
```

### 性能退化时
1. 使用 `git bisect` 找到引入问题的提交
2. 检查 `dist/stats.html` 找到体积增加的模块
3. 评估是否可以懒加载或使用更轻量的替代方案

---

## 🚀 部署优化

### 服务器配置
1. **启用 Gzip/Brotli 压缩**
   ```nginx
   gzip on;
   gzip_types text/css application/javascript;
   brotli on;
   brotli_types text/css application/javascript;
   ```

2. **配置缓存策略**
   ```nginx
   # 带 hash 的资源永久缓存
   location /assets/ {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }

   # HTML 不缓存
   location / {
     expires -1;
     add_header Cache-Control "no-store, no-cache, must-revalidate";
   }
   ```

3. **启用 HTTP/2**
   ```nginx
   listen 443 ssl http2;
   ```

### CDN 配置
1. 将 `dist/assets/` 上传到 CDN
2. 更新 `index.html` 中的资源路径
3. 配置 CORS 头

---

## 📝 故障排查

### 构建失败
```bash
# 清理缓存重新构建
rm -rf node_modules/.vite dist
pnpm install
pnpm build
```

### 性能测试失败
```bash
# 确保端口未被占用
lsof -ti:51174 | xargs kill -9

# 重新测试
pnpm lighthouse
```

### Bundle 体积过大
1. 检查 `dist/stats.html`
2. 识别大体积模块
3. 考虑:
   - 懒加载
   - 使用更轻量的替代库
   - 按需导入 (tree-shaking)

---

## 📚 相关资源

- [Vite 性能优化指南](https://vitejs.dev/guide/performance.html)
- [Lighthouse 评分计算](https://web.dev/performance-scoring/)
- [Web Vitals 指标说明](https://web.dev/vitals/)
- [Bundle 优化最佳实践](https://web.dev/reduce-javascript-payloads-with-code-splitting/)

---

**最后更新**: 2026-01-07
**维护者**: Atlas.oi
