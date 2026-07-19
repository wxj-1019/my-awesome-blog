import { motion } from '@/lib/framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CodeProps extends React.ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
  _node?: unknown;
}

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export function MessageBubble({ role, content, isTyping }: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex w-full gap-3 md:gap-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm',
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-transparent text-white' 
          : 'bg-zinc-800 border-zinc-700 text-cyan-400'
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className={cn(
        'relative max-w-[85%] md:max-w-[75%] px-4 py-3 shadow-md',
        isUser
          ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
          : 'rounded-2xl rounded-tl-sm bg-zinc-900/60 backdrop-blur-md border border-white/10 text-zinc-100'
      )}>
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm md:text-base">{content}</div>
        ) : (
          <div className="prose prose-invert max-w-none text-sm md:text-base prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ _node, inline, className, children, ...props }: CodeProps) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-muted shadow-lg">
                        <div className="flex items-center justify-between bg-muted/80 px-4 py-2">
                          <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">{match[1]}</span>
                            <button
                              onClick={() => handleCopy(codeText)}
                              className="ml-2 rounded p-1 hover:bg-white/10 transition-colors"
                              title="Copy code"
                            >
                              {copied === codeText ? (
                                <Check size={14} className="text-green-400" />
                              ) : (
                                <Copy size={14} className="text-zinc-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto p-4">
                          <code className={cn("font-mono text-sm", className)} {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-300" {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-4 list-disc pl-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 list-decimal pl-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="marker:text-zinc-500">{children}</li>,
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-cyan-500/50 bg-white/5 pl-4 py-1 my-4 rounded-r italic text-zinc-400">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                    <table className="w-full text-left text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-white/5 border-b border-white/10">{children}</thead>,
                th: ({ children }) => <th className="px-4 py-2 font-semibold text-zinc-200">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 border-t border-white/5 text-zinc-300">{children}</td>,
                hr: () => <hr className="my-6 border-white/10" />,
              }}
            >
              {content}
            </ReactMarkdown>
            
            {/* Typing Cursor */}
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-400 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
