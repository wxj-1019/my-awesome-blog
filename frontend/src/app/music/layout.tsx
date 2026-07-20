import './globals.css';
import type { ReactNode } from 'react';

export default function MusicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background：光斑/网格已 token 化，浅色主题自动减淡，reduced-motion 回退静态 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Gradient Orbs */}
        <div className="music-orb music-orb-primary absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px]" />
        <div className="music-orb music-orb-accent absolute top-1/3 -right-20 w-80 h-80 rounded-full blur-[100px]" />
        <div className="music-orb music-orb-purple absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full blur-[150px]" />
        {/* Grid Pattern */}
        <div className="music-grid-pattern absolute inset-0" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
