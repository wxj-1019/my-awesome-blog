'use client';

import { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { Upload, X, File, Image, FileText, Film, Music, FileCode, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemedClasses } from '@/hooks/useThemedClasses';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
}

export interface FileUploaderProps {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  onUpload: (files: UploadedFile[]) => void;
  onRemove?: (fileId: string) => void;
  className?: string;
  disabled?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {return Image;}
  if (type.startsWith('video/')) {return Film;}
  if (type.startsWith('audio/')) {return Music;}
  if (type.startsWith('text/') || type.includes('json') || type.includes('xml')) {return FileText;}
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python')) {return FileCode;}
  return File;
};

export default function FileUploader({
  accept = '*/*',
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  multiple = true,
  onUpload,
  onRemove,
  className,
  disabled = false
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getThemeClass } = useThemedClasses();

  const validateFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    const newErrors: string[] = [];

    Array.from(fileList).forEach((file, index) => {
      if (file.size > maxSize) {
        newErrors.push(`${file.name} 超过大小限制 (${formatFileSize(maxSize)})`);
        return;
      }

      if (files.length + newFiles.length >= maxFiles) {
        newErrors.push(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          preview: file.type.startsWith('image/') ? reader.result as string : undefined
        };

        setFiles(prev => [...prev, uploadedFile]);
        onUpload([...files, uploadedFile]);
      };
      reader.readAsDataURL(file);
    });

    setErrors(newErrors);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || !e.dataTransfer.files) {return;}

    validateFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {setIsDragging(true);}
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateFiles(e.target.files);
    }
  };

  const handleRemove = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    onRemove?.(fileId);
  };

  const handleClick = () => {
    if (!disabled && files.length < maxFiles) {
      inputRef.current?.click();
    }
  };

  const handleRemoveError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer',
          isDragging
            ? 'border-tech-cyan bg-tech-cyan/5 scale-105'
            : 'border-glass-border hover:border-tech-cyan/50 hover:bg-glass/20',
          disabled && 'opacity-50 cursor-not-allowed',
          files.length >= maxFiles && 'border-dashed border-gray-300 bg-gray-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || files.length >= maxFiles}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <motion.div
            animate={{
              scale: isDragging ? 1.2 : 1,
              rotate: isDragging ? 180 : 0,
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              'p-4 rounded-full',
              isDragging
                ? 'bg-tech-cyan text-white'
                : 'bg-tech-cyan/10 text-tech-cyan'
            )}
          >
            <Upload className="w-8 h-8" />
          </motion.div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {isDragging ? '释放以上传文件' : '点击或拖拽文件到此处'}
            </p>
            <p className="text-xs text-muted-foreground">
              最大 {formatFileSize(maxSize)} · 最多 {maxFiles} 个文件
            </p>
            {accept !== '*/*' && (
              <p className="text-xs text-muted-foreground">
                支持格式: {accept.split(',').map(a => a.replace('.', '').toUpperCase()).join(', ')}
              </p>
            )}
          </div>
        </div>

        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-tech-cyan/5 backdrop-blur-sm rounded-lg pointer-events-none"
          />
        )}
      </div>

      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {/* 错误提示列表：error 为字符串且无自然唯一 ID，使用 index 作为 key */}
            {errors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => handleRemoveError(index)}
                  className="text-red-400 hover:text-red-500 transition-colors"
                  aria-label="关闭错误提示"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type);

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative group p-3 rounded-lg border transition-all',
                  getThemeClass(
                    'bg-glass/20 border-glass-border hover:border-tech-cyan/50',
                    'bg-white border-gray-200 hover:border-blue-300'
                  )
                )}
              >
                <div className="flex items-start gap-3">
                  {file.preview ? (
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <NextImage
                        src={file.preview}
                        alt={file.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      'w-16 h-16 rounded flex items-center justify-center flex-shrink-0',
                      getThemeClass('bg-glass/30', 'bg-gray-100')
                    )}>
                      <FileIcon className="w-8 h-8 text-foreground/50" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(file.size)}
                    </p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1 mt-1 text-green-500 text-xs"
                    >
                      <Check className="w-3 h-3" />
                      已上传
                    </motion.div>
                  </div>
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemove(file.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label="移除文件"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {files.length >= maxFiles && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground p-3 bg-glass/10 rounded-lg"
        >
          已达到最大文件数量限制 ({maxFiles} 个)
        </motion.div>
      )}
    </div>
  );
}
