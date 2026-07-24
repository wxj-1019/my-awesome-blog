import { render, screen, fireEvent } from '@testing-library/react';
import SkillContentPanel from '@/components/skills/SkillContentPanel';

const longMd = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');

jest.mock('@/components/ui/MarkdownRenderer', () => {
  return function MockMarkdown({ content }: { content: string }) {
    return <pre data-testid="md">{content}</pre>;
  };
});

describe('SkillContentPanel', () => {
  it('空正文显示暂无托管', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={null}
      />,
    );
    expect(screen.getByText(/暂无托管正文/)).toBeInTheDocument();
  });

  it('默认折叠只展示约 16 行逻辑下的预览', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={longMd}
      />,
    );
    const md = screen.getByTestId('md');
    expect(md.textContent?.split('\n')).toHaveLength(16);
    expect(screen.getByRole('button', { name: /展开全文/ })).toBeInTheDocument();
  });

  it('点击展开后显示全文', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={longMd}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /展开全文/ }));
    expect(screen.getByTestId('md').textContent?.split('\n')).toHaveLength(20);
    expect(screen.getByRole('button', { name: /收起/ })).toBeInTheDocument();
  });

  it('下载按钮可访问名称包含文件名', () => {
    render(
      <SkillContentPanel
        slug="taste"
        contentPath="/skills/taste/SKILL.md"
        contentMarkdown={longMd}
      />,
    );
    expect(
      screen.getByRole('button', { name: /下载 taste-SKILL\.md/ }),
    ).toBeInTheDocument();
  });
});
