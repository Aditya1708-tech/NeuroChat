import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '48px 0 32px',
        marginTop: 'auto',
      }}
    >
      <div className="wrap">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img src="/favicon.png" alt="NeuroChat Logo" width="36" height="36" style={{ borderRadius: '8px', objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem' }}>
                <span className="gradient-text">Neuro</span>Chat
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '32ch' }}>
              Your Intelligent Conversation Partner. Practical implementation of an academic study of ChatGPT.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
              BCA Semester 5 Field Project
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <a href="/#features">Features</a>
              <a href="/#how">How it works</a>
              <a href="/#usecases">Use cases</a>
              <a href="/#faq">FAQ</a>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px' }}>Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
              <Link to="/chat">Chat Dashboard</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '14px' }}>Transparency & Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <a href="mailto:student-project@college.edu">Contact Developer</a>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div>© 2026 NeuroChat Project. Built with React, Express, MongoDB & Google Gemini.</div>
          <div>Academic Software Engineering Submission</div>
        </div>
      </div>
    </footer>
  );
}
