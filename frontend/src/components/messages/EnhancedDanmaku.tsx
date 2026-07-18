'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Play, Pause, Rainbow, Layers, Zap, Copy, Flag, Info, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface DanmakuMessage {
  id: string;
  content: string;
  color: string;
  speed: number;
  y: number;
  layer: number;
  message?: Message; // 完整的留言信息
}

interface EnhancedDanmakuProps {
  messages: DanmakuMessage[];
  className?: string;
  isPaused?: boolean;
  onTogglePause?: () => void;
  rainbowMode?: boolean;
  onToggleRainbow?: () => void;
  onMessageClick?: (messageId: string) => void; // 点击弹幕查看原留言
  onCopyMessage?: (content: string) => void; // 复制弹幕内容
  onReportMessage?: (messageId: string) => void; // 举报弹幕
  onBlockUser?: (userId: string) => void; // 屏蔽用户
}

const LAYERS = [
  { zIndex: 100, speed: 15, opacity: 0.7, scale: 0.9 },
  { zIndex: 200, speed: 20, opacity: 0.85, scale: 0.95 },
  { zIndex: 300, speed: 25, opacity: 1, scale: 1 }
];

const COLLISION_THRESHOLD = 30;

export default function EnhancedDanmaku({
  messages,
  className,
  isPaused = false,
  onTogglePause,
  rainbowMode = false,
  onToggleRainbow,
  onMessageClick,
  onCopyMessage,
  onReportMessage,
  onBlockUser
}: EnhancedDanmakuProps) {
  const [activeMessages, setActiveMessages] = useState<DanmakuMessage[]>([]);
  const [maxDanmakuCount, setMaxDanmakuCount] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const processedIndexRef = useRef(0);
  const activeMessagesRef = useRef<DanmakuMessage[]>([]);

  // 悬停状态
  const [hoveredMessage, setHoveredMessage] = useState<DanmakuMessage | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: DanmakuMessage;
  } | null>(null);

  // 同步 ref 与 state
  useEffect(() => {
    activeMessagesRef.current = activeMessages;
  }, [activeMessages]);

  // 当 messages 变化时清空 activeMessages
  useEffect(() => {
    setActiveMessages([]);
    processedIndexRef.current = 0;
  }, [messages]);

  // 响应式弹幕数量限制
  useEffect(() => {
    const updateMaxDanmakuCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setMaxDanmakuCount(25); // 移动端：减少弹幕密度
      } else if (width < 1024) {
        setMaxDanmakuCount(35); // 平板端：中等密度
      } else {
        setMaxDanmakuCount(50); // 桌面端：完整密度
      }
    };

    updateMaxDanmakuCount();
    window.addEventListener('resize', updateMaxDanmakuCount);
    return () => window.removeEventListener('resize', updateMaxDanmakuCount);
  }, []);

  const getRandomPosition = useCallback(() => {
    return Math.random() * 70 + 10;
  }, []);

  const getRandomLayer = useCallback(() => {
    return Math.floor(Math.random() * LAYERS.length);
  }, []);

  const getRandomSpeed = useCallback((layer: number) => {
    const baseSpeed = LAYERS[layer].speed;
    return baseSpeed + Math.random() * 10 - 5;
  }, []);

  const checkCollision = useCallback((newY: number, existingMessages: DanmakuMessage[]) => {
    for (const msg of existingMessages) {
      const distance = Math.abs(newY - msg.y);
      if (distance < COLLISION_THRESHOLD) {
        return true;
      }
    }
    return false;
  }, []);

  const limitedMessages = useMemo(() => {
    return messages.slice(0, maxDanmakuCount);
  }, [messages, maxDanmakuCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {return;}

    processedIndexRef.current = 0;

    const processNext = () => {
      if (processedIndexRef.current >= limitedMessages.length) {
        return;
      }

      if (activeMessagesRef.current.length >= maxDanmakuCount) {
        return;
      }

      const msg = limitedMessages[processedIndexRef.current];
      let newY = getRandomPosition();
      let attempts = 0;
      const maxAttempts = 20;

      while (checkCollision(newY, activeMessagesRef.current) && attempts < maxAttempts) {
        newY = getRandomPosition();
        attempts++;
      }

      const layer = getRandomLayer();
      const speed = getRandomSpeed(layer);

      const danmakuMsg: DanmakuMessage = {
        ...msg,
        y: newY,
        layer,
        speed
      };

      setActiveMessages(prev => {
        // 检查是否已存在相同 id 的消息
        if (prev.some(m => m.id === danmakuMsg.id)) {
          return prev;
        }
        const newMessages = [...prev, danmakuMsg];
        return newMessages.slice(-maxDanmakuCount);
      });

      processedIndexRef.current++;

      const delay = Math.random() * 500 + 200;
      const timerId = setTimeout(processNext, delay);
      timersRef.current.push(timerId);
    };

    if (limitedMessages.length > 0) {
      setTimeout(processNext, 100);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [limitedMessages, getRandomPosition, getRandomLayer, getRandomSpeed, checkCollision, maxDanmakuCount]);

  const handleMessageComplete = useCallback((id: string) => {
    setActiveMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  // 点击弹幕处理
  const handleDanmakuClick = useCallback((e: React.MouseEvent, msg: DanmakuMessage) => {
    e.stopPropagation();
    if (onMessageClick && msg.message) {
      onMessageClick(msg.message.id);
    }
  }, [onMessageClick]);

  // 悬停处理
  const handleMouseEnter = useCallback((e: React.MouseEvent, msg: DanmakuMessage) => {
    setHoveredMessage(msg);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredMessage(null);
  }, []);

  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent, msg: DanmakuMessage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg
    });
  }, []);

  // 复制弹幕内容
  const handleCopy = useCallback(() => {
    if (contextMenu && onCopyMessage) {
      onCopyMessage(contextMenu.message.content);
    }
    setContextMenu(null);
  }, [contextMenu, onCopyMessage]);

  // 举报弹幕
  const handleReport = useCallback(() => {
    if (contextMenu && onReportMessage && contextMenu.message.message) {
      onReportMessage(contextMenu.message.message.id);
    }
    setContextMenu(null);
  }, [contextMenu, onReportMessage]);

  // 屏蔽用户
  const handleBlockUser = useCallback(() => {
    if (contextMenu && onBlockUser && contextMenu.message.message) {
      onBlockUser(contextMenu.message.message.author.id);
    }
    setContextMenu(null);
  }, [contextMenu, onBlockUser]);

  // 点击菜单外部关闭
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {activeMessages.map((msg) => {
            const layerConfig = LAYERS[msg.layer];
            const isPausedLayer = isPaused;

            return (
              <motion.div
                key={msg.id}
                initial={{ x: '100vw', opacity: 0 }}
                animate={isPausedLayer ? { x: '100vw' } : { x: '-100vw', opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: msg.speed,
                  ease: "linear",
                  times: [0, 0.05, 0.95, 1]
                }}
                onAnimationComplete={() => !isPausedLayer && handleMessageComplete(msg.id)}
                className="absolute whitespace-nowrap cursor-pointer pointer-events-auto"
                style={{
                  top: `${msg.y}%`,
                  zIndex: layerConfig.zIndex,
                  opacity: layerConfig.opacity,
                  transform: `translateZ(0) scale(${layerConfig.scale})`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                onClick={(e) => handleDanmakuClick(e, msg)}
                onMouseEnter={(e) => handleMouseEnter(e, msg)}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e) => handleContextMenu(e, msg)}
              >
                <span
                  className={cn(
                    "text-lg font-bold px-4 py-1.5 rounded-full backdrop-blur-md border",
                    "inline-block transition-all duration-200",
                    "hover:scale-105 hover:shadow-lg",
                    rainbowMode ? "animate-rainbow-shift" : ""
                  )}
                  style={{
                    color: rainbowMode ? 'hsl(var(--rainbow-hue), 80%, 60%)' : msg.color,
                    background: rainbowMode
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.6)',
                    borderColor: rainbowMode
                      ? 'hsl(var(--rainbow-hue), 80%, 60%)'
                      : `${msg.color}60`,
                    boxShadow: rainbowMode
                      ? '0 0 20px hsl(var(--rainbow-hue), 80%, 60%, 0.3)'
                      : `0 0 15px ${msg.color}40`,
                    textShadow: '0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)',
                    transform: 'translateZ(0)',
                    WebkitFontSmoothing: 'antialiased',
                    textRendering: 'optimizeLegibility'
                  }}
                >
                  {msg.content}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 悬停信息提示 */}
      <AnimatePresence>
        {hoveredMessage && hoveredMessage.message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[10001] pointer-events-none"
            style={{
              left: Math.min(hoverPosition.x + 15, window.innerWidth - 280),
              top: Math.min(hoverPosition.y + 15, window.innerHeight - 200)
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-md border border-tech-cyan/30 rounded-lg p-3 shadow-xl min-w-[260px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tech-cyan/20 to-tech-purple/20 flex items-center justify-center border border-tech-cyan/30">
                  <span className="text-xs font-bold text-white">
                    {hoveredMessage.message.author.username[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    @{hoveredMessage.message.author.username}
                  </div>
                  <div className="text-xs text-white/50">
                    {new Date(hoveredMessage.message.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
              <div className="text-sm text-white/80 break-words mb-2">
                {hoveredMessage.message.content}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                {hoveredMessage.message.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {hoveredMessage.message.likes} 点赞
                  </span>
                )}
                {hoveredMessage.message.replies && hoveredMessage.message.replies.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {hoveredMessage.message.replies.length} 回复
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右键菜单 */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[10002] bg-slate-900/98 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-2 min-w-[160px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 200)
            }}
          >
            <button
              onClick={handleCopy}
              className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
            >
              <Copy className="w-4 h-4" />
              复制内容
            </button>
            <button
              onClick={handleReport}
              className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
            >
              <Flag className="w-4 h-4" />
              举报
            </button>
            <button
              onClick={handleBlockUser}
              className="w-full px-4 py-2 text-left text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-3 transition-colors"
            >
              <X className="w-4 h-4" />
              屏蔽用户
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePause}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
              isPaused
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                : "bg-tech-cyan/20 text-tech-cyan border-tech-cyan/50"
            )}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-xs font-medium">
              {isPaused ? '播放弹幕' : '暂停弹幕'}
            </span>
          </button>

          <button
            onClick={onToggleRainbow}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
              rainbowMode
                ? "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white border-white/50"
                : "bg-black/40 text-white/70 border-white/10 hover:border-white/30"
            )}
          >
            <Rainbow className={cn("w-4 h-4", rainbowMode && "animate-spin")} />
            <span className="text-xs font-medium">
              {rainbowMode ? '彩虹模式' : '标准模式'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
          <Layers className="w-3 h-3 text-white/50" />
          <span className="text-xs text-white/50">
            {activeMessages.length}/{limitedMessages.length}
          </span>
        </div>
      </div>

      <motion.div
        className="fixed top-20 left-4 z-[10000] flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md"
        style={{
          borderColor: 'rgba(0,217,255,0.3)',
          background: 'rgba(0,217,255,0.05)'
        }}
        animate={isPaused ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Zap className="w-4 h-4 text-tech-cyan animate-pulse" />
        <span className="text-xs font-medium text-tech-cyan">
          {isPaused ? '已暂停' : '运行中'}
        </span>
      </motion.div>
    </div>
  );
}
