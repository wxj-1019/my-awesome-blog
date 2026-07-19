'use client';

import Link from 'next/link';
import { Cpu, MessageSquare, ArrowRight, Construction } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

/**
 * 在线工具入口页。
 * 导航曾指向 /online-tools 但无对应路由导致 404；
 * 先提供占位与已上线的模型对话入口，后续可在此扩展具体工具。
 */
export default function OnlineToolsContent() {
  return (
    <main className="min-h-[70vh] container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-4">
          <Cpu className="w-7 h-7" aria-hidden />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          在线工具
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          实用小工具将逐步开放。当前可先使用已上线的模型对话。
        </p>
      </div>

      <div className="max-w-xl mx-auto grid gap-4">
        <GlassCard padding="md" className="text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
              <Construction className="w-5 h-5" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground mb-1">更多工具筹备中</h2>
              <p className="text-sm text-muted-foreground">
                JSON 格式化、编码转换、正则测试等将陆续加入此页。
              </p>
            </div>
          </div>
        </GlassCard>

        <Link
          href="/chat"
          className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <GlassCard
            padding="md"
            hoverEffect
            className="text-left border-primary/20 group-hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/15 text-primary">
                <MessageSquare className="w-5 h-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground mb-0.5">模型对话</h2>
                <p className="text-sm text-muted-foreground">
                  多会话 AI 聊天，支持提示词与历史记录
                </p>
              </div>
              <ArrowRight
                className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                aria-hidden
              />
            </div>
          </GlassCard>
        </Link>

        <p className="text-center text-xs text-muted-foreground pt-2">
          <Link href="/" className="underline-offset-2 hover:underline hover:text-primary">
            返回首页
          </Link>
        </p>
      </div>
    </main>
  );
}
