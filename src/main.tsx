/**
 * @file React 应用入口
 * @description Tauri 桌面应用的 React 入口文件
 * @author Atlas.oi
 * @date 2026-01-08
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
