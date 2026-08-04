'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Sparkles, X, Check, FileText, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showcaseSkills } from '@/mock/skills';
import type { ShowcaseSkill } from '@/types/skill';
import { Badge } from '@/components/ui/Badge';

/** 领域标签 → Badge 变体（复用 SkillCard 的映射） */
const domainVariant: Record<ShowcaseSkill['domain'], 'default' | 'secondary' | 'outline'> = {
  前端: 'default',
  后端: 'secondary',
  通用: 'outline',
};

/** 收藏类型 → Badge 变体 */
const kindVariant: Record<ShowcaseSkill['kind'], 'default' | 'secondary'> = {
  skill: 'default',
  mcp: 'secondary',
};

/** 收藏类型 → 徽章文案 */
const kindLabel: Record<ShowcaseSkill['kind'], string> = {
  skill: 'Skill',
  mcp: 'MCP',
};

type FilterDomain = '全部' | ShowcaseSkill['domain'];

const FILTERS: FilterDomain[] = ['全部', '前端', '后端', '通用'];

export interface SkillPickerDialogProps {
  /** 弹窗是否打开 */
  isOpen: boolean;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 选中某个 skill 后回调 */
  onSelect: (skill: ShowcaseSkill) => void;
  /** 当前已选 skill 的 slug（用于高亮） */
  currentSlug?: string | null;
}

/**
 * Skill 选用弹窗：在 chat 页内弹出，列出收藏的 skill / mcp，
 * 选中后将其内容注入当前对话作为 system 消息。
 * 动画/overlay 模式参考 ConfirmDialog，配色走 design token。
 */
export default function SkillPickerDialog({
  isOpen,
  onClose,
  onSelect,
  currentSlug,
}: SkillPickerDialogProps) {
  const [filter, setFilter] = useState<FilterDomain>('全部');

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) {return;}
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    window.addEventListener('keydown', handleKey);
    // 打开时锁定背景滚动
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const visibleSkills = useMemo(() => {
    if (filter === '全部') {return showcaseSkills;}
    return showcaseSkills.filter((s) => s.domain === filter);
  }, [filter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 + 居中容器：用 flex 包裹面板，避免 translate-y 居中时长内容溢出顶部 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            {/* 面板：阻止点击事件冒泡到遮罩导致误关闭 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-glass-border bg-glass backdrop-blur-xl shadow-2xl">
              {/* 标题栏 */}
              <div className="flex items-center justify-between border-b border-glass-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      选择 AI 工具
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      选中后将作为当前对话的系统提示
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-glass hover:text-foreground"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {/* 筛选栏 */}
              <div className="flex flex-wrap gap-2 border-b border-glass-border px-6 py-3">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      filter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-glass-border bg-glass/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* 列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-3">
                  {visibleSkills.map((skill) => {
                    const isActive = skill.slug === currentSlug;
                    const hasContent = Boolean(skill.contentPath);
                    return (
                      <button
                        key={skill.slug}
                        onClick={() => onSelect(skill)}
                        className={cn(
                          'group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                          isActive
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-glass-border bg-glass/50 hover:border-primary/40 hover:bg-glass'
                        )}
                      >
                        {/* 名称 + 徽章 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                              {skill.name}
                            </h3>
                            <Badge variant={kindVariant[skill.kind]} className="shrink-0">
                              {kindLabel[skill.kind]}
                            </Badge>
                            <Badge variant={domainVariant[skill.domain]} className="shrink-0">
                              {skill.domain}
                            </Badge>
                            {/* 正文可用性提示 */}
                            {hasContent ? (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" aria-hidden /> SKILL.md 全文
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
                                <FileWarning className="h-3 w-3" aria-hidden /> 注入描述
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-1 text-sm font-medium text-foreground/80">
                            {skill.tagline}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {skill.description}
                          </p>
                        </div>
                        {/* 选中态标记 */}
                        {isActive && (
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" aria-hidden />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 底栏提示 */}
              <div className="border-t border-glass-border px-6 py-3 text-xs text-muted-foreground">
                提示：带 SKILL.md 全文的 skill 将注入完整正文；无正文的将注入描述与亮点。
              </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
