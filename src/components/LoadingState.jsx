import React from 'react';

export const LoadingState = ({
  message = 'Loading dashboard details...',
  size = 'md', // sm, md, lg
  className = '',
  ...props
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return { w: '24px', h: '24px', font: '0.82rem' };
      case 'lg':
        return { w: '48px', h: '48px', font: '1rem' };
      default: // md
        return { w: '36px', h: '36px', font: '0.9rem' };
    }
  };

  const spinner = getSpinnerSize();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '16px',
        width: '100%'
      }}
      {...props}
    >
      <svg
        style={{
          width: spinner.w,
          height: spinner.h,
          animation: 'spin 1s linear infinite',
          color: 'var(--primary)'
        }}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          style={{ opacity: 0.15 }}
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <span
          style={{
            fontSize: spinner.font,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)',
            fontWeight: 500
          }}
        >
          {message}
        </span>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
