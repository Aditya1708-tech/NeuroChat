import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import { Sidebar } from '../components/conversations/Sidebar.jsx';
import { MessageBubble } from '../components/chat/MessageBubble.jsx';
import { WelcomeState } from '../components/chat/WelcomeState.jsx';
import { TypingIndicator } from '../components/chat/TypingIndicator.jsx';
import { ImageProgressCard } from '../components/chat/ImageProgressCard.jsx';
import { Composer } from '../components/chat/Composer.jsx';
import { OnboardingModal } from '../components/onboarding/OnboardingModal.jsx';
import { Menu, Plus, AlertCircle, RotateCw } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { userService } from '../services/userService.js';
import { FolderOpen, Sparkles } from 'lucide-react';
import { ArtifactEditor } from '../components/chat/ArtifactEditor.jsx';
import { ArtifactLibraryModal } from '../components/chat/ArtifactLibraryModal.jsx';
import { ModelSelector } from '../components/chat/ModelSelector.jsx';
import { ImageStudioModal } from '../components/image/ImageStudioModal.jsx';

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
    activeArtifact,
    closeArtifact,
    libraryModalOpen,
    setLibraryModalOpen,
    imageStudioOpen,
    setImageStudioOpen,
    selectedModel,
  } = useChat();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('neurochat:sidebar-collapsed') === 'true';
  });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);
  const messageEndRef = useRef(null);

  // Split-panel resizer state
  const [paneWidth, setPaneWidth] = useState(() => {
    const saved = localStorage.getItem('nc_artifact_pane_width');
    const parsed = saved ? parseFloat(saved) : 50;
    return isNaN(parsed) || parsed < 20 || parsed > 80 ? 50 : parsed;
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      if (typeof clientX !== 'number') return;
      const totalWidth = window.innerWidth;
      const artifactWidthPx = totalWidth - clientX;
      let percentage = (artifactWidthPx / totalWidth) * 100;
      if (percentage < 20) percentage = 20;
      if (percentage > 80) percentage = 80;
      setPaneWidth(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('nc_artifact_pane_width', String(paneWidth));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, paneWidth]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

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

  // Check if last pending user message is an image generation or enhancement task
  const lastUserMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const isImageAttachment = Boolean(
    lastUserMsg?.attachment &&
    (lastUserMsg.attachment.type === 'image' || lastUserMsg.attachment.mimeType?.startsWith('image/'))
  );
  const textPrompt = (lastUserMsg?.content || '').toLowerCase().trim();

  const isImageGenMatch = Boolean(
    /(?:generate|create|make|draw|paint|render|produce|design)\s+(?:me\s+)?(?:an?|the|some)?\s*(?:hd|4k|8k|ai|photorealistic|cinematic|digital|artistic|modern|cool)?\s*(?:image|photo|picture|wallpaper|poster|illustration|portrait|artwork|graphic|drawing|painting|logo)\b/i.test(textPrompt) ||
    /\b(?:image|photo|picture|wallpaper|poster|illustration|artwork|portrait|logo)\s+(?:of|for|showing|depicting|with)\b/i.test(textPrompt) ||
    /\b(?:draw|paint|illustrate)\s+(?:me\s+)?(?:an?|the)\b/i.test(textPrompt) ||
    /\b(?:ai image|text to image|text-to-image|flux|sdxl|generate wallpaper|चित्र बनाओ|तस्वीर बनाओ|फोटो बनाओ|इमेज बनाओ|फोटो जनरेट|इमेज जनरेट)\b/i.test(textPrompt)
  );

  const isImageEditMatch = Boolean(
    /enhance|edit|filter|color|colour|quality|restore|upscale|retouch|stylize|beautify|fix|clear|brighten|darken|contrast|vibrant|hd|4k|draw|generate|create|turn|convert|remake|redraw|सुधारो|बदलो|सुंदर/i.test(textPrompt)
  );

  const isImageAction = isImageAttachment
    ? (!textPrompt || isImageEditMatch || isImageGenMatch)
    : isImageGenMatch;

  const isPendingImageTask = Boolean(
    isSending &&
    lastUserMsg?.role === 'user' &&
    isImageAction
  );

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
          flex: isArtifactExpanded ? 0 : 1,
          display: isArtifactExpanded ? 'none' : 'flex',
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
            {/* Model Selector: Gemini (Default) vs NVIDIA Nemotron 3 Ultra */}
            <ModelSelector />

            {/* Dedicated AI Image Studio */}
            <button
              type="button"
              onClick={() => setImageStudioOpen(true)}
              className="btn"
              title="Open AI Image Studio (Gemini Key 2 Powered)"
              style={{
                height: '34px',
                padding: '0 10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#9333ea',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} />
              <span className="hide-on-mobile">Image Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setLibraryModalOpen(true)}
              className="btn"
              title="Open Artifacts Library"
              style={{
                height: '34px',
                padding: '0 10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-indigo-600)',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                gap: '6px',
              }}
            >
              <FolderOpen size={15} />
              <span className="hide-on-mobile">Library</span>
            </button>

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

      {/* Resizable Dragger Divider Handle */}
      {activeArtifact && !isArtifactExpanded && (
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onDoubleClick={() => {
            setPaneWidth(50);
            localStorage.setItem('nc_artifact_pane_width', '50');
          }}
          className={`panel-resizer ${isDragging ? 'dragging' : ''}`}
          title="Drag to resize panels • Double-click to reset 50/50"
          style={{
            width: '10px',
            cursor: 'col-resize',
            backgroundColor: isDragging ? 'var(--color-indigo-600)' : 'var(--border)',
            position: 'relative',
            zIndex: 40,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isDragging ? 'none' : 'background-color 0.15s ease',
          }}
        >
          {/* Visual Grab Grip Pill */}
          <div
            style={{
              width: '4px',
              height: '36px',
              borderRadius: '2px',
              backgroundColor: isDragging ? '#ffffff' : 'var(--text-muted)',
              opacity: isDragging ? 1 : 0.6,
              transition: 'opacity 0.15s ease, background-color 0.15s ease',
            }}
          />
        </div>
      )}

      {/* Artifact Editor Side Pane (Resizable Split-Pane) */}
      {activeArtifact && (
        <aside
          style={{
            width: isArtifactExpanded ? '100%' : `${paneWidth}%`,
            minWidth: isArtifactExpanded ? '100%' : '300px',
            maxWidth: isArtifactExpanded ? '100%' : 'calc(100% - 320px)',
            height: '100%',
            flexShrink: 0,
            transition: isDragging ? 'none' : 'width 0.15s ease',
            zIndex: 30,
            pointerEvents: isDragging ? 'none' : 'auto',
          }}
          className="artifact-editor-container"
        >
          <ArtifactEditor
            artifact={activeArtifact}
            onClose={closeArtifact}
            isExpanded={isArtifactExpanded}
            onToggleExpand={() => setIsArtifactExpanded((prev) => !prev)}
          />
        </aside>
      )}

      {/* Artifacts Library Modal */}
      <ArtifactLibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
      />

      {/* AI Image Studio Modal (Gemini Key 2 Powered) */}
      <ImageStudioModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal isOpen={onboardingOpen} onClose={handleDismissOnboarding} />

      <style>{`
        .sidebar-hamburger-btn:hover {
          background-color: var(--surface-hover) !important;
        }
        .sidebar-hamburger-btn:active {
          transform: scale(0.92);
        }
        @media (max-width: 900px) {
          .artifact-editor-container {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            z-index: 50 !important;
          }
        }
      `}</style>
    </div>
  );
}
