/**
 * 颜色工具函数
 * 用于处理弹幕颜色对比度和可见性
 */

/**
 * 计算颜色的亮度值 (0-1)
 * 基于 perceived brightness 算法
 */
export function getLuminance(color: string): number {
  // 处理 hex 颜色
  let hex = color.replace('#', '');
  
  // 处理简写形式 (#RGB)
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Gamma correction
  const gammaCorrect = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  return 0.2126 * gammaCorrect(r) + 0.7152 * gammaCorrect(g) + 0.0722 * gammaCorrect(b);
}

/**
 * 根据背景色获取最佳文字颜色
 * 返回黑色或白色以确保对比度
 */
export function getContrastText(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  // WCAG 标准：亮度大于 0.5 使用黑色文字，否则使用白色
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * 确保弹幕颜色在深色背景下的可见性
 * 如果颜色太暗，则提高亮度
 */
export function ensureDanmakuVisibility(color: string, minLuminance: number = 0.4): string {
  const luminance = getLuminance(color);
  
  // 如果颜色足够亮，直接返回
  if (luminance >= minLuminance) {
    return color;
  }
  
  // 否则返回一个明亮的替代色
  const brightColors = [
    '#00D9FF', // 科技蓝
    '#FF6B9D', // 樱花粉
    '#4ECDC4', // 薄荷绿
    '#FFE66D', // 阳光黄
    '#FF6B6B', // 珊瑚红
    '#A855F7', // 紫罗兰
    '#FB923C', // 橙色
    '#FFFFFF', // 白色
  ];
  
  // 找到最接近原色但足够亮的颜色
  return brightColors.reduce((closest, current) => {
    const currentDiff = Math.abs(getLuminance(current) - minLuminance);
    const closestDiff = Math.abs(getLuminance(closest) - minLuminance);
    return currentDiff < closestDiff ? current : closest;
  });
}

/**
 * 增强颜色亮度
 * 用于在保持色调的同时提高可见性
 */
export function brightenColor(color: string, factor: number = 1.5): string {
  let hex = color.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  // 提高亮度
  r = Math.min(255, Math.round(r * factor));
  g = Math.min(255, Math.round(g * factor));
  b = Math.min(255, Math.round(b * factor));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 生成带有发光效果的样式
 */
export function getDanmakuGlowStyle(color: string): React.CSSProperties {
  const brightColor = brightenColor(color, 1.2);
  return {
    color: brightColor,
    textShadow: `
      0 0 6px ${color},
      0 0 12px ${color},
      0 0 20px ${color},
      0 0 2px rgba(0, 0, 0, 0.8)
    `,
  };
}
