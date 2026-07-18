'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { Banner } from '@/types/music';

interface HeroBannerProps {
  banners: Banner[];
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showIndicators?: boolean;
}

export default function HeroBanner({
  banners,
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showIndicators = true
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoPlay || isPaused) {return;}

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, banners.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) {return;}
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 group parallax-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        handleMouseLeave();
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Background with blur effect and parallax */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center blur-3xl scale-110"
        style={{
          backgroundImage: `url(${currentBanner.image})`,
          x: mousePosition.x * -20,
          y: mousePosition.y * -20,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-pink-900/70"
      />

      <div className="relative z-10 flex h-full items-center px-8 lg:px-12">
        <motion.div 
          className="flex-1 max-w-lg"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          key={`text-${currentIndex}`}
        >
          <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-white leading-tight">
            {currentBanner.title}
          </h1>
          <p className="text-base lg:text-lg text-white/80 mb-2">
            {currentBanner.subtitle}
          </p>
          {currentBanner.description && (
            <p className="text-sm text-white/60 mb-6 line-clamp-2">
              {currentBanner.description}
            </p>
          )}
          <motion.button
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
              'bg-gradient-to-r from-indigo-500 to-pink-500',
              'text-white font-semibold text-sm',
              'shadow-lg shadow-indigo-500/30',
              'cursor-pointer'
            )}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-4 h-4 fill-white" />
            立即播放
          </motion.button>
        </motion.div>

        {currentBanner.coverImage && (
          <motion.div 
            className="hidden lg:block w-48 h-48 xl:w-56 xl:h-56 perspective-1000"
            style={{
              x: mousePosition.x * 30,
              y: mousePosition.y * 30,
            }}
            transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          >
            <motion.div
              className={cn(
                'relative w-full h-full rounded-2xl overflow-hidden',
                'shadow-2xl shadow-black/30',
                'preserve-3d'
              )}
              animate={{
                rotateY: -8 + mousePosition.x * 10,
                rotateX: 5 - mousePosition.y * 10,
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 30 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.img
                src={currentBanner.coverImage}
                alt="专辑封面"
                className="w-full h-full object-cover"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={goToPrevious}
            className={cn(
              'absolute top-1/2 left-4 -translate-y-1/2',
              'w-11 h-11 rounded-full',
              'bg-white/10 backdrop-blur-xl',
              'flex items-center justify-center',
              'text-white/80 hover:text-white hover:bg-white/20',
              'transition-all duration-300 ease-out',
              'opacity-0 group-hover:opacity-100',
              'hover:scale-110 active:scale-95'
            )}
            aria-label="上一页"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'absolute top-1/2 right-4 -translate-y-1/2',
              'w-11 h-11 rounded-full',
              'bg-white/10 backdrop-blur-xl',
              'flex items-center justify-center',
              'text-white/80 hover:text-white hover:bg-white/20',
              'transition-all duration-300 ease-out',
              'opacity-0 group-hover:opacity-100',
              'hover:scale-110 active:scale-95'
            )}
            aria-label="下一页"
          >
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              onClick={() => goToSlide(index)}
              className={cn(
                'rounded-full transition-all duration-300 ease-out',
                currentIndex === index
                  ? 'w-6 h-2 bg-gradient-to-r from-indigo-400 to-pink-400'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60 hover:scale-110'
              )}
              aria-label={`切换到第${index + 1}张`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
