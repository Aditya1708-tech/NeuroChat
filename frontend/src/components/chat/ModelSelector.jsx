import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { Sparkles, Cpu, ChevronDown, Check } from 'lucide-react';

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const models = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      tag: 'Default',
      desc: 'Gemini 3.5 Flash • Fast conversational answers & coding',
      icon: Sparkles,
      color: '#4f46e5',
      bgColor: 'rgba(79, 70, 229, 0.1)',
    },
    {
      id: 'nemotron',
      name: 'NVIDIA Nemotron 3 Ultra',
      tag: '550B Reasoning',
      desc: 'Nemotron-3 Ultra 550B • Complex logic & technical tasks',
      icon: Cpu,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  const current = models.find((m) => m.id === selectedModel) || models[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`Active Chat Model: ${current.name}. Click to switch model.`}
        style={{
          height: '34px',
          padding: '0 10px',
          fontSize: '0.82rem',
          fontWeight: 600,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.25)' : 'none',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            background: current.bgColor,
            color: current.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CurrentIcon size={12} />
        </div>
        <span className="model-selector-name" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current.name}
        </span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '270px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.08)',
            padding: '6px',
            zIndex: 1050,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            style={{
              padding: '6px 10px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
              marginBottom: '4px',
            }}
          >
            Select Chat Model
          </div>

          {models.map((m) => {
            const isSelected = m.id === selectedModel;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  setSelectedModel(m.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-soft)' : 'transparent',
                  border: isSelected ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  margin: '2px 0',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-soft)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: m.bgColor,
                    color: m.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: m.bgColor,
                        color: m.color,
                      }}
                    >
                      {m.tag}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.35,
                      marginTop: '2px',
                    }}
                  >
                    {m.desc}
                  </div>
                </div>
                {isSelected && (
                  <div style={{ color: 'var(--color-indigo-600)', marginTop: '4px' }}>
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })}

          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Model stays active across chats</span>
          </div>
        </div>
      )}
    </div>
  );
}

