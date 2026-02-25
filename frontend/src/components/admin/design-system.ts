export const AdminDesignSystem = {
  colors: {
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    success: {
      DEFAULT: '#10b981',
      light: '#d1fae5',
      dark: '#059669',
    },
    warning: {
      DEFAULT: '#f59e0b',
      light: '#fef3c7',
      dark: '#d97706',
    },
    error: {
      DEFAULT: '#ef4444',
      light: '#fee2e2',
      dark: '#dc2626',
    },
    info: {
      DEFAULT: '#06b6d4',
      light: '#cffafe',
      dark: '#0891b2',
    },
    tech: {
      darkblue: 'var(--tech-darkblue)',
      deepblue: 'var(--tech-deepblue)',
      cyan: 'var(--tech-cyan)',
      lightcyan: 'var(--tech-lightcyan)',
      sky: 'var(--tech-sky)',
    },
    glass: {
      DEFAULT: 'var(--glass-default)',
      light: 'var(--glass-light)',
      border: 'var(--glass-border)',
      glow: 'var(--glass-glow)',
    },
  },
  
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  
  typography: {
    fontFamily: {
      sans: ['var(--font-manrope)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
      display: ['var(--font-syne)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '800ms',
    },
    easing: {
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    effects: {
      fadeInUp: 'fade-in-up 0.6s ease-out',
      slideInLeft: 'slide-in-left 0.6s ease-out',
      scaleIn: 'scale-fade-in 0.5s ease-out',
      pulseGlow: 'pulse-glow 2s ease-in-out infinite',
      glassFloat: 'glass-float 6s ease-in-out infinite',
      glowPulse: 'glow-pulse 3s ease-in-out infinite',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    glow: '0 0 20px rgba(6, 182, 212, 0.3)',
  },
  
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  glassmorphism: {
    card: {
      background: 'rgba(255, 255, 255, 0.5)',
      backdropBlur: 'xl',
      border: 'border-slate-200/50',
      borderRadius: 'lg',
    },
    glassCard: {
      background: 'var(--glass-default)',
      backdropBlur: 'xl',
      border: 'border-glass-border',
      borderRadius: 'xl',
    },
  },
  
  transitions: {
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  interaction: {
    hover: {
      scale: 1.02,
      translateY: '-2px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
    },
    active: {
      scale: 0.98,
      translateY: '0px',
    },
    focus: {
      ring: 'ring-2 ring-tech-cyan ring-offset-2',
      outline: 'outline-none',
    },
  },
} as const;

export type AdminDesignSystem = typeof AdminDesignSystem;
