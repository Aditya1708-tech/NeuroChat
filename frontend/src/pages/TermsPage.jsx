import React from 'react';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';

export function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 16px', background: 'var(--bg-page)' }}>
        <div className="wrap" style={{ maxWidth: '780px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Academic Field Project · BCA Semester 5
          </p>

          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
            }}
          >
            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>1. Educational & Demonstration Purpose</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                NeuroChat is developed as an academic software engineering project for BCA Semester 5. It is provided
                for educational demonstration, study evaluation, and research purposes.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>2. Nature of AI Output</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                NeuroChat generates responses using probabilistic generative language models. The software does
                not warrant that output is always accurate, complete, or suitable for professional consultation.
                Users are solely responsible for verifying critical information with authoritative sources.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>3. Acceptable Use</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You agree not to use NeuroChat to generate unlawful content, launch denial of service attacks,
                attempt automated brute-force attacks against the API, or reverse engineer authentication tokens.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
