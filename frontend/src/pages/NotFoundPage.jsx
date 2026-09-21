import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: '48px 16px',
          textAlign: 'center',
          background: 'var(--bg-page)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'clamp(5rem, 12vw, 8rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              lineHeight: '1',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 8px 24px rgba(99, 102, 241, 0.25))',
              marginBottom: '16px',
            }}
          >
            404
          </div>

          <h1 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>We couldn't find that page</h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              maxWidth: '42ch',
              margin: '0 auto 28px',
            }}
          >
            The link may be broken or the page may have moved.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
            <Link to="/chat" className="btn">
              Open Chat
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
