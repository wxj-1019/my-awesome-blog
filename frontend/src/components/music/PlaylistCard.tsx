'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Play, Headphones } from 'lucide-react';
import type { Playlist } from '@/types/music';

interface PlaylistCardProps {
  playlist: Playlist;
  size?: 'small' | 'medium' | 'large';
  showPlayCount?: boolean;
  onPlay?: () => void;
  index?: number;
}

export default function PlaylistCard({
  playlist,
  size = 'medium',
  showPlayCount = true,
  onPlay,
  index = 0
}: PlaylistCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const sizeClasses = {
    small: 'w-40',
    medium: 'w-48',
    large: 'w-56',
  };

  const coverSize = {
    small: 'w-40 h-40',
    medium: 'w-48 h-48',
    large: 'w-56 h-56',
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {return (num / 10000).toFixed(1) + 'w';}
    if (num >= 1000) {return (num / 1000).toFixed(1) + 'k';}
    return num.toString();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) {return;}
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setTransform({ rotateX, rotateY });
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setGlarePosition({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <motion.div
      className={cn('group relative cursor-pointer perspective-1000', sizeClasses[size])}
      onClick={onPlay}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {/* Glass Card Container with 3D effect */}
      <motion.div
        ref={cardRef}
        className={cn(
          'relative rounded-2xl overflow-hidden preserve-3d',
          'bg-gradient-to-br from-white/[0.1] to-white/[0.02]',
          'backdrop-blur-xl border border-white/[0.08]',
          'shadow-xl shadow-indigo-500/10',
          coverSize[size]
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: transform.rotateX,
          rotateY: transform.rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ 
          boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.25)',
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Glare effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          }}
          animate={{ opacity: glarePosition.opacity }}
          transition={{ duration: 0.3 }}
        />

        <motion.img
          src={playlist.coverImg}
          alt={playlist.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Gradient Overlay - Always visible at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play Button - Glassmorphism */}
        <motion.button
          className={cn(
            'absolute bottom-4 right-4 w-14 h-14 rounded-full',
            'bg-gradient-to-r from-indigo-500 to-pink-500',
            'flex items-center justify-center',
            'shadow-lg shadow-indigo-500/40'
          )}
          aria-label="播放"
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={{ 
            scale: 1.15, 
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)'
          }}
          whileTap={{ scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Play className="w-6 h-6 text-white ml-1 fill-white" />
        </motion.button>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {showPlayCount && (
            <div className="flex items-center gap-2 mb-2">
              <motion.div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + 0.2 }}
              >
                <Headphones className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-xs font-medium text-white/90">
                  {formatNumber(playlist.playCount)}
                </span>
              </motion.div>
              <motion.div 
                className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + 0.25 }}
              >
                <span className="text-xs font-medium text-white/90">
                  {playlist.trackCount}首
                </span>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Info Section - Outside card */}
      <motion.div 
        className="mt-4 px-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 + 0.15, duration: 0.4 }}
      >
        <h3 className="font-bold text-white text-base truncate mb-1.5 group-hover:text-indigo-300 transition-colors duration-300">
          {playlist.name}
        </h3>
        {playlist.creator && (
          <p className="text-sm text-white/40 truncate group-hover:text-white/60 transition-colors duration-300">
            {playlist.creator}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
