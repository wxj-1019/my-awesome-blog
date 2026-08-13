'use client';

/**
 * 文章附件/资料编辑器。
 * 支持两种来源：本地上传到 OSS（MinIO）、粘贴外部 URL。
 * 每个附件可标记「仅作者参考」（is_reference），参考资料只在编辑页可见，详情页不渲染。
 */
import * as React from 'react';
import {
  Paperclip, UploadCloud, Link2, Trash2, Copy,
  FileVideo, FileAudio, FileImage, FileText, Loader2, X,
} from 'lucide-react';
import { uploadFile } from '@/lib/api/oss';

/** 编辑器内的附件草稿：已有附件带 id，新添加的没有 id */
export interface AttachmentDraft {
  id?: string;
  name: string;
  url: string;
  media_type: string;
  mime_type?: string | null;
  file_size?: number | null;
  is_reference: boolean;
  sort_order: number;
}

interface ArticleAttachmentsEditorProps {
  value: AttachmentDraft[];
  onChange: (attachments: AttachmentDraft[]) => void;
  /** 是否允许编辑（详情页只读时可传 false） */
  readonly?: boolean;
}

const MEDIA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  video: FileVideo,
  audio: FileAudio,
  image: FileImage,
  file: FileText,
};

/** 根据文件名/MIME 推断媒体类型 */
export function inferMediaType(fileName: string, mimeType?: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  if (mimeType?.startsWith('image/') || imageExts.includes(ext)) {return 'image';}
  if (mimeType?.startsWith('video/') || videoExts.includes(ext)) {return 'video';}
  if (mimeType?.startsWith('audio/') || audioExts.includes(ext)) {return 'audio';}
  return 'file';
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) {return '';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function ArticleAttachmentsEditor({
  value,
  onChange,
  readonly = false,
}: ArticleAttachmentsEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [urlName, setUrlName] = React.useState('');
  const [urlValue, setUrlValue] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {return;}
    setUploading(true);
    setErrorMsg('');
    const uploaded: AttachmentDraft[] = [];
    try {
      for (const file of Array.from(files)) {
        // 逐个上传（避免并发触发后端批量限制）；folder=articles 统一存文章资料目录
        const result = await uploadFile(file, 'articles');
        uploaded.push({
          name: file.name,
          url: result.file_url,
          media_type: inferMediaType(file.name, file.type),
          mime_type: file.type || null,
          file_size: file.size,
          is_reference: false,
          sort_order: value.length + uploaded.length,
        });
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      setErrorMsg(err instanceof Error ? err.message : '上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {fileInputRef.current.value = '';}
    }
  };

  const handleAddUrl = () => {
    const url = urlValue.trim();
    if (!url) {return;}
    const name = urlName.trim() || url.split('/').pop() || url;
    const attachment: AttachmentDraft = {
      name,
      url,
      media_type: inferMediaType(name),
      is_reference: false,
      sort_order: value.length,
    };
    onChange([...value, attachment]);
    setUrlName('');
    setUrlValue('');
    setErrorMsg('');
  };

  const updateAttachment = (index: number, patch: Partial<AttachmentDraft>) => {
    onChange(value.map((att, i) => (i === index ? { ...att, ...patch } : att)));
  };

  const removeAttachment = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const copyUrl = (att: AttachmentDraft) => {
    navigator.clipboard.writeText(att.url).catch(() => {});
    setCopiedId(att.url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Paperclip className="w-4 h-4 text-foreground/50" />
        <label className="block text-sm font-medium text-foreground/80">文章资料</label>
        <span className="text-xs text-muted-foreground">
          图片 / 视频 / 音频 / 文档（勾选「仅作者参考」后详情页不展示）
        </span>
      </div>

      {/* 附件列表 */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((att, index) => {
            const Icon = MEDIA_ICONS[att.media_type] || FileText;
            return (
              <div
                key={`${att.url}-${index}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50"
              >
                <Icon className="w-5 h-5 text-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {att.url}
                    {att.file_size ? ` · ${formatFileSize(att.file_size)}` : ''}
                  </p>
                </div>
                {!readonly && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={att.is_reference}
                        onChange={(e) => updateAttachment(index, { is_reference: e.target.checked })}
                        className="accent-primary"
                      />
                      仅作者参考
                    </label>
                    <button
                      type="button"
                      title="复制 URL"
                      aria-label="复制 URL"
                      onClick={() => copyUrl(att)}
                      className="p-1.5 rounded-md text-foreground/50 hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      {copiedId === att.url ? <span className="text-xs text-success">已复制</span> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      title="删除"
                      aria-label="删除附件"
                      onClick={() => removeAttachment(index)}
                      className="p-1.5 rounded-md text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readonly && (
        <>
          {/* 本地上传 */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.zip"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {uploading ? '上传中...' : '上传文件'}
            </button>
            <span className="text-xs text-muted-foreground">
              支持图片 / 视频（≤200MB）/ 音频 / PDF / ZIP
            </span>
          </div>

          {/* 外部 URL */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              placeholder="显示名称（可选）"
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-background/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') {e.preventDefault(); handleAddUrl();} }}
              placeholder="https://example.com/file.mp4"
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-background/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors shrink-0"
            >
              <Link2 className="w-4 h-4" />
              添加
            </button>
          </div>

          {errorMsg && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <X className="w-3.5 h-3.5" /> {errorMsg}
            </p>
          )}
        </>
      )}
    </div>
  );
}
