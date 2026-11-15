import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './components/common/ProtectedRoute.jsx';

// Route-level code splitting: loads pages on-demand for instantaneous initial load
const LandingPage = lazy(() =>
  import('./pages/LandingPage.jsx').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage }))
);
const ChatPage = lazy(() =>
  import('./pages/ChatPage.jsx').then((m) => ({ default: m.ChatPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage.jsx').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/TermsPage.jsx').then((m) => ({ default: m.TermsPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-page)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--color-indigo-500)',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function App() {
  React.useEffect(() => {
    const savedFontSize = localStorage.getItem('nc_chat_font_size') || '0.9125rem';
    document.documentElement.style.setProperty('--chat-font-size', savedFontSize);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Landing Page */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Authentication Routes (instantaneous load, redirect to /chat if logged in) */}
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <LoginPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicOnlyRoute>
                        <RegisterPage />
                      </PublicOnlyRoute>
                    }
                  />

                  {/* Protected Chat Routes */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat/:id"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Settings Route */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Static Legal Pages */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  {/* Catch-all 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
