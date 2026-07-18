'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from '@/lib/framer-motion';

interface TextScrambleProps {
  text: string;
  className?: string;
  trigger?: 'hover' | 'mount' | 'inView';
  duration?: number;
  scrambleChars?: string;
}

const defaultScrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export default function TextScramble({
  text,
  className = '',
  trigger = 'hover',
  duration = 2000,
  scrambleChars = defaultScrambleChars,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const scramble = useCallback(() => {
    if (isScrambling) {return;}
    setIsScrambling(true);

    const chars = scrambleChars.split('');
    const textLength = text.length;
    const steps = 20; // 动画步数
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // 根据进度决定有多少字符已经"解密"
      const revealedCount = Math.floor(progress * textLength);

      let newText = '';
      for (let i = 0; i < textLength; i++) {
        if (i < revealedCount) {
          // 已经解密的字符显示原文
          newText += text[i];
        } else if (text[i] === ' ') {
          // 空格保持空格
          newText += ' ';
        } else {
          // 未解密的字符显示随机字符
          newText += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      setDisplayText(newText);

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [text, duration, scrambleChars, isScrambling]);

  useEffect(() => {
    if (trigger === 'mount' && !hasTriggered) {
      setHasTriggered(true);
      scramble();
    }
  }, [trigger, hasTriggered, scramble]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      scramble();
    }
  };

  return (
    <motion.span
      className={`inline-block font-mono ${className}`}
      onMouseEnter={handleMouseEnter}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
    >
      {displayText}
    </motion.span>
  );
}
