import { fireEvent, render, screen } from '@testing-library/react';
import ArticleTocRail from '@/components/articles/ArticleTocRail';
import type { TocHeading } from '@/hooks/useActiveHeading';

const scrollIntoView = jest.fn();

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: scrollIntoView,
  writable: true,
  configurable: true,
});

interface TocRailFixtureProps {
  headings: TocHeading[];
  activeId: string;
  progress: number;
  cardBgClass: string;
  textClass: string;
  mutedTextClass: string;
  accentActiveClass: string;
  idleLinkClass: string;
}

const props: TocRailFixtureProps = {
  headings: [
    { id: 'first', text: '第一章', level: 2 },
    { id: 'second', text: '第二章', level: 3 },
  ],
  activeId: 'first',
  progress: 37,
  cardBgClass: 'bg-card',
  textClass: 'text-foreground',
  mutedTextClass: 'text-muted-foreground',
  accentActiveClass: 'text-primary',
  idleLinkClass: 'text-muted-foreground',
};

beforeEach(() => {
  scrollIntoView.mockClear();
});

describe('ArticleTocRail', () => {
  it('rail 展示当前章节和阅读进度，不自行携带 sticky class', () => {
    const { container } = render(<ArticleTocRail {...props} variant="rail" />);
    const root = container.firstElementChild;

    expect(screen.getByText('37%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第一章' })).toHaveAttribute(
      'aria-current',
      'location'
    );
    expect(root).not.toBeNull();
    expect(
      root?.className
        .split(/\s+/)
        .some(className => className.includes('sticky'))
    ).toBe(false);
  });

  it('drawer 打开后可跳转章节并关闭', () => {
    const heading = document.createElement('h2');
    heading.id = 'first';
    heading.textContent = '第一章';
    document.body.appendChild(heading);

    render(<ArticleTocRail {...props} variant="drawer" />);
    fireEvent.click(screen.getByRole('button', { name: '打开文章目录' }));
    fireEvent.click(screen.getByRole('button', { name: '第一章' }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(
      screen.queryByRole('button', { name: '关闭目录' })
    ).not.toBeInTheDocument();
  });
});
