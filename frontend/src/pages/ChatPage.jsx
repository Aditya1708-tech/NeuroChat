import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import { Sidebar } from '../components/conversations/Sidebar.jsx';
import { MessageBubble } from '../components/chat/MessageBubble.jsx';
import { WelcomeState } from '../components/chat/WelcomeState.jsx';
import { TypingIndicator } from '../components/chat/TypingIndicator.jsx';
import { Composer } from '../components/chat/Composer.jsx';
import { OnboardingModal } from '../components/onboarding/OnboardingModal.jsx';
import { Menu, Plus, AlertCircle, RotateCw } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { userService } from '../services/userService.js';

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const {
    conversations,
    activeConversationId,
    messages,
    isLoadingHistory,
    isSending,
    chatError,
    selectConversation,
    startNewChat,
    sendMessage,
    retryLastMessage,
  } = useChat();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('neurochat:sidebar-collapsed') === 'true';
  });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const messageEndRef = useRef(null);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('neurochat:sidebar-collapsed', String(next));
        return next;
      });
    }
  };

  // Sync route param with active conversation
  useEffect(() => {
    if (id && id !== activeConversationId) {
      selectConversation(id);
    } else if (!id && activeConversationId && !isSending) {
      startNewChat();
    }
  }, [id, activeConversationId, isSending, selectConversation, startNewChat]);

  const handleSend = (content, language, attachment) => {
    sendMessage(content, language, attachment, (newId) => {
      navigate(`/chat/${newId}`, { replace: true });
    });
  };

  // First-run onboarding check
  useEffect(() => {
    if (user && !user.settings?.onboardingCompleted) {
      setOnboardingOpen(true);
    }
  }, [user]);

  const handleDismissOnboarding = async () => {
    setOnboardingOpen(false);
    if (user && !user.settings?.onboardingCompleted) {
      try {
        const updated = await userService.updateProfile({
          settings: { onboardingCompleted: true },
        });
        updateUser(updated);
      } catch (e) {
        // Fallback
      }
    }
  };

  // Auto-scroll to bottom of message list
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const currentConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-page)',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar (Desktop persistent collapsible + Mobile off-canvas drawer) */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Chat Column */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            height: '56px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Hamburger toggle button (Desktop collapse & Mobile drawer) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="icon-btn sidebar-hamburger-btn"
            aria-label={sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
            id="sidebar-toggle-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color var(--dur) var(--ease), transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <Menu size={20} />
          </button>

          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentConv ? currentConv.title : 'NeuroChat'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle size={18} style={{ width: '36px', height: '36px' }} />
            <button
              type="button"
              onClick={() => {
                startNewChat();
                navigate('/chat');
              }}
              className="icon-btn"
              title="Start new conversation"
              aria-label="New chat"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              maxWidth: 'var(--content-max)',
              width: '100%',
              margin: '0 auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {isLoadingHistory ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '32px 0',
                }}
              >
                <div className="skeleton" style={{ height: '64px', width: '70%', alignSelf: 'flex-end' }} />
                <div className="skeleton" style={{ height: '120px', width: '85%', alignSelf: 'flex-start' }} />
                <div className="skeleton" style={{ height: '54px', width: '60%', alignSelf: 'flex-end' }} />
              </div>
            ) : messages.length === 0 ? (
              <WelcomeState
                onSelectPrompt={(prompt) => handleSend(prompt)}
                onOpenOnboarding={() => setOnboardingOpen(true)}
              />
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id || idx}
                  message={msg}
                  isLast={idx === messages.length - 1}
                  onRetry={retryLastMessage}
                />
              ))
            )}

            {/* Thinking Indicator */}
            {isSending && <TypingIndicator />}

            {/* Inline Error Banner with Retry */}
            {chatError && (
              <div
                role="alert"
                style={{
                  margin: '16px 0',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem' }}>{chatError}</span>
                </div>
                <button
                  type="button"
                  onClick={retryLastMessage}
                  className="btn"
                  style={{
                    border: 'none',
                    background: 'var(--error)',
                    color: '#ffffff',
                    minHeight: '32px',
                    padding: '0 12px',
                    fontSize: '0.85rem',
                  }}
                >
                  <RotateCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Sticky Composer */}
        <Composer onSend={handleSend} isSending={isSending} />
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal isOpen={onboardingOpen} onClose={handleDismissOnboarding} />

      <style>{`
        .sidebar-hamburger-btn:hover {
          background-color: var(--surface-hover) !important;
        }
        .sidebar-hamburger-btn:active {
          transform: scale(0.92);
        }
      `}</style>
    </div>
  );
}
