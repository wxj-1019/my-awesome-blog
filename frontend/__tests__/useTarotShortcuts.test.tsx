import { fireEvent, render } from '@testing-library/react';
import { useTarotShortcuts } from '@/hooks/useTarotShortcuts';
import type { TarotPhase } from '@/types/tarot';

interface ProbeProps {
  phase: TarotPhase;
  modalOpen?: boolean;
  handlers: {
    onStart: () => void;
    onFlipNext: () => void;
    onReset: () => void;
    onPickSpread: (s: 'single' | 'three') => void;
  };
}

function Probe({ phase, modalOpen, handlers }: ProbeProps) {
  useTarotShortcuts({
    phase,
    modalOpen,
    onStart: handlers.onStart,
    onFlipNext: handlers.onFlipNext,
    onReset: handlers.onReset,
    onPickSpread: handlers.onPickSpread,
  });
  return <div />;
}

function fireKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('useTarotShortcuts · 占卜快捷键', () => {
  it('ask 阶段空格触发开始', () => {
    const onStart = jest.fn();
    render(<Probe phase="ask" handlers={{ onStart, onFlipNext: jest.fn(), onReset: jest.fn(), onPickSpread: jest.fn() }} />);
    fireKey(' ');
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('revealing 阶段空格触发翻下一张', () => {
    const onFlipNext = jest.fn();
    render(<Probe phase="revealing" handlers={{ onStart: jest.fn(), onFlipNext, onReset: jest.fn(), onPickSpread: jest.fn() }} />);
    fireKey(' ');
    expect(onFlipNext).toHaveBeenCalledTimes(1);
  });

  it('ask 阶段 1/2 切换牌阵', () => {
    const onPickSpread = jest.fn();
    render(<Probe phase="ask" handlers={{ onStart: jest.fn(), onFlipNext: jest.fn(), onReset: jest.fn(), onPickSpread }} />);
    fireKey('1');
    expect(onPickSpread).toHaveBeenCalledWith('single');
    fireKey('2');
    expect(onPickSpread).toHaveBeenCalledWith('three');
  });

  it('非 ask 阶段 Esc 触发重置', () => {
    const onReset = jest.fn();
    render(<Probe phase="drawing" handlers={{ onStart: jest.fn(), onFlipNext: jest.fn(), onReset, onPickSpread: jest.fn() }} />);
    fireKey('Escape');
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('ask 阶段 Esc 不触发重置', () => {
    const onReset = jest.fn();
    render(<Probe phase="ask" handlers={{ onStart: jest.fn(), onFlipNext: jest.fn(), onReset, onPickSpread: jest.fn() }} />);
    fireKey('Escape');
    expect(onReset).not.toHaveBeenCalled();
  });

  it('弹层打开时所有快捷键静默', () => {
    const onStart = jest.fn();
    const onReset = jest.fn();
    render(
      <Probe
        phase="ask"
        modalOpen
        handlers={{ onStart, onFlipNext: jest.fn(), onReset, onPickSpread: jest.fn() }}
      />
    );
    fireKey(' ');
    fireKey('1');
    fireKey('Escape');
    expect(onStart).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it('焦点在 button 上时按 Space 不触发 onStart（交还原生行为）', () => {
    const onStart = jest.fn();
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    render(
      <Probe
        phase="ask"
        handlers={{ onStart, onFlipNext: jest.fn(), onReset: jest.fn(), onPickSpread: jest.fn() }}
      />
    );

    fireEvent.keyDown(button, { key: ' ' });
    expect(onStart).not.toHaveBeenCalled();
    document.body.removeChild(button);
  });
});
