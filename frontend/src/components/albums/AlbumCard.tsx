'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from '@/lib/framer-motion';
import { Camera, Image as ImageIcon, Calendar, Star, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/animation-utils';
import GlassCard from '@/components/ui/GlassCard';
import { useThemedClasses } from '@/hooks/useThemedClasses';

import { Album } from '@/types';

interface AlbumCardProps {
  album: Album;
  onClick?: (album: Album) => void;
  className?: string;
  showOverlay?: boolean;
  enableHoverEffect?: boolean;
  enableMagneticEffect?: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onClick,
  className,
  showOverlay = true,
  enableHoverEffect = true,
  enableMagneticEffect = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { themedClasses } = useThemedClasses();

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMagneticEffect) {return;}
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    if (!enableMagneticEffect) {return;}
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleMouseEnter = () => {
    if (!enableHoverEffect) {return;}
    setIsHovered(true);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      style={{
        rotateX: enableMagneticEffect ? rotateX : 0,
        rotateY: enableMagneticEffect ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick?.(album)}
    >
      <GlassCard
        className={cn(
          'h-full overflow-hidden cursor-pointer group',
          // 只过渡阴影，hover 用玻璃柔和影替代重阴影
          enableHoverEffect && 'transition-shadow duration-300 hover:shadow-[var(--glass-shadow)]'
        )}
      >
        <div className="relative aspect-video overflow-hidden">
          <motion.img
            src={album.coverImage}
            alt={album.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: EASE.SMOOTH }}
          />

          {album.featured && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-3 right-3 bg-tech-cyan text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg"
            >
              <Star className="w-3 h-3 inline mr-1 fill-current" />
              精选
            </motion.div>
          )}

          {album.category && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute top-3 left-3 bg-glass backdrop-blur-sm border border-glass-border text-foreground text-xs font-semibold px-2 py-1 rounded-full"
            >
              {album.category}
            </motion.div>
          )}

          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent flex items-end p-4 text-background"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-background/20 backdrop-blur-sm rounded-full hover:bg-background/30 transition-colors"
                      onClick={handleLike}
                      aria-label={isPlaying ? '取消收藏' : '收藏'}
                    >
                      <Heart
                        className={cn(
                          'w-4 h-4',
                          isPlaying && 'fill-destructive text-destructive'
                        )}
                        aria-hidden="true"
                      />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-background/20 backdrop-blur-sm rounded-full hover:bg-background/30 transition-colors"
                      aria-label="分享"
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ImageIcon className="w-4 h-4" />
                    <span>{album.images}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 1 : 0 }}
            className="absolute inset-0 border-2 border-tech-cyan/50 rounded-lg pointer-events-none"
          />
        </div>

        <div className="p-4">
          {/* 标题/描述保持静止，不做 hover 平移错位反馈 */}
          <h3 className={cn('font-bold text-lg mb-2 line-clamp-1', themedClasses.textClass)}>
            {album.title}
          </h3>
          <p className={cn('text-sm mb-3 line-clamp-2', themedClasses.mutedTextClass)}>
            {album.description}
          </p>
          <motion.div
            className={cn('flex items-center justify-between text-sm', themedClasses.mutedTextClass)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{album.date}</span>
            </div>
            <div className="flex items-center gap-3">
              {album.likes !== undefined && (
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{album.likes}</span>
                </div>
              )}
              {album.views !== undefined && (
                <div className="flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  <span>{album.views}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AlbumCard;
