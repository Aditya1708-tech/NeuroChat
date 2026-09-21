import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordField({
  label,
  id,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  disabled = false,
  showStrengthMeter = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Za-z]/.test(pwd) && /\d/.test(pwd)) score++;
    if (pwd.length >= 12 && /[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0..3
  };

  const strength = getStrength(value);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div style={{ marginBottom: '14px', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '6px',
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '0 44px 0 12px',
            border: error ? '1px solid var(--error)' : '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrengthMeter && value && (
        <div style={{ marginTop: '8px' }}>
          <div
            style={{
              height: '6px',
              backgroundColor: 'var(--border)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(strength + 1) * 25}%`,
                background:
                  strength >= 2
                    ? 'var(--success)'
                    : strength === 1
                    ? 'var(--warning)'
                    : 'var(--error)',
                transition: 'width 200ms ease, background 200ms ease',
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Strength: <strong>{strengthLabels[strength]}</strong> (Guidance only)
          </div>
        </div>
      )}

      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          style={{
            color: 'var(--error)',
            fontSize: '0.85rem',
            marginTop: '4px',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
