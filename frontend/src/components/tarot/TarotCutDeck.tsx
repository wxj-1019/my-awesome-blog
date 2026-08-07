'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Scissors } from 'lucide-react';
import { motion, useReducedMotion } from '@/lib/framer-motion';
import { EASE } from '@/lib/animation-utils';
import { cn } from '@/lib/utils';
import TarotCardBack from './TarotCardBack';

interface TarotCutDeckProps {
  onCut: () => void;
  /** 切牌动画时长（ms），reduced-motion 时近似跳过 */
  disabled?: boolean;
}

/** 切牌动画时长（ms），reduced-motion 时近似跳过。
 *  下方两叠/上叠的位移 duration（0.32/0.34）与 delay 属于流程编排：整体在
 *  CUT_MS(800ms) 窗口内完成，onCut 回调到点即触发——非视觉过渡令牌；
 *  上叠用 EASE.SNAPPY 表达「切开」的利落感（无 SNAPPY 短时令牌组合），
 *  下叠用 EASE.SMOOTH（即 TRANSITION.MICRO 同款缓动）。 */
const CUT_MS = 800;

/**
 * 切牌仪式：竖向牌堆 + 点击切牌。
 * 点击后上下两叠分裂再合拢（一次性 transform 动画），动画结束后回调 onCut。
 * 上层叠的位移用 CSS transition（仅 transform），reduced-motion 时直接回调。
 */
export default function TarotCutDeck({ onCut, disabled }: TarotCutDeckProps) {
  const reducedMotion = useReducedMotion();
  const [cutting, setCutting] = useState(false);
  // 用 ref 存最新 onCut，避免 timer 闭包捕获旧引用
  const onCutRef = useRef(onCut);
  onCutRef.current = onCut;

  const handleCut = useCallback(() => {
    if (cutting) {return;}
    if (reducedMotion) {
      onCutRef.current();
      return;
    }
    setCutting(true);
  }, [cutting, reducedMotion]);

  // 用 useEffect 管理 timer：cutting=true 时启动，unmount 或 cutting 变化时清理；
  // 兼容 React Strict Mode 双重挂载（重新挂载时 effect 重建 timer）
  useEffect(() => {
    if (!cutting) {return;}
    const timer = window.setTimeout(() => {
      onCutRef.current();
    }, CUT_MS);
    return () => { window.clearTimeout(timer); };
  }, [cutting]);

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div
        className="relative h-44 w-28 select-none sm:h-48 sm:w-32"
        role="img"
        aria-label="一叠塔罗牌，等待切牌"
      >
        {/* 底部两叠（切牌后散开） */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`bottom-${i}`}
            className="absolute left-0 top-0 h-full w-full"
            animate={cutting ? { y: 6 + i * 5, rotate: i * 1.6 - 1.6 } : { y: 0, rotate: 0 }}
            transition={{ duration: 0.32, ease: EASE.SMOOTH, delay: 0.42 }}
            style={{ zIndex: i + 1 }}
          >
            <TarotCardBack />
          </motion.div>
        ))}
        {/* 上叠（切牌时向上分离再合拢） */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`top-${i}`}
            className="absolute left-0 top-0 h-full w-full"
            animate={
              cutting
                ? { y: -34 - i * 8, rotate: i * 1.2 - 1.8, opacity: i === 2 ? 0 : 1 }
                : { y: 0, rotate: 0, opacity: 1 }
            }
            transition={{ duration: 0.34, ease: EASE.SNAPPY, delay: 0.08 + i * 0.06 }}
            style={{ zIndex: 10 - i }}
          >
            <TarotCardBack />
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCut}
        disabled={disabled || cutting}
        aria-live="polite"
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors',
          'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-60'
        )}
      >
        <Scissors className="h-4 w-4" aria-hidden />
        {cutting ? '切牌中…' : '点击切牌'}
      </button>
      <p className="text-sm text-muted-foreground">在心中默念你的问题，切开牌堆</p>
    </div>
  );
}
