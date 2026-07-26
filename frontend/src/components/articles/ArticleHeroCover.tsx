'use client';

import Image from 'next/image';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ArticleHeroCoverProps {
  /** 封面地址；缺省时由调用方传默认封面 */
  src: string;
  alt: string;
}

/**
 * 文章详情顶部封面（替代原视频媒体区）：
 * - object-cover 永远占满容器，无比例冲突
 * - Ken Burns 缓推（慢速缩放+平移）营造「动态图片」感
 * - 底部渐变收光，保证与下方标题区的过渡
 * - prefers-reduced-motion → 静态封面
 */
export default function ArticleHeroCover({ src, alt }: ArticleHeroCoverProps) {
  const reduced = useReducedMotion();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style jsx>{`
        /* 阶段 B：多节点缓推路径 + 呼吸曲线，镜头感从「往返推镜」变为「缓慢游移」 */
        @keyframes hero-kenburns {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
          }
          30% {
            transform: scale(1.05) translate3d(-0.8%, -1%, 0);
          }
          55% {
            transform: scale(1.08) translate3d(-1.2%, -1.5%, 0);
          }
          80% {
            transform: scale(1.03) translate3d(-0.4%, -0.5%, 0);
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
          }
        }
        .hero-kenburns {
          animation: hero-kenburns 32s var(--ease-breathe) infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-kenburns {
            animation: none;
          }
        }
      `}</style>

      <div className={reduced ? 'relative h-full w-full' : 'hero-kenburns relative h-full w-full'}>
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover"
        />
      </div>

      {/* 底部渐变收光：融入下方标题区 */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/85 via-background/30 to-transparent"
        aria-hidden
      />
    </div>
  );
}
