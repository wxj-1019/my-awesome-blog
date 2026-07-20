'use client';

import { cn } from '@/lib/utils';
import type { Song } from '@/types/music';
import { Play, Heart, MoreHorizontal } from 'lucide-react';

interface SongRowProps {
  song: Song;
  index: number;
  isPlaying?: boolean;
  currentSong?: Song;
  showAlbum?: boolean;
  showDuration?: boolean;
  onSongClick?: (song: Song) => void;
  onDoubleClick?: (song: Song) => void;
}

export default function SongRow({ 
  song, 
  index,
  isPlaying = false,
  currentSong,
  showAlbum = false,
  showDuration = true,
  onSongClick,
  onDoubleClick
}: SongRowProps) {
  const isCurrentSong = currentSong?.id === song.id;

  return (
    <div 
      className={cn(
        'group flex items-center h-14 px-4 transition-all duration-300 cursor-pointer rounded-xl mx-2',
        isCurrentSong
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-foreground/5 text-foreground/80'
      )}
      onClick={() => onSongClick?.(song)}
      onDoubleClick={() => onDoubleClick?.(song)}
      role="button"
      tabIndex={0}
    >
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isCurrentSong && isPlaying ? (
          <div className="flex items-end gap-[3px] h-5">
            <div className="w-[3px] bg-gradient-to-t from-tech-cyan to-tech-lightcyan rounded-full animate-sound-wave-1"></div>
            <div className="w-[3px] bg-gradient-to-t from-tech-cyan to-tech-lightcyan rounded-full animate-sound-wave-2"></div>
            <div className="w-[3px] bg-gradient-to-t from-tech-cyan to-tech-lightcyan rounded-full animate-sound-wave-3"></div>
            <div className="w-[3px] bg-gradient-to-t from-tech-cyan to-tech-lightcyan rounded-full animate-sound-wave-4"></div>
          </div>
        ) : (
          <>
            <span className={cn(
              'text-[13px] font-medium text-muted-foreground tabular-nums',
              'group-hover:hidden',
              isCurrentSong && 'text-primary'
            )}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <button 
              className={cn(
                'hidden group-hover:flex items-center justify-center transition-colors',
                isCurrentSong ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="播放"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </>
        )}
      </div>

      {showAlbum && (
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mr-4 shadow-sm">
          {/* 音乐封面可能来自外部音乐服务，域名不可控，保留 <img> */}
          <img 
            src={song.coverImg || song.album.coverImg} 
            alt={song.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 mr-4">
        <h4 className={cn(
          'text-sm font-medium truncate mb-0.5',
          isCurrentSong ? 'text-primary' : 'text-foreground'
        )}>
          {song.name}
        </h4>
        <div className="flex items-center gap-2">
          {song.sq && (
            <span className="px-1 py-[1px] rounded-[3px] border border-tech-cyan text-tech-cyan text-[9px] font-medium leading-none">
              SQ
            </span>
          )}
          <p className={cn(
            "text-xs truncate",
            isCurrentSong ? "text-primary/70" : "text-muted-foreground"
          )}>
            {song.artists.map(artist => artist.name).join(', ')}
          </p>
        </div>
      </div>

      {showAlbum && !showAlbum && (
        <div className="w-40 flex-shrink-0 hidden md:block">
          <p className="text-[13px] text-muted-foreground truncate">
            {song.album.name}
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-primary transition-all duration-300"
            aria-label="喜欢"
            onClick={(e) => {
              e.stopPropagation();
              // handle like
            }}
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all duration-300"
            aria-label="更多"
            onClick={(e) => {
              e.stopPropagation();
              // handle more
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {showDuration && (
          <div className="w-12 flex-shrink-0 text-right">
            <p className="text-xs font-medium text-muted-foreground/70 tabular-nums">
              {formatDuration(song.duration)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
