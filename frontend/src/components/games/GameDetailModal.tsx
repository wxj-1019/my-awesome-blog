'use client';

import { motion, AnimatePresence } from '@/lib/framer-motion';
import { X, Calendar, Building2, Trophy, Clock, Star } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Game } from '@/types/game';

interface GameDetailModalProps {
  game: Game | null;
  onClose: () => void;
}

export default function GameDetailModal({ game, onClose }: GameDetailModalProps) {
  // reduced-motion 时禁用 layoutId 共享布局动画，回退为直接渲染
  const reducedMotion = useReducedMotion();

  if (!game) {return null;}

  return (
    <AnimatePresence>
      {game && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            layoutId={reducedMotion ? undefined : `game-card-${game.id}`}
            className="fixed inset-0 md:inset-10 md:max-w-4xl md:mx-auto md:h-fit bg-card rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-glass hover:bg-muted/40 rounded-full text-foreground transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-2/5 h-64 md:h-auto relative">
              {/* 游戏封面可能来自外部平台，域名不可控，保留 <img> */}
              <img
                src={game.coverImage}
                alt={game.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Right: Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center gap-2 mb-2">
                {game.platform.map(p => (
                  <span key={p} className="text-xs font-bold text-muted-foreground uppercase tracking-wider border border-glass-border px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>

              <h2 className="text-3xl font-bold text-card-foreground mb-4">{game.title}</h2>
              
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{game.releaseDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>{game.developer}</span>
                </div>
              </div>

              <p className="text-card-foreground leading-relaxed mb-8">
                {game.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1">
                    <Star className="w-4 h-4" />
                    我的评分
                  </div>
                  <div className="text-2xl font-bold text-warning">
                    {game.myRating || '-'}<span className="text-sm text-muted-foreground">/10</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1">
                    <Clock className="w-4 h-4" />
                    游玩时长
                  </div>
                  <div className="text-2xl font-bold text-info">
                    {game.playTime || 0}<span className="text-sm text-muted-foreground">小时</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1">
                    <Trophy className="w-4 h-4" />
                    成就进度
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {game.achievements ? Math.round((game.achievements.unlocked / game.achievements.total) * 100) : 0}<span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {game.genre.map(g => (
                  <span key={g} className="px-3 py-1 bg-muted/50 hover:bg-muted rounded-full text-xs text-muted-foreground transition-colors cursor-default">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
