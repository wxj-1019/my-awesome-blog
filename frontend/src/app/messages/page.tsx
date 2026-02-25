'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Pause, Play, MessageSquare, Sparkles } from 'lucide-react';
import { getMessages, createMessage, getDanmakuMessages, DANMAKU_COLORS, validateMessage } from '@/services/messageService';
import { getCurrentUserApi } from '@/lib/api/auth';
import { Message, UserProfile, DanmakuMessage } from '@/types';
import { cn } from '@/lib/utils';

const COLORS = DANMAKU_COLORS.map(c => c.value);

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [danmakuList, setDanmakuList] = useState<DanmakuMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeDanmaku, setActiveDanmaku] = useState<DanmakuMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);
  
  const activeDanmakuRef = useRef<DanmakuMessage[]>([]);
  const danmakuIndexRef = useRef(0);

  useEffect(() => {
    activeDanmakuRef.current = activeDanmaku;
  }, [activeDanmaku]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (danmakuList.length === 0) return;
    
    const timeouts: NodeJS.Timeout[] = [];
    
    const scheduleNext = () => {
      if (isPaused) {
        const timeout = setTimeout(scheduleNext, 500);
        timeouts.push(timeout);
        return;
      }
      
      const currentActive = activeDanmakuRef.current;
      if (currentActive.length >= 25) {
        const timeout = setTimeout(scheduleNext, 800);
        timeouts.push(timeout);
        return;
      }
      
      const availableMsgs = danmakuList.filter(
        msg => !currentActive.find(d => d.id === msg.id)
      );
      
      if (availableMsgs.length > 0) {
        const randomMsg = availableMsgs[Math.floor(Math.random() * availableMsgs.length)];
        setActiveDanmaku(prev => {
          const newList = [...prev.slice(-24), randomMsg];
          activeDanmakuRef.current = newList;
          return newList;
        });
      }
      
      const randomDelay = Math.random() * 800 + 400;
      const timeout = setTimeout(scheduleNext, randomDelay);
      timeouts.push(timeout);
    };
    
    const initialDelay = setTimeout(scheduleNext, 300);
    timeouts.push(initialDelay);
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isPaused, danmakuList]);

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
      setActiveDanmaku(prev => {
        const newList = [...prev.slice(-29), newDanmaku];
        activeDanmakuRef.current = newList;
        return newList;
      });
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, selectedColor]);

  const isLoggedIn = !!currentUser;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
        {activeDanmaku.map((msg, index) => (
          <DanmakuItem
            key={`${msg.id}-${index}-${Date.now()}`}
            message={msg}
            isPaused={isPaused}
            rainbowMode={rainbowMode}
            onComplete={() => {
              setActiveDanmaku(prev => prev.filter(d => d.id !== msg.id));
            }}
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
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
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
              ? "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white border-white/50"
              : "bg-black/40 text-white/70 border-white/10"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">{rainbowMode ? '彩虹' : '标准'}</span>
        </button>
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            留言板
          </h1>
          <p className="text-white/60 text-lg">
            发送你的弹幕，和大家一起互动
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-xl"
        >
          <div className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-2xl p-6 shadow-2xl">
            {!isLoggedIn ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-tech-cyan/50" />
                <p className="text-white/80 mb-3">登录后即可发送弹幕</p>
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan to-tech-lightcyan flex items-center justify-center text-white font-bold">
                    {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-white font-medium">{currentUser?.username}</span>
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
                      "bg-white/5 border border-white/10",
                      "focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-tech-cyan",
                      "placeholder:text-white/30 text-white",
                      "transition-all duration-200"
                    )}
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-white/30">
                    {content.length}/200
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">颜色:</span>
                    <div className="flex gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all duration-200 cursor-pointer",
                            selectedColor === color && "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110"
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
                      "text-white font-medium",
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
            <p className="text-white/40 text-sm">
              已有 {messages.length} 条弹幕在空中飘过
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

interface DanmakuItemProps {
  message: DanmakuMessage;
  isPaused: boolean;
  rainbowMode: boolean;
  onComplete: () => void;
}

function DanmakuItem({ message, isPaused, rainbowMode, onComplete }: DanmakuItemProps) {
  const yRef = useRef(Math.random() * 75 + 5);
  const durationRef = useRef(Math.random() * 8 + 8);
  const fontSizeRef = useRef(Math.random() * 0.25 + 0.875);
  const delayRef = useRef(Math.random() * 0.3);
  const colorRef = useRef(
    rainbowMode 
      ? `hsl(${Math.random() * 360}, 80%, 60%)` 
      : message.color || COLORS[Math.floor(Math.random() * COLORS.length)]
  );

  return (
    <div
      className={cn(
        "absolute whitespace-nowrap pointer-events-auto cursor-default",
        isPaused ? "[animation-play-state:paused]" : ""
      )}
      style={{ 
        top: `${yRef.current}%`,
        animation: `danmaku-scroll ${durationRef.current}s linear ${delayRef.current}s forwards`,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      onAnimationEnd={() => {
        if (!isPaused) onComplete();
      }}
    >
      <span
        className={cn(
          "inline-block px-4 py-1.5 rounded-full",
          "font-medium",
          "backdrop-blur-md border",
          rainbowMode && "animate-pulse"
        )}
        style={{
          fontSize: `${fontSizeRef.current}rem`,
          color: colorRef.current,
          background: 'rgba(0,0,0,0.5)',
          borderColor: `${colorRef.current}40`,
          textShadow: '0 0 8px rgba(0,0,0,0.8)',
        }}
      >
        {message.content}
      </span>
    </div>
  );
}
