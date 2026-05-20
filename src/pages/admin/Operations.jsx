import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import StatusPill from '../../components/StatusPill';

export const Operations = () => {
  const {
    users,
    dropWindows,
    menuItems,
    bookings,
    markBookingDelivered,
    markBookingMissed
  } = useMockData();

  // Filter state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('all'); // all, 'Day Drop', 'Night Drop'
  const [groupByFloor, setGroupByFloor] = useState(true);

  // Get active drop windows for the selected date
  const dateWindows = dropWindows.filter(w => w.date === selectedDate);
  const winIds = dateWindows.map(w => w.id);

  // Filter bookings belonging to these windows and are NOT drafts/cancels
  const activeBookings = bookings.filter(b => 
    winIds.includes(b.drop_window_id) && 
    ['scheduled', 'locked', 'delivered', 'missed'].includes(b.status)
  );

  // Enrich bookings with user, window, and menu details
  const enrichedBookings = activeBookings.map(b => {
    const user = users.find(u => u.id === b.user_id);
    const win = dropWindows.find(w => w.id === b.drop_window_id);
    const menu = menuItems.find(m => m.id === b.menu_item_id);
    return {
      ...b,
      user,
      window: win,
      menu
    };
  }).filter(b => {
    if (selectedShift === 'all') return true;
    return b.window?.window_name === selectedShift;
  });

  // Calculate stats
  const totalMeals = enrichedBookings.length;
  const deliveredMeals = enrichedBookings.filter(b => b.status === 'delivered').length;
  const missedMeals = enrichedBookings.filter(b => b.status === 'missed').length;
  const pendingMeals = enrichedBookings.filter(b => ['scheduled', 'locked'].includes(b.status)).length;

  // Grouping bookings if toggle active
  const getGroupedData = () => {
    if (!groupByFloor) return { "All Drops": enrichedBookings };

    const groups = {};
    enrichedBookings.forEach(b => {
      const key = b.user?.floor || 'Unspecified Floor';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(b);
    });

    // Sort keys alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  };

  const groupedBookings = getGroupedData();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="ops-panel">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }} className="no-print">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            Kitchen & Delivery Manifests
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Roster and dispatch sheets for Shahrah-e-Faisal office floor drops.
          </p>
        </div>

        <Button variant="primary" onClick={handlePrint}>
          🖨️ Print Dispatch Sheets
        </Button>
      </div>

      {/* Filters Strip */}
      <div
        className="glass-panel no-print"
        style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}
      >
        <FormInput
          label="Operations Date"
          name="selectedDate"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ margin: 0 }}
        />

        <FormInput
          label="Filter Drop Shift"
          name="selectedShift"
          type="select"
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          options={[
            { value: 'all', label: 'All Shifts' },
            { value: 'Day Drop', label: 'Day Drop (Lunch)' },
            { value: 'Night Drop', label: 'Night Drop (Midnight)' }
          ]}
          style={{ margin: 0 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Sorting Layout</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={groupByFloor}
              onChange={(e) => setGroupByFloor(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            Group list by office floor
          </label>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }} className="ops-stats">
        <div style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Prep Orders</span>
          <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px' }}>{totalMeals}</h4>
        </div>
        <div style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Awaiting Delivery</span>
          <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>{pendingMeals}</h4>
        </div>
        <div style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Delivered Logs</span>
          <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--success)' }}>{deliveredMeals}</h4>
        </div>
        <div style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Missed Logs</span>
          <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--error)' }}>{missedMeals}</h4>
        </div>
      </div>

      {/* Manifest Sheets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="print-manifest-root">
        {totalMeals === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '48px 0' }}>
            No meal bookings scheduled for {new Date(selectedDate).toLocaleDateString()}.
          </p>
        ) : (
          Object.keys(groupedBookings).map(groupName => (
            <div
              key={groupName}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                pageBreakAfter: 'always'
              }}
              className="print-group-card"
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '10px',
                  marginBottom: '16px',
                  color: 'var(--accent)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                className="print-group-title"
              >
                <span>📍 {groupName}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {groupedBookings[groupName].length} Orders
                </span>
              </h3>

              {/* Manifest table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Customer Name</th>
                      <th style={{ padding: '12px' }}>Floor / Department</th>
                      <th style={{ padding: '12px' }}>Shift Window</th>
                      <th style={{ padding: '12px' }}>Meal Roster Option</th>
                      <th style={{ padding: '12px' }}>Specific Notes</th>
                      <th style={{ padding: '12px' }} className="no-print">Status</th>
                      <th style={{ padding: '12px', width: '220px' }} className="no-print">Log Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBookings[groupName].map(book => (
                      <tr
                        key={book.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          background: book.status === 'delivered' ? 'rgba(16, 185, 129, 0.02)' : book.status === 'missed' ? 'rgba(239, 68, 68, 0.02)' : 'transparent'
                        }}
                        className="print-row"
                      >
                        <td style={{ padding: '12px', fontWeight: 600 }}>{book.user?.name}</td>
                        <td style={{ padding: '12px' }}>
                          <div>{book.user?.floor}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{book.user?.department}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong>{book.window?.window_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {book.window?.start_time.substring(0, 5)} - {book.window?.end_time.substring(0, 5)}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong>{book.menu?.meal_name}</strong>
                          {book.menu?.allergens && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⚠️ {book.menu?.allergens}</div>}
                        </td>
                        <td style={{ padding: '12px', color: book.user?.delivery_notes ? 'var(--accent)' : 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                          {book.user?.delivery_notes || 'None'}
                        </td>
                        <td style={{ padding: '12px' }} className="no-print">
                          <StatusPill status={book.status} />
                        </td>
                        <td style={{ padding: '12px', display: 'flex', gap: '8px' }} className="no-print">
                          {['scheduled', 'locked'].includes(book.status) ? (
                            <>
                              <button
                                onClick={() => markBookingDelivered(book.id)}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  color: 'var(--success)',
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Delivered
                              </button>
                              <button
                                onClick={() => markBookingMissed(book.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: 'var(--error)',
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Missed
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Finalized
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Printing Stylesheet Injection */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, .no-print, header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .ops-panel {
            gap: 20px !important;
          }
          .ops-stats {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
          }
          .ops-stats div {
            border: 1px solid #ccc !important;
            background: transparent !important;
            color: black !important;
            padding: 8px !important;
          }
          .ops-stats h4 {
            color: black !important;
          }
          .print-manifest-root {
            gap: 24px !important;
          }
          .print-group-card {
            border: 1px solid #aaa !important;
            background: transparent !important;
            padding: 16px !important;
            box-shadow: none !important;
            color: black !important;
          }
          .print-group-title {
            color: black !important;
            border-bottom: 1.5px solid black !important;
          }
          thead tr {
            color: black !important;
            border-bottom: 2px solid black !important;
          }
          tbody tr {
            border-bottom: 1px solid #ddd !important;
            background: transparent !important;
            color: black !important;
          }
          td, th {
            padding: 8px !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Operations;
