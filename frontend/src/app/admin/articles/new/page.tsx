'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-api-client';
import Button from '@/components/admin/Button';
import { useToast } from '@/components/admin/Toast';
import WritingSessionShell from '@/components/admin/writing/WritingSessionShell';
import ArticleAIAssist from '@/components/admin/writing/ArticleAIAssist';
import type { WritingSession, WritingRevision } from '@/types/writing-session';
import ArticleEditorForm from '@/components/admin/article-editor/ArticleEditorForm';
import { useArticleEditorForm } from '@/components/admin/article-editor/useArticleEditorForm';
import { applyRevisionToForm } from '../lib/apply-revision';

/**
 * 新建文章页。
 *
 * 表单 state、输入处理、AI 能力（润色/元信息/摘要）、校验等共享逻辑在
 * useArticleEditorForm / ArticleEditorForm；本页保留新建页本质差异：
 * Phase 1（AI 对话初稿）→ Phase 2（编辑器）流程、articleIdRef 防重复创建、
 * 写作会话与文章的关联/完成。
 */
export default function NewArticlePage() {
  const router = useRouter();
  const { success, error, info } = useToast();
  const [phase, setPhase] = useState<'chat' | 'editing'>('chat');
  const [writingSession, setWritingSession] = useState<WritingSession | null>(null);

  const form = useArticleEditorForm({ slugMode: 'touched-guard' });
  const {
    formData,
    setFormData,
    setTouchedFields,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    setIsLoading,
    loadCategoriesAndTags,
    setLastSaved,
    titleInputRef,
    validateDraftLengths,
    validatePublishInputs,
    buildSubmitData,
  } = form;

  // 已落库的文章 id：首次保存 create 后记录，后续保存/发布走 update（防重复创建）
  const articleIdRef = useRef<string | null>(null);

  // Phase 1（AI 对话）不需要分类/标签；进入 Phase 2（编辑器）时才加载。
  // 初次进入页面时把 isLoading 关掉，让 Phase 1 直接渲染（Shell 自己管加载态）。
  useEffect(() => {
    if (phase === 'chat' && isLoading) {
      setIsLoading(false);
    }
  }, [phase, isLoading, setIsLoading]);

  // ── Phase 1 → Phase 2：初稿确认回调 ────────────────────────────
  const handleDraftConfirmed = useCallback((draft: string, session: WritingSession) => {
    setWritingSession(session);
    setFormData(prev => ({ ...prev, content: draft }));
    setTouchedFields(prev => new Set(prev).add('content'));
    setPhase('editing');
    info('初稿已确认，开始编辑吧');
    // 进入 Phase 2 才加载分类/标签（Phase 1 不需要）
    loadCategoriesAndTags();
  }, [info, loadCategoriesAndTags, setFormData, setTouchedFields]);

  /**
   * 保存草稿（create/update 统一入口）。
   * silent=true 供自动保存使用：条件不满足静默跳过、长度不足不报错；
   * silent=false 为手动保存：长度校验报错 + toast 提示。
   */
  const persistDraft = useCallback(async (opts: { silent?: boolean } = {}) => {
    const { silent = false } = opts;
    if (isSubmitting) {return;}
    // 自动保存的前置条件：标题/别名/内容均非空（slug 由标题自动生成）
    if (!formData.title.trim() || !formData.content.trim() || !formData.slug.trim()) {return;}
    if (!validateDraftLengths(silent)) {return;}
    try {
      setIsSubmitting(true);
      const submitData = buildSubmitData(false);
      let resultId: string;
      if (articleIdRef.current) {
        // 已创建过 → 更新，避免重复创建草稿
        await adminApi.articles.update(articleIdRef.current, submitData);
        resultId = articleIdRef.current;
      } else {
        const result = await adminApi.articles.create(submitData) as { id: string };
        articleIdRef.current = result.id;
        resultId = result.id;
      }
      // 把写作会话关联到刚落库的文章（仅首次保存且尚未关联时）
      if (writingSession && !writingSession.article_id) {
        try {
          const linked = await adminApi.writingSessions.linkArticle(writingSession.id, resultId);
          setWritingSession(linked);
        } catch (linkErr) {
          // 关联失败不阻塞保存流程，仅记录日志
          console.error('Failed to link writing session to article:', linkErr);
        }
      }
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (!silent) {
        success('草稿已保存');
      }
    } catch (err: unknown) {
      console.error('Failed to save draft:', err);
      const errorMessage = err instanceof Error ? err.message : '保存草稿失败';
      error(silent ? `自动保存失败：${errorMessage}` : errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, writingSession, isSubmitting, success, error, validateDraftLengths, buildSubmitData, setIsSubmitting, setLastSaved, setHasUnsavedChanges]);

  const handleSaveDraft = useCallback(async () => {
    await persistDraft();
  }, [persistDraft]);

  // ── 自动保存：内容变化后 debounce 2.5s 静默保存草稿 ─────────────
  useEffect(() => {
    if (phase !== 'editing') {return;}
    if (!hasUnsavedChanges) {return;}
    const timer = setTimeout(() => {
      void persistDraft({ silent: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, phase, persistDraft]);

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
      // 已保存过草稿 → 发布走 update，避免重复创建文章
      const result = articleIdRef.current
        ? { id: articleIdRef.current } as { id: string }
        : await adminApi.articles.create(submitData) as { id: string };
      if (!articleIdRef.current) {
        articleIdRef.current = result.id;
      } else {
        await adminApi.articles.update(articleIdRef.current, submitData);
      }
      // 发布成功：关联会话并标记完成（非阻塞）
      if (writingSession) {
        if (!writingSession.article_id) {
          try {
            const linked = await adminApi.writingSessions.linkArticle(writingSession.id, result.id);
            setWritingSession(linked);
          } catch (linkErr) {
            console.error('Failed to link writing session to article:', linkErr);
          }
        }
        try {
          await adminApi.writingSessions.complete(writingSession.id);
        } catch (completeErr) {
          console.error('Failed to complete writing session:', completeErr);
        }
      }
      success('文章发布成功');
      setHasUnsavedChanges(false);
      router.push('/admin/articles');
    } catch (err: unknown) {
      console.error('Failed to publish article:', err);
      const errorMessage = err instanceof Error ? err.message : '发布文章失败';
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, success, error, router, validatePublishInputs, buildSubmitData, writingSession, setIsSubmitting, setHasUnsavedChanges, titleInputRef]);

  useEffect(() => {
    // 仅在编辑器阶段响应快捷键：Phase 1（AI 对话）时按 Ctrl+S
    // 不应触发保存草稿（此时表单为空，只会弹错误提示）
    if (phase !== 'editing') {return;}
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
  }, [phase, handlePublish, handleSaveDraft]);

  if (phase === 'editing' && isLoading) {
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
          <span className="text-foreground/60 font-medium">加载编辑器...</span>
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
          <Link
            href="/admin/articles"
            onClick={(e) => {
              // SPA 导航不触发 beforeunload，未保存更改会被静默丢弃，先确认
              if (hasUnsavedChanges && !window.confirm('有未保存的更改，确定离开吗？')) {
                e.preventDefault();
              }
            }}
          >
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
              新建文章
            </h1>
            <p className="text-sm text-foreground/50 mt-1 ml-11">
              {phase === 'chat' ? '先和 AI 聊聊选题，确认初稿后进入编辑' : '创建一篇新的博客文章'}
            </p>
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
      {/* Phase 1：纯 AI 对话；Phase 2：完整编辑器 */}
      {phase === 'chat' ? (
        <div className="max-w-3xl mx-auto glass-card rounded-2xl p-6 md:p-8">
          <WritingSessionShell onDraftConfirmed={handleDraftConfirmed} />
        </div>
      ) : (
        <>
          {/* Phase 2：完整编辑器（顶部 AI 面板已移除，AI 协助改到右侧栏 ArticleAIAssist）*/}
          {/* 图循环回退：编辑阶段发现方向不对，可回到 AI 写作开启新会话（旧内容保留在编辑器） */}
          {writingSession && writingSession.stage !== 'completed' && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  if (hasUnsavedChanges && !window.confirm('有未保存的更改，确定回到 AI 写作吗？')) {
                    return;
                  }
                  setPhase('chat');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground/5 text-foreground/70 hover:bg-foreground/10 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                回到 AI 写作（开启新会话）
              </button>
            </div>
          )}
          <ArticleEditorForm
            form={form}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            publishCardTitle="发布操作"
            publishButtonLabel="发布文章"
            saveButtonLabel="保存草稿"
            saveShortcutLabel="保存草稿"
            previewMode="internal"
            sidebarExtra={
              /* AI 协助面板：选段修改 + 全文建议（仅 Phase 2 且有写作会话时显示） */
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
        </>
      )}
    </div>
  );
}
