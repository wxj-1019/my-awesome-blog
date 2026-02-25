'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Play, Clock, MoreVertical, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';

export type VideoStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped';
export type VideoType = 'movie' | 'tv' | 'anime';

export interface Episode {
  season: number;
  episode: number;
}

export interface VideoItem {
  id: string;
  title: string;
  coverUrl: string;
  type: VideoType;
  status: VideoStatus;
  rating: number;
  progress?: number;
  totalDuration?: string;
  currentEpisode?: Episode;
  lastWatched?: Date;
  tags?: string[];
}

interface VideoCardProps {
  video: VideoItem;
  onClick?: () => void;
  onContinueWatching?: () => void;
  showProgress?: boolean;
}

const statusColors: Record<VideoStatus, string> = {
  watching: 'bg-green-500',
  completed: 'bg-blue-500',
  plan_to_watch: 'bg-yellow-500',
  dropped: 'bg-red-500',
};

const statusLabels: Record<VideoStatus, string> = {
  watching: '在看',
  completed: '看完',
  plan_to_watch: '想看',
  dropped: '弃坑',
};

const formatTimeAgo = (date?: Date): string => {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

const formatEpisode = (episode?: Episode): string => {
  if (!episode) return '';
  return `S${episode.season} E${episode.episode}`;
};

const formatProgress = (progress?: number): string => {
  if (progress === undefined || progress === null) return '';
  return `${Math.round(progress)}%`;
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, onContinueWatching, showProgress = true }) => {
  const hasProgress = video.progress !== undefined && video.progress !== null && video.progress > 0;
  const isWatching = video.status === 'watching';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative h-full"
      onClick={onClick}
    >
      <GlassCard 
        padding="none" 
        className="h-full overflow-hidden border-glass-border/50 hover:border-tech-cyan/50 transition-colors duration-300 cursor-pointer"
        glowEffect
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <img 
            src={video.coverUrl} 
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          
          <div className="absolute top-2 right-2">
            <span className={cn(
              "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md text-white shadow-lg backdrop-blur-md",
              statusColors[video.status]
            )}>
              {statusLabels[video.status]}
            </span>
          </div>

          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-black/50 text-white backdrop-blur-md border border-white/10">
              {video.type}
            </span>
          </div>

          {isWatching && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-tech-cyan text-black shadow-lg backdrop-blur-md animate-pulse">
                继续观看
              </span>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-tech-cyan/80 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <Play className="w-6 h-6 text-black fill-current ml-1" />
            </div>
          </div>

          {hasProgress && showProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <motion.div 
                className="h-full bg-tech-cyan"
                initial={{ width: 0 }}
                animate={{ width: `${video.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>

        <div className="p-4 relative">
          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-tech-cyan transition-colors duration-200">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-sm font-bold">{video.rating}</span>
            </div>
            
            {video.currentEpisode && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatEpisode(video.currentEpisode)}</span>
              </div>
            )}
          </div>

          {hasProgress && showProgress && (
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-tech-cyan font-medium">{formatProgress(video.progress)}</span>
              {video.lastWatched && (
                <span className="text-gray-500">{formatTimeAgo(video.lastWatched)}</span>
              )}
            </div>
          )}
          
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {video.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default VideoCard;
