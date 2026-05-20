import React from 'react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, accent, secondary, danger
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      style={{
        opacity: disabled || loading ? 0.6 : 1,
        pointerEvents: disabled || loading ? 'none' : 'auto',
      }}
      {...props}
    >
      {loading ? (
        <span className="animate-spin mr-2">
          {/* Simple CSS spinner inline */}
          <svg
            className="w-4 h-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            style={{
              animation: 'spin 1s linear infinite',
              display: 'inline-block',
              width: '1em',
              height: '1em',
              verticalAlign: 'text-bottom'
            }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      ) : Icon ? (
        <span className="inline-flex mr-1.5"><Icon size={18} /></span>
      ) : null}
      {children}
      
      {/* Dynamic spinner keyframes definition injected on load */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
