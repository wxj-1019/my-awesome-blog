'use client';
import { useState } from 'react';
import { motion } from '@/lib/framer-motion';
import { Save, X, Play, Plus, Trash2 } from 'lucide-react';
import type { Prompt, PromptCreate } from '@/types';
interface PromptEditorProps {
  prompt?: Prompt;
  onSave: (data: PromptCreate) => void;
  onCancel: () => void;
}
export default function PromptEditor({ prompt, onSave, onCancel }: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [variables, setVariables] = useState<Record<string, unknown>>(prompt?.variables || {});
  const [description, setDescription] = useState(prompt?.description || '');
  const [category, setCategory] = useState(prompt?.category || '');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const handleSave = () => {
    if (!name.trim() || !content.trim()) {return;}

    onSave({
      name,
      version: 'v1',
      content,
      variables,
      description,
      category,
    });
  };
  const handleRemoveVariable = (varName: string) => {
    const newVars = { ...variables };
    delete newVars[varName];
    setVariables(newVars);
  };
  const updatePreviewVariable = (varName: string, value: string) => {
    setPreviewVariables({ ...previewVariables, [varName]: value });
  };
  const getPreviewContent = () => {
    let preview = content;
    Object.entries(previewVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{${key}}`);
    });
    return preview;
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">
          {prompt ? '编辑 Prompt' : '新建 Prompt'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          aria-label="关闭"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/70 mb-1.5 block">名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入 Prompt 名称"
            className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-white/70 mb-1.5 block">分类</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="输入分类（可选）"
            className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/70 mb-1.5 block">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入描述（可选）"
          rows={2}
          className="w-full bg-white/5 text-white placeholder:text-white/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all resize-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/70 block">Prompt 内容</label>
          <button
            onClick={() => setVariables({ ...variables, [`var_${Object.keys(variables).length + 1}`]: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tech-cyan hover:bg-tech-lightcyan text-white text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加变量</span>
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入 Prompt 内容，使用 {{variable_name}} 表示变量"
          rows={8}
          className="w-full bg-black/30 text-white placeholder:text-white/50 rounded-lg px-3 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-tech-cyan/50 transition-all resize-none"
        />
      </div>
      {Object.keys(variables).length > 0 && (
        <div className="space-y-2">
          <label className="text-xs text-white/70 block">变量定义</label>
          <div className="space-y-1.5">
            {Object.entries(variables).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
              >
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                  placeholder="变量默认值"
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm outline-none"
                />
                <input
                  type="text"
                  value={previewVariables[key] || ''}
                  onChange={(e) => updatePreviewVariable(key, e.target.value)}
                  placeholder="预览值"
                  className="w-24 bg-black/30 text-white placeholder:text-white/50 text-xs rounded px-2 py-1 outline-none"
                />
                <button
                  onClick={() => handleRemoveVariable(key)}
                  className="p-1 rounded hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-all"
                  aria-label="删除变量"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/70 block">预览</label>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>测试变量</span>
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4 text-sm text-white/90 font-mono whitespace-pre-wrap">
          {getPreviewContent()}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !content.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-tech-cyan hover:bg-tech-lightcyan text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>保存</span>
        </button>
      </div>
    </motion.div>
  );
}