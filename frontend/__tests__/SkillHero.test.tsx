import { render, screen } from '@testing-library/react';
import SkillHero from '@/components/skills/SkillHero';

/** framer-motion 透传为真实 DOM，hooks 返回静态值（与 SkillAct 测试一致） */
jest.mock('@/lib/framer-motion', () => {
  const React = require('react');
  const motionProxy = new Proxy(
    {},
    {
      get: () => React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('div', { ...props, ref }, children)
      ),
    }
  );
  return {
    motion: motionProxy,
    useScroll: () => ({ scrollYProgress: { set: () => {}, get: () => 0, on: () => () => {} } }),
    useTransform: () => 0,
  };
});

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('SkillHero · 收藏馆开场', () => {
  it('渲染幕标小标题与副标题文案', () => {
    render(<SkillHero />);

    expect(screen.getByText('THE SKILL COLLECTION')).toBeInTheDocument();
    expect(screen.getByText('收录让我在写代码时如虎添翼的 AI Agent Skills')).toBeInTheDocument();
  });

  it('标题逐字渲染「Skill」与「收藏馆」两组', () => {
    const { container } = render(<SkillHero />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Skill收藏馆');
    // 两组字符包在 h1 > span 内；mock 后 motion.span 渲染为 div，故字符层为 span > div
    const groupSpans = h1?.querySelectorAll(':scope > span');
    expect(groupSpans?.length).toBe(2);
    // 每个字符独立一层：Skill(5) + 收藏馆(3) = 8 个字
    const charEls = h1?.querySelectorAll('span > div');
    expect(charEls?.length).toBe(8);
  });

  it('渲染向下滚动提示文案与图标', () => {
    render(<SkillHero />);
    expect(screen.getByText('向下滚动')).toBeInTheDocument();
  });

  it('section 带 aria-label 可访问名称', () => {
    render(<SkillHero />);
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-label', 'Skill 收藏馆开场');
  });

  it('全屏开场占满视口（min-h-screen）', () => {
    const { container } = render(<SkillHero />);
    const section = container.querySelector('section');
    expect(section?.className).toContain('min-h-screen');
  });
});
