import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TarotLexicon from '@/components/tarot/TarotLexicon';
import { tarotDeck } from '@/mock/tarot';

/**
 * jsdom 没有 IntersectionObserver，hook 会降级为「始终可见」，
 * 但降级发生在 effect（异步），列表项初次渲染为占位空壳。
 * 用 fake IO 让回调同步触发 intersecting，内容立即挂载。
 */
class FakeIO {
  static instances: FakeIO[] = [];
  cb: (entries: { isIntersecting: boolean }[]) => void;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }
  observe = () => {
    // 同步通知「已进入视口」
    this.cb([{ isIntersecting: true }]);
  };
  disconnect = jest.fn();
  unobserve = jest.fn();
  takeRecords = jest.fn();
}

describe('TarotLexicon · 牌义速查馆', () => {
  beforeEach(() => {
    FakeIO.instances = [];
    globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    localStorage.clear();
  });

  afterEach(() => {
    // @ts-expect-error 测试结束后清掉全局桩
    delete globalThis.IntersectionObserver;
  });

  it('默认展示大阿尔克那 22 张', () => {
    render(<TarotLexicon />);
    expect(screen.getAllByRole('listitem')).toHaveLength(22);
    expect(screen.getByText('愚者')).toBeInTheDocument();
    expect(screen.getByText('世界')).toBeInTheDocument();
  });

  it('切换分组展示对应花色 14 张', () => {
    render(<TarotLexicon />);
    fireEvent.click(screen.getByRole('button', { name: '权杖' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(14);
    expect(screen.getByText('权杖十')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '圣杯' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(14);
    expect(screen.getByText('圣杯国王')).toBeInTheDocument();
  });

  it('搜索按牌名过滤并提示数量', () => {
    render(<TarotLexicon />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '月亮' } });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('找到 1 张牌')).toBeInTheDocument();
  });

  it('搜索无结果时展示空态', () => {
    render(<TarotLexicon />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '不存在的牌' } });
    expect(screen.getByText('没有匹配的牌')).toBeInTheDocument();
  });

  it('点击条目展开正/逆位详情', async () => {
    render(<TarotLexicon />);
    const fool = tarotDeck.find((c) => c.id === 'fool');
    expect(fool).toBeDefined();

    // 展开前详情不可见
    expect(screen.queryByText(fool!.upright)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '愚者 详情' }));
    expect(screen.getByText('正位')).toBeInTheDocument();
    expect(screen.getByText('逆位')).toBeInTheDocument();
    expect(screen.getByText(fool!.upright)).toBeInTheDocument();
    expect(screen.getByText(fool!.reversed)).toBeInTheDocument();

    // 再次点击收起（AnimatePresence 退出动画完成后卸载）
    fireEvent.click(screen.getByRole('button', { name: '愚者 详情' }));
    await waitFor(() => {
      expect(screen.queryByText(fool!.upright)).not.toBeInTheDocument();
    });
  });

  it('点击星标切换收藏状态', async () => {
    render(<TarotLexicon />);
    // 虚拟化：内容在视口检测 effect 后异步挂载，用 findBy 等待
    const starBtn = await screen.findByRole('button', { name: '收藏愚者' });
    expect(starBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(starBtn);
    expect(starBtn).toHaveAttribute('aria-pressed', 'true');
    expect(starBtn).toHaveAttribute('aria-label', '取消收藏愚者');
  });

  it('「只看收藏」开关过滤未收藏的牌', async () => {
    render(<TarotLexicon />);
    // 先收藏愚者
    const starBtn = await screen.findByRole('button', { name: '收藏愚者' });
    fireEvent.click(starBtn);
    // 默认大阿尔克那 22 张
    expect(screen.getAllByRole('listitem')).toHaveLength(22);

    // 开启只看收藏
    fireEvent.click(screen.getByRole('button', { name: '只看收藏' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
