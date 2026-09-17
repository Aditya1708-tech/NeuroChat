import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ChatHeader from '../components/ChatHeader';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';

const Chat = () => {
  const {
    activeConversation,
    messages,
    loading,
    messagesLoading,
    loadConversations,
    createConversation,
    sendMessage
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSend = async (messageText) => {
    setError('');

    // If no active conversation, create one first and pass its ID directly
    // to avoid the React state-update race condition
    let targetConversationId = activeConversation?._id;

    if (!targetConversationId) {
      try {
        const newConv = await createConversation();
        targetConversationId = newConv._id;
      } catch (err) {
        setError('Failed to create conversation');
        return;
      }
    }

    try {
      await sendMessage(messageText, targetConversationId);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send message. Please try again.';
      setError(errorMsg);
    }
  };

  return (
    <div className="chat-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="chat-main">
        <ChatHeader title={activeConversation?.title} />

        <div className="chat-body">
          {/* Mobile sidebar toggle */}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            title="Open conversations"
          >
            ☰
          </button>

          <MessageList
            messages={messages}
            loading={loading}
            messagesLoading={messagesLoading}
          />

          {error && (
            <div className="chat-error">
              {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          <MessageInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
