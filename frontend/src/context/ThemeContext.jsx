import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'neurochat_theme';
const THEMES = { LIGHT: 'light', DARK: 'dark' };

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // Read from localStorage, default to light
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  });

  // Apply theme to document root whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  }, []);

  const setTheme = useCallback((value) => {
    if (value === THEMES.LIGHT || value === THEMES.DARK) {
      setThemeState(value);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
