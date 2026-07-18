'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import Image from 'next/image';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface AvatarUploaderProps {
  avatar?: string;
  name?: string;
  isEditing?: boolean;
  onAvatarChange: (avatar: string) => void;
}
export default function AvatarUploader({
  avatar,
  name,
  isEditing = false,
  onAvatarChange
}: AvatarUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
      return;
    }
    setUploadStatus('uploading');
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setUploadStatus('success');
      setTimeout(() => {
        onAvatarChange(result);
        setUploadStatus('idle');
      }, 1000);
    };
    reader.onerror = () => {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    };
    reader.readAsDataURL(file);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  const handleClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };
  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange('');
    setUploadStatus('idle');
  };
  const displayAvatar = previewUrl || avatar;
  return (
    <div
      ref={dropZoneRef}
      className={cn(
        'relative group cursor-pointer transition-all duration-300',
        isDragging && 'scale-105'
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative w-32 h-32 mx-auto">
        {/* 脉冲光环动画 */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-tech-cyan to-tech-sky opacity-20"
          animate={{
            scale: isDragging ? [1, 1.1, 1] : [1, 1.05, 1],
            opacity: isDragging ? [0.2, 0.4, 0.2] : [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* 主头像容器 */}
        <motion.div
          className={cn(
            'absolute inset-2 rounded-full overflow-hidden border-4 transition-all duration-300',
            isDragging
              ? 'border-tech-cyan scale-110 shadow-[0_0_40px_var(--shadow-tech-cyan)]'
              : 'border-tech-cyan/30 shadow-[0_0_20px_var(--shadow-tech-cyan)]',
            'group-hover:border-tech-cyan/50 group-hover:scale-105 group-hover:shadow-[0_0_30px_var(--shadow-tech-cyan)]'
          )}
          whileHover={{ scale: 1.05 }}
        >
          {displayAvatar ? (
            <Image
              src={displayAvatar}
              alt="Avatar"
              fill
              sizes="128px"
              className="object-cover transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-tech-cyan/20 to-tech-sky/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-gradient-primary">
                {name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          {/* 拖拽覆盖层 */}
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-tech-cyan/80 flex flex-col items-center justify-center backdrop-blur-sm"
            >
              <Upload className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-sm font-medium">释放以上传</span>
            </motion.div>
          )}
        </motion.div>
        {/* 编辑模式下的上传按钮 */}
        <AnimatePresence>
          {isEditing && !isDragging && (
            <motion.label
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                'absolute bottom-0 right-0 p-3 rounded-full cursor-pointer transition-all duration-300 shadow-lg',
                uploadStatus === 'uploading'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-tech-cyan hover:bg-tech-sky hover:scale-110 hover:rotate-180'
              )}
            >
              {uploadStatus === 'uploading' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : uploadStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : uploadStatus === 'error' ? (
                <AlertCircle className="w-5 h-5 text-white" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />
            </motion.label>
          )}
        </AnimatePresence>
        {/* 删除头像按钮 */}
        <AnimatePresence>
          {isEditing && displayAvatar && !isDragging && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveAvatar();
              }}
              className="absolute top-0 left-0 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all hover:scale-110"
              title="删除头像"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        {/* 悬浮效果的光环 */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 transition-all duration-500',
            isDragging
              ? 'border-tech-cyan/60 scale-110'
              : 'border-tech-cyan/0 group-hover:border-tech-cyan/30'
          )}
        />
        {/* 上传状态提示 */}
        <AnimatePresence>
          {uploadStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                'absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                uploadStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : uploadStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-500 text-white'
              )}
            >
              {uploadStatus === 'uploading' && '上传中...'}
              {uploadStatus === 'success' && '上传成功'}
              {uploadStatus === 'error' && '上传失败'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* 提示文字 */}
      {isEditing && !isDragging && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          点击或拖拽图片到此处更换头像
        </p>
      )}
    </div>
  );
}