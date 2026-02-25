'use client';

import { useState, useEffect } from 'react';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { ChatSidebar, ChatSession, SelectedPromptInfo } from '@/components/chat/ChatSidebar';
import { ChatWindow, ChatMessage } from '@/components/chat/ChatWindow';
import { useAuthCheck } from '@/hooks/useAuthCheck';

// Local storage keys
const STORAGE_KEY = 'chat_sessions_v1';
const SELECTED_PROMPT_KEY = 'selected_prompt_v1';

interface StoredData {
  sessions: ChatSession[];
  messages: Record<string, ChatMessage[]>;
}

export default function ChatPage() {
  useAuthCheck();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [selectedPrompt, setSelectedPrompt] = useState<SelectedPromptInfo | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: StoredData = JSON.parse(stored);
        setSessions(data.sessions);
        setSessionMessages(data.messages);
        if (data.sessions.length > 0) {
          setCurrentSessionId(data.sessions[0].id);
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    } else {
      createNewSession();
    }

    // Load selected prompt
    const savedPrompt = localStorage.getItem(SELECTED_PROMPT_KEY);
    if (savedPrompt) {
      try {
        setSelectedPrompt(JSON.parse(savedPrompt));
      } catch (e) {
        console.error('Failed to load selected prompt', e);
      }
    }
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (sessions.length > 0) {
      const data: StoredData = {
        sessions,
        messages: sessionMessages
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [sessions, sessionMessages]);

  // Save selected prompt to local storage
  useEffect(() => {
    if (selectedPrompt) {
      localStorage.setItem(SELECTED_PROMPT_KEY, JSON.stringify(selectedPrompt));
    } else {
      localStorage.removeItem(SELECTED_PROMPT_KEY);
    }
  }, [selectedPrompt]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      updatedAt: Date.now(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setSessionMessages(prev => ({ ...prev, [newId]: [] }));
    setCurrentSessionId(newId);
    
    // Auto close sidebar on mobile when creating new chat
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setSessions(prev => prev.filter(s => s.id !== id));
    setSessionMessages(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const updateMessages = (messages: ChatMessage[]) => {
    if (!currentSessionId) return;

    setSessionMessages(prev => ({
      ...prev,
      [currentSessionId]: messages
    }));

    // Update session preview/title based on first user message
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              title: firstUserMsg.content.slice(0, 30) || 'New Chat',
              preview: messages[messages.length - 1].content.slice(0, 50),
              updatedAt: Date.now()
            };
          }
          return s;
        }));
      }
    }
  };

  const handleSelectPrompt = (prompt: any) => {
    setSelectedPrompt({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
    });
  };

  const currentMessages = currentSessionId ? sessionMessages[currentSessionId] || [] : [];

  return (
    <ChatLayout 
      isSidebarOpen={isSidebarOpen}
      sidebar={
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={createNewSession}
          onDeleteSession={deleteSession}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectPrompt={handleSelectPrompt}
          selectedPrompt={selectedPrompt}
        />
      }
    >
      <ChatWindow
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessionMessages={currentMessages}
        onMessagesChange={updateMessages}
        onNewSession={createNewSession}
        selectedPrompt={selectedPrompt}
      />
    </ChatLayout>
  );
}
