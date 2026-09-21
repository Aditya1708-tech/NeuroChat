import React, { useState } from 'react';
import { Copy, Check, RotateCw, Volume2, VolumeX, AlertTriangle, Info } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.jsx';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis.js';

export function MessageBubble({ message, isLast = false, onRetry }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const { speak, stop, isSpeaking, isSupported: voiceSupported } = useSpeechSynthesis();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(message.content);
    }
  };

  if (isUser) {
    return (
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '14px 0',
        }}
      >
        <div
          style={{
            maxWidth: '82%',
            background: 'var(--gradient-primary)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '18px 18px 4px 18px',
            lineHeight: '1.65',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxShadow: 'var(--shadow-sm)',
          }}
          title={new Date(message.createdAt).toLocaleString()}
        >
          {/* Attached Image / File Render */}
          {message.attachment && (
            <div style={{ marginBottom: message.content ? '10px' : 0 }}>
              {message.attachment.type === 'image' ? (
                <div>
                  <img
                    src={message.attachment.dataUrl}
                    alt={message.attachment.name || 'Attached image'}
                    onClick={() => setImgModalOpen(true)}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '280px',
                      borderRadius: '12px',
                      display: 'block',
                      objectFit: 'contain',
                      cursor: 'zoom-in',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                    }}
                  />
                  {imgModalOpen && (
                    <div
                      onClick={() => setImgModalOpen(false)}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 9999,
                        display: 'grid',
                        placeItems: 'center',
                        padding: '24px',
                        cursor: 'zoom-out',
                      }}
                    >
                      <img
                        src={message.attachment.dataUrl}
                        alt="Zoomed attachment"
                        style={{
                          maxWidth: '90vw',
                          maxHeight: '90vh',
                          objectFit: 'contain',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-xl)',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>📄</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={message.attachment.name}
                    >
                      {message.attachment.name}
                    </div>
                    {message.attachment.size && (
                      <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                        {(message.attachment.size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {message.content && <div>{message.content}</div>}
        </div>
      </div>
    );
  }

  // Assistant Bubble
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '16px 0',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '3.5px solid var(--color-indigo-500)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Assistant Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--gradient-primary)',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                fontSize: '12px',
                boxShadow: 'var(--glow-sm)',
              }}
            >
              ✦
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>NeuroChat</span>
            <span className="badge">✦ AI-generated</span>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Content */}
        <MarkdownRenderer content={message.content} />

        {/* Sensitive Topic Verification Note (AI-005) */}
        {message.metadata?.sensitiveTopic && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--warning)',
              color: 'var(--warning)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              This looks like a health, legal, financial, or safety topic. Please verify with a qualified
              professional or an official authoritative source.
            </span>
          </div>
        )}

        {/* Context Truncated Note */}
        {message.metadata?.contextTruncated && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-soft)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Info size={14} />
            <span>Very long conversation: earlier turns were truncated to fit the context window.</span>
          </div>
        )}

        {/* Actions Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="btn"
            style={{
              minHeight: '32px',
              padding: '0 10px',
              fontSize: '0.8rem',
              border: 'none',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
            }}
            title="Copy Markdown"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className="btn"
              style={{
                minHeight: '32px',
                padding: '0 10px',
                fontSize: '0.8rem',
                border: 'none',
                color: isSpeaking ? 'var(--color-indigo-500)' : 'var(--text-secondary)',
              }}
              title={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
            >
              {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}

          {isLast && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn"
              style={{
                minHeight: '32px',
                padding: '0 10px',
                fontSize: '0.8rem',
                border: 'none',
                color: 'var(--color-indigo-500)',
              }}
              title="Regenerate reply"
            >
              <RotateCw size={14} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
