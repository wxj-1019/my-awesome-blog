'use client';

import { motion } from '@/lib/framer-motion';
import GameCard from './GameCard';
import type { Game } from '@/types/game';

interface GameGridProps {
  title: string;
  games: Game[];
  onGameClick: (game: Game) => void;
}

export default function GameGrid({ title, games, onGameClick }: GameGridProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xl font-bold text-white/90">{title}</h2>
        <span className="text-sm text-white/50 font-medium">
          {games.length} 款游戏
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GameCard game={game} onClick={onGameClick} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
