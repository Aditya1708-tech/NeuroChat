import React from 'react';

export function Button({
  children,
  variant = 'secondary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  icon = null,
  ...props
}) {
  let variantClass = 'btn';
  if (variant === 'primary') variantClass += ' btn-primary';
  if (variant === 'ghost') variantClass += ' icon-btn';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClass} ${className}`}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
