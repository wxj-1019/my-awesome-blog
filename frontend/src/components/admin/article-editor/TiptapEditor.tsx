'use client';

/**
 * TipTap 所见即所得编辑器（admin 文章编辑用）。
 *
 * 存储格式仍为 Markdown：经 tiptap-markdown 在 Markdown ↔ ProseMirror 文档间
 * 双向转换，后端与 AI 写作流无需任何改动。
 * 编辑器内容以内部为准；外部 content prop 仅在与内部导出的 Markdown 不一致时
 * 回写（用于 AI 润色等外部来源的全文替换），避免光标跳动。
 */

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';
import { cn } from '@/lib/utils';

const lowlight = createLowlight(common);

export interface TiptapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  /** 选区变化（供 AI 选段润色）。start/end 为 Markdown 文本中的近似 offset，
   *  以选中文本在 Markdown 源中的首次出现位置定位 */
  onSelectionChange?: (sel: { text: string; start: number; end: number }) => void;
  disabled?: boolean;
  /** 编辑区最小高度（px） */
  minHeight?: number;
  invalid?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  label: string;
}

function ToolbarButton({ onClick, active, disabled, title, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        'min-w-8 h-8 px-2 rounded-md text-xs font-medium transition-colors',
        'hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed',
        active ? 'bg-primary/15 text-primary' : 'text-foreground/80'
      )}
    >
      {label}
    </button>
  );
}

export default function TiptapEditor({
  content,
  onChange,
  onSelectionChange,
  disabled = false,
  minHeight = 420,
  invalid = false,
}: TiptapEditorProps) {
  /** 最近一次由本编辑器导出的 Markdown，用于区分外部 content 变更（AI 润色等） */
  const lastExportedRef = useRef(content);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 用 CodeBlockLowlight 提供语法高亮
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Markdown.configure({
        html: false,
        tightLists: true,
        // 粘贴/输入的 Markdown 源码不做自动转换，编辑器统一处理文档模型
        transformPastedText: false,
        transformCopiedText: false,
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      // tiptap-markdown 的 storage 键未注入全局 Storage 类型，运行时必然存在
      const markdown = (ed.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? '';
      lastExportedRef.current = markdown;
      onChangeRef.current(markdown);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const handler = onSelectionChangeRef.current;
      if (!handler) {
        return;
      }
      const { from, to, empty } = ed.state.selection;
      if (empty) {
        handler({ text: '', start: 0, end: 0 });
        return;
      }
      const text = ed.state.doc.textBetween(from, to, '\n');
      const markdown = (ed.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? '';
      // ProseMirror pos 无法精确映射 Markdown offset：以选中文本在源中的首次出现定位
      const start = markdown.indexOf(text);
      handler({
        text,
        start: start < 0 ? 0 : start,
        end: start < 0 ? 0 : start + text.length,
      });
    },
  });

  // 外部内容替换（AI 润色流式 / 草稿回填）：与内部导出不同才回写，防光标跳动
  useEffect(() => {
    if (!editor || disabled) {
      return;
    }
    if (content === lastExportedRef.current) {
      return;
    }
    lastExportedRef.current = content;
    // v3 签名：setContent(content, { emitUpdate })；不触发 onUpdate（否则与外部状态互相回写）
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor, disabled]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div
        className="rounded-xl border border-border/50 bg-background/50 animate-pulse"
        style={{ minHeight }}
        aria-hidden
      />
    );
  }

  const btnDisabled = disabled;
  const chain = () => editor.chain().focus();

  return (
    <div
      className={cn(
        'rounded-xl border bg-background/50 overflow-hidden transition-colors',
        invalid ? 'border-destructive/50' : 'border-border/50 focus-within:border-tech-cyan/50'
      )}
    >
      {/* 工具栏 */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border/50 bg-glass/30"
        role="toolbar"
        aria-label="Markdown 编辑工具栏"
      >
        <ToolbarButton onClick={() => chain().toggleBold().run()} active={editor.isActive('bold')} disabled={btnDisabled} title="粗体" label="B" />
        <ToolbarButton onClick={() => chain().toggleItalic().run()} active={editor.isActive('italic')} disabled={btnDisabled} title="斜体" label="I" />
        <ToolbarButton onClick={() => chain().toggleStrike().run()} active={editor.isActive('strike')} disabled={btnDisabled} title="删除线" label="S" />
        <span className="w-px h-5 bg-border/60 mx-1" aria-hidden />
        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            onClick={() => chain().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
            active={editor.isActive('heading', { level })}
            disabled={btnDisabled}
            title={`标题 ${level}`}
            label={`H${level}`}
          />
        ))}
        <span className="w-px h-5 bg-border/60 mx-1" aria-hidden />
        <ToolbarButton onClick={() => chain().toggleBulletList().run()} active={editor.isActive('bulletList')} disabled={btnDisabled} title="无序列表" label="• 列表" />
        <ToolbarButton onClick={() => chain().toggleOrderedList().run()} active={editor.isActive('orderedList')} disabled={btnDisabled} title="有序列表" label="1. 列表" />
        <ToolbarButton onClick={() => chain().toggleBlockquote().run()} active={editor.isActive('blockquote')} disabled={btnDisabled} title="引用" label="引用" />
        <ToolbarButton onClick={() => chain().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} disabled={btnDisabled} title="代码块" label="代码块" />
        <ToolbarButton onClick={() => chain().setHorizontalRule().run()} disabled={btnDisabled} title="分割线" label="— 分割" />
        <span className="w-px h-5 bg-border/60 mx-1" aria-hidden />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('链接地址：');
            if (url) {chain().setLink({ href: url }).run();}
          }}
          active={editor.isActive('link')}
          disabled={btnDisabled}
          title="插入链接"
          label="链接"
        />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('图片地址：');
            if (url) {chain().setImage({ src: url }).run();}
          }}
          disabled={btnDisabled}
          title="插入图片（外链）"
          label="图片"
        />
        <ToolbarButton
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          disabled={btnDisabled}
          title="插入表格"
          label="表格"
        />
        <ToolbarButton onClick={() => chain().unsetAllMarks().clearNodes().run()} disabled={btnDisabled} title="清除格式" label="✕ 格式" />
      </div>

      {/* 编辑区：prose 复用站点排版，TipTap 结构类名由下方 CSS 兜底 */}
      <EditorContent
        editor={editor}
        className={cn('article-markdown tiptap-surface px-4 py-3 overflow-auto', disabled && 'opacity-60 pointer-events-none')}
        style={{ minHeight }}
      />
    </div>
  );
}
