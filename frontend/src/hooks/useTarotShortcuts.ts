'use client';

import { useEffect } from 'react';
import type { TarotPhase } from '@/types/tarot';

interface UseTarotShortcutsOptions {
  phase: TarotPhase;
  /** 是否有弹层打开（弹层打开时不抢键，由弹层自己的 Esc 处理） */
  modalOpen?: boolean;
  onStart: () => void;
  onFlipNext: () => void;
  onReset: () => void;
  onPickSpread: (spread: 'single' | 'three') => void;
}

/**
 * 占卜流程键盘快捷键（仅占卜视图生效，弹层打开时静默）：
 * - 空格：ask 阶段=开始占卜；revealing 阶段=翻开下一张未翻牌
 * - 1 / 2：ask 阶段切换单张 / 三张牌阵
 * - Esc：占卜中=重置回问牌阶段
 *
 * 输入框聚焦时空格/数字键不触发（避免误触）。
 */
export function useTarotShortcuts({
  phase,
  modalOpen,
  onStart,
  onFlipNext,
  onReset,
  onPickSpread,
}: UseTarotShortcutsOptions): void {
  useEffect(() => {
    if (modalOpen) {return;}

    const handler = (e: KeyboardEvent) => {
      // 输入框聚焦时让位
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {return;}
      if (target?.isContentEditable) {return;}

      switch (e.key) {
        case ' ':
        case 'Spacebar': {
          e.preventDefault();
          if (phase === 'ask') {onStart();}
          else if (phase === 'revealing') {onFlipNext();}
          break;
        }
        case '1':
          if (phase === 'ask') {onPickSpread('single');}
          break;
        case '2':
          if (phase === 'ask') {onPickSpread('three');}
          break;
        case 'Escape':
          if (phase !== 'ask') {onReset();}
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, modalOpen, onStart, onFlipNext, onReset, onPickSpread]);
}
