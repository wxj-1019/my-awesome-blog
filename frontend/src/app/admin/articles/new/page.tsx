'use client';

// TipTap 所见即所得编辑器：客户端专用，dynamic 关闭 SSR
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(
  () => import('@/components/admin/article-editor/TiptapEditor'),
  { ssr: false, loading: () => <div className="h-[420px] rounded-xl border border-border/50 bg-background/50 animate-pulse" /> }
);
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Loader2,
  FileText,
  Image as ImageIcon,
  Tag as TagIcon,
  FolderTree,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  Search,
  Wand2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/admin-api-client';
import { generateSlug } from '@/lib/slug';
import Button from '@/components/admin/Button';
import FormInput from '@/components/admin/FormInput';
import { useToast } from '@/components/admin/Toast';
import GlassCardAdmin from '@/components/ui/GlassCardAdmin';
import WritingSessionShell from '@/components/admin/writing/WritingSessionShell';
import ArticleAIAssist from '@/components/admin/writing/ArticleAIAssist';
import CoverPicker from '@/components/admin/CoverPicker';
import {
  ArticlePreview,
  generateExcerpt,
  MIN_TITLE_LENGTH,
  MIN_CONTENT_LENGTH,
  countWords,
  estimateReadingMinutes,
  type EditorMode,
} from '@/components/admin/article-editor/shared';
import {
  ArticleAttachmentsEditor,
  type AttachmentDraft,
} from '@/components/admin/article-editor/ArticleAttachmentsEditor';
import type { WritingSession, WritingRevision } from '@/types/writing-session';
interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}
interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}
export default function NewArticlePage() {
  const router = useRouter();
  const { success, error, info } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'chat' | 'editing'>('chat');
  const [writingSession, setWritingSession] = useState<WritingSession | null>(null);
  const [editorSelection, setEditorSelection] = useState({ text: '', start: 0, end: 0 });
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image: '',
    is_published: false,
    category_ids: [] as string[],
    tags: [] as string[],
    attachments: [] as AttachmentDraft[]
  });
  // 已落库的文章 id：首次保存 create 后记录，后续保存/发布走 update（防重复创建）
  const articleIdRef = useRef<string | null>(null);
  const stats = {
    charCount: formData.content.length,
    wordCount: countWords(formData.content).total,
    readingTime: estimateReadingMinutes(formData.content),
    titleLength: formData.title.length
  };
  const formProgress = {
    title: formData.title.length >= MIN_TITLE_LENGTH,
    content: formData.content.length >= MIN_CONTENT_LENGTH,
    category: formData.category_ids.length > 0,
    tags: formData.tags.length > 0,
    excerpt: formData.excerpt.length > 0
  };
  const progressPercentage = Math.round(
    (Object.values(formProgress).filter(Boolean).length / Object.keys(formProgress).length) * 100
  );
  const validationErrors = {
    title: touchedFields.has('title') && formData.title.length < MIN_TITLE_LENGTH,
    content: touchedFields.has('content') && formData.content.length < MIN_CONTENT_LENGTH
  };
  const loadCategoriesAndTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        adminApi.categories.list(),
        adminApi.tags.list()
      ]);
      setCategories((categoriesData as Category[]) || []);
      setTags((tagsData as Tag[]) || []);
    } catch (err) {
      console.error('Failed to load categories and tags:', err);
      error('加载分类和标签失败');
    } finally {
      setIsLoading(false);
    }
  }, [error]);
  // Phase 1（AI 对话）不需要分类/标签；进入 Phase 2（编辑器）时才加载。
  // 初次进入页面时把 isLoading 关掉，让 Phase 1 直接渲染（Shell 自己管加载态）。
  useEffect(() => {
    if (phase === 'chat' && isLoading) {
      setIsLoading(false);
    }
  }, [phase, isLoading]);
  // 注意：脏标记（hasUnsavedChanges）只在用户实际编辑时设置（见各 onChange 处理），
  // 不能在 effect 里根据 content 非空推断——否则 AI 确认初稿后还没动手就提示“未保存”。
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  // 用户手动改过 slug 后，标题输入不再覆盖 slug
  const slugTouchedRef = useRef(false);
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setTouchedFields(prev => new Set(prev).add('title'));
    setHasUnsavedChanges(true);
    setFormData(prev => ({
      ...prev,
      title,
      slug: slugTouchedRef.current ? prev.slug : generateSlug(title)
    }));
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'slug') {slugTouchedRef.current = true;}
    setTouchedFields(prev => new Set(prev).add(name));
    setHasUnsavedChanges(true);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleTagToggle = (tagId: string) => {
    setHasUnsavedChanges(true);
    setFormData(prev => {
      const newTags = prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId];
      return { ...prev, tags: newTags };
    });
  };
  const handleAutoExcerpt = () => {
    const excerpt = generateExcerpt(formData.content);
    setHasUnsavedChanges(true);
    setFormData(prev => ({ ...prev, excerpt }));
    info('已自动生成摘要');
  };

  // ── Phase 1 → Phase 2：初稿确认回调 ────────────────────────────
  const handleDraftConfirmed = useCallback((draft: string, session: WritingSession) => {
    setWritingSession(session);
    setFormData(prev => ({ ...prev, content: draft }));
    setTouchedFields(prev => new Set(prev).add('content'));
    setPhase('editing');
    info('初稿已确认，开始编辑吧');
    // 进入 Phase 2 才加载分类/标签（Phase 1 不需要）
    loadCategoriesAndTags();
  }, [info, loadCategoriesAndTags]);

  // ── AI 写作能力 ────────────────────────────────────────────────
  const [isAiBusy, setIsAiBusy] = useState(false);

  /** AI 润色：对编辑器全文做风格优化，流式替换 */
  const aiPolishRef = useRef<(() => void) | null>(null);
  const [polishing, setPolishing] = useState(false);
  const handleAiPolish = useCallback(() => {
    if (!formData.content.trim() || polishing) {return;}
    setPolishing(true);
    setIsAiBusy(true);
    let accumulated = '';
    const original = formData.content;
    // 先清空，让用户看到流式重写过程
    setFormData(prev => ({ ...prev, content: '' }));
    aiPolishRef.current = adminApi.agent.reviseStream(
      { content: original, instruction: '对全文进行润色：优化措辞、修正语病、提升可读性，保持原意和结构不变' },
      {
        onChunk: delta => {
          accumulated += delta;
          setHasUnsavedChanges(true);
          setFormData(prev => ({ ...prev, content: accumulated }));
        },
        onComplete: full => {
          setPolishing(false);
          setIsAiBusy(false);
          aiPolishRef.current = null;
          if (full.trim()) {success('AI 润色完成');}
        },
        onError: msg => {
          // 失败时恢复原文
          setFormData(prev => ({ ...prev, content: original }));
          setPolishing(false);
          setIsAiBusy(false);
          aiPolishRef.current = null;
          error(`润色失败：${msg}`);
        },
      }
    );
  }, [formData.content, polishing, success, error]);

  /** AI 生成标题 / slug / 摘要 */
  const [generatingMeta, setGeneratingMeta] = useState(false);
  const handleAiMeta = useCallback(async () => {
    if (!formData.content.trim() || generatingMeta) {return;}
    setGeneratingMeta(true);
    setIsAiBusy(true);
    try {
      const meta = await adminApi.agent.generateMeta(formData.content);
      setHasUnsavedChanges(true);
      setFormData(prev => ({
        ...prev,
        title: meta.title || prev.title,
        slug: meta.slug || prev.slug,
        excerpt: meta.excerpt || prev.excerpt,
      }));
      success('已生成标题、别名和摘要');
    } catch (err) {
      error(err instanceof Error ? err.message : '生成元信息失败');
    } finally {
      setGeneratingMeta(false);
      setIsAiBusy(false);
    }
  }, [formData.content, generatingMeta, success, error]);

  // 卸载时中止进行中的润色流
  useEffect(() => () => aiPolishRef.current?.(), []);
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
    if (!silent) {
      // 与发布校验一致：此前只查非空，会绕过长度要求
      if (formData.title.trim().length < MIN_TITLE_LENGTH) {
        error(`标题至少需要 ${MIN_TITLE_LENGTH} 个字符`);
        return;
      }
      if (formData.content.trim().length < MIN_CONTENT_LENGTH) {
        error(`内容至少需要 ${MIN_CONTENT_LENGTH} 个字符`);
        return;
      }
    }
    try {
      setIsSubmitting(true);
      const submitData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        cover_image: formData.cover_image || undefined,
        is_published: false,
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
        tag_ids: formData.tags.length > 0 ? formData.tags : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined
      };
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
  }, [formData, writingSession, isSubmitting, success, error]);

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
    if (!formData.title.trim()) {
      error('请输入文章标题');
      titleInputRef.current?.focus();
      return;
    }
    // 与内联校验规则保持一致：此前只查非空，会绕过长度要求直接发布
    if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      error(`标题至少需要 ${MIN_TITLE_LENGTH} 个字符`);
      titleInputRef.current?.focus();
      return;
    }
    if (!formData.slug.trim()) {
      error('请输入文章别名');
      return;
    }
    if (!formData.content.trim()) {
      error('请输入文章内容');
      return;
    }
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) {
      error(`内容至少需要 ${MIN_CONTENT_LENGTH} 个字符`);
      return;
    }
    try {
      setIsSubmitting(true);
      const submitData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        cover_image: formData.cover_image || undefined,
        is_published: true,
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
        tag_ids: formData.tags.length > 0 ? formData.tags : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined
      };
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
  }, [formData, writingSession, isSubmitting, success, error, router]);

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

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );
  const renderPreview = () => (
    <ArticlePreview
      title={formData.title}
      excerpt={formData.excerpt}
      content={formData.content}
    />
  );
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
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
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
          {lastSaved && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-foreground/50 bg-background/30 px-3 py-1.5 rounded-lg"
            >
              <Clock className="w-4 h-4" />
              上次保存: {lastSaved.toLocaleTimeString()}
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
        <div className="max-w-3xl mx-auto">
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
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <GlassCardAdmin className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-tech-cyan/10">
                  <FileText className="w-5 h-5 text-tech-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">文章内容</h2>
                  <p className="text-xs text-foreground/50">使用 Markdown 格式编写</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background/30 rounded-lg p-1">
                  {(['edit', 'split', 'preview'] as EditorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditorMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        editorMode === mode
                          ? 'bg-tech-cyan text-foreground shadow-sm shadow-tech-cyan/20'
                          : 'text-foreground/60 hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      {mode === 'edit' ? '编辑' : mode === 'split' ? '分屏' : '预览'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg bg-background/30 hover:bg-background/50 text-foreground/60 hover:text-foreground transition-colors border border-transparent hover:border-border/30"
                  title={isFullscreen ? '退出全屏' : '全屏编辑'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    文章标题 <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      stats.titleLength < MIN_TITLE_LENGTH 
                        ? 'text-warning bg-warning/10' 
                        : 'text-success bg-success/10'
                    }`}>
                      {stats.titleLength} 字符
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    ref={titleInputRef}
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="输入一个吸引人的标题..."
                    className={`w-full px-4 py-3.5 rounded-xl bg-background/50 border text-foreground text-lg font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.title
                        ? 'border-destructive/50 focus:ring-destructive/20'
                        : 'border-border/50 focus:ring-tech-cyan/20 focus:border-tech-cyan/50'
                    }`}
                    required
                  />
                  {formData.title && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {formProgress.title ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.title && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3 h-3" />
                    标题至少需要 {MIN_TITLE_LENGTH} 个字符
                  </motion.p>
                )}
              </div>
              <FormInput
                label="文章别名 (Slug)"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="article-url-slug"
                leftIcon={() => <span className="text-foreground/40 text-sm">/</span>}
                required
              />
              <div className={`${editorMode === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
                <div className={editorMode === 'preview' ? 'hidden' : ''}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground/80">
                      文章内容 <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center gap-3 text-xs text-foreground/40">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {stats.wordCount} 词
                      </span>
                      <span className="w-1 h-1 rounded-full bg-foreground/20" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        约 {stats.readingTime} 分钟
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                    {/* AI 工具组：润色全文 / 生成标题摘要 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAiPolish}
                        disabled={!formData.content.trim() || isAiBusy}
                        title="对全文进行 AI 润色（流式替换）"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {polishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {polishing ? '润色中' : 'AI 润色'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAiMeta}
                        disabled={!formData.content.trim() || isAiBusy}
                        title="根据正文生成标题、别名和摘要"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-cat-2/10 text-cat-2 hover:bg-cat-2/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {generatingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {generatingMeta ? '生成中' : '生成标题摘要'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="relative">
                      <TiptapEditor
                        content={formData.content}
                        onChange={(md) => {
                          setTouchedFields((prev) => new Set(prev).add('content'));
                          setFormData((prev) => ({ ...prev, content: md }));
                        }}
                        onSelectionChange={setEditorSelection}
                        disabled={polishing}
                        invalid={Boolean(validationErrors.content)}
                        minHeight={editorMode === 'split' ? 480 : 420}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-foreground/30 pointer-events-none">
                        {stats.charCount} 字符
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 text-xs text-foreground/30">
                      {stats.charCount} 字符
                    </div>
                  </div>
                  {validationErrors.content && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-destructive mt-2 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3 h-3" />
                      内容至少需要 {MIN_CONTENT_LENGTH} 个字符
                    </motion.p>
                  )}
                </div>
                {(editorMode === 'split' || editorMode === 'preview') && (
                  <div className={editorMode === 'split' ? '' : 'mt-4'}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-foreground/80 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        实时预览
                      </label>
                    </div>
                    <div className="w-full px-5 py-4 rounded-xl bg-background/30 border border-border/30 min-h-[300px] overflow-auto">
                      {renderPreview()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCardAdmin>
          <GlassCardAdmin className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-cat-2/10">
                <Sparkles className="w-5 h-5 text-cat-2" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">附加信息</h2>
                <p className="text-xs text-foreground/50">SEO 优化和文章元数据</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground/80">文章摘要</label>
                  <button
                    type="button"
                    onClick={handleAutoExcerpt}
                    className="flex items-center gap-1.5 text-xs text-tech-cyan hover:text-tech-cyan/80 transition-colors bg-tech-cyan/10 px-2.5 py-1 rounded-md"
                  >
                    <Wand2 className="w-3 h-3" />
                    自动生成
                  </button>
                </div>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="简短描述文章内容，用于 SEO 和列表展示..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-colors resize-none text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-foreground/40">用于搜索引擎和社交分享</p>
                  <p className={`text-xs ${formData.excerpt.length > 200 ? 'text-warning' : 'text-foreground/40'}`}>
                    {formData.excerpt.length} / 200
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-foreground/50" />
                  <label className="block text-sm font-medium text-foreground/80">封面图片 URL</label>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-colors"
                  />
                </div>
                {/* AI 自动找封面：读正文生成搜索词 → Unsplash 候选 → 点选填入 */}
                <CoverPicker
                  content={formData.content}
                  onPick={url => {
                    setFormData(prev => ({ ...prev, cover_image: url }));
                    setHasUnsavedChanges(true);
                  }}
                  busy={isAiBusy}
                />
                {formData.cover_image && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 relative group"
                  >
                    {/* 封面 URL 由用户任意填写，域名不可控，保留 <img> */}
                    <img
                      src={formData.cover_image}
                      alt="封面预览"
                      className="w-full h-48 object-cover rounded-xl border border-border/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                )}
              </div>
              {/* 文章资料：图片/视频/音频/文档，可标记「仅作者参考」 */}
              <div className="md:col-span-2 mt-4">
                <ArticleAttachmentsEditor
                  value={formData.attachments}
                  onChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
                />
              </div>
            </div>
          </GlassCardAdmin>
        </div>
        <div className="space-y-6">
          <GlassCardAdmin className="p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <div className={`h-2 rounded-full overflow-hidden ${progressPercentage === 100 ? 'animate-pulse' : ''} bg-background/50`}>
                  <motion.div
                    className={`h-full rounded-full transition-colors ${
                      progressPercentage === 100 ? 'bg-success' : progressPercentage >= 60 ? 'bg-tech-cyan' : 'bg-warning'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className={`text-sm font-bold ${
                progressPercentage === 100 ? 'text-success' : 'text-foreground/60'
              }`}>{progressPercentage}%</span>
            </div>
            <div className="space-y-2.5 mb-5">
              {[
                { key: 'title', label: '标题' },
                { key: 'content', label: '内容' },
                { key: 'category', label: '分类' },
                { key: 'tags', label: '标签' },
                { key: 'excerpt', label: '摘要' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2.5 text-sm">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {formProgress[item.key as keyof typeof formProgress] ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      </motion.div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-foreground/20" />
                    )}
                  </div>
                  <span className={formProgress[item.key as keyof typeof formProgress] ? 'text-foreground/70' : 'text-foreground/40'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-background/30 border border-border/20">
              <div className="flex items-center gap-2 text-xs text-foreground/50 mb-2">
                <Info className="w-3 h-3" />
                <span>快捷键</span>
              </div>
              <div className="text-xs text-foreground/40 space-y-1.5">
                <p className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">S</kbd>
                  <span className="ml-1">保存草稿</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-mono">Enter</kbd>
                  <span className="ml-1">发布文章</span>
                </p>
              </div>
            </div>
          </GlassCardAdmin>
          {/* AI 协助面板：选段修改 + 全文建议（仅 Phase 2 且有写作会话时显示） */}
          {writingSession && (
            <ArticleAIAssist
              sessionId={writingSession.id}
              content={formData.content}
              selection={editorSelection}
              session={writingSession}
              onSessionChange={setWritingSession}
              onApplyRevision={(revision: WritingRevision, replacement?: string) => {
                if (revision.source === 'selection') {
                  setFormData(prev => ({
                    ...prev,
                    content:
                      prev.content.slice(0, revision.selection_start) +
                      revision.replacement_text +
                      prev.content.slice(revision.selection_end),
                  }));
                } else if (revision.source === 'suggestion' && replacement) {
                  // 全文建议：后端 revision 不存 replacement_text，用本地预览全文整篇替换
                  setFormData(prev => ({ ...prev, content: replacement }));
                } else {
                  return;
                }
                setTouchedFields(prev => new Set(prev).add('content'));
                setHasUnsavedChanges(true);
              }}
              busy={isAiBusy}
            />
          )}
          <GlassCardAdmin className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-cat-1/10">
                <FolderTree className="w-4 h-4 text-cat-1" />
              </div>
              <h2 className="text-base font-semibold text-foreground">分类与标签</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/70">文章分类</label>
                
                <div className="flex flex-wrap gap-2">
                  {categories.length === 0 ? (
                    <p className="text-xs text-foreground/40">暂无可选分类</p>
                  ) : (
                    categories.map(category => {
                      const checked = formData.category_ids.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              category_ids: checked
                                ? prev.category_ids.filter(id => id !== category.id)
                                : [...prev.category_ids, category.id],
                            }))
                          }
                          aria-pressed={checked}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            checked
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'bg-background/50 border-border/50 text-foreground/70 hover:border-primary/30'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/70">文章标签</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                      type="text"
                      placeholder="搜索标签..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      onFocus={() => setShowTagDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/50 border border-border/50 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-tech-cyan/20 focus:border-tech-cyan/50 transition-colors text-sm"
                    />
                  </div>
                  <AnimatePresence>
                    {showTagDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 p-2 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl max-h-48 overflow-y-auto"
                      >
                        {filteredTags.length === 0 ? (
                          <p className="text-sm text-foreground/40 text-center py-3">暂无匹配标签</p>
                        ) : (
                          filteredTags.map(tag => (
                            <motion.button
                              key={tag.id}
                              type="button"
                              onClick={() => handleTagToggle(tag.id)}
                              className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors flex items-center justify-between cursor-pointer ${
                                formData.tags.includes(tag.id)
                                  ? 'bg-tech-cyan/20 text-tech-cyan'
                                  : 'hover:bg-background/50 text-foreground/60'
                              }`}
                              whileHover={{ x: 2 }}
                            >
                              <span className="flex items-center gap-2">
                                <TagIcon className="w-3 h-3" />
                                {tag.name}
                              </span>
                              {formData.tags.includes(tag.id) && (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <AnimatePresence mode="popLayout">
                      {formData.tags.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) {return null;}
                        return (
                          <motion.span
                            key={tagId}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tech-cyan/15 text-tech-cyan text-xs font-medium border border-tech-cyan/20"
                          >
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => handleTagToggle(tagId)}
                              className="hover:bg-tech-cyan/30 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </GlassCardAdmin>
          <GlassCardAdmin className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-success/10">
                <Send className="w-4 h-4 text-success" />
              </div>
              发布操作
            </h2>
            <div className="space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center"
                disabled={isSubmitting || progressPercentage < 40}
                onClick={handlePublish}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                发布文章
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-center"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                保存草稿
              </Button>
              <div className="pt-3 border-t border-border/20">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center"
                  disabled={isSubmitting}
                  onClick={() => setEditorMode('preview')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  预览文章
                </Button>
              </div>
            </div>
            {progressPercentage < 40 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20"
              >
                <p className="text-xs text-warning flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  请完成至少 40% 的内容再发布
                </p>
              </motion.div>
            )}
          </GlassCardAdmin>
        </div>
      </div>
        </>
      )}
      {showTagDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowTagDropdown(false)}
        />
      )}
    </div>
  );
}