import type { Metadata } from 'next';
import VideosPageContent from './videos-content';

export const metadata: Metadata = {
  title: '我的视频 - My Awesome Blog',
  description: '记录电影、剧集和动漫的收藏与观看进度，管理您的追剧清单。',
};

export default function VideosPage() {
  return <VideosPageContent />;
}
