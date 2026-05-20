import React from 'react';
import { useMockData } from '../../context/MockDataContext';
import Card from '../../components/Card';
import StatusPill from '../../components/StatusPill';

export const Overview = () => {
  const { users, purchases, paymentProofs, bookings, dropWindows } = useMockData();

  // Metrics calculations
  const totalUsers = users.length;
  const pendingApprovals = paymentProofs.filter(p => p.status === 'pending').length;
  
  const totalActiveCredits = purchases
    .filter(p => p.payment_status === 'approved')
    .reduce((acc, p) => acc + p.remaining_credits, 0);

  const totalBookings = bookings.filter(b => ['scheduled', 'locked', 'delivered'].includes(b.status)).length;
  
  // Calculate today's prep meals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => {
    const win = dropWindows.find(w => w.id === b.drop_window_id);
    return win && win.date === todayStr && ['scheduled', 'locked', 'delivered'].includes(b.status);
  });

  // Recent bookings list
  const recentBookings = [...bookings]
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Recent transactions list
  const recentPurchases = [...purchases]
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 className="admin-page-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
          Overview Dashboard
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Welcome back. Here is the operational summary for the Shahrah-e-Faisal MVP launch.
        </p>
      </div>

      {/* Analytics Stats Grid */}
      <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-card animate-slide-up delay-100" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Registered Users</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {totalUsers}
          </h3>
        </div>

        <div className="glass-card animate-slide-up delay-200" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Pending Approvals</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: pendingApprovals > 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
            {pendingApprovals}
          </h3>
        </div>

        <div className="glass-card animate-slide-up delay-300" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Active Credits</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--primary)' }}>
            {totalActiveCredits}
          </h3>
        </div>

        <div className="glass-card animate-slide-up delay-400" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Prepping Today</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--success)' }}>
            {todayBookings.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Meals</span>
          </h3>
        </div>
      </div>

      {/* Grid columns: Recent Bookings & Purchases */}
      <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* Recent Purchases */}
        <Card title="Latest Transactions Queue" subtitle="Verify and approve payments for credits load." hoverable={false} className="animate-slide-up delay-200">
          {recentPurchases.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
              No purchases logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentPurchases.map(pur => {
                const user = users.find(u => u.id === pur.user_id);
                return (
                  <div
                    key={pur.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.01)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{user ? user.name : 'Unknown User'}</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {pur.total_credits} credits • Rs. {pur.total_credits === 1 ? '450' : pur.total_credits === 3 ? '1300' : pur.total_credits === 8 ? '3200' : '6000'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        {new Date(pur.created_at).toLocaleDateString()}
                      </span>
                      <StatusPill status={pur.payment_status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Bookings Activity */}
        <Card title="Recent Booking Requests" subtitle="Newly scheduled drop dates by office agents." hoverable={false} className="animate-slide-up delay-300">
          {recentBookings.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
              No bookings logged yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentBookings.map(book => {
                const user = users.find(u => u.id === book.user_id);
                const win = dropWindows.find(w => w.id === book.drop_window_id);
                return (
                  <div
                    key={book.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.01)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{user ? user.name : 'Unknown User'}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}> ({user?.floor})</span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {win ? `${win.date} • ${win.window_name}` : 'Drop Window'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        {new Date(book.created_at).toLocaleDateString()}
                      </span>
                      <StatusPill status={book.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default Overview;
