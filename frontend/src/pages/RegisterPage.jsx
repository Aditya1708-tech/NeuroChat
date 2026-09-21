import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { Navbar } from '../components/layout/Navbar.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { PasswordField } from '../components/ui/PasswordField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase.js';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: 'Name is required' }));
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFieldErrors((prev) => ({ ...prev, email: 'A valid email address is required' }));
      return;
    }

    if (!password || password.length < 8) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        rememberMe,
      });
      navigate('/chat', { replace: true });
    } catch (err) {
      if (err.fields) {
        setFieldErrors(err.fields);
      }
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    setIsSubmitting(true);
    try {
      if (!isFirebaseConfigured) {
        await googleLogin('mock_google_credential_dev_token', rememberMe);
        navigate('/chat', { replace: true });
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

      navigate('/chat', { replace: true });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/network-request-failed' || err.code === 'auth/unauthorized-domain') {
        setFormError('Google popup was interrupted. Please make sure popups/third-party cookies are allowed for localhost, or try again.');
        return;
      }
      setFormError(err.message || 'Google sign-in failed.');
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
            maxWidth: '460px',
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>{t('auth.registerTitle')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('auth.registerSub')}</p>
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
            id="register-name"
            label={t('auth.nameLabel')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aditya Sharma"
            autoComplete="name"
            error={fieldErrors.name}
            required
          />

          <TextField
            id="register-email"
            label={t('auth.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={fieldErrors.email}
            required
          />

          <PasswordField
            id="register-password"
            label={t('auth.passwordLabel')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            showStrengthMeter={true}
            error={fieldErrors.password}
            required
          />

          <PasswordField
            id="register-confirm-password"
            label={t('auth.confirmPasswordLabel')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            required
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-indigo-500)' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {t('auth.rememberMe')}
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{ width: '100%', minHeight: '46px', fontSize: '1rem', justifyContent: 'center' }}
          >
            {isSubmitting ? 'Creating account...' : t('auth.registerBtn')}
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

          {/* Google Sign-in */}
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
          {t('auth.alreadyAccount')}{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-indigo-500)' }}>
            Log in here
          </Link>
        </p>
      </div>
      </main>
    </div>
  );
}
