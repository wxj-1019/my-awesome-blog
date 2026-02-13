import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { streamChat, LLMMessage, getModels } from '@/lib/api/llm';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ModelSelector, Model } from './ModelSelector';
import { Menu, Eraser, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWindowProps {
  onToggleSidebar: () => void;
  sessionMessages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onNewSession: () => void;
}

const DEFAULT_MODELS: Model[] = [
  {
    id: 'deepseek_deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    description: 'Smart & Fast',
  },
  {
    id: 'zhipu_glm-4',
    name: 'GLM-4',
    provider: 'zhipu',
    description: 'Balanced',
  },
  {
    id: 'dashscope_qwen-turbo',
    name: 'Qwen Turbo',
    provider: 'dashscope',
    description: 'Efficient',
  },
];

export function ChatWindow({
  onToggleSidebar,
  sessionMessages,
  onMessagesChange,
  onNewSession,
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(sessionMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODELS[0].id);
  const [models, setModels] = useState<Model[]>(DEFAULT_MODELS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with parent session messages（流式输出中不覆盖本地正在更新的 messages）
  useEffect(() => {
    if (!isLoading) {
      setMessages(sessionMessages);
    }
  }, [sessionMessages, isLoading]);

  // Fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await getModels();
        if (response.models && response.models.length > 0) {
          const mappedModels = response.models.map((m: { provider: string; name: string; display_name?: string; is_available?: boolean }) => ({
            id: `${m.provider}_${m.name}`, // Unique composite key
            name: m.display_name || m.name,
            provider: m.provider,
            description: m.is_available ? 'Available' : 'Unavailable',
          }));
          setModels(mappedModels);
          if (response.default_provider) {
            // Logic to set default model based on provider could go here
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    onMessagesChange(newMessages);
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    // Optimistic update
    setMessages(prev => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      // Prepare messages for API
      const apiMessages: LLMMessage[] = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Find provider for current model
      const selectedModel = models.find(m => m.id === currentModel);

      let fullContent = '';

      await streamChat(
        {
          messages: apiMessages,
          model: currentModel,
          provider: selectedModel?.provider,
        },
        (chunk: string) => {
          fullContent += chunk;
          // 使用 flushSync 让每个 chunk 立即提交，避免 React 18 批量更新导致只显示最后一段
          flushSync(() => {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessageId ? { ...m, content: fullContent } : m
              )
            );
          });
        },
        () => {
          setIsLoading(false);
          // Final sync with parent
          onMessagesChange([
            ...newMessages,
            { ...assistantMessage, content: fullContent },
          ]);
        },
        (error: any) => {
          console.error('Stream error:', error);
          setIsLoading(false);
          if (error instanceof Error && error.message.includes('401')) {
            router.push('/unauthorized');
          }
        }
      );
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/unauthorized');
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    onNewSession();
  };

  return (
    <div className="flex h-full flex-col relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex h-16 items-center justify-between px-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
          >
            <Menu size={20} />
          </button>
          <ModelSelector
            models={models}
            currentModel={currentModel}
            onSelect={setCurrentModel}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleClear}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-red-400 transition-colors"
          title="Clear Chat"
        >
          <Eraser size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="mx-auto w-full max-w-3xl px-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 shadow-2xl shadow-cyan-500/10 border border-white/5">
                <Sparkles size={40} className="text-cyan-400" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                How can I help you today?
              </h1>
              <p className="max-w-md text-zinc-400">
                Start a conversation with advanced AI models. Ask questions,
                generate code, or explore creative ideas.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isTyping={
                    isLoading &&
                    message.role === 'assistant' &&
                    message.id === messages[messages.length - 1].id
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="z-20">
        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
