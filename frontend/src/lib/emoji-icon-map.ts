import type { LucideIcon } from 'lucide-react';
import {
  Angry,
  Check,
  CircleHelp,
  Flame,
  Frown,
  Ghost,
  HandMetal,
  Handshake,
  Heart,
  Laugh,
  Meh,
  PartyPopper,
  Rocket,
  Smile,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';

/** 表情/反应条目：API key 为 unicode emoji，展示用 Lucide 图标 + 中文标签 */
export type EmojiIconEntry = {
  key: string;
  icon: LucideIcon;
  label: string;
};

/** 消息反应目录（7 项），key 与后端 API 一致 */
export const REACTION_CATALOG: EmojiIconEntry[] = [
  { key: '❤️', icon: Heart, label: '喜欢' },
  { key: '👍', icon: ThumbsUp, label: '赞同' },
  { key: '👎', icon: ThumbsDown, label: '不赞同' },
  { key: '🔥', icon: Flame, label: '精彩' },
  { key: '😂', icon: Laugh, label: '好笑' },
  { key: '🚀', icon: Rocket, label: '支持' },
  { key: '✨', icon: Sparkles, label: '亮点' },
];

/** 输入框快捷表情目录（16–24 项） */
export const COMPOSER_EMOJI_CATALOG: EmojiIconEntry[] = [
  { key: '😊', icon: Smile, label: '微笑' },
  { key: '😂', icon: Laugh, label: '大笑' },
  { key: '❤️', icon: Heart, label: '爱心' },
  { key: '❓', icon: CircleHelp, label: '疑问' },
  { key: '👍', icon: ThumbsUp, label: '点赞' },
  { key: '🎉', icon: PartyPopper, label: '庆祝' },
  { key: '🔥', icon: Flame, label: '火热' },
  { key: '✨', icon: Sparkles, label: '闪亮' },
  { key: '🚀', icon: Rocket, label: '起飞' },
  { key: '🤘', icon: HandMetal, label: '摇滚' },
  { key: '🤝', icon: Handshake, label: '握手' },
  { key: '⭐', icon: Star, label: '星星' },
  { key: '✅', icon: Check, label: '完成' },
  { key: '❌', icon: X, label: '否定' },
  { key: '😠', icon: Angry, label: '生气' },
  { key: '☹️', icon: Frown, label: '难过' },
  { key: '👻', icon: Ghost, label: '幽灵' },
  { key: '⚡', icon: Zap, label: '闪电' },
  { key: '🏆', icon: Trophy, label: '奖杯' },
  { key: '👎', icon: ThumbsDown, label: '踩' },
];

const reactionByKey = new Map(REACTION_CATALOG.map((entry) => [entry.key, entry]));
const composerByKey = new Map(COMPOSER_EMOJI_CATALOG.map((entry) => [entry.key, entry]));

/** 根据反应 key 获取 Lucide 图标，未知 key 回退为 Meh */
export function getReactionIcon(key: string): LucideIcon {
  return reactionByKey.get(key)?.icon ?? Meh;
}

/** 根据反应 key 获取中文标签，未知 key 回退为「反应」 */
export function getReactionLabel(key: string): string {
  return reactionByKey.get(key)?.label ?? '反应';
}

/** 根据 key 查找输入框表情条目 */
export function getComposerEntry(key: string): EmojiIconEntry | undefined {
  return composerByKey.get(key);
}
