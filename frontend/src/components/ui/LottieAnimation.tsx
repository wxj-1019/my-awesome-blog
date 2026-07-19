'use client';

import React, { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** 动态导入，避免 SSR 端缺少 window/canvas */
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export interface LottieAnimationProps {
  /**
   * 动画数据：
   * - 字符串：`/lottie/xxx.json`（推荐本地）或可 fetch 的 JSON URL
   * - 对象：已解析的 Lottie animationData
   */
  src: string | object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: CSSProperties;
  /**
   * 加载中 / 失败 /（默认）reduced-motion 时的回退 UI。
   * 业务侧通常传 lucide 图标容器。
   */
  fallback?: ReactNode;
  /**
   * true：reduced-motion 时仍渲染 Lottie，但 loop/autoplay 关闭（近似首帧）。
   * false（默认）：reduced-motion 时直接用 fallback，不加载播放。
   */
  staticOnReduceMotion?: boolean;
  /** 加载失败时回调（不抛到业务） */
  onError?: (error: unknown) => void;
}

/**
 * 全站 Lottie 封装（L3 插画级）。
 * - 禁止默认远程地址；调用方必须显式传 src
 * - 尊重 prefers-reduced-motion
 * - 失败 / 加载中可回退 fallback
 */
const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  loop = true,
  autoplay = true,
  className,
  style,
  fallback = null,
  staticOnReduceMotion = false,
  onError,
}) => {
  const reducedMotion = useReducedMotion();
  const [animationData, setAnimationData] = useState<object | null>(
    typeof src === 'object' && src !== null ? src : null
  );
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(typeof src === 'string');

  // reduced-motion 且不要求静态帧：不拉资源、不播动画
  const skipPlayback = reducedMotion && !staticOnReduceMotion;

  useEffect(() => {
    if (skipPlayback) {
      setLoading(false);
      return;
    }

    if (typeof src !== 'string') {
      setAnimationData(src);
      setFailed(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    fetch(src)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Lottie fetch failed: ${response.status} ${src}`);
        }
        const contentType = response.headers.get('content-type') || '';
        // 拒绝 HTML embed 页被当成 JSON
        if (contentType.includes('text/html')) {
          throw new Error(`Lottie src returned HTML, not JSON: ${src}`);
        }
        return response.json() as Promise<object>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid Lottie JSON');
        }
        setAnimationData(data);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        console.error('Error loading Lottie animation:', error);
        setFailed(true);
        setAnimationData(null);
        setLoading(false);
        onError?.(error);
      });

    return () => {
      cancelled = true;
    };
    // onError 不进依赖，避免父组件内联函数导致重复 fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [src, skipPlayback]);

  if (skipPlayback || failed || (!animationData && !loading)) {
    if (fallback) {
      return (
        <div className={cn('relative', className)} style={style} aria-hidden>
          {fallback}
        </div>
      );
    }
    return null;
  }

  if (loading || !animationData) {
    if (fallback) {
      return (
        <div className={cn('relative', className)} style={style} aria-hidden>
          {fallback}
        </div>
      );
    }
    return (
      <div
        className={cn('animate-pulse rounded-lg bg-muted/40', className)}
        style={style}
        aria-hidden
      />
    );
  }

  const play = !reducedMotion;
  const shouldLoop = play && loop;
  const shouldAutoplay = play && autoplay;

  return (
    <div className={cn('relative', className)} style={style} aria-hidden>
      <Lottie
        animationData={animationData}
        loop={shouldLoop}
        autoplay={shouldAutoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;
