import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { Navbar } from '../components/layout/Navbar.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { PasswordField } from '../components/ui/PasswordField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';

import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase.js';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract redirect URL safely per §13.2
  const params = new URLSearchParams(location.search);
  const redirectTarget = params.get('redirect') || '/chat';
  const safeRedirect =
    redirectTarget.startsWith('/') && !redirectTarget.startsWith('//') ? redirectTarget : '/chat';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setFormError('Please enter a valid email address (e.g., you@example.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password, rememberMe });
      navigate(safeRedirect, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Incorrect email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    setIsSubmitting(true);
    try {
      if (!isFirebaseConfigured) {
        // Safe dev fallback if Firebase config is not yet added to .env
        await googleLogin('mock_google_credential_dev_token', rememberMe);
        navigate(safeRedirect, { replace: true });
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken || (await result.user.getIdToken());

      await googleLogin(
        {
          idToken,
          user: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            emailVerified: result.user.emailVerified,
          },
        },
        rememberMe
      );

      navigate(safeRedirect, { replace: true });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/network-request-failed' || err.code === 'auth/unauthorized-domain') {
        setFormError('Google popup was interrupted. Please make sure popups/third-party cookies are allowed for localhost, or try again.');
        return;
      }
      setFormError(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: '36px 16px',
          background: 'var(--gradient-glow), var(--bg-page)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top center',
        }}
      >
        <div
          className="glass-panel"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '440px',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            backgroundColor: 'var(--surface-glass)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Quick theme toggle */}
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <ThemeToggle size={16} style={{ width: '34px', height: '34px' }} />
          </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              textDecoration: 'none',
            }}
            aria-label="NeuroChat Home"
          >
            <img
              src="/logo.png"
              alt="NeuroChat — Your Intelligent Conversation Partner"
              style={{
                width: '240px',
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '110px',
                objectFit: 'contain',
                borderRadius: '16px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.12)',
              }}
            />
          </Link>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>{t('auth.loginTitle')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('auth.loginSub')}</p>
        </div>

        {formError && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '0.875rem',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-email"
            label={t('auth.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <PasswordField
            id="login-password"
            label={t('auth.passwordLabel')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              fontSize: '0.85rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-indigo-500)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{t('auth.rememberMe')}</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '46px', fontSize: '1rem', justifyContent: 'center' }}
          >
            {isSubmitting ? 'Signing in...' : t('auth.loginBtn')}
          </Button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ flex: 1, borderTop: '1px solid var(--border)' }} />
            <span>or</span>
            <div style={{ flex: 1, borderTop: '1px solid var(--border)' }} />
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="btn"
            style={{
              width: '100%',
              minHeight: '46px',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.95rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('auth.googleBtn')}</span>
          </button>
        </form>

        <p
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          {t('auth.needAccount')}{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-indigo-500)' }}>
            Register here
          </Link>
        </p>
      </div>
      </main>
    </div>
  );
}
