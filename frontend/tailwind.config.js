/**
 * @file Tailwind CSS 配置文件
 * @description 配置 Tailwind CSS 和 Skeleton UI 主题
 * @author Atlas.oi
 * @date 2026-01-07
 */

/** @type {import('tailwindcss').Config} */
export default {
  // 启用暗色模式支持（使用 class 策略）
  darkMode: 'class',

  // 指定需要扫描的文件路径
  content: [
    './index.html',
    './src/**/*.{svelte,js,ts}',
    // Skeleton UI 组件路径
    './node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}',
  ],

  theme: {
    extend: {
      // 自定义颜色
      colors: {
        // 主题色
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },

      // 自定义字体
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // 自定义圆角
      borderRadius: {
        DEFAULT: '0.5rem',
      },

      // 自定义间距
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },

  plugins: [
    // Skeleton UI 插件将在安装后添加
  ],
};
