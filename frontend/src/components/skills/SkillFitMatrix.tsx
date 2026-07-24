import { CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

export interface SkillFitMatrixProps {
  fit: string[];
  notFit: string[];
}

/**
 * 适合 / 不适合 两列对比卡片。
 * 移动端单列堆叠，桌面端两列。
 */
export default function SkillFitMatrix({ fit, notFit }: SkillFitMatrixProps) {
  const Column = ({
    title,
    items,
    icon: Icon,
    tone,
  }: {
    title: string;
    items: string[];
    icon: typeof CheckCircle;
    tone: 'fit' | 'notFit';
  }) => (
    <div
      className={cn(
        'rounded-lg p-4',
        tone === 'fit'
          ? 'bg-emerald-500/5 border border-emerald-500/20'
          : 'bg-muted/30 border border-glass-border',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          className={cn(
            'w-4 h-4',
            tone === 'fit' ? 'text-emerald-500' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <h3 className="font-display text-base font-bold text-foreground">
          {title}
        </h3>
      </div>
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">—</li>
        ) : (
          items.map((item) => (
            <li key={item} className="text-sm text-foreground/85 leading-relaxed">
              {item}
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <GlassCard padding="md" className="grid gap-4 sm:grid-cols-2">
      <Column title="适合" items={fit} icon={CheckCircle} tone="fit" />
      <Column title="不适合" items={notFit} icon={XCircle} tone="notFit" />
    </GlassCard>
  );
}
