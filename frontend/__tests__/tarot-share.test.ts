import { buildSpreadSvg } from '@/lib/tarot-share';
import { getSpread, tarotDeck } from '@/mock/tarot';
import type { DrawnCard } from '@/types/tarot';

const moon = tarotDeck.find((c) => c.id === 'moon')!;
const sun = tarotDeck.find((c) => c.id === 'sun')!;

describe('buildSpreadSvg · 牌阵分享图', () => {
  it('SVG 含问题、牌阵名、牌名与朝向', () => {
    const drawn: DrawnCard[] = [
      { card: moon, isReversed: true },
      { card: sun, isReversed: false },
    ];
    const svg = buildSpreadSvg({
      question: '最近的工作会顺利吗？',
      spread: getSpread('three'),
      drawn,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('最近的工作会顺利吗？');
    expect(svg).toContain(getSpread('three').name);
    expect(svg).toContain('月亮');
    expect(svg).toContain('逆位');
    expect(svg).toContain('太阳');
    expect(svg).toContain('正位');
  });

  it('问题为空时用牌阵名作为标题', () => {
    const svg = buildSpreadSvg({
      question: '',
      spread: getSpread('single'),
      drawn: [{ card: moon, isReversed: false }],
    });
    expect(svg).toContain(getSpread('single').name);
  });

  it('XML 特殊字符被转义（防注入）', () => {
    const svg = buildSpreadSvg({
      question: '<script>alert(1)</script>',
      spread: getSpread('single'),
      drawn: [{ card: moon, isReversed: false }],
    });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('含站点水印与免责声明', () => {
    const svg = buildSpreadSvg({
      question: '',
      spread: getSpread('single'),
      drawn: [{ card: moon, isReversed: false }],
    });
    expect(svg).toContain('仅供娱乐与自我觉察参考');
  });
});
