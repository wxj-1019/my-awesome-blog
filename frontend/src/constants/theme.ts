/**
 * @deprecated 色板历史文件。运行时主题以 CSS 变量为准：
 *   `src/styles/base/variables.css` + `docs/theme-tokens.md`
 * 请勿再向本文件新增主题色；新代码用 Tailwind 语义类（bg-background 等）。
 */
export type Theme = 'light' | 'dark';
export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'muted' | 'background' | 'foreground' | 'border' | 'card' | 'card-foreground' | 'popover' | 'popover-foreground' | 'destructive' | 'destructive-foreground' | 'ring';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  background: string;
  foreground: string;
  border: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  destructive: string;
  destructiveForeground: string;
  ring: string;
}

export interface TechThemeColors {
  darkblue: string;
  deepblue: string;
  cyan: string;
  lightcyan: string;
  sky: string;
  glass: string;
  glassBorder: string;
  glassGlow: string;
}

export interface ThemeClassNames {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  background: string;
  foreground: string;
  border: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  destructive: string;
  destructiveForeground: string;
  ring: string;
}

export const LIGHT_THEME: ThemeColors = {
  primary: '#0f172a',
  secondary: '#f1f5f9',
  accent: '#3b82f6',
  muted: '#94a3b8',
  background: '#ffffff',
  foreground: '#0f172a',
  border: '#e2e8f0',
  card: '#ffffff',
  cardForeground: '#0f172a',
  popover: '#ffffff',
  popoverForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  ring: '#3b82f6',
};

export const DARK_THEME: ThemeColors = {
  primary: '#22d3ee',
  secondary: '#1e293b',
  accent: '#06b6d4',
  muted: '#64748b',
  background: '#000000',
  foreground: '#f8fafc',
  border: '#1e293b',
  card: '#0f172a',
  cardForeground: '#f8fafc',
  popover: '#0f172a',
  popoverForeground: '#f8fafc',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  ring: '#06b6d4',
};

export const TECH_THEME: TechThemeColors = {
  darkblue: '#0f172a',
  deepblue: '#1e3a8a',
  cyan: '#06b6d4',
  lightcyan: '#22d3ee',
  sky: '#0ea5e9',
  glass: 'rgba(15, 23, 42, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassGlow: 'rgba(6, 182, 212, 0.3)',
};

export const LIGHT_CLASS_NAMES: ThemeClassNames = {
  primary: 'bg-[#0f172a] text-white',
  secondary: 'bg-[#f1f5f9] text-[#0f172a]',
  accent: 'bg-[#3b82f6] text-white',
  muted: 'text-[#94a3b8]',
  background: 'bg-white',
  foreground: 'text-[#0f172a]',
  border: 'border-[#e2e8f0]',
  card: 'bg-white border-[#e2e8f0]',
  cardForeground: 'text-[#0f172a]',
  popover: 'bg-white border-[#e2e8f0]',
  popoverForeground: 'text-[#0f172a]',
  destructive: 'bg-[#ef4444] text-white',
  destructiveForeground: 'text-white',
  ring: 'focus-visible:ring-[#3b82f6]',
};

export const DARK_CLASS_NAMES: ThemeClassNames = {
  primary: 'bg-[#22d3ee] text-black',
  secondary: 'bg-[#1e293b] text-white',
  accent: 'bg-[#06b6d4] text-white',
  muted: 'text-[#64748b]',
  background: 'bg-black',
  foreground: 'text-[#f8fafc]',
  border: 'border-[#1e293b]',
  card: 'bg-[#0f172a] border-[#1e293b]',
  cardForeground: 'text-[#f8fafc]',
  popover: 'bg-[#0f172a] border-[#1e293b]',
  popoverForeground: 'text-[#f8fafc]',
  destructive: 'bg-[#dc2626] text-white',
  destructiveForeground: 'text-white',
  ring: 'focus-visible:ring-[#06b6d4]',
};

export const TECH_CLASS_NAMES = {
  darkblue: 'bg-tech-darkblue',
  deepblue: 'bg-tech-deepblue',
  cyan: 'bg-tech-cyan text-white',
  lightcyan: 'bg-tech-lightcyan text-black',
  sky: 'bg-tech-sky text-white',
  glass: 'bg-glass/30 backdrop-blur-xl border border-glass-border',
  glassBorder: 'border-glass-border',
  glassGlow: 'shadow-glow-tech-cyan',
  glassLight: 'bg-white/80 border-gray-200',
  glassDark: 'bg-glass/30 backdrop-blur-xl border-glass-border',
};

export const THEME_VARIANTS = {
  default: 'bg-tech-cyan text-white hover:bg-tech-lightcyan',
  glass: 'bg-glass/30 backdrop-blur-xl border border-glass-border text-white hover:bg-glass/50',
  ghost: 'bg-transparent text-tech-cyan hover:bg-glass/30',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline',
};

export const ANIMATION_CLASSES = {
  fadeInUp: 'animate-fade-in-up',
  fadeIn: 'animate-fade-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  scaleFadeIn: 'animate-scale-fade-in',
  pulseGlow: 'animate-pulse-glow',
  glassFloat: 'animate-glass-float',
  floatImproved: 'animate-float-improved',
  gradientMove: 'animate-gradient-move',
  verticalScroll: 'animate-vertical-scroll',
};

export const GLASS_VARIANTS = {
  default: 'bg-glass/30 backdrop-blur-xl border border-glass-border',
  light: 'bg-glass/50 backdrop-blur-xl border-glass-border',
  heavy: 'bg-glass/70 backdrop-blur-xl border-glass-border',
  dark: 'bg-tech-darkblue/80 border-glass-border',
};

export function getThemeColors(theme: Theme): ThemeColors {
  return theme === 'light' ? LIGHT_THEME : DARK_THEME;
}

export function getThemeClassNames(theme: Theme): ThemeClassNames {
  return theme === 'light' ? LIGHT_CLASS_NAMES : DARK_CLASS_NAMES;
}

export function getThemeClass(
  darkClass: string,
  lightClass: string,
  theme?: Theme
): string {
  const resolvedTheme = theme || (typeof window !== 'undefined' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : 'dark');
  
  return resolvedTheme === 'dark' ? darkClass : lightClass;
}
