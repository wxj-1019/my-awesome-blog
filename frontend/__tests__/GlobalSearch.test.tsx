import { render, screen, fireEvent, act } from '@testing-library/react';
import GlobalSearch from '@/components/navigation/GlobalSearch';
import { searchArticlesFulltext } from '@/lib/api/search';
import type { BackendArticleWithAuthor } from '@/types';

jest.mock('@/lib/api/search', () => ({
  searchArticlesFulltext: jest.fn(),
}));

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const searchMock = searchArticlesFulltext as jest.MockedFunction<
  typeof searchArticlesFulltext
>;

const ARTICLES = [
  {
    id: 'a1',
    title: 'React 入门',
    excerpt: '第一篇',
    content: '',
    published_at: '2026-01-01',
    read_time: 3,
    cover_image: null,
    categories: [],
  },
  {
    id: 'a2',
    title: 'React 进阶',
    excerpt: '第二篇',
    content: '',
    published_at: '2026-01-02',
    read_time: 5,
    cover_image: null,
    categories: [],
  },
];

function setup(open = true) {
  const onOpenChange = jest.fn();
  render(<GlobalSearch open={open} onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

/** fake timers 下推进防抖并 flush 微任务 */
async function advanceDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
  await act(async () => {});
}

describe('GlobalSearch · 全局搜索弹窗', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    searchMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('输入关键词防抖后调用搜索并渲染结果', async () => {
    searchMock.mockResolvedValue(ARTICLES);
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    expect(searchMock).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(searchMock).toHaveBeenCalledWith('React', expect.anything());
    expect(screen.getByText('React 入门')).toBeInTheDocument();
    expect(screen.getByText('React 进阶')).toBeInTheDocument();
  });

  it('点击结果跳转文章页并关闭弹窗', async () => {
    searchMock.mockResolvedValue(ARTICLES);
    const { onOpenChange } = setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    await advanceDebounce();

    fireEvent.click(screen.getByText('React 入门'));

    expect(pushMock).toHaveBeenCalledWith('/articles/a1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('键盘 ↓ + Enter 选中第二篇并跳转', async () => {
    searchMock.mockResolvedValue(ARTICLES);
    setup();
    const input = screen.getByLabelText('搜索文章');

    fireEvent.change(input, { target: { value: 'React' } });
    await advanceDebounce();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/articles/a2');
  });

  it('无结果时显示空态', async () => {
    searchMock.mockResolvedValue([]);
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: '不存在的东西' },
    });
    await advanceDebounce();

    expect(screen.getByText('没有找到相关文章')).toBeInTheDocument();
  });

  it('请求失败时显示错误态', async () => {
    searchMock.mockRejectedValue(new Error('HTTP 500'));
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    await advanceDebounce();

    expect(screen.getByText('搜索出错了')).toBeInTheDocument();
  });

  it('关键词为空时不发请求并显示引导文案', async () => {
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: '   ' },
    });
    await advanceDebounce();

    expect(searchMock).not.toHaveBeenCalled();
    expect(screen.getByText('输入关键词搜索全站文章')).toBeInTheDocument();
  });

  it('清空输入后在途响应到达时不渲染过期结果', async () => {
    // 手动控制 resolve 的 promise，模拟慢请求
    let resolveFn: (value: BackendArticleWithAuthor[]) => void = () => undefined;
    searchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        })
    );
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    expect(searchMock).toHaveBeenCalledTimes(1);

    // 响应未返回时删空输入：空关键词分支应中止在途请求
    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: '' },
    });
    await act(async () => {});

    // mock 不响应 abort signal，手动 resolve 模拟残余竞态
    resolveFn(ARTICLES);
    await act(async () => {});

    expect(screen.queryByText('React 入门')).not.toBeInTheDocument();
    expect(screen.getByText('输入关键词搜索全站文章')).toBeInTheDocument();
  });

  it('请求失败后点击重试再次发起搜索', async () => {
    searchMock.mockRejectedValue(new Error('HTTP 500'));
    setup();

    fireEvent.change(screen.getByLabelText('搜索文章'), {
      target: { value: 'React' },
    });
    await advanceDebounce();

    expect(screen.getByText('搜索出错了')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(1);

    searchMock.mockResolvedValue(ARTICLES);
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    await advanceDebounce();

    expect(searchMock).toHaveBeenCalledTimes(2);
  });
});
