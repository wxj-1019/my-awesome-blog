'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Table,
  Minus,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  HelpCircle,
  Loader2
} from 'lucide-react';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-background/30 rounded-xl border border-border/30">
        <Loader2 className="w-6 h-6 animate-spin text-tech-cyan" />
        <span className="ml-2 text-foreground/60">加载编辑器...</span>
      </div>
    )
  }
);

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  preview?: 'live' | 'edit' | 'preview';
  hideToolbar?: boolean;
  disabled?: boolean;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
  autoFocus?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

const MarkdownEditor = React.forwardRef<HTMLDivElement, MarkdownEditorProps>(
  ({
    value,
    onChange,
    placeholder = '使用 Markdown 格式编写内容...',
    height = 400,
    preview = 'live',
    hideToolbar = false,
    disabled = false,
    className,
    onImageUpload,
    autoFocus = false,
    minHeight = 200,
    maxHeight = 600,
  }, ref) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [currentPreview, setCurrentPreview] = React.useState<'live' | 'edit' | 'preview'>(preview);
    const [isUploading, setIsUploading] = React.useState(false);

    const handleImageUpload = React.useCallback(async (file: File) => {
      if (!onImageUpload) {
        console.warn('Image upload handler not provided');
        return;
      }
      
      try {
        setIsUploading(true);
        const url = await onImageUpload(file);
        const imageMarkdown = `![${file.name}](${url})`;
        onChange(value + '\n' + imageMarkdown);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    }, [onImageUpload, value, onChange]);

    const handlePaste = React.useCallback((e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          break;
        }
      }
    }, [handleImageUpload]);

    const toggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
    };

    const togglePreview = () => {
      setCurrentPreview(current => {
        if (current === 'edit') {return 'live';}
        if (current === 'live') {return 'preview';}
        return 'edit';
      });
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-xl overflow-hidden border border-border/50 bg-background/30',
          isFullscreen && 'fixed inset-4 z-50 bg-background',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onPaste={handlePaste}
      >
        {!hideToolbar && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background/50">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(value + '**粗体**')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="粗体 (Ctrl+B)"
                aria-label="粗体"
              >
                <Bold className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '*斜体*')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="斜体 (Ctrl+I)"
                aria-label="斜体"
              >
                <Italic className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <button
                type="button"
                onClick={() => onChange(value + '\n# ')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="标题 1"
                aria-label="标题 1"
              >
                <Heading1 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '\n## ')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="标题 2"
                aria-label="标题 2"
              >
                <Heading2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '\n### ')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="标题 3"
                aria-label="标题 3"
              >
                <Heading3 className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <button
                type="button"
                onClick={() => onChange(value + '\n- ')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="无序列表"
                aria-label="无序列表"
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '\n1. ')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="有序列表"
                aria-label="有序列表"
              >
                <ListOrdered className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '\n> ')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="引用"
                aria-label="引用"
              >
                <Quote className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <button
                type="button"
                onClick={() => onChange(value + '\n```\n代码\n```')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="代码块"
                aria-label="代码块"
              >
                <Code className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '[链接文字](url)')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="链接"
                aria-label="链接"
              >
                <Link2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {handleImageUpload(file);}
                  };
                  input.click();
                }}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="插入图片"
                aria-label="插入图片"
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="表格"
                aria-label="表格"
              >
                <Table className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value + '\n---\n')}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title="分割线"
                aria-label="分割线"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {isUploading && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-tech-cyan">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  上传中...
                </div>
              )}
              <button
                type="button"
                onClick={togglePreview}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title={currentPreview === 'preview' ? '编辑' : currentPreview === 'live' ? '仅预览' : '实时预览'}
                aria-label={currentPreview === 'preview' ? '编辑' : currentPreview === 'live' ? '仅预览' : '实时预览'}
              >
                {currentPreview === 'preview' ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-background/50 transition-all"
                title={isFullscreen ? '退出全屏' : '全屏'}
                aria-label={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" aria-hidden="true" /> : <Maximize2 className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        )}

        <div 
          className="markdown-editor-container"
          style={{ 
            height: isFullscreen ? 'calc(100vh - 120px)' : height,
            minHeight: minHeight,
            maxHeight: isFullscreen ? 'none' : maxHeight
          }}
        >
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            preview={currentPreview}
            hideToolbar={true}
            visibleDragbar={false}
            height={isFullscreen ? 'calc(100vh - 120px)' : height}
            style={{
              backgroundColor: 'transparent',
            }}
            textareaProps={{
              placeholder,
              disabled,
              autoFocus,
            }}
          />
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/30 bg-background/30 text-xs text-foreground/40">
          <div className="flex items-center gap-3">
            <span>{value.length} 字符</span>
            <span>{value.trim() ? value.trim().split(/\s+/).length : 0} 词</span>
            <span>约 {Math.max(1, Math.ceil((value.trim() ? value.trim().split(/\s+/).length : 0) / 200))} 分钟阅读</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>支持 Markdown 语法</span>
          </div>
        </div>

        {isFullscreen && (
          <div
            className="fixed inset-0 bg-black/50 -z-10"
            onClick={() => setIsFullscreen(false)}
          />
        )}
      </motion.div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
