'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Cpu, MessageSquare, ArrowRight, Wrench, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import { Stagger, StaggerItem } from '@/components/motion';

const items: {
  href: Route;
  title: string;
  description: string;
  icon: typeof MessageSquare;
}[] = [
  {
    href: '/chat',
    title: '模型对话',
    description: '多会话 AI 聊天，提示词与历史记录',
    icon: MessageSquare,
  },
  {
    href: '/online-tools' as Route,
    title: '在线工具',
    description: '实用小工具集合（持续完善中）',
    icon: Cpu,
  },
  {
    href: '/tools/skills' as Route,
    title: 'AI 工具收藏',
    description: '收藏优秀的 Skill 与 MCP',
    icon: Sparkles,
  },
];

/** 百宝箱聚合页：导航父级 /tools 原先无路由会 404 */
export default function ToolsHubContent() {
  return (
    <PageShell density="narrow">
      <PageHeader
        title="百宝箱"
        description="模型对话与在线工具入口"
        icon={Wrench}
        align="center"
      />

      <Stagger className="max-w-xl mx-auto grid gap-4">
        {items.map(({ href, title, description, icon: Icon }) => (
          <StaggerItem key={href}>
            <Link
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
          </StaggerItem>
        ))}
      </Stagger>
    </PageShell>
  );
}
