'use client';

import { FlaskConical } from 'lucide-react';

/**
 * 演示内容提示徽章：标注当前页面为示例数据（非真实功能），
 * 置于页面内容顶部，不阻断交互。
 */
export default function DemoBadge({ label = '演示页面 · 内容为示例数据' }: { label?: string }) {
  return (
    <div className="flex justify-center mb-6" role="note">
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm text-xs text-muted-foreground">
        <FlaskConical className="w-3.5 h-3.5 text-tech-cyan" aria-hidden />
        {label}
      </span>
    </div>
  );
}
