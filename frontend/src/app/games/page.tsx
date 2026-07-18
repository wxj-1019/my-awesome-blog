import type { Metadata } from 'next';
import GamesPageContent from './games-content';

export const metadata: Metadata = {
  title: '游戏库 - My Awesome Blog',
  description: '探索我的游戏收藏、最近在玩和通关记录，分享游戏心得与推荐。',
};

export default function GamesPage() {
  return <GamesPageContent />;
}
