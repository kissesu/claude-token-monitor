/**
 * @file useTheme.ts
 * @description 主题管理 Hook，支持 light/dark/system 三种模式，持久化到 localStorage
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

/**
 * 安全读取 localStorage
 * @param key - 存储键名
 * @param fallback - 读取失败时的默认值
 * @returns 存储的值或默认值
 */
function safeGetItem<T extends string>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(key);
      return (value as T) || fallback;
    }
  } catch (error) {
    // localStorage 可能在隐私模式下被禁用
    console.warn(`localStorage 读取失败 [${key}]:`, error);
  }
  return fallback;
}

/**
 * 安全写入 localStorage
 * @param key - 存储键名
 * @param value - 要存储的值
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // localStorage 可能已满或在隐私模式下被禁用
    console.warn(`localStorage 写入失败 [${key}]:`, error);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => safeGetItem('theme', 'system'));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    safeSetItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
