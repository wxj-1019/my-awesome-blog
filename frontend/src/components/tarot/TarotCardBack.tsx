import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TarotCardBackProps {
  className?: string;
}

/**
 * 塔罗牌背：星月纹样（SVG，token 渐变底）。
 * 与牌面同尺寸使用（外层给 aspect-[2/3]，匹配 AI 生成图 720×1080），图案自身填满。
 */
const TarotCardBack = memo(function TarotCardBack({ className }: TarotCardBackProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-xl border border-border shadow-md',
        className
      )}
      style={{
        background:
          'linear-gradient(160deg, color-mix(in srgb, var(--tech-deepblue) 24%, var(--card)), color-mix(in srgb, var(--tech-purple) 18%, var(--card)))',
      }}
    >
      {/* 内框装饰线 */}
      <div
        className="pointer-events-none absolute inset-1 rounded-lg border border-glass-border"
        aria-hidden
      />
      <svg
        viewBox="0 0 64 100"
        className="absolute inset-0 h-full w-full text-tech-purple/70"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* 中央八角星 */}
        <g transform="translate(32 50) scale(0.5) translate(-32 -32)">
          <path d="M32 10 L35.1 24.6 L39.8 24.2 L39.4 28.9 L54 32 L39.4 35.1 L39.8 39.8 L35.1 39.4 L32 54 L28.9 39.4 L24.2 39.8 L24.6 35.1 L10 32 L24.6 28.9 L24.2 24.2 L28.9 24.6 Z" />
        </g>
        {/* 左上新月 */}
        <g transform="translate(16 20) scale(0.26) translate(-32 -32)">
          <path d="M32 8 A24 24 0 0 0 32 56 A26 26 0 0 1 32 8 Z" />
        </g>
        {/* 底部小菱形 */}
        <path d="M32 88 l4 4 -4 4 -4 -4 z" />
        {/* 散落星点 */}
        <circle cx="12" cy="38" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="52" cy="26" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="50" cy="68" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="14" cy="72" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="44" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
});

export default TarotCardBack;
