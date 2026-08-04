'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, Copy, RotateCcw, Share2, Sparkles, Square } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import ReadingErrorBoundary from '@/components/tarot/ReadingErrorBoundary';
import ShareCard from '@/components/tarot/ShareCard';
import {
  buildAiReadingMessages,
  buildReadingEntries,
  buildReadingText,
  buildSpreadSummary,
  orientationLabel,
} from '@/lib/tarot';
import { streamChat } from '@/lib/api/llm';
import { cn } from '@/lib/utils';
import type { DrawnCard, TarotSpread } from '@/types/tarot';

/** MarkdownRenderer 体积较大（react-markdown + highlight.js），按需懒加载 */
const MarkdownRenderer = dynamic(() => import('@/components/ui/MarkdownRenderer'), {
  ssr: false,
});

type AiState = 'idle' | 'streaming' | 'done' | 'error';

interface ReadingPanelProps {
  question: string;
  spread: TarotSpread;
  drawn: DrawnCard[];
  onReset: () => void;
}

/**
 * 解读面板：预设牌义（本地即时）+ 可选 AI 深度解读（/llm/chat/stream，无需登录）。
 * AI 失败不影响预设解读展示。
 */
export default function ReadingPanel({ question, spread, drawn, onReset }: ReadingPanelProps) {
  const entries = buildReadingEntries(drawn, spread);
  const summary = useMemo(() => buildSpreadSummary(drawn), [drawn]);
  const [aiState, setAiState] = useState<AiState>('idle');
  const [aiText, setAiText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** 当前流式请求的控制器（停止按钮用） */
  const abortRef = useRef<AbortController | null>(null);
  /** 「已复制」提示的定时器 */
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 卸载时中断进行中的请求并清理定时器
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (copyTimerRef.current) {clearTimeout(copyTimerRef.current);}
    };
  }, []);

  /** 复制解读汇总文本 */
  const handleCopy = useCallback(async () => {
    const text = buildReadingText(question, spread, drawn, aiText);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(true);
      if (copyTimerRef.current) {clearTimeout(copyTimerRef.current);}
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }, [question, spread, drawn, aiText]);

  const startAiReading = useCallback(() => {
    setAiState('streaming');
    setAiText('');
    setErrorMsg('');
    const controller = new AbortController();
    abortRef.current = controller;
    streamChat(
      { messages: buildAiReadingMessages(question, spread, drawn), temperature: 0.7 },
      (chunk) => setAiText((prev) => prev + chunk),
      () => {
        abortRef.current = null;
        setAiState('done');
      },
      (err) => {
        abortRef.current = null;
        // 用户主动停止：保留已生成内容，视为完成
        if (err.name === 'AbortError') {
          setAiState('done');
          return;
        }
        setAiState('error');
        setErrorMsg(err.message);
      },
      controller.signal
    );
  }, [question, spread, drawn]);

  /** 停止 AI 解读：中断请求，已生成内容保留 */
  const stopAiReading = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {question.trim() ? (
        <p className="text-center text-sm text-muted-foreground">
          你的问题：<span className="text-foreground/90">{question.trim()}</span>
        </p>
      ) : null}

      {/* 整体联动（三张牌阵） */}
      {summary ? (
        <GlassCard padding="md" className="border-tech-purple/30">
          <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-tech-purple" aria-hidden />
            整体联动
          </h3>
          <div className="space-y-1.5 text-sm leading-relaxed text-foreground/85">
            {summary.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {/* 预设牌义 */}
      {entries.map(({ position, drawn: d, text }) => (
        <GlassCard key={`${position}-${d.card.id}`} padding="md">
          <div className="flex gap-4">
            {/* 牌面小缩略图：与上方翻牌结果视觉连接 */}
            <div className="w-16 shrink-0">
              <div className={cn('aspect-[5/8] w-full', d.isReversed && 'rotate-180')}>
                <TarotCardFace card={d.card} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {position}
                </span>
                <h3 className="font-semibold text-foreground">
                  {d.card.name}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {d.card.nameEn}
                  </span>
                </h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    d.isReversed
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                  )}
                >
                  {orientationLabel(d.isReversed)}
                </span>
              </div>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {d.card.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{text}</p>
            </div>
          </div>
        </GlassCard>
      ))}

      {/* AI 深度解读 */}
      <GlassCard padding="md" className="border-tech-purple/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tech-purple/15 text-tech-purple">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI 深度解读</h3>
              <p className="text-xs text-muted-foreground">
                结合你的问题与牌面，由站内 AI 生成个性化解读
              </p>
            </div>
          </div>
          {aiState !== 'streaming' ? (
            <button
              type="button"
              onClick={startAiReading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {aiState === 'done' ? '重新解读' : '开始解读'}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">解读中…</span>
              <button
                type="button"
                onClick={stopAiReading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-error/40 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Square className="h-3 w-3" aria-hidden />
                停止
              </button>
            </div>
          )}
        </div>

        {aiState === 'error' ? (
          <p className="mt-3 text-sm text-error">
            解读失败：{errorMsg || '请稍后重试'}（预设牌义不受影响）
          </p>
        ) : null}

        {aiText ? (
          <div className="mt-3 border-t border-border pt-3">
            {/* key 随 aiState 变化：重新解读时重置错误状态 */}
            <ReadingErrorBoundary key={aiState}>
              <MarkdownRenderer content={aiText} className="text-sm" />
            </ReadingErrorBoundary>
            {aiState === 'streaming' ? (
              <span
                className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-primary align-text-bottom"
                aria-hidden
              />
            ) : null}
          </div>
        ) : null}
      </GlassCard>

      {/* 重置与复制 */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {copyFailed ? (
          <p className="w-full text-center text-xs text-error">复制失败，请手动选择文本</p>
        ) : null}
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-tech-purple/40 px-4 py-2 text-sm text-tech-purple transition-colors hover:bg-tech-purple/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          分享牌阵
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              复制解读
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          重新占卜
        </button>
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground/70">
        塔罗占卜仅供娱乐与自我觉察参考
      </p>

      <ShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        question={question}
        spread={spread}
        drawn={drawn}
        aiText={aiText}
      />
    </div>
  );
}
