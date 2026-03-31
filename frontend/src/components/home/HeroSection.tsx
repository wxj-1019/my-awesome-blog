'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TextType from './TextType';
import GlassCard from '../ui/GlassCard';
import { useTheme } from '../../context/theme-context';
import WaveStack from '../ui/WaveStack';
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
    if (!heroRef.current) return;

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
      aria-label="英雄区域"
    >
      <div className="absolute inset-0 z-0">
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
            padding="sm"
            hoverEffect={false}
            glowEffect={true}
            className="max-w-2xl mx-auto text-center animate-fade-in-up"
            aria-label="欢迎信息"
          >
            <h1
              className="text-2xl md:text-3xl font-bold mb-4"
              id="hero-title"
            >
              <TextType
                fetchFromApi={true}
                typingSpeed={150}
                pauseDuration={1500}
                showCursor
                cursorCharacter="_"
                loop={true}
              />
            </h1>
          </GlassCard>
        </div>

        <div
          className="relative w-full"
          aria-hidden="true"
        >
          <WaveStack className="wave-stack" waveCount={3} />
        </div>
      </div>
    </section>
  );
}
