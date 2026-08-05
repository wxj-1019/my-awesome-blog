'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, Sparkles, Wand2 } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Lightbox, { type LightboxImage } from '@/components/ui/Lightbox';
import { FadeIn } from '@/components/motion';
import { generateImages, type GeneratedImage } from '@/lib/api/imageGen';
import { cn } from '@/lib/utils';

/** 尺寸预设（火山 Seedream 常用） */
const SIZE_PRESETS = [
  { label: '1:1 方图', value: '1024x1024' },
  { label: '3:4 竖图', value: '1024x1536' },
  { label: '4:3 横图', value: '1536x1024' },
] as const;

/** 示例提示词 */
const EXAMPLE_PROMPTS = [
  '月光下的静谧湖泊，倒映着满天繁星，雾气缭绕，超现实主义风格',
  '一只穿宇航服的橘猫漂浮在太空站，地球在窗外，科幻插画风',
  '江南水乡的雨后清晨，青石板路，油纸伞，水墨画风格',
  '未来城市的空中花园，垂直绿化建筑，落日余晖，概念艺术',
];

/** 生成状态机：idle → loading → done | error；取消时回 idle */
type GenState = 'idle' | 'loading' | 'done' | 'error';

/** 图片生成工具页：输入提示词 → 后端代理火山方舟文生图 → 网格展示/放大/下载（公开，无需登录） */
export default function ImageGenContent() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>(SIZE_PRESETS[0].value);
  const [count, setCount] = useState(1);
  const [state, setState] = useState<GenState>('idle');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
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
    try {
      const resp = await generateImages({ prompt: text, size, count }, controller.signal);
      setImages(resp.images);
      setState('done');
    } catch (err) {
      // 主动取消：浏览器 fetch 中止抛 DOMException AbortError（不一定 instanceof Error）
      const errName =
        err instanceof Error ? err.name : (err as { name?: unknown } | null)?.name;
      if (errName === 'AbortError') {
        setState('idle');
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
  }, [prompt, size, count]);

  const lightboxImages: LightboxImage[] = images.map((img, i) => ({
    id: `${i}`,
    src: img.url,
    alt: prompt.trim() || `生成图片 ${i + 1}`,
  }));

  return (
    <PageShell density="default">
      <PageHeader
        title="图片生成"
        description="输入提示词，AI 帮你生成图片——火山方舟文生图驱动"
        icon={ImageIcon}
        align="center"
      />

      <div className="mx-auto max-w-3xl space-y-6">
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

          {/* 尺寸 + 张数 */}
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
            <p className="mt-3 text-sm text-error">{errorMsg}</p>
          ) : null}
        </GlassCard>

        {/* 结果区 */}
        {state === 'done' && images.length > 0 ? (
          <FadeIn>
            <GlassCard padding="md">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-tech-purple" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">生成结果</h2>
                <span className="ml-auto text-xs text-muted-foreground">{images.length} 张</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img, i) => (
                  <div key={`${img.url}-${i}`} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                      aria-label={`查看生成图片 ${i + 1}`}
                      className="block w-full overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`生成图片 ${i + 1}`}
                        className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                点击图片可放大、下载；生成图地址为临时链接，请及时保存
              </p>
            </GlassCard>
          </FadeIn>
        ) : null}
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
