import React, { useState } from 'react';
import { useMockData } from '../../context/AppDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Schedule = () => {
  const { dropWindows, createDropWindow, updateDropWindow } = useMockData();

  // Add Window Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [date, setDate] = useState('');
  const [windowName, setWindowName] = useState('Day Drop');
  const [startTime, setStartTime] = useState('12:30');
  const [endTime, setEndTime] = useState('14:00');
  const [capacity, setCapacity] = useState('20');
  const [cutoffTime, setCutoffTime] = useState('');
  const [error, setError] = useState('');

  // Auto-calculate default cutoff: 8:00 PM previous day
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    if (selectedDate) {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      setCutoffTime(`${prevDateStr}T20:00`); // Defaults to 8:00 PM Karachi Time previous day
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!date || !windowName || !startTime || !endTime || !capacity || !cutoffTime) {
      setError('Please fill in all fields.');
      return;
    }

    // Convert times to standard hh:mm:ss for DB storage compatibility
    const formattedStart = `${startTime}:00`;
    const formattedEnd = `${endTime}:00`;
    const formattedCutoff = new Date(cutoffTime).toISOString();

    createDropWindow(date, windowName, formattedStart, formattedEnd, capacity, formattedCutoff);
    setIsAddOpen(false);
    
    // Reset
    setDate('');
    setWindowName('Day Drop');
    setStartTime('12:30');
    setEndTime('14:00');
    setCapacity('20');
    setCutoffTime('');
    setError('');
  };

  const handleToggleActive = (winId, currentStatus) => {
    updateDropWindow(winId, { active: !currentStatus });
  };

  const handleStatusChange = (winId, newStatus) => {
    updateDropWindow(winId, { status: newStatus });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            Drop Windows & Shifts Planner
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Schedule active delivery dates, adjust client capacities, and manage locking cutoff limits.
          </p>
        </div>

        <Button variant="accent" onClick={() => setIsAddOpen(true)}>
          Create Drop Window
        </Button>
      </div>

      {/* Roster list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[...dropWindows]
          .sort((a,b) => new Date(a.date) - new Date(b.date))
          .map(win => {
            const remaining = win.capacity - win.booked_count;
            const cutoffDate = new Date(win.cutoff_time);
            
            return (
              <div
                key={win.id}
                style={{
                  background: 'var(--bg-surface-solid)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {new Date(win.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <Badge variant={win.window_name === 'Day Drop' ? 'primary' : 'accent'} outline>
                      {win.window_name}
                    </Badge>
                    {!win.active && <Badge variant="secondary">Disabled</Badge>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>⏰ Duration: <strong>{win.start_time.substring(0, 5)} - {win.end_time.substring(0, 5)}</strong></span>
                    <span>👥 Booked: <strong>{win.booked_count} / {win.capacity}</strong> slots</span>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    🛑 Cutoff locking time: <strong>{cutoffDate.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                  <FormInput
                    label="Slot Status"
                    name="status"
                    type="select"
                    value={win.status}
                    onChange={(e) => handleStatusChange(win.id, e.target.value)}
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'locked', label: 'Locked' },
                      { value: 'full', label: 'Full' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'hidden', label: 'Hidden' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                    style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem' }}
                  />

                  <button
                    onClick={() => handleToggleActive(win.id, win.active)}
                    style={{
                      background: win.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${win.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                      color: win.active ? 'var(--success)' : 'var(--error)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      height: '38px'
                    }}
                  >
                    {win.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add Window Modal */}
      {isAddOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'rgba(3, 4, 6, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              Create Drop Window
            </h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {error}</span>}

              <FormInput
                label="Target Delivery Date"
                name="date"
                type="date"
                value={date}
                onChange={handleDateChange}
                required
              />

              <FormInput
                label="Window Name"
                name="windowName"
                type="select"
                value={windowName}
                onChange={(e) => setWindowName(e.target.value)}
                options={[
                  { value: 'Day Drop', label: 'Day Drop (Lunch)' },
                  { value: 'Night Drop', label: 'Night Drop (Dinner/Midnight)' }
                ]}
                required
              />

              <div className="u-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <FormInput
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              <FormInput
                label="Seat Capacity Limit"
                name="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />

              <FormInput
                label="Locking Cutoff Time"
                name="cutoffTime"
                type="datetime-local"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                helperText="Defaults to 8:00 PM previous day. Bookings lock automatically past this time."
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  Save Drop Window
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
