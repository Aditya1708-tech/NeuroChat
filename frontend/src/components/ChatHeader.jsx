import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ChatHeader = ({ title }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <h1 className="chat-brand">🧠 NeuroChat</h1>
        <span className="chat-title">{title || 'New Conversation'}</span>
      </div>
      <div className="chat-header-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <span className="theme-toggle-icon">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
        </button>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
