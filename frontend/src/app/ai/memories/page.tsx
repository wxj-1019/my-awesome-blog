import type { Metadata } from 'next';
import MemoriesPageContent from './memories-content';

export const metadata: Metadata = {
  title: 'AI 记忆管理 - My Awesome Blog',
  description: '管理 AI 短期与长期记忆，支持语义搜索、分类筛选与过期清理。',
};

export default function MemoriesPage() {
  return <MemoriesPageContent />;
}
