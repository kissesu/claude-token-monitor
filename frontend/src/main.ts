/**
 * @file 应用入口文件
 * @description Svelte 应用的主入口，负责挂载根组件
 * @author Atlas.oi
 * @date 2026-01-07
 */

import './app.css';
import App from './App.svelte';

// 创建并挂载 Svelte 应用到 #app 元素
const app = new App({
  target: document.getElementById('app')!,
});

export default app;
