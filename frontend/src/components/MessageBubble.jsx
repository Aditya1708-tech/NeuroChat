const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-bubble ${isUser ? 'message-user' : 'message-ai'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🧠'}
      </div>
      <div className="message-content">
        <div className="message-role">
          {isUser ? 'You' : 'NeuroChat'}
        </div>
        <div className="message-text">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
