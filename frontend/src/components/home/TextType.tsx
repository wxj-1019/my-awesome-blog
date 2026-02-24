'use client';

import { ElementType, createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { getActiveTypewriterContents, TypewriterContent } from '@/lib/api/typewriter';

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text?: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
  fetchFromApi?: boolean;
}

const TextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 3000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  fetchFromApi = false,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const [dynamicTexts, setDynamicTexts] = useState<TypewriterContent[]>([]);
  const [isLoading, setIsLoading] = useState(fetchFromApi);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Fetch from API if enabled
  useEffect(() => {
    if (fetchFromApi && !text) {
      setIsLoading(true);
      getActiveTypewriterContents().then((fetchedContents) => {
        // API returns TypewriterContent[] directly
        setDynamicTexts(fetchedContents);
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error fetching typewriter contents:', error);
        setDynamicTexts([]);
        setIsLoading(false);
      });
    }
  }, [fetchFromApi, text]);

  // Determine which texts to use (dynamic or static)
  const textArray = useMemo(() => {
    if (fetchFromApi && !text) {
      return dynamicTexts.length > 0 ? dynamicTexts.map(item => item.content) : [];      
    }
    return text ? (Array.isArray(text) ? text : [text]) : [];
  }, [text, fetchFromApi, dynamicTexts]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return;
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useGSAP(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible || textArray.length === 0) return;

    let timeout: ReturnType<typeof setTimeout>;

    const currentText = textArray[currentTextIndex] || '';
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          // 完成删除后，切换到下一个文本
          if (onSentenceComplete) onSentenceComplete(textArray[currentTextIndex], currentTextIndex);

          // 设置下一个文本的索引
          const nextTextIndex = (currentTextIndex + 1) % textArray.length;

          // 如果是最后一个文本且不循环，则停止
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          // 更新到下一个文本
          setCurrentTextIndex(nextTextIndex);
          setCurrentCharIndex(0);
          setIsDeleting(false);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentText && currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText(prev => prev + processedText[currentCharIndex]);
              setCurrentCharIndex(prev => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length > 0) {
          // 文本已完成输入，准备删除
          if (!loop && currentTextIndex === textArray.length - 1) {
            return;
          }
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < (textArray[currentTextIndex]?.length || 0) || isDeleting);

  // Show loading indicator when fetching from API
  if (isLoading) {
    return createElement(
      Component,
      {
        ref: containerRef,
        className: `inline-block whitespace-pre-wrap tracking-tight ${className}`,
        ...props
      },
      <span className="inline animate-pulse">加载中...</span>
    );
  }

  // Show nothing if no texts available
  if (textArray.length === 0) {
    return createElement(
      Component,
      {
        ref: containerRef,
        className: `inline-block whitespace-pre-wrap tracking-tight ${className}`,
        ...props
      },
      <span className="inline opacity-50">暂无内容</span>
    );
  }

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `inline-block whitespace-pre-wrap tracking-tight ${className}`,
      ...props
    },
    <span className="inline" style={{ color: getCurrentTextColor() || 'inherit' }}>
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`ml-1 inline-block opacity-100 ${shouldHideCursor ? 'hidden' : ''} ${cursorClassName}`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default TextType;