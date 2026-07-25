'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { usePathname } from 'next/navigation';
import AILayout from '@/components/ai/AILayout';
import ChatSidebar from '@/components/ai/chat/ChatSidebar';
import ChatInput from '@/components/ai/chat/ChatInput';
import MessageBubble from '@/components/ai/chat/MessageBubble';
import type { Conversation, ConversationMessage, LLMStreamChunk } from '@/types';
import { conversationService } from '@/services/conversationService';
import { llmService } from '@/services/llmService';

export default function ChatPageContent() {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  const selectConversation = useCallback(async (id: string) => {
    try {
      const conversation = conversations.find(c => c.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
        const response = await conversationService.getConversationMessages(id);
        setMessages(response.items || []);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [conversations]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await conversationService.getConversations();
      setConversations(response.items || []);
      if ((response.items?.length ?? 0) > 0 && !currentConversation) {
        selectConversation(response.items![0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [currentConversation, selectConversation]);

  useEffect(() => {
    if (!isInitialLoadRef.current) {return;}
    isInitialLoadRef.current = false;
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateConversation = async () => {
    try {
      const conversation = await conversationService.createConversation({
        title: '新对话',
        model: 'deepseek-v4-flash',
      });
      setConversations([conversation, ...conversations]);
      setCurrentConversation(conversation);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await conversationService.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleArchiveConversation = async (id: string) => {
    try {
      await conversationService.archiveConversation(id);
      const conversation = conversations.find(c => c.id === id);
      if (conversation) {
        setCurrentConversation({ ...conversation, status: 'archived' });
      }
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) {
      await handleCreateConversation();
      return;
    }

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      conversation_id: currentConversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ConversationMessage = {
      id: assistantMessageId,
      conversation_id: currentConversation.id,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      let fullContent = '';
      await llmService.chatStream(
        {
          message: content,
          conversation_id: currentConversation.id,
          provider: 'deepseek' as const,
          model: currentConversation.model,
          stream: true,
        },
        (chunk: LLMStreamChunk) => {
          if (chunk.content) {
            fullContent += chunk.content;
            setMessages((prev) => 
              prev.map(msg => 
                msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
              )
            );
          }
        },
        (completedFullContent: string) => {
          fullContent = completedFullContent;
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === assistantMessageId ? { ...msg, content: completedFullContent } : msg
            )
          );
          setIsStreaming(false);
          setIsLoading(false);
        },
        (error) => {
          console.error('Chat error:', error);
          setIsStreaming(false);
          setIsLoading(false);
          setMessages((prev) => prev.filter(msg => msg.id !== assistantMessageId));
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setIsStreaming(false);
      setMessages((prev) => prev.filter(msg => msg.id !== assistantMessageId));
    }
  };

  return (
    <AILayout title="对话" currentPath={pathname}>
      <div className="flex gap-4 h-[calc(100vh-120px)]">
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversation?.id || null}
          onSelectConversation={selectConversation}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
          onArchiveConversation={handleArchiveConversation}
        />

        <div className="flex-1 flex flex-col bg-card dark:bg-card/90 backdrop-blur-xl rounded-xl border border-border dark:border-glass-border shadow-lg dark:shadow-xl">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!currentConversation ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50 dark:text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8s-8-3.582-8-8 8-3.582 8-8 8-8zM12 14a2 2 0 100-4 2 2 0 114-4 2 0 014z" />
                  </svg>
                  <h3 className="text-lg font-medium text-foreground dark:text-foreground mb-2">开始一个新对话</h3>
                  <p className="text-sm text-muted-foreground dark:text-foreground/50">选择左侧的对话或创建新对话</p>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MessageBubble
                        message={message}
                        isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            disabled={isLoading || !currentConversation}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </AILayout>
  );
}
