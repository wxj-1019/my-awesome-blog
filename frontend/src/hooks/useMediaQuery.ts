'use client';

import { useState, useEffect } from 'react';

/**
 * 共享的媒体查询订阅 hook。
 *
 * SSR/首帧返回 false（保守值），挂载后按真实匹配同步——与项目里
 * useReducedMotion 相同的模式。替代各组件手写的 matchMedia + useState/useEffect 样板。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;
