import React from 'react';
import Badge from './Badge';

export const CalendarCard = ({
  date, // Date string (e.g. '2026-05-21')
  dayName, // e.g. 'Thu'
  dayNumber, // e.g. '21'
  monthName, // e.g. 'May'
  windows = [], // Array of drop windows for this date
  selectedWindowId,
  onSelectWindow,
  disabled = false,
  ...props
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: '220px'
      }}
      {...props}
    >
      {/* Date Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-sm)',
            width: '42px',
            height: '42px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(99, 102, 241, 0.15)'
          }}
        >
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 600 }}>{monthName}</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '-2px' }}>{dayNumber}</span>
        </div>
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.98rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          >
            {dayName}
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{date}</span>
        </div>
      </div>

      {/* Windows List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {windows.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
            No drops available
          </p>
        ) : (
          windows.map((win) => {
            const isSelected = selectedWindowId === win.id;
            const remaining = win.capacity - win.booked_count;
            const isFull = remaining <= 0;
            const isPastCutoff = new Date() > new Date(win.cutoff_time);
            const isLocked = win.status === 'locked' || isPastCutoff;
            const isHidden = win.status === 'hidden/cancelled' || !win.active;
            const isSelectable = !isFull && !isLocked && !isHidden && !disabled;

            if (isHidden) return null;

            return (
              <div
                key={win.id}
                onClick={() => isSelectable && onSelectWindow(win.id)}
                style={{
                  background: isSelected 
                    ? 'var(--primary-glow)' 
                    : isSelectable 
                      ? 'rgba(255,255,255,0.01)' 
                      : 'rgba(255, 255, 255, 0.005)',
                  border: isSelected 
                    ? '1.5px solid var(--primary)' 
                    : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  cursor: isSelectable ? 'pointer' : 'not-allowed',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  opacity: isSelectable ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (isSelectable && !isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isSelectable && !isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                  }
                }}
              >
                {/* Window Name & Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {win.window_name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {win.start_time.substring(0, 5)} - {win.end_time.substring(0, 5)}
                  </span>
                </div>

                {/* Assigned Menu Item */}
                {win.menu_item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {win.menu_item.meal_name}
                    </span>
                    {win.menu_item.allergens && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Allergens: {win.menu_item.allergens}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Menu TBD
                  </span>
                )}

                {/* Scarcity / Availability badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  {isLocked ? (
                    <Badge variant="secondary" outline>Locked</Badge>
                  ) : isFull ? (
                    <Badge variant="danger" outline>Full</Badge>
                  ) : remaining <= 5 ? (
                    <Badge variant="accent" outline pulse>{`${remaining} slots left`}</Badge>
                  ) : (
                    <Badge variant="success" outline>{`${remaining} available`}</Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarCard;
