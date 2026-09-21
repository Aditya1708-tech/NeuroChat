import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'anonymous'

  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        setStatus('authenticated');
      } catch (err) {
        setUser(null);
        setStatus('anonymous');
      }
    }

    checkSession();

    // Listen for session expiry event
    const handleExpired = () => {
      setUser(null);
      setStatus('anonymous');
    };

    window.addEventListener('neurochat:session-expired', handleExpired);
    return () => window.removeEventListener('neurochat:session-expired', handleExpired);
  }, []);

  const login = async (credentials) => {
    const loggedUser = await authService.login(credentials);
    setUser(loggedUser);
    setStatus('authenticated');
    return loggedUser;
  };

  const register = async (userData) => {
    const newUser = await authService.register(userData);
    setUser(newUser);
    setStatus('authenticated');
    return newUser;
  };

  const googleLogin = async (credential, rememberMe) => {
    const result = await authService.googleLogin(credential, rememberMe);
    setUser(result.user);
    setStatus('authenticated');
    return result;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore error and proceed to clear state
    }
    setUser(null);
    setStatus('anonymous');
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        login,
        register,
        googleLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
