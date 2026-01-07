/**
 * @file 主题状态管理
 * @description 管理应用主题（浅色/暗色/跟随系统），支持 localStorage 持久化和系统主题监听
 * @author Atlas.oi
 * @date 2026-01-07
 */

import { writable, derived, type Readable } from 'svelte/store';

/**
 * 检测是否在浏览器环境
 */
const browser = typeof window !== 'undefined';

// ============================================
// 类型定义
// ============================================

/**
 * 主题模式枚举
 */
export enum ThemeMode {
  /** 浅色主题 */
  LIGHT = 'light',

  /** 暗色主题 */
  DARK = 'dark',

  /** 跟随系统 */
  SYSTEM = 'system',
}

/**
 * 实际应用的主题（不含 system）
 */
export type AppliedTheme = Exclude<ThemeMode, ThemeMode.SYSTEM>;

/**
 * 主题配置
 */
interface ThemeState {
  /** 用户设置的主题模式 */
  mode: ThemeMode;

  /** 实际应用的主题（system 会解析为 light 或 dark） */
  appliedTheme: AppliedTheme;

  /** 系统是否为暗色主题 */
  systemPrefersDark: boolean;
}

// ============================================
// 常量
// ============================================

const THEME_STORAGE_KEY = 'claude-token-monitor-theme';
const DEFAULT_THEME = ThemeMode.SYSTEM;

// ============================================
// 工具函数
// ============================================

/**
 * 从 localStorage 读取主题设置
 */
function loadThemeFromStorage(): ThemeMode {
  if (!browser) return DEFAULT_THEME;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && Object.values(ThemeMode).includes(stored as ThemeMode)) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.error('读取主题设置失败:', error);
  }

  return DEFAULT_THEME;
}

/**
 * 保存主题设置到 localStorage
 */
function saveThemeToStorage(mode: ThemeMode): void {
  if (!browser) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.error('保存主题设置失败:', error);
  }
}

/**
 * 检测系统是否使用暗色主题
 */
function getSystemThemePreference(): boolean {
  if (!browser) return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * 计算实际应用的主题
 */
function resolveAppliedTheme(mode: ThemeMode, systemPrefersDark: boolean): AppliedTheme {
  if (mode === ThemeMode.SYSTEM) {
    return systemPrefersDark ? ThemeMode.DARK : ThemeMode.LIGHT;
  }
  return mode as AppliedTheme;
}

/**
 * 应用主题到 DOM
 */
function applyThemeToDom(theme: AppliedTheme): void {
  if (!browser) return;

  const root = document.documentElement;

  // 移除旧主题类
  root.classList.remove('light', 'dark');

  // 添加新主题类
  root.classList.add(theme);

  // 更新 color-scheme meta 标签（如果存在）
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    // 根据主题设置 meta theme-color
    const color = theme === ThemeMode.DARK ? '#1a1a1a' : '#ffffff';
    metaThemeColor.setAttribute('content', color);
  }

  // 更新 data-theme 属性（用于 Tailwind CSS）
  root.setAttribute('data-theme', theme);
}

// ============================================
// 初始化状态
// ============================================

function getInitialState(): ThemeState {
  const mode = loadThemeFromStorage();
  const systemPrefersDark = getSystemThemePreference();
  const appliedTheme = resolveAppliedTheme(mode, systemPrefersDark);

  return {
    mode,
    appliedTheme,
    systemPrefersDark,
  };
}

// ============================================
// 主 Store
// ============================================

/**
 * 创建主题状态存储
 */
function createThemeStore() {
  const { subscribe, update } = writable<ThemeState>(getInitialState());

  // 初始化时应用主题
  if (browser) {
    const initial = getInitialState();
    applyThemeToDom(initial.appliedTheme);
  }

  return {
    subscribe,

    /**
     * 设置主题模式
     *
     * @param mode - 主题模式
     */
    setMode: (mode: ThemeMode) => {
      update((state) => {
        const appliedTheme = resolveAppliedTheme(mode, state.systemPrefersDark);

        // 保存到 localStorage
        saveThemeToStorage(mode);

        // 应用到 DOM
        applyThemeToDom(appliedTheme);

        return {
          ...state,
          mode,
          appliedTheme,
        };
      });
    },

    /**
     * 切换到浅色主题
     */
    setLight: () => {
      update((state) => {
        const mode = ThemeMode.LIGHT;
        saveThemeToStorage(mode);
        applyThemeToDom(ThemeMode.LIGHT);

        return {
          ...state,
          mode,
          appliedTheme: ThemeMode.LIGHT,
        };
      });
    },

    /**
     * 切换到暗色主题
     */
    setDark: () => {
      update((state) => {
        const mode = ThemeMode.DARK;
        saveThemeToStorage(mode);
        applyThemeToDom(ThemeMode.DARK);

        return {
          ...state,
          mode,
          appliedTheme: ThemeMode.DARK,
        };
      });
    },

    /**
     * 切换到跟随系统
     */
    setSystem: () => {
      update((state) => {
        const mode = ThemeMode.SYSTEM;
        const appliedTheme = resolveAppliedTheme(mode, state.systemPrefersDark);

        saveThemeToStorage(mode);
        applyThemeToDom(appliedTheme);

        return {
          ...state,
          mode,
          appliedTheme,
        };
      });
    },

    /**
     * 切换主题（在三种模式间循环）
     */
    toggle: () => {
      update((state) => {
        let newMode: ThemeMode;

        switch (state.mode) {
          case ThemeMode.LIGHT:
            newMode = ThemeMode.DARK;
            break;
          case ThemeMode.DARK:
            newMode = ThemeMode.SYSTEM;
            break;
          case ThemeMode.SYSTEM:
          default:
            newMode = ThemeMode.LIGHT;
            break;
        }

        const appliedTheme = resolveAppliedTheme(newMode, state.systemPrefersDark);

        saveThemeToStorage(newMode);
        applyThemeToDom(appliedTheme);

        return {
          ...state,
          mode: newMode,
          appliedTheme,
        };
      });
    },

    /**
     * 更新系统主题偏好
     * 由系统主题监听器调用
     *
     * @param prefersDark - 系统是否偏好暗色主题
     */
    updateSystemPreference: (prefersDark: boolean) => {
      update((state) => {
        const appliedTheme = resolveAppliedTheme(state.mode, prefersDark);

        // 如果当前是 system 模式，需要更新应用的主题
        if (state.mode === ThemeMode.SYSTEM) {
          applyThemeToDom(appliedTheme);
        }

        return {
          ...state,
          systemPrefersDark: prefersDark,
          appliedTheme,
        };
      });
    },

    /**
     * 重新应用当前主题（用于页面恢复等场景）
     */
    reapply: () => {
      update((state) => {
        applyThemeToDom(state.appliedTheme);
        return state;
      });
    },
  };
}

// ============================================
// 导出主 Store 实例
// ============================================

export const themeStore = createThemeStore();

// ============================================
// 系统主题监听
// ============================================

if (browser) {
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    themeStore.updateSystemPreference(e.matches);
  };

  // 兼容不同浏览器的监听方式
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else if (mediaQuery.addListener) {
    // Safari 兼容
    mediaQuery.addListener(handleSystemThemeChange);
  }
}

// ============================================
// Derived Stores（派生状态）
// ============================================

/**
 * 当前主题模式
 */
export const currentMode: Readable<ThemeMode> = derived(
  themeStore,
  ($theme) => $theme.mode
);

/**
 * 实际应用的主题
 */
export const appliedTheme: Readable<AppliedTheme> = derived(
  themeStore,
  ($theme) => $theme.appliedTheme
);

/**
 * 是否为浅色主题
 */
export const isLight: Readable<boolean> = derived(
  appliedTheme,
  ($applied) => $applied === ThemeMode.LIGHT
);

/**
 * 是否为暗色主题
 */
export const isDark: Readable<boolean> = derived(
  appliedTheme,
  ($applied) => $applied === ThemeMode.DARK
);

/**
 * 是否跟随系统
 */
export const isSystemMode: Readable<boolean> = derived(
  currentMode,
  ($mode) => $mode === ThemeMode.SYSTEM
);

/**
 * 系统是否偏好暗色
 */
export const systemPrefersDark: Readable<boolean> = derived(
  themeStore,
  ($theme) => $theme.systemPrefersDark
);

/**
 * 主题显示名称
 */
export const themeName: Readable<string> = derived(
  currentMode,
  ($mode) => {
    switch ($mode) {
      case ThemeMode.LIGHT:
        return '浅色';
      case ThemeMode.DARK:
        return '暗色';
      case ThemeMode.SYSTEM:
        return '跟随系统';
      default:
        return '未知';
    }
  }
);

/**
 * 主题图标名称（Font Awesome）
 */
export const themeIcon: Readable<string> = derived(
  currentMode,
  ($mode) => {
    switch ($mode) {
      case ThemeMode.LIGHT:
        return 'fa-sun';
      case ThemeMode.DARK:
        return 'fa-moon';
      case ThemeMode.SYSTEM:
        return 'fa-circle-half-stroke';
      default:
        return 'fa-question';
    }
  }
);
