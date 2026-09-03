'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from '@/lib/framer-motion';
import TextType from './TextType';
import { useTheme } from '../../context/theme-context';
import WaveStack from '../ui/WaveStack';
import BubbleField from './BubbleField';
import ScrollIndicator from './ScrollIndicator';
import logger from '@/utils/logger';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { HOME_BUBBLE_COUNT, HOME_TRANSITION } from '@/components/home/narrative/homeMotion';

/** Phase 2 L3：默认开启；设 NEXT_PUBLIC_MOTION_L3=0 可回退静态 Hero */
const MOTION_L3_ENABLED = process.env.NEXT_PUBLIC_MOTION_L3 !== '0';

export default function HeroSection() {
  const { resolvedTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  // 暗色=月夜云海（青绿满月原野）；亮色=奇幻鹿境（紫穹暖环日）。须 H.264
  // 全站 AmbientBackground 色板按这两支视频实帧采样，保持同一故事线
  const isDark = resolvedTheme === 'dark';
  const backgroundVideo = isDark
    ? '/video/moonlit-clouds-field-HD-live.mp4'
    : '/video/fantasy-landscape-deer-HD-live.mp4';
  // poster 图由 ffmpeg 提取首帧（176KB/228KB），比视频小 ~40 倍，首屏立即可见
  const posterImage = isDark
    ? '/video/moonlit-poster.jpg'
    : '/video/fantasy-poster.jpg';
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // 视频仅桌面 + L3 开启 + 非 reduced motion 时加载；其余场景只显示首帧静态 poster
  // （移动端首屏拉 2.7-5.3MB 视频是明确的 LCP/流量负担，poster 仅 ~200KB 且与视频首帧同图）
  const shouldLoadVideo = isDesktop && MOTION_L3_ENABLED && !reducedMotion;
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
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

  // 主题或重试切换时重置可见态；换源后由 onLoadedData / onCanPlay 再亮起
  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
  }, [backgroundVideo, retryCount]);

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

  /** 有首帧即可显示：勿只等 canplaythrough（大文件 + 非 faststart 时常不触发） */
  const handleVideoReady = useCallback(() => {
    logger.log('视频可显示:', backgroundVideo);
    setVideoLoaded(true);
    setVideoError(false);
  }, [backgroundVideo]);

  // 自动播放：部分浏览器对 muted+playsInline 仍需显式 play()
  useEffect(() => {
    if (!shouldLoadVideo || videoError) {
      return;
    }
    const el = videoRef.current;
    if (!el) {
      return;
    }
    const tryPlay = () => {
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: unknown) => {
          logger.log('视频 autoplay 被拦截，等待用户交互或就绪事件:', err);
        });
      }
    };
    tryPlay();
    el.addEventListener('loadeddata', tryPlay);
    return () => el.removeEventListener('loadeddata', tryPlay);
  }, [backgroundVideo, retryCount, shouldLoadVideo, videoError]);

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
        {/* 视频加载中：poster 立即可见 + 中央加载圆环；就绪后由渐变层淡出露出视频 */}
        {shouldLoadVideo && !videoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-glass-border" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent motion-reduce:animate-none" />
            </div>
          </div>
        )}

        {/* 降级层：移动端 / reduced motion / L3 关闭时显示视频首帧静态图，
            与 video 的 poster 同图，桌面端 hydrate 后切换无视觉跳变 */}
        {!shouldLoadVideo && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${posterImage})` }}
            aria-hidden="true"
          />
        )}

        {shouldLoadVideo && !videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={posterImage}
            className="absolute inset-0 w-full h-full object-cover"
            src={backgroundVideo}
            onLoadedData={handleVideoReady}
            onLoadedMetadata={handleVideoReady}
            onCanPlay={handleVideoReady}
            onCanPlayThrough={handleVideoReady}
            onPlaying={handleVideoReady}
            onPlay={() => {
              logger.log('视频开始播放:', backgroundVideo);
              handleVideoReady();
            }}
            onError={handleVideoError}
            onLoadStart={() => {
              logger.log('开始加载视频:', backgroundVideo);
            }}
            onWaiting={() => {
              logger.log('视频缓冲中...');
            }}
            // 不设 key：主题换源时仅变更 src，浏览器按规范触发 media load 算法重载，
            // 避免 React 重挂载节点丢失缓冲；重试场景由上方 videoError 条件渲染卸载/重挂
            aria-hidden="true"
          />
        )}

        {/* 后备渐变：贴合视频实帧色，避免加载时跳成科技蓝 */}
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{
            backgroundImage:
              isDark
                ? 'linear-gradient(180deg, #0c1a1c 0%, #1a3034 40%, #2a4e4f 70%, #162d2b 100%)'
                : 'linear-gradient(180deg, #4a2870 0%, #4b2fa4 45%, #3a2480 100%)',
          }}
          aria-hidden="true"
        />

        {/* 可读性遮罩：色调贴视频，中间更透 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              isDark
                ? 'linear-gradient(to bottom, rgba(8,24,26,0.35) 0%, rgba(8,24,26,0.08) 40%, rgba(8,24,26,0.4) 100%)'
                : 'linear-gradient(to bottom, rgba(40,10,90,0.35) 0%, rgba(40,10,90,0.1) 42%, rgba(34,0,88,0.42) 100%)',
          }}
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
                isDark
                  ? 'bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6)_0%,rgba(15,23,42,0.15)_55%,transparent_75%)]'
                  : 'bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.5)_0%,rgba(15,23,42,0.15)_55%,transparent_75%)]'
              )}
              aria-hidden
            />

            <p
              className={cn(
                'mb-3 text-[10px] sm:text-xs font-medium tracking-[0.4em]',
                isDark
                  ? 'text-teal-100/80'
                  : 'text-white/85 drop-shadow-sm'
              )}
            >
              {resolvedTheme === 'dark' ? '月夜云海' : '奇幻鹿境'}
            </p>

            <h1
              id="hero-title"
              className={cn(
                // 打字机标题：马善政楷书（毛笔书法氛围；仅 400 字重，不用 font-semibold 避免浏览器伪粗体）
                'font-brush text-3xl sm:text-4xl md:text-5xl',
                'tracking-wide leading-snug',
                isDark
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
                  isDark
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
        入水装置 · 波浪溢出层：
        放在 hero section 外（避免 overflow:hidden 截断），
        向下衔接 DiveTransition / 第一幕展厅。
      */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[150px] overflow-visible"
        aria-hidden="true"
        initial={reducedMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={HOME_TRANSITION.waveEnter}
      >
        <WaveStack className="wave-stack" waveCount={3} />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px] bg-gradient-to-t from-transparent via-white/5 to-transparent blur-md"
          aria-hidden
        />
      </motion.div>

      {/* 气泡：仅 Hero 浪线附近稀疏点缀，内容区不挂 */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[280px]"
        aria-hidden
      >
        <BubbleField
          count={isDesktop ? HOME_BUBBLE_COUNT.desktop : HOME_BUBBLE_COUNT.mobile}
          withHighlight={false}
        />
      </div>
    </div>
  );
}
