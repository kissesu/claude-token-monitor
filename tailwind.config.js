/**
 * @file TailwindCSS 配置
 * @description 自定义主题和插件配置
 * @author Atlas.oi
 * @date 2026-01-08
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Claude 品牌色
        claude: {
          50: '#fef7f0',
          100: '#fdebd9',
          200: '#fad4b2',
          300: '#f6b781',
          400: '#f1914e',
          500: '#ec7429',
          600: '#dd5a1f',
          700: '#b7441c',
          800: '#92381e',
          900: '#76301c',
          950: '#40160c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
