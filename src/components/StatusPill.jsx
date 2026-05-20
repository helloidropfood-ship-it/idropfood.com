import React from 'react';

export const StatusPill = ({
  status, // booking: draft, scheduled, locked, cancelled, delivered, missed
          // purchase: pending_payment, proof_uploaded, approved, rejected, refunded
  className = '',
  ...props
}) => {
  const getStatusConfig = () => {
    switch (status) {
      // Booking Statuses
      case 'draft':
        return { label: 'Pending Payment', variant: 'warning', outline: true, pulse: true };
      case 'scheduled':
        return { label: 'Scheduled', variant: 'primary', outline: false, pulse: false };
      case 'locked':
        return { label: 'Locked (Prepped)', variant: 'info', outline: false, pulse: false };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'secondary', outline: true, pulse: false };
      case 'delivered':
        return { label: 'Delivered', variant: 'success', outline: false, pulse: false };
      case 'missed':
        return { label: 'Missed', variant: 'danger', outline: false, pulse: false };

      // Purchase Statuses
      case 'pending_payment':
        return { label: 'Awaiting Payment', variant: 'warning', outline: true, pulse: false };
      case 'proof_uploaded':
        return { label: 'Pending Verification', variant: 'warning', outline: false, pulse: true };
      case 'approved':
        return { label: 'Paid & Active', variant: 'success', outline: false, pulse: false };
      case 'rejected':
        return { label: 'Payment Rejected', variant: 'danger', outline: false, pulse: false };
      case 'refunded':
        return { label: 'Refunded', variant: 'secondary', outline: false, pulse: false };

      default:
        return { label: status, variant: 'secondary', outline: false, pulse: false };
    }
  };

  const config = getStatusConfig();

  // Color mappings matching index.css HSL states
  const getStyle = () => {
    const outlineColors = {
      primary: { color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.3)', bg: 'rgba(99, 102, 241, 0.05)' },
      success: { color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', bg: 'rgba(16, 185, 129, 0.05)' },
      danger: { color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.05)' },
      warning: { color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.05)' },
      info: { color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.3)', bg: 'rgba(59, 130, 246, 0.05)' },
      secondary: { color: 'var(--text-secondary)', border: '1px solid var(--border-color)', bg: 'rgba(255, 255, 255, 0.02)' }
    };

    const solidColors = {
      primary: { color: '#ffffff', bg: 'var(--primary)' },
      success: { color: '#060709', bg: 'var(--success)' },
      danger: { color: '#ffffff', bg: 'var(--error)' },
      warning: { color: '#060709', bg: 'var(--warning)' },
      info: { color: '#ffffff', bg: 'var(--info)' },
      secondary: { color: 'var(--text-primary)', bg: 'rgba(255, 255, 255, 0.08)' }
    };

    return config.outline ? outlineColors[config.variant] : solidColors[config.variant];
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        color: style.color,
        backgroundColor: style.bg,
        border: style.border || 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      {...props}
    >
      {config.pulse && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: style.color,
            display: 'inline-block',
            animation: 'pulse-dot 1.5s infinite alternate',
            boxShadow: `0 0 8px ${style.color}`
          }}
        />
      )}
      {config.label}

      <style>{`
        @keyframes pulse-dot {
          0% { opacity: 0.4; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </span>
  );
};

export default StatusPill;
