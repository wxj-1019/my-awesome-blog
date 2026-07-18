/**
 * 全站唯一允许直接依赖 `framer-motion` 的入口。
 * 业务代码与组件请：
 *   import { motion, AnimatePresence, ... } from '@/lib/framer-motion'
 * 或优先使用方案 E 封装：`@/components/motion`
 *
 * 禁止：import ... from 'framer-motion'（除本文件外）
 */

export {
  motion,
  AnimatePresence,
  LayoutGroup,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  useReducedMotion,
  useAnimation,
  useAnimate,
  useScroll,
  useVelocity,
  useAnimationFrame,
  useDragControls,
  useMotionTemplate,
  usePresence,
  useCycle,
  Reorder,
  MotionConfig,
} from 'framer-motion';

export type {
  Variants,
  Transition,
  TargetAndTransition,
  VariantLabels,
  MotionProps,
  HTMLMotionProps,
  SVGMotionProps,
  SpringOptions,
  PanInfo,
  DragControls,
  MotionStyle,
  MotionValue,
} from 'framer-motion';
