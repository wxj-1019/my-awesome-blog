import { render, screen } from '@testing-library/react';
import SkillAct from '@/components/skills/SkillAct';
import type { ShowcaseSkill } from '@/types/skill';

/**
 * framer-motion 的 useScroll/useTransform 依赖真实滚动布局，jsdom 下不稳定。
 * 将 motion 透传为真实 DOM 元素（便于内容断言），hooks 返回静态值。
 */
jest.mock('@/lib/framer-motion', () => {
  const React = require('react');
  // 透传 motion：motion.div → 真实 div，保留 children/className/style
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
    // useScroll 返回固定 progress，useTransform 返回固定位移
    useScroll: () => ({ scrollYProgress: { set: () => {}, get: () => 0, on: () => () => {} } }),
    useTransform: () => 0,
  };
});

// useReducedMotion 默认返回 false（带动画分支）
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const baseSkill: ShowcaseSkill = {
  slug: 'taste',
  name: 'taste',
  tagline: '把模板味炼成设计品味',
  domain: '前端',
  description: '一套反廉价感的前端审美 skill 合集。',
  highlights: ['审美规则化', '先审后写', '框架无关'],
  examplePrompts: ['审视这个落地页', '为作品集设计首页'],
  sourceUrl: 'https://github.com/example/taste',
};

describe('SkillAct · 收藏馆分幕', () => {
  it('渲染 skill 名称、领域徽章、台词与正文', () => {
    render(<SkillAct skill={baseSkill} index={0} total={5} />);

    expect(screen.getByText('taste')).toBeInTheDocument();
    expect(screen.getByText('前端')).toBeInTheDocument();
    expect(screen.getByText(/把模板味炼成设计品味/)).toBeInTheDocument();
    expect(screen.getByText(/一套反廉价感的前端审美 skill 合集/)).toBeInTheDocument();
  });

  it('序号按 index 格式化为两位补零并展示总数', () => {
    const { container } = render(<SkillAct skill={baseSkill} index={0} total={5} />);
    // 序号装饰元素带 text-foreground/5 class，内容为 "01 / 05"
    const order = container.querySelector('.text-foreground\\/5');
    expect(order).not.toBeNull();
    expect(order?.textContent?.replace(/\s+/g, ' ').trim()).toBe('01 / 05');
  });

  it('渲染能力亮点与示例提示词列表', () => {
    render(<SkillAct skill={baseSkill} index={2} total={5} />);

    expect(screen.getByText('审美规则化')).toBeInTheDocument();
    expect(screen.getByText('先审后写')).toBeInTheDocument();
    expect(screen.getByText('审视这个落地页')).toBeInTheDocument();
  });

  it('有 sourceUrl 时渲染「查看来源」外链', () => {
    render(<SkillAct skill={baseSkill} index={0} total={5} />);
    const link = screen.getByRole('link', { name: /查看来源/ });
    expect(link).toHaveAttribute('href', 'https://github.com/example/taste');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('无 sourceUrl 时不渲染外链', () => {
    const { sourceUrl, ...noSource } = baseSkill;
    void sourceUrl;
    render(<SkillAct skill={noSource as ShowcaseSkill} index={0} total={5} />);
    expect(screen.queryByRole('link', { name: /查看来源/ })).toBeNull();
  });

  it('section 带 aria-label 可访问名称（第 N 幕）', () => {
    render(<SkillAct skill={baseSkill} index={3} total={5} />);
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-label', '第 4 幕：taste');
    // id 取自 slug，便于锚点跳转
    expect(section).toHaveAttribute('id', 'taste');
  });

  it('奇偶幕交替布局：奇数幕（index 奇）文字在右', () => {
    const { container } = render(<SkillAct skill={baseSkill} index={1} total={5} />);
    // reversed 时双栏容器内 textColumn 的 div 带 lg:order-2
    const grid = container.querySelector('.grid.lg\\:grid-cols-2');
    expect(grid?.querySelector('.lg\\:order-2')).not.toBeNull();
  });

  it('偶数幕（index 偶）文字在左、卡片在右', () => {
    const { container } = render(<SkillAct skill={baseSkill} index={0} total={5} />);
    const grid = container.querySelector('.grid.lg\\:grid-cols-2');
    // 偶数幕不应用 order 类
    expect(grid?.querySelector('.lg\\:order-2')).toBeNull();
  });
});
