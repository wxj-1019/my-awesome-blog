'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Camera, Loader2, Image as ImageIcon, FolderOpen, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import AlbumCard from '@/components/albums/AlbumCard';
import AlbumFilter, { FilterType, SortType, ViewMode } from '@/components/albums/AlbumFilter';
import Lightbox, { LightboxImage } from '@/components/ui/Lightbox';
import MasonryGallery, { MasonryImage } from '@/components/ui/MasonryGallery';
import ImageTrail from '@/components/ui/ImageTrail';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import PageActHeader from '@/components/layout/PageActHeader';
import { Album } from '@/types';
import { apiRequest } from '@/lib/api-client';
import { FadeIn } from '@/components/motion';
const AlbumsPageContent = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const { themedClasses } = useThemedClasses();
  // 循环动画（旋转/加载）需要 prefers-reduced-motion 回退为静态终态
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const result = await apiRequest<unknown>('/albums/');

        if (Array.isArray(result)) {
          setAlbums(result as Album[]);
        } else if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as { data: unknown }).data)) {
          setAlbums((result as { data: Album[] }).data);
        } else if (result && typeof result === 'object') {
          console.error('获取相册数据失败:', (result as { detail?: string; message?: string }).detail || (result as { detail?: string; message?: string }).message || '未知错误');
        } else {
          console.error('获取相册数据失败: 未知错误');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('获取相册数据失败:', error);
        setAlbums([
          {
            id: '1',
            title: '城市夜景',
            description: '现代都市的夜晚美景摄影集',
            coverImage: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            date: '2023-10-15',
            featured: true,
            images: 24,
            category: '风景',
            likes: 128,
            views: 1523
          },
          {
            id: '2',
            title: '自然风光',
            description: '壮丽的自然景观摄影',
            coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            date: '2023-09-22',
            featured: false,
            images: 32,
            category: '自然',
            likes: 95,
            views: 876
          },
          {
            id: '3',
            title: '人物肖像',
            description: '专业人像摄影作品',
            coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            date: '2023-08-30',
            featured: true,
            images: 18,
            category: '人像',
            likes: 256,
            views: 2341
          },
          {
            id: '4',
            title: '旅行记忆',
            description: '世界旅行中的美好瞬间',
            coverImage: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            date: '2023-07-18',
            featured: false,
            images: 42,
            category: '旅行',
            likes: 189,
            views: 1987
          },
          {
            id: '5',
            title: '动物世界',
            description: '野生动物的精彩瞬间',
            coverImage: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            date: '2023-06-05',
            featured: true,
            images: 28,
            category: '动物',
            likes: 312,
            views: 3456
          },
          {
            id: '6',
            title: '美食摄影',
            description: '精致美食的视觉盛宴',
            coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            date: '2023-05-12',
            featured: false,
            images: 15,
            category: '美食',
            likes: 167,
            views: 1234
          }
        ]);
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);
  const filteredAndSortedAlbums = useMemo(() => {
    let result = [...albums];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        album =>
          album.title.toLowerCase().includes(term) ||
          album.description.toLowerCase().includes(term) ||
          album.category?.toLowerCase().includes(term)
      );
    }
    if (filter === 'featured') {
      result = result.filter(album => album.featured);
    } else if (filter === 'recent') {
      result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    } else if (filter === 'popular') {
      result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    }
    switch (sort) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        break;
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
        break;
    }
    return result;
  }, [albums, filter, sort, searchTerm]);
  const loadAlbumImages = async (albumId: string) => {
    try {
      const albumDetail = albums.find(album => album.id === albumId);
      if (albumDetail) {
        setSelectedAlbum(albumDetail);
        const images: LightboxImage[] = Array.from({ length: albumDetail.images }, (_, i) => ({
          id: `${albumDetail.id}-${i}`,
          src: albumDetail.coverImage,
          alt: `${albumDetail.title} - 图片 ${i + 1}`,
          title: `${albumDetail.title} - 图片 ${i + 1}`,
          description: `这是${albumDetail.title}相册中的第${i + 1}张图片`,
          date: albumDetail.date,
        }));
        setLightboxImages(images);
        setLightboxIndex(0);
        setLightboxOpen(true);
      }
    } catch (error) {
      console.error('获取相册详情失败:', error);
    }
  };
  const handleImageClick = (album: Album) => {
    loadAlbumImages(album.id);
  };
  const handleMasonryImageClick = (image: MasonryImage, _index: number) => {
    const lightboxImage: LightboxImage = {
      id: image.id,
      src: image.src,
      alt: image.alt,
      title: image.title,
      description: image.description,
      date: image.date,
    };
    setLightboxImages([lightboxImage]);
    setLightboxIndex(0);
    setLightboxOpen(true);
  };
  const masonryImages: MasonryImage[] = useMemo(() => {
    return albums.flatMap(album =>
      Array.from({ length: Math.min(album.images, 8) }, (_, i) => ({
        id: `${album.id}-${i}`,
        src: album.coverImage,
        alt: `${album.title} - 图片 ${i + 1}`,
        title: `${album.title} - 图片 ${i + 1}`,
        description: `这是${album.title}相册中的第${i + 1}张图片`,
        aspectRatio: [1, 1.2, 0.8, 1.5, 0.7][i % 5],
        category: album.category,
        date: album.date,
      }))
    );
  }, [albums]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {/* 加载旋转：reduced-motion 时静止 */}
          <Loader2 className={cn('inline-block w-12 h-12 text-tech-cyan mb-4', !prefersReducedMotion && 'animate-spin')} />
          <p className="text-foreground">正在加载相册...</p>
        </div>
      </div>
    );
  }
  return (
    // 页面背景透明，透出全局 AmbientBackground；局部仅用 token 渐变装饰
    <div className="min-h-screen pb-16 pt-24">
      <div className="container mx-auto px-4">
        <FadeIn direction="down" className="mb-12">
          <div className="relative p-6 sm:p-10 rounded-3xl min-h-[450px]">
            {/* 淡色 token 渐变装饰光斑（纯装饰） */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-tech-cyan/20 rounded-full blur-3xl" aria-hidden />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-tech-sky/20 rounded-full blur-3xl" aria-hidden />
            <div className="absolute inset-0 rounded-3xl bg-glass border border-glass-border" />
            <div className="absolute inset-0 z-0 overflow-visible min-h-[450px] w-full pointer-events-auto">
              <ImageTrail
                items={albums.map(album => album.coverImage)}
                variant={3}
              />
            </div>

            <div className="relative z-10 text-center min-h-[400px] flex flex-col justify-center items-center pointer-events-none">
              {/* 相机图标循环旋转：reduced-motion 时渲染静态终态 */}
              {prefersReducedMotion ? (
                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-tech-cyan/15 backdrop-blur-sm border border-tech-cyan/30">
                  <Camera className="w-6 h-6 text-tech-cyan" />
                </div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-tech-cyan/15 backdrop-blur-sm border border-tech-cyan/30"
                >
                  <Camera className="w-6 h-6 text-tech-cyan" />
                </motion.div>
              )}
              <PageActHeader
                kicker="相册 · ALBUMS"
                title="我的相册"
                description="探索生活中的美好瞬间 · 用镜头记录难忘时刻"
                className="mb-8"
              />
              {/* 统计信息 - 内联到标题框中 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 max-w-md mx-auto pointer-events-auto">
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="flex-1 group relative p-4 rounded-2xl bg-glass backdrop-blur-xl border border-glass-border overflow-hidden pointer-events-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-tech-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {/* 循环旋转：reduced-motion 时渲染静态终态 */}
                    {prefersReducedMotion ? (
                      <div className="p-2 rounded-xl bg-tech-cyan/10 border border-tech-cyan/30">
                        <ImageIcon className="w-5 h-5 text-tech-cyan" />
                      </div>
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="p-2 rounded-xl bg-tech-cyan/10 border border-tech-cyan/30"
                      >
                        <ImageIcon className="w-5 h-5 text-tech-cyan" />
                      </motion.div>
                    )}
                    <div className="text-left">
                      <FadeIn delay={0.2} className={cn("text-2xl font-bold tabular-nums", themedClasses.textClass)}>
                        {albums.reduce((sum, album) => sum + album.images, 0)}
                      </FadeIn>
                      <div className={cn("text-sm", themedClasses.mutedTextClass)}>
                        张照片
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="flex-1 group relative p-4 rounded-2xl bg-glass backdrop-blur-xl border border-glass-border overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-tech-sky/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {/* 反向循环旋转：reduced-motion 时渲染静态终态 */}
                    {prefersReducedMotion ? (
                      <div className="p-2 rounded-xl bg-tech-sky/10 border border-tech-sky/30">
                        <FolderOpen className="w-5 h-5 text-tech-sky" />
                      </div>
                    ) : (
                      <motion.div
                        animate={{ rotate: [360, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="p-2 rounded-xl bg-tech-sky/10 border border-tech-sky/30"
                      >
                        <FolderOpen className="w-5 h-5 text-tech-sky" />
                      </motion.div>
                    )}
                    <div className="text-left">
                      <FadeIn delay={0.3} className={cn("text-2xl font-bold tabular-nums", themedClasses.textClass)}>
                        {albums.length}
                      </FadeIn>
                      <div className={cn("text-sm", themedClasses.mutedTextClass)}>
                        个相册
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeIn>
        <AlbumFilter
          onFilterChange={setFilter}
          onSortChange={setSort}
          onViewModeChange={setViewMode}
          onSearchChange={setSearchTerm}
          initialFilter={filter}
          initialSort={sort}
          initialView={viewMode}
          className="mb-8"
        />
        <AnimatePresence mode="wait">
          {viewMode === 'masonry' ? (
            <motion.div
              key="masonry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MasonryGallery
                images={masonryImages}
                columns={3}
                gap={4}
                onImageClick={handleMasonryImageClick}
                showOverlay={true}
                enableLazyLoad={true}
              />
            </motion.div>
          ) : (
            <FadeIn key={viewMode}>
              <div
                className={cn(
                  'grid gap-6',
                  viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                )}
              >
                {filteredAndSortedAlbums.map((album) => (
                  <div key={album.id}>
                    <AlbumCard
                      album={album}
                      onClick={handleImageClick}
                      showOverlay={true}
                      enableHoverEffect={true}
                      enableMagneticEffect={true}
                    />
                  </div>
                ))}
              </div>
            </FadeIn>
          )}
        </AnimatePresence>
        {filteredAndSortedAlbums.length === 0 && (
          /* 统一空态三要素：图标 + 一句话 + 清除筛选行动按钮 */
          <EmptyState
            variant="search"
            icon={Camera}
            title="没有找到匹配的相册"
            description="尝试调整筛选条件或搜索关键词"
            action={{
              label: '清除筛选',
              onClick: () => { setFilter('all'); setSearchTerm(''); },
              icon: RefreshCw,
            }}
          />
        )}
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
          onPrevious={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
          enableZoom={true}
          enableRotate={true}
          enableDownload={true}
          enableShare={true}
          enableFullscreen={true}
          keyboardNavigation={true}
        />
      </div>
    </div>
  );
};
export default AlbumsPageContent;
