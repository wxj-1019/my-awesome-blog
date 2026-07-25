import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from '@/lib/framer-motion';

export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

interface ModelSelectorProps {
  models: Model[];
  currentModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ models, currentModel, onSelect, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find(m => m.id === currentModel) || models[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 border border-white/10",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Cpu size={16} className="text-cyan-400" />
        <span>{selectedModel?.name || 'Select Model'}</span>
        <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 top-full z-50 mt-2 w-64 origin-top-left overflow-hidden rounded-xl border border-white/10 bg-popover/95 p-1 shadow-2xl backdrop-blur-xl ring-1 ring-black/5"
          >
            <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500">Available Models</div>
            <div className="space-y-0.5">
              {models.map((model) => (
                <button
                  key={`${model.provider}_${model.name}`}
                  onClick={() => {
                    onSelect(`${model.provider}_${model.name}`);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    currentModel === `${model.provider}_${model.name}`
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    {model.description && (
                      <span className="text-[10px] text-zinc-500">{model.description}</span>
                    )}
                  </div>
                  {currentModel === model.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
