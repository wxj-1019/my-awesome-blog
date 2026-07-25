'use client';

import { useState } from 'react';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Song, PlayMode } from '@/types/music';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, 
  ListMusic, Volume2, Maximize2, ChevronDown 
} from 'lucide-react';

interface PlayerBarProps {
  currentSong?: Song;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playMode: PlayMode;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (progress: number) => void;
  onVolumeChange: (volume: number) => void;
  onModeChange: (mode: PlayMode) => void;
  onShowPlaylist?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function PlayerBar({ 
  currentSong,
  isPlaying,
  progress,
  duration,
  volume,
  playMode,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onModeChange,
  onShowPlaylist,
  isExpanded = false,
  onToggleExpand
}: PlayerBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  // 减少动画偏好：封面旋转与呼吸光晕回退为静态
  const reducedMotion = useReducedMotion();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    onSeek(newProgress);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'list':
        return <Repeat className="w-5 h-5" aria-hidden="true" />;
      case 'random':
        return <Shuffle className="w-5 h-5" aria-hidden="true" />;
      case 'single':
        return <Repeat1 className="w-5 h-5" aria-hidden="true" />;
      default:
        return <Repeat className="w-5 h-5" aria-hidden="true" />;
    }
  };

  const cyclePlayMode = () => {
    const modes: PlayMode[] = ['list', 'random', 'single'];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onModeChange(modes[nextIndex]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className={cn(
        'h-20 bg-card/95 backdrop-blur-md border-t border-glass-border shadow-2xl shadow-black/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
        isExpanded && 'h-screen'
      )}>
        <div className="flex items-center h-20 px-6 max-w-screen-2xl mx-auto">
          {/* Track Info */}
          <div className="w-1/3 flex items-center gap-4 flex-shrink-0 min-w-0">
            {currentSong ? (
              <>
                <motion.div 
                  className={cn(
                    "relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg",
                    isPlaying && "shadow-tech-cyan"
                  )}
                  animate={isPlaying ? { scale: 1 } : { scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img
                    src={currentSong.coverImg || currentSong.album.coverImg}
                    alt="专辑封面"
                    className="w-full h-full object-cover"
                    animate={isPlaying && !reducedMotion ? { rotate: 360 } : { rotate: 0 }}
                    transition={isPlaying && !reducedMotion ? {
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                    } : { duration: 0.3 }}
                    style={{ borderRadius: '20%' }}
                  />
                  {/* Center hole for vinyl effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3 h-3 bg-card rounded-full" />
                  </div>
                  {/* Playing indicator glow（reduced-motion 时不渲染循环光晕） */}
                  {isPlaying && !reducedMotion && (
                    <motion.div 
                      className="absolute inset-0 rounded-xl"
                      animate={{ 
                        boxShadow: [
                          '0 0 10px color-mix(in srgb, var(--primary) 30%, transparent)',
                          '0 0 25px color-mix(in srgb, var(--primary) 50%, transparent)',
                          '0 0 10px color-mix(in srgb, var(--primary) 30%, transparent)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-foreground truncate leading-tight mb-0.5">
                    {currentSong.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentSong.artists.map(artist => artist.name).join(', ')}
                  </p>
                </div>
                <button className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors duration-300" aria-label="播放列表">
                  <ListMusic className="w-5 h-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 opacity-50">
                <div className="w-12 h-12 bg-foreground/5 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-24 h-3 bg-foreground/5 rounded" />
                  <div className="w-16 h-2 bg-foreground/5 rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="w-1/3 flex flex-col items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-5 mb-2">
              <button
                className={cn(
                  "w-8 h-8 flex items-center justify-center transition-colors duration-300 rounded-full",
                  playMode === 'random'
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground/70 hover:bg-foreground/5"
                )}
                onClick={cyclePlayMode}
                aria-label="切换播放模式"
              >
                {getPlayModeIcon()}
              </button>

              <button
                className="w-9 h-9 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors duration-300"
                onClick={onPrevious}
                aria-label="上一首"
              >
                <SkipBack className="w-5 h-5 fill-current" aria-hidden="true" />
              </button>

              <button
                className={cn(
                  'w-11 h-11 bg-gradient-to-r from-tech-cyan to-tech-sky text-primary-foreground rounded-full flex items-center justify-center',
                  'shadow-lg shadow-tech-cyan transition-[colors,transform] duration-300',
                  'hover:shadow-[0_0_30px_var(--shadow-tech-cyan)] hover:scale-105 active:scale-95'
                )}
                onClick={isPlaying ? onPause : onPlay}
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" aria-hidden="true" />
                )}
              </button>

              <button
                className="w-9 h-9 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors duration-300"
                onClick={onNext}
                aria-label="下一首"
              >
                <SkipForward className="w-5 h-5 fill-current" aria-hidden="true" />
              </button>

              <button
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground/70 hover:bg-foreground/5 rounded-full transition-colors duration-300"
                onClick={onShowPlaylist}
                aria-label="播放列表"
              >
                <ListMusic className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3 w-full max-w-md px-2 group/progress">
              <span className="text-[10px] font-medium text-muted-foreground w-8 text-right tabular-nums">
                {formatTime(progress)}
              </span>

              <div className="flex-1 relative h-1.5 group cursor-pointer">
                {/* Background */}
                <div className="absolute inset-0 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                  {/* Progress with gradient */}
                  <div
                    className="h-full bg-gradient-to-r from-tech-cyan to-tech-sky rounded-full transition-all duration-100"
                    style={{ width: `${(progress / duration) * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={progress}
                  onChange={handleSeek}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {/* Thumb */}
                <div
                  className={cn(
                    "absolute top-1/2 -mt-1.5 w-3.5 h-3.5 bg-foreground rounded-full pointer-events-none transition-transform duration-200 scale-0 shadow-md",
                    "group-hover:scale-100",
                    isDragging && "scale-100"
                  )}
                  style={{ left: `calc(${(progress / duration) * 100}% - 7px)` }}
                />
              </div>

              <span className="text-[10px] font-medium text-muted-foreground w-8 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Expand */}
          <div className="w-1/3 flex items-center justify-end gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 group/volume">
              <button
                className="text-muted-foreground hover:text-foreground/70 transition-colors duration-300"
                aria-label="音量"
              >
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="w-24 relative h-1.5 group cursor-pointer">
                <div className="absolute inset-0 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-tech-cyan/80 to-tech-sky/80 rounded-full"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  onMouseDown={() => setIsVolumeDragging(true)}
                  onMouseUp={() => setIsVolumeDragging(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={cn(
                    "absolute top-1/2 -mt-1.5 w-3 h-3 bg-foreground rounded-full pointer-events-none transition-transform duration-200 scale-0 shadow-md",
                    "group-hover:scale-100",
                    isVolumeDragging && "scale-100"
                  )}
                  style={{ left: `calc(${volume * 100}% - 6px)` }}
                />
              </div>
            </div>

            <div className="w-[1px] h-4 bg-border mx-2" />

            <button
              className="text-muted-foreground hover:text-foreground/70 transition-[colors,transform] duration-300 hover:scale-110"
              onClick={onToggleExpand}
              aria-label={isExpanded ? '收起播放器' : '展开播放器'}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
