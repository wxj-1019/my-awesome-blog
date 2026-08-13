'use client';

/**
 * 文章编辑器共享模块。
 *
 * 历史背景：admin/articles/new 与 admin/articles/[id] 两个页面曾各自
 * 复制了 MarkdownToolbar / generateExcerpt / renderPreview 等实现
 * （约 700 行重复代码），且「实时预览」只是纯文本 whitespace-pre-wrap，
 * 与 UI 承诺的 Markdown 预览不符。统一抽取到这里，两边引用同一份实现。
 */
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  Code,
  Link2,
  List,
  ListOrdered,
  Minus,
} from 'lucide-react';

export const MIN_TITLE_LENGTH = 5;
export const MIN_CONTENT_LENGTH = 100;

export type EditorMode = 'edit' | 'preview' | 'split';

/** 工具条按钮的工具定义：插入语义 + 选中文本时的包裹行为 */
export interface MarkdownTool {
  icon: typeof Heading1;
  title: string;
  /** 无选区时插入的模板文本 */
  insert: string;
  /** 有选区时的包裹/前缀符号（如 '**' 加粗、'# ' 标题、'> ' 引用），undefined 则直接替换选区 */
  wrap?: string;
  /** 包裹语义：环绕（'**text**'）；否则前缀（'# text'） */
  wrapMode?: 'around' | 'prefix';
  /** 无选区插入后光标偏移（相对插入文本开头；默认落在末尾） */
  cursorOffset?: number;
  /** 链接类：选中文本作为链接文字，光标选中 url 占位 */
  link?: boolean;
}

/** Markdown 工具条（在两个编辑页中曾是逐字重复的实现） */
export const MarkdownToolbar = ({ onInsert }: { onInsert: (tool: MarkdownTool) => void }) => {
  const tools: MarkdownTool[] = [
    { icon: Heading1, title: '标题 1', insert: '# ', wrap: '# ', wrapMode: 'prefix' },
    { icon: Heading2, title: '标题 2', insert: '## ', wrap: '## ', wrapMode: 'prefix' },
    { icon: Heading3, title: '标题 3', insert: '### ', wrap: '### ', wrapMode: 'prefix' },
    { icon: Bold, title: '粗体', insert: '****', wrap: '**', wrapMode: 'around', cursorOffset: 2 },
    { icon: Italic, title: '斜体', insert: '*', wrap: '*', wrapMode: 'around', cursorOffset: 1 },
    { icon: Quote, title: '引用', insert: '> ', wrap: '> ', wrapMode: 'prefix' },
    { icon: Code, title: '代码', insert: '``', wrap: '`', wrapMode: 'around', cursorOffset: 1 },
    { icon: Link2, title: '链接', insert: '[](url)', link: true, cursorOffset: 1 },
    { icon: List, title: '无序列表', insert: '- ', wrap: '- ', wrapMode: 'prefix' },
    { icon: ListOrdered, title: '有序列表', insert: '1. ', wrap: '1. ', wrapMode: 'prefix' },
    { icon: Minus, title: '分割线', insert: '\n---\n' },
  ];
  return (
    <div className="flex items-center gap-0.5 p-1 bg-background/30 rounded-lg border border-border/30">
      {tools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          title={tool.title}
          aria-label={tool.title}
          onClick={() => onInsert(tool)}
          className="p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-colors"
        >
          <tool.icon className="w-4 h-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

/** 统计正文字数：CJK 逐字 + 拉丁词数（中文按空格分词会把整段算 1 个词，须分离统计） */
export const countWords = (content: string): { cjk: number; latin: number; total: number } => {
  const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g;
  const cjk = (content.match(CJK_RE) || []).length;
  const rest = content.replace(CJK_RE, ' ');
  const latin = rest.trim() ? rest.trim().split(/\s+/).length : 0;
  return { cjk, latin, total: cjk + latin };
};

/** 估算阅读时长（分钟）：中文约 300 字/分钟，英文约 200 词/分钟 */
export const estimateReadingMinutes = (content: string): number => {
  const { cjk, latin } = countWords(content);
  return Math.max(1, Math.ceil(cjk / 300 + latin / 200));
};

/**
 * 同步正文指纹：用于渲染期冲突检测（仅需判断「内容是否变了」，
 * 不要求密码学强度）。头/中/尾多段采样 + 长度，中段编辑也能触发冲突提示；
 * 真正落库前服务端会再算全量 hash 兜底。
 */
export const contentHashSync = (content: string): string => {
  if (!content) {return '0';}
  const len = content.length;
  const sample = (pos: number) =>
    content.slice(Math.max(0, pos - 16), Math.min(len, pos + 16));
  return `${len}:${sample(Math.floor(len / 4))}:${sample(Math.floor(len / 2))}:${sample(Math.floor(len * 3 / 4))}`;
};

/** 从 Markdown 正文生成纯文本摘要（截断 150 字） */
export const generateExcerpt = (content: string): string => {
  const plainText = content.replace(/[#*`_[\]]/g, '').trim();
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
};

interface ArticlePreviewProps {
  title: string;
  excerpt?: string;
  content: string;
}

/**
 * 文章预览：真正的 Markdown 渲染（GFM）。
 * 替代原先 whitespace-pre-wrap 的伪预览。
 */
export const ArticlePreview = ({ title, excerpt, content }: ArticlePreviewProps) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80">
      <h1>{title || '未命名文章'}</h1>
      {excerpt && (
        <p className="text-lg text-foreground/60 border-l-4 border-tech-cyan pl-4 italic">
          {excerpt}
        </p>
      )}
      {content.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      ) : (
        <div className="whitespace-pre-wrap">暂无内容...</div>
      )}
    </div>
  );
};
