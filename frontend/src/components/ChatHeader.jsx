import { useAuth } from '../context/AuthContext';

const ChatHeader = ({ title }) => {
  const { logout } = useAuth();

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <h1 className="chat-brand">🧠 NeuroChat</h1>
        <span className="chat-title">{title || 'New Conversation'}</span>
      </div>
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </header>
  );
};

export default ChatHeader;
