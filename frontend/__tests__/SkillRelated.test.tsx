import { render, screen } from '@testing-library/react';
import SkillRelated from '@/components/skills/SkillRelated';
import type { ShowcaseSkill } from '@/types/skill';

const related = [
  { slug: 'frontend-design', name: 'frontend-design', domain: '前端' as ShowcaseSkill['domain'] },
  { slug: 'superpowers', name: 'superpowers', domain: '后端' as ShowcaseSkill['domain'] },
];

describe('SkillRelated', () => {
  it('渲染关联 skill 卡片与跳转链接', () => {
    render(<SkillRelated related={related} />);
    expect(screen.getByText('frontend-design')).toBeInTheDocument();
    expect(screen.getByText('superpowers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /frontend-design/ })).toHaveAttribute(
      'href',
      '/tools/skills/frontend-design',
    );
    expect(screen.getByRole('link', { name: /superpowers/ })).toHaveAttribute(
      'href',
      '/tools/skills/superpowers',
    );
  });

  it('空数组不渲染', () => {
    const { container } = render(<SkillRelated related={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
