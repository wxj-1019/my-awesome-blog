import type { ReactNode } from 'react';

export default function GamesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen transition-colors duration-300">
      {children}
    </div>
  );
}
