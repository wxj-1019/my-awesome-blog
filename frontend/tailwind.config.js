/**
 * 语义色令牌包装：让 Tailwind 的透明度修饰符（bg-glass/60、border-primary/40）真正生效。
 *
 * 背景：令牌以 `var(--x)` 形式提供色值（十六进制/rgba），Tailwind v3 无法直接往 var()
 * 里注入 alpha，缺少 `<alpha-value>` 占位符时会**静默丢弃**整个候选类——规范 §4.2 的
 * 玻璃透明度层级因此一直未生效。用 color-mix 承接 `<alpha-value>`：
 *   - 不带修饰符时 Tailwind 代入 1 → color-mix(... calc(1 * 100%), transparent) ≡ 原色
 *   - 带修饰符时 → 按百分比与 transparent 混合
 * 直接消费 `var(--x)` 的手写 CSS 不受影响，variables.css 无需改动。
 *
 * 浏览器要求：Chrome 111+ / Safari 16.2+ / Firefox 113+。
 */
const withAlpha = (name) =>
  `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'tab': '834px',  // iPad竖屏
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-syne)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        'sf-pro-display': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'sf-pro-text': ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        border: withAlpha('--border'),
        input: withAlpha('--input'),
        ring: withAlpha('--ring'),
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        primary: {
          DEFAULT: withAlpha('--primary'),
          foreground: withAlpha('--primary-foreground'),
          50: withAlpha('--primary-50'),
          100: withAlpha('--primary-100'),
          200: withAlpha('--primary-200'),
          300: withAlpha('--primary-300'),
          400: withAlpha('--primary-400'),
          500: withAlpha('--primary-500'),
          600: withAlpha('--primary-600'),
          700: withAlpha('--primary-700'),
          800: withAlpha('--primary-800'),
          900: withAlpha('--primary-900'),
        },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
          50: withAlpha('--secondary-50'),
          100: withAlpha('--secondary-100'),
          200: withAlpha('--secondary-200'),
          300: withAlpha('--secondary-300'),
          400: withAlpha('--secondary-400'),
          500: withAlpha('--secondary-500'),
          600: withAlpha('--secondary-600'),
          700: withAlpha('--secondary-700'),
          800: withAlpha('--secondary-800'),
          900: withAlpha('--secondary-900'),
        },
        accent: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
          50: withAlpha('--accent-50'),
          100: withAlpha('--accent-100'),
          200: withAlpha('--accent-200'),
          300: withAlpha('--accent-300'),
          400: withAlpha('--accent-400'),
          500: withAlpha('--accent-500'),
          600: withAlpha('--accent-600'),
          700: withAlpha('--accent-700'),
          800: withAlpha('--accent-800'),
          900: withAlpha('--accent-900'),
        },
        destructive: {
          DEFAULT: withAlpha('--destructive'),
          foreground: withAlpha('--destructive-foreground'),
        },
        glass: {
          DEFAULT: withAlpha('--glass-default'),
          light: withAlpha('--glass-default'),
          border: withAlpha('--glass-border'),
          glow: withAlpha('--glass-glow'),
        },
        tech: {
          darkblue: withAlpha('--tech-darkblue'),
          deepblue: withAlpha('--tech-deepblue'),
          cyan: withAlpha('--tech-cyan'),
          lightcyan: withAlpha('--tech-lightcyan'),
          sky: withAlpha('--tech-sky'),
          purple: withAlpha('--tech-purple'),
          pink: withAlpha('--tech-pink'),
          // 扩展色阶
          50: withAlpha('--tech-50'),
          100: withAlpha('--tech-100'),
          200: withAlpha('--tech-200'),
          300: withAlpha('--tech-300'),
          400: withAlpha('--tech-400'),
          500: withAlpha('--tech-500'),
          600: withAlpha('--tech-600'),
          700: withAlpha('--tech-700'),
          800: withAlpha('--tech-800'),
          900: withAlpha('--tech-900'),
        },
        /* 分类色板：用于需要互相区分的类目（审计动作、图表系列等）。
           语义状态请用 success / warning / destructive / info。 */
        cat: {
          1: withAlpha('--cat-1'),
          2: withAlpha('--cat-2'),
          3: withAlpha('--cat-3'),
          4: withAlpha('--cat-4'),
          5: withAlpha('--cat-5'),
          6: withAlpha('--cat-6'),
          7: withAlpha('--cat-7'),
          8: withAlpha('--cat-8'),
          9: withAlpha('--cat-9'),
          10: withAlpha('--cat-10'),
        },
        music: {
          primary: '#fa2d2f',
          secondary: '#ff3b30',
          hover: '#ff6961',
          active: '#d32f2f',
        },
        'macos-light': {
          background: '#F5F5F7',
          surface: '#FFFFFF',
          border: 'rgba(0,0,0,0.08)',
          'text-primary': '#1D1D1F',
          'text-secondary': 'rgba(0,0,0,0.6)',
          'text-tertiary': 'rgba(0,0,0,0.4)',
          'text-disabled': 'rgba(0,0,0,0.3)',
        },
        'macos-dark': {
          background: '#000000',
          surface: '#1C1C1E',
          border: 'rgba(255,255,255,0.08)',
          'text-primary': '#FFFFFF',
          'text-secondary': 'rgba(255,255,255,0.6)',
          'text-tertiary': 'rgba(255,255,255,0.4)',
          'text-disabled': 'rgba(255,255,255,0.3)',
        },
        success: {
          DEFAULT: withAlpha('--success'),
          foreground: withAlpha('--success-foreground'),
        },
        warning: {
          DEFAULT: withAlpha('--warning'),
          foreground: withAlpha('--warning-foreground'),
        },
        error: {
          DEFAULT: withAlpha('--error'),
          foreground: withAlpha('--error-foreground'),
        },
        info: {
          DEFAULT: withAlpha('--info'),
          foreground: withAlpha('--info-foreground'),
        },
        'text-primary': withAlpha('--text-primary-high-contrast'),
        'text-secondary': withAlpha('--text-secondary-high-contrast'),
        muted: {
          DEFAULT: withAlpha('--muted'),
          foreground: withAlpha('--muted-foreground'),
        },
        popover: {
          DEFAULT: withAlpha('--popover'),
          foreground: withAlpha('--popover-foreground'),
        },
        card: {
          DEFAULT: withAlpha('--card'),
          foreground: withAlpha('--card-foreground'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'macos-xs': '8px',
        'macos-sm': '12px',
        'macos-md': '16px',
        'macos-lg': '20px',
        'macos-xl': '24px',
        'macos-2xl': '32px',
        'macos-3xl': '40px',
      },
      // 统一定义keyframes（只保留项目实际使用的动画）
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        // 阶段 B：循环关键帧与 styles/animations/keyframes.css 同款有机路径
        'glass-float': {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '28%': { transform: 'translateY(-7px) translateX(1.5px)' },
          '55%': { transform: 'translateY(-11px) translateX(-1px)' },
          '80%': { transform: 'translateY(-5px) translateX(0.5px)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.15)' },
          '42%': { boxShadow: '0 0 24px rgba(6, 182, 212, 0.28)' },
          '60%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.3)' },
        },
        'gradient-move': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-scale-up': {
          from: { opacity: 0, transform: 'translateY(20px) scale(0.96)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        // 阶段 B：漂浮幅度 15/20px → 9/13px、scale 1.05 → 1.03，退去「跳跃感」
        'float-improved': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
          '25%': { transform: 'translateY(-9px) translateX(3px) scale(1.01)' },
          '50%': { transform: 'translateY(-13px) translateX(-3px) scale(1.03)' },
          '75%': { transform: 'translateY(-6px) translateX(2px) scale(1.01)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.15), 0 0 40px rgba(6, 182, 212, 0.05)' },
          '50%': { boxShadow: '0 0 30px rgba(6, 182, 212, 0.25), 0 0 60px rgba(6, 182, 212, 0.1)' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(30px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        'vertical-scroll': {
          '0%': { transform: 'translateY(-25%)' },
          '100%': { transform: 'translateY(25%)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'rainbow-shift': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        // 节点呼吸光晕：与 hero 波浪浪尖反光呼应
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4', transform: 'translateX(-50%) scale(1)' },
          '50%': { opacity: '0.8', transform: 'translateX(-50%) scale(1.15)' },
        },
      },
      // 统一定义animation（与keyframes一一对应，避免重复键）
      // 阶段 B：循环用 --ease-breathe 长周期；入场用 --ease-soft 软出曲线拉长时长
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'glass-float': 'glass-float 9s var(--ease-breathe) infinite',
        'pulse-glow': 'pulse-glow 3.6s var(--ease-breathe) infinite',
        'gradient-move': 'gradient-move 14s var(--ease-breathe) infinite',
        'fade-in-up': 'fade-in-up 0.7s var(--ease-soft) forwards',
        'slide-in-left': 'slide-in-left 0.7s var(--ease-soft) forwards',
        'scale-fade-in': 'scale-fade-in 0.6s var(--ease-soft) forwards',
        'fade-in': 'fade-in 0.7s var(--ease-soft) forwards',
        'fade-scale-up': 'fade-scale-up 0.75s var(--ease-soft) forwards',
        'float-improved': 'float-improved 12s var(--ease-breathe) infinite',
        'glow-pulse': 'glow-pulse 4.5s var(--ease-breathe) infinite',
        'slide-in-right': 'slide-in-right 0.7s var(--ease-soft) forwards',
        'vertical-scroll': 'vertical-scroll 20s linear infinite',
        'scanline': 'scanline 2s linear infinite',
        'rainbow-shift': 'rainbow-shift 3s linear infinite',
        'pulse-slow': 'pulse-slow 5.5s var(--ease-breathe) infinite',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDelay: {
        '50': '50ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      boxShadow: {
        'macos-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'macos-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        'macos-3': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
        'macos-4': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
        'macos-5': '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
        'macos-glass-1': '0 8px 32px rgba(0,0,0,0.04)',
        'macos-glass-2': '0 8px 32px rgba(0,0,0,0.08)',
        'macos-glass-3': '0 8px 32px rgba(0,0,0,0.12)',
        'macos-inset': 'inset 0 2px 4px rgba(0,0,0,0.06)',
        'tech-cyan': '0 0 15px var(--shadow-tech-cyan)',
        'tech-purple': '0 0 15px var(--shadow-tech-purple)',
        'tech-pink': '0 0 15px var(--shadow-tech-pink)',
        'glass': 'var(--glass-shadow)',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'custom-a': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'custom-b': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'material-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'material-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'material-accelerate': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'material-sharp': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
        'material-emphasized': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'material-emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'material-emphasized-accelerate': 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
      },
      fontSize: {
        'title-1': ['2.125rem', { lineHeight: '2.5625rem', letterSpacing: '-0.5px', fontWeight: '600' }],
        'title-2': ['1.75rem', { lineHeight: '2.1rem', letterSpacing: '-0.5px', fontWeight: '600' }],
        'title-3': ['1.375rem', { lineHeight: '1.71875rem', letterSpacing: '-0.5px', fontWeight: '600' }],
        'large-title': ['2.125rem', { lineHeight: '2.7625rem', letterSpacing: '0.5px', fontWeight: '700' }],
        'headline': ['1.0625rem', { lineHeight: '1.4875rem', letterSpacing: '-0.5px', fontWeight: '600' }],
        'body': ['1.0625rem', { lineHeight: '1.4875rem', letterSpacing: '-0.5px', fontWeight: '400' }],
        'callout': ['1rem', { lineHeight: '1.45rem', letterSpacing: '-0.5px', fontWeight: '400' }],
        'subhead': ['0.9375rem', { lineHeight: '1.40625rem', letterSpacing: '-0.5px', fontWeight: '400' }],
        'footnote': ['0.8125rem', { lineHeight: '1.259375rem', letterSpacing: '-0.5px', fontWeight: '400' }],
        'caption-1': ['0.75rem', { lineHeight: '1.2rem', letterSpacing: '0', fontWeight: '400' }],
        'caption-2': ['0.6875rem', { lineHeight: '1.13125rem', letterSpacing: '0', fontWeight: '400' }],
      },
      spacing: {
        '65': '16.25rem',
        '70': '17.5rem',
        '22': '5.5rem',
      },
      width: {
        '65': '16.25rem',
        '70': '17.5rem',
      },
      height: {
        '60': '15rem',
        '70': '17.5rem',
        '80': '20rem',
        '90': '22.5rem',
        '100': '25rem',
      },
    },
  },
  plugins: [],
}