import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

async function settleInteraction() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 650));
  });
}

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

  it('drawer 是带名称的对话框', async () => {
    const user = userEvent.setup();
    render(<ArticleTocRail {...props} variant="drawer" />);
    const trigger = screen.getByRole('button', { name: '打开文章目录' });

    await act(async () => {
      await user.click(trigger);
    });

    expect(
      screen.getByRole('dialog', { name: '文章目录' })
    ).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-label', '关闭文章目录');
    await settleInteraction();
  });

  it('drawer 打开后可跳转章节并关闭', async () => {
    const user = userEvent.setup();
    render(
      <>
        <h2 id="first">第一章</h2>
        <ArticleTocRail {...props} variant="drawer" />
      </>
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: '打开文章目录' }));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: '第一章' }));
    });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '文章目录' })
      ).not.toBeInTheDocument()
    );
    await settleInteraction();
  });

  it('Escape 关闭 drawer 并将焦点还给 trigger', async () => {
    const user = userEvent.setup();
    render(<ArticleTocRail {...props} variant="drawer" />);
    const trigger = screen.getByRole('button', { name: '打开文章目录' });

    await act(async () => {
      await user.click(trigger);
    });
    expect(
      screen.getByRole('dialog', { name: '文章目录' })
    ).toBeInTheDocument();

    await act(async () => {
      await user.keyboard('{Escape}');
    });

    expect(
      screen.queryByRole('dialog', { name: '文章目录' })
    ).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    await settleInteraction();
  });
});
