'use client';

import { motion } from '@/lib/framer-motion';
import { Star, Clock } from 'lucide-react';
import type { Game } from '@/types/game';


interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  return (
    <motion.div
      layoutId={`game-card-${game.id}`}
      className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-muted/50"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(game)}
    >
      {/* Background Image */}
      {/* 游戏封面可能来自外部平台，域名不可控，保留 <img> */}
      <img
        src={game.coverImage}
        alt={game.title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
        <h3 className="text-card-foreground font-bold text-lg leading-tight mb-1">{game.title}</h3>
        <p className="text-muted-foreground text-xs mb-3">{game.developer}</p>
        
        <div className="flex items-center gap-3 text-card-foreground text-xs font-medium">
          {game.myRating && (
            <div className="flex items-center gap-1 bg-warning/20 px-1.5 py-0.5 rounded text-warning border border-warning/30">
              <Star className="w-3 h-3 fill-current" />
              <span>{game.myRating}</span>
            </div>
          )}
          {game.playTime && (
            <div className="flex items-center gap-1 bg-info/20 px-1.5 py-0.5 rounded text-info border border-info/30">
              <Clock className="w-3 h-3" />
              <span>{game.playTime}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      {game.status === 'Playing' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-success/90 backdrop-blur-md text-success-foreground text-[10px] font-bold rounded-full shadow-lg">
          PLAYING
        </div>
      )}
    </motion.div>
  );
}
