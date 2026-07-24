'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Terminal } from 'lucide-react';

export interface SkillPromptCardProps {
  /** 示例提示词列表（2-3 条），逐条以 `>` 前缀渲染 */
  prompts: string[];
}

/**
 * 示例提示词卡片：终端/电影字幕风格。
 * 玻璃面承载，标题栏 Terminal 图标 + 「示例提示词」，
 * 每条提示词 font-mono 并以主色 `>` 作为前缀。
 */
export default function SkillPromptCard({ prompts }: SkillPromptCardProps) {
  return (
    <GlassCard padding="md" className="font-mono text-sm">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-glass-border text-muted-foreground">
        <Terminal className="w-4 h-4 text-primary" aria-hidden />
        <span className="text-xs tracking-[0.2em] uppercase">示例提示词</span>
      </div>
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <p key={prompt} className="flex gap-2 leading-relaxed">
            <span className="text-primary shrink-0" aria-hidden>
              &gt;
            </span>
            <span className="text-foreground/85">{prompt}</span>
          </p>
        ))}
      </div>
    </GlassCard>
  );
}
