import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMockData } from '../../context/MockDataContext';
import Badge from '../../components/Badge';

export const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAdmin, logoutAdmin, paymentProofs } = useMockData();

  // Redirect if not authenticated as admin
  useEffect(() => {
    if (!currentAdmin) {
      navigate('/auth');
    }
  }, [currentAdmin, navigate]);

  if (!currentAdmin) return null;

  const currentPath = location.pathname;
  const pendingApprovalsCount = paymentProofs.filter(p => p.status === 'pending').length;

  const menuItems = [
    { path: '/admin/overview', label: 'Overview Stats', icon: '📊', roles: ['owner', 'admin', 'operations'] },
    { path: '/admin/approvals', label: 'Payment Approvals', icon: '💰', badge: pendingApprovalsCount, roles: ['owner', 'admin'] },
    { path: '/admin/operations', label: 'Kitchen & Delivery Ops', icon: '📦', roles: ['owner', 'admin', 'operations'] },
    { path: '/admin/schedule', label: 'Drop Windows', icon: '📅', roles: ['owner', 'admin'] },
    { path: '/admin/menu', label: 'Menu Allocations', icon: '🍳', roles: ['owner', 'admin'] },
    { path: '/admin/plans', label: 'Package pricing', icon: '🏷️', roles: ['owner'] },
    { path: '/admin/settings', label: 'System Settings', icon: '⚙️', roles: ['owner', 'admin'] }
  ];

  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        className="admin-sidebar"
        style={{
          width: '280px',
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-surface-solid)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}
      >
        {/* Brand Header */}
        <div
          className="admin-sidebar-header"
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad-admin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <path d="M16 2C9.37 8.63 6 13.5 6 18C6 23.52 10.48 28 16 28C21.52 28 26 23.52 26 18C26 13.5 22.63 8.63 16 2ZM16 22C13.79 22 12 20.21 12 18C12 16.2 13.5 13.8 16 10.6C18.5 13.8 20 16.2 20 18C20 20.21 18.21 22 16 22Z" fill="url(#logo-grad-admin)" />
            </svg>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, lineHeight: '1.2' }}>
                iDrop<span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Admin</span><span style={{ color: 'var(--accent)' }}>.</span>
              </h3>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Shahrah-e-Faisal</span>
            </div>
          </div>
          <Badge variant={currentAdmin.role === 'owner' ? 'accent' : currentAdmin.role === 'admin' ? 'primary' : 'success'}>
            {currentAdmin.role}
          </Badge>
        </div>

        {/* Sidebar Nav */}
        <nav className="admin-sidebar-nav" style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {menuItems.map(item => {
            const hasPermission = item.roles.includes(currentAdmin.role);
            if (!hasPermission) return null;

            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge > 0 && (
                  <Badge variant="warning" outline pulse>{item.badge}</Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className="admin-sidebar-footer"
          style={{
            padding: '20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentAdmin.name}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Logged in as {currentAdmin.role}</span>
          </div>
          
          <button
            onClick={() => {
              logoutAdmin();
              navigate('/auth');
            }}
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            Leave Admin Panel
          </button>
        </div>
      </aside>

      {/* Page Body Container */}
      <main className="admin-main" style={{ flex: 1, padding: '40px', overflowY: 'auto', maxHeight: '100vh' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
