import type { Metadata } from 'next';
import AlbumsPageContent from './albums-content';

export const metadata: Metadata = {
  title: '我的相册 - My Awesome Blog',
  description: '浏览摄影作品、生活相册与视觉记录，用镜头捕捉每一个精彩瞬间。',
};

export default function AlbumsPage() {
  return <AlbumsPageContent />;
}
