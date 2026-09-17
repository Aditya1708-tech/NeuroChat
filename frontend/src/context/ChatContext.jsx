import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Auto-clear all chat state when user logs out
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setLoading(false);
      setConversationsLoading(false);
      setConversationsError(null);
      setMessagesLoading(false);
    }
  }, [user]);

  // Load all conversations for sidebar
  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversationsError('Failed to load conversations');
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async () => {
    try {
      const res = await api.post('/conversations');
      const newConv = res.data.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
      return newConv;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }, []);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conversationId) => {
    setMessagesLoading(true);
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      setActiveConversation(res.data.conversation);
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      // If conversation was deleted externally, remove from sidebar
      if (error.response?.status === 404 || error.response?.status === 403) {
        setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      }
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Send a message and get AI response
  // Accepts optional targetConversationId to avoid race condition
  // when creating a new conversation and immediately sending a message
  const sendMessage = useCallback(async (messageText, targetConversationId) => {
    const convId = targetConversationId || activeConversation?._id;
    if (!convId) return;

    setLoading(true);

    // Optimistically add user message to the UI
    const tempUserMsg = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post(
        `/conversations/${convId}/messages`,
        { message: messageText }
      );

      // Replace temp message with real one and add AI response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempUserMsg._id);
        return [...filtered, res.data.userMessage, res.data.aiMessage];
      });

      // Update conversation title in sidebar if it changed
      if (res.data.conversationTitle) {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === convId
              ? { ...c, title: res.data.conversationTitle, updatedAt: new Date().toISOString() }
              : c
          )
        );
        setActiveConversation((prev) => {
          if (prev?._id === convId) {
            return { ...prev, title: res.data.conversationTitle };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      // If server returned the user message but Gemini failed, keep user message
      if (error.response?.data?.userMessage) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== tempUserMsg._id);
          return [...filtered, error.response.data.userMessage];
        });
      } else {
        // Remove optimistic message on total failure
        setMessages((prev) => prev.filter((m) => m._id !== tempUserMsg._id));
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConversation]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await api.delete(`/conversations/${conversationId}`);

      const isActive = activeConversation?._id === conversationId;

      // Remove from sidebar
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));

      // If we deleted the active conversation, auto-select the next one
      if (isActive) {
        const remaining = conversations.filter((c) => c._id !== conversationId);
        if (remaining.length > 0) {
          // Select the most recent remaining conversation
          selectConversation(remaining[0]._id);
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [activeConversation, conversations, selectConversation]);

  // Clear chat state (used on logout)
  const clearChat = useCallback(() => {
    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
    setLoading(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loading,
        conversationsLoading,
        conversationsError,
        messagesLoading,
        loadConversations,
        createConversation,
        selectConversation,
        sendMessage,
        deleteConversation,
        clearChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
