'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Film, Tv, MonitorPlay, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoItem, VideoType, VideoStatus, Episode } from './VideoCard';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (video: Omit<VideoItem, 'id'>) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<VideoType>('movie');
  const [status, setStatus] = useState<VideoStatus>('plan_to_watch');
  const [rating, setRating] = useState(0);
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState('');
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState('');
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const video: Omit<VideoItem, 'id'> = {
      title,
      type,
      status,
      rating: Number(rating),
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      progress: status === 'watching' ? progress : undefined,
      totalDuration: totalDuration || undefined,
      lastWatched: status === 'watching' ? new Date() : undefined,
    };

    if (type === 'tv' || type === 'anime') {
      video.currentEpisode = {
        season: currentSeason,
        episode: currentEpisode,
      };
    }

    onAdd(video);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setType('movie');
    setStatus('plan_to_watch');
    setRating(0);
    setCoverUrl('');
    setTags('');
    setProgress(0);
    setTotalDuration('');
    setCurrentSeason(1);
    setCurrentEpisode(1);
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg pointer-events-auto">
              <GlassCard className="relative overflow-hidden border-tech-cyan/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Film className="text-tech-cyan" />
                    添加新收藏
                  </h2>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">标题</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="输入电影/剧集名称"
                      required
                      className="bg-black/20 border-white/10 focus:border-tech-cyan/50 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">类型</Label>
                      <div className="flex bg-black/20 rounded-lg p-1">
                        {(['movie', 'tv', 'anime'] as VideoType[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                              type === t 
                                ? "bg-tech-cyan text-black shadow-lg" 
                                : "text-gray-400 hover:text-white"
                            )}
                          >
                            {t === 'movie' ? '电影' : t === 'tv' ? '剧集' : '动漫'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-gray-300">状态</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as VideoStatus)}
                        className="w-full h-10 px-3 rounded-md bg-black/20 border border-white/10 text-white focus:outline-none focus:border-tech-cyan/50"
                      >
                        <option value="watching">在看</option>
                        <option value="completed">看完</option>
                        <option value="plan_to_watch">想看</option>
                        <option value="dropped">弃坑</option>
                      </select>
                    </div>
                  </div>

                  {(type === 'tv' || type === 'anime') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="season" className="text-gray-300">季节</Label>
                        <Input
                          id="season"
                          type="number"
                          min="1"
                          value={currentSeason}
                          onChange={(e) => setCurrentSeason(parseInt(e.target.value) || 1)}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="episode" className="text-gray-300">集数</Label>
                        <Input
                          id="episode"
                          type="number"
                          min="1"
                          value={currentEpisode}
                          onChange={(e) => setCurrentEpisode(parseInt(e.target.value) || 1)}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  )}

                  {status === 'watching' && (
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-tech-cyan" />
                        <span className="text-sm font-medium text-white">进度设置</span>
                      </div>

                      {type === 'movie' ? (
                        <div className="space-y-2">
                          <Label htmlFor="progress" className="text-gray-300">观看进度 (%)</Label>
                          <div className="relative">
                            <input
                              id="progress"
                              type="range"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={(e) => setProgress(parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tech-cyan"
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-400">
                              <span>0%</span>
                              <span className="text-tech-cyan font-bold">{progress}%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          当前进度: S{currentSeason} E{currentEpisode}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-gray-300">总时长 (如: 2h 30m)</Label>
                        <Input
                          id="duration"
                          value={totalDuration}
                          onChange={(e) => setTotalDuration(e.target.value)}
                          placeholder="2h 30m"
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="text-gray-300">评分 (0-10)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="bg-black/20 border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-gray-300">标签 (逗号分隔)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="科幻, 动作, 2024"
                        className="bg-black/20 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover" className="text-gray-300">封面图片 URL</Label>
                    <Input
                      id="cover"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-black/20 border-white/10 text-white"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={onClose}
                      className="text-gray-400 hover:text-white"
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      variant="default"
                      className="bg-tech-cyan text-black hover:bg-tech-lightcyan"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </Button>
                  </div>
                </form>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddVideoModal;
