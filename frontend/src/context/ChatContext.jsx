import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all conversations for sidebar
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
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
    try {
      const res = await api.get(`/conversations/${conversationId}`);
      setActiveConversation(res.data.conversation);
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, []);

  // Send a message and get AI response
  const sendMessage = useCallback(async (messageText) => {
    if (!activeConversation) return;

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
        `/conversations/${activeConversation._id}/messages`,
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
            c._id === activeConversation._id
              ? { ...c, title: res.data.conversationTitle, updatedAt: new Date().toISOString() }
              : c
          )
        );
        setActiveConversation((prev) => ({
          ...prev,
          title: res.data.conversationTitle
        }));
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
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));

      // If we deleted the active conversation, clear it
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [activeConversation]);

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
