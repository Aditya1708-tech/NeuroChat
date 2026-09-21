import React from 'react';

export function TextField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  disabled = false,
  required = false,
  ...props
}) {
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
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
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
          padding: '0 12px',
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
