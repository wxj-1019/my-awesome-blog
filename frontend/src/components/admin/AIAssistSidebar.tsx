'use client';

/**
 * Phase 2 编辑器右侧 AI 协助面板。
 *
 * 两个模式：
 * 1. 选中文字修改：用户在编辑器选中文字 → 面板显示「修改此处」输入框 + 发送
 *    → AI 只输出替换文本 → 手动替换选中的部分
 * 2. 全文对话：折叠式紧凑聊天，与 AIWritingPanel 同样的流式体验，但用于小范围修改
 *
 * 依赖父组件提供 textarea ref 以读取选中文字。
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import {
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  Square,
  Wand2,
  MessageSquareText,
  FileInput,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api-client';
import { useToast } from '@/components/admin/Toast';
import { cn } from '@/lib/utils';

export interface AIAssistSidebarProps {
  /** 当前编辑器全文 */
  content: string;
  /** 编辑器 textarea 的 ref，用于读取选中文字 */
  contentRef: React.RefObject<HTMLTextAreaElement | null>;
  /** AI 产出的新内容替换编辑器全文 */
  onReplaceContent: (fullContent: string) => void;
  /** 外部繁忙态（润色/生成元信息进行中时禁用） */
  busy?: boolean;
}

/** 流式对话信息 */
interface SideMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export default function AIAssistSidebar({
  content,
  contentRef,
  onReplaceContent,
  busy = false,
}: AIAssistSidebarProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [collapsed, setCollapsed] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPos, setSelectionPos] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [instruction, setInstruction] = useState('');
  const [modifying, setModifying] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<SideMessage[]>([]);
  const [chatStreaming, setChatStreaming] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const msgIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 监听编辑器选中文字变化
  useEffect(() => {
    const checkSelection = () => {
      const el = contentRef.current;
      if (!el) {return;}
      const { selectionStart, selectionEnd } = el;
      if (selectionStart !== selectionEnd) {
        setSelectedText(el.value.slice(selectionStart, selectionEnd));
        setSelectionPos({ start: selectionStart, end: selectionEnd });
      } else {
        setSelectedText('');
      }
    };
    // 用定时器轮询（textarea onSelect 事件不够可靠），每 500ms 检查一次
    const timer = setInterval(checkSelection, 500);
    return () => clearInterval(timer);
  }, [contentRef]);

  // 修改选中文字
  const handleModifySelection = useCallback(async () => {
    if (!selectedText || !instruction.trim() || modifying) {return;}
    setModifying(true);
    let accumulated = '';
    let finished = false;
    const original = content;
    const start = selectionPos.start;
    const end = selectionPos.end;

    cancelRef.current = adminApi.agent.reviseStream(
      {
        content: `【待修改段落】\n${selectedText}`,
        instruction: `请按这个要求修改上面的段落：${instruction.trim()}。直接输出修改后的段落文本，不要输出其他内容。`,
      },
      {
        onChunk: delta => {
          accumulated += delta;
          // 实时预览：替换选中部分
          const newContent = original.slice(0, start) + accumulated + original.slice(end);
          onReplaceContent(newContent);
        },
        onComplete: () => {
          finished = true;
          setModifying(false);
          cancelRef.current = null;
          setInstruction('');
          setSelectedText('');
          toastSuccess('修改完成');
        },
        onError: msg => {
          if (!finished) {
            onReplaceContent(original); // 恢复原文
          }
          setModifying(false);
          cancelRef.current = null;
          toastError(`修改失败：${msg}`);
        },
      }
    );
  }, [selectedText, instruction, modifying, content, selectionPos, onReplaceContent, toastSuccess, toastError]);

  // 全文对话发送
  const handleChatSend = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatStreaming) {return;}
    const userMsg: SideMessage = { id: ++msgIdRef.current, role: 'user', content: trimmed };
    const assistantId = ++msgIdRef.current;
    const assistantMsg: SideMessage = { id: assistantId, role: 'assistant', content: '', streaming: true };
    setChatMessages(prev => [...prev, userMsg, assistantMsg]);
    setChatInput('');
    setChatStreaming(true);

    // 节流
    let pending = '';
    let rafScheduled = false;
    const flush = () => {
      rafScheduled = false;
      if (!pending) {return;}
      const d = pending; pending = '';
      const aid = assistantId;
      setChatMessages(prev => prev.map(m => m.id === aid ? { ...m, content: m.content + d } : m));
    };
    const onChunk = (delta: string) => { pending += delta; if (!rafScheduled) { rafScheduled = true; requestAnimationFrame(flush); } };
    const onComplete = () => {
      if (rafScheduled) { cancelAnimationFrame(requestAnimationFrame(() => {})); if (pending) { setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + pending } : m)); } }
      setChatStreaming(false); cancelRef.current = null;
      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
    };
    const onError = (msg: string) => {
      setChatStreaming(false); cancelRef.current = null;
      toastError(`对话失败：${msg}`);
      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
    };

    cancelRef.current = adminApi.agent.generateStream(
      { topic: trimmed, context_mode: 'auto' },
      { onChunk, onComplete, onError }
    );
  }, [chatInput, chatStreaming, toastError]);

  useEffect(() => () => cancelRef.current?.(), []);

  const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max) + '…' : s;

  return (
    <div className="rounded-xl border border-border/40 bg-background/30 overflow-hidden">
      {/* 标题头 */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-foreground/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">AI 协助</span>
        </div>
        {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-foreground/40" /> : <ChevronUp className="w-3.5 h-3.5 text-foreground/40" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border/30"
          >
            <div className="p-3 space-y-3">
              {/* 模式 1：选中文字修改 */}
              {selectedText ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-foreground/50 flex items-center gap-1">
                    <FileInput className="w-3 h-3" />
                    已选中 {selectedText.length} 字：{truncate(selectedText, 30)}
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !modifying) { e.preventDefault(); void handleModifySelection(); } }}
                      placeholder="修改此处为…"
                      disabled={modifying || busy}
                      aria-label="选中文字修改指令"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 text-foreground text-xs placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-colors disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => void handleModifySelection()}
                      disabled={!instruction.trim() || modifying || busy}
                      className="shrink-0 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed text-xs transition-colors"
                    >
                      {modifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    </button>
                  </div>
                  {modifying && (
                    <p className="text-[10px] text-primary/80">AI 正在修改选中文字…</p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-foreground/50">
                  在编辑器中选中文字后可精准修改
                </p>
              )}

              {/* 模式 2：全文对话（折叠式） */}
              <div className="border-t border-border/20 pt-2">
                <button
                  type="button"
                  onClick={() => setChatOpen(c => !c)}
                  className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors w-full"
                >
                  <MessageSquareText className="w-3 h-3" />
                  {chatOpen ? '收起对话' : '展开全文对话'}
                  {chatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence initial={false}>
                  {chatOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* 对话消息 */}
                      {chatMessages.length > 0 && (
                        <div ref={scrollRef} className="mt-2 space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {chatMessages.map(msg => (
                            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                              <div className={cn(
                                'max-w-[85%] rounded-lg px-2 py-1.5 text-[11px] leading-relaxed',
                                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background/60 border border-border/30 text-foreground'
                              )}>
                                {msg.content || (msg.streaming ? <Loader2 className="w-3 h-3 animate-spin text-foreground/50" /> : '')}
                                {msg.streaming && msg.content && <span className="inline-block w-1 h-3 ml-0.5 bg-primary/70 animate-pulse align-middle" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 对话输入 */}
                      <div className="flex items-end gap-1.5 mt-2">
                        <textarea
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
                          }}
                          placeholder="对全文进一步修改…"
                          rows={2}
                          disabled={chatStreaming || busy}
                          aria-label="全文对话指令"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 text-foreground text-xs placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-colors resize-none disabled:cursor-not-allowed"
                        />
                        {chatStreaming ? (
                          <button
                            type="button"
                            onClick={() => { cancelRef.current?.(); setChatStreaming(false); }}
                            className="shrink-0 p-1.5 rounded-lg bg-destructive text-destructive-foreground"
                          >
                            <Square className="w-3 h-3 fill-current" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleChatSend}
                            disabled={!chatInput.trim() || busy}
                            className="shrink-0 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
