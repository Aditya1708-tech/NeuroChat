import React, { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Sparkles, MessageCircle, ShieldAlert } from 'lucide-react';

const STEPS = [
  {
    icon: <Sparkles size={24} color="var(--color-indigo-500)" />,
    title: 'Welcome to NeuroChat',
    desc: 'NeuroChat is your intelligent, context-aware conversational assistant. Ask questions, explore code, draft messages, and hold continuous multi-turn conversations.',
  },
  {
    icon: <MessageCircle size={24} color="var(--color-indigo-500)" />,
    title: 'How Conversations Work',
    desc: 'Follow-up questions naturally retain context from your earlier messages. Your conversations are saved automatically in the left sidebar, titled, and searchable whenever you return.',
  },
  {
    icon: <ShieldAlert size={24} color="var(--warning)" />,
    title: 'Honest & Responsible AI',
    desc: 'NeuroChat answers from an AI model and does not browse the live web. Answers may occasionally be inaccurate. Always verify crucial medical, legal, or financial decisions with qualified professionals.',
  },
];

export function OnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setStep(0);
      onClose();
    }
  };

  const handleDismiss = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss}>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--bg-soft)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {current.icon}
          </div>
        </div>

        <span className="badge" style={{ marginBottom: '12px' }}>
          Step {step + 1} of {STEPS.length}
        </span>

        <h3 style={{ fontSize: '1.3rem', margin: '10px 0' }}>{current.title}</h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            marginBottom: '28px',
          }}
        >
          {current.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Skip Guide
          </button>
          <Button variant="primary" onClick={handleNext}>
            {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
