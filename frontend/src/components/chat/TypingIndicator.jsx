import React from 'react';
import { useTranslation } from 'react-i18next';

export function TypingIndicator() {
  const { t } = useTranslation();

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '16px 0',
        padding: '14px 18px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        borderLeft: '3.5px solid var(--color-indigo-500)',
        maxWidth: 'fit-content',
        boxShadow: 'var(--shadow-sm)',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'var(--gradient-primary)',
          display: 'grid',
          placeItems: 'center',
          color: '#ffffff',
          fontSize: '11px',
          boxShadow: 'var(--glow-sm)',
        }}
      >
        ✦
      </div>
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {t('chat.thinking')}
      </span>
    </div>
  );
}
