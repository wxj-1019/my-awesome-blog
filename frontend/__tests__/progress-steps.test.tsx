import { render, screen } from '@testing-library/react';
import ProgressSteps from '@/components/tools/image-gen/ProgressSteps';

describe('ProgressSteps · 生成进度步进条', () => {
  it('渲染三节点：排队/生成/完成', () => {
    render(<ProgressSteps activeIndex={0} statusText="任务排队中…" />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('排队')).toBeInTheDocument();
    expect(screen.getByText('生成')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });

  it('activeIndex=0 时排队节点激活（aria-current），状态文本可被辅助技术读取', () => {
    render(<ProgressSteps activeIndex={0} statusText="任务排队中…" />);
    const active = screen.getByText('排队').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('status')).toHaveTextContent('任务排队中…');
  });

  it('activeIndex=1 时生成节点激活', () => {
    render(<ProgressSteps activeIndex={1} statusText="正在生成…" />);
    const active = screen.getByText('生成').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('排队').closest('li')).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('activeIndex=2 时全部完成，无激活节点', () => {
    render(<ProgressSteps activeIndex={2} statusText="生成完成" />);
    expect(
      screen.queryByRole('listitem', { current: 'step' })
    ).not.toBeInTheDocument();
  });
});
