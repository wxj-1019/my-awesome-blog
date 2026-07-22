'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Save, Clock, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import GlassCard from '@/components/ui/GlassCard';
import { VideoItem, Episode } from './VideoCard';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  video: VideoItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProgress: (videoId: string, progress: number, currentEpisode?: Episode) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ video, isOpen, onClose, onUpdateProgress }) => {
  const [progress, setProgress] = useState(video.progress || 0);
  const [currentSeason, setCurrentSeason] = useState(video.currentEpisode?.season || 1);
  const [currentEpisode, setCurrentEpisode] = useState(video.currentEpisode?.episode || 1);
  const totalSeasons = 10;
  const episodesPerSeason = 10;

  const calculateRemainingTime = () => {
    if (!video.totalDuration) {return '';}
    const remainingPercent = 100 - progress;
    const totalMinutes = parseDuration(video.totalDuration);
    const remainingMinutes = Math.round((totalMinutes * remainingPercent) / 100);
    return formatDuration(remainingMinutes);
  };

  const parseDuration = (duration: string): number => {
    const hoursMatch = duration.match(/(\d+)\s*h/);
    const minutesMatch = duration.match(/(\d+)\s*m/);

    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    return hours * 60 + minutes;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  const handleSave = () => {
    const episode: Episode = {
      season: currentSeason,
      episode: currentEpisode,
    };
    onUpdateProgress(video.id, progress, episode);
    onClose();
  };

  const handleQuickProgress = (value: number) => {
    setProgress(value);
  };

  const formatTimeAgo = (date?: Date): string => {
    if (!date) {return '从未观看';}
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {return '刚刚';}
    if (minutes < 60) {return `${minutes}分钟前`;}
    if (hours < 24) {return `${hours}小时前`;}
    if (days < 7) {return `${days}天前`;}
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg pointer-events-auto">
              <GlassCard className="relative overflow-hidden border-tech-cyan/30 shadow-[0_0_50px_var(--shadow-tech-cyan)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="text-tech-cyan" />
                    进度追踪
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-glass rounded-lg border border-glass-border">
                    <img
                      src={video.coverUrl}
                      alt={video.title}
                      className="w-20 h-28 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">{video.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-muted">
                          {video.type}
                        </span>
                        {video.lastWatched && (
                          <span>上次观看: {formatTimeAgo(video.lastWatched)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {video.type === 'tv' || video.type === 'anime' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">季节</Label>
                          <div className="relative">
                            <select
                              value={currentSeason}
                              onChange={(e) => setCurrentSeason(parseInt(e.target.value))}
                              className="w-full h-10 px-3 rounded-md bg-glass border border-glass-border text-foreground focus:outline-none focus:border-tech-cyan/50 appearance-none cursor-pointer"
                            >
                              {Array.from({ length: totalSeasons }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  第 {i + 1} 季
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-foreground">集数</Label>
                          <div className="relative">
                            <select
                              value={currentEpisode}
                              onChange={(e) => setCurrentEpisode(parseInt(e.target.value))}
                              className="w-full h-10 px-3 rounded-md bg-glass border border-glass-border text-foreground focus:outline-none focus:border-tech-cyan/50 appearance-none cursor-pointer"
                            >
                              {Array.from({ length: episodesPerSeason }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  第 {i + 1} 集
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="text-center text-sm text-muted-foreground">
                        当前进度: S{currentSeason} E{currentEpisode}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">观看进度</Label>
                        <div className="relative">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => setProgress(parseInt(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-tech-cyan"
                          />
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="text-tech-cyan font-bold">{Math.round(progress)}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {video.totalDuration && (
                        <div className="flex items-center justify-between p-3 bg-glass rounded-lg border border-glass-border">
                          <span className="text-sm text-muted-foreground">剩余时间</span>
                          <span className="text-lg font-bold text-tech-cyan">
                            {calculateRemainingTime()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {[0, 25, 50, 75, 100].map((value) => (
                      <Button
                        key={value}
                        onClick={() => handleQuickProgress(value)}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1",
                          progress === value && "bg-tech-cyan/20 text-tech-cyan border-tech-cyan/50"
                        )}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant="default"
                      className="bg-tech-cyan text-primary-foreground hover:bg-tech-lightcyan"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存进度
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProgressTracker;
