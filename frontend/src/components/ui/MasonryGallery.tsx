'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
export interface MasonryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  aspectRatio?: number;
  category?: string;
  date?: string;
}
interface MasonryGalleryProps {
  images: MasonryImage[];
  columns?: number;
  gap?: number;
  onImageClick?: (image: MasonryImage, index: number) => void;
  className?: string;
  showOverlay?: boolean;
  enableLazyLoad?: boolean;
  loadingThreshold?: number;
}
const MasonryGallery: React.FC<MasonryGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  onImageClick,
  className,
  showOverlay = true,
  enableLazyLoad = true,
  loadingThreshold = 0.1,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const [imagePositions, setImagePositions] = useState<Map<string, { col: number; top: number }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const getColumnsForScreen = useCallback(() => {
    const responsiveColumns = {
      xs: 1,
      sm: 2,
      md: 3,
      lg: columns,
      xl: columns,
    };
    if (typeof window === 'undefined') {return columns;}
    const width = window.innerWidth;
    if (width < 640) {return responsiveColumns.xs;}
    if (width < 768) {return responsiveColumns.sm;}
    if (width < 1024) {return responsiveColumns.md;}
    return responsiveColumns.lg;
  }, [columns]);
  const calculateLayout = useCallback((currentColumns: number) => {
    const heights = new Array(currentColumns).fill(0);
    const positions = new Map<string, { col: number; top: number }>();
    images.forEach((image, _index) => {
      const minHeight = Math.min(...heights);
      const colIndex = heights.indexOf(minHeight);
      
      const aspectRatio = image.aspectRatio || 1;
      const imageHeight = (200 / currentColumns) * aspectRatio;
      
      positions.set(image.id, {
        col: colIndex,
        top: heights[colIndex],
      });
      
      heights[colIndex] += imageHeight + gap;
    });
    setColumnHeights(heights);
    setImagePositions(positions);
  }, [images, gap]);
  useEffect(() => {
    const currentColumns = getColumnsForScreen();
    calculateLayout(currentColumns);
    const handleResize = () => {
      const newColumns = getColumnsForScreen();
      calculateLayout(newColumns);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLayout, getColumnsForScreen]);
  useEffect(() => {
    if (!enableLazyLoad) {
      setVisibleImages(new Set(images.map(img => img.id)));
      return;
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageId = entry.target.getAttribute('data-image-id');
            if (imageId) {
              setVisibleImages(prev => new Set(prev).add(imageId));
            }
          }
        });
      },
      { threshold: loadingThreshold }
    );
    const imageElements = containerRef.current?.querySelectorAll('[data-image-id]');
    imageElements?.forEach(el => observerRef.current?.observe(el));
    return () => {
      observerRef.current?.disconnect();
    };
  }, [enableLazyLoad, loadingThreshold, images]);
  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  }, []);
  const currentColumns = getColumnsForScreen();
  const containerHeight = Math.max(...columnHeights);
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className="relative"
        style={{
          height: `${containerHeight}px`,
        }}
      >
        {images.map((image, index) => {
          const position = imagePositions.get(image.id);
          if (!position) {return null;}
          const aspectRatio = image.aspectRatio || 1;
          const columnWidth = `calc((100% - ${(currentColumns - 1) * gap * 4}px) / ${currentColumns})`;
          return (
            <motion.div
              key={image.id}
              data-image-id={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              style={{
                position: 'absolute',
                left: `calc(${position.col} * (${columnWidth} + ${gap * 4}px))`,
                top: position.top,
                width: columnWidth,
              }}
              className="cursor-pointer"
              onClick={() => onImageClick?.(image, index)}
            >
              <div className="relative overflow-hidden rounded-lg group">
                {!loadedImages.has(image.id) && (
                  <div className="absolute inset-0 bg-gray-800 animate-pulse" />
                )}
                <motion.img
                  src={image.src}
                  alt={image.alt}
                  className={cn(
                    'w-full object-cover transition-transform duration-500',
                    loadedImages.has(image.id) ? 'opacity-100' : 'opacity-0',
                    'group-hover:scale-105'
                  )}
                  style={{
                    aspectRatio: aspectRatio,
                  }}
                  loading={enableLazyLoad && !visibleImages.has(image.id) ? 'lazy' : 'eager'}
                  onLoad={() => handleImageLoad(image.id)}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                />
                {showOverlay && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {image.category && (
                        <span className="inline-block px-2 py-1 mb-2 text-xs font-semibold text-white bg-tech-cyan rounded-full">
                          {image.category}
                        </span>
                      )}
                      {image.title && (
                        <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2">
                          {image.title}
                        </h3>
                      )}
                      {image.description && (
                        <p className="text-white/80 text-xs mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                      {image.date && (
                        <p className="text-white/60 text-xs mt-2">
                          {image.date}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default MasonryGallery;