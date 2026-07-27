'use client';

/**
 * 封面配图自动搜索组件。
 *
 * 流程：点「AI 找封面」→ AI 读文章生成英文搜索词 → 调 Unsplash →
 *      展示候选图网格 → 用户点选 → 回调 onPick(url) 填入 cover_image。
 *
 * 图片来源为 Unsplash（外部域名，不可控），按 frontend-rules §9 例外
 * 保留裸 <img>，并在旁加中文注释说明原因。
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { ImagePlus, Search, Loader2, X, ExternalLink, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';
import { useToast } from '@/components/admin/Toast';
import { cn } from '@/lib/utils';

interface CoverImage {
  url: string;
  thumb_url: string;
  alt: string;
  author_name: string;
  author_url: string;
}

export interface CoverPickerProps {
  /** 文章正文，AI 据此生成搜索词 */
  content: string;
  /** 选中图片后回调，写入 cover_image */
  onPick: (url: string) => void;
  /** 外部繁忙态（润色/生成元信息进行中时禁用） */
  busy?: boolean;
}

export default function CoverPicker({ content, onPick, busy = false }: CoverPickerProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  /** 当前搜索词展示（AI 生成后回填到输入框，可编辑后重搜） */
  const [activeQuery, setActiveQuery] = useState('');
  const [images, setImages] = useState<CoverImage[]>([]);

  const doSearch = useCallback(async (q?: string) => {
    if (!content.trim()) {
      toastError('请先输入文章内容');
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.agent.suggestCover(content, q);
      setActiveQuery(res.query);
      setQuery(res.query);
      setImages(res.images);
      if (res.images.length === 0) {
        toastError('没有找到匹配的图片，换个关键词试试');
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : '封面搜索失败');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [content, toastError]);

  /** 打开面板即触发首次搜索（AI 生词） */
  const handleOpen = useCallback(() => {
    setOpen(true);
    if (images.length === 0 && !loading) {
      void doSearch();
    }
  }, [images.length, loading, doSearch]);

  const handlePick = useCallback((url: string) => {
    onPick(url);
    toastSuccess('已应用为封面');
    setOpen(false);
  }, [onPick, toastSuccess]);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleOpen}
        disabled={busy || !content.trim()}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-cat-4/10 text-cat-4 hover:bg-cat-4/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="AI 自动搜索封面图"
      >
        <ImagePlus className="w-3.5 h-3.5" />
        AI 找封面
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 p-4 rounded-xl bg-background/40 border border-border/40 overflow-hidden"
          >
            {/* 搜索词栏：AI 生成后可编辑重搜 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && query.trim()) {
                      e.preventDefault();
                      void doSearch(query.trim());
                    }
                  }}
                  placeholder="搜索关键词（AI 已生成，可编辑后回车重搜）"
                  aria-label="封面搜索关键词"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-background/60 border border-border/50 text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => void doSearch(query.trim() || undefined)}
                disabled={loading}
                aria-label="重新搜索"
                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {loading ? '搜索中' : '搜索'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭封面搜索"
                className="shrink-0 p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 候选图网格 */}
            {loading && images.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-foreground/50 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                AI 正在生成搜索词并检索图片…
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-foreground/50 text-sm">
                <ImagePlus className="w-8 h-8 mb-2 opacity-40" />
                没有候选图，换个关键词试试
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {images.map((img, i) => (
                  <button
                    key={img.url + i}
                    type="button"
                    onClick={() => handlePick(img.url)}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-border/40 hover:border-primary hover:ring-2 hover:ring-primary/30 transition-all"
                    title={img.alt || '选为封面'}
                    aria-label={`选择图片：${img.alt || '候选封面'}`}
                  >
                    {/* Unsplash 外部域名，不可控，按 frontend-rules §9 例外用 <img> */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumb_url}
                      alt={img.alt || '候选封面'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* 悬停遮罩：作者署名（Unsplash License 要求标注） */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      {img.author_name && (
                        <span className="text-[10px] text-white/90 truncate">
                          📷 {img.author_name}
                        </span>
                      )}
                      <span className="text-[10px] text-primary-foreground/90 mt-0.5">
                        点击选为封面
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Unsplash License 声明 */}
            {images.length > 0 && (
              <p className="mt-3 text-[11px] text-foreground/40 flex items-center gap-1">
                图片来自
                <a
                  href="https://unsplash.com/license"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary/70 hover:text-primary underline underline-offset-2"
                >
                  Unsplash License <ExternalLink className="w-2.5 h-2.5" />
                </a>
                · 免费商用，建议保留作者署名
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
