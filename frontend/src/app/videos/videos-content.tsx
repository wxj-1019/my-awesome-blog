'use client';

import React, { useState } from 'react';
import { Plus, Search, Film, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

import VideoCard, { VideoItem, VideoType, Episode } from '@/components/videos/VideoCard';
import AddVideoModal from '@/components/videos/AddVideoModal';
import RecentlyWatched from '@/components/videos/RecentlyWatched';
import ProgressTracker from '@/components/videos/ProgressTracker';
import LottieAnimation from '@/components/ui/LottieAnimation';
import PageActHeader from '@/components/layout/PageActHeader';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { cn } from '@/lib/utils';

const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: '1',
    title: 'Inception',
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    type: 'movie',
    status: 'completed',
    rating: 9.5,
    progress: 100,
    totalDuration: '2h 28m',
    lastWatched: new Date(Date.now() - 86400000 * 3),
    tags: ['Sci-Fi', 'Thriller'],
  },
  {
    id: '2',
    title: 'Stranger Things',
    coverUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=800&q=80',
    type: 'tv',
    status: 'watching',
    rating: 8.8,
    progress: 45,
    totalDuration: '8h 30m',
    currentEpisode: { season: 4, episode: 2 },
    lastWatched: new Date(Date.now() - 3600000 * 2),
    tags: ['Horror', 'Mystery'],
  },
  {
    id: '3',
    title: 'Attack on Titan',
    coverUrl: 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=800&q=80',
    type: 'anime',
    status: 'completed',
    rating: 9.8,
    progress: 100,
    totalDuration: '24h',
    currentEpisode: { season: 4, episode: 28 },
    lastWatched: new Date(Date.now() - 86400000 * 7),
    tags: ['Action', 'Drama'],
  },
  {
    id: '4',
    title: 'Dune: Part Two',
    coverUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80',
    type: 'movie',
    status: 'plan_to_watch',
    rating: 0,
    tags: ['Sci-Fi', 'Epic'],
  },
  {
    id: '5',
    title: 'Breaking Bad',
    coverUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe0?auto=format&fit=crop&w=800&q=80',
    type: 'tv',
    status: 'watching',
    rating: 9.7,
    progress: 78,
    totalDuration: '62h',
    currentEpisode: { season: 5, episode: 12 },
    lastWatched: new Date(Date.now() - 3600000 * 5),
    tags: ['Crime', 'Drama'],
  },
];

export default function VideosPageContent() {
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [filterType, setFilterType] = useState<VideoType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isProgressTrackerOpen, setIsProgressTrackerOpen] = useState(false);

  const filteredVideos = videos.filter(video => {
    const matchesType = filterType === 'all' || video.type === filterType;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: videos.length,
    watching: videos.filter(v => v.status === 'watching').length,
    completed: videos.filter(v => v.status === 'completed').length,
    plan: videos.filter(v => v.status === 'plan_to_watch').length,
    totalWatchTime: videos.reduce((acc, v) => {
      if (v.totalDuration && v.progress) {
        const hoursMatch = v.totalDuration.match(/(\d+)\s*h/);
        const minsMatch = v.totalDuration.match(/(\d+)\s*m/);
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
        const totalMinutes = hours * 60 + mins;
        return acc + Math.round((totalMinutes * v.progress) / 100);
      }
      return acc;
    }, 0),
  };

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  const handleAddVideo = (newVideo: Omit<VideoItem, 'id'>) => {
    const video: VideoItem = {
      ...newVideo,
      id: Math.random().toString(36).substr(2, 9),
    };
    setVideos([video, ...videos]);
  };

  const handleUpdateProgress = (videoId: string, progress: number, currentEpisode?: Episode) => {
    setVideos(videos.map(v => {
      if (v.id === videoId) {
        const updated = { ...v, progress };
        if (currentEpisode) {
          updated.currentEpisode = currentEpisode;
        }
        if (progress === 100) {
          updated.status = 'completed';
        }
        return updated;
      }
      return v;
    }));
  };

  const handleContinueWatching = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsProgressTrackerOpen(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-tech-darkblue/20 via-tech-deepblue/10 to-tech-cyan/5">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-8">
          {/* 统一幕标式页头（自带 FadeIn 入场） */}
          <PageActHeader
            kicker="放映厅 · VIDEOS"
            title="我的视频"
            description="记录您的电影、剧集和动漫之旅"
          />

          <div className="relative overflow-hidden rounded-2xl bg-glass border border-glass-border shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
              {/* 远程 embed 地址常返回 HTML，失败时静默回退，避免破坏布局 */}
              <LottieAnimation
                src="https://assets5.lottiefiles.com/packages/lf20_qp1q7mct.json"
                className="w-full h-full object-cover"
                fallback={null}
              />
            </div>

            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-4 max-w-lg">
                <FadeIn
                  direction="right"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tech-cyan/10 text-tech-cyan text-xs font-bold uppercase tracking-wider border border-tech-cyan/20"
                >
                  <Film className="w-3 h-3" />
                  个人收藏
                </FadeIn>

                <p className="text-muted-foreground text-lg">
                  将您的进度和发现保存在这个充满未来感的地方。
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-2 bg-glass px-4 py-2 rounded-lg border border-glass-border backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-foreground font-bold">{stats.watching}</span>
                    <span className="text-muted-foreground text-sm">在看</span>
                  </div>
                  <div className="flex items-center gap-2 bg-glass px-4 py-2 rounded-lg border border-glass-border backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-info" />
                    <span className="text-foreground font-bold">{stats.completed}</span>
                    <span className="text-muted-foreground text-sm">已完成</span>
                  </div>
                  <div className="flex items-center gap-2 bg-glass px-4 py-2 rounded-lg border border-glass-border backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-foreground font-bold">{stats.plan}</span>
                    <span className="text-muted-foreground text-sm">计划</span>
                  </div>
                  <div className="flex items-center gap-2 bg-glass px-4 py-2 rounded-lg border border-glass-border backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-tech-cyan" />
                    <span className="text-foreground font-bold">{formatWatchTime(stats.totalWatchTime)}</span>
                    <span className="text-muted-foreground text-sm">总观看</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-tech-cyan hover:bg-tech-lightcyan text-primary-foreground font-bold px-8 py-6 text-lg rounded-xl shadow-tech-cyan hover:shadow-[0_0_30px_var(--shadow-tech-cyan)] transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  添加新收藏
                </Button>
              </div>
            </div>
          </div>

          <RecentlyWatched
            videos={videos}
            onContinueWatching={handleContinueWatching}
          />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40 bg-glass backdrop-blur-xl p-4 rounded-xl border border-glass-border">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {(['all', 'movie', 'tv', 'anime'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    filterType === t
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "bg-glass text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === 'all' ? '全部' : t === 'movie' ? '电影' : t === 'tv' ? '剧集' : '动漫'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索收藏..."
                  className="pl-9 bg-glass border-glass-border focus:border-tech-cyan/50"
                />
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="md:hidden bg-tech-cyan text-primary-foreground"
                size="icon"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {filteredVideos.length > 0 ? (
            <Stagger
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
              itemCount={filteredVideos.length}
            >
              {filteredVideos.map((video) => (
                <StaggerItem key={video.id} className="h-full">
                  <VideoCard
                    video={video}
                    onClick={() => {
                      setSelectedVideo(video);
                      setIsProgressTrackerOpen(true);
                    }}
                    onContinueWatching={() => handleContinueWatching(video)}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-glass rounded-full flex items-center justify-center mb-4">
                <Film className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">未找到视频</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                尝试调整筛选条件或搜索查询以查找您想要的内容。
              </p>
              <Button onClick={() => {setFilterType('all'); setSearchQuery('');}} variant="outline">
                清除筛选
              </Button>
            </div>
          )}

          <AddVideoModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddVideo}
          />

          {selectedVideo && (
            <ProgressTracker
              video={selectedVideo}
              isOpen={isProgressTrackerOpen}
              onClose={() => {
                setIsProgressTrackerOpen(false);
                setSelectedVideo(null);
              }}
              onUpdateProgress={handleUpdateProgress}
            />
          )}
        </div>
      </div>
    </div>
  );
}
