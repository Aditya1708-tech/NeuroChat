import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'What is Java?',
  'Explain photosynthesis simply',
  'Draft a polite follow-up email',
  'Suggest a 3-day plan to learn Python',
];

export function WelcomeState({ onSelectPrompt, onOpenOnboarding }) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 16px 24px',
        maxWidth: '680px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '92px',
          height: '92px',
          margin: '0 auto 24px',
          borderRadius: '24px',
          background: 'var(--surface-glass)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'var(--glow-md), var(--shadow-md)',
          border: '1px solid var(--border)',
          padding: '8px',
        }}
      >
        <img
          src="/favicon.png"
          alt="NeuroChat"
          width="76"
          height="76"
          style={{ borderRadius: '18px', objectFit: 'contain' }}
        />
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
          fontWeight: 800,
          marginBottom: '10px',
          letterSpacing: '-0.02em',
        }}
      >
        {t('chat.hello')}
      </h1>

      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '28px' }}>
        Start a new topic or tap one of the suggested prompts below to test multi-turn context.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        {EXAMPLE_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="card card-interactive"
            style={{
              padding: '16px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{prompt}</span>
            <Sparkles size={16} color="var(--color-indigo-500)" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenOnboarding}
        className="btn"
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          border: 'none',
        }}
      >
        <HelpCircle size={16} />
        <span>First time here? View quick guide</span>
      </button>
    </div>
  );
}
