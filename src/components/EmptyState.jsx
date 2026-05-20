import React from 'react';

export const EmptyState = ({
  title = 'No drops scheduled yet',
  description = 'Assign your meal credits to upcoming days to start receiving premium corporate drops.',
  icon: Icon,
  action, // React element (button)
  className = '',
  ...props
}) => {
  return (
    <div
      className={`glass-panel ${className}`}
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '0 auto',
        borderStyle: 'dashed'
      }}
      {...props}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          marginBottom: '20px'
        }}
      >
        {Icon ? (
          <Icon size={28} />
        ) : (
          <svg
            style={{ width: '28px', height: '28px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        )}
      </div>

      <h4
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          marginBottom: action ? '24px' : '0'
        }}
      >
        {description}
      </p>

      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
