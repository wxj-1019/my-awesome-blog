'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MessageSquare, Sparkles, Database, Settings, Plus } from 'lucide-react';

interface AILayoutProps {
  children: ReactNode;
  title: string;
  currentPath: string;
}

const navItems = [
  { name: '对话', href: '/ai/chat', icon: MessageSquare },
  { name: '提示词', href: '/ai/prompts', icon: Sparkles },
  { name: '记忆', href: '/ai/memories', icon: Database },
  { name: '设置', href: '/ai/settings', icon: Settings },
];

export default function AILayout({ children, title, currentPath }: AILayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tech-darkblue via-tech-deepblue to-tech-darkblue">
      <nav className="fixed top-4 left-4 right-4 z-50 bg-glass/30 backdrop-blur-xl border border-glass-border rounded-lg px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white hover:text-tech-cyan transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4M12 8l4-4m0 0l-4 4m4-4v0m0 0V4" />
              </svg>
            </Link>
            <h1 className="text-white font-bold text-lg">AI Studio</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as never}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPath === item.href
                    ? 'bg-tech-cyan text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-20 px-4 pb-8"
      >
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          </motion.div>
          {children}
        </div>
      </motion.main>

      <div className="fixed bottom-0 left-0 right-0 bg-glass/20 backdrop-blur-xl border-t border-glass-border">
        <div className="container mx-auto px-4 py-2 md:hidden">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as never}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  currentPath === item.href
                    ? 'text-tech-cyan'
                    : 'text-white/70'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
