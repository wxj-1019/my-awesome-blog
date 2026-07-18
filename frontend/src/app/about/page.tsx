import type { Metadata } from 'next';
import AboutPageContent from './about-content';

export const metadata: Metadata = {
  title: '关于我 - My Awesome Blog',
  description: '了解博主、博客主题与联系方式，探索技术、设计与 Web 开发的内容分享。',
};

export default function AboutPage() {
  return <AboutPageContent />;
}
