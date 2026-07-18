import type { Metadata } from 'next';
import MusicHallPageContent from './music-content';

export const metadata: Metadata = {
  title: '音乐馆 - My Awesome Blog',
  description: '发现推荐歌单、最新音乐和热门歌手，享受沉浸式音乐体验。',
};

export default function MusicHallPage() {
  return <MusicHallPageContent />;
}
