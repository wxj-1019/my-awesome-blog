'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import TextType from './TextType';
import GlassCard from '../ui/GlassCard';
import { useTheme } from '../../context/theme-context';
import WaveStack from '../ui/WaveStack';
import ScrollIndicator from './ScrollIndicator';
import logger from '@/utils/logger';

export default function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
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
    if (!heroRef.current) {return;}

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);
    observerRef.current.observe(heroRef.current);

    return () => {
      if (observerRef.current && heroRef.current) {
        observerRef.current.unobserve(heroRef.current);
      }
    };
  }, [handleIntersection]);
  useEffect(() => {
    if (mounted && !videoLoaded && !videoError && videoRef.current && shouldLoadVideo) {
      logger.log('触发视频加载:', backgroundVideo);
      setVideoLoaded(false);
      setVideoError(false);
    }
  }, [mounted, backgroundVideo, retryCount, shouldLoadVideo]);

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
    <section
      ref={heroRef}
      className="relative h-screen flex flex-col items-center justify-start overflow-hidden"
      aria-label="首屏欢迎区域"
    >
      {/* 跳过链接 - 无障碍导航 */}
      <a href="#content" className="skip-link">
        跳转到主要内容
      </a>
      <div className="absolute inset-0 z-0">
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

        <div
          className="absolute inset-0 bg-[color:var(--background)]/[.2]"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-20 flex flex-col w-full flex-1">
        <div className="container mx-auto px-4 text-center flex-1 flex flex-col justify-center">
          <GlassCard
            padding="md"
            hoverEffect={false}
            glowEffect={true}
            className="max-w-3xl mx-auto text-center animate-fade-in-up"
            role="banner"
          >
            {/* 副标题 */}
            <p className="text-sm md:text-base text-tech-cyan font-medium mb-3 tracking-wide uppercase">
              技术 · 设计 · 生活
            </p>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight"
              id="hero-title"
            >
              <TextType
                fetchFromApi={true}
                typingSpeed={120}
                pauseDuration={2000}
                showCursor
                cursorCharacter="_"
                loop={true}
                aria-live="polite"
                aria-atomic="true"
              />
              {/* 屏幕阅读器备用文本 */}
              <span className="sr-only">
                欢迎来到我的博客，这里分享技术、设计与生活
              </span>
            </h1>

            {/* 描述文本 */}
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
              探索前沿技术，分享设计灵感，记录生活点滴。
              <br className="hidden sm:block" />
              与你一起构建更美好的数字世界。
            </p>

            {/* CTA按钮 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#featured-highlights"
                className="inline-flex items-center gap-2 px-6 py-3 bg-tech-cyan text-white rounded-full font-medium
                  hover:bg-tech-lightcyan transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-tech-cyan/25"
              >
                开始探索
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-full font-medium
                  hover:bg-glass hover:border-tech-cyan/50 transition-all duration-300"
              >
                浏览文章
              </Link>
            </div>

            <p className="text-sm text-muted-foreground sr-only">
              按Tab键继续浏览网站内容
            </p>
          </GlassCard>
        </div>

        <div
          className="relative w-full"
          aria-hidden="true"
        >
          <WaveStack className="wave-stack" waveCount={3} />
        </div>
      </div>

      {/* 向下滚动指示器 */}
      <ScrollIndicator />
    </section>
  );
}
