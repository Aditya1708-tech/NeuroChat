import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export function ThemeToggle({ size = 18, style = {}, className = '' }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface-glass)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all var(--dur) var(--ease)',
        flexShrink: 0,
        ...style,
      }}
    >
      {isDark ? (
        <Sun
          size={size}
          style={{
            color: '#fbbf24',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      ) : (
        <Moon
          size={size}
          style={{
            color: 'var(--color-indigo-500)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      )}
    </button>
  );
}
