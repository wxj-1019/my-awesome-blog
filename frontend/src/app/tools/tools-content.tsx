'use client';

import Link from 'next/link';
import { Cpu, MessageSquare, ArrowRight, Wrench } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const items = [
  {
    href: '/chat' as const,
    title: '模型对话',
    description: '多会话 AI 聊天，提示词与历史记录',
    icon: MessageSquare,
  },
  {
    href: '/online-tools' as const,
    title: '在线工具',
    description: '实用小工具集合（持续完善中）',
    icon: Cpu,
  },
];

/** 百宝箱聚合页：导航父级 /tools 原先无路由会 404 */
export default function ToolsHubContent() {
  return (
    <main className="min-h-[70vh] container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-4">
          <Wrench className="w-7 h-7" aria-hidden />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">百宝箱</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          模型对话与在线工具入口
        </p>
      </div>

      <div className="max-w-xl mx-auto grid gap-4">
        {items.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          >
            <GlassCard
              padding="md"
              hoverEffect
              className="text-left group-hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/15 text-primary">
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground mb-0.5">{title}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                  aria-hidden
                />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </main>
  );
}
