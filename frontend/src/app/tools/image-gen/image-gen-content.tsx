'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clapperboard,
  ImageIcon,
  Loader2,
  RefreshCw,
  Wand2,
  X,
} from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageActHeader from '@/components/layout/PageActHeader';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import GenDrawer, { type AccountLoadState } from '@/components/ui/GenDrawer';
import CanvasStage from '@/components/tools/image-gen/CanvasStage';
import { FadeIn } from '@/components/motion';
import { createGenTask, getGenAccount, type GenType } from '@/lib/api/imageGen';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  addHistoryEntry,
  deleteHistoryEntry,
  loadHistory,
  saveHistory,
  type GenHistoryEntry,
} from '@/lib/image-gen-history';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/framer-motion';

/** 画幅预设（作为工作流额外输入 aspect_ratio 传给 RunningHub；清晰度/质量固定档） */
const SIZE_PRESETS = [
  { label: '1:1 方图', value: '1:1' },
  { label: '3:4 竖图', value: '3:4' },
  { label: '4:3 横图', value: '4:3' },
] as const;

/** RunningHub 文生图工作流固定档位：清晰度 2k、质量 medium（档位支持见 rhart-image-g-2-official 模板） */
const RUNNINGHUB_RESOLUTION = '2k';
const RUNNINGHUB_QUALITY = 'medium';

/** RunningHub 文生视频工作流固定档位：横屏 16:9、清晰度 1080p、质量 medium
 *  （rhart-video-v3.1-fast 模板：resolution 仅 720p|1080p|4k，与图片工作流的 1k|2k|4k 不同） */
const RUNNINGHUB_VIDEO_ASPECT_RATIO = '16:9';
const RUNNINGHUB_VIDEO_RESOLUTION = '1080p';
const RUNNINGHUB_VIDEO_QUALITY = 'medium';

/** 生成类型选项：图片 / 视频 */
const KIND_OPTIONS: Array<{ value: GenType; label: string }> = [
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
];

/** 示例提示词 */
const EXAMPLE_PROMPTS = [
  '月光下的静谧湖泊，倒映着满天繁星，雾气缭绕，超现实主义风格',
  '一只穿宇航服的橘猫漂浮在太空站，地球在窗外，科幻插画风',
  '江南水乡的雨后清晨，青石板路，油纸伞，水墨画风格',
  '未来城市的空中花园，垂直绿化建筑，落日余晖，概念艺术',
];

/** 尺寸预设 → 图形图标样式（方/竖/横小矩形） */
const SIZE_SHAPE: Record<string, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
};

/** 生成状态机：idle → submitting（创建任务）→ polling（轮询结果）→ done | error；取消时回 idle */
type GenState = 'idle' | 'submitting' | 'polling' | 'done' | 'error';

/** 图片/视频生成工具页：输入提示词 → 后端代理 RunningHub 工作流（图片/视频）→ 结果展示（公开，无需登录） */
export default function ImageGenContent() {
  const [kind, setKind] = useState<GenType>('image');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>(SIZE_PRESETS[0].value);
  const [count, setCount] = useState(1);
  const [state, setState] = useState<GenState>('idle');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  /** 加载失败的图片 URL 集合：失败的图用占位卡片替代 <img>，避免碎图图标 */
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  /** 生成历史（localStorage 持久化，跨会话保留，最多 30 条） */
  const [history, setHistory] = useState<GenHistoryEntry[]>(() =>
    loadHistory()
  );
  /** 当前结果区对应的历史条目 id：用于高亮历史项；新请求开始即清空 */
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  /** 生成记录抽屉开关 */
  const [drawerOpen, setDrawerOpen] = useState(false);
  /** RunningHub 账户信息加载状态（抽屉「账户」Tab 用） */
  const [accountState, setAccountState] = useState<AccountLoadState>({
    status: 'idle',
  });

  /** 是否偏好减少动画（滑动指示器 spring 回退为瞬移） */
  const shouldReduceMotion = useReducedMotion();

  // 轮询 hook：提交后 start(taskId)，success/fail/timeout/error 自动终止
  const polling = useTaskPolling({});

  /** 刷新账户信息（打开抽屉/切账户/手动重试时调用） */
  const refreshAccount = useCallback(async () => {
    setAccountState({ status: 'loading' });
    try {
      const account = await getGenAccount();
      setAccountState({ status: 'success', account });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '获取账户信息失败，请稍后重试';
      setAccountState({ status: 'error', message: msg });
    }
  }, []);

  // 抽屉打开期间每 30s 自动刷新账户（兑现 GenDrawer「每 30 秒自动刷新」文案）
  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    void refreshAccount();
    const timer = window.setInterval(() => {
      void refreshAccount();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [drawerOpen, refreshAccount]);

  /** 新增历史条目并持久化（纯函数 + 写 localStorage） */
  const appendHistory = useCallback((entry: GenHistoryEntry) => {
    setHistory(prev => {
      const next = addHistoryEntry(prev, entry);
      saveHistory(next);
      return next;
    });
  }, []);

  /** 删除单条历史并持久化 */
  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => {
      const next = deleteHistoryEntry(prev, id);
      saveHistory(next);
      return next;
    });
  }, []);

  /** 清空全部历史 */
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  /** 取消当前生成（提交中不可取消——请求很短；轮询中调 stop 终止） */
  const handleCancel = useCallback(() => {
    polling.stop();
    setState('idle');
  }, [polling]);

  /** 提交生成：创建任务 → 轮询状态 → 展示结果（图片网格 / 视频播放器） */
  const handleGenerate = useCallback(async () => {
    const text = prompt.trim();
    if (!text || state === 'submitting') {
      return;
    }
    setState('submitting');
    setErrorMsg('');
    setFailedImages(new Set());
    setActiveEntryId(null);
    try {
      const { task_id } = await createGenTask({
        type: kind,
        prompt: text,
        // 后端 schema 字段为 snake_case；内部键名依工作流而定（图片 snake_case / 视频 camelCase）
        workflow_inputs:
          kind === 'image'
            ? {
                // RunningHub 图片工作流参数：清晰度档 + 质量档 + 画幅比例 + 张数
                resolution: RUNNINGHUB_RESOLUTION,
                quality: RUNNINGHUB_QUALITY,
                aspect_ratio: size,
                count: String(count),
              }
            : {
                // RunningHub 视频工作流必填参数：画幅 + 清晰度档 + 质量档（缺失会被工作流拒绝）
                aspectRatio: RUNNINGHUB_VIDEO_ASPECT_RATIO,
                resolution: RUNNINGHUB_VIDEO_RESOLUTION,
                quality: RUNNINGHUB_VIDEO_QUALITY,
              },
      });
      // 创建成功：进入轮询；结束回调由 hook 的状态驱动下方渲染
      polling.start(task_id);
      setState('polling');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '提交生成任务失败，请稍后重试';
      const status = (err as { status?: number } | null)?.status;
      setState('error');
      setErrorMsg(
        status === 401 || status === 403 ? '登录状态已失效，请刷新后重试' : msg
      );
    }
  }, [prompt, kind, size, count, state, polling]);

  // 轮询状态变化时同步到页面状态机（success 回填结果入历史；失败/超时/错误展示错误）
  useEffect(() => {
    if (state !== 'polling') {
      return;
    }
    const { status, result, error } = polling;
    if (status === 'success' && result) {
      setImages(result.images ?? []);
      setVideoUrl(result.video_url ?? null);
      setState('done');
      // 成功且有结果 → 记入会话历史（新条目在头部，超出上限自动丢弃最旧的）
      const hasResult =
        (result.images?.length ?? 0) > 0 || Boolean(result.video_url);
      if (hasResult) {
        const entry: GenHistoryEntry = {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: Date.now(),
          kind,
          prompt: prompt.trim(),
          size: kind === 'image' ? size : undefined,
          count: kind === 'image' ? count : undefined,
          images: result.images ?? [],
          videoUrl: result.video_url ?? null,
        };
        setActiveEntryId(entry.id);
        appendHistory(entry);
      }
    } else if (
      status === 'fail' ||
      status === 'timeout' ||
      status === 'error'
    ) {
      setImages([]);
      setVideoUrl(null);
      setState('error');
      setErrorMsg(error ?? '生成失败，请稍后重试');
    }
  }, [polling, state, kind, prompt, size, count, errorMsg, appendHistory]);

  /** 恢复历史条目：回填类型/提示词/尺寸/张数，并重新展示该组结果 */
  const handleRestore = useCallback(
    (entry: GenHistoryEntry) => {
      polling.stop();
      setKind(entry.kind);
      setPrompt(entry.prompt);
      if (entry.size) {
        setSize(entry.size);
      }
      if (entry.count) {
        setCount(entry.count);
      }
      setImages(entry.images);
      setVideoUrl(entry.videoUrl);
      setActiveEntryId(entry.id);
      setState('done');
      setErrorMsg('');
    },
    [polling]
  );

  /** 结果区是否有内容（图片网格或视频）：传给 CanvasStage 决定结果/空态分支 */
  const hasResult =
    state === 'done' &&
    ((kind === 'image' && images.length > 0) ||
      (kind === 'video' && Boolean(videoUrl)));

  return (
    <PageShell density="default">
      {/* 轻量返回路径：紧凑面包屑，键盘可达，回到百宝箱 */}
      <div className="mb-6 flex justify-center">
        <Link
          href="/tools"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          百宝箱 / 图片·视频生成
        </Link>
      </div>

      {/* 幕标式页头（PageActHeader 自带 FadeIn；className 覆盖为 token 色，浅色模式可读） */}
      <PageActHeader
        kicker="AI 生成 · CREATIVE STUDIO"
        title="图片 · 视频生成"
        description="输入提示词，AI 帮你生成图片或视频"
        icon={kind === 'video' ? Clapperboard : ImageIcon}
        align="center"
        className="[&_[data-act-kicker]]:text-primary [&_h1]:text-foreground [&_p]:text-muted-foreground"
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,36%)_minmax(0,64%)] lg:items-start">
          {/* 左列：输入区（lg 以下为第一行） */}
          <div className="space-y-6">
            {/* 输入区（FadeIn 入场揭示） */}
            <FadeIn>
              <GlassCard padding="lg">
                {/* 类型切换：图片 / 视频（滑动指示器，reduced-motion 时瞬移） */}
                <div
                  role="group"
                  aria-label="生成类型"
                  className="relative mb-4 flex gap-1.5 rounded-lg border border-border p-1"
                >
                  <motion.div
                    layoutId="gen-kind-indicator"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.1 }
                        : {
                            type: 'spring' as const,
                            stiffness: 320,
                            damping: 30,
                          }
                    }
                    className={cn(
                      'absolute inset-y-1 w-[calc(50%-7px)] rounded-md bg-primary',
                      kind === 'image' ? 'left-1' : 'left-[calc(50%+3px)]'
                    )}
                  />
                  {KIND_OPTIONS.map(k => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKind(k.value)}
                      aria-pressed={kind === k.value}
                      className={cn(
                        'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        kind === k.value
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {k.value === 'video' ? (
                        <Clapperboard className="h-4 w-4" aria-hidden />
                      ) : (
                        <ImageIcon className="h-4 w-4" aria-hidden />
                      )}
                      {k.label}
                    </button>
                  ))}
                </div>

                <label
                  htmlFor="gen-prompt"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  提示词
                </label>
                <textarea
                  id="gen-prompt"
                  rows={3}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  maxLength={1000}
                  placeholder={
                    kind === 'video'
                      ? '描述你想生成的视频画面与运镜，如：夕阳下海鸥飞过灯塔，镜头缓缓拉近'
                      : '描述你想生成的画面，如：月光下的静谧湖泊，超现实主义风格'
                  }
                  className="mb-1.5 w-full resize-none rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {/* 字数统计 + 一键清空（有内容时才显示清空） */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {prompt.length}/1000
                  </span>
                  {prompt.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPrompt('');
                        // 清空后按钮卸载、焦点丢失 → 归还到提示词输入框
                        document.getElementById('gen-prompt')?.focus();
                      }}
                      aria-label="清空提示词"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      清空
                    </button>
                  ) : null}
                </div>

                {/* 示例提示词 */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {p.length > 16 ? `${p.slice(0, 16)}…` : p}
                    </button>
                  ))}
                </div>

                {/* 尺寸 + 张数（仅图片）：作为工作流额外输入传递，模板不支持时忽略 */}
                {kind === 'image' ? (
                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div
                      role="group"
                      aria-label="尺寸"
                      className="flex gap-1.5"
                    >
                      {SIZE_PRESETS.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSize(s.value)}
                          aria-pressed={size === s.value}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            size === s.value
                              ? 'border-primary/60 bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          )}
                        >
                          {/* 画幅图形示意：方/竖/横小矩形（1:1 由 style 定宽，3:4/4:3 由 aspect 类定宽） */}
                          <span
                            aria-hidden
                            className={cn(
                              'block h-3 rounded-[2px] border border-current',
                              SIZE_SHAPE[s.value]
                            )}
                            style={
                              s.value === '1:1' ? { width: 12 } : undefined
                            }
                          />
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        张数
                      </span>
                      {[1, 2, 4].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCount(n)}
                          aria-pressed={count === n}
                          className={cn(
                            'h-7 w-7 rounded-lg border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            count === n
                              ? 'border-primary/60 bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    // 生成中点击按钮 = 取消当前生成（提交中请求极短，直接终止轮询）
                    if (state === 'polling') {
                      handleCancel();
                      return;
                    }
                    handleGenerate();
                  }}
                  disabled={
                    state === 'submitting' || state === 'polling'
                      ? false
                      : !prompt.trim()
                  }
                  aria-busy={state === 'submitting' || state === 'polling'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-tech-cyan to-tech-sky px-4 py-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                >
                  {state === 'submitting' || state === 'polling' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {state === 'submitting' ? '提交中…' : '生成中… 可取消'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" aria-hidden />
                      {kind === 'video' ? '生成视频' : '生成图片'}
                    </>
                  )}
                </button>

                {/* 生成中的任务说明（RunningHub 异步：图片约几十秒，视频分钟级） */}
                {state === 'polling' ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    正在排队生成，
                    {kind === 'video'
                      ? '视频通常需要数分钟'
                      : '图片通常需要十几秒'}
                    ，请耐心等待…
                  </p>
                ) : null}

                {state === 'error' ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p role="alert" className="text-sm text-error">
                      {errorMsg}
                    </p>
                    {/* 重试沿用上一次的提示词/类型/尺寸/张数（均为保留状态），直接重新发起生成 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      重试
                    </Button>
                  </div>
                ) : null}
              </GlassCard>
            </FadeIn>
          </div>

          {/* 右列：创作台画布（结果/历史双 tab，lg+ sticky 视口） */}
          <div className="lg:sticky lg:top-24">
            <CanvasStage
              state={state}
              phase={polling.phase}
              kind={kind}
              prompt={prompt}
              size={size}
              images={images}
              videoUrl={videoUrl}
              failedImages={failedImages}
              errorMsg={errorMsg}
              history={history}
              hasResult={hasResult}
              examplePrompts={EXAMPLE_PROMPTS}
              onExampleSelect={p => {
                setPrompt(p);
                // 填入示例后把焦点放回提示词输入框（避免焦点留在画布卡片上）
                document.getElementById('gen-prompt')?.focus();
              }}
              onRestore={handleRestore}
              onDelete={handleDeleteHistory}
              onClear={handleClearHistory}
              onRetry={handleGenerate}
              onImageError={url =>
                setFailedImages(prev => new Set(prev).add(url))
              }
              onImageRetry={url =>
                setFailedImages(prev => {
                  const next = new Set(prev);
                  next.delete(url);
                  return next;
                })
              }
              activeEntryId={activeEntryId}
            />
          </div>
        </div>
      </div>

      {/* 生成记录抽屉：右下角悬浮按钮 + 右侧滑入面板（历史记录/账户） */}
      <GenDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onToggle={() => setDrawerOpen(v => !v)}
        entries={history}
        onRestore={handleRestore}
        onDelete={handleDeleteHistory}
        onClear={handleClearHistory}
        accountState={accountState}
        onRefreshAccount={refreshAccount}
      />
    </PageShell>
  );
}
