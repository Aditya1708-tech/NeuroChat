import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import {
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Settings,
  LogOut,
  X,
  PanelLeftClose,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    conversations,
    activeConversationId,
    startNewChat,
    searchQuery,
    setSearchQuery,
    renameConversation,
    deleteConversation,
  } = useChat();
  const navigate = useNavigate();

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleStartNew = () => {
    startNewChat();
    navigate('/chat');
    if (onClose) onClose();
  };

  const handleOpenRename = (e, c) => {
    e.stopPropagation();
    setRenamingId(c.id);
    setNewTitle(c.title);
    setRenameModalOpen(true);
  };

  const handleConfirmRename = async (e) => {
    e.preventDefault();
    if (renamingId && newTitle.trim()) {
      await renameConversation(renamingId, newTitle.trim());
      setRenameModalOpen(false);
    }
  };

  const handleOpenDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteConversation(deletingId);
      setDeleteModalOpen(false);
    }
  };

  return (
    <>
      {/* Mobile drawer backdrop overlay */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <div className="sidebar-inner-content">
          {/* Header & Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px',
              minHeight: '36px',
            }}
          >
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
              }}
            >
              <img src="/favicon.png" alt="NeuroChat Logo" width="34" height="34" style={{ borderRadius: '8px', objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>
                <span className="gradient-text">Neuro</span>
                <span style={{ color: 'var(--text-primary)' }}>Chat</span>
              </span>
            </Link>

            {/* Collapse toggle button (desktop collapse / mobile close) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  if (onClose) onClose();
                } else {
                  if (onToggleCollapse) onToggleCollapse();
                }
              }}
              className="icon-btn sidebar-collapse-btn"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              style={{
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--dur) var(--ease), color var(--dur) var(--ease)',
              }}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleStartNew}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Plus size={18} />
          <span>{t('chat.newChat')}</span>
        </button>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.searchPlaceholder')}
            aria-label="Search conversations"
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-page)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Conversation List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {conversations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 12px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
            >
              {searchQuery ? t('chat.noMatch') : t('chat.noConversations')}
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    navigate(`/chat/${conv.id}`);
                    if (onClose) onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--bg-soft)' : 'transparent',
                    boxShadow: isActive ? 'var(--glow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color var(--dur-fast) ease',
                  }}
                  className="conv-item"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <MessageSquare
                      size={15}
                      color={isActive ? 'var(--color-indigo-500)' : 'var(--text-secondary)'}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--color-indigo-600)' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={conv.title}
                      >
                        {conv.title}
                      </span>
                      {conv.updatedAt && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="conv-actions" style={{ display: 'flex', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenRename(e, conv)}
                      className="icon-btn"
                      style={{ width: '28px', height: '28px' }}
                      title="Rename"
                      aria-label="Rename conversation"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(e, conv.id)}
                      className="icon-btn"
                      style={{ width: '28px', height: '28px' }}
                      title="Delete"
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={13} color="var(--error)" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 8px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              fontSize: '0.9rem',
              padding: '0 8px',
              width: '100%',
              gap: '10px',
            }}
          >
            {theme === 'dark' ? (
              <Sun size={16} color="#fbbf24" />
            ) : (
              <Moon size={16} color="var(--color-indigo-500)" />
            )}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          <Link
            to="/settings"
            className="btn"
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              fontSize: '0.9rem',
              padding: '0 8px',
            }}
          >
            <Settings size={16} />
            <span>{t('settings.title')}</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              fontSize: '0.9rem',
              padding: '0 8px',
              color: 'var(--error)',
            }}
          >
            <LogOut size={16} />
            <span>{t('settings.logout')}</span>
          </button>
          </div>
        </div>
      </aside>

      {/* Rename Modal */}
      <Modal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Rename Conversation"
      >
        <form onSubmit={handleConfirmRename}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            maxLength={100}
            autoFocus
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              marginBottom: '20px',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={() => setRenameModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Conversation?"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem' }}>
          Are you sure you want to delete this conversation and all its messages? This action cannot be
          undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            style={{ background: 'var(--error)' }}
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100%;
          background-color: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 16px 12px;
          gap: 12px;
          z-index: 40;
          box-sizing: border-box;
          flex-shrink: 0;
          transition: width 0.3s cubic-bezier(0.2, 0, 0, 1),
                      padding 0.3s cubic-bezier(0.2, 0, 0, 1),
                      margin-left 0.3s cubic-bezier(0.2, 0, 0, 1),
                      opacity 0.25s cubic-bezier(0.2, 0, 0, 1),
                      border-color 0.3s cubic-bezier(0.2, 0, 0, 1);
          overflow: hidden;
        }

        .sidebar-inner-content {
          width: calc(var(--sidebar-width) - 24px);
          min-width: calc(var(--sidebar-width) - 24px);
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0, 0, 1);
        }

        .sidebar-collapse-btn:hover {
          background-color: var(--surface-hover) !important;
          color: var(--text-primary) !important;
        }

        @media (min-width: 1024px) {
          .sidebar.sidebar-collapsed {
            width: 0 !important;
            min-width: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            border-right-width: 0 !important;
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
          }
          .sidebar.sidebar-collapsed .sidebar-inner-content {
            opacity: 0;
            transform: translateX(-24px);
          }
        }

        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 1023px) {
          .sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            box-shadow: var(--shadow-xl);
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
          }
          .sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(3px);
            z-index: 39;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .sidebar-backdrop.active {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}</style>
    </>
  );
}
