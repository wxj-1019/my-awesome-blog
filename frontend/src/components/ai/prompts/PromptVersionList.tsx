'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/lib/framer-motion';
import { GitBranch, RotateCcw, Check } from 'lucide-react';
import type { PromptVersion } from '@/types';
import { promptService } from '@/services/promptService';

interface PromptVersionListProps {
  promptId: string;
  currentVersion: string;
  onSelectVersion: (version: string) => void;
  onClose: () => void;
}

export default function PromptVersionList({ promptId, currentVersion, onSelectVersion, onClose }: PromptVersionListProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleActivateVersion = async (version: string) => {
    try {
      await promptService.activatePromptVersion(promptId, version);
      onSelectVersion(version);
      onClose();
    } catch (error) {
      console.error('Failed to activate version:', error);
    }
  };

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const result = await promptService.getPromptVersions(promptId);
        setVersions(result.versions);
      } catch (error) {
        console.error('Failed to load versions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [promptId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-glass/30 backdrop-blur-xl border border-glass-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-tech-cyan" />
            <h3 className="text-lg font-medium text-white">版本历史</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-tech-cyan rounded-full animate-spin" />
              <p className="text-sm text-white/50 mt-3">加载中...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleActivateVersion(version.version)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 ${
                    version.version === currentVersion
                      ? 'bg-tech-cyan/20 border-tech-cyan/40 ring-1 ring-tech-cyan/30'
                      : 'bg-white/5 hover:bg-white/10 border-transparent'
                  } border`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-white">v{version.version}</h4>
                        {version.version === currentVersion && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-tech-cyan text-white text-xs">
                            <Check className="w-3 h-3" />
                            <span>当前</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 mb-1">
                        {new Date(version.created_at).toLocaleString('zh-CN')}
                      </p>
                      {version.variables && Object.keys(version.variables).length > 0 && (
                        <div className="text-xs text-white/50">
                          变量: {Object.keys(version.variables).join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleActivateVersion(version.version)}
                      className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                      title="切换到此版本"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-white/80 overflow-x-auto font-mono max-h-32">
                    {version.content}
                  </pre>
                </motion.div>
              ))}

              {versions.length === 0 && (
                <div className="text-center py-8">
                  <GitBranch className="w-12 h-12 mx-auto text-white/30 mb-3" />
                  <p className="text-sm text-white/50">暂无版本历史</p>
                  <p className="text-xs text-white/30 mt-1">创建第一个版本开始</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
