'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clapperboard,
  Download,
  History,
  ImageIcon,
  ImageOff,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageActHeader from '@/components/layout/PageActHeader';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Lightbox, { type LightboxImage } from '@/components/ui/Lightbox';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import {
  createGenTask,
  type GenType,
} from '@/lib/api/imageGen';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { addHistoryEntry, type GenHistoryEntry } from '@/lib/image-gen-history';
import { cn } from '@/lib/utils';

/** 画幅预设（作为工作流额外输入 aspect_ratio 传给 RunningHub；清晰度/质量固定档） */
const SIZE_PRESETS = [
  { label: '1:1 方图', value: '1:1' },
  { label: '3:4 竖图', value: '3:4' },
  { label: '4:3 横图', value: '4:3' },
] as const;

/** RunningHub 文生图工作流固定档位：清晰度 2k、质量 medium（档位支持见 rhart-image-g-2-official 模板） */
const RUNNINGHUB_RESOLUTION = '2k';
const RUNNINGHUB_QUALITY = 'medium';

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

/** 画幅字符串 → 结果图对应的宽高比 class（未知画幅兜底方图） */
const SIZE_ASPECT: Record<string, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
};

/** 历史条目提示词过长时截断显示 */
function truncatePrompt(text: string): string {
  return text.length > 24 ? `${text.slice(0, 24)}…` : text;
}

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
  /** 本次会话的生成历史（刷新后清空），最多保留最近 5 组 */
  const [history, setHistory] = useState<GenHistoryEntry[]>([]);
  /** 当前结果区对应的历史条目 id：用于高亮历史项；新请求开始即清空 */
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 轮询 hook：提交后 start(taskId)，success/fail/timeout/error 自动终止
  const polling = useTaskPolling({});

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
        workflowInputs:
          kind === 'image'
            ? {
                // RunningHub 工作流参数：清晰度档 + 质量档 + 画幅比例 + 张数
                resolution: RUNNINGHUB_RESOLUTION,
                quality: RUNNINGHUB_QUALITY,
                aspect_ratio: size,
                count: String(count),
              }
            : undefined,
      });
      // 创建成功：进入轮询；结束回调由 hook 的状态驱动下方渲染
      polling.start(task_id);
      setState('polling');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交生成任务失败，请稍后重试';
      const status = (err as { status?: number } | null)?.status;
      setState('error');
      setErrorMsg(status === 401 || status === 403 ? '登录状态已失效，请刷新后重试' : msg);
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
      const hasResult = (result.images?.length ?? 0) > 0 || Boolean(result.video_url);
      if (hasResult) {
        const entry: GenHistoryEntry = {
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: Date.now(),
          kind,
          prompt: prompt.trim(),
          size: kind === 'image' ? size : undefined,
          count: kind === 'image' ? count : undefined,
          images: result.images ?? [],
          videoUrl: result.video_url ?? null,
        };
        setActiveEntryId(entry.id);
        setHistory((prev) => addHistoryEntry(prev, entry));
      }
    } else if (status === 'fail' || status === 'timeout' || status === 'error') {
      setImages([]);
      setVideoUrl(null);
      setState('error');
      setErrorMsg(error ?? '生成失败，请稍后重试');
    }
  }, [polling, state, kind, prompt, size, count, errorMsg]);

  /** 恢复历史条目：回填类型/提示词/尺寸/张数，并重新展示该组结果 */
  const handleRestore = useCallback(
    (entry: GenHistoryEntry) => {
      polling.stop();
      setKind(entry.kind);
      setPrompt(entry.prompt);
      if (entry.size) {setSize(entry.size);}
      if (entry.count) {setCount(entry.count);}
      setImages(entry.images);
      setVideoUrl(entry.videoUrl);
      setActiveEntryId(entry.id);
      setState('done');
      setErrorMsg('');
    },
    [polling]
  );

  const lightboxImages: LightboxImage[] = images.map((url, i) => ({
    id: `${i}`,
    src: url,
    alt: prompt.trim() || `生成图片 ${i + 1}`,
  }));

  /** 结果区是否有内容（图片网格或视频） */
  const hasResult =
    state === 'done' && ((kind === 'image' && images.length > 0) || (kind === 'video' && videoUrl));

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
            {/* 输入区 */}
            <GlassCard padding="lg">
              {/* 类型切换：图片 / 视频 */}
              <div
                role="group"
                aria-label="生成类型"
                className="mb-4 flex gap-1.5 rounded-lg border border-border p-1"
              >
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setKind(k.value)}
                    aria-pressed={kind === k.value}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      kind === k.value
                        ? 'bg-primary text-primary-foreground'
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

              <label htmlFor="gen-prompt" className="mb-2 block text-sm font-medium text-foreground">
                提示词
              </label>
              <textarea
                id="gen-prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={1000}
                placeholder={
                  kind === 'video'
                    ? '描述你想生成的视频画面与运镜，如：夕阳下海鸥飞过灯塔，镜头缓缓拉近'
                    : '描述你想生成的画面，如：月光下的静谧湖泊，超现实主义风格'
                }
                className="mb-3 w-full resize-none rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              {/* 示例提示词 */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((p) => (
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
                  <div role="group" aria-label="尺寸" className="flex gap-1.5">
                    {SIZE_PRESETS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSize(s.value)}
                        aria-pressed={size === s.value}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          size === s.value
                            ? 'border-primary/60 bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">张数</span>
                    {[1, 2, 4].map((n) => (
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
                disabled={(state === 'submitting' || state === 'polling') ? false : !prompt.trim()}
                aria-busy={state === 'submitting' || state === 'polling'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
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
                  正在排队生成，{kind === 'video' ? '视频通常需要数分钟' : '图片通常需要十几秒'}，请耐心等待…
                </p>
              ) : null}

              {state === 'error' ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p role="alert" className="text-sm text-error">{errorMsg}</p>
                  {/* 重试沿用上一次的提示词/类型/尺寸/张数（均为保留状态），直接重新发起生成 */}
                  <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    重试
                  </Button>
                </div>
              ) : null}
            </GlassCard>
          </div>

          {/* 右列：结果区 + 本次会话历史（lg 以下跟在输入区之后） */}
          <div className="space-y-6">
            {/* 结果区：成功但无结果 → 空态；成功且有结果 → 图片网格 / 视频播放器 */}
            {state === 'done' && !hasResult ? (
              <FadeIn>
                <GlassCard padding="md">
                  <EmptyState
                    icon={kind === 'video' ? Clapperboard : ImageIcon}
                    title="没有生成结果"
                    description="可调整提示词后重试"
                    action={{
                      label: '重新生成',
                      icon: RefreshCw,
                      onClick: handleGenerate,
                    }}
                  />
                </GlassCard>
              </FadeIn>
            ) : null}
            {hasResult ? (
              /* 结果卡 reveal：Stagger 级联入场（标题先入、图片依次浮现，仅 opacity+y 轻量揭示，
                 不逐张弹跳；reduced-motion 时 Stagger 直接渲染）。
                 key 绑定 activeEntryId：恢复历史时整组重挂载，避免 Stagger 已 visible 时
                 新卡片卡在 opacity:0（同 skills-content 的 key 重挂载模式） */
              <Stagger key={activeEntryId ?? 'fresh'}>
                <GlassCard padding="md">
                  <StaggerItem>
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-tech-purple" aria-hidden />
                      <h2 className="text-sm font-semibold text-foreground">生成结果</h2>
                      {kind === 'video' ? (
                        <span className="ml-auto text-xs text-muted-foreground">视频</span>
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground">{images.length} 张</span>
                      )}
                    </div>
                  </StaggerItem>

                  {kind === 'video' && videoUrl ? (
                    /* 视频结果：播放器 + 下载 */
                    <StaggerItem>
                      <div className="overflow-hidden rounded-lg border border-border">
                        <video
                          src={videoUrl}
                          controls
                          preload="metadata"
                          className="aspect-video w-full bg-black/5"
                          aria-label="生成的视频"
                        >
                          您的浏览器不支持视频播放，请
                          <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
                            点击下载
                          </a>
                        </video>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={videoUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          下载视频
                        </a>
                        <span className="text-xs text-muted-foreground">
                          视频地址为临时链接，请及时保存
                        </span>
                      </div>
                    </StaggerItem>
                  ) : null}

                  {kind === 'image' && images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {images.map((url, i) => (
                        <StaggerItem key={`${url}-${i}`} className="group relative">
                          {failedImages.has(url) ? (
                            /* 加载失败的图：占位卡片 + 重试按钮（重新渲染 <img> 触发浏览器重载） */
                            <div
                              className={cn(
                                'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 text-center text-muted-foreground',
                                SIZE_ASPECT[size] ?? 'aspect-square'
                              )}
                            >
                              <ImageOff className="h-5 w-5" aria-hidden />
                              <span className="text-xs">图片加载失败</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFailedImages((prev) => {
                                    const next = new Set(prev);
                                    next.delete(url);
                                    return next;
                                  })
                                }
                                className="rounded border border-border px-2 py-0.5 text-[11px] transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                重试加载
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setLightboxIndex(i);
                                setLightboxOpen(true);
                              }}
                              aria-label={`查看生成图片 ${i + 1}`}
                              className={cn(
                                'block w-full overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                SIZE_ASPECT[size] ?? 'aspect-square'
                              )}
                            >
                              <img
                                src={url}
                                alt={prompt.trim() || `生成图片 ${i + 1}`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                loading="lazy"
                                onError={() =>
                                  setFailedImages((prev) => new Set(prev).add(url))
                                }
                              />
                            </button>
                          )}
                        </StaggerItem>
                      ))}
                    </div>
                  ) : null}
                </GlassCard>
              </Stagger>
            ) : null}

            {/* 本次会话历史：刷新后清空，最多 5 组，点击条目一键恢复 */}
            {history.length > 0 ? (
              <FadeIn>
                <GlassCard padding="md">
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-tech-purple" aria-hidden />
                      <h2 className="text-sm font-semibold text-foreground">本次会话历史</h2>
                      <span className="ml-auto text-xs text-muted-foreground">最多 5 组</span>
                    </div>
                    {/* 临时链接与保留期限说明：原在结果区底部，移入历史区头部统一提示 */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      生成地址为临时链接，请及时保存；历史仅本次会话保留，刷新后清空
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {history.map((entry) => {
                      const first = entry.images[0];
                      const active = entry.id === activeEntryId;
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => handleRestore(entry)}
                            aria-current={active ? 'true' : undefined}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              active
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            )}
                          >
                            {/* 缩略图：图片取首图；视频显示播放图标（加载失败复用占位） */}
                            {entry.kind === 'image' && first && !failedImages.has(first) ? (
                              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
                                <img
                                  src={first}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={() =>
                                    setFailedImages((prev) => new Set(prev).add(first))
                                  }
                                />
                              </span>
                            ) : (
                              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                                {entry.kind === 'video' ? (
                                  <Clapperboard className="h-4 w-4" aria-hidden />
                                ) : (
                                  <ImageOff className="h-4 w-4" aria-hidden />
                                )}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-foreground">
                                {truncatePrompt(entry.prompt)}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {entry.kind === 'video' ? '视频' : `${entry.size ?? ''} · ${entry.count ?? 1} 张`}
                              </span>
                            </span>
                            <RotateCcw className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </GlassCard>
              </FadeIn>
            ) : null}
          </div>
        </div>
      </div>

      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={() => setLightboxIndex((i) => (i + 1) % Math.max(images.length, 1))}
        onPrevious={() => setLightboxIndex((i) => (i - 1 + images.length) % Math.max(images.length, 1))}
        enableZoom
        enableDownload
      />
    </PageShell>
  );
}
