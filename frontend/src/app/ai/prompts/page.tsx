import type { Metadata } from 'next';
import PromptsPageContent from './prompts-content';

export const metadata: Metadata = {
  title: 'AI 提示词管理 - My Awesome Blog',
  description: '创建、编辑和管理 AI 提示词模板，按分类与状态快速筛选。',
};

export default function PromptsPage() {
  return <PromptsPageContent />;
}
