'use client';

import Link from 'next/link';
import { Music, Film, Gamepad2, ArrowRight, Home } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const items = [
  {
    href: '/music' as const,
    title: '音乐馆',
    description: '歌单、播放与音乐相关内容',
    icon: Music,
  },
  {
    href: '/videos' as const,
    title: '视频',
    description: '影视与追剧记录',
    icon: Film,
  },
  {
    href: '/games' as const,
    title: '游戏',
    description: '游戏相关页面与体验',
    icon: Gamepad2,
  },
];

/** 导航「家」父级 /home：原先无路由会 404，提供聚合入口 */
export default function HomeHubContent() {
  return (
    <main className="min-h-[70vh] container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-4">
          <Home className="w-7 h-7" aria-hidden />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">家</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          音乐、视频与游戏的入口
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

        <p className="text-center text-xs text-muted-foreground pt-2">
          <Link href="/" className="underline-offset-2 hover:underline hover:text-primary">
            返回首页
          </Link>
        </p>
      </div>
    </main>
  );
}
