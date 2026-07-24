import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { showcaseSkills } from '@/mock/skills';
import SkillDetailContent from './skill-detail-content';

/** 静态导出全部 skill 详情页 */
export function generateStaticParams() {
  return showcaseSkills.map((skill) => ({ slug: skill.slug }));
}

/** 按 slug 查找 skill，未命中返回 undefined */
function findSkill(slug: string) {
  return showcaseSkills.find((skill) => skill.slug === slug);
}

interface PageProps {
  /** Next.js 16：params 为 Promise，需 await */
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const skill = findSkill(slug);

  if (!skill) {
    return { title: 'Skill 未找到 - Skill 收藏馆' };
  }

  return {
    title: `${skill.name} - Skill 收藏馆`,
    description: skill.tagline,
  };
}

/** Skill 详情页（/tools/skills/[slug]）：Server 组件，查数据并挂载客户端编排 */
export default async function SkillDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const index = showcaseSkills.findIndex((skill) => skill.slug === slug);

  if (index === -1) {
    notFound();
  }

  const skill = showcaseSkills[index];
  const total = showcaseSkills.length;
  /** 按数组顺序循环取相邻 skill */
  const prevSkill = showcaseSkills[(index - 1 + total) % total];
  const nextSkill = showcaseSkills[(index + 1) % total];

  return (
    <SkillDetailContent
      skill={skill}
      prev={{ slug: prevSkill.slug, name: prevSkill.name }}
      next={{ slug: nextSkill.slug, name: nextSkill.name }}
    />
  );
}
