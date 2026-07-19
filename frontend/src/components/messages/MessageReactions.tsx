'use client';

import { useState, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from '@/lib/framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REACTION_CATALOG } from '@/lib/emoji-icon-map';

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

interface Particle {
  id: string;
  x: number;
  y: number;
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
  const shouldReduceMotion = useReducedMotion();

  const hasReacted = (emoji: string) => {
    return reactions.find(r => r.emoji === emoji)?.users.includes(currentUser || '');
  };

  const createParticles = useCallback((x: number, y: number) => {
    if (shouldReduceMotion) {
      return;
    }

    const newParticles: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: `${messageId}-${Date.now()}-${i}`,
      x,
      y,
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
  }, [messageId, shouldReduceMotion]);

  const handleReactionClick = useCallback((emoji: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    createParticles(x, y);
    setActiveReaction(emoji);
    onReaction?.(emoji);

    setTimeout(() => setActiveReaction(null), 500);
  }, [onReaction, createParticles]);

  const motionScale = shouldReduceMotion
    ? undefined
    : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };
  const addMotionScale = shouldReduceMotion
    ? undefined
    : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {REACTION_CATALOG.map(({ key, icon: Icon, label }) => {
          const reaction = reactions.find(r => r.emoji === key);
          const count = reaction?.count || 0;
          const isReacted = hasReacted(key);

          return (
            <motion.button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              onClick={(e) => handleReactionClick(key, e)}
              className={cn(
                "relative flex items-center gap-1 px-2 py-1 rounded-full border",
                "text-sm transition-all duration-200",
                isReacted
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-muted/40 text-muted-foreground border-border hover:border-primary/30"
              )}
              {...motionScale}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {count > 0 && (
                <span className={cn(
                  "text-xs font-medium tabular-nums",
                  isReacted ? "text-primary" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              )}

              {activeReaction === key && !shouldReduceMotion && (
                <motion.div
                  className="absolute -inset-2 rounded-full bg-primary/10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
          {...addMotionScale}
        >
          <Sparkles className="w-3 h-3" />
          添加反应
        </motion.button>
      </div>

      <AnimatePresence mode="popLayout">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="fixed pointer-events-none z-50 w-2 h-2 rounded-full bg-primary"
            initial={{ x: particle.x, y: particle.y, scale: 0, opacity: 1 }}
            animate={{
              x: particle.x + particle.velocity.x,
              y: particle.y + particle.velocity.y,
              scale: 1.5,
              opacity: 0,
              rotate: particle.rotation
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default memo(MessageReactionsComponent);
