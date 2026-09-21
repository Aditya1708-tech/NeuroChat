import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { Hero3DVisual } from '../components/landing/Hero3DVisual.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Languages,
  Smartphone,
  Cpu,
  FolderLock,
  ChevronDown,
} from 'lucide-react';

export function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeUseCase, setActiveUseCase] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const features = [
    {
      span: 'span-2',
      icon: <MessageSquare size={22} color="var(--color-indigo-500)" />,
      title: 'Intelligent Conversations',
      desc: 'Ask in plain language and receive structured answers with formatted code snippets, lists, and clear hierarchy.',
    },
    {
      span: 'span-1',
      icon: <Sparkles size={22} color="var(--color-indigo-500)" />,
      title: 'Context-Aware Continuity',
      desc: 'Follow-ups seamlessly use your earlier turns so you never have to repeat yourself.',
    },
    {
      span: 'span-1',
      icon: <FolderLock size={22} color="var(--color-indigo-500)" />,
      title: 'Saved Conversation History',
      desc: 'Every session is automatically titled, securely persisted in MongoDB, and instantly searchable.',
    },
    {
      span: 'span-1',
      icon: <ShieldCheck size={22} color="var(--color-indigo-500)" />,
      title: 'Secure Authentication',
      desc: 'Email/password with bcrypt and Google OAuth. Session tokens live in httpOnly cookies.',
    },
    {
      span: 'span-1',
      icon: <Languages size={22} color="var(--color-indigo-500)" />,
      title: 'Multilingual Interaction',
      desc: 'Full English and Hindi interface with model-driven replies in your chosen language.',
    },
    {
      span: 'span-1',
      icon: <Smartphone size={22} color="var(--color-indigo-500)" />,
      title: 'Responsive & Accessible',
      desc: 'Optimized touch targets, off-canvas drawer on mobile, and WCAG AA accessibility standards.',
    },
    {
      span: 'span-2',
      icon: <Cpu size={22} color="var(--color-indigo-500)" />,
      title: 'Server-Side Google Gemini AI',
      desc: 'All AI processing happens on the backend. No API keys ever touch the frontend or client browser.',
    },
  ];

  const steps = [
    {
      num: 1,
      title: 'Create Your Account',
      desc: 'Register in seconds with email or continue seamlessly using your Google account.',
    },
    {
      num: 2,
      title: 'Ask NeuroChat Anything',
      desc: 'Type your question, explore study topics, or generate code solutions.',
    },
    {
      num: 3,
      title: 'Continue the Conversation',
      desc: 'Ask follow-up questions naturally—NeuroChat maintains sliding-window context.',
    },
    {
      num: 4,
      title: 'Revisit Anytime',
      desc: 'Your dialogues are organized, searchable, and securely saved per user.',
    },
  ];

  const useCases = [
    {
      role: 'Students',
      prompt: 'Explain photosynthesis simply',
      reply:
        '**Photosynthesis** is how plants turn sunlight, water, and CO₂ into glucose and oxygen, taking place inside chloroplasts using chlorophyll.',
    },
    {
      role: 'Developers',
      prompt: 'What is Java and why is it used?',
      reply:
        '**Java** is an object-oriented language that compiles to bytecode running on the JVM, making it platform-independent and ideal for enterprise backends.',
    },
    {
      role: 'Professionals',
      prompt: 'Draft a polite follow-up email for a project proposal',
      reply:
        'Subject: Following Up on Our Discussion\n\nHi Priya,\n\nI wanted to check in regarding the proposal we discussed last week...',
    },
    {
      role: 'Content Creators',
      prompt: 'Suggest 5 engaging title ideas for a technology blog',
      reply:
        '1. The Evolution of Everyday AI: What Actually Works\n2. Why Context Windows Matter More Than Model Size\n3. Building Your First Full-Stack Assistant...',
    },
    {
      role: 'Curious Minds',
      prompt: 'Suggest a structured 3-day roadmap to start learning Python',
      reply:
        'Day 1: Core syntax and variables. Day 2: Loops, conditionals, and functions. Day 3: Build a mini command-line project.',
    },
  ];

  const whyCards = [
    {
      title: 'Clear Guidance',
      desc: 'First-run onboarding with example prompts helps new users get started without feeling lost.',
    },
    {
      title: 'Honest AI Boundaries',
      desc: 'Clear "AI-generated" labeling, persistent disclaimers, and verification reminders on sensitive topics.',
    },
    {
      title: 'Per-User Persistence',
      desc: 'Unlike bare API frontends, all dialogues are indexed, searchable, and tied to your verified account.',
    },
    {
      title: 'Built From Research',
      desc: 'Our earlier field study of 80 participants uncovered practical AI limitations, which directly shaped NeuroChat.',
    },
  ];

  const faqs = [
    {
      q: 'Does NeuroChat browse the live web?',
      a: 'No. It generates responses solely from the AI model, which means facts can occasionally be out of date. NeuroChat is transparent about this boundary.',
    },
    {
      q: 'Which AI model powers NeuroChat?',
      a: 'Google Gemini (Flash series). All calls are orchestrated server-side by our Node.js API, so API keys are never exposed in your browser.',
    },
    {
      q: 'How does NeuroChat preserve conversation context?',
      a: 'NeuroChat uses a bounded sliding window algorithm (up to 20 messages / 24,000 characters) to pass relevant recent conversation turns with each query.',
    },
    {
      q: 'Are my conversations kept private?',
      a: 'Yes. Every database query is strictly scoped to your authenticated user account. Other users cannot read, edit, or delete your chats.',
    },
    {
      q: 'Which languages can I use?',
      a: 'NeuroChat provides full interface support in both English and हिन्दी (Hindi). The AI model itself can understand and generate replies across multiple languages.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Section */}
      <header className="hero-section">
        {/* Full-bleed Ambient Background Mesh & Lighting */}
        <div className="hero-ambient-mesh" aria-hidden="true">
          <div className="hero-orb hero-orb-left" />
          <div className="hero-orb hero-orb-center" />
          <div className="hero-orb hero-orb-right" />
          <div className="hero-grid-pattern" />
          <div className="hero-bottom-fade" />
        </div>

        <div
          className="wrap hero-grid"
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: '40px',
            alignItems: 'center',
            textAlign: 'left',
          }}
        >
          {/* Left Side: Hero Text & Branding */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'inline-flex', marginBottom: '16px' }}>
              <span className="badge" style={{ padding: '4px 14px', fontSize: '0.8rem' }}>
                ✦ {t('hero.pill')}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 3.4vw, 3rem)',
                fontWeight: 800,
                lineHeight: '1.15',
                letterSpacing: '-0.02em',
                marginBottom: '16px',
                color: 'var(--text-primary)',
              }}
            >
              Meet <span className="gradient-text">NeuroChat</span>.<br />
              Your intelligent conversation partner.
            </h1>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(0.95rem, 1.4vw, 1.05rem)',
                maxWidth: '48ch',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              {t('hero.lead')}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '14px',
              }}
            >
              <Link
                to={isAuthenticated ? '/chat' : '/register'}
                className="btn btn-primary"
                style={{ minHeight: '44px', padding: '0 24px', fontSize: '0.95rem' }}
              >
                {isAuthenticated ? t('nav.openChat') : t('hero.startChatting')}
              </Link>
              <a
                href="#how"
                className="btn"
                style={{ minHeight: '44px', padding: '0 20px', fontSize: '0.95rem' }}
              >
                {t('hero.learnMore')}
              </a>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {t('hero.fine')}
            </div>

            {/* Feature Highlights Pills */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                width: '100%',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--color-indigo-500)', fontWeight: 700 }}>✓</span> Context Memory
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--color-indigo-500)', fontWeight: 700 }}>✓</span> Backend-Only AI Keys
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--color-indigo-500)', fontWeight: 700 }}>✓</span> Persistent MongoDB
              </span>
            </div>
          </div>

          {/* Right Side: Dynamic 3D Diagram Visual */}
          <div style={{ width: '100%' }}>
            <Hero3DVisual />
          </div>
        </div>

        <style>{`
          .hero-section {
            position: relative;
            padding: 64px 0 52px;
            overflow: hidden;
            background-color: var(--bg-page);
            background-image: linear-gradient(
              180deg,
              rgba(243, 239, 255, 0.9) 0%,
              rgba(238, 242, 255, 0.45) 50%,
              var(--bg-page) 100%
            );
          }

          [data-theme='dark'] .hero-section {
            background-color: var(--bg-page);
            background-image: linear-gradient(
              180deg,
              rgba(30, 27, 75, 0.55) 0%,
              rgba(20, 21, 45, 0.3) 50%,
              var(--bg-page) 100%
            );
          }

          .hero-ambient-mesh {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 0;
          }

          .hero-orb {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
          }

          .hero-orb-left {
            width: 720px;
            height: 560px;
            left: -120px;
            top: -80px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.06) 55%, transparent 70%);
            filter: blur(40px);
          }

          .hero-orb-center {
            width: 960px;
            height: 600px;
            left: 50%;
            top: -140px;
            transform: translateX(-50%);
            background: radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.08) 55%, transparent 75%);
            filter: blur(50px);
          }

          .hero-orb-right {
            width: 760px;
            height: 580px;
            right: -120px;
            top: -40px;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.06) 55%, transparent 70%);
            filter: blur(40px);
          }

          [data-theme='dark'] .hero-orb-left {
            background: radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, rgba(99, 102, 241, 0.08) 55%, transparent 70%);
          }

          [data-theme='dark'] .hero-orb-center {
            background: radial-gradient(circle, rgba(139, 92, 246, 0.32) 0%, rgba(99, 102, 241, 0.12) 55%, transparent 75%);
          }

          [data-theme='dark'] .hero-orb-right {
            background: radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(99, 102, 241, 0.08) 55%, transparent 70%);
          }

          .hero-grid-pattern {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            background-image: 
              linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
            background-size: 48px 48px;
            mask-image: radial-gradient(ellipse 90% 75% at 50% 30%, black 30%, transparent 85%);
            -webkit-mask-image: radial-gradient(ellipse 90% 75% at 50% 30%, black 30%, transparent 85%);
          }

          [data-theme='dark'] .hero-grid-pattern {
            background-image: 
              linear-gradient(to right, rgba(165, 180, 252, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(165, 180, 252, 0.04) 1px, transparent 1px);
          }

          .hero-bottom-fade {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 80px;
            background: linear-gradient(180deg, transparent 0%, var(--bg-page) 100%);
          }

          .faq-item:hover {
            border-color: var(--color-indigo-500) !important;
            transform: translateY(-2px);
          }

          @media (max-width: 960px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
              text-align: center !important;
            }
            .hero-grid > div:first-child {
              align-items: center !important;
            }
            .hero-grid > div:first-child p {
              margin-left: auto;
              margin-right: auto;
            }
          }
        `}</style>
      </header>

      {/* Tech Stack Banner */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '24px 0',
          background: 'var(--surface)',
        }}
      >
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            BUILT WITH A ROBUST FULL-STACK ARCHITECTURE
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
              fontWeight: 700,
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>React 18</span>
            <span>•</span>
            <span>Express.js</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
            <span>•</span>
            <span>Google Gemini AI</span>
            <span>•</span>
            <span>Google Identity</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '80px 0', background: 'var(--bg-page)' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>
              Features
            </span>
            <h2 style={{ fontSize: '2.4rem', letterSpacing: '-0.01em', margin: '8px 0 12px' }}>
              Engineered for Genuine Conversations
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              Every feature is purposefully designed around the verified findings of our prior academic study.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {features.map((feat, idx) => (
              <div key={idx} className="card card-interactive">
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--bg-soft)',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how"
        style={{
          padding: '80px 0',
          background: 'var(--bg-soft)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>
              How It Works
            </span>
            <h2 style={{ fontSize: '2.4rem', margin: '8px 0 12px' }}>
              From First Question to Saved History
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              A reliable four-step journey built for student study, developer troubleshooting, and research.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
            }}
          >
            {steps.map((st) => (
              <div
                key={st.num}
                className="card"
                style={{
                  backgroundColor: 'var(--surface)',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    color: '#ffffff',
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: '16px',
                    boxShadow: 'var(--glow-sm)',
                  }}
                >
                  {st.num}
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{st.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" style={{ padding: '80px 0', background: 'var(--bg-page)' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>
              Use Cases
            </span>
            <h2 style={{ fontSize: '2.4rem', margin: '8px 0 12px' }}>
              Tailored for Practical Daily Work
            </h2>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            {useCases.map((uc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveUseCase(i)}
                className="btn"
                style={{
                  borderRadius: '999px',
                  background: activeUseCase === i ? 'var(--gradient-primary)' : 'var(--surface)',
                  color: activeUseCase === i ? '#ffffff' : 'var(--text-secondary)',
                  borderColor: activeUseCase === i ? 'transparent' : 'var(--border-strong)',
                  boxShadow: activeUseCase === i ? 'var(--glow-sm)' : 'none',
                }}
              >
                {uc.role}
              </button>
            ))}
          </div>

          {/* Active Preview */}
          <div
            className="card"
            style={{
              maxWidth: '720px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '28px',
            }}
          >
            <div
              style={{
                alignSelf: 'flex-end',
                background: 'var(--gradient-primary)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '16px 16px 4px 16px',
                fontSize: '0.95rem',
              }}
            >
              {useCases[activeUseCase].prompt}
            </div>

            <div
              style={{
                alignSelf: 'flex-start',
                background: 'var(--bg-soft)',
                borderRadius: '16px',
                padding: '16px 20px',
                fontSize: '0.95rem',
                borderLeft: '3.5px solid var(--color-indigo-500)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge">✦ AI-generated</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {useCases[activeUseCase].reply}
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                to={isAuthenticated ? '/chat' : '/register'}
                className="btn btn-primary"
              >
                Try This in Chat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why NeuroChat (Ties to Study) */}
      <section
        style={{
          padding: '80px 0',
          background: 'var(--bg-soft)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>
              Why NeuroChat
            </span>
            <h2 style={{ fontSize: '2.4rem', margin: '8px 0 12px' }}>
              Designed Around Real User Findings
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              Our Semester 3 field survey examined 80 participants and translated their feedback into
              software goals.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {whyCards.map((w, i) => (
              <div key={i} className="card" style={{ background: 'var(--surface)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{w.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {w.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mandatory Trust & Limitations Panel (§13.1, AI-010) */}
      <section style={{ padding: '60px 0', background: 'var(--bg-page)' }}>
        <div className="wrap">
          <div
            style={{
              border: '1px solid var(--warning)',
              borderLeft: '5px solid var(--warning)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ color: 'var(--warning)', fontSize: '1.25rem', marginBottom: '8px' }}>
              AI can be wrong — Trust & Transparency Notice
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.65' }}>
              AI answers can be inaccurate, incomplete, or out of date. NeuroChat does not browse the live
              web. For health, legal, financial, or emergency safety decisions, always verify answers with a
              qualified professional or authoritative official source.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '40px 0 80px', background: 'var(--bg-page)' }}>
        <div className="wrap" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>
              FAQ
            </span>
            <h2 style={{ fontSize: '2.4rem', margin: '8px 0 12px' }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="faq-item"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isOpen ? 'var(--color-indigo-500)' : 'var(--border)'}`,
                    backgroundColor: isOpen ? 'var(--surface)' : 'var(--surface-glass)',
                    boxShadow: isOpen
                      ? '0 8px 24px rgba(99, 102, 241, 0.12), var(--glow-sm)'
                      : 'var(--shadow-sm)',
                    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '1.05rem',
                        color: isOpen ? 'var(--color-indigo-500)' : 'var(--text-primary)',
                        transition: 'color 0.25s ease',
                      }}
                    >
                      {f.q}
                    </span>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: isOpen ? 'var(--bg-soft)' : 'transparent',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown
                        size={18}
                        color={isOpen ? 'var(--color-indigo-500)' : 'var(--text-secondary)'}
                      />
                    </div>
                  </button>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <p
                        style={{
                          padding: '0 22px 20px',
                          margin: 0,
                          color: 'var(--text-secondary)',
                          fontSize: '0.96rem',
                          lineHeight: '1.65',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                          transition: 'opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s',
                        }}
                      >
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{ padding: '0 16px 64px' }}>
        <div
          className="wrap"
          style={{
            background: 'var(--gradient-primary)',
            borderRadius: '28px',
            padding: '64px 24px',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '14px' }}>
            Start Your First Conversation Today
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              opacity: 0.9,
              maxWidth: '48ch',
              margin: '0 auto 28px',
              lineHeight: '1.6',
            }}
          >
            Create an account in under a minute and experience conversational AI designed with memory,
            transparency, and care.
          </p>
          <Link
            to="/register"
            className="btn"
            style={{
              minHeight: '52px',
              padding: '0 32px',
              fontSize: '1.05rem',
              backgroundColor: '#ffffff',
              color: 'var(--color-indigo-600)',
              border: 'none',
            }}
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
