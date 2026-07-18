/**
 * GSAP ScrollTrigger 预设（方案 E · L3）
 * 具体 tween 由调用方组合；此处只放常用 trigger 配置。
 */

export const SCROLL_VIEWPORT = {
  /** 进入视口一次后播放 */
  ONCE: {
    start: 'top 85%',
    toggleActions: 'play none none none' as const,
  },
  /** 可 scrub 的区段 */
  SCRUB: {
    start: 'top bottom',
    end: 'bottom top',
    scrub: true as const,
  },
  /** 桌面 pin 区（移动端请勿启用） */
  PIN: {
    start: 'top top',
    end: '+=100%',
    pin: true as const,
    scrub: 1 as const,
  },
};

export const SCROLL_REVEAL = {
  y: 28,
  autoAlpha: 0,
  duration: 0.75,
  ease: 'power3.out',
};

export const SCROLL_FLOAT = {
  y: 40,
  ease: 'none',
};

/** 列表项超过此数量时禁止 stagger */
export const MAX_STAGGER_ITEMS = 20;
