'use client';

import { motion } from 'framer-motion';
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
      className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-black/5 dark:bg-white/5"
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(game)}
    >
      {/* Background Image */}
      {/* 游戏封面可能来自外部平台，域名不可控，保留 <img> */}
      <img
        src={game.coverImage}
        alt={game.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
        <h3 className="text-white font-bold text-lg leading-tight mb-1">{game.title}</h3>
        <p className="text-white/70 text-xs mb-3">{game.developer}</p>
        
        <div className="flex items-center gap-3 text-white/90 text-xs font-medium">
          {game.myRating && (
            <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-400 border border-yellow-500/30">
              <Star className="w-3 h-3 fill-current" />
              <span>{game.myRating}</span>
            </div>
          )}
          {game.playTime && (
            <div className="flex items-center gap-1 bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-400 border border-blue-500/30">
              <Clock className="w-3 h-3" />
              <span>{game.playTime}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      {game.status === 'Playing' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full shadow-lg">
          PLAYING
        </div>
      )}
    </motion.div>
  );
}
