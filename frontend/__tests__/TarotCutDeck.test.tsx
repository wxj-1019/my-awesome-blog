import { act, fireEvent, render, screen } from '@testing-library/react';
import TarotCutDeck from '@/components/tarot/TarotCutDeck';

jest.mock('@/lib/framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

describe('TarotCutDeck · 切牌动画', () => {
  it('卸载后超时不再调用 onCut（stale callback 防护）', () => {
    jest.useFakeTimers();
    const onCut = jest.fn();
    const { unmount } = render(<TarotCutDeck onCut={onCut} />);
    fireEvent.click(screen.getByText('点击切牌'));
    unmount(); // 模拟父层 reset 卸载
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(onCut).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
