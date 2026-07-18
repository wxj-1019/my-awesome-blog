import { useRef, useState, useEffect } from 'react';
import { Send, StopCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading || disabled || isSending) {return;}
    setIsSending(true);
    setTimeout(() => {
      onSend(input);
      setInput('');
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 150);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  return (
    <div className="relative mx-auto w-full max-w-3xl p-4">
      <div className={cn(
        "relative flex items-end gap-2 rounded-3xl bg-white/5 p-2 backdrop-blur-xl border border-white/10 transition-all duration-300",
        isFocused && "bg-white/10 shadow-[0_0_40px_-15px_rgba(6,182,212,0.25)]",
        isSending && "scale-95 opacity-80"
      )}>
        <div className={cn(
          "absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 blur-xl pointer-events-none",
          "bg-gradient-to-tr from-cyan-400/20 via-blue-500/15 to-purple-500/20",
          isFocused && "opacity-100"
        )} />
        
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-400">
          <Sparkles size={18} className={cn("transition-transform duration-300", isFocused && "rotate-180")} />
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="输入消息与 AI 对话..."
          disabled={disabled || isSending}
          rows={1}
          className="max-h-[200px] min-h-[44px] w-full resize-none bg-transparent py-3 px-2 text-base text-white placeholder-zinc-500 focus:outline-none scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent transition-all duration-300"
          style={{ height: '44px' }}
        />
        <div className="flex shrink-0 pb-1 pr-1">
          {isLoading ? (
            <button
              onClick={onStop}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-200 hover:scale-110 active:scale-95"
              title="停止生成"
            >
              <StopCircle size={20} className="animate-pulse" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled || isSending}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                input.trim() && !disabled && !isSending
                  ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-110 hover:shadow-cyan-500/40 active:scale-95 hover:rotate-3"
                  : "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
              )}
            >
              <Send size={18} className={cn("transition-transform duration-300", input.trim() && !disabled && !isSending && "ml-0.5")} />
            </button>
          )}
        </div>
      </div>
      
      <div className={cn("mt-2 text-center text-xs text-zinc-500 transition-opacity duration-300", isFocused && "opacity-50")}>
        AI 内容可能包含错误，请核对重要信息。
      </div>
    </div>
  );
}
