import React from 'react';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';

export function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 16px', background: 'var(--bg-page)' }}>
        <div className="wrap" style={{ maxWidth: '780px' }}>
          <span className="badge" style={{ marginBottom: '12px' }}>
            Transparency & Security
          </span>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Last updated: September 20, 2026 · Complies with Specification §26.9
          </p>

          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
            }}
          >
            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>1. What Data NeuroChat Stores</h2>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                <li>
                  <strong>User Profile</strong>: Your name, email address, and hashed password (salted with
                  bcrypt, cost factor 12). Plaintext passwords are never saved.
                </li>
                <li>
                  <strong>Google Identity</strong>: If you sign in via Google, your verified Google Subject ID
                  (sub) and avatar picture URL are stored.
                </li>
                <li>
                  <strong>Settings</strong>: Your interface language, AI reply language, and theme preferences.
                </li>
                <li>
                  <strong>Conversations & Messages</strong>: Prompts you enter, AI replies, timestamps, and conversation titles.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>2. Data Sent to Third Parties</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                NeuroChat communicates strictly through our backend servers with the following trusted third parties:
              </p>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                <li>
                  <strong>Google Gemini API</strong>: To produce answers, your prompt text and recent
                  conversation context (up to 20 messages / 24,000 characters) are transmitted via HTTPS directly
                  from our server to Google Gemini. The browser never connects directly to Gemini.
                </li>
                <li>
                  <strong>Google Identity Services</strong>: When signing in with Google, your client verifies
                  credentials with Google OAuth.
                </li>
                <li>
                  <strong>Browser Speech Recognition</strong>: If you activate voice dictation, spoken audio is
                  processed by your local browser or vendor speech engine.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>3. Guidance to Users</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Because user messages are processed by language models, please <strong>do not submit</strong> sensitive
                personal credentials, passwords, government identification numbers, or confidential financial
                secrets in your chat prompts.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>4. Data Deletion</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You can delete individual conversations and their underlying messages at any time directly
                from the sidebar. Deletion is immediate and permanently cascades across the database.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>5. Cookies & Tracking</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                NeuroChat utilizes only one strictly essential session cookie (<code>nc_token</code>) configured
                with <code>HttpOnly</code>, <code>SameSite=Lax</code>, and <code>Secure</code> flags to preserve
                your logged-in state. We run zero advertising or third-party behavioral trackers.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
