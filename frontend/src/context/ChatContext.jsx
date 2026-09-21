import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { conversationService } from '../services/conversationService.js';
import { messageService } from '../services/messageService.js';
import { useAuth } from './AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await conversationService.list({ search: debouncedSearch });
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [isAuthenticated, debouncedSearch]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for an active conversation
  const selectConversation = useCallback(
    async (id) => {
      setActiveConversationId(id);
      setChatError(null);

      if (!id) {
        setMessages([]);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const res = await messageService.list(id);
        setMessages(res.messages || []);
        setHasMoreMessages(res.hasMore || false);
      } catch (err) {
        setChatError(err.message || 'Failed to load conversation.');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    []
  );

  // Start a new chat (resets UI lazily per §11.3)
  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setChatError(null);
  };

  // Send a message
  const sendMessage = async (content = '', language, attachment, onConversationCreated) => {
    const trimmedContent = (content || '').trim();
    if ((!trimmedContent && !attachment) || isSending) return;

    setChatError(null);
    let convId = activeConversationId;

    // Optimistic user message update
    const optimisticUserMsg = {
      id: 'temp_' + Date.now(),
      role: 'user',
      content: trimmedContent,
      attachment: attachment || null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsSending(true);

    // Lazy creation of conversation if starting fresh (§11.3)
    if (!convId) {
      try {
        const titleSource = trimmedContent || (attachment ? `Analysis of ${attachment.name}` : 'New chat');
        const initialTitle = titleSource.length > 50
          ? titleSource.slice(0, 50) + '…'
          : titleSource;
        const newConv = await conversationService.create(initialTitle);
        convId = newConv.id;
        setActiveConversationId(convId);
        setConversations((prev) => [newConv, ...prev]);
        if (typeof onConversationCreated === 'function') {
          onConversationCreated(convId);
        }
      } catch (err) {
        setChatError(err.message || 'Failed to initialize conversation.');
        setIsSending(false);
        return;
      }
    }

    try {
      const response = await messageService.send(convId, trimmedContent, language, attachment);
      const { userMessage, assistantMessage, conversation: updatedConv } = response.data;

      // Replace optimistic message and append assistant message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMsg.id),
        userMessage,
        assistantMessage,
      ]);

      // Update conversations list title & timestamp
      if (updatedConv) {
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== updatedConv.id);
          return [updatedConv, ...filtered];
        });
      }
    } catch (err) {
      setChatError(err.message || "Couldn't reach NeuroChat. Please retry.");
      // Keep optimistic message so the user can review and retry
    } finally {
      setIsSending(false);
    }
  };

  // Retry last message (§11.3 & §23.4)
  const retryLastMessage = async () => {
    if (!activeConversationId || isSending) return;

    setChatError(null);
    setIsSending(true);

    try {
      const response = await messageService.retry(activeConversationId);
      const { assistantMessage, conversation: updatedConv } = response;

      setMessages((prev) => {
        // If last message was assistant, replace it; if last was user, append new assistant reply
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), assistantMessage];
        }
        return [...prev, assistantMessage];
      });

      if (updatedConv) {
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== updatedConv.id);
          return [updatedConv, ...filtered];
        });
      }
    } catch (err) {
      setChatError(err.message || 'Retry failed. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Inline rename
  const renameConversation = async (id, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      const updated = await conversationService.rename(id, newTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
      );
    } catch (err) {
      alert(err.message || 'Failed to rename conversation');
    }
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      await conversationService.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        startNewChat();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete conversation');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages,
        isLoadingHistory,
        isSending,
        chatError,
        searchQuery,
        hasMoreMessages,
        setSearchQuery,
        selectConversation,
        startNewChat,
        sendMessage,
        retryLastMessage,
        renameConversation,
        deleteConversation,
        refreshConversations: loadConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
