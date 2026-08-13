'use client';

import Link from 'next/link';
import { Cpu, Construction } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import { Stagger, StaggerItem } from '@/components/motion';

/**
 * 在线工具入口页。
 * 导航曾指向 /online-tools 但无对应路由导致 404；
 * 先提供占位卡片，后续可在此扩展具体工具。
 */
export default function OnlineToolsContent() {
  return (
    <PageShell density="narrow">
      <PageHeader
        title="在线工具"
        description="实用小工具将逐步开放，敬请期待。"
        icon={Cpu}
        align="center"
      />

      <Stagger className="max-w-xl mx-auto grid gap-4">
        {/* 占位卡片：工具筹备中 */}
        <StaggerItem>
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
        </StaggerItem>

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
