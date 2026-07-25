'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { usePathname } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import AILayout from '@/components/ai/AILayout';
import PromptCard from '@/components/ai/prompts/PromptCard';
import PromptEditor from '@/components/ai/prompts/PromptEditor';
import PromptVersionList from '@/components/ai/prompts/PromptVersionList';
import type { Prompt, PromptCreate } from '@/types';
import { promptService } from '@/services/promptService';
export default function PromptsPageContent() {
  const pathname = usePathname();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>(undefined);
  const [showVersionList, setShowVersionList] = useState(false);
  const [versionPromptId] = useState('');
  const categories = ['通用', '代码', '写作', '翻译', '总结', '分析'];
  useEffect(() => {
    loadPrompts();
  }, []);
  useEffect(() => {
    let filtered = prompts;
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.is_active);
    }
    setFilteredPrompts(filtered);
  }, [prompts, searchQuery, categoryFilter, statusFilter]);
  const loadPrompts = async () => {
    setLoading(true);
    try {
      const result = await promptService.getPrompts({ limit: 100 });
      setPrompts(result.prompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreatePrompt = (data: PromptCreate) => {
    promptService.createPrompt(data).then((newPrompt) => {
      setPrompts([...prompts, newPrompt]);
      setShowEditor(false);
      setEditingPrompt(undefined);
    }).catch((error) => {
      console.error('Failed to create prompt:', error);
    });
  };
  const handleUpdatePrompt = (id: string, data: PromptCreate) => {
    promptService.updatePrompt(id, data).then((updatedPrompt) => {
      setPrompts(prompts.map((p) => (p.id === id ? updatedPrompt : p)));
      setShowEditor(false);
      setEditingPrompt(undefined);
    }).catch((error) => {
      console.error('Failed to update prompt:', error);
    });
  };
  const handleDeletePrompt = (id: string) => {
    promptService.deletePrompt(id).then(() => {
      setPrompts(prompts.filter((p) => p.id !== id));
    }).catch((error) => {
      console.error('Failed to delete prompt:', error);
    });
  };
  const handleDuplicatePrompt = (prompt: Prompt) => {
    const data: PromptCreate = {
      name: `${prompt.name} (副本)`,
      version: 'v1',
      content: prompt.content,
      variables: prompt.variables,
      description: prompt.description,
      category: prompt.category,
      is_system: false,
    };
    promptService.createPrompt(data).then((newPrompt) => {
      setPrompts([...prompts, newPrompt]);
    }).catch((error) => {
      console.error('Failed to duplicate prompt:', error);
    });
  };
  const handleOpenEditor = (prompt?: Prompt) => {
    setEditingPrompt(prompt);
    setShowEditor(true);
  };
  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPrompt(undefined);
  };
  return (
    <AILayout title="提示词管理" currentPath={pathname}>
      <div className="flex gap-4">
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1 bg-glass/20 backdrop-blur-xl rounded-xl border border-glass-border flex flex-col"
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索提示词..."
                    className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                        categoryFilter === cat
                          ? 'bg-tech-cyan text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      statusFilter === status
                        ? 'bg-tech-cyan text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {status === 'all' ? '全部' : status === 'active' ? '活跃' : '未活跃'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-white/50">
                共 {filteredPrompts.length} 个提示词
              </p>
              <button
                onClick={() => handleOpenEditor()}
                className="flex items-center gap-2 bg-tech-cyan hover:bg-tech-lightcyan text-white rounded-lg px-4 py-2 text-sm transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>新建</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-4">
                {/* 骨架屏占位符：使用 index 作为 key */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredPrompts.map((prompt, _index) => (
                    <motion.div
                      key={prompt.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PromptCard
                        prompt={prompt}
                        onEdit={() => handleOpenEditor(prompt)}
                        onDelete={handleDeletePrompt}
                        onDuplicate={handleDuplicatePrompt}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {!loading && filteredPrompts.length === 0 && (
              <div className="text-center py-16">
                <Filter className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">暂无提示词</h3>
                <p className="text-sm text-white/50">
                  {searchQuery || categoryFilter || statusFilter !== 'all'
                    ? '尝试调整筛选条件'
                    : '创建第一个提示词开始'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '0%', opacity: 0 }}
          exit={{ width: 0, opacity: 0 }}
          className="w-96 bg-glass/30 backdrop-blur-xl rounded-xl border border-glass-border"
        />
      </div>
      <AnimatePresence>
        {showEditor && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <PromptEditor
              prompt={editingPrompt}
              onSave={(data) => {
                if (editingPrompt) {
                  handleUpdatePrompt(editingPrompt.id, data);
                } else {
                  handleCreatePrompt(data);
                }
              }}
              onCancel={handleCloseEditor}
            />
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showVersionList && (
          <PromptVersionList
            promptId={versionPromptId}
            currentVersion={editingPrompt?.version || 'v1'}
            onSelectVersion={() => {
              setShowVersionList(false);
              loadPrompts();
            }}
            onClose={() => setShowVersionList(false)}
          />
        )}
      </AnimatePresence>
    </AILayout>
  );
}
