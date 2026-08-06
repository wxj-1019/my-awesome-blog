import { memo, useState } from 'react';
import type { TarotCard } from '@/types/tarot';
import { cn } from '@/lib/utils';

/** AI 生成牌面图基础路径（public/tarot/{id}.png；批量生成后存在，缺省回退 SVG 符号） */
export const TAROT_IMAGE_BASE = '/tarot/';

/** 每张牌的 AI 牌面图 URL */
export function tarotCardImageSrc(card: TarotCard): string {
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
 * AI 生成牌面图组件：优先渲染 public/tarot/{id}.png，
 * 图片加载失败或不存在时回退到 fallback（通常是 SVG 符号，保持牌面始终可见）。
 * 用于牌面卡片、词典列表、统计等所有展示场景，保证全站统一走生成的华丽牌面。
 */
const TarotCardImage = memo(function TarotCardImage({
  card,
  className,
  fallback,
  alt,
}: TarotCardImageProps) {
  const [failed, setFailed] = useState(false);
  const src = tarotCardImageSrc(card);
  if (failed) {return fallback ? <>{fallback}</> : null;}
  return (
    <img
      src={src}
      alt={alt ?? `${card.name} 牌面`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-contain drop-shadow-sm', className)}
    />
  );
});

export default TarotCardImage;
