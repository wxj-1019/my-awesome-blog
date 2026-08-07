'use client';

import { useMemo, useState } from 'react';
import {
  Clapperboard,
  Download,
  ImageIcon,
  ImageOff,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import EmptyState from '@/components/ui/EmptyState';
import Lightbox, { type LightboxImage } from '@/components/ui/Lightbox';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { GenType } from '@/lib/api/imageGen';
import type { GenHistoryEntry } from '@/lib/image-gen-history';
import HistoryList from './HistoryList';
import ProgressSteps from './ProgressSteps';

/** 画幅字符串 → 结果图对应宽高比 class（未知画幅兜底方图） */
const SIZE_ASPECT: Record<string, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
};

/** 页面生成状态机（与父组件一致） */
export type CanvasGenState =
  | 'idle'
  | 'submitting'
  | 'polling'
  | 'done'
  | 'error';

interface CanvasStageProps {
  state: CanvasGenState;
  /** 轮询阶段（useTaskPolling.phase；polling 状态下有意义） */
  phase: 'idle' | 'pending' | 'running' | 'done';
  kind: GenType;
  prompt: string;
  size: string;
  images: string[];
  videoUrl: string | null;
  /** 加载失败的图片 URL 集合 */
  failedImages: Set<string>;
  errorMsg: string;
  history: GenHistoryEntry[];
  /** 是否有可展示结果（done 且非空） */
  hasResult: boolean;
  /** 空态灵感示例（点击填入提示词） */
  examplePrompts: string[];
  onExampleSelect: (prompt: string) => void;
  onRestore: (entry: GenHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onRetry: () => void;
  onImageError: (url: string) => void;
  onImageRetry: (url: string) => void;
  /** 结果区当前对应历史条目 id（Stagger 重挂载 key） */
  activeEntryId: string | null;
}

/**
 * 创作台画布：结果 / 历史 双 tab。
 * 结果 tab 四态：idle 灵感引导 → submitting/polling 阶段进度 → done 结果（图片网格/视频）→ error 错误重试。
 * Lightbox 预览状态内聚于此，父组件不再持有。
 */
export default function CanvasStage({
  state,
  phase,
  kind,
  prompt,
  size,
  images,
  videoUrl,
  failedImages,
  errorMsg,
  history,
  hasResult,
  examplePrompts,
  onExampleSelect,
  onRestore,
  onDelete,
  onClear,
  onRetry,
  onImageError,
  onImageRetry,
  activeEntryId,
}: CanvasStageProps) {
  const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      // 过滤掉加载失败的图：失败项在网格中渲染为占位（非按钮），不进 Lightbox；
      // 预览索引由网格按钮按「之前未失败项数量」换算（见 ResultPanel 网格 onClick）
      images
        .filter(url => !failedImages.has(url))
        .map((url, i) => ({
          id: `${i}`,
          src: url,
          alt: prompt.trim() || `生成图片 ${i + 1}`,
        })),
    [images, prompt, failedImages]
  );

  /** 进度阶段映射：submitting=排队，polling+pending=排队，polling+running=生成，done=完成 */
  const progressIndex: 0 | 1 | 2 =
    state === 'done' || phase === 'done' ? 2 : phase === 'running' ? 1 : 0;
  const progressText =
    state === 'submitting'
      ? '正在提交任务…'
      : phase === 'running'
        ? '正在生成，请耐心等待…'
        : '任务排队中，请稍候…';

  const tabClass = (active: boolean) =>
    cn(
      'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <GlassCard padding="md" className="flex min-h-[420px] flex-col">
      {/* Tab：结果 / 历史 */}
      <div
        role="tablist"
        aria-label="画布内容"
        className="mb-4 flex gap-1.5 rounded-lg border border-border p-1"
      >
        <button
          type="button"
          role="tab"
          id="canvas-tab-result"
          aria-selected={activeTab === 'result'}
          aria-controls="canvas-panel-result"
          onClick={() => setActiveTab('result')}
          className={tabClass(activeTab === 'result')}
        >
          结果
        </button>
        <button
          type="button"
          role="tab"
          id="canvas-tab-history"
          aria-selected={activeTab === 'history'}
          aria-controls="canvas-panel-history"
          onClick={() => setActiveTab('history')}
          className={tabClass(activeTab === 'history')}
        >
          历史
        </button>
      </div>

      {activeTab === 'history' ? (
        <div
          role="tabpanel"
          id="canvas-panel-history"
          aria-labelledby="canvas-tab-history"
          className="flex-1 overflow-y-auto"
        >
          <HistoryList
            entries={history}
            onRestore={onRestore}
            onDelete={onDelete}
            onClear={onClear}
          />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="canvas-panel-result"
          aria-labelledby="canvas-tab-result"
          className="flex-1 overflow-y-auto"
        >
          <ResultPanel
            state={state}
            kind={kind}
            prompt={prompt}
            size={size}
            images={images}
            videoUrl={videoUrl}
            failedImages={failedImages}
            errorMsg={errorMsg}
            hasResult={hasResult}
            examplePrompts={examplePrompts}
            onExampleSelect={onExampleSelect}
            onRetry={onRetry}
            onImageError={onImageError}
            onImageRetry={onImageRetry}
            activeEntryId={activeEntryId}
            progressIndex={progressIndex}
            progressText={progressText}
            onLightboxOpen={i => {
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
          />
        </div>
      )}

      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={() =>
          setLightboxIndex(i => (i + 1) % Math.max(images.length, 1))
        }
        onPrevious={() =>
          setLightboxIndex(
            i => (i - 1 + images.length) % Math.max(images.length, 1)
          )
        }
        enableZoom
        enableDownload
      />
    </GlassCard>
  );
}

/* ---------------- 结果面板（四态） ---------------- */

interface ResultPanelProps extends Omit<
  CanvasStageProps,
  'history' | 'onRestore' | 'onDelete' | 'onClear' | 'phase'
> {
  progressIndex: 0 | 1 | 2;
  progressText: string;
  onLightboxOpen: (index: number) => void;
}

function ResultPanel({
  state,
  kind,
  prompt,
  size,
  images,
  videoUrl,
  failedImages,
  errorMsg,
  hasResult,
  examplePrompts,
  onExampleSelect,
  onRetry,
  onImageError,
  onImageRetry,
  activeEntryId,
  progressIndex,
  progressText,
  onLightboxOpen,
}: ResultPanelProps) {
  // 生成中：阶段进度
  if (state === 'submitting' || state === 'polling') {
    return (
      <FadeIn>
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <ProgressSteps
            activeIndex={progressIndex}
            statusText={progressText}
          />
          <p className="text-xs text-muted-foreground">
            {kind === 'video' ? '视频通常需要数分钟' : '图片通常需要十几秒'}
            ，可先切换到历史查看之前的作品
          </p>
        </div>
      </FadeIn>
    );
  }

  // 失败：错误 + 重试
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p role="alert" className="text-sm text-error">
          {errorMsg}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          重试
        </button>
      </div>
    );
  }

  // 成功但无结果
  if (state === 'done' && !hasResult) {
    return (
      <FadeIn>
        <EmptyState
          icon={kind === 'video' ? Clapperboard : ImageIcon}
          title="没有生成结果"
          description="可调整提示词后重试"
          action={{
            label: '重新生成',
            icon: RefreshCw,
            onClick: onRetry,
          }}
        />
      </FadeIn>
    );
  }

  // 成功且有结果：结果标题 + 视频/图片
  if (hasResult) {
    return (
      <Stagger key={activeEntryId ?? 'fresh'}>
        <StaggerItem>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-tech-purple" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">生成结果</h2>
            {kind === 'video' ? (
              <span className="ml-auto text-xs text-muted-foreground">
                视频
              </span>
            ) : (
              <span className="ml-auto text-xs text-muted-foreground">
                {images.length} 张
              </span>
            )}
          </div>
        </StaggerItem>

        {kind === 'video' && videoUrl ? (
          <StaggerItem>
            <VideoResult url={videoUrl} />
          </StaggerItem>
        ) : null}

        {kind === 'image' && images.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((url, i) => (
              <StaggerItem key={`${url}-${i}`} className="group relative">
                {failedImages.has(url) ? (
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
                      onClick={() => onImageRetry(url)}
                      className="rounded border border-border px-2 py-0.5 text-[11px] transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      重试加载
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    // 网格按全量数组迭代（i 为全量索引）；换算为「之前未失败项数量」
                    // 即该图在 lightboxImages 中的位置，保证预览与展示一致
                    onClick={() =>
                      onLightboxOpen(
                        images.filter((u, j) => j < i && !failedImages.has(u))
                          .length
                      )
                    }
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
                      onError={() => onImageError(url)}
                    />
                  </button>
                )}
              </StaggerItem>
            ))}
          </div>
        ) : null}
      </Stagger>
    );
  }

  // idle 空态：灵感引导
  return (
    <FadeIn>
      <div className="py-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">生成结果</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          还没有结果。输入提示词点击生成，或从灵感卡片开始：
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {examplePrompts.map(p => (
            <li key={p}>
              <button
                type="button"
                onClick={() => onExampleSelect(p)}
                className="flex h-full w-full items-center gap-2 rounded-lg border border-border p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Sparkles
                  className="h-3.5 w-3.5 shrink-0 text-tech-purple"
                  aria-hidden
                />
                <span className="line-clamp-2">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  );
}

/* ---------------- 视频结果 ---------------- */

function VideoResult({ url }: { url: string }) {
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-border">
        {videoLoading ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/5"
            aria-hidden
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground motion-reduce:animate-none" />
          </div>
        ) : null}
        <video
          src={url}
          controls
          preload="metadata"
          onLoadStart={() => setVideoLoading(true)}
          onCanPlay={() => {
            setVideoLoading(false);
            // 链接修复后原生重试成功（onCanPlay 会再次触发），清除错误提示
            setVideoError(false);
          }}
          onError={() => {
            // 加载失败（404/链接过期）：隐藏旋转指示并提示
            setVideoLoading(false);
            setVideoError(true);
          }}
          className="aspect-video w-full bg-black/5"
          aria-label="生成的视频"
        >
          您的浏览器不支持视频播放，请
          <a href={url} target="_blank" rel="noreferrer" className="underline">
            点击下载
          </a>
        </video>
      </div>
      {videoError ? (
        <p className="mt-2 text-sm text-error">
          视频加载失败，链接可能已过期，请重新生成或下载
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <a
          href={url}
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
    </div>
  );
}
