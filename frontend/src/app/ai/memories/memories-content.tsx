'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { usePathname } from 'next/navigation';
import { Plus, Search, Trash2, Database, Brain } from 'lucide-react';
import AILayout from '@/components/ai/AILayout';
import MemoryCard from '@/components/ai/memories/MemoryCard';
import MemorySearch from '@/components/ai/memories/MemorySearch';
import type { Memory, MemoryCreate, MemorySearchResult } from '@/types';
import { memoryService } from '@/services/memoryService';
import { useToast } from '@/components/ui/use-toast';

export default function MemoriesPageContent() {
  const { toast } = useToast();
  const pathname = usePathname();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'short_term' | 'long_term'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<MemorySearchResult[] | undefined>(undefined);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    let filtered = memories;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => m.memory_type === typeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMemories(filtered);
  }, [memories, searchQuery, typeFilter]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const result = await memoryService.getMemories({ limit: 100 });
      setMemories(result.items);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemory = (data: MemoryCreate) => {
    memoryService.createMemory(data).then((newMemory) => {
      setMemories([...memories, newMemory]);
      setShowCreateModal(false);
      setEditingMemory(undefined);
    }).catch((error) => {
      console.error('Failed to create memory:', error);
    });
  };

  const handleUpdateMemory = (id: string, data: MemoryCreate) => {
    memoryService.updateMemory(id, data).then((updatedMemory) => {
      setMemories(memories.map((m) => (m.id === id ? updatedMemory : m)));
      setShowCreateModal(false);
      setEditingMemory(undefined);
    }).catch((error) => {
      console.error('Failed to update memory:', error);
    });
  };

  const handleDeleteMemory = (id: string) => {
    memoryService.deleteMemory(id).then(() => {
      setMemories(memories.filter((m) => m.id !== id));
    }).catch((error) => {
      console.error('Failed to delete memory:', error);
    });
  };

  const handleOpenCreate = (memory?: Memory) => {
    setEditingMemory(memory);
    setShowCreateModal(true);
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setEditingMemory(undefined);
  };

  const handleSearch = async (query: string) => {
    setSearching(true);
    try {
      const results = await memoryService.searchMemories({ query, limit: 10 });
      setSearchResults(results);
      setSearching(false);
    } catch (error) {
      console.error('Search failed:', error);
      setSearching(false);
    }
  };

  const shortTermCount = memories.filter((m) => m.memory_type === 'short_term').length;
  const longTermCount = memories.filter((m) => m.memory_type === 'long_term').length;
  const highImportanceCount = memories.filter((m) => (m.importance || 0) >= 0.8).length;

  return (
    <AILayout title="记忆管理" currentPath={pathname}>
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 bg-glass/20 backdrop-blur-xl rounded-xl border border-glass-border flex flex-col"
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索记忆..."
                  className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                />
              </div>

              <button
                onClick={() => handleOpenCreate()}
                className="flex items-center gap-2 bg-tech-cyan hover:bg-tech-lightcyan text-white rounded-lg px-4 py-2 text-sm transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>新建</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {(['all', 'short_term', 'long_term'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      typeFilter === type
                        ? 'bg-tech-cyan text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {type === 'all' ? '全部' : type === 'short_term' ? '短期' : '长期'}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 text-xs text-white/50">
                <span>共 {memories.length} 条</span>
                <span>•</span>
                <span>短期 {shortTermCount}</span>
                <span>•</span>
                <span>长期 {longTermCount}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 骨架屏占位符：使用 index 作为 key */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMemories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MemoryCard
                      memory={memory}
                      onEdit={() => handleOpenCreate(memory)}
                      onDelete={handleDeleteMemory}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredMemories.length === 0 && (
              <div className="text-center py-16">
                <Database className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">暂无记忆</h3>
                <p className="text-sm text-white/50">
                  {searchQuery || typeFilter !== 'all'
                    ? '尝试调整筛选条件'
                    : '创建第一条记忆'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '360px', opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-80 bg-glass/30 backdrop-blur-xl rounded-xl border border-glass-border flex flex-col"
        >
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-medium flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-tech-cyan" />
              统计概览
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-white/70 mb-3">类型分布</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/80">短期记忆</span>
                    <span className="text-sm font-medium text-tech-cyan">{shortTermCount}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${memories.length > 0 ? (shortTermCount / memories.length) * 100 : 0}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/80">长期记忆</span>
                    <span className="text-sm font-medium text-tech-cyan">{longTermCount}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${memories.length > 0 ? (longTermCount / memories.length) * 100 : 0}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-white/70 mb-3">重要性分布</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">高重要性</span>
                  <span className="text-sm font-medium text-red-400">{highImportanceCount}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${memories.length > 0 ? (highImportanceCount / memories.length) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-red-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">中重要性</span>
                  <span className="text-sm font-medium text-yellow-400">
                    {memories.filter((m) => (m.importance || 0) >= 0.5 && (m.importance || 0) < 0.8).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">低重要性</span>
                  <span className="text-sm font-medium text-green-400">
                    {memories.filter((m) => (m.importance || 0) < 0.5).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-white/70 mb-2">语义搜索</p>
              <MemorySearch
                onSearch={handleSearch}
                results={searchResults}
                searching={searching}
              />
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-white/70 mb-2">批量操作</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    memoryService.clearExpiredMemories().then(({ deleted_count: deletedCount }) => {
                      loadMemories();
                      toast({
                        title: '清理完成',
                        description: `已清理 ${deletedCount} 条过期记忆`,
                        variant: 'success',
                      });
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清理过期记忆</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">
                  {editingMemory ? '编辑记忆' : '新建记忆'}
                </h2>
                <button
                  onClick={handleCloseCreate}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/70 mb-1.5 block">类型</label>
                  <select
                    value={editingMemory?.memory_type || 'long_term'}
                    onChange={(e) => {
                      if (editingMemory) {
                        setEditingMemory({ ...editingMemory, memory_type: e.target.value as 'short_term' | 'long_term' });
                      }
                    }}
                    className="w-full bg-white/5 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                  >
                    <option value="short_term">短期记忆</option>
                    <option value="long_term">长期记忆</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1.5 block">内容</label>
                  <textarea
                    defaultValue={editingMemory?.content || ''}
                    placeholder="输入记忆内容..."
                    rows={6}
                    ref={(textarea) => {
                      if (textarea && editingMemory === undefined) {
                        textarea.value = '';
                      }
                    }}
                    id="memory-content-input"
                    className="w-full bg-black/30 text-white placeholder:text-white/50 rounded-lg px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1.5 block">重要性 (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue={editingMemory?.importance || 0.5}
                    placeholder="0.5"
                    className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1.5 block">过期时间（可选）</label>
                  <input
                    type="datetime-local"
                    defaultValue={editingMemory?.expires_at?.split('.')[0] || ''}
                    className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handleCloseCreate}
                  className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const contentInput = document.getElementById('memory-content-input') as HTMLTextAreaElement;
                    const data: MemoryCreate = {
                      memory_type: editingMemory?.memory_type || 'long_term',
                      content: contentInput?.value || '',
                      importance: parseFloat((document.querySelector('input[type="number"]') as HTMLInputElement)?.value || '0.5'),
                      expires_at: (document.querySelector('input[type="datetime-local"]') as HTMLInputElement)?.value || undefined,
                    };
                    if (editingMemory) {
                      handleUpdateMemory(editingMemory.id, data);
                    } else {
                      handleCreateMemory(data);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-tech-cyan hover:bg-tech-lightcyan text-white transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingMemory ? '更新' : '创建'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AILayout>
  );
}
