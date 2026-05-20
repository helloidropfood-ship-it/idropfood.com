import React from 'react';

export const Badge = ({
  children,
  variant = 'primary', // primary, accent/gold, success, warning, danger, info, secondary
  outline = false,
  pulse = false,
  className = '',
  ...props
}) => {
  const getColors = () => {
    if (outline) {
      switch (variant) {
        case 'accent':
          return { color: 'var(--accent)', border: '1px solid rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.05)' };
        case 'success':
          return { color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', bg: 'rgba(16, 185, 129, 0.05)' };
        case 'danger':
          return { color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.05)' };
        case 'warning':
          return { color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.05)' };
        case 'info':
          return { color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.3)', bg: 'rgba(59, 130, 246, 0.05)' };
        case 'secondary':
          return { color: 'var(--text-secondary)', border: '1px solid var(--border-color)', bg: 'rgba(255, 255, 255, 0.02)' };
        default: // primary
          return { color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.3)', bg: 'rgba(99, 102, 241, 0.05)' };
      }
    } else {
      switch (variant) {
        case 'accent':
          return { color: '#060709', bg: 'var(--accent)' };
        case 'success':
          return { color: '#060709', bg: 'var(--success)' };
        case 'danger':
          return { color: '#ffffff', bg: 'var(--error)' };
        case 'warning':
          return { color: '#060709', bg: 'var(--warning)' };
        case 'info':
          return { color: '#ffffff', bg: 'var(--info)' };
        case 'secondary':
          return { color: 'var(--text-primary)', bg: 'rgba(255, 255, 255, 0.08)' };
        default: // primary
          return { color: '#ffffff', bg: 'var(--primary)' };
      }
    }
  };

  const style = getColors();

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        color: style.color,
        backgroundColor: style.bg,
        border: style.border || 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        animation: pulse ? 'pulse-badge 2s infinite alternate' : 'none'
      }}
      {...props}
    >
      {pulse && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: style.color,
            display: 'inline-block',
            boxShadow: `0 0 8px ${style.color}`
          }}
        />
      )}
      {children}

      <style>{`
        @keyframes pulse-badge {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </span>
  );
};

export default Badge;
