import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TarotGlyphProps {
  /** 符号标识：大阿尔克那每牌一个；小阿尔克那用花色（wands/cups/swords/pentacles） */
  glyph: string;
  className?: string;
}

/**
 * 塔罗牌面极简符号库：64×64 线性 SVG，currentColor 着色。
 * 抽象化表达牌面意象，与全站线性图标风格统一。
 */
const TarotGlyph = memo(function TarotGlyph({ glyph, className }: TarotGlyphProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('w-12 h-12', className)}
    >
      {renderGlyph(glyph)}
    </svg>
  );
});

export default TarotGlyph;

function renderGlyph(glyph: string): React.ReactNode {
  switch (glyph) {
    // ===== 大阿尔克那 =====
    case 'fool': // 手杖与行囊
      return (
        <>
          <path d="M22 52 L42 18" />
          <circle cx="45.5" cy="13.5" r="5" />
        </>
      );
    case 'infinity': // 魔术师 · 无限
      return <path d="M32 32c-3-8-18-8-18 0s15 8 18 0c3-8 18-8 18 0s-15 8-18 0z" />;
    case 'crescent': // 女祭司 · 新月
      return <path d="M32 8 A24 24 0 0 0 32 56 A26 26 0 0 1 32 8 Z" />;
    case 'venus': // 女皇 · 金星
      return (
        <>
          <circle cx="32" cy="26" r="11" />
          <path d="M32 37 v15 M25 45 h14" />
        </>
      );
    case 'crown': // 皇帝 · 皇冠
      return (
        <>
          <path d="M14 46 L17 26 L26 35 L32 21 L38 35 L47 26 L50 46 Z" />
          <circle cx="17" cy="21" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="32" cy="16" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="47" cy="21" r="1.6" fill="currentColor" stroke="none" />
        </>
      );
    case 'keys': // 教皇 · 交叉钥匙
      return (
        <>
          <circle cx="21" cy="19" r="5.5" />
          <path d="M24 23 L43 47 M36 39 l3.2 -2.5 M39 43 l3.2 -2.5" />
          <circle cx="43" cy="19" r="5.5" />
          <path d="M40 23 L21 47 M28 39 l-3.2 -2.5 M25 43 l-3.2 -2.5" />
        </>
      );
    case 'heart': // 恋人
      return (
        <path d="M32 50 C21 41 14 34 14 26 C14 19 19 15 25 15 C28.8 15 31 17.3 32 20 C33 17.3 35.2 15 39 15 C45 15 50 19 50 26 C50 34 43 41 32 50 Z" />
      );
    case 'wheel': // 战车 · 车轮
      return (
        <>
          <circle cx="32" cy="32" r="20" />
          <circle cx="32" cy="32" r="4" />
          <path d="M32 16 V48 M16 32 H48 M20.7 20.7 L43.3 43.3 M43.3 20.7 L20.7 43.3" />
        </>
      );
    case 'lion': // 力量 · 狮鬃
      return (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <ellipse
              key={deg}
              cx="32"
              cy="14"
              rx="4"
              ry="7"
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <circle cx="32" cy="32" r="8" />
          <circle cx="28.7" cy="31" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="35.3" cy="31" r="1.3" fill="currentColor" stroke="none" />
          <path d="M32 34 v2.5" />
        </>
      );
    case 'lantern': // 隐士 · 提灯
      return (
        <>
          <path d="M26 16 a6 6 0 0 1 12 0" />
          <rect x="22" y="20" width="20" height="26" rx="5" />
          <path d="M32 27 l4.5 7 -4.5 7 -4.5 -7 z" />
          <path d="M26 50 h12" />
        </>
      );
    case 'fortune-wheel': // 命运之轮
      return (
        <>
          <circle cx="32" cy="32" r="20" />
          <circle cx="32" cy="32" r="9" />
          <path d="M32 12 v11 M32 41 v11 M12 32 h11 M41 32 h11" />
          <circle cx="49.3" cy="22" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="14.7" cy="22" r="1.8" fill="currentColor" stroke="none" />
          <circle cx="32" cy="52" r="1.8" fill="currentColor" stroke="none" />
        </>
      );
    case 'scales': // 正义 · 天平
      return (
        <>
          <path d="M32 10 v34 M14 18 h36" />
          <circle cx="32" cy="18" r="1.8" fill="currentColor" stroke="none" />
          <path d="M14 18 L9 30 M14 18 L19 30" />
          <path d="M9 30 a5 5 0 0 0 10 0" />
          <path d="M50 18 L45 30 M50 18 L55 30" />
          <path d="M45 30 a5 5 0 0 0 10 0" />
          <path d="M24 48 h16" />
        </>
      );
    case 'hanged': // 倒吊人 · T 形架与倒三角
      return (
        <>
          <path d="M20 52 V12 M20 12 h24 M44 12 v8" />
          <path d="M37 24 h14 l-7 13 z" />
        </>
      );
    case 'rose': // 死神 · 玫瑰（五瓣）
      return (
        <>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx="32"
              cy="21"
              rx="5.5"
              ry="8"
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <circle cx="32" cy="32" r="4" />
        </>
      );
    case 'two-cups': // 节制 · 双杯倒水
      return (
        <>
          <path d="M15 16 h14 v6 a7 7 0 0 1 -14 0 z" />
          <path d="M35 34 h14 v6 a7 7 0 0 1 -14 0 z" />
          <path d="M23 26 C30 27 35 29 38 32" />
        </>
      );
    case 'pentagram': // 恶魔 · 倒五角星（韦特牌面为倒置）
      return (
        <g transform="rotate(180 32 32)">
          <circle cx="32" cy="32" r="21" />
          <path d="M32 16 L35.8 26.8 L47.2 27.1 L38.1 34 L41.4 44.9 L32 38.4 L22.6 44.9 L25.9 34 L16.8 27.1 L28.2 26.8 Z" />
        </g>
      );
    case 'lightning': // 高塔 · 闪电
      return <path d="M37 8 L21 34 h9 L26 56 L45 27 h-9 L41 8 z" />;
    case 'eight-star': // 星星 · 八角星
      return (
        <path d="M32 10 L35.1 24.6 L39.8 24.2 L39.4 28.9 L54 32 L39.4 35.1 L39.8 39.8 L35.1 39.4 L32 54 L28.9 39.4 L24.2 39.8 L24.6 35.1 L10 32 L24.6 28.9 L24.2 24.2 L28.9 24.6 Z" />
      );
    case 'moon': // 月亮 · 月相与星
      return (
        <>
          <circle cx="32" cy="32" r="19" />
          <path d="M40 23 A12 12 0 1 0 40 41 A13 13 0 1 1 40 23 Z" />
          <path d="M13 12 v7 M9.5 15.5 h7" />
          <path d="M52 48 v6 M49 51 h6" />
        </>
      );
    case 'sun': // 太阳
      return (
        <>
          <circle cx="32" cy="32" r="10" />
          <path d="M32 8 v7 M32 49 v7 M8 32 h7 M49 32 h7" />
          <path d="M20.7 20.7 L15.7 15.7 M43.3 20.7 L48.3 15.7 M20.7 43.3 L15.7 48.3 M43.3 43.3 L48.3 48.3" />
        </>
      );
    case 'trumpet': // 审判 · 号角
      return (
        <>
          <path d="M38 24 L54 16 V40 L38 32 Z" />
          <path d="M12 34 L38 24 M12 42 L38 32" />
          <circle cx="11" cy="38" r="2.5" />
        </>
      );
    case 'wreath': // 世界 · 月桂花环（虚线拟叶）
      return (
        <>
          <circle cx="32" cy="32" r="20" strokeDasharray="5 7" />
          <circle cx="32" cy="32" r="13.5" strokeDasharray="4 6" />
        </>
      );

    // ===== 小阿尔克那花色 =====
    case 'wands': // 权杖
      return (
        <>
          <path d="M20 48 L44 16" />
          <ellipse cx="46" cy="13" rx="3" ry="5.5" transform="rotate(45 46 13)" />
          <ellipse cx="40" cy="19" rx="2.4" ry="4.4" transform="rotate(45 40 19)" />
        </>
      );
    case 'cups': // 圣杯
      return (
        <>
          <path d="M20 14 h24 v6 a12 12 0 0 1 -24 0 z" />
          <path d="M32 32 v10 M25 46 h14" />
        </>
      );
    case 'swords': // 宝剑
      return (
        <>
          <path d="M32 8 L36.5 15 V38 H27.5 V15 Z" />
          <path d="M22 41 h20 M32 44 v7" />
          <circle cx="32" cy="54" r="2.5" />
        </>
      );
    case 'pentacles': // 星币
      return (
        <>
          <circle cx="32" cy="32" r="20" />
          <path d="M32 21 L34.6 28.4 L42.5 28.6 L36.2 33.4 L38.5 40.9 L32 36.4 L25.5 40.9 L27.8 33.4 L21.5 28.6 L29.4 28.4 Z" />
        </>
      );

    default: // 兜底：八角星
      return (
        <path d="M32 10 L35.1 24.6 L39.8 24.2 L39.4 28.9 L54 32 L39.4 35.1 L39.8 39.8 L35.1 39.4 L32 54 L28.9 39.4 L24.2 39.8 L24.6 35.1 L10 32 L24.6 28.9 L24.2 24.2 L28.9 24.6 Z" />
      );
  }
}
