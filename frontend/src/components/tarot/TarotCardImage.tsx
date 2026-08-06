import { memo, useState } from 'react';
import type { TarotCard } from '@/types/tarot';
import { cn } from '@/lib/utils';

/** AI 生成牌面图基础路径（public/tarot/{id}.webp；WebP 压缩版，体积约为 PNG 的 1/10） */
export const TAROT_IMAGE_BASE = '/tarot/';

/** 每张牌的 AI 牌面图 URL（优先 WebP；旧 PNG 仅作回退） */
export function tarotCardImageSrc(card: TarotCard): string {
  return `${TAROT_IMAGE_BASE}${card.id}.webp`;
}

/** 旧 PNG 回退地址（WebP 缺失/加载失败时使用） */
export function tarotCardImagePngSrc(card: TarotCard): string {
  return `${TAROT_IMAGE_BASE}${card.id}.png`;
}

interface TarotCardImageProps {
  card: TarotCard;
  className?: string;
  /** 加载失败/图片不存在时渲染的回退内容（未提供则不渲染） */
  fallback?: React.ReactNode;
  /** 图片 alt 文案前缀（默认「{牌名} 牌面」） */
  alt?: string;
}

/**
 * AI 生成牌面图组件：优先渲染 public/tarot/{id}.webp（体积优化版），
 * WebP 加载失败时回退同一张牌的 PNG，两者都失败再回退到 fallback
 * （通常是 SVG 符号，保证牌面始终可见）。
 * 用于牌面卡片、词典列表、统计等所有展示场景，保证全站统一走生成的华丽牌面。
 */
const TarotCardImage = memo(function TarotCardImage({
  card,
  className,
  fallback,
  alt,
}: TarotCardImageProps) {
  const [stage, setStage] = useState<'webp' | 'png' | 'failed'>('webp');
  if (stage === 'failed') {return fallback ? <>{fallback}</> : null;}
  return (
    <img
      src={stage === 'webp' ? tarotCardImageSrc(card) : tarotCardImagePngSrc(card)}
      alt={alt ?? `${card.name} 牌面`}
      loading="lazy"
      onError={() =>
        setStage((prev) => (prev === 'webp' ? 'png' : 'failed'))
      }
      className={cn('object-contain drop-shadow-sm', className)}
    />
  );
});

export default TarotCardImage;
