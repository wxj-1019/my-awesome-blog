'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Rocket, Sparkles, Heart, ThumbsUp, ThumbsDown, Laugh } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: Reaction[];
  currentUser?: string | null;
  onReaction?: (emoji: string) => void;
}

const REACTION_TYPES = [
  { emoji: '❤️', label: 'love', icon: Heart },
  { emoji: '👍', label: 'like', icon: ThumbsUp },
  { emoji: '👎', label: 'dislike', icon: ThumbsDown },
  { emoji: '🔥', label: 'fire', icon: Flame },
  { emoji: '😂', label: 'laugh', icon: Laugh },
  { emoji: '🚀', label: 'rocket', icon: Rocket },
  { emoji: '✨', label: 'sparkles', icon: Sparkles }
];

interface Particle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  rotation: number;
  velocity: { x: number; y: number };
}

const MessageReactionsComponent = function MessageReactions({
  messageId,
  reactions = [],
  currentUser,
  onReaction
}: MessageReactionsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasReacted = (emoji: string) => {
    return reactions.find(r => r.emoji === emoji)?.users.includes(currentUser || '');
  };

  const handleReactionClick = useCallback((emoji: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    createParticles(emoji, x, y);
    setActiveReaction(emoji);
    onReaction?.(emoji);

    setTimeout(() => setActiveReaction(null), 500);
  }, [onReaction]);

  const createParticles = (emoji: string, x: number, y: number) => {
    const newParticles: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: `${messageId}-${emoji}-${Date.now()}-${i}`,
      x,
      y,
      emoji,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 150,
        y: -Math.random() * 150 - 50
      }
    }));

    setParticles(newParticles);

    setTimeout(() => {
      setParticles([]);
    }, 800);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {REACTION_TYPES.map(({ emoji, label, icon: Icon }) => {
          const reaction = reactions.find(r => r.emoji === emoji);
          const count = reaction?.count || 0;
          const isReacted = hasReacted(emoji);

          return (
            <motion.button
              key={emoji}
              onClick={(e) => handleReactionClick(emoji, e)}
              className={cn(
                "relative flex items-center gap-1 px-2 py-1 rounded-full",
                "text-sm transition-all duration-200",
                isReacted
                  ? "bg-tech-cyan/20 text-tech-cyan border-tech-cyan/50"
                  : "bg-black/40 text-white/70 border-white/10 hover:border-white/30"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{emoji}</span>
              {count > 0 && (
                <span className={cn(
                  "text-xs font-medium",
                  isReacted ? "text-tech-cyan" : "text-white/60"
                )}>
                  {count}
                </span>
              )}

              {activeReaction === emoji && (
                <motion.div
                  className="absolute -inset-2 rounded-full bg-tech-cyan/10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.button>
          );
        })}

        <motion.button
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-3 h-3" />
          添加反应
        </motion.button>
      </div>

      <AnimatePresence mode="popLayout">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="fixed pointer-events-none z-50 text-2xl"
            initial={{ x: particle.x, y: particle.y, scale: 0, opacity: 1 }}
            animate={{
              x: particle.x + particle.velocity.x,
              y: particle.y + particle.velocity.y,
              scale: 1.5,
              opacity: 0,
              rotate: particle.rotation
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default memo(MessageReactionsComponent);
