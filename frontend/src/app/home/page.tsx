import type { Metadata } from 'next';
import HomeHubContent from './home-content';

export const metadata: Metadata = {
  title: '家 - My Awesome Blog',
  description: '音乐馆、视频与游戏入口。',
};

export default function HomeHubPage() {
  return <HomeHubContent />;
}
