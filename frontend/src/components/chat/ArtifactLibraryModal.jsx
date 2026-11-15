import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Code,
  FileText,
  Table,
  Download,
  Trash2,
  ExternalLink,
  FolderOpen,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.jsx';
import { artifactService, downloadFile } from '../../services/artifactService.js';
import { Modal } from '../ui/Modal.jsx';

export function ArtifactLibraryModal({ isOpen, onClose }) {
  const { openArtifact, activeConversationId } = useChat();

  const [artifacts, setArtifacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'code' | 'document' | 'data'
  const [deletingId, setDeletingId] = useState(null);

  const fetchArtifacts = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const type = activeFilter === 'all' ? undefined : activeFilter;
      const res = await artifactService.list({ search, type });
      setArtifacts(res.artifacts || []);
    } catch (err) {
      console.error('Failed to load artifacts library:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, search, activeFilter]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this artifact from your Library?')) return;
    try {
      await artifactService.delete(id);
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete artifact');
    }
  };

  const handleDownload = (art, e) => {
    e.stopPropagation();
    downloadFile(art.filename, art.content, art.mimeType);
  };

  const handleOpenInEditor = (art) => {
    openArtifact(art);
    onClose();
  };

  const getIcon = (type, format) => {
    if (type === 'data' || format === 'csv' || format === 'json') {
      return <Table size={18} color="var(--color-indigo-500)" />;
    }
    if (type === 'markdown' || type === 'document') {
      return <FileText size={18} color="var(--color-violet-500)" />;
    }
    return <Code size={18} color="var(--color-indigo-500)" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--gradient-primary)',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                boxShadow: 'var(--glow-sm)',
              }}
            >
              <FolderOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Artifacts Library</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                All code, documents, and files generated or edited across your conversations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-page)',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, filename, or code..."
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px 0 32px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'all', label: 'All Files' },
              { id: 'code', label: 'Code' },
              { id: 'document', label: 'Documents' },
              { id: 'data', label: 'Data & CSV' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  border: '1px solid',
                  borderColor: activeFilter === f.id ? 'var(--color-indigo-500)' : 'var(--border)',
                  backgroundColor:
                    activeFilter === f.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface)',
                  color: activeFilter === f.id ? 'var(--color-indigo-600)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artifacts List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '10px' }} />
              <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '10px' }} />
              <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '10px' }} />
            </div>
          ) : artifacts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-soft)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--color-indigo-500)',
                }}
              >
                <FolderOpen size={28} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {search ? 'No matching artifacts found' : 'Your Library is empty'}
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: 0 }}>
                Upload files in chat or ask NeuroChat to write code, generate documents, or edit files.
                All generated artifacts will automatically appear here!
              </p>
            </div>
          ) : (
            artifacts.map((art) => (
              <div
                key={art.id}
                onClick={() => handleOpenInEditor(art)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  gap: '12px',
                }}
                className="library-item-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-soft)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getIcon(art.type, art.format)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {art.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-soft)',
                          color: 'var(--color-indigo-600)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {art.format}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{art.filename}</span>
                      <span>•</span>
                      <span>{formatFileSize(art.size)}</span>
                      <span>•</span>
                      <span>{new Date(art.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(art, e)}
                    className="icon-btn"
                    style={{ width: '30px', height: '30px' }}
                    title={`Download ${art.filename}`}
                  >
                    <Download size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(art.id, e)}
                    className="icon-btn"
                    style={{ width: '30px', height: '30px', color: 'var(--error)' }}
                    title="Delete artifact"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenInEditor(art)}
                    className="btn btn-primary"
                    style={{
                      minHeight: '30px',
                      padding: '0 10px',
                      fontSize: '0.78rem',
                      gap: '4px',
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Open</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .library-item-hover:hover {
          border-color: var(--color-indigo-500) !important;
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

