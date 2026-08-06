'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from '@/lib/framer-motion';
import {
  Clapperboard,
  History,
  ImageIcon,
  ImageOff,
  RefreshCw,
  RotateCcw,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import type { GenHistoryEntry } from '@/lib/image-gen-history';
import type { RunningHubAccount } from '@/lib/api/imageGen';

/** 账户信息加载状态 */
export type AccountLoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; account: RunningHubAccount }
  | { status: 'error'; message: string };

interface GenDrawerProps {
  /** 抽屉开关（由父组件控制） */
  isOpen: boolean;
  onClose: () => void;
  /** 悬浮按钮点击切换开关（打开或关闭抽屉） */
  onToggle: () => void;
  /** 持久化历史（父组件持有并写入 localStorage） */
  entries: GenHistoryEntry[];
  /** 点击历史条目恢复生成（回填表单并展示结果） */
  onRestore: (entry: GenHistoryEntry) => void;
  /** 删除单条历史 */
  onDelete: (id: string) => void;
  /** 清空全部历史 */
  onClear: () => void;
  /** 账户信息状态（父组件负责 fetch） */
  accountState: AccountLoadState;
  /** 手动刷新账户 */
  onRefreshAccount: () => void;
}

/** 相对时间：x 分钟前 / x 小时前 / 日期 */
function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) {return '刚刚';}
  if (diff < 3_600_000) {return `${Math.floor(diff / 60_000)} 分钟前`;}
  if (diff < 86_400_000) {return `${Math.floor(diff / 3_600_000)} 小时前`;}
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 历史条目提示词过长时截断显示 */
function truncatePrompt(text: string): string {
  return text.length > 30 ? `${text.slice(0, 30)}…` : text;
}

/**
 * 生成记录抽屉：右下角悬浮按钮 + 右侧滑入面板。
 * 内含「历史记录 / 账户」两个 Tab：历史支持点击恢复、单条删除、清空；
 * 账户展示 RH 币/余额/运行中任务（数据由父组件经后端代理获取）。
 */
export default function GenDrawer({
  isOpen,
  onClose,
  onToggle,
  entries,
  onRestore,
  onDelete,
  onClear,
  accountState,
  onRefreshAccount,
}: GenDrawerProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'account'>('history');
  const shouldReduceMotion = useReducedMotion();

  // Escape 关闭 + 锁滚动（与 MobileDrawer 一致）
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const panelTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : { type: 'spring' as const, stiffness: 260, damping: 24 };

  const overlayTransition = { duration: shouldReduceMotion ? 0.1 : 0.25 };

  return (
    <>
      {/* 右下角悬浮按钮（始终可见，带历史条数徽标；点击切换抽屉开关） */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="打开生成记录"
        aria-expanded={isOpen}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
          'transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <History className="h-5 w-5" aria-hidden />
        {entries.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-tech-purple px-1 text-[10px] font-semibold text-white">
            {entries.length > 99 ? '99+' : entries.length}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              key="gen-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayTransition}
              onClick={onClose}
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* 抽屉面板 */}
            <motion.aside
              key="gen-drawer-panel"
              initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%', opacity: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%', opacity: 0.95 }}
              transition={panelTransition}
              role="dialog"
              aria-modal="true"
              aria-label="生成记录"
              className="fixed right-0 top-0 bottom-0 z-[90] w-full sm:w-[420px] border-l border-border bg-popover text-foreground backdrop-blur-xl"
            >
              <div className="flex h-full flex-col">
                {/* 头部：标题 + 关闭 */}
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h2 className="text-base font-semibold text-foreground">
                    生成记录
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="关闭"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                {/* Tab：历史记录 / 账户 */}
                <div className="flex gap-1.5 border-b border-border p-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    aria-pressed={activeTab === 'history'}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      activeTab === 'history'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <History className="h-4 w-4" aria-hidden />
                    历史记录
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('account')}
                    aria-pressed={activeTab === 'account'}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      activeTab === 'account'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Wallet className="h-4 w-4" aria-hidden />
                    账户
                  </button>
                </div>

                {/* 内容区 */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === 'history' ? (
                    <HistoryTab
                      entries={entries}
                      onRestore={onRestore}
                      onDelete={onDelete}
                      onClear={onClear}
                    />
                  ) : (
                    <AccountTab state={accountState} onRefresh={onRefreshAccount} />
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- 历史 Tab ---------------- */

function HistoryTab({
  entries,
  onRestore,
  onDelete,
  onClear,
}: {
  entries: GenHistoryEntry[];
  onRestore: (entry: GenHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
        <History className="h-8 w-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">还没有生成记录</p>
        <p className="text-xs text-muted-foreground/60">生成图片或视频后会自动保存在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">共 {entries.length} 条，点击可恢复</p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          清空
        </button>
      </div>

      <ul className="space-y-2">
        {entries.map((entry) => {
          const first = entry.images[0];
          return (
            <li key={entry.id} className="group flex items-center gap-3 rounded-lg border border-border p-2">
              {/* 缩略图：图片取首图；视频显示播放图标（加载失败回退占位） */}
              <button
                type="button"
                onClick={() => onRestore(entry)}
                aria-label={`恢复记录：${entry.prompt}`}
                className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {entry.kind === 'image' && first ? (
                  <span className="block h-14 w-14 overflow-hidden rounded-md border border-border">
                    <img
                      src={first}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                    {entry.kind === 'video' ? (
                      <Clapperboard className="h-4 w-4" aria-hidden />
                    ) : (
                      <ImageOff className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                )}
              </button>

              {/* 内容 */}
              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block truncate text-sm text-foreground">
                  {truncatePrompt(entry.prompt)}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    {entry.kind === 'video' ? (
                      <>
                        <Clapperboard className="h-3 w-3" aria-hidden />
                        视频
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3" aria-hidden />
                        {entry.count ?? 1} 张
                      </>
                    )}
                  </span>
                  <span>{formatTime(entry.createdAt)}</span>
                </span>
              </button>

              {/* 操作 */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRestore(entry)}
                  aria-label="恢复"
                  title="恢复此记录"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  aria-label="删除"
                  title="删除此记录"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- 账户 Tab ---------------- */

function AccountTab({
  state,
  onRefresh,
}: {
  state: AccountLoadState;
  onRefresh: () => void;
}) {
  const renderStats = useCallback(
    (account: RunningHubAccount) => (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="RH 币" value={account.remain_coins} />
          <StatCard label="运行中任务" value={account.current_task_counts} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="钱包余额"
            value={account.remain_money ? `${account.remain_money} ${account.currency ?? ''}`.trim() : '—'}
          />
          <StatCard label="API 类型" value={account.api_type} />
        </div>
      </div>
    ),
    []
  );

  if (state.status === 'loading') {
    return (
      <div className="space-y-3 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
        <p role="alert" className="text-sm text-error">{state.message}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          重试
        </button>
      </div>
    );
  }

  if (state.status === 'success') {
    return (
      <div className="space-y-3">
        {renderStats(state.account)}
        <p className="text-xs text-muted-foreground">
          RunningHub 账户概览，数据每 30 秒自动刷新
        </p>
      </div>
    );
  }

  // idle（尚未加载）：提示打开时自动加载
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <Wallet className="h-8 w-8 text-muted-foreground/50" aria-hidden />
      <p className="text-sm text-muted-foreground">打开账户页自动加载</p>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        加载账户信息
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-lg font-semibold text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}
