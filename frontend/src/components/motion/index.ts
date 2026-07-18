/**
 * 方案 E · L1/L2 Framer Motion 入口
 * 禁止在此目录使用 gsap 改 transform/opacity
 */

export { default as FadeIn } from './FadeIn';
export { default as BlurIn } from './BlurIn';
export { default as Stagger, StaggerItem } from './Stagger';
export { default as HoverLift } from './HoverLift';
export { default as ModalMotion } from './ModalMotion';

// 兼容旧入口
export { default as OptimizedMotion, FadeIn as OptimizedFadeIn, ScaleIn, HoverScale, ListItem } from '@/components/ui/OptimizedMotion';
export { default as PageTransition, StaggeredChildren } from '@/components/animations/PageTransition';
