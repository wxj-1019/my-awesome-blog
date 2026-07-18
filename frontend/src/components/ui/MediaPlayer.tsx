'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  caption?: string;
}

interface MediaPlayerProps {
  mediaItems: MediaItem[];
  autoPlay?: boolean;
  loop?: boolean;
  aspectRatio?: string;
  fitMode?: 'cover' | 'contain' | 'fill'; // 新增：控制媒体内容显示方式
}

export default function MediaPlayer({ 
  mediaItems, 
  autoPlay = false, 
  loop = true,
  aspectRatio = '',
  fitMode = 'contain' // 默认改为 contain 以完整显示内容
}: MediaPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentMedia = mediaItems[currentIndex];

  // 自动播放控制
  useEffect(() => {
    if (autoPlay && mediaItems.length > 1) {
      intervalRef.current = setInterval(() => {
        if (currentMedia.type === 'video' && videoRef.current) {
          // 如果是视频且正在播放，则不切换
          if (!videoRef.current.paused) {return;}
        }
        
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % mediaItems.length;
          return nextIndex;
        });
      }, 5000); // 每5秒切换一次
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, mediaItems.length, currentMedia]);

  // 控制视频播放/暂停
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("播放失败:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  const togglePlay = () => {
    if (currentMedia.type === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (currentMedia.type === 'image' && mediaItems.length > 1) {
      // 对于图片，切换播放状态意味着自动切换图片
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const rotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const rotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const handleMediaEnd = () => {
    if (loop) {
      nextMedia();
    } else if (currentIndex === mediaItems.length - 1) {
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative w-full h-full group">
      <div className={`relative w-full h-full overflow-hidden ${aspectRatio}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          {currentMedia.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentMedia.src}
              poster="" // 可以设置封面图
              muted={isMuted}
              loop={loop}
              onEnded={handleMediaEnd}
              className={`w-full h-full object-${fitMode}`}
              style={{
                objectPosition: 'center',
                transform: `rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          ) : (
            <>
              {/* MediaPlayer 接受任意媒体地址，图片源不可控，保留 <img> */}
              <img
                src={currentMedia.src}
                alt={currentMedia.alt || ''}
                className={`w-full h-full object-${fitMode}`}
                style={{
                  objectPosition: 'center',
                  transform: `rotate(${rotation}deg)`,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            </>
          )}
        </div>

        {/* 播放控件覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <div className="w-full flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={togglePlay}
                className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              </Button>
              
              {currentMedia.type === 'video' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleMute}
                  className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  aria-label={isMuted ? '取消静音' : '静音'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={rotateLeft}
                className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                aria-label="向左旋转"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={rotateRight}
                className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                aria-label="向右旋转"
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* 导航指示器 */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {mediaItems.map((item, index) => (
              <button
                key={item.src}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-6 bg-white' : 'w-3 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* 导航按钮 */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="上一个"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="下一个"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* 底部过渡渐变层 - 从不透明到底部透明，实现平滑过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>

      {/* 底部柔和阴影，增强层次感 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-glass-border/30 to-transparent shadow-lg pointer-events-none"></div>
    </div>
  );
}