'use client';

import { useState } from 'react';
import GameSidebar from '@/components/games/GameSidebar';
import GameGrid from '@/components/games/GameGrid';
import HeroSection from '@/components/games/HeroSection';
import GameDetailModal from '@/components/games/GameDetailModal';
import { mockGames } from '@/mock/games';
import type { Game } from '@/types/game';

export default function GamesPageContent() {
  const [activeSection, setActiveSection] = useState('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Filter games based on active section
  const getFilteredGames = () => {
    switch (activeSection) {
      case 'recent':
        return mockGames.filter(g => g.status === 'Playing');
      case 'favorites':
        return mockGames.filter(g => g.isFavorite);
      case 'wishlist':
        return mockGames.filter(g => g.status === 'Wishlist');
      case 'completed':
        return mockGames.filter(g => g.status === 'Completed');
      default:
        return mockGames;
    }
  };

  const filteredGames = getFilteredGames();
  const featuredGame = mockGames[0]; // Elden Ring

  return (
    <div className="flex h-screen overflow-hidden pt-16">
      <GameSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-[1600px] mx-auto p-8">
          {/* Only show Hero Section on 'All' or 'Recent' tab */}
          {(activeSection === 'all' || activeSection === 'recent') && (
            <HeroSection
              game={featuredGame}
              onPlayClick={() => setSelectedGame(featuredGame)}
              onInfoClick={() => setSelectedGame(featuredGame)}
            />
          )}

          <GameGrid
            title={
              activeSection === 'all' ? '所有游戏' :
              activeSection === 'recent' ? '最近游玩' :
              activeSection === 'favorites' ? '我的收藏' :
              activeSection === 'wishlist' ? '愿望单' :
              activeSection === 'completed' ? '已通关' : '游戏列表'
            }
            games={filteredGames}
            onGameClick={(game) => setSelectedGame(game)}
          />
        </div>
      </main>

      <GameDetailModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}
