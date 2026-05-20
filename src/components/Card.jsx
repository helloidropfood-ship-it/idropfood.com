import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  footer,
  hoverable = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${hoverable ? 'glass-card' : 'glass-panel'} ${className}`}
      style={!hoverable ? { padding: '24px' } : {}}
      {...props}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: '20px' }}>
          {title && (
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: subtitle ? '4px' : '0'
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>

      {footer && (
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
