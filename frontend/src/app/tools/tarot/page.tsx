import type { Metadata } from 'next';
import TarotContent from './tarot-content';

export const metadata: Metadata = {
  title: '塔罗牌 - My Awesome Blog',
  description: '在线塔罗占卜：每日指引与三张牌阵，正逆位牌义解读，可选 AI 深度解读。',
};

/** 塔罗占卜（/tools/tarot）：Server 组件，仅挂载 metadata 与客户端编排 */
export default function TarotPage() {
  return <TarotContent />;
}
