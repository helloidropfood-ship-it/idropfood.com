import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockData } from '../context/MockDataContext';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginCustomer, loginAdmin, adminUsers } = useMockData();
  const selectedPlanId = location.state?.selectedPlanId || '';

  // Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [floor, setFloor] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleCustomerLogin = (e) => {
    e.preventDefault();
    if (!name || !phone || !floor || !department) {
      setError('Please fill in all required fields.');
      return;
    }
    // Clean phone number format
    const cleanedPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid WhatsApp phone number.');
      return;
    }

    loginCustomer(cleanedPhone, name, floor, department, notes);
    
    // Redirect based on intent
    if (selectedPlanId) {
      navigate('/dashboard', { state: { checkoutPlanId: selectedPlanId } });
    } else {
      navigate('/dashboard');
    }
  };

  const handleAdminRoleSelection = (role) => {
    loginAdmin(role);
    navigate('/admin/overview');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at center, #0a0c10 0%, #030406 100%)',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '-0.02em'
          }}
        >
          iDrop<span style={{ color: 'var(--accent)' }}>Food</span>
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Your Shift. Your Meal Drop.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          width: '100%',
          maxWidth: '840px',
          alignItems: 'start'
        }}
      >
        {/* Customer Login Card */}
        <Card hoverable={false} className="animate-slide-up delay-100" title="Customer Shift Portal" subtitle="Enter your details to schedule and manage drops.">
          <form onSubmit={handleCustomerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  background: 'var(--error-glow)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  color: 'var(--error)'
                }}
              >
                ⚠️ {error}
              </div>
            )}
            
            <FormInput
              label="Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hammad Ali"
              required
            />
            
            <FormInput
              label="WhatsApp Number"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03001234567"
              helperText="Used for automated lobby drop notifications."
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormInput
                label="Office Floor"
                name="floor"
                type="select"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="Select Floor"
                options={[
                  { value: 'Ground Floor', label: 'Ground Floor' },
                  { value: '1st Floor', label: '1st Floor' },
                  { value: '2nd Floor', label: '2nd Floor' },
                  { value: '3rd Floor', label: '3rd Floor' },
                  { value: '4th Floor', label: '4th Floor' },
                  { value: '5th Floor', label: '5th Floor' },
                  { value: 'Mezzanine', label: 'Mezzanine' }
                ]}
                required
              />
              <FormInput
                label="Department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Operation QA"
                required
              />
            </div>

            <FormInput
              label="Specific Delivery Notes (Optional)"
              name="notes"
              type="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave at Lobby Desk A. Do not call, on night shift call."
              rows={2}
            />

            <Button type="submit" variant="accent" style={{ marginTop: '8px' }}>
              {selectedPlanId ? 'Continue to Checkout' : 'Enter Dashboard'}
            </Button>
          </form>
        </Card>

        {/* Sandbox Admin Login Card */}
        <Card
          hoverable={false}
          className="animate-slide-up delay-200"
          title="Sandbox Administration"
          subtitle="Testing Roles - Switch identity to test different workflow constraints."
          style={{ height: '100%' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Since database verification is mock, you can select one of the following roles to test the administrative workflows, payment approvals, kitchen manifests, and settings controls.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                onClick={() => handleAdminRoleSelection('owner')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Owner Role</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Full access to pricing plans, settings, and approvals.</p>
                </div>
                <Badge variant="accent">Owner</Badge>
              </div>

              <div
                onClick={() => handleAdminRoleSelection('admin')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Role</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Manage windows, menu dishes, and payment proofs.</p>
                </div>
                <Badge variant="primary">Admin</Badge>
              </div>

              <div
                onClick={() => handleAdminRoleSelection('operations')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--success)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Operations Role</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>View preparation lists, delivery rosters, and mark logs.</p>
                </div>
                <Badge variant="success">Ops</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
