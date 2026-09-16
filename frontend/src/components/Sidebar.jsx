import { useChat } from '../context/ChatContext';

const Sidebar = ({ isOpen, onClose }) => {
  const {
    conversations,
    activeConversation,
    createConversation,
    selectConversation,
    deleteConversation
  } = useChat();

  const handleNewChat = async () => {
    try {
      await createConversation();
      onClose();
    } catch (error) {
      // Error handled in context
    }
  };

  const handleSelect = (id) => {
    selectConversation(id);
    onClose();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      try {
        await deleteConversation(id);
      } catch (error) {
        // Error handled in context
      }
    }
  };

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

        <div className="conversation-list">
          {conversations.length === 0 ? (
            <p className="no-conversations">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className={`conversation-item ${
                  activeConversation?._id === conv._id ? 'active' : ''
                }`}
                onClick={() => handleSelect(conv._id)}
              >
                <span className="conversation-title">{conv.title}</span>
                <button
                  className="delete-conv-btn"
                  onClick={(e) => handleDelete(e, conv._id)}
                  title="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
