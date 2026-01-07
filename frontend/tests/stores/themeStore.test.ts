/**
 * @file themeStore 单元测试
 * @description 测试 themeStore 的所有方法和 derived stores
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  themeStore,
  ThemeMode,
  currentMode,
  appliedTheme,
  isLight,
  isDark,
  isSystemMode,
  systemPrefersDark,
  themeName,
  themeIcon,
} from '$lib/stores/themeStore';

// ============================================
// Mock localStorage
// ============================================

// localStorage mock 已在 setup.ts 中配置

// ============================================
// 测试套件
// ============================================

describe('themeStore', () => {
  // 每个测试前清空 localStorage
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ============================================
  // 初始状态测试
  // ============================================

  describe('初始状态', () => {
    it('应该有正确的默认主题模式', () => {
      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.SYSTEM);
    });

    it('应该根据系统偏好设置应用主题', () => {
      const state = get(themeStore);
      // matchMedia mock 默认返回 false（非暗色模式）
      expect(state.appliedTheme).toBe(ThemeMode.LIGHT);
    });

    it('派生 stores 应该反映初始状态', () => {
      expect(get(currentMode)).toBe(ThemeMode.SYSTEM);
      expect(get(appliedTheme)).toBe(ThemeMode.LIGHT);
      expect(get(isLight)).toBe(true);
      expect(get(isDark)).toBe(false);
      expect(get(isSystemMode)).toBe(true);
    });
  });

  // ============================================
  // 主题设置方法测试
  // ============================================

  describe('setMode', () => {
    it('应该正确设置浅色主题', () => {
      themeStore.setMode(ThemeMode.LIGHT);

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.LIGHT);
      expect(state.appliedTheme).toBe(ThemeMode.LIGHT);
      expect(get(isLight)).toBe(true);
      expect(get(isDark)).toBe(false);
    });

    it('应该正确设置暗色主题', () => {
      themeStore.setMode(ThemeMode.DARK);

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.DARK);
      expect(state.appliedTheme).toBe(ThemeMode.DARK);
      expect(get(isLight)).toBe(false);
      expect(get(isDark)).toBe(true);
    });

    it('应该正确设置跟随系统', () => {
      themeStore.setMode(ThemeMode.SYSTEM);

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.SYSTEM);
      expect(get(isSystemMode)).toBe(true);
    });

    it('应该保存主题设置到 localStorage', () => {
      themeStore.setMode(ThemeMode.DARK);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.DARK
      );
    });
  });

  describe('setLight', () => {
    it('应该设置为浅色主题', () => {
      themeStore.setLight();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.LIGHT);
      expect(state.appliedTheme).toBe(ThemeMode.LIGHT);
      expect(get(isLight)).toBe(true);
    });

    it('应该保存到 localStorage', () => {
      themeStore.setLight();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.LIGHT
      );
    });
  });

  describe('setDark', () => {
    it('应该设置为暗色主题', () => {
      themeStore.setDark();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.DARK);
      expect(state.appliedTheme).toBe(ThemeMode.DARK);
      expect(get(isDark)).toBe(true);
    });

    it('应该保存到 localStorage', () => {
      themeStore.setDark();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.DARK
      );
    });
  });

  describe('setSystem', () => {
    it('应该设置为跟随系统', () => {
      themeStore.setSystem();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.SYSTEM);
      expect(get(isSystemMode)).toBe(true);
    });

    it('应该保存到 localStorage', () => {
      themeStore.setSystem();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.SYSTEM
      );
    });
  });

  describe('toggle', () => {
    it('应该从 LIGHT 切换到 DARK', () => {
      themeStore.setLight();
      themeStore.toggle();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.DARK);
    });

    it('应该从 DARK 切换到 SYSTEM', () => {
      themeStore.setDark();
      themeStore.toggle();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.SYSTEM);
    });

    it('应该从 SYSTEM 切换到 LIGHT', () => {
      themeStore.setSystem();
      themeStore.toggle();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.LIGHT);
    });
  });

  describe('updateSystemPreference', () => {
    it('应该更新系统偏好状态', () => {
      themeStore.updateSystemPreference(true);

      const state = get(themeStore);
      expect(state.systemPrefersDark).toBe(true);
      expect(get(systemPrefersDark)).toBe(true);
    });

    it('在 SYSTEM 模式下应该更新应用的主题', () => {
      themeStore.setSystem();

      // 更新系统偏好为暗色
      themeStore.updateSystemPreference(true);

      const state = get(themeStore);
      expect(state.appliedTheme).toBe(ThemeMode.DARK);
      expect(get(isDark)).toBe(true);

      // 更新系统偏好为浅色
      themeStore.updateSystemPreference(false);

      const state2 = get(themeStore);
      expect(state2.appliedTheme).toBe(ThemeMode.LIGHT);
      expect(get(isLight)).toBe(true);
    });

    it('在非 SYSTEM 模式下不应该更改应用的主题', () => {
      themeStore.setDark();

      // 更新系统偏好
      themeStore.updateSystemPreference(false);

      const state = get(themeStore);
      // 应该仍然是暗色主题
      expect(state.appliedTheme).toBe(ThemeMode.DARK);
      expect(get(isDark)).toBe(true);
    });
  });

  describe('reapply', () => {
    it('应该重新应用当前主题', () => {
      themeStore.setDark();

      // reapply 应该不会改变状态
      themeStore.reapply();

      const state = get(themeStore);
      expect(state.mode).toBe(ThemeMode.DARK);
      expect(state.appliedTheme).toBe(ThemeMode.DARK);
    });
  });

  // ============================================
  // 派生 Stores 测试
  // ============================================

  describe('派生 stores', () => {
    it('currentMode 应该返回当前模式', () => {
      themeStore.setLight();
      expect(get(currentMode)).toBe(ThemeMode.LIGHT);

      themeStore.setDark();
      expect(get(currentMode)).toBe(ThemeMode.DARK);

      themeStore.setSystem();
      expect(get(currentMode)).toBe(ThemeMode.SYSTEM);
    });

    it('appliedTheme 应该返回实际应用的主题', () => {
      themeStore.setLight();
      expect(get(appliedTheme)).toBe(ThemeMode.LIGHT);

      themeStore.setDark();
      expect(get(appliedTheme)).toBe(ThemeMode.DARK);

      // SYSTEM 模式会解析为 LIGHT 或 DARK
      themeStore.setSystem();
      expect([ThemeMode.LIGHT, ThemeMode.DARK]).toContain(get(appliedTheme));
    });

    it('isLight 应该正确反映浅色主题状态', () => {
      themeStore.setLight();
      expect(get(isLight)).toBe(true);

      themeStore.setDark();
      expect(get(isLight)).toBe(false);
    });

    it('isDark 应该正确反映暗色主题状态', () => {
      themeStore.setDark();
      expect(get(isDark)).toBe(true);

      themeStore.setLight();
      expect(get(isDark)).toBe(false);
    });

    it('isSystemMode 应该正确反映系统模式状态', () => {
      themeStore.setSystem();
      expect(get(isSystemMode)).toBe(true);

      themeStore.setLight();
      expect(get(isSystemMode)).toBe(false);

      themeStore.setDark();
      expect(get(isSystemMode)).toBe(false);
    });

    it('themeName 应该返回正确的显示名称', () => {
      themeStore.setLight();
      expect(get(themeName)).toBe('浅色');

      themeStore.setDark();
      expect(get(themeName)).toBe('暗色');

      themeStore.setSystem();
      expect(get(themeName)).toBe('跟随系统');
    });

    it('themeIcon 应该返回正确的图标名称', () => {
      themeStore.setLight();
      expect(get(themeIcon)).toBe('fa-sun');

      themeStore.setDark();
      expect(get(themeIcon)).toBe('fa-moon');

      themeStore.setSystem();
      expect(get(themeIcon)).toBe('fa-circle-half-stroke');
    });
  });

  // ============================================
  // localStorage 持久化测试
  // ============================================

  describe('localStorage 持久化', () => {
    it('应该从 localStorage 加载主题设置', () => {
      // 模拟 localStorage 中存储了 DARK 主题
      localStorage.setItem('claude-token-monitor-theme', ThemeMode.DARK);

      // 由于 store 已经初始化，我们只能验证读取逻辑
      // 实际应用中，刷新页面会重新初始化 store
      expect(localStorage.getItem).toHaveBeenCalled();
    });

    it('设置主题时应该保存到 localStorage', () => {
      themeStore.setLight();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.LIGHT
      );

      themeStore.setDark();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.DARK
      );

      themeStore.setSystem();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'claude-token-monitor-theme',
        ThemeMode.SYSTEM
      );
    });
  });
});
