import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mic, MicOff, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js';

export function Composer({ onSend, isSending, disabled = false }) {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const charCount = Array.from(content).length;
  const isOverLimit = charCount > 4000;
  const canSend =
    (content.trim().length > 0 || Boolean(attachment)) &&
    !isOverLimit &&
    !isSending &&
    !disabled;

  const { isListening, isSupported: speechSupported, toggleListening } = useSpeechRecognition({
    lang: i18n.language === 'hi' ? 'hi-IN' : 'en-US',
    onResult: (transcript) => {
      setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
  });

  const handleInput = (e) => {
    setContent(e.target.value);
    autoResize();
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processFile = (file) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds the 20MB limit.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      setAttachment({
        type: isImage ? 'image' : 'file',
        name: file.name,
        size: file.size,
        mimeType: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
        dataUrl: reader.result,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input so user can re-select the same file if desired
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  // Support pasting images directly from clipboard (e.g. Snipping Tool)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  };

  // Drag & drop support
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(content, undefined, attachment);
    setContent('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  useEffect(() => {
    if (!isSending && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSending]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: 'var(--bg-page)',
        borderTop: '1px solid var(--border)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          borderRadius: 'var(--radius-xl)',
          padding: '8px 12px 8px 18px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          boxShadow: isDragging ? '0 0 0 2px var(--color-indigo-500)' : 'var(--shadow-md)',
          border: isDragging ? '1px dashed var(--color-indigo-500)' : '1px solid var(--border)',
          transition: 'all var(--dur) var(--ease)',
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf,text/*,.csv,.md,.json"
          style={{ display: 'none' }}
        />

        {/* Attachment Preview Card */}
        {attachment && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              marginBottom: '8px',
              backgroundColor: 'var(--bg-soft)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              maxWidth: 'fit-content',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {attachment.type === 'image' ? (
              <img
                src={attachment.dataUrl}
                alt="Upload preview"
                style={{
                  width: '36px',
                  height: '36px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--color-indigo-500)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <FileText size={20} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={attachment.name}
              >
                {attachment.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {formatFileSize(attachment.size)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="icon-btn"
              style={{
                width: '24px',
                height: '24px',
                padding: 0,
                color: 'var(--text-secondary)',
                marginLeft: '6px',
              }}
              title="Remove attachment"
              aria-label="Remove attachment"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', width: '100%' }}>
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || disabled}
            className="icon-btn"
            style={{
              color: attachment ? 'var(--color-indigo-500)' : 'var(--text-secondary)',
              alignSelf: 'center',
              marginBottom: '2px',
            }}
            title="Attach image or file (PNG, JPG, PDF, TXT)"
            aria-label="Attach file or image"
          >
            <Paperclip size={20} />
          </button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachment
                ? 'Ask a question about this attached file...'
                : t('chat.inputPlaceholder')
            }
            aria-label="Prompt message"
            rows={1}
            disabled={isSending || disabled}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              lineHeight: '1.5',
              resize: 'none',
              maxHeight: '160px',
              padding: '8px 0',
            }}
          />

          {/* Character Counter */}
          {charCount > 3500 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: isOverLimit ? 'var(--error)' : 'var(--text-secondary)',
                alignSelf: 'center',
              }}
            >
              {charCount}/4000
            </span>
          )}

          {/* Voice Input Mic Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className="icon-btn"
              style={{
                color: isListening ? 'var(--error)' : 'var(--text-secondary)',
                background: isListening ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                alignSelf: 'center',
                marginBottom: '2px',
              }}
              title={isListening ? 'Listening...' : 'Voice Dictation'}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {/* Circular Gradient Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label="Send prompt"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: canSend ? 'var(--glow-sm)' : 'none',
              opacity: canSend ? 1 : 0.4,
              cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'all var(--dur-fast) var(--ease)',
              flexShrink: 0,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Persistent Disclaimer */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginTop: '8px',
        }}
      >
        {t('chat.disclaimer')}
      </div>
    </div>
  );
}
