import type { Metadata } from 'next';
import SkillsContent from './skills-content';

export const metadata: Metadata = {
  title: 'AI 工具收藏 - My Awesome Blog',
  description:
    '收藏优秀的 Skill 与 MCP，让 AI 助手更好用。',
};

/** AI 工具收藏（/tools/skills）：Server 组件，仅挂载 metadata 与客户端编排 */
export default function SkillsPage() {
  return <SkillsContent />;
}
