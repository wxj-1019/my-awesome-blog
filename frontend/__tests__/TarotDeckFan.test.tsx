import { fireEvent, render, screen } from '@testing-library/react';
import TarotDeckFan from '@/components/tarot/TarotDeckFan';
import { tarotDeck } from '@/mock/tarot';

describe('TarotDeckFan · 扇形选牌', () => {
  it('渲染全部 78 张抽牌按钮', () => {
    render(<TarotDeckFan deck={tarotDeck} pickedIds={new Set()} onPick={jest.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(78);
  });

  it('点击返回对应卡片', () => {
    const onPick = jest.fn();
    render(<TarotDeckFan deck={tarotDeck} pickedIds={new Set()} onPick={onPick} />);
    fireEvent.click(screen.getAllByRole('button')[10]);
    expect(onPick).toHaveBeenCalledWith(tarotDeck[10]);
  });

  it('已选中的牌不可再点，其余仍可点', () => {
    const onPick = jest.fn();
    const picked = new Set([tarotDeck[0].id, tarotDeck[1].id]);
    render(<TarotDeckFan deck={tarotDeck} pickedIds={picked} onPick={onPick} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(onPick).not.toHaveBeenCalled();

    fireEvent.click(buttons[5]);
    expect(onPick).toHaveBeenCalledWith(tarotDeck[5]);
  });

  it('disabled 时不触发回调', () => {
    const onPick = jest.fn();
    render(<TarotDeckFan deck={tarotDeck} pickedIds={new Set()} onPick={onPick} disabled />);
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(onPick).not.toHaveBeenCalled();
  });
});
