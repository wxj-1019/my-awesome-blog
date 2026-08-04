import { act, fireEvent, render, screen } from '@testing-library/react';
import TarotContent from '@/app/tools/tarot/tarot-content';

// jsdom 未实现 scrollIntoView（解读完成自动滚动），桩掉避免报错
Element.prototype.scrollIntoView = jest.fn();

jest.mock('@/components/tarot/TarotCardBack', () => ({
  __esModule: true,
  default: () => <div data-testid="card-back" />,
}));
jest.mock('@/components/tarot/TarotCardFace', () => ({
  __esModule: true,
  default: () => <div data-testid="card-face" />,
}));
jest.mock('@/components/tarot/TarotOrnament', () => ({
  __esModule: true,
  default: () => <div data-testid="ornament" />,
}));
jest.mock('@/components/tarot/TarotCutDeck', () => ({
  __esModule: true,
  default: ({ onCut }: { onCut: () => void }) => (
    <button type="button" onClick={onCut}>
      点击切牌
    </button>
  ),
}));
jest.mock('@/components/tarot/TarotDeckFan', () => {
  const { useRef } = jest.requireActual<typeof import('react')>('react');
  const { tarotDeck } = jest.requireActual('@/mock/tarot');
  return {
    __esModule: true,
    default: ({ onPick }: { onPick: (card: unknown) => void }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const clickRef = useRef(0);
      return (
        <button
          type="button"
          onClick={() => onPick(tarotDeck[clickRef.current++ % 78])}
        >
          扇形抽牌
        </button>
      );
    },
  };
});
jest.mock('@/components/tarot/SpreadSlots', () => ({
  __esModule: true,
  default: ({
    drawn,
    flipped,
    onFlip,
  }: {
    drawn: { card: { id: string } }[];
    flipped: boolean[];
    onFlip: (index: number) => void;
  }) => (
    <div>
      <span>牌位区（{drawn.length}）</span>
      {drawn.map((d, i) => (
        <button key={d.card.id} type="button" onClick={() => onFlip(i)}>
          {flipped[i] ? '已翻' : '翻牌'}
          {i}
        </button>
      ))}
    </div>
  ),
}));
jest.mock('@/components/tarot/ReadingPanel', () => ({
  __esModule: true,
  default: () => <div>解读面板</div>,
}));
jest.mock('@/components/tarot/TarotHistory', () => ({
  __esModule: true,
  default: () => <div>历史面板</div>,
}));
jest.mock('@/components/tarot/TarotLexicon', () => ({
  __esModule: true,
  default: () => <div>速查面板</div>,
}));

describe('TarotContent · 占卜流程状态机', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('初始为问牌阶段：问题输入、牌阵选择与开始按钮', () => {
    render(<TarotContent />);
    expect(screen.getByLabelText('你的问题（可选）')).toBeInTheDocument();
    expect(screen.getByText('每日指引')).toBeInTheDocument();
    expect(screen.getByText('过去 · 现在 · 未来')).toBeInTheDocument();
    expect(screen.getByText('开始占卜')).toBeInTheDocument();
  });

  it('开始 → 洗牌动画 →（900ms）切牌阶段', () => {
    render(<TarotContent />);
    fireEvent.click(screen.getByText('开始占卜'));
    expect(screen.getByText('跳过动画')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(screen.getByText('点击切牌')).toBeInTheDocument();
  });

  it('切牌后进入扇形选牌；可跳过洗牌动画直接切牌', () => {
    render(<TarotContent />);
    fireEvent.click(screen.getByText('开始占卜'));
    fireEvent.click(screen.getByText('跳过动画'));
    expect(screen.getByText('点击切牌')).toBeInTheDocument();

    fireEvent.click(screen.getByText('点击切牌'));
    expect(screen.getByText('扇形抽牌')).toBeInTheDocument();
  });

  it('单张牌阵：抽满 1 张 → 揭示阶段 → 全部翻开 → 解读面板', () => {
    render(<TarotContent />);
    fireEvent.click(screen.getByText('开始占卜'));
    act(() => {
      jest.advanceTimersByTime(900);
    });
    fireEvent.click(screen.getByText('点击切牌'));
    fireEvent.click(screen.getByText('扇形抽牌'));

    // 选满后 420ms 切到揭示阶段
    act(() => {
      jest.advanceTimersByTime(420);
    });
    expect(screen.getByText('翻牌0')).toBeInTheDocument();
    expect(screen.queryByText('解读面板')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('翻牌0'));
    expect(screen.getByText('解读面板')).toBeInTheDocument();
    expect(screen.getByText('历史面板')).toBeInTheDocument();
  });

  it('三张牌阵：抽满 3 张后才进入揭示', () => {
    render(<TarotContent />);
    fireEvent.click(screen.getByText('过去 · 现在 · 未来'));
    fireEvent.click(screen.getByText('开始占卜'));
    act(() => {
      jest.advanceTimersByTime(900);
    });
    fireEvent.click(screen.getByText('点击切牌'));

    fireEvent.click(screen.getByText('扇形抽牌'));
    act(() => {
      jest.advanceTimersByTime(420);
    });
    // 只抽 1 张仍停留在抽牌阶段
    expect(screen.queryByText('翻牌0')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('扇形抽牌'));
    fireEvent.click(screen.getByText('扇形抽牌'));
    act(() => {
      jest.advanceTimersByTime(420);
    });
    expect(screen.getByText('翻牌2')).toBeInTheDocument();
  });

  it('误触撤销：抽牌后可撤销，撤销后回到未选满状态', () => {
    render(<TarotContent />);
    fireEvent.click(screen.getByText('过去 · 现在 · 未来'));
    fireEvent.click(screen.getByText('开始占卜'));
    act(() => {
      jest.advanceTimersByTime(900);
    });
    fireEvent.click(screen.getByText('点击切牌'));

    expect(screen.queryByText('撤销上一张')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('扇形抽牌'));
    expect(screen.getByText('撤销上一张')).toBeInTheDocument();

    fireEvent.click(screen.getByText('撤销上一张'));
    expect(screen.queryByText('撤销上一张')).not.toBeInTheDocument();
  });

  it('双视图：切换到牌义速查不丢占卜进度', () => {
    render(<TarotContent />);
    fireEvent.click(screen.getByText('开始占卜'));
    act(() => {
      jest.advanceTimersByTime(900);
    });
    expect(screen.getByText('点击切牌')).toBeInTheDocument();

    // 切到速查视图
    fireEvent.click(screen.getByRole('tab', { name: /牌义速查/ }));
    expect(screen.getByText('速查面板')).toBeInTheDocument();

    // 切回占卜：进度保留（仍在切牌阶段）
    fireEvent.click(screen.getByRole('tab', { name: /占卜/ }));
    expect(screen.getByText('点击切牌')).toBeInTheDocument();
  });
});
