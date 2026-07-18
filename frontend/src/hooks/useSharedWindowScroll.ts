'use client';

import { useEffect, useRef } from 'react';

type ScrollListener = () => void;

/**
 * 页面级 scroll/resize 单例（rAF 合并）。
 * 详情页阅读进度 + 封面视差共用，避免双监听。
 */
const listeners = new Set<ScrollListener>();
let attached = false;
let frame = 0;

function flush() {
  frame = 0;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // 单个监听失败不影响其它
    }
  });
}

function onScrollOrResize() {
  if (frame) {
    return;
  }
  frame = window.requestAnimationFrame(flush);
}

function ensureAttached() {
  if (attached || typeof window === 'undefined') {
    return;
  }
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  attached = true;
}

function maybeDetach() {
  if (!attached || listeners.size > 0 || typeof window === 'undefined') {
    return;
  }
  window.removeEventListener('scroll', onScrollOrResize);
  window.removeEventListener('resize', onScrollOrResize);
  attached = false;
  if (frame) {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
}

/**
 * 订阅共享 window scroll/resize（已 rAF）。
 * 挂载时立即调用一次 listener。
 */
export function useSharedWindowScroll(listener: ScrollListener, enabled = true) {
  const latest = useRef(listener);
  latest.current = listener;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const wrapped = () => latest.current();
    listeners.add(wrapped);
    ensureAttached();
    wrapped();
    return () => {
      listeners.delete(wrapped);
      maybeDetach();
    };
  }, [enabled]);
}
