import { fireEvent, render, screen } from '@testing-library/react';
import ArticleTocRail from '@/components/articles/ArticleTocRail';
import type { TocHeading } from '@/hooks/useActiveHeading';

const originalScrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollIntoView'
);
const scrollIntoView = jest.fn();

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

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: scrollIntoView,
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  scrollIntoView.mockClear();
});

afterAll(() => {
  if (originalScrollIntoViewDescriptor) {
    Object.defineProperty(
      Element.prototype,
      'scrollIntoView',
      originalScrollIntoViewDescriptor
    );
    return;
  }

  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

describe('ArticleTocRail', () => {
  it('rail 展示当前章节和阅读进度', () => {
    render(<ArticleTocRail {...props} variant="rail" />);

    expect(screen.getByText('37%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第一章' })).toHaveAttribute(
      'aria-current',
      'location'
    );
  });

  it('rail 不在内部元素携带 sticky 定位职责', () => {
    const { container } = render(<ArticleTocRail {...props} variant="rail" />);
    const stickyTokens = Array.from(container.querySelectorAll('[class]'))
      .flatMap(element => (element.getAttribute('class') ?? '').split(/\s+/))
      .filter(className => /(^|:)sticky$/.test(className));

    expect(stickyTokens).toEqual([]);
  });

  it('drawer 打开后可跳转章节并关闭', () => {
    render(
      <>
        <h2 id="first">第一章</h2>
        <ArticleTocRail {...props} variant="drawer" />
      </>
    );
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
