import React from 'react';
import { Button } from '../ui/Button.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '50vh',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '32px 24px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '12px',
                color: 'var(--color-indigo-500)',
              }}
            >
              ✦
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem' }}>
              NeuroChat encountered an unexpected rendering issue. Please reload to restore your session.
            </p>
            <Button variant="primary" onClick={this.handleReset}>
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
