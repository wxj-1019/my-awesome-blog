'use client';

import { motion } from '@/lib/framer-motion';
import { Play, Info } from 'lucide-react';
import type { Game } from '@/types/game';

interface HeroSectionProps {
  game: Game;
  onPlayClick?: () => void;
  onInfoClick?: () => void;
}

export default function HeroSection({ game, onPlayClick, onInfoClick }: HeroSectionProps) {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-10 group shadow-2xl">
      {/* Background Image */}
      <img
        src={game.bannerImage || game.coverImage}
        alt={game.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            {game.platform.map(p => (
              <span key={p} className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-md uppercase tracking-wider">
                {p}
              </span>
            ))}
            <span className="px-2 py-1 bg-[#fa2d2f] text-white text-xs font-bold rounded-md uppercase tracking-wider">
              Featured
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
            {game.title}
          </h1>
          
          <p className="text-white/80 text-base md:text-lg mb-8 line-clamp-3 md:line-clamp-2 max-w-xl">
            {game.description}
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onPlayClick}
              className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-transform active:scale-95 shadow-lg shadow-white/10"
            >
              <Play className="w-5 h-5 fill-current" />
              开始游戏
            </button>
            <button
              onClick={onInfoClick}
              className="flex items-center gap-2 px-8 py-3 bg-white/20 backdrop-blur-xl text-white rounded-full font-bold hover:bg-white/30 transition-transform active:scale-95"
            >
              <Info className="w-5 h-5" />
              更多信息
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
