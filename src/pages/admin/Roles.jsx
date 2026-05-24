import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useMockData } from '../../context/AppDataContext';
import Badge from '../../components/Badge';

export const Roles = () => {
  const { currentAdmin } = useMockData();
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchUsersAndAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch admin users
      const { data: adminsData, error: adminsError } = await supabase
        .from('admin_users')
        .select('*');

      if (adminsError) throw adminsError;
      setAdminUsers(adminsData || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndAdmins();
  }, []);

  const handlePromoteUser = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a user.');
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const userToPromote = users.find(u => u.id === selectedUserId);
      if (!userToPromote) throw new Error('User not found.');

      const { data, error: promoteError } = await supabase
        .from('admin_users')
        .upsert(
          { 
            auth_user_id: userToPromote.id, 
            name: userToPromote.name, 
            role: selectedRole 
          },
          { onConflict: 'auth_user_id' }
        )
        .select()
        .single();

      if (promoteError) throw promoteError;

      setSuccessMessage(`${userToPromote.name} has been assigned the role of ${selectedRole}.`);
      setSelectedUserId('');
      fetchUsersAndAdmins(); // Refresh data
    } catch (err) {
      console.error('Error promoting user:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemoteUser = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to remove ${adminName}'s admin privileges?`)) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: deleteError } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (deleteError) throw deleteError;

      setSuccessMessage(`${adminName} has been removed from admin roles.`);
      fetchUsersAndAdmins();
    } catch (err) {
      console.error('Error demoting user:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentAdmin || currentAdmin.role !== 'owner') {
    return <div style={{ color: 'var(--error)' }}>Unauthorized access. Owner privileges required.</div>;
  }

  // Filter out users who are already admins for the dropdown
  const adminAuthIds = adminUsers.map(a => a.auth_user_id);
  const eligibleUsers = users.filter(u => !adminAuthIds.includes(u.id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Roles & Team</h2>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '16px', borderRadius: 'var(--radius-md)', color: 'var(--error)', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '16px', borderRadius: 'var(--radius-md)', color: 'var(--success)', marginBottom: '24px' }}>
          ✅ {successMessage}
        </div>
      )}

      {/* Add Admin Section */}
      <div className="admin-card" style={{ padding: '24px', background: 'var(--bg-surface-solid)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Add New Team Member</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>Select an existing customer from the system and grant them administrative privileges.</p>
        
        <form onSubmit={handlePromoteUser} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Select User</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="admin-input"
              style={{ width: '100%' }}
              disabled={loading || actionLoading}
            >
              <option value="">-- Choose a user --</option>
              {eligibleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email || u.phone})</option>
              ))}
            </select>
          </div>
          
          <div style={{ width: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>Role</label>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="admin-input"
              style={{ width: '100%' }}
              disabled={loading || actionLoading}
            >
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="admin-btn-primary"
            disabled={!selectedUserId || loading || actionLoading}
            style={{ padding: '12px 24px', height: '46px' }}
          >
            {actionLoading ? 'Saving...' : 'Grant Access'}
          </button>
        </form>
      </div>

      {/* Current Team Section */}
      <div className="admin-card" style={{ background: 'var(--bg-surface-solid)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Current Administrators</h3>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading team...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Added On</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map(admin => (
                  <tr key={admin.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {admin.name}
                      {currentAdmin.auth_user_id === admin.auth_user_id && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(You)</span>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge variant={admin.role === 'owner' ? 'accent' : admin.role === 'admin' ? 'primary' : 'success'}>
                        {admin.role}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {currentAdmin.auth_user_id !== admin.auth_user_id && (
                        <button 
                          onClick={() => handleDemoteUser(admin.id, admin.name)}
                          className="admin-btn-secondary"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '0.8rem', 
                            color: 'var(--error)', 
                            borderColor: 'rgba(239, 68, 68, 0.2)',
                            background: 'transparent'
                          }}
                          disabled={actionLoading}
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
