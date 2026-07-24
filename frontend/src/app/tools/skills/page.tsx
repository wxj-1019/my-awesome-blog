import type { Metadata } from 'next';
import SkillsContent from './skills-content';

export const metadata: Metadata = {
  title: 'Skill 收藏馆 - My Awesome Blog',
  description:
    '好用的 AI Agent Skills 全览与索引，点击进入沉浸式体验。',
};

/** Skill 收藏馆（/tools/skills）：Server 组件，仅挂载 metadata 与客户端编排 */
export default function SkillsPage() {
  return <SkillsContent />;
}
