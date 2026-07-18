'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  date?: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  className?: string;
  columns?: number;
  gap?: number;
  showLightbox?: boolean;
  enableFilter?: boolean;
  enableSearch?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className,
  columns = 3,
  gap = 4,
  showLightbox = true,
  enableFilter = false,
  enableSearch = false,
}) => {
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>(images);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 过滤图像
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredImages(images);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = images.filter(
        img =>
          img.title.toLowerCase().includes(term) ||
          img.description?.toLowerCase().includes(term) ||
          img.alt.toLowerCase().includes(term)
      );
      setFilteredImages(filtered);
    }
  }, [searchTerm, images]);

  const handleImageClick = (image: ImageItem) => {
    if (showLightbox) {
      setSelectedImage(image);
    }
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const containerClasses = cn(
    'grid',
    `grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns}`,
    `gap-${gap}`,
    className
  );

  return (
    <div className="w-full">
      {/* 搜索和过滤区域 */}
      {(enableSearch || enableFilter) && (
        <div className="mb-8 p-4 rounded-xl bg-glass/30 backdrop-blur-xl border border-glass-border">
          <div className="flex flex-col md:flex-row gap-4">
            {enableSearch && (
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索相册..."
                  className="w-full px-4 py-2 bg-black/20 rounded-lg border border-glass-border focus:outline-none focus:ring-2 focus:ring-tech-cyan"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {enableFilter && (
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-tech-cyan/20 hover:bg-tech-cyan/30 rounded-lg border border-glass-border transition-all duration-300">
                  全部
                </button>
                <button className="px-4 py-2 bg-tech-cyan/20 hover:bg-tech-cyan/30 rounded-lg border border-glass-border transition-all duration-300">
                  精选
                </button>
                <button className="px-4 py-2 bg-tech-cyan/20 hover:bg-tech-cyan/30 rounded-lg border border-glass-border transition-all duration-300">
                  最新
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图像网格 */}
      <div className={containerClasses}>
        {filteredImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="cursor-pointer"
            onClick={() => handleImageClick(image)}
          >
            <GlassCard className="overflow-hidden group">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <h3 className="text-white font-semibold">{image.title}</h3>
                    {image.date && <p className="text-white/80 text-sm">{image.date}</p>}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Lightbox 模态框 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              onClick={closeLightbox}
            >
              ✕
            </button>
            <div className="relative w-full h-[80vh] rounded-xl overflow-hidden">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-white/80 mt-2">{selectedImage.description}</p>
                )}
                {selectedImage.date && (
                  <p className="text-white/60 text-sm mt-1">{selectedImage.date}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;