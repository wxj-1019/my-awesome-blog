'use client';

import { Clapperboard, ImageIcon, ImageOff, RotateCcw, Trash2 } from 'lucide-react';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

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

/** 提示词过长截断 */
function truncatePrompt(text: string): string {
  return text.length > 30 ? `${text.slice(0, 30)}…` : text;
}

interface HistoryListProps {
  entries: GenHistoryEntry[];
  onRestore: (entry: GenHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

/** 画布「历史」tab 宽版列表：点击恢复、单条删除、清空（数据源与 GenDrawer 抽屉一致） */
export default function HistoryList({ entries, onRestore, onDelete, onClear }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <ImageOff className="h-8 w-8 text-muted-foreground/50" aria-hidden />
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
            <li key={entry.id} className="group flex items-center gap-3 rounded-lg border border-border p-2.5">
              <button
                type="button"
                onClick={() => onRestore(entry)}
                aria-label={`恢复记录：${entry.prompt}`}
                className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {entry.kind === 'image' && first ? (
                  <span className="block h-16 w-16 overflow-hidden rounded-md border border-border">
                    <img
                      src={first}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                    {entry.kind === 'video' ? (
                      <Clapperboard className="h-5 w-5" aria-hidden />
                    ) : (
                      <ImageOff className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block truncate text-sm text-foreground">
                  {truncatePrompt(entry.prompt)}
                </span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
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

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRestore(entry)}
                  aria-label="恢复"
                  title="恢复此记录"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  aria-label="删除"
                  title="删除此记录"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
