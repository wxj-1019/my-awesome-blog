'use client';

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Send, Pause, Play, MessageSquare, Sparkles } from 'lucide-react';
import { getMessages, createMessage, getDanmakuMessages, DANMAKU_COLORS, validateMessage } from '@/services/messageService';
import { getCurrentUserApi } from '@/lib/api/auth';
import { Message, UserProfile, DanmakuMessage } from '@/types';
import { cn } from '@/lib/utils';
import PageActHeader from '@/components/layout/PageActHeader';
import { FadeIn } from '@/components/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const COLORS = DANMAKU_COLORS.map(c => c.value);

const DANMAKU_CONFIG = {
  maxOnScreen: 25,
  minBatchSize: 1,
  maxBatchSize: 4,
  minBatchInterval: 400,
  maxBatchInterval: 1500,
  burstChance: 0.15,
  burstSize: { min: 3, max: 6 },
  quietAfterBurst: { min: 2000, max: 4000 },
  trackCount: 8,
  minDuration: 8,
  maxDuration: 16,
};

interface DanmakuTrack {
  y: number;
  occupied: boolean;
  releaseTime: number;
}

interface ActiveDanmakuItem extends DanmakuMessage {
  instanceId: string;
  startTime: number;
  y: number;
  duration: number;
  fontSize: number;
  displayColor: string;
  track: number;
}

function generateInstanceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MessagesPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [danmakuList, setDanmakuList] = useState<DanmakuMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeDanmaku, setActiveDanmaku] = useState<ActiveDanmakuItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);

  // 减少动态偏好：reduced 时不启动弹幕循环，入场动画静态
  const reducedMotion = useReducedMotion();
  
  const isPausedRef = useRef(false);
  const danmakuListRef = useRef<DanmakuMessage[]>([]);
  const activeDanmakuRef = useRef<ActiveDanmakuItem[]>([]);
  const schedulerRef = useRef<number | null>(null);
  const nextBatchTimeRef = useRef<number>(0);
  const poolIndexRef = useRef<number>(0);
  const poolRef = useRef<DanmakuMessage[]>([]);
  const tracksRef = useRef<DanmakuTrack[]>([]);

  useEffect(() => {
    tracksRef.current = Array.from({ length: DANMAKU_CONFIG.trackCount }, (_, i) => ({
      y: 5 + (i * 85 / (DANMAKU_CONFIG.trackCount - 1)),
      occupied: false,
      releaseTime: 0,
    }));
  }, []);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    danmakuListRef.current = danmakuList;
    if (danmakuList.length > 0) {
      poolRef.current = shuffleArray(danmakuList);
      poolIndexRef.current = 0;
    }
  }, [danmakuList]);

  useEffect(() => {
    activeDanmakuRef.current = activeDanmaku;
  }, [activeDanmaku]);

  useEffect(() => {
    loadData();
    return () => {
      if (schedulerRef.current) {
        cancelAnimationFrame(schedulerRef.current);
      }
    };
  }, []);

  const getNextFromPool = useCallback((): DanmakuMessage | null => {
    const pool = poolRef.current;
    if (pool.length === 0) {return null;}
    
    const item = pool[poolIndexRef.current];
    poolIndexRef.current = (poolIndexRef.current + 1) % pool.length;
    
    if (poolIndexRef.current === 0) {
      poolRef.current = shuffleArray(pool);
    }
    
    return item;
  }, []);

  const getAvailableTrack = useCallback((now: number): number => {
    const tracks = tracksRef.current;
    const active = activeDanmakuRef.current;
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const isOccupied = active.some(d => d.track === i);
      if (!isOccupied && track.releaseTime <= now) {
        return i;
      }
    }
    
    const availableTracks = tracks
      .map((t, i) => ({ index: i, releaseTime: t.releaseTime }))
      .filter(t => t.releaseTime <= now)
      .sort((a, b) => a.releaseTime - b.releaseTime);
    
    if (availableTracks.length > 0) {
      return availableTracks[Math.floor(Math.random() * availableTracks.length)].index;
    }
    
    return -1;
  }, []);

  const createDanmakuItem = useCallback((msg: DanmakuMessage, trackIndex: number): ActiveDanmakuItem => {
    const track = tracksRef.current[trackIndex];
    const duration = DANMAKU_CONFIG.minDuration + Math.random() * (DANMAKU_CONFIG.maxDuration - DANMAKU_CONFIG.minDuration);
    
    track.occupied = true;
    track.releaseTime = Date.now() + duration * 1000 * 0.3;
    
    return {
      ...msg,
      instanceId: generateInstanceId(),
      startTime: Date.now(),
      y: track.y + (Math.random() * 3 - 1.5),
      duration,
      fontSize: 0.875 + Math.random() * 0.375,
      displayColor: rainbowMode
        ? `hsl(${Math.random() * 360}, 80%, 65%)`
        : msg.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      track: trackIndex,
    };
  }, [rainbowMode]);

  useEffect(() => {
    if (danmakuList.length === 0) {return;}
    // 减少动态：不启动弹幕调度循环
    if (reducedMotion) {return;}

    let running = true;

    const scheduleNext = (_timestamp: number) => {
      if (!running) {return;}

      if (isPausedRef.current) {
        schedulerRef.current = requestAnimationFrame(scheduleNext);
        return;
      }

      const now = Date.now();
      
      if (now >= nextBatchTimeRef.current) {
        const currentActive = activeDanmakuRef.current;
        
        if (currentActive.length < DANMAKU_CONFIG.maxOnScreen) {
          const isBurst = Math.random() < DANMAKU_CONFIG.burstChance;
          let batchSize: number;
          let nextDelay: number;
          
          if (isBurst) {
            batchSize = DANMAKU_CONFIG.burstSize.min + 
              Math.floor(Math.random() * (DANMAKU_CONFIG.burstSize.max - DANMAKU_CONFIG.burstSize.min + 1));
            nextDelay = DANMAKU_CONFIG.quietAfterBurst.min + 
              Math.random() * (DANMAKU_CONFIG.quietAfterBurst.max - DANMAKU_CONFIG.quietAfterBurst.min);
          } else {
            batchSize = DANMAKU_CONFIG.minBatchSize + 
              Math.floor(Math.random() * (DANMAKU_CONFIG.maxBatchSize - DANMAKU_CONFIG.minBatchSize + 1));
            nextDelay = DANMAKU_CONFIG.minBatchInterval + 
              Math.random() * (DANMAKU_CONFIG.maxBatchInterval - DANMAKU_CONFIG.minBatchInterval);
          }
          
          const actualBatchSize = Math.min(batchSize, DANMAKU_CONFIG.maxOnScreen - currentActive.length);
          const newItems: ActiveDanmakuItem[] = [];
          const usedTracks = new Set<number>();
          
          for (let i = 0; i < actualBatchSize; i++) {
            const trackIndex = getAvailableTrack(now);
            if (trackIndex === -1 || usedTracks.has(trackIndex)) {continue;}
            
            const msg = getNextFromPool();
            if (!msg) {continue;}
            
            usedTracks.add(trackIndex);
            newItems.push(createDanmakuItem(msg, trackIndex));
          }
          
          if (newItems.length > 0) {
            setActiveDanmaku(prev => {
              const updated = [...prev, ...newItems];
              activeDanmakuRef.current = updated;
              return updated;
            });
          }
          
          nextBatchTimeRef.current = now + nextDelay;
        }
      }

      schedulerRef.current = requestAnimationFrame(scheduleNext);
    };

    schedulerRef.current = requestAnimationFrame(scheduleNext);

    return () => {
      running = false;
      if (schedulerRef.current) {
        cancelAnimationFrame(schedulerRef.current);
      }
    };
  }, [danmakuList.length, reducedMotion, getNextFromPool, getAvailableTrack, createDanmakuItem]);

  const removeDanmaku = useCallback((instanceId: string) => {
    setActiveDanmaku(prev => prev.filter(d => d.instanceId !== instanceId));
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [messagesData, danmakuData, user] = await Promise.all([
        getMessages(),
        getDanmakuMessages(),
        getCurrentUserApi().catch(() => null)
      ]);
      setMessages(messagesData);
      setDanmakuList(danmakuData);
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = validateMessage(content);
    if (!validation.isValid) {
      setError(validation.error || null);
      return;
    }

    setIsSubmitting(true);
    try {
      const newMessage = await createMessage({
        content: content.trim(),
        color: selectedColor,
        isDanmaku: true,
      });
      
      setMessages(prev => [newMessage, ...prev]);
      const newDanmaku: DanmakuMessage = {
        id: newMessage.id,
        content: newMessage.content,
        author: newMessage.author,
        created_at: newMessage.created_at,
        color: newMessage.color || selectedColor,
        speed: Math.random() * 3 + 2,
        y: Math.random() * 80 + 10,
        layer: Math.floor(Math.random() * 3) + 1,
      };
      setDanmakuList(prev => [newDanmaku, ...prev]);
      
      // 减少动态：弹幕不立即上屏，仅写入列表
      if (!reducedMotion) {
        const now = Date.now();
        const trackIndex = getAvailableTrack(now);
        const safeTrackIndex = trackIndex === -1 ? Math.floor(Math.random() * DANMAKU_CONFIG.trackCount) : trackIndex;
        const duration = Math.random() * 6 + 8;

        const newActiveItem: ActiveDanmakuItem = {
          ...newDanmaku,
          instanceId: generateInstanceId(),
          startTime: now,
          y: tracksRef.current[safeTrackIndex]?.y ?? (Math.random() * 75 + 5),
          duration,
          fontSize: Math.random() * 0.25 + 0.875,
          displayColor: rainbowMode
            ? `hsl(${Math.random() * 360}, 80%, 65%)`
            : newDanmaku.color || selectedColor,
          track: safeTrackIndex,
        };

        setActiveDanmaku(prev => {
          const updated = [...prev, newActiveItem];
          activeDanmakuRef.current = updated;
          return updated;
        });
      }
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, selectedColor, rainbowMode, reducedMotion, getAvailableTrack]);

  const isLoggedIn = !!currentUser;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-tech-cyan border-t-transparent rounded-full animate-spin motion-reduce:animate-none mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
        {activeDanmaku.map((msg) => (
          <DanmakuItem
            key={msg.instanceId}
            message={msg}
            isPaused={isPaused}
            instanceId={msg.instanceId}
            reducedMotion={reducedMotion}
            onRemove={removeDanmaku}
          />
        ))}
      </div>

      <div className="fixed top-4 right-4 z-[101] flex gap-2">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "backdrop-blur-md border transition-all duration-300 cursor-pointer",
            isPaused
              ? "bg-warning/20 text-warning border-warning/50"
              : "bg-tech-cyan/20 text-tech-cyan border-tech-cyan/50"
          )}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          <span className="text-sm">{isPaused ? '播放' : '暂停'}</span>
        </button>
        
        <button
          onClick={() => setRainbowMode(!rainbowMode)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "backdrop-blur-md border transition-all duration-300 cursor-pointer",
            rainbowMode
              ? "bg-primary/20 text-primary border-primary/50"
              : "bg-glass text-muted-foreground border-glass-border"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">{rainbowMode ? '彩虹' : '标准'}</span>
        </button>
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <PageActHeader
          kicker="弹幕广场 · MESSAGES"
          title="留言板"
          description="发送你的弹幕，和大家一起互动"
          className="mb-8"
        />

        <FadeIn direction="up" delay={0.1} className="w-full max-w-xl">
          <div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-2xl">
            {!isLoggedIn ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-tech-cyan/50" />
                <p className="text-foreground mb-3">登录后即可发送弹幕</p>
                <a
                  href="/login"
                  className="inline-block px-6 py-2 bg-tech-cyan/20 text-tech-cyan rounded-full hover:bg-tech-cyan/30 transition-colors"
                >
                  去登录
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan to-tech-lightcyan flex items-center justify-center text-primary-foreground font-bold">
                    {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-foreground font-medium">{currentUser?.username}</span>
                </div>

                <div className="relative mb-4">
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isSubmitting && content.trim()) {
                          handleSubmit(e);
                        }
                      }
                    }}
                    placeholder="写下你的弹幕... (Enter 发送)"
                    maxLength={200}
                    rows={3}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl resize-none",
                      "bg-glass border border-glass-border",
                      "focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-tech-cyan",
                      "placeholder:text-muted-foreground/60 text-foreground",
                      "transition-all duration-200"
                    )}
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/60">
                    {content.length}/200
                  </div>
                </div>

                {error && (
                  <p className="text-destructive text-sm mb-3">{error}</p>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">颜色:</span>
                    <div className="flex gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all duration-200 cursor-pointer",
                            selectedColor === color && "ring-2 ring-primary ring-offset-2 ring-offset-transparent scale-110"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl",
                      "bg-gradient-to-r from-tech-cyan to-tech-lightcyan",
                      "text-primary-foreground font-medium",
                      "hover:opacity-90 transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "cursor-pointer"
                    )}
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? '发送中...' : '发送弹幕'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              已有 {messages.length} 条弹幕在空中飘过
            </p>
          </div>
        </FadeIn>
      </div>

    </div>
  );
}

interface DanmakuItemProps {
  message: ActiveDanmakuItem;
  isPaused: boolean;
  instanceId: string;
  reducedMotion: boolean;
  onRemove: (instanceId: string) => void;
}

function DanmakuItem({ message, isPaused, instanceId, reducedMotion, onRemove }: DanmakuItemProps) {
  const hasCompletedRef = useRef(false);
  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useLayoutEffect(() => {
    if (!elementRef.current || isInitializedRef.current) {return;}

    isInitializedRef.current = true;

    // 减少动态：不启动 WAAPI 位移动画，直接移除（父级已关闭弹幕循环，此处兜底）
    if (reducedMotion) {
      hasCompletedRef.current = true;
      onRemove(instanceId);
      return;
    }

    const element = elementRef.current;
    
    const animation = element.animate(
      [
        { transform: 'translateX(100vw)', opacity: 0 },
        { transform: 'translateX(100vw)', opacity: 1, offset: 0.02 },
        { transform: 'translateX(-5%)', opacity: 1, offset: 0.95 },
        { transform: 'translateX(-5%)', opacity: 0 },
      ],
      {
        duration: message.duration * 1000,
        easing: 'linear',
        fill: 'forwards',
      }
    );

    animationRef.current = animation;

    animation.onfinish = () => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onRemove(instanceId);
      }
    };

    return () => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
      }
      animation.cancel();
    };
  }, [message.duration, instanceId, reducedMotion, onRemove]);

  useEffect(() => {
    if (animationRef.current) {
      if (isPaused) {
        animationRef.current.pause();
      } else {
        animationRef.current.play();
      }
    }
  }, [isPaused]);

  return (
    <div
      ref={elementRef}
      className="absolute whitespace-nowrap pointer-events-auto cursor-default"
      style={{ 
        top: `${message.y}%`,
        transform: 'translateX(100vw)',
        opacity: 0,
        willChange: 'transform, opacity',
      }}
    >
      <span
        className="inline-block px-4 py-1.5 rounded-full font-medium backdrop-blur-md border"
        style={{
          fontSize: `${message.fontSize}rem`,
          color: message.displayColor,
          background: 'rgba(0,0,0,0.5)',
          borderColor: `${message.displayColor}40`,
          textShadow: '0 0 8px rgba(0,0,0,0.8)',
        }}
      >
        {message.content}
      </span>
    </div>
  );
}
