'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, History, ImageIcon, ImageOff, Loader2, RefreshCw, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageActHeader from '@/components/layout/PageActHeader';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Lightbox, { type LightboxImage } from '@/components/ui/Lightbox';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { generateImages, type GeneratedImage, type ImageGenProvider } from '@/lib/api/imageGen';
import { addHistoryEntry, type GenHistoryEntry } from '@/lib/image-gen-history';
import { cn } from '@/lib/utils';

/** 尺寸预设（火山 Seedream / gpt-image 常用） */
const SIZE_PRESETS = [
  { label: '1:1 方图', value: '1024x1024' },
  { label: '3:4 竖图', value: '1024x1536' },
  { label: '4:3 横图', value: '1536x1024' },
] as const;

/** 模型来源选项 */
const PROVIDER_OPTIONS: Array<{ value: ImageGenProvider; label: string }> = [
  { value: 'ark', label: '火山 Seedream' },
  { value: 'openai', label: 'OpenAI gpt-image' },
];

/** 示例提示词 */
const EXAMPLE_PROMPTS = [
  '月光下的静谧湖泊，倒映着满天繁星，雾气缭绕，超现实主义风格',
  '一只穿宇航服的橘猫漂浮在太空站，地球在窗外，科幻插画风',
  '江南水乡的雨后清晨，青石板路，油纸伞，水墨画风格',
  '未来城市的空中花园，垂直绿化建筑，落日余晖，概念艺术',
];

/** 尺寸字符串 → 结果图对应的宽高比 class（未知尺寸兜底方图） */
const SIZE_ASPECT: Record<string, string> = {
  '1024x1024': 'aspect-square',
  '1024x1536': 'aspect-[3/4]',
  '1536x1024': 'aspect-[4/3]',
};

/** 历史条目提示词过长时截断显示 */
function truncatePrompt(text: string): string {
  return text.length > 24 ? `${text.slice(0, 24)}…` : text;
}

/** 生成状态机：idle → loading → done | error；取消时回 idle */
type GenState = 'idle' | 'loading' | 'done' | 'error';

/** 图片生成工具页：输入提示词 → 后端代理火山方舟文生图 → 网格展示/放大/下载（公开，无需登录） */
export default function ImageGenContent() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>(SIZE_PRESETS[0].value);
  const [count, setCount] = useState(1);
  const [provider, setProvider] = useState<ImageGenProvider>('ark');
  const [state, setState] = useState<GenState>('idle');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  /** 加载失败的图片 URL 集合：失败的图用占位卡片替代 <img>，避免碎图图标 */
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  /** 本次会话的生成历史（刷新后清空），最多保留最近 5 组 */
  const [history, setHistory] = useState<GenHistoryEntry[]>([]);
  /** 当前结果区对应的历史条目 id：用于高亮历史项；新请求开始即清空 */
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  /** 当前请求的 AbortController：新请求/取消/卸载时中止旧请求 */
  const abortRef = useRef<AbortController | null>(null);

  // 组件卸载时中止未完成的生成请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    const text = prompt.trim();
    if (!text) {return;}
    // 新请求先取消上一个未完成的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('loading');
    setErrorMsg('');
    // 新一轮生成：清掉上一轮的加载失败记录与结果高亮，重新渲染图片
    setFailedImages(new Set());
    setActiveEntryId(null);
    try {
      const resp = await generateImages({ prompt: text, size, count, provider }, controller.signal);
      setImages(resp.images);
      setState('done');
      // 成功且有图 → 记入会话历史（新条目在头部，超出上限自动丢弃最旧的）
      if (resp.images.length > 0) {
        const entry: GenHistoryEntry = {
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: Date.now(),
          prompt: text,
          size,
          count,
          provider,
          images: resp.images,
        };
        setActiveEntryId(entry.id);
        setHistory((prev) => addHistoryEntry(prev, entry));
      }
    } catch (err) {
      // 主动取消：浏览器 fetch 中止抛 DOMException AbortError（不一定 instanceof Error）
      const errName =
        err instanceof Error ? err.name : (err as { name?: unknown } | null)?.name;
      if (errName === 'AbortError') {
        // 仅当没有新请求/恢复接管时才回 idle：恢复历史会主动中止在途请求，
        // 此时状态已由 handleRestore 设为 done，不能回退成 idle
        if (abortRef.current === controller) {
          setState('idle');
        }
        return;
      }
      const msg = err instanceof Error ? err.message : '生成失败，请稍后重试';
      // 公开接口极少返回 401/403；真遇到登录态失效时提示刷新即可，不做跳转引导
      const status = (err as { status?: number } | null)?.status;
      setState('error');
      setErrorMsg(status === 401 || status === 403 ? '登录状态已失效，请刷新后重试' : msg);
    } finally {
      // 请求已结算（成功/失败/取消），清掉引用，避免后续误中止新请求
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [prompt, size, count, provider]);

  /** 恢复历史条目：回填提示词/尺寸/张数/来源，并重新展示该组结果 */
  const handleRestore = useCallback((entry: GenHistoryEntry) => {
    // 恢复历史时中止在途请求，避免旧请求回写覆盖恢复后的结果
    abortRef.current?.abort();
    abortRef.current = null;
    setPrompt(entry.prompt);
    setSize(entry.size);
    setCount(entry.count);
    if (entry.provider) {setProvider(entry.provider);}
    setImages(entry.images);
    setActiveEntryId(entry.id);
    setState('done');
    setErrorMsg('');
  }, []);

  const lightboxImages: LightboxImage[] = images.map((img, i) => ({
    id: `${i}`,
    src: img.url,
    alt: prompt.trim() || `生成图片 ${i + 1}`,
  }));

  return (
    <PageShell density="default">
      {/* 轻量返回路径：紧凑面包屑，键盘可达，回到百宝箱 */}
      <div className="mb-6 flex justify-center">
        <Link
          href="/tools"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          百宝箱 / 图片生成
        </Link>
      </div>

      {/* 幕标式页头（PageActHeader 自带 FadeIn；className 覆盖为 token 色，浅色模式可读） */}
      <PageActHeader
        kicker="图片生成 · IMAGE STUDIO"
        title="图片生成"
        description="输入提示词，AI 帮你生成图片"
        icon={ImageIcon}
        align="center"
        className="[&_[data-act-kicker]]:text-primary [&_h1]:text-foreground [&_p]:text-muted-foreground"
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,36%)_minmax(0,64%)] lg:items-start">
          {/* 左列：输入区（lg 以下为第一行） */}
          <div className="space-y-6">
            {/* 输入区 */}
            <GlassCard padding="lg">
              <label htmlFor="gen-prompt" className="mb-2 block text-sm font-medium text-foreground">
                提示词
              </label>
              <textarea
                id="gen-prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={1000}
                placeholder="描述你想生成的画面，如：月光下的静谧湖泊，超现实主义风格"
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

              {/* 模型来源 + 尺寸 + 张数 */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div role="group" aria-label="模型来源" className="flex gap-1.5">
                  {PROVIDER_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setProvider(p.value)}
                      aria-pressed={provider === p.value}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        provider === p.value
                          ? 'border-tech-purple/60 bg-tech-purple/10 text-tech-purple'
                          : 'border-border text-muted-foreground hover:border-tech-purple/40 hover:text-tech-purple'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
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

              <button
                type="button"
                onClick={() => {
                  // 生成中点击按钮 = 取消当前请求
                  if (state === 'loading') {
                    abortRef.current?.abort();
                    return;
                  }
                  handleGenerate();
                }}
                disabled={state !== 'loading' && !prompt.trim()}
                aria-busy={state === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
              >
                {state === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    生成中… 可取消
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" aria-hidden />
                    生成图片
                  </>
                )}
              </button>

              {state === 'error' ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p role="alert" className="text-sm text-error">{errorMsg}</p>
                  {/* 重试沿用上一次的提示词/尺寸/张数（均为保留状态），直接重新发起生成 */}
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
            {/* 结果区：成功但无图 → 空态 + 重新生成；成功且有图 → 网格展示 */}
            {state === 'done' && images.length === 0 ? (
              <FadeIn>
                <GlassCard padding="md">
                  <EmptyState
                    icon={ImageIcon}
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
            {state === 'done' && images.length > 0 ? (
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
                      <span className="ml-auto text-xs text-muted-foreground">{images.length} 张</span>
                    </div>
                  </StaggerItem>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {images.map((img, i) => (
                      <StaggerItem key={`${img.url}-${i}`} className="group relative">
                        {failedImages.has(img.url) ? (
                          /* 加载失败的图：占位卡片 + 重试按钮（重新渲染 <img> 触发浏览器重载） */
                          <div
                            className={cn(
                              'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 text-center text-muted-foreground',
                              SIZE_ASPECT[img.size] ?? 'aspect-square'
                            )}
                          >
                            <ImageOff className="h-5 w-5" aria-hidden />
                            <span className="text-xs">图片加载失败</span>
                            <button
                              type="button"
                              onClick={() =>
                                setFailedImages((prev) => {
                                  const next = new Set(prev);
                                  next.delete(img.url);
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
                              SIZE_ASPECT[img.size] ?? 'aspect-square'
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={prompt.trim() || `生成图片 ${i + 1}`}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              loading="lazy"
                              onError={() =>
                                setFailedImages((prev) => new Set(prev).add(img.url))
                              }
                            />
                          </button>
                        )}
                      </StaggerItem>
                    ))}
                  </div>
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
                      生成图地址为临时链接，请及时保存；历史仅本次会话保留，刷新后清空
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
                            {/* 缩略图：加载失败的图复用 failedImages 占位（与结果区一致） */}
                            {first && !failedImages.has(first.url) ? (
                              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={first.url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={() =>
                                    setFailedImages((prev) => new Set(prev).add(first.url))
                                  }
                                />
                              </span>
                            ) : (
                              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                                <ImageOff className="h-4 w-4" aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-foreground">
                                {truncatePrompt(entry.prompt)}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {entry.provider === 'openai' ? 'gpt-image · ' : ''}
                                {entry.size} · {entry.count} 张
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
