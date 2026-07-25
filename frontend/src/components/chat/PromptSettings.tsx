'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  X,
  Plus,
  Search,
  FolderPlus,
  Download,
  Upload,
  Star,
  Copy,
  Pencil,
  Trash2,
  Folder,
  ChevronRight,
  ChevronDown,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { promptService, type PromptFolder, type PromptWithFolder } from '@/services/promptService';
import type { Prompt } from '@/types';

interface PromptSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: Prompt) => void;
  selectedPromptId?: string;
}

type ViewMode = 'list' | 'edit' | 'create';
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export default function PromptSettings({ isOpen, onClose, onSelectPrompt, selectedPromptId }: PromptSettingsProps) {
  const [prompts, setPrompts] = useState<PromptWithFolder[]>([]);
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithFolder | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [defaultPromptId, setDefaultPromptId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; promptId: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editForm, setEditForm] = useState({
    name: '',
    content: '',
    description: '',
    category: '',
    folder_id: '',
    tags: '',
  });
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '确认操作',
    description: '',
    onConfirm: () => {},
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [promptsData, foldersData] = await Promise.all([
        promptService.getPrompts({ limit: 100 }),
        promptService.getFolders(),
      ]);
      setPrompts(promptsData.prompts as PromptWithFolder[]);
      setFolders(foldersData);
      
      const defaultPrompt = await promptService.getDefaultPrompt();
      setDefaultPromptId(defaultPrompt?.id || null);
    } catch {
      showToast('加载提示词失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchQuery
      ? prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesFolder = selectedFolder ? prompt.folder_id === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const rootFolders = folders.filter(f => !f.parent_id);
  const getSubFolders = (parentId: string) => folders.filter(f => f.parent_id === parentId);
  const getPromptsByFolder = (folderId: string) => prompts.filter(p => p.folder_id === folderId);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreatePrompt = () => {
    setSelectedPrompt(null);
    setEditForm({
      name: '',
      content: '',
      description: '',
      category: '',
      folder_id: selectedFolder || '',
      tags: '',
    });
    setViewMode('create');
  };

  const handleEditPrompt = (prompt: PromptWithFolder) => {
    setSelectedPrompt(prompt);
    setEditForm({
      name: prompt.name,
      content: prompt.content,
      description: prompt.description || '',
      category: prompt.category || '',
      folder_id: prompt.folder_id || '',
      tags: prompt.tags?.join(', ') || '',
    });
    setViewMode('edit');
  };

  const handleSavePrompt = async () => {
    if (!editForm.name.trim() || !editForm.content.trim()) {
      showToast('名称和内容不能为空', 'error');
      return;
    }

    setLoading(true);
    try {
      const promptData = {
        name: editForm.name.trim(),
        version: '1.0.0',
        content: editForm.content.trim(),
        description: editForm.description.trim() || undefined,
        category: editForm.category.trim() || undefined,
        folder_id: editForm.folder_id || undefined,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (viewMode === 'create') {
        await promptService.createPrompt(promptData);
        showToast('提示词创建成功', 'success');
      } else if (selectedPrompt) {
        await promptService.updatePrompt(selectedPrompt.id, promptData);
        showToast('提示词更新成功', 'success');
      }

      setViewMode('list');
      loadData();
    } catch {
      showToast('保存失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除提示词',
      description: '确定要删除此提示词吗？此操作不可恢复。',
      onConfirm: async () => {
        setLoading(true);
        try {
          await promptService.deletePrompt(id);
          showToast('提示词已删除', 'success');
          loadData();
        } catch {
          showToast('删除失败', 'error');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDuplicatePrompt = async (id: string) => {
    setLoading(true);
    try {
      await promptService.duplicatePrompt(id);
      showToast('提示词已复制', 'success');
      loadData();
    } catch {
      showToast('复制失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      await promptService.setDefaultPrompt(id);
      setDefaultPromptId(id);
      showToast('已设为默认提示词', 'success');
    } catch {
      showToast('设置失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {return;}

    setLoading(true);
    try {
      await promptService.createFolder({
        name: newFolderName.trim(),
        parent_id: selectedFolder || undefined,
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      showToast('文件夹创建成功', 'success');
      loadData();
    } catch {
      showToast('创建文件夹失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除文件夹',
      description: '确定要删除此文件夹吗？文件夹内的提示词将移至根目录。',
      onConfirm: async () => {
        setLoading(true);
        try {
          await promptService.deleteFolder(id);
          showToast('文件夹已删除', 'success');
          loadData();
        } catch {
          showToast('删除失败', 'error');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleExport = async (promptIds?: string[]) => {
    setLoading(true);
    try {
      const data = await promptService.exportPrompts(promptIds);
      promptService.downloadAsJson(data.prompts, data.folders);
      showToast('导出成功', 'success');
    } catch {
      showToast('导出失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    setLoading(true);
    try {
      const data = await promptService.parseImportFile(file);
      const result = await promptService.importPrompts(data);
      showToast(`导入完成：成功 ${result.success}，失败 ${result.failed}`, 
        result.failed > 0 ? 'error' : 'success');
      loadData();
    } catch {
      showToast('导入失败，请检查文件格式', 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectPrompt = (prompt: PromptWithFolder) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
      promptService.incrementUsage(prompt.id);
      onClose();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, promptId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, promptId });
  };

  const renderFolderTree = (folderList: PromptFolder[], level = 0) => {
    return folderList.map(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      const subFolders = getSubFolders(folder.id);
      const folderPrompts = getPromptsByFolder(folder.id);
      const hasChildren = subFolders.length > 0 || folderPrompts.length > 0;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
              selectedFolder === folder.id
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              setSelectedFolder(folder.id);
              toggleFolder(folder.id);
            }}
          >
            {hasChildren && (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
            )}
            {!hasChildren && <span className="w-4" />}
            <Folder size={14} style={{ color: folder.color || '#71717a' }} />
            <span className="text-sm truncate flex-1">{folder.name}</span>
            <span className="text-xs text-zinc-600 opacity-0 group-hover:opacity-100">
              {folderPrompts.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
              aria-label="删除文件夹"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
          </div>
          {isExpanded && (
            <>
              {renderFolderTree(subFolders, level + 1)}
              {folderPrompts.map(prompt => {
                const isSelected = selectedPromptId === prompt.id;
                return (
                  <div
                    key={prompt.id}
                    className={cn(
                      'group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                      isSelected 
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-500/30' 
                        : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                    )}
                    style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
                    onClick={() => handleSelectPrompt(prompt)}
                    onContextMenu={(e) => handleContextMenu(e, prompt.id)}
                  >
                    {isSelected ? (
                      <Sparkles size={12} className="text-cyan-400" />
                    ) : (
                      <FileText size={12} />
                    )}
                    <span className="text-sm truncate flex-1">{prompt.name}</span>
                    {defaultPromptId === prompt.id && (
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    )}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500"
                      >
                        <Check size={10} className="text-white" />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      );
    });
  };

  const renderPromptItem = (prompt: PromptWithFolder) => {
    const isDefault = defaultPromptId === prompt.id;
    const isSelected = selectedPromptId === prompt.id;

    return (
      <motion.div
        key={prompt.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className={cn(
          "group relative rounded-xl p-4 cursor-pointer transition-colors overflow-hidden",
          isSelected 
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10" 
            : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10"
        )}
        onClick={() => handleSelectPrompt(prompt)}
        onContextMenu={(e) => handleContextMenu(e, prompt.id)}
      >
        {isSelected && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-600/5"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30"
                >
                  <Sparkles size={14} className="text-white" />
                </motion.div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">
                  <FileText size={14} className="text-zinc-400" />
                </div>
              )}
              <span className={cn(
                "text-sm font-medium truncate",
                isSelected ? "text-cyan-300" : "text-white"
              )}>
                {prompt.name}
              </span>
              {isDefault && (
                <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
              )}
              {prompt.category && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full shrink-0",
                  isSelected 
                    ? "bg-cyan-500/30 text-cyan-300" 
                    : "bg-cyan-500/20 text-cyan-400"
                )}>
                  {prompt.category}
                </span>
              )}
              {isSelected && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"
                >
                  <Check size={10} />
                  已选择
                </motion.span>
              )}
            </div>
            {prompt.description && (
              <p className={cn(
                "text-xs mt-2 line-clamp-2",
                isSelected ? "text-cyan-400/70" : "text-zinc-500"
              )}>
                {prompt.description}
              </p>
            )}
            <div className={cn(
              "flex items-center gap-4 mt-3 text-xs",
              isSelected ? "text-cyan-500/60" : "text-zinc-600"
            )}>
              <span className="flex items-center gap-1">
                <Zap size={10} />
                {prompt.usage_count || 0} 次使用
              </span>
              {prompt.folder && (
                <span className="flex items-center gap-1">
                  <Folder size={10} />
                  {prompt.folder.name}
                </span>
              )}
              {prompt.created_at && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(prompt.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditPrompt(prompt);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="编辑"
              aria-label="编辑"
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicatePrompt(prompt.id);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="复制"
              aria-label="复制"
            >
              <Copy size={14} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePrompt(prompt.id);
              }}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
              title="删除"
              aria-label="删除"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        {isSelected && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[520px] max-w-[90vw] bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">提示词管理</h2>
                  <p className="text-xs text-zinc-500">选择一个提示词开始对话</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                aria-label="关闭"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {viewMode === 'list' ? (
              <>
                <div className="p-4 border-b border-white/10 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索提示词..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreatePrompt}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                    >
                      <Plus size={16} />
                      <span className="text-sm font-medium">新建提示词</span>
                    </button>
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                      title="新建文件夹"
                      aria-label="新建文件夹"
                    >
                      <FolderPlus size={16} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleExport()}
                      className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                      title="导出"
                      aria-label="导出"
                    >
                      <Download size={16} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                      title="导入"
                      aria-label="导入"
                    >
                      <Upload size={16} aria-hidden="true" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <div className="w-52 border-r border-white/10 flex flex-col">
                    <div className="p-2 border-b border-white/10">
                      <button
                        onClick={() => setSelectedFolder(null)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                          !selectedFolder
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
                            : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        <FileText size={14} />
                        全部提示词
                        <span className="ml-auto text-xs text-zinc-600">{prompts.length}</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
                      {isCreatingFolder ? (
                        <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 rounded-lg mb-2">
                          <Folder size={14} className="text-cyan-400" />
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {handleCreateFolder();}
                              if (e.key === 'Escape') {
                                setIsCreatingFolder(false);
                                setNewFolderName('');
                              }
                            }}
                            placeholder="文件夹名称"
                            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleCreateFolder}
                            className="p-1 hover:bg-white/10 rounded text-cyan-400"
                            aria-label="确认"
                          >
                            <Check size={12} aria-hidden="true" />
                          </button>
                        </div>
                      ) : null}
                      {renderFolderTree(rootFolders)}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                    {loading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="animate-spin text-cyan-400" size={24} />
                      </div>
                    ) : filteredPrompts.length === 0 ? (
                      <EmptyState
                        size="sm"
                        compact
                        variant={searchQuery ? 'search' : 'default'}
                        title={searchQuery ? '未找到匹配的提示词' : '暂无提示词'}
                        description={searchQuery ? '试试其他关键词' : '创建或导入提示词后在此显示'}
                        action={
                          searchQuery
                            ? { label: '清除搜索', onClick: () => setSearchQuery('') }
                            : undefined
                        }
                      />
                    ) : (
                      <div className="space-y-3">
                        {filteredPrompts.map(renderPromptItem)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="提示词名称"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      内容 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="输入提示词内容..."
                      rows={8}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      描述
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="简短描述（可选）"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                        分类
                      </label>
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="如：翻译、写作、编程"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                        文件夹
                      </label>
                      <select
                        value={editForm.folder_id}
                        onChange={(e) => setEditForm(prev => ({ ...prev, folder_id: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      >
                        <option value="">根目录</option>
                        {folders.map(folder => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      标签（逗号分隔）
                    </label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="标签1, 标签2, 标签3"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={() => setViewMode('list')}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSavePrompt}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      {loading && <Loader2 className="animate-spin" size={16} />}
                      {viewMode === 'create' ? '创建' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <AnimatePresence>
            {contextMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-50 bg-zinc-800/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                <button
                  onClick={() => {
                    const prompt = prompts.find(p => p.id === contextMenu.promptId);
                    if (prompt) {handleEditPrompt(prompt);}
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Pencil size={14} />
                  编辑
                </button>
                <button
                  onClick={() => {
                    handleDuplicatePrompt(contextMenu.promptId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Copy size={14} />
                  复制
                </button>
                <button
                  onClick={() => {
                    handleSetDefault(contextMenu.promptId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Star size={14} />
                  设为默认
                </button>
                <button
                  onClick={() => {
                    handleExport([contextMenu.promptId]);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Download size={14} />
                  导出
                </button>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    handleDeletePrompt(contextMenu.promptId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmDialog.onConfirm}
            title={confirmDialog.title}
            description={confirmDialog.description}
            variant="danger"
          />

          <div className="fixed bottom-4 right-4 z-50 space-y-2">
            <AnimatePresence>
              {toasts.map(toast => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 100, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.9 }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm',
                    toast.type === 'success' && 'bg-green-500/90 text-white',
                    toast.type === 'error' && 'bg-red-500/90 text-white',
                    toast.type === 'info' && 'bg-zinc-700/90 text-white'
                  )}
                >
                  {toast.type === 'success' && <Check size={16} />}
                  {toast.type === 'error' && <AlertCircle size={16} />}
                  <span className="text-sm font-medium">{toast.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
