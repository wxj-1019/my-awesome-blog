import { render, screen } from '@testing-library/react';
import SkillFitMatrix from '@/components/skills/SkillFitMatrix';

describe('SkillFitMatrix', () => {
  it('渲染两列：适合与不适合', () => {
    render(
      <SkillFitMatrix
        fit={['追求设计品质的前端项目', '快速出原型']}
        notFit={['纯后端项目', '已有严格设计系统']}
      />,
    );
    expect(screen.getByText('适合')).toBeInTheDocument();
    expect(screen.getByText('不适合')).toBeInTheDocument();
    expect(screen.getByText('追求设计品质的前端项目')).toBeInTheDocument();
    expect(screen.getByText('已有严格设计系统')).toBeInTheDocument();
  });

  it('空数组不崩溃', () => {
    render(<SkillFitMatrix fit={[]} notFit={[]} />);
    expect(screen.getByText('适合')).toBeInTheDocument();
    expect(screen.getByText('不适合')).toBeInTheDocument();
  });
});
