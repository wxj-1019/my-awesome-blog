/**
 * 方案 E · L3 GSAP 入口
 * 禁止在此目录用 framer-motion 改同一节点 transform/opacity
 */

export { ensureGsapPlugins, ScrollTrigger } from '@/lib/gsap/registry';
export { SCROLL_VIEWPORT, SCROLL_REVEAL, SCROLL_FLOAT, MAX_STAGGER_ITEMS } from '@/lib/gsap/scroll-presets';
export { default as ScrollReveal } from './ScrollReveal';
export { default as ScrollFloat } from './ScrollFloat';
export { default as ParallaxLayer } from './ParallaxLayer';
