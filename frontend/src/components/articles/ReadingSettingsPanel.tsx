'use client';

/**
 * 阅读设置面板：调整文章正文字号 / 行距 / 字距 / 字体。
 *
 * 常驻 GlassCard 卡片，放在文章详情页侧栏（目录/相关文章）下方；
 * 无侧栏时由详情页放到正文顶部。选择即时生效并持久化 localStorage。
 *
 * 控件复用项目现有模式：分段按钮组（role="group" + aria-pressed，
 * 静态 border 选中态，参照 admin settings 主题三选）。
 */
import { RotateCcw, Type, AlignJustify, MoveHorizontal, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';
import {
  DEFAULT_READING_SETTINGS,
  type ReadingSettings,
} from '@/lib/reading-settings';

/** 各档位的 CSS 值（详情页以 inline style 注入正文容器） */
export const FONT_SIZE_CSS: Record<ReadingSettings['fontSize'], string> = {
  small: '0.9375rem',
  medium: '1.0625rem',
  large: '1.1875rem',
  xlarge: '1.3125rem',
};

export const LINE_HEIGHT_CSS: Record<ReadingSettings['lineHeight'], string> = {
  compact: '1.6',
  comfortable: '1.8',
  relaxed: '2.0',
};

export const LETTER_SPACING_CSS: Record<ReadingSettings['letterSpacing'], string> = {
  normal: '0.02em',
  wide: '0.06em',
};

interface Option<T extends string> {
  value: T;
  label: string;
}

const FONT_SIZE_OPTIONS: Option<ReadingSettings['fontSize']>[] = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '标准' },
  { value: 'large', label: '大' },
  { value: 'xlarge', label: '特大' },
];

const LINE_HEIGHT_OPTIONS: Option<ReadingSettings['lineHeight']>[] = [
  { value: 'compact', label: '紧凑' },
  { value: 'comfortable', label: '舒适' },
  { value: 'relaxed', label: '宽松' },
];

const LETTER_SPACING_OPTIONS: Option<ReadingSettings['letterSpacing']>[] = [
  { value: 'normal', label: '标准' },
  { value: 'wide', label: '加宽' },
];

const FONT_FAMILY_OPTIONS: Option<ReadingSettings['fontFamily']>[] = [
  { value: 'serif', label: '宋体' },
  { value: 'sans', label: '无衬线' },
];

export interface ReadingSettingsPanelProps {
  settings: ReadingSettings;
  onChange: (settings: ReadingSettings) => void;
  cardBgClass?: string;
  textClass?: string;
  mutedTextClass?: string;
  className?: string;
}

export default function ReadingSettingsPanel({
  settings,
  onChange,
  cardBgClass,
  textClass,
  mutedTextClass,
  className,
}: ReadingSettingsPanelProps) {
  /** 分段按钮组：选中态 border-primary + 背景高亮 */
  const renderGroup = <T extends string>(
    icon: React.ReactNode,
    label: string,
    options: Option<T>[],
    value: T,
    onSelect: (v: T) => void
  ) => (
    <div className="space-y-1.5">
      <div className={cn('flex items-center gap-1.5 text-xs', mutedTextClass ?? 'text-muted-foreground')}>
        {icon}
        <span>{label}</span>
      </div>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium border transition-colors',
              value === opt.value
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const isDefault =
    settings.fontSize === DEFAULT_READING_SETTINGS.fontSize &&
    settings.lineHeight === DEFAULT_READING_SETTINGS.lineHeight &&
    settings.letterSpacing === DEFAULT_READING_SETTINGS.letterSpacing &&
    settings.fontFamily === DEFAULT_READING_SETTINGS.fontFamily;

  return (
    <GlassCard
      padding="none"
      className={cn('p-5 xl:p-6 shadow-xl xl:shadow-lg', cardBgClass, className)}
    >
      <div className="space-y-4">
        <h3 className={cn('text-lg font-semibold', textClass ?? 'text-foreground')}>阅读设置</h3>

        {renderGroup(
          <Type className="w-3.5 h-3.5" />,
          '字号',
          FONT_SIZE_OPTIONS,
          settings.fontSize,
          v => onChange({ ...settings, fontSize: v })
        )}

        {renderGroup(
          <AlignJustify className="w-3.5 h-3.5" />,
          '行距',
          LINE_HEIGHT_OPTIONS,
          settings.lineHeight,
          v => onChange({ ...settings, lineHeight: v })
        )}

        {renderGroup(
          <MoveHorizontal className="w-3.5 h-3.5" />,
          '字距',
          LETTER_SPACING_OPTIONS,
          settings.letterSpacing,
          v => onChange({ ...settings, letterSpacing: v })
        )}

        {renderGroup(
          <BookOpen className="w-3.5 h-3.5" />,
          '字体',
          FONT_FAMILY_OPTIONS,
          settings.fontFamily,
          v => onChange({ ...settings, fontFamily: v })
        )}

        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_READING_SETTINGS })}
          disabled={isDefault}
          className={cn(
            'w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md',
            'text-xs font-medium border border-border/60 text-muted-foreground',
            'hover:text-foreground hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          )}
        >
          <RotateCcw className="w-3 h-3" />
          恢复默认
        </button>
      </div>
    </GlassCard>
  );
}
