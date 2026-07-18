'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';

interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  showThumbnails?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  autoPlay = true,
  interval = 5000,
  className,
  showThumbnails = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showFullView, setShowFullView] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // 自动播放逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isPlaying && images.length > 1) {
      timer = setInterval(() => {
        goToNext();
      }, interval);
    }

    return () => {
      if (timer) {clearInterval(timer);}
    };
  }, [isPlaying, currentIndex, images.length, interval, goToNext]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  const openFullView = () => {
    setShowFullView(true);
  };

  const closeFullView = () => {
    setShowFullView(false);
  };

  if (images.length === 0) {return null;}

  return (
    <div className={cn("w-full", className)}>
      {/* 主轮播图区域 */}
      <GlassCard className="relative overflow-hidden group">
        <div className="relative aspect-video w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
          
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
            <div>
              <h3 className="text-white text-xl font-bold">{images[currentIndex].title}</h3>
              {images[currentIndex].description && (
                <p className="text-white/90 mt-1">{images[currentIndex].description}</p>
              )}
            </div>
          </div>
          
          {/* 控制按钮 */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
            aria-label="上一页"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
            aria-label="下一页"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* 全屏查看按钮 */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={openFullView}
            aria-label="全屏查看"
          >
            <span className="text-xs" aria-hidden="true">⛶</span>
          </button>

          {/* 播放/暂停按钮 */}
          {autoPlay && (
            <button
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={toggleAutoPlay}
              aria-label={isPlaying ? '暂停播放' : '开始播放'}
            >
              <span aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
            </button>
          )}
        </div>
        
        {/* 底部指示器 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? 'bg-tech-cyan' : 'bg-white/50'
              }`}
              onClick={() => handleDotClick(index)}
              aria-label={`切换到第 ${index + 1} 张`}
            />
          ))}
        </div>
      </GlassCard>

      {/* 缩略图行 */}
      {showThumbnails && (
        <div className="mt-4 flex overflow-x-auto py-2 space-x-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-tech-cyan scale-105' : 'border-transparent'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Show slide ${index + 1}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={80}
                height={64}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 全屏查看模态框 */}
      {showFullView && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeFullView}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              onClick={closeFullView}
              aria-label="关闭"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              onClick={goToPrevious}
              aria-label="上一页"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              onClick={goToNext}
              aria-label="下一页"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
            
            <div className="relative w-full h-[80vh] rounded-xl overflow-hidden">
              <Image
                src={images[currentIndex].src}
                alt={images[currentIndex].alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">{images[currentIndex].title}</h3>
                {images[currentIndex].description && (
                  <p className="text-white/80 mt-2">{images[currentIndex].description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;