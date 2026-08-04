'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { X, Save, Film, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoItem, VideoType, VideoStatus } from './VideoCard';
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
                    <Film className="text-tech-cyan" />
                    添加新收藏
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground">标题</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="输入电影/剧集名称"
                      required
                      className="bg-glass border-glass-border focus:border-tech-cyan/50 text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">类型</Label>
                      <div className="flex bg-glass rounded-lg p-1">
                        {(['movie', 'tv', 'anime'] as VideoType[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                              type === t
                                ? "bg-tech-cyan text-primary-foreground shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {t === 'movie' ? '电影' : t === 'tv' ? '剧集' : '动漫'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-foreground">状态</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as VideoStatus)}
                        className="w-full h-10 px-3 rounded-md bg-glass border border-glass-border text-foreground focus:outline-none focus:border-tech-cyan/50"
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
                        <Label htmlFor="season" className="text-foreground">季节</Label>
                        <Input
                          id="season"
                          type="number"
                          min="1"
                          value={currentSeason}
                          onChange={(e) => setCurrentSeason(parseInt(e.target.value) || 1)}
                          className="bg-glass border-glass-border text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="episode" className="text-foreground">集数</Label>
                        <Input
                          id="episode"
                          type="number"
                          min="1"
                          value={currentEpisode}
                          onChange={(e) => setCurrentEpisode(parseInt(e.target.value) || 1)}
                          className="bg-glass border-glass-border text-foreground"
                        />
                      </div>
                    </div>
                  )}

                  {status === 'watching' && (
                    <div className="space-y-4 p-4 bg-glass rounded-lg border border-glass-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-tech-cyan" />
                        <span className="text-sm font-medium text-foreground">进度设置</span>
                      </div>

                      {type === 'movie' ? (
                        <div className="space-y-2">
                          <Label htmlFor="progress" className="text-foreground">观看进度 (%)</Label>
                          <div className="relative">
                            <input
                              id="progress"
                              type="range"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={(e) => setProgress(parseInt(e.target.value))}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-tech-cyan"
                            />
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>0%</span>
                              <span className="text-tech-cyan font-bold">{progress}%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          当前进度: S{currentSeason} E{currentEpisode}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-foreground">总时长 (如: 2h 30m)</Label>
                        <Input
                          id="duration"
                          value={totalDuration}
                          onChange={(e) => setTotalDuration(e.target.value)}
                          placeholder="2h 30m"
                          className="bg-glass border-glass-border text-foreground"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="text-foreground">评分 (0-10)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="bg-glass border-glass-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-foreground">标签 (逗号分隔)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="科幻, 动作, 2024"
                        className="bg-glass border-glass-border text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover" className="text-foreground">封面图片 URL</Label>
                    <Input
                      id="cover"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-glass border-glass-border text-foreground"
                    />
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
                      type="submit"
                      variant="default"
                      className="bg-tech-cyan text-primary-foreground hover:bg-tech-lightcyan"
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
