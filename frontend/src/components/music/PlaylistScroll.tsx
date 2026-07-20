'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PlaylistCard from './PlaylistCard';
import type { Playlist } from '@/types/music';

interface PlaylistScrollProps {
  playlists: Playlist[];
  size?: 'small' | 'medium' | 'large';
  showPlayCount?: boolean;
  onPlaylistClick?: (playlist: Playlist) => void;
}

export default function PlaylistScroll({
  playlists,
  size = 'medium',
  showPlayCount = true,
  onPlaylistClick
}: PlaylistScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) {return;}
    const scrollAmount = direction === 'left' ? -400 : 400;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative group">
      {/* Left Gradient Mask */}
      <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Right Gradient Mask */}
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 z-20',
          'w-10 h-10 rounded-full',
          'bg-glass backdrop-blur-xl border border-glass-border',
          'flex items-center justify-center',
          'text-foreground/70 hover:text-foreground hover:bg-foreground/10',
          'transition-all duration-300 ease-out',
          'opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0',
          'hover:scale-110 active:scale-95'
        )}
        aria-label="向左滚动"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 z-20',
          'w-10 h-10 rounded-full',
          'bg-glass backdrop-blur-xl border border-glass-border',
          'flex items-center justify-center',
          'text-foreground/70 hover:text-foreground hover:bg-foreground/10',
          'transition-all duration-300 ease-out',
          'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0',
          'hover:scale-110 active:scale-95'
        )}
        aria-label="向右滚动"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide scroll-smooth px-1"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {playlists.map((playlist, index) => (
          <div
            key={playlist.id}
            className="flex-shrink-0 snap-start"
          >
            <PlaylistCard
              playlist={playlist}
              size={size}
              showPlayCount={showPlayCount}
              onPlay={() => onPlaylistClick?.(playlist)}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
