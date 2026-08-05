'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { AnimatePresence, motion } from '@/lib/framer-motion';
import { TRANSITION } from '@/lib/animation-utils';
import { buildReadingText } from '@/lib/tarot';
import { buildSpreadSvg, downloadBlob, svgToPngBlob } from '@/lib/tarot-share';
import { cn } from '@/lib/utils';
import type { DrawnCard, TarotSpread } from '@/types/tarot';

interface ShareCardProps {
  open: boolean;
  onClose: () => void;
  question: string;
  spread: TarotSpread;
  drawn: DrawnCard[];
  aiText?: string;
}

type ExportState = 'idle' | 'exporting' | 'error';

/**
 * 分享牌阵图弹层：预览生成的 SVG 牌阵图，提供「下载图片」与「复制摘要」。
 * Esc 关闭、点遮罩关闭；导出失败降级提示。
 */
export default function ShareCard({ open, onClose, question, spread, drawn, aiText }: ShareCardProps) {
  const svg = useMemo(
    () => (open ? buildSpreadSvg({ question, spread, drawn }) : ''),
    [open, question, spread, drawn]
  );
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [copied, setCopied] = useState(false);

  // Esc 关闭
  useEffect(() => {
    if (!open) {return;}
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleDownload = useCallback(async () => {
    setExportState('exporting');
    try {
      const blob = await svgToPngBlob(svg);
      const safeName = question.trim() ? question.trim().slice(0, 12) : spread.name;
      downloadBlob(blob, `塔罗占卜-${safeName}.png`);
      setExportState('idle');
    } catch {
      setExportState('error');
    }
  }, [svg, question, spread]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildReadingText(question, spread, drawn, aiText ?? ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 静默降级（剪贴板权限拒绝等）
    }
  }, [question, spread, drawn, aiText]);

  return (
    <AnimatePresence>
      {/* 弹层出入：遮罩与面板统一走 TRANSITION.MICRO（0.24s/SMOOTH，≤300ms 反馈），
          与共享 ModalMotion 弹层族缓动一致（均为 SMOOTH），不再手写 duration */}
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION.MICRO}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="分享牌阵"
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={TRANSITION.MICRO}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Share2 className="h-4 w-4 text-tech-purple" aria-hidden />
                分享牌阵
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-glass/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* SVG 预览（dangerouslySetInnerHTML：SVG 由本站纯函数生成，已转义） */}
            <div
              className="mb-4 overflow-x-auto rounded-xl border border-border/60 bg-background/40 p-3"
              dangerouslySetInnerHTML={{ __html: svg }}
            />

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={exportState === 'exporting'}
                aria-live="polite"
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors',
                  'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:pointer-events-none disabled:opacity-60'
                )}
              >
                <Download className="h-4 w-4" aria-hidden />
                {exportState === 'exporting' ? '生成中…' : '下载图片（PNG）'}
              </button>
              {exportState === 'error' ? (
                <p className="text-center text-xs text-error">图片生成失败，请改用复制摘要</p>
              ) : null}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? '已复制摘要' : '复制摘要文本'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
