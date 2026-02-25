'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import VideoCard, { VideoItem } from './VideoCard';
import { cn } from '@/lib/utils';

interface RecentlyWatchedProps {
  videos: VideoItem[];
  onContinueWatching?: (video: VideoItem) => void;
}

const RecentlyWatched: React.FC<RecentlyWatchedProps> = ({ videos, onContinueWatching }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const recentlyWatched = videos
    .filter(v => v.lastWatched && v.progress !== undefined && v.progress > 0)
    .sort((a, b) => {
      const dateA = a.lastWatched?.getTime() || 0;
      const dateB = b.lastWatched?.getTime() || 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (recentlyWatched.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-tech-cyan rounded-full" />
          <h2 className="text-2xl font-bold text-white">最近观看</h2>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-tech-cyan/10 text-tech-cyan border border-tech-cyan/20">
            {recentlyWatched.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            variant="ghost"
            size="icon"
            className={cn(
              "w-8 h-8 rounded-full bg-black/20 border border-white/10 hover:bg-tech-cyan/20 hover:border-tech-cyan/50 transition-all",
              !canScrollLeft && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            variant="ghost"
            size="icon"
            className={cn(
              "w-8 h-8 rounded-full bg-black/20 border border-white/10 hover:bg-tech-cyan/20 hover:border-tech-cyan/50 transition-all",
              !canScrollRight && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <GlassCard padding="none" className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recentlyWatched.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex-shrink-0 w-48"
            >
              <div className="relative group cursor-pointer" onClick={() => onContinueWatching?.(video)}>
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                  <img
                    src={video.coverUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <motion.div
                      className="h-full bg-tech-cyan"
                      initial={{ width: 0 }}
                      animate={{ width: `${video.progress || 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-tech-cyan/90 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                      <Play className="w-6 h-6 text-black fill-current ml-1" />
                    </div>
                  </div>

                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-tech-cyan text-black shadow-lg backdrop-blur-md animate-pulse">
                      继续
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-tech-cyan transition-colors">
                    {video.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-tech-cyan font-medium">
                      {video.progress !== undefined ? `${Math.round(video.progress)}%` : ''}
                    </span>
                    
                    {video.lastWatched && (
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const now = new Date();
                          const diff = now.getTime() - video.lastWatched!.getTime();
                          const minutes = Math.floor(diff / 60000);
                          const hours = Math.floor(diff / 3600000);
                          const days = Math.floor(diff / 86400000);

                          if (minutes < 1) return '刚刚';
                          if (minutes < 60) return `${minutes}分钟前`;
                          if (hours < 24) return `${hours}小时前`;
                          if (days < 7) return `${days}天前`;
                          return video.lastWatched!.toLocaleDateString('zh-CN');
                        })()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default RecentlyWatched;
