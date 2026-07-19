'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from '@/lib/framer-motion';
import TextType from './TextType';
import { useTheme } from '../../context/theme-context';
import WaveStack from '../ui/WaveStack';
import ScrollIndicator from './ScrollIndicator';
import logger from '@/utils/logger';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

/** Phase 2 L3：默认开启；设 NEXT_PUBLIC_MOTION_L3=0 可回退静态 Hero */
const MOTION_L3_ENABLED = process.env.NEXT_PUBLIC_MOTION_L3 !== '0';

export default function HeroSection() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const backgroundVideo = mounted && resolvedTheme === 'dark'
    ? '/video/moonlit-clouds-field-HD-live.mp4'
    : '/video/fantasy-landscape-deer-HD-live.mp4';
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // 进度源：useScrollProgress（与 Bridge 的 ScrollTrigger 分离，且视频/文案分节点）
  const scrollProgress = useScrollProgress(heroRef);
  const l3Active = MOTION_L3_ENABLED && !reducedMotion;
  // 阶段 B：视频缩放与文案漂移减弱
  const videoScale =
    l3Active && isDesktop ? 1 + Math.min(scrollProgress, 1) * 0.06 : 1;
  const copyOpacity = l3Active
    ? Math.max(0.15, 1 - scrollProgress * (isDesktop ? 0.75 : 0.4))
    : 1;
  const copyY = l3Active
    ? Math.min(scrollProgress, 1) * (isDesktop ? 18 : 8)
    : 0;

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !shouldLoadVideo) {
      logger.log('Hero section 进入视口，开始加载视频');
      setShouldLoadVideo(true);

      if (observerRef.current && heroRef.current) {
        observerRef.current.unobserve(heroRef.current);
      }
    }
  }, [shouldLoadVideo]);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) {return;}

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);
    observerRef.current.observe(el);

    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(el);
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection]);
  useEffect(() => {
    if (mounted && !videoLoaded && !videoError && videoRef.current && shouldLoadVideo) {
      logger.log('触发视频加载:', backgroundVideo);
      setVideoLoaded(false);
      setVideoError(false);
    }
  }, [mounted, backgroundVideo, retryCount, shouldLoadVideo, videoLoaded, videoError]);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    logger.error('视频加载失败:', backgroundVideo, e);
    setVideoError(true);

    if (retryCount < 2) {
      logger.log(`重试视频加载 (${retryCount + 1}/2)...`);
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      timeoutRef.current = setTimeout(() => {
        setVideoError(false);
        setVideoLoaded(false);
      }, 3000);
    }
  }, [backgroundVideo, retryCount]);

  const handleVideoSuccess = useCallback(() => {
    logger.log('视频已成功加载:', backgroundVideo);
    setVideoLoaded(true);
    setVideoError(false);
  }, [backgroundVideo]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-start overflow-hidden"
        aria-label="首屏欢迎区域"
      >
        {/* 跳过链接 - 无障碍导航 */}
        <a href="#content" className="skip-link">
          跳转到主要内容
        </a>
      {/* L3 视频层：仅 CSS transform scale（不与文案层共用同一节点） */}
      <div
        className="absolute inset-0 z-0 will-change-transform"
        data-hero-video-layer
        style={{
          transform: `scale(${videoScale})`,
          transformOrigin: 'center center',
        }}
        aria-hidden="true"
      >
        {/* 视频骨架屏 - 加载状态 */}
        {shouldLoadVideo && !videoLoaded && !videoError && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 骨架屏动画效果 */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>
          </motion.div>
        )}

        {mounted && shouldLoadVideo && !videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            src={backgroundVideo}
            onCanPlayThrough={handleVideoSuccess}
            onPlay={() => {
              logger.log('视频开始播放:', backgroundVideo);
            }}
            onError={handleVideoError}
            onLoadStart={() => {
              logger.log('开始加载视频:', backgroundVideo);
            }}
            onWaiting={() => {
              logger.log('视频缓冲中...');
            }}
            key={`${backgroundVideo}-${retryCount}`}
            aria-hidden="true"
          />
        )}

        {/* 后备渐变背景 */}
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{
            backgroundImage: mounted && resolvedTheme === 'dark'
              ? 'linear-gradient(135deg, var(--tech-darkblue), var(--tech-deepblue), var(--tech-cyan))'
              : 'linear-gradient(135deg, #e0f2fe, #bae6fd, #93c5fd)',
            backgroundSize: '400% 400%',
            animation: 'gradient-move 8s ease infinite'
          }}
          aria-hidden="true"
        />

        {/* 视频可读性遮罩：底部略重，中间留给文案，避免整块实心玻璃盖住画面 */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            resolvedTheme === 'dark'
              ? 'bg-gradient-to-b from-black/40 via-black/20 to-black/50'
              : 'bg-gradient-to-b from-slate-950/45 via-slate-950/30 to-slate-950/50'
          )}
          aria-hidden="true"
        />
      </div>

      {/* L1 文案层：仅 opacity/translateY，不与视频层同节点 */}
      <div
        className="relative z-20 flex flex-col w-full flex-1 will-change-transform"
        data-hero-copy-layer
        style={{
          opacity: copyOpacity,
          transform: `translate3d(0, ${copyY}px, 0)`,
        }}
      >
        <div className="container mx-auto px-4 text-center flex-1 flex flex-col justify-center">
          {/*
            电影感打字机：融入月夜云海 / 奇幻鹿景视频
            - 不用厚实 GlassCard，改用轻 vignette + 文字光晕
            - 光标用月光/晨雾色，节奏略慢
          */}
          <div
            role="banner"
            aria-label="欢迎信息"
            className={cn(
              'relative mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8',
              'animate-fade-in-up'
            )}
          >
            {/* 柔光托底：只让字区可读，不遮整幅视频 */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 -z-10 rounded-[2rem] blur-2xl',
                resolvedTheme === 'dark'
                  ? 'bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6)_0%,rgba(15,23,42,0.15)_55%,transparent_75%)]'
                  : 'bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.5)_0%,rgba(15,23,42,0.15)_55%,transparent_75%)]'
              )}
              aria-hidden
            />

            <p
              className={cn(
                'mb-3 text-[10px] sm:text-xs font-medium tracking-[0.4em]',
                resolvedTheme === 'dark'
                  ? 'text-teal-100/80'
                  : 'text-white/85 drop-shadow-sm'
              )}
            >
              {resolvedTheme === 'dark' ? '月夜云海' : '林间晨光'}
            </p>

            <h1
              id="hero-title"
              className={cn(
                'font-display text-3xl sm:text-4xl md:text-5xl',
                'font-semibold tracking-wide leading-snug',
                resolvedTheme === 'dark'
                  ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5),0_0_28px_rgba(94,234,212,0.3),0_0_48px_rgba(56,189,248,0.14)]'
                  : 'text-white [text-shadow:0_2px_10px_rgba(15,23,42,0.55),0_0_24px_rgba(255,255,255,0.28)]'
              )}
            >
              <TextType
                fetchFromApi
                typingSpeed={88}
                deletingSpeed={36}
                pauseDuration={2200}
                initialDelay={400}
                showCursor
                cursorCharacter="|"
                cursorClassName={cn(
                  'ml-1.5 align-baseline text-[0.9em] font-light',
                  resolvedTheme === 'dark'
                    ? 'text-teal-200/95 drop-shadow-[0_0_10px_rgba(94,234,212,0.85)]'
                    : 'text-amber-50/95 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                )}
                cursorBlinkDuration={0.7}
                loop
                variableSpeed={{ min: 60, max: 110 }}
                className="inline"
                aria-live="polite"
                aria-atomic="true"
              />
              <span className="sr-only">
                欢迎来到我的博客，这里分享技术、设计与生活
              </span>
            </h1>

            {/* 细装饰线：像地平线 / 薄雾分界 */}
            <div
              className={cn(
                'mx-auto mt-5 h-px w-16 sm:w-24',
                'bg-gradient-to-r from-transparent via-white/50 to-transparent'
              )}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* 向下滚动指示器 */}
        <ScrollIndicator />
      </section>

      {/*
        波浪溢出层：放在 hero section 之外，外层 overflow-visible，
        向上盖住 hero 底部、向下伸入 HomeVisualBridge 顶部留白区，
        避免 hero 的 overflow:hidden 把浪花截断。
        pointer-events-none 不影响下方交互。
      */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[150px] overflow-visible"
        aria-hidden="true"
      >
        <WaveStack className="wave-stack" waveCount={3} />
      </div>
    </div>
  );
}
