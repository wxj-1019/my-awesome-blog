'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-api-client';
import Button from '@/components/admin/Button';
import { useToast } from '@/components/admin/Toast';
import ArticleAIAssist from '@/components/admin/writing/ArticleAIAssist';
import type { WritingSession, WritingRevision } from '@/types/writing-session';
import type { ArticleAttachment } from '@/types';
import ArticleEditorForm from '@/components/admin/article-editor/ArticleEditorForm';
import { useArticleEditorForm } from '@/components/admin/article-editor/useArticleEditorForm';
import { applyRevisionToForm } from '../lib/apply-revision';

interface ArticleResponse {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  is_published?: boolean;
  category_ids: string[];
  categories?: { id: string; name: string }[];
  tags?: { id: string }[];
  attachments?: ArticleAttachment[];
}

/**
 * 编辑文章页。
 *
 * 表单 state、输入处理、AI 能力（润色/元信息/摘要）、校验等共享逻辑在
 * useArticleEditorForm / ArticleEditorForm；本页保留编辑页本质差异：
 * 文章数据回填（loadArticle）、写作会话按需创建（ensureSession），
 * 保存/发布统一走 update(articleId)。
 */
export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  const { success, error } = useToast();

  const form = useArticleEditorForm();
  const {
    formData,
    setFormData,
    setTouchedFields,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    loadCategoriesAndTags,
    setLastSaved,
    titleInputRef,
    validateDraftLengths,
    validatePublishInputs,
    buildSubmitData,
  } = form;

  const [isFetchingArticle, setIsFetchingArticle] = useState(true);
  // WritingSession 体系的 AI 协助（选段修改 + 全文建议），替代旧的
  // AIWritingPanel/AIAssistSidebar；会话在文章加载后按需创建（见下方 effect）
  const [writingSession, setWritingSession] = useState<WritingSession | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setIsFetchingArticle(true);
      const article = await adminApi.articles.get(articleId) as ArticleResponse;

      const articleData = {
        title: article.title || '',
        slug: article.slug || '',
        content: article.content || '',
        excerpt: article.excerpt || '',
        cover_image: article.cover_image || '',
        is_published: article.is_published || false,
        category_ids: article.categories?.map((c) => c.id) || [],
        tags: article.tags?.map((t) => t.id) || [],
        attachments: (article.attachments || []).map((att) => ({
          id: att.id,
          name: att.name,
          url: att.url,
          media_type: att.media_type,
          mime_type: att.mime_type ?? null,
          file_size: att.file_size ?? null,
          is_reference: att.is_reference,
          sort_order: att.sort_order,
        }))
      };

      setFormData(articleData);
    } catch (err) {
      console.error('Failed to load article:', err);
      error('加载文章失败');
      router.push('/admin/articles');
    } finally {
      setIsFetchingArticle(false);
    }
  }, [articleId, error, router, setFormData]);

  useEffect(() => {
    loadArticle();
    loadCategoriesAndTags();
  }, [loadArticle, loadCategoriesAndTags]);

  // 为当前文章准备 WritingSession（Phase 2 AI 协助依赖会话）：
  // 优先复用本文章的活动中会话，否则基于文章创建（后端直接置于 editing 阶段）。
  // 失败时静默降级——AI 协助面板不显示，不影响编辑器主流程。
  useEffect(() => {
    let cancelled = false;
    const ensureSession = async () => {
      try {
        const active = await adminApi.writingSessions.active().catch(() => null);
        if (!cancelled && active && active.article_id === articleId && active.stage === 'editing') {
          setWritingSession(active);
          return;
        }
        const created = await adminApi.writingSessions.create(articleId);
        if (!cancelled) {setWritingSession(created);}
      } catch (err) {
        console.error('Failed to init writing session for article:', err);
      }
    };
    ensureSession();
    return () => { cancelled = true; };
  }, [articleId]);

  /**
   * 保存文章（统一入口）。silent=true 供自动保存：条件不满足静默跳过、
   * 长度不足不报错；silent=false 手动保存保留原有校验与 toast。
   */
  const persistDraft = useCallback(async (opts: { silent?: boolean } = {}) => {
    const { silent = false } = opts;
    if (isSubmitting) {return;}
    if (!formData.title.trim() || !formData.content.trim() || !formData.slug.trim()) {return;}
    if (!validateDraftLengths(silent)) {return;}
    try {
      setIsSubmitting(true);
      const submitData = buildSubmitData(formData.is_published);
      await adminApi.articles.update(articleId, submitData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (!silent) {
        success('文章已保存');
      }
    } catch (err: unknown) {
      console.error('Failed to save article:', err);
      const errorMessage = err instanceof Error ? err.message : '保存文章失败';
      error(silent ? `自动保存失败：${errorMessage}` : errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, articleId, isSubmitting, success, error, validateDraftLengths, buildSubmitData, setIsSubmitting, setLastSaved, setHasUnsavedChanges]);

  const handleSaveDraft = useCallback(async () => {
    await persistDraft();
  }, [persistDraft]);

  // ── 自动保存：内容变化后 debounce 2.5s 静默保存 ─────────────────
  useEffect(() => {
    if (!hasUnsavedChanges) {return;}
    const timer = setTimeout(() => {
      void persistDraft({ silent: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, persistDraft]);

  const handlePublish = useCallback(async () => {
    if (isSubmitting) {return;}
    const invalid = validatePublishInputs();
    if (invalid) {
      error(invalid.message);
      if (invalid.focusTitle) {
        titleInputRef.current?.focus();
      }
      return;
    }
    try {
      setIsSubmitting(true);
      const submitData = buildSubmitData(true);
      await adminApi.articles.update(articleId, submitData);
      success('文章已更新并发布');
      setHasUnsavedChanges(false);
      router.push('/admin/articles');
    } catch (err: unknown) {
      console.error('Failed to publish article:', err);
      const errorMessage = err instanceof Error ? err.message : '发布文章失败';
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, success, error, router, validatePublishInputs, buildSubmitData, articleId, setIsSubmitting, setHasUnsavedChanges, titleInputRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePublish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePublish, handleSaveDraft]);

  if (isLoading || isFetchingArticle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-tech-cyan" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-tech-cyan/20" />
          </div>
          <span className="text-foreground/60 font-medium">加载文章...</span>
        </motion.div>
      </div>
    );
  }
  return (
    <div className={`space-y-6 ${form.isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-4">
          <Link href="/admin/articles">
            <Button variant="ghost" size="sm" className="group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回列表
            </Button>
          </Link>
          <div className="h-6 w-px bg-border/50" />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-tech-cyan/10">
                <FileText className="w-5 h-5 text-tech-cyan" />
              </div>
              编辑文章
            </h1>
            <p className="text-sm text-foreground/50 mt-1 ml-11">修改文章内容</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {form.lastSaved && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-foreground/50 bg-background/30 px-3 py-1.5 rounded-lg"
            >
              <Clock className="w-4 h-4" />
              上次保存: {form.lastSaved.toLocaleTimeString()}
            </motion.div>
          )}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2.5 py-1 rounded-full"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                未保存更改
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* AI 协助已迁移到右侧栏 ArticleAIAssist（WritingSession 体系，与新建页一致） */}
      <ArticleEditorForm
        form={form}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        publishCardTitle="保存操作"
        publishButtonLabel={formData.is_published ? '更新并发布' : '发布文章'}
        saveButtonLabel="保存更改"
        saveShortcutLabel="保存文章"
        previewMode="external"
        sidebarExtra={
          /* AI 协助面板：选段修改 + 全文建议（WritingSession 体系，会话就绪后显示） */
          writingSession ? (
            <ArticleAIAssist
              sessionId={writingSession.id}
              content={formData.content}
              selection={form.editorSelection}
              session={writingSession}
              onSessionChange={setWritingSession}
              onApplyRevision={(revision: WritingRevision, replacement?: string) =>
                applyRevisionToForm(
                  revision,
                  replacement,
                  setFormData,
                  setTouchedFields,
                  setHasUnsavedChanges
                )
              }
              busy={form.isAiBusy}
            />
          ) : null
        }
      />
    </div>
  );
}
