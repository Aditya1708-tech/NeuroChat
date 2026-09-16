import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app start, check if a token exists and restore the user
  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem('neurochat_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (error) {
        // Token is invalid or expired — clear it
        localStorage.removeItem('neurochat_token');
      }
      setLoading(false);
    };

    restoreUser();
  }, []);

  // Register a new user
  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('neurochat_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // Login an existing user
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('neurochat_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // Logout the user
  const logout = () => {
    localStorage.removeItem('neurochat_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
