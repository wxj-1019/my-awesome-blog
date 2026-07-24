'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import {
  DEFAULT_SKILL_PREVIEW_LINES,
  previewMarkdownLines,
  skillDownloadFilename,
} from '@/lib/skill-content';
import { cn } from '@/lib/utils';

export interface SkillContentPanelProps {
  slug: string;
  /** 静态 URL，如 /skills/taste/SKILL.md */
  contentPath: string;
  /** Server 注入的全文；null 表示缺失 */
  contentMarkdown: string | null;
  /** 默认折叠预览行数 */
  previewLines?: number;
}

/**
 * Skill 文件面板：折叠预览（约 16 行）+ 展开全文 + 下载 {slug}-SKILL.md
 */
export default function SkillContentPanel({
  slug,
  contentPath,
  contentMarkdown,
  previewLines = DEFAULT_SKILL_PREVIEW_LINES,
}: SkillContentPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    const filename = skillDownloadFilename(slug);
    setDownloading(true);
    try {
      const res = await fetch(contentPath);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(contentPath, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }, [contentPath, slug]);

  if (contentMarkdown == null || contentMarkdown.trim() === '') {
    return (
      <GlassCard padding="md" role="region" aria-label="Skill 文件">
        <p className="text-sm text-muted-foreground">暂无托管正文</p>
      </GlassCard>
    );
  }

  const { text: preview, truncated } = previewMarkdownLines(
    contentMarkdown,
    previewLines,
  );
  const shown = expanded || !truncated ? contentMarkdown : preview;

  return (
    <GlassCard
      padding="md"
      className="space-y-4"
      role="region"
      aria-label="Skill 文件"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="w-4 h-4 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-bold tracking-tight">
            SKILL.md
          </h2>
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            'border border-glass-border bg-glass text-foreground',
            'hover:border-primary/40 hover:text-primary transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-60',
          )}
          aria-label={`下载 ${skillDownloadFilename(slug)}`}
        >
          <Download className="w-4 h-4" aria-hidden />
          下载
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        以下为站内策展副本，以官方仓库为准。
      </p>
      <div
        className="rounded-lg border border-glass-border/60 bg-background/30 p-3 sm:p-4 overflow-x-auto"
        aria-label="SKILL.md 预览"
      >
        <MarkdownRenderer content={shown} className="text-sm" />
      </div>
      {truncated ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md',
          )}
        >
          {expanded ? (
            <>
              收起 <ChevronUp className="w-4 h-4" aria-hidden />
            </>
          ) : (
            <>
              展开全文 <ChevronDown className="w-4 h-4" aria-hidden />
            </>
          )}
        </button>
      ) : null}
    </GlassCard>
  );
}
