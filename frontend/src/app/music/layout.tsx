import './globals.css';
import type { ReactNode } from 'react';

export default function MusicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse delay-2000" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
