import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

export function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <nav
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(20px, 3.5vw, 48px)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
          aria-label="NeuroChat Home"
        >
          <img src="/favicon.png" alt="NeuroChat Logo" width="42" height="42" style={{ borderRadius: '10px', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Neuro</span>
            <span style={{ color: 'var(--text-primary)' }}>Chat</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => scrollToSection('features')}
            className="btn"
            style={{ border: 'none', background: 'transparent' }}
          >
            {t('nav.features')}
          </button>
          <button
            onClick={() => scrollToSection('how')}
            className="btn"
            style={{ border: 'none', background: 'transparent' }}
          >
            {t('nav.howItWorks')}
          </button>
          <button
            onClick={() => scrollToSection('usecases')}
            className="btn"
            style={{ border: 'none', background: 'transparent' }}
          >
            {t('nav.useCases')}
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="btn"
            style={{ border: 'none', background: 'transparent' }}
          >
            {t('nav.faq')}
          </button>

          {isAuthenticated ? (
            <Link to="/chat" className="btn btn-primary" style={{ marginLeft: '12px' }}>
              {t('nav.openChat')}
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginLeft: '12px' }}>
              <Link to="/login" className="btn">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t('nav.register')}
              </Link>
            </div>
          )}

          <ThemeToggle style={{ marginLeft: '6px' }} />
        </div>

        {/* Mobile controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-controls">
          <ThemeToggle className="mobile-theme-btn" />
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <button
            onClick={() => scrollToSection('features')}
            className="btn"
            style={{ justifyContent: 'flex-start' }}
          >
            {t('nav.features')}
          </button>
          <button
            onClick={() => scrollToSection('how')}
            className="btn"
            style={{ justifyContent: 'flex-start' }}
          >
            {t('nav.howItWorks')}
          </button>
          <button
            onClick={() => scrollToSection('usecases')}
            className="btn"
            style={{ justifyContent: 'flex-start' }}
          >
            {t('nav.useCases')}
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="btn"
            style={{ justifyContent: 'flex-start' }}
          >
            {t('nav.faq')}
          </button>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.openChat')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .mobile-controls {
          display: none !important;
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-controls {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
