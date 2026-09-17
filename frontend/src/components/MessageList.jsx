import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, loading, messagesLoading }) => {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="message-list">
      {messagesLoading ? (
        <div className="messages-loading">
          <div className="messages-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading messages...</p>
        </div>
      ) : messages.length === 0 && !loading ? (
        <div className="empty-chat">
          <div className="empty-chat-icon">🧠</div>
          <h2>NeuroChat</h2>
          <p>Your Intelligent Conversation Partner</p>
          <p className="empty-chat-hint">Start a conversation by typing a message below</p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} />
          ))}
          {loading && (
            <div className="message-bubble message-ai">
              <div className="message-avatar">🧠</div>
              <div className="message-content">
                <div className="message-role">NeuroChat</div>
                <div className="message-text typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
