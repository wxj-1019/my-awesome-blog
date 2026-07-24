import type { Metadata } from 'next';
import SkillsContent from './skills-content';

export const metadata: Metadata = {
  title: 'Skill 收藏馆 - My Awesome Blog',
  description:
    '电影式分幕滚动展示收藏的 AI Agent Skills：前端 taste、后端 superpowers 等好用技能一网打尽。',
};

/** Skill 收藏馆（/tools/skills）：Server 组件，仅挂载 metadata 与客户端编排 */
export default function SkillsPage() {
  return <SkillsContent />;
}
