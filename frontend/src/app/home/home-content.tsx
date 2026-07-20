'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Music, Film, Gamepad2, ArrowRight, Home } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import { Stagger, StaggerItem } from '@/components/motion';

const items: {
  href: Route;
  title: string;
  description: string;
  icon: typeof Music;
}[] = [
  {
    href: '/music',
    title: '音乐馆',
    description: '歌单、播放与音乐相关内容',
    icon: Music,
  },
  {
    href: '/videos',
    title: '视频',
    description: '影视与追剧记录',
    icon: Film,
  },
  {
    href: '/games',
    title: '游戏',
    description: '游戏相关页面与体验',
    icon: Gamepad2,
  },
];

/** 导航「家」父级 /home：原先无路由会 404，提供聚合入口 */
export default function HomeHubContent() {
  return (
    <PageShell density="narrow">
      <PageHeader
        title="家"
        description="音乐、视频与游戏的入口"
        icon={Home}
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

        <StaggerItem>
          <p className="text-center text-xs text-muted-foreground pt-2">
            <Link href="/" className="underline-offset-2 hover:underline hover:text-primary">
              返回首页
            </Link>
          </p>
        </StaggerItem>
      </Stagger>
    </PageShell>
  );
}
