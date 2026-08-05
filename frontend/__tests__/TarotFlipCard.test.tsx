import { fireEvent, render, screen } from '@testing-library/react';
import TarotFlipCard from '@/components/tarot/TarotFlipCard';

describe('TarotFlipCard · 双面翻牌容器', () => {
  const back = <div>牌背内容</div>;
  const face = <div>牌面内容</div>;

  it('未翻开时渲染可点击的翻牌按钮', () => {
    const onFlip = jest.fn();
    render(
      <TarotFlipCard flipped={false} back={back} face={face} onFlip={onFlip} ariaLabel="翻开这张牌" />
    );

    const button = screen.getByRole('button', { name: '翻开这张牌' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it('翻开后不再渲染翻牌按钮', () => {
    render(
      <TarotFlipCard flipped back={back} face={face} onFlip={jest.fn()} ariaLabel="翻开这张牌" />
    );

    expect(screen.queryByRole('button', { name: '翻开这张牌' })).not.toBeInTheDocument();
  });

  it('未提供 onFlip 时不渲染按钮', () => {
    render(<TarotFlipCard flipped={false} back={back} face={face} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('翻开后牌背与牌面内容均挂载（3D 双面结构）', () => {
    render(<TarotFlipCard flipped back={back} face={face} onFlip={jest.fn()} />);
    expect(screen.getByText('牌背内容')).toBeInTheDocument();
    expect(screen.getByText('牌面内容')).toBeInTheDocument();
  });

  it('未翻开的牌面不在可访问树中；翻开后可见', () => {
    const face = <span>牌面内容</span>;
    const back = <span>牌背</span>;
    const { rerender } = render(
      <TarotFlipCard flipped={false} back={back} face={face} />
    );
    expect(screen.queryByText('牌面内容')).not.toBeInTheDocument();
    rerender(<TarotFlipCard flipped back={back} face={face} />);
    expect(screen.getByText('牌面内容')).toBeInTheDocument();
  });
});
