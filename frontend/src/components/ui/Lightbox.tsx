'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Share2, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export interface LightboxImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  date?: string;
  width?: number;
  height?: number;
}

interface LightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  enableZoom?: boolean;
  enableRotate?: boolean;
  enableDownload?: boolean;
  enableShare?: boolean;
  enableFullscreen?: boolean;
  keyboardNavigation?: boolean;
}

const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  enableZoom = true,
  enableRotate = true,
  enableDownload = true,
  enableShare = true,
  enableFullscreen = true,
  keyboardNavigation = true,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();

  const currentImage = images[currentImageIndex];

  useEffect(() => {
    setCurrentImageIndex(currentIndex);
  }, [currentIndex]);

  const resetTransforms = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (isTransitioning) {return;}
    setIsTransitioning(true);
    setCurrentImageIndex(prev => (prev + 1) % images.length);
    resetTransforms();
    setTimeout(() => setIsTransitioning(false), 300);
    onNext?.();
  }, [images.length, isTransitioning, resetTransforms, onNext]);

  const handlePrevious = useCallback(() => {
    if (isTransitioning) {return;}
    setIsTransitioning(true);
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    resetTransforms();
    setTimeout(() => setIsTransitioning(false), 300);
    onPrevious?.();
  }, [images.length, isTransitioning, resetTransforms, onPrevious]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  useEffect(() => {
    if (keyboardNavigation) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) {return;}

        switch (e.key) {
          case 'Escape':
            onClose();
            break;
          case 'ArrowRight':
            handleNext();
            break;
          case 'ArrowLeft':
            handlePrevious();
            break;
          case '+':
          case '=':
            handleZoomIn();
            break;
          case '-':
            handleZoomOut();
            break;
          case 'r':
          case 'R':
            handleRotate();
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, keyboardNavigation, onClose, handleNext, handlePrevious, handleZoomIn, handleZoomOut, handleRotate]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentImage.title || currentImage.alt}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
    }
  }, [currentImage]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImage.title || currentImage.alt,
          url: currentImage.src,
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      navigator.clipboard.writeText(currentImage.src);
      toast({ description: '图片链接已复制到剪贴板' });
    }
  }, [currentImage, toast]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  }, [handleZoomIn, handleZoomOut]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setPosition({ x: e.clientX, y: e.clientY });
    }
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const dx = (e.clientX - position.x) / zoom;
      const dy = (e.clientY - position.y) / zoom;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  }, [isDragging, zoom, position]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetControlsTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    if (showControls) {
      resetControlsTimeout();
    }

    return () => clearTimeout(timeoutId);
  }, [showControls]);

  useEffect(() => {
    if (isFullscreen && document.fullscreenEnabled) {
      const element = document.getElementById('lightbox-container');
      if (element) {
        if (isFullscreen) {
          element.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
    }
  }, [isFullscreen]);

  if (!isOpen || !currentImage) {return null;}

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="lightbox-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose}
          onMouseEnter={() => setShowControls(true)}
          onMouseMove={() => setShowControls(true)}
        >
          <motion.div
            className="relative w-full h-full flex flex-col"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-8">
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img
                  src={currentImage.src}
                  alt={currentImage.alt}
                  className={cn(
                    'max-w-full max-h-full object-contain transition-transform duration-200',
                    isDragging && 'cursor-grabbing',
                    zoom > 1 && 'cursor-grab'
                  )}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  }}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  draggable={false}
                />

                <AnimatePresence>
                  {showControls && (
                    <>
                      {images.length > 1 && (
                        <>
                          <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 z-10"
                            onClick={handlePrevious}
                            disabled={isTransitioning}
                            aria-label="上一张图片"
                          >
                            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
                          </motion.button>
                          <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 z-10"
                            onClick={handleNext}
                            disabled={isTransitioning}
                            aria-label="下一张图片"
                          >
                            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
                          </motion.button>
                        </>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showControls && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-4 right-4 flex justify-between items-start z-20"
                  >
                    <div className="flex gap-2">
                      {enableZoom && (
                        <>
                          <button
                            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            aria-label="缩小"
                          >
                            <ZoomOut className="w-5 h-5" aria-hidden="true" />
                          </button>
                          <button
                            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                            onClick={handleZoomIn}
                            disabled={zoom >= 5}
                            aria-label="放大"
                          >
                            <ZoomIn className="w-5 h-5" aria-hidden="true" />
                          </button>
                          <button
                            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                            onClick={resetTransforms}
                            aria-label="重置视图"
                          >
                            <Maximize2 className="w-5 h-5" aria-hidden="true" />
                          </button>
                        </>
                      )}
                      {enableRotate && (
                        <button
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                          onClick={handleRotate}
                          aria-label="旋转图片"
                        >
                          <RotateCw className="w-5 h-5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {enableFullscreen && (
                        <button
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                          onClick={handleFullscreen}
                          aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
                        </button>
                      )}
                      {enableDownload && (
                        <button
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                          onClick={handleDownload}
                          aria-label="下载图片"
                        >
                          <Download className="w-5 h-5" aria-hidden="true" />
                        </button>
                      )}
                      {enableShare && (
                        <button
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                          onClick={handleShare}
                          aria-label="分享图片"
                        >
                          <Share2 className="w-5 h-5" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-all duration-200"
                        onClick={onClose}
                        aria-label="关闭预览"
                      >
                        <X className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6 z-20"
                  >
                    <div className="max-w-4xl mx-auto">
                      {currentImage.title && (
                        <h3 className="text-white text-xl md:text-2xl font-bold mb-2">
                          {currentImage.title}
                        </h3>
                      )}
                      {currentImage.description && (
                        <p className="text-white/80 text-sm md:text-base mb-2">
                          {currentImage.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-white/60 text-sm">
                        {currentImage.date && <span>{currentImage.date}</span>}
                        <div className="flex items-center gap-2">
                          <span>{zoom.toFixed(1)}x</span>
                          {images.length > 1 && (
                            <span>
                              {currentImageIndex + 1} / {images.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    index === currentImageIndex
                      ? 'bg-tech-cyan w-6'
                      : 'bg-white/30 hover:bg-white/50'
                  )}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    resetTransforms();
                  }}
                  aria-label={`查看第 ${index + 1} 张图片${image.title ? `：${image.title}` : ''}`}
                  aria-current={index === currentImageIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
