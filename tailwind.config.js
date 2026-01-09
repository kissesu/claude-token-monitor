/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', 'Inter', 'sans-serif'],
        display: ['"Space Grotesk"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // 使用函数式定义以确保透明度支持 (opacity modifiers) 正常工作
        bg: ({ opacityValue }) => `rgb(var(--color-bg) / ${opacityValue ?? 1})`,
        panel: ({ opacityValue }) => `rgb(var(--color-panel) / ${opacityValue ?? 1})`,
        border: ({ opacityValue }) => `rgb(var(--color-border) / ${opacityValue ?? 1})`,
        primary: ({ opacityValue }) => `rgb(var(--color-primary) / ${opacityValue ?? 1})`,
        secondary: ({ opacityValue }) => `rgb(var(--color-secondary) / ${opacityValue ?? 1})`,
        neonPrimary: ({ opacityValue }) => `rgb(var(--color-neon-primary) / ${opacityValue ?? 1})`,
        
        // Functional Neon Colors
        neonBlue: "#3B82F6",    
        neonPurple: "#A855F7",  
        neonGreen: "#10B981",   
      },
      backgroundImage: {
        'noise': "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.05%22/%3E%3C/svg%3E')",
        'gradient-glow': "radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.08), transparent 70%)"
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};