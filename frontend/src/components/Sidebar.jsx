import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

// Relative time formatting helper
const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Sidebar = ({ isOpen, onClose }) => {
  const {
    conversations,
    activeConversation,
    conversationsLoading,
    conversationsError,
    createConversation,
    selectConversation,
    deleteConversation,
    loadConversations
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Clear delete confirmation when active conversation changes
  useEffect(() => {
    setDeletingId(null);
  }, [activeConversation?._id]);

  // Dismiss delete confirmation on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && deletingId) {
        setDeletingId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deletingId]);

  const handleNewChat = async () => {
    try {
      await createConversation();
      setSearchQuery('');
      onClose();
    } catch (error) {
      // Error handled in context
    }
  };

  const handleSelect = (id) => {
    setDeletingId(null);
    selectConversation(id);
    onClose();
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(null);
    try {
      await deleteConversation(id);
    } catch (error) {
      // Error handled in context
    }
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Conversations</h2>
          <button className="new-chat-btn" onClick={handleNewChat}>
            + New Chat
          </button>
        </div>

        {/* Search — shown when conversations are loaded */}
        {!conversationsLoading && !conversationsError && conversations.length > 0 && (
          <div className="sidebar-search" role="search">
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button
                className="sidebar-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="conversation-list" aria-live="polite">
          {conversationsLoading ? (
            /* Skeleton loading state */
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="conversation-skeleton" aria-hidden="true">
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-line-short" />
                </div>
              ))}
            </>
          ) : conversationsError ? (
            /* Error state */
            <div className="sidebar-error">
              <p>{conversationsError}</p>
              <button
                className="sidebar-retry-btn"
                onClick={loadConversations}
                aria-label="Retry loading conversations"
              >
                Retry
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            searchQuery ? (
              <p className="sidebar-no-results">No matching conversations</p>
            ) : (
              <p className="no-conversations">No conversations yet</p>
            )
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv._id}
                className={`conversation-item ${
                  activeConversation?._id === conv._id ? 'active' : ''
                }`}
                onClick={() => handleSelect(conv._id)}
              >
                {deletingId === conv._id ? (
                  /* Inline delete confirmation */
                  <div className="delete-confirm">
                    <span className="delete-confirm-text">Delete?</span>
                    <button
                      className="delete-confirm-yes"
                      onClick={(e) => confirmDelete(e, conv._id)}
                      aria-label="Confirm delete"
                      title="Confirm delete"
                    >
                      ✓
                    </button>
                    <button
                      className="delete-confirm-no"
                      onClick={cancelDelete}
                      aria-label="Cancel delete"
                      title="Cancel delete"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  /* Normal conversation item */
                  <>
                    <span className="conversation-title">{conv.title}</span>
                    <span className="conversation-time">
                      {getRelativeTime(conv.updatedAt)}
                    </span>
                    <button
                      className="delete-conv-btn"
                      onClick={(e) => handleDeleteClick(e, conv._id)}
                      aria-label="Delete conversation"
                      title="Delete conversation"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
