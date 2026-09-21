import React, { useState, useRef } from 'react';
import { Copy, Check, Volume2, ShieldCheck, Database, Cpu, Sparkles } from 'lucide-react';

export function Hero3DVisual() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -(y * 12),
      y: x * 14,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(
      `public class JVMRuntime {\n  public static void main(String[] args) {\n    System.out.println("Running on JVM");\n  }\n}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        perspective: '1200px',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        padding: '16px 8px',
      }}
      aria-hidden="true"
    >
      {/* Background Neural Constellation Diagram (Matching Spec PDF Cover Scene) */}
      <svg
        style={{
          position: 'absolute',
          inset: '-10% -8% -10% -8%',
          width: '116%',
          height: '120%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        viewBox="0 0 600 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="neuralLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.1" />
          </linearGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Constellation Polygon Lines */}
        <path
          d="M 60,110 L 220,40 L 410,50 L 540,120 L 570,260 L 490,410 L 300,440 L 110,400 L 40,260 Z"
          stroke="url(#neuralLineGrad)"
          strokeWidth="1.6"
          strokeDasharray="4 4"
        />
        {/* Inner Cross-Links */}
        <line x1="60" y1="110" x2="180" y2="140" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="220" y1="40" x2="300" y2="90" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="410" y1="50" x2="460" y2="130" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="540" y1="120" x2="490" y2="240" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="570" y1="260" x2="460" y2="340" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="490" y1="410" x2="380" y2="390" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="300" y1="440" x2="220" y2="380" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="110" y1="400" x2="150" y2="300" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />
        <line x1="40" y1="260" x2="130" y2="200" stroke="url(#neuralLineGrad)" strokeWidth="1.2" />

        {/* Constellation Nodes */}
        <circle cx="60" cy="110" r="4.5" fill="#6366F1" filter="url(#nodeGlow)" />
        <circle cx="220" cy="40" r="5.5" fill="#8B5CF6" filter="url(#nodeGlow)" />
        <circle cx="410" cy="50" r="5" fill="#6366F1" filter="url(#nodeGlow)" />
        <circle cx="540" cy="120" r="5.5" fill="#8B5CF6" filter="url(#nodeGlow)" />
        <circle cx="570" cy="260" r="4.5" fill="#6366F1" filter="url(#nodeGlow)" />
        <circle cx="490" cy="410" r="5" fill="#8B5CF6" filter="url(#nodeGlow)" />
        <circle cx="300" cy="440" r="5.5" fill="#6366F1" filter="url(#nodeGlow)" />
        <circle cx="110" cy="400" r="5" fill="#8B5CF6" filter="url(#nodeGlow)" />
        <circle cx="40" cy="260" r="4.5" fill="#6366F1" filter="url(#nodeGlow)" />

        {/* Inner Nodes */}
        <circle cx="180" cy="140" r="3.5" fill="#A5B4FC" />
        <circle cx="460" cy="130" r="3.5" fill="#A5B4FC" />
        <circle cx="460" cy="340" r="3.5" fill="#A5B4FC" />
        <circle cx="150" cy="300" r="3.5" fill="#A5B4FC" />
      </svg>

      {/* 3D Floating Stage with Interactive Tilt */}
      <div
        className="hero-3d-stage"
        style={{
          position: 'relative',
          zIndex: 1,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* ============================================================ */}
        {/* CARD 1: User Context Query (Turn 1 & 2) */}
        {/* ============================================================ */}
        <div
          className="glass-panel"
          style={{
            transform: 'translateZ(30px)',
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            boxShadow: '0 16px 32px rgba(99, 102, 241, 0.12), var(--glow-sm)',
            overflow: 'hidden',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              background: 'var(--bg-soft)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                Active Dialogue Context · 2 Turns
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sliding Window</span>
            </div>
          </div>

          {/* Card Messages */}
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <div
                style={{
                  background: 'var(--gradient-primary)',
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: '14px 14px 2px 14px',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                }}
              >
                What is Java?
              </div>
            </div>

            {/* Neural Analysis Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '6px',
                fontSize: '0.72rem',
                color: 'var(--color-indigo-600)',
              }}
            >
              <Cpu size={12} />
              <span>Context builder: 24,000 char budget · Contiguous memory</span>
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <div
                style={{
                  background: 'var(--gradient-primary)',
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: '14px 14px 2px 14px',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                }}
              >
                What are its advantages?
              </div>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textAlign: 'right', display: 'block', marginTop: '2px' }}>
                Understands 'its' refers to Java ✓
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: NeuroChat AI Response & Code Synthesis */}
        {/* ============================================================ */}
        <div
          className="glass-panel"
          style={{
            transform: 'translateZ(45px)',
            background: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            borderLeft: '3.5px solid var(--color-indigo-500)',
            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.16), var(--glow-md)',
            overflow: 'hidden',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              background: 'var(--bg-page)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                  fontSize: '9px',
                }}
              >
                ✦
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>NeuroChat</span>
              <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                ✦ AI-generated
              </span>
            </div>

            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Gemini 1.5 Flash · 1.1s
            </span>
          </div>

          {/* Card Body */}
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--text-primary)' }}>
              Key advantages of <strong>Java</strong>:
            </p>

            <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <li><strong>Platform Independence</strong>: Runs anywhere with JVM bytecode.</li>
              <li><strong>Automatic Memory</strong>: Built-in garbage collection.</li>
            </ul>

            {/* Synthesized Code Block */}
            <div
              style={{
                borderRadius: '6px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '3px 8px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span>JVMExecution.java</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-indigo-500)',
                    fontWeight: 600,
                    fontSize: '0.68rem',
                  }}
                >
                  {copied ? <Check size={10} color="var(--success)" /> : <Copy size={10} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre
                style={{
                  padding: '6px 10px',
                  margin: 0,
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: '1.4',
                  color: 'var(--text-primary)',
                  overflowX: 'auto',
                }}
              >
                <code>{`public class Hello {
  public static void main(String[] a) {
    System.out.println("Hello, NeuroChat!");
  }
}`}</code>
              </pre>
            </div>

            {/* Security Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--border)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={11} color="var(--success)" />
                <span>Backend Key Safe</span>
              </span>
              <span style={{ color: 'var(--color-indigo-600)', fontWeight: 600 }}>
                MongoDB Persisted ✓
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatStage {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .hero-3d-stage {
          animation: floatStage 6s ease-in-out infinite;
        }
        .hero-3d-stage:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
