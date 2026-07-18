'use client';

import { ThemeProvider, useTheme } from '@/context/theme-context';

import MatrixCodeRain from '@/components/background/MatrixCodeRain';
import DynamicBackground from '@/components/ui/DynamicBackground';

function ThemeBackground() {
  const { resolvedTheme } = useTheme();
  
  return (
    <>
      {resolvedTheme === 'dark' && <MatrixCodeRain />}
      {resolvedTheme === 'light' && <DynamicBackground />}
    </>
  );
}

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeBackground />
      {children}
    </ThemeProvider>
  );
}
