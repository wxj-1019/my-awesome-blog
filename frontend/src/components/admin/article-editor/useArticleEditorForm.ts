'use client';

/**
 * 文章编辑器共享表单 Hook。
 *
 * 历史背景：admin/articles/new 与 admin/articles/[id] 两个页面各自复制了
 * 表单 state、输入处理、AI 润色/元信息生成、校验等实现（约 400 行重复）。
 * 统一抽取到这里，两页共享同一份状态与行为；仅「保存/发布请求链路」
 * （create vs update、writingSession 关联）因两页本质差异保留在各自页面。
 *
 * 行为统一说明（与原两页逐字对比后的等价合并）：
 * - 脏标记：new 页在输入 handler 中显式 setHasUnsavedChanges(true)，
 *   [id] 页原靠 formData !== originalData 的 effect 兜底。所有用户编辑路径
 *   （handler / 润色 onChunk / AI meta / Tiptap onChange）在本 hook 中统一
 *   显式标脏，最终脏状态与原两页一致；文章回填（setFormData 直接调用）不标脏。
 * - slug 联动：new 页为 touched-guard（手动改过 slug 后标题不再覆盖），
 *   [id] 页为 fallback（slug 为空才按标题生成），以 slugMode 参数区分。
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '@/lib/admin-api-client';
import { generateSlug } from '@/lib/slug';
import { useToast } from '@/components/admin/Toast';
import {
  MIN_TITLE_LENGTH,
  MIN_CONTENT_LENGTH,
  countWords,
  estimateReadingMinutes,
  generateExcerpt,
  type EditorMode,
} from '@/components/admin/article-editor/shared';
import type { AttachmentDraft } from '@/components/admin/article-editor/ArticleAttachmentsEditor';

/** 分类选项（下拉/按钮选择用），两页原各自定义的 Category 接口 */
export interface EditorCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

/** 标签选项，两页原各自定义的 Tag 接口 */
export interface EditorTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

/** 编辑器表单数据（两页原本逐字相同的 useState 形状） */
export interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  is_published: boolean;
  category_ids: string[];
  tags: string[];
  attachments: AttachmentDraft[];
}

export const createEmptyFormData = (): ArticleFormData => ({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  cover_image: '',
  is_published: false,
  category_ids: [],
  tags: [],
  attachments: [],
});

/** 标题输入的 slug 联动模式 */
export type SlugSyncMode =
  /** 新建页：用户手动改过 slug 后，标题输入不再覆盖 slug */
  | 'touched-guard'
  /** 编辑页：slug 为空时才按标题生成 */
  | 'fallback';

export interface UseArticleEditorFormOptions {
  slugMode?: SlugSyncMode;
}

/**
 * 发布前输入校验结果：message 为错误文案；focusTitle 表示需要聚焦标题输入框
 * （与原两页 handlePublish 的校验分支一一对应）。
 */
export interface PublishValidationIssue {
  message: string;
  focusTitle?: boolean;
}

/**
 * 文章编辑器共享表单控制器。
 * new 与 [id] 两个页面共用；返回值整体作为 ArticleEditorForm 的 form prop。
 */
export function useArticleEditorForm(
  options: UseArticleEditorFormOptions = {}
) {
  const { slugMode = 'fallback' } = options;
  const { success, error, info } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<EditorCategory[]>([]);
  const [tags, setTags] = useState<EditorTag[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [editorSelection, setEditorSelection] = useState({ text: '', start: 0, end: 0 });
  const [formData, setFormData] = useState<ArticleFormData>(createEmptyFormData);

  // 用户手动改过 slug 后，标题输入不再覆盖 slug（仅 touched-guard 模式消费）
  const slugTouchedRef = useRef(false);

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
      setCategories((categoriesData as EditorCategory[]) || []);
      setTags((tagsData as EditorTag[]) || []);
    } catch (err) {
      console.error('Failed to load categories and tags:', err);
      error('加载分类和标签失败');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setTouchedFields(prev => new Set(prev).add('title'));
    setHasUnsavedChanges(true);
    setFormData(prev => ({
      ...prev,
      title,
      slug: slugMode === 'touched-guard'
        ? (slugTouchedRef.current ? prev.slug : generateSlug(title))
        : (prev.slug || generateSlug(title))
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
   * 手动保存草稿前的长度校验（与发布校验一致的 MIN_* 规则）。
   * 校验失败时已弹出 error toast，返回 false；silent（自动保存）时直接通过。
   */
  const validateDraftLengths = useCallback((silent: boolean): boolean => {
    if (silent) {return true;}
    if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      error(`标题至少需要 ${MIN_TITLE_LENGTH} 个字符`);
      return false;
    }
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) {
      error(`内容至少需要 ${MIN_CONTENT_LENGTH} 个字符`);
      return false;
    }
    return true;
  }, [formData, error]);

  /** 发布前输入校验：返回 null 表示通过，否则返回错误文案（及是否聚焦标题框） */
  const validatePublishInputs = useCallback((): PublishValidationIssue | null => {
    if (!formData.title.trim()) {
      return { message: '请输入文章标题', focusTitle: true };
    }
    if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      return { message: `标题至少需要 ${MIN_TITLE_LENGTH} 个字符`, focusTitle: true };
    }
    if (!formData.slug.trim()) {
      return { message: '请输入文章别名' };
    }
    if (!formData.content.trim()) {
      return { message: '请输入文章内容' };
    }
    if (formData.content.trim().length < MIN_CONTENT_LENGTH) {
      return { message: `内容至少需要 ${MIN_CONTENT_LENGTH} 个字符` };
    }
    return null;
  }, [formData]);

  /**
   * 构造保存/发布请求体（两页原本逐字相同，仅 is_published 取值不同）。
   * 空值字段传 undefined，与后端「不更新为空」语义一致。
   */
  const buildSubmitData = useCallback((isPublished: boolean) => ({
    title: formData.title,
    slug: formData.slug,
    content: formData.content,
    excerpt: formData.excerpt || undefined,
    cover_image: formData.cover_image || undefined,
    is_published: isPublished,
    category_ids: formData.category_ids.length > 0 ? formData.category_ids : undefined,
    tag_ids: formData.tags.length > 0 ? formData.tags : undefined,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    attachments: formData.attachments.length > 0 ? formData.attachments : undefined
  }), [formData]);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  return {
    // state
    formData,
    setFormData,
    touchedFields,
    setTouchedFields,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    lastSaved,
    setLastSaved,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    setIsLoading,
    categories,
    tags,
    loadCategoriesAndTags,
    editorMode,
    setEditorMode,
    isFullscreen,
    setIsFullscreen,
    tagSearchQuery,
    setTagSearchQuery,
    showTagDropdown,
    setShowTagDropdown,
    filteredTags,
    editorSelection,
    setEditorSelection,
    titleInputRef,
    // 派生值
    stats,
    formProgress,
    progressPercentage,
    validationErrors,
    // 输入处理
    handleTitleChange,
    handleInputChange,
    handleTagToggle,
    handleAutoExcerpt,
    // AI 能力
    isAiBusy,
    polishing,
    handleAiPolish,
    generatingMeta,
    handleAiMeta,
    // 保存助手
    validateDraftLengths,
    validatePublishInputs,
    buildSubmitData,
  };
}

/** 编辑器表单控制器类型（供 ArticleEditorForm 的 form prop 使用） */
export type ArticleEditorController = ReturnType<typeof useArticleEditorForm>;
