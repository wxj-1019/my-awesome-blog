/**
 * 塔罗牌阵分享图（SVG 生成，零图片依赖）。
 * 生成可独立打开/转 PNG 的 SVG 字符串。
 */

import { orientationLabel } from '@/lib/tarot';
import { tarotDeck } from '@/mock/tarot';
import type { DrawnCard, TarotSpread } from '@/types/tarot';

interface BuildSpreadSvgOptions {
  question: string;
  spread: TarotSpread;
  drawn: DrawnCard[];
  /** 站点水印，默认站名 */
  siteName?: string;
}

/** 卡片尺寸常量 */
const CARD_W = 90;
const CARD_H = 150;
const CARD_GAP = 24;
const PADDING = 32;

/**
 * 生成牌阵分享 SVG 字符串。
 * 布局：标题（问题/牌阵名）+ 横排卡片（编号+牌名+朝向+关键词）+ 底部水印。
 */
export function buildSpreadSvg({
  question,
  spread,
  drawn,
  siteName = 'My Awesome Blog',
}: BuildSpreadSvgOptions): string {
  const cardsWidth = drawn.length * CARD_W + (drawn.length - 1) * CARD_GAP;
  const width = Math.max(cardsWidth + PADDING * 2, 360);
  const titleY = 56;
  const cardsY = 96;
  const footerY = cardsY + CARD_H + 40;
  const height = footerY + 24;

  const title = question.trim() || spread.name;

  const cardShapes = drawn
    .map((d, i) => {
      const x = PADDING + i * (CARD_W + CARD_GAP) + (width - PADDING * 2 - cardsWidth) / 2;
      const card = d.card;
      const position = spread.positions[i] ?? `第 ${i + 1} 张`;
      const orientation = orientationLabel(d.isReversed);
      // 截断过长文本
      const name = card.name;
      const en = card.nameEn.length > 16 ? card.nameEn.slice(0, 15) + '…' : card.nameEn;
      const rotate = d.isReversed ? 180 : 0;
      return `
    <g transform="translate(${x.toFixed(1)} ${cardsY})">
      <rect width="${CARD_W}" height="${CARD_H}" rx="10" fill="#ffffff" stroke="#0f172a" stroke-opacity="0.15" />
      <text x="${CARD_W / 2}" y="20" font-size="11" text-anchor="middle" fill="#64748b" font-family="sans-serif">${escapeXml(position)}</text>
      <g transform="rotate(${rotate} ${CARD_W / 2} ${CARD_H / 2})">
        <text x="${CARD_W / 2}" y="${CARD_H / 2}" font-size="14" font-weight="600" text-anchor="middle" fill="#0f172a" font-family="sans-serif">${escapeXml(name)}</text>
        <text x="${CARD_W / 2}" y="${CARD_H / 2 + 18}" font-size="10" text-anchor="middle" fill="#64748b" font-family="sans-serif">${escapeXml(en)}</text>
      </g>
      <text x="${CARD_W / 2}" y="${CARD_H - 8}" font-size="11" text-anchor="middle" fill="${d.isReversed ? '#c2410c' : '#15803d'}" font-family="sans-serif">${escapeXml(orientation)}</text>
    </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#0c1220" />
  <text x="${width / 2}" y="${titleY}" font-size="20" font-weight="700" text-anchor="middle" fill="#5eead4" font-family="sans-serif">${escapeXml(title)}</text>
  <text x="${width / 2}" y="${titleY + 22}" font-size="12" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">${escapeXml(spread.name)} · 韦特塔罗</text>${cardShapes}
  <text x="${width / 2}" y="${footerY}" font-size="11" text-anchor="middle" fill="#475569" font-family="sans-serif">${escapeXml(siteName)} · 仅供娱乐与自我觉察参考</text>
</svg>`;
}

/** XML 特殊字符转义 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 把 SVG 字符串转为 PNG Blob（用 canvas 栖栅化）。
 * 浏览器环境用 Image + canvas.drawImage；失败抛错。
 */
export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas 2d 上下文不可用'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {resolve(pngBlob);} else {reject(new Error('PNG 转换失败'));}
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG 加载失败'));
    };
    img.src = url;
  });
}

/** 触发浏览器下载（生成临时 a 标签点击） */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 默认导出：用于「随机一张」等不需 question 的场景取牌名 */
export function cardNameById(id: string): string | undefined {
  return tarotDeck.find((c) => c.id === id)?.name;
}
